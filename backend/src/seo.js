// Serves the built website with search-friendly behaviour:
//  • pre-rendered HTML for public pages, with the real site address filled in,
//  • a proper 404 status for unknown pages and 301s for moved URLs,
//  • /sitemap.xml (pages + shop products) and /robots.txt,
//  • product and shop pages rendered on request with live data (full content for search engines),
//    with titles, descriptions and Product structured data from the database.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import express from 'express';
import db from './db.js';
import { listProducts, productDetail } from './routes/productRoutes.js';

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const xmlEsc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const LOCAL = /^(localhost|127\.0\.0\.1|\[::1\])$/;

// SITE_URL (e.g. https://www.pestkill.in) is the one address search engines should index.
const configuredSite = () => (process.env.SITE_URL || '').trim().replace(/\/+$/, '');
const siteUrlFor = (req) => configuredSite() || `${req.protocol}://${req.get('host')}`;

export const mountWebsite = async (app, distDir) => {
  const shellFile = path.join(distDir, '_shell.html');
  const indexFile = path.join(distDir, 'index.html');
  if (!fs.existsSync(indexFile)) return false;

  // Page metadata comes from the frontend's server bundle so both sides always agree.
  let seo = null;
  const ssrEntry = path.resolve(distDir, '../dist-ssr/entry-server.js');
  if (fs.existsSync(ssrEntry)) {
    try { seo = await import(pathToFileURL(ssrEntry).href); } catch (err) { console.error('SEO bundle could not be loaded:', err.message); }
  }
  const shell = fs.existsSync(shellFile) ? fs.readFileSync(shellFile, 'utf8') : fs.readFileSync(indexFile, 'utf8');
  const prerendered = new Set(seo?.PRERENDER_PATHS || []);
  let builtAt = new Date().toISOString().slice(0, 10);
  try { builtAt = JSON.parse(fs.readFileSync(path.join(distDir, 'prerendered.json'), 'utf8')).builtAt.slice(0, 10); } catch { /* older build */ }

  // Content-Security-Policy for every web page. Inline scripts are allowed only by the hash of the
  // exact scripts in the built page (the intro animation), so injected scripts cannot run.
  const inlineHashes = [...shell.matchAll(/<script(?![^>]*\bsrc=)(?![^>]*\btype="application\/(?:ld\+)?json")[^>]*>([\s\S]*?)<\/script>/g)]
    .map((m) => `'sha256-${crypto.createHash('sha256').update(m[1]).digest('base64')}'`);
  const csp = [
    "default-src 'self'",
    `script-src 'self' ${inlineHashes.join(' ')}`.trim(),
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob:",
    "connect-src 'self'",
    'frame-src https://www.google.com https://maps.google.com',
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(process.env.NODE_ENV === 'production' || process.env.RENDER ? ['upgrade-insecure-requests'] : []),
  ].join('; ');
  app.use((req, res, next) => {
    if (!req.path.startsWith('/api/')) res.set('Content-Security-Policy', csp);
    next();
  });

  const token = seo?.SITE_URL_TOKEN || '__PK_SITE_URL__';
  const verification = () => [
    process.env.GOOGLE_SITE_VERIFICATION && `<meta name="google-site-verification" content="${esc(process.env.GOOGLE_SITE_VERIFICATION)}" />`,
    process.env.BING_SITE_VERIFICATION && `<meta name="msvalidate.01" content="${esc(process.env.BING_SITE_VERIFICATION)}" />`,
  ].filter(Boolean).join('\n    ');
  const finish = (html, site) => html
    .split(token).join(site)
    .replace('</head>', `    <meta name="pk-site" content="${esc(site)}" />\n    ${verification()}\n  </head>`);

  // Pre-rendered files are read once per site address and kept in memory.
  const cache = new Map();
  const readPage = (file, site) => {
    const key = `${site}|${file}`;
    if (!cache.has(key)) cache.set(key, finish(fs.readFileSync(file, 'utf8'), site));
    return cache.get(key);
  };

  /* ---------- robots.txt and sitemap.xml ---------- */
  app.get('/robots.txt', (req, res) => {
    const site = siteUrlFor(req);
    res.type('text/plain').set('Cache-Control', 'public, max-age=3600').send([
      'User-agent: *',
      'Allow: /',
      'Disallow: /admin', 'Disallow: /dashboard', 'Disallow: /print/', 'Disallow: /api/',
      'Disallow: /cart', 'Disallow: /login', 'Disallow: /register',
      '',
      `Sitemap: ${site}/sitemap.xml`,
      '',
    ].join('\n'));
  });

  app.get('/sitemap.xml', async (req, res, next) => {
    try {
      const site = siteUrlFor(req);
      const urls = [...prerendered].map((p) => ({
        loc: `${site}${p === '/' ? '/' : p}`,
        lastmod: seo?.lastModFor?.(p) || builtAt,
        priority: seo?.sitemapPriority?.(p) || '0.6',
      }));
      for (const sp of seo?.SERVER_RENDERED_PATHS || []) urls.push({ loc: `${site}${sp}`, lastmod: builtAt, priority: seo.sitemapPriority(sp) });
      const products = await db.all("SELECT slug, updated_at FROM products WHERE is_active = 1 AND slug IS NOT NULL AND slug <> '' ORDER BY id");
      for (const p of products) {
        urls.push({ loc: `${site}/shop/${p.slug}`, lastmod: p.updated_at ? new Date(p.updated_at).toISOString().slice(0, 10) : builtAt, priority: '0.5' });
      }
      const body = urls.map((u) => `  <url><loc>${xmlEsc(u.loc)}</loc><lastmod>${u.lastmod}</lastmod><priority>${u.priority}</priority></url>`).join('\n');
      res.type('application/xml').set('Cache-Control', 'public, max-age=3600')
        .send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`);
    } catch (err) { next(err); }
  });

  /* ---------- Canonical host, trailing slashes and moved pages ---------- */
  app.use((req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    const site = configuredSite();
    if (site) {
      // One address only: send other hosts (e.g. *.onrender.com, or the bare domain) to SITE_URL.
      const want = new URL(site);
      if (req.hostname !== want.hostname && !LOCAL.test(req.hostname)) {
        return res.redirect(301, `${site}${req.originalUrl}`);
      }
    }
    const [p, q = ''] = req.originalUrl.split(/\?(.*)/s);
    const query = q ? `?${q}` : '';
    // Trailing slash and moved pages resolve in a single 301.
    const clean = p.length > 1 ? p.replace(/\/+$/, '') || '/' : p;
    const target = seo?.REDIRECTS?.[clean] || clean;
    if (target !== p) return res.redirect(301, `${target}${query}`);
    next();
  });

  /* ---------- Static assets ---------- */
  app.use(express.static(distDir, {
    index: false,
    redirect: false,
    setHeaders: (res, file) => {
      if (file.endsWith('.html')) res.set('Cache-Control', 'no-cache');
      else if (file.includes(`${path.sep}assets${path.sep}`)) res.set('Cache-Control', 'public, max-age=31536000, immutable'); // hashed build files
      else res.set('Cache-Control', 'public, max-age=604800');
    },
  }));

  /* ---------- Pages ---------- */
  // Product page head: "Brand Name Pack Price" titles and Product structured data.
  const productHead = async (data, meta, site) => {
    const extra = await db.get('SELECT mrp_verified, stock FROM products WHERE id = ?', data.id);
    const name = [data.brand, data.name, data.pack_size].filter(Boolean).join(' ');
    const price = data.offer?.price ?? data.mrp;
    const description = `${name}${data.technical ? ` (${data.technical})` : ''}${price != null ? `: MRP ₹${Number(data.mrp).toLocaleString('en-IN')}` : ''}. Uses, safety, dose and FAQs in Hinglish. Genuine sealed packs for licensed PCOs, dispatched from Jaipur.`.slice(0, 160);
    const image = data.image_url ? `${site}${data.image_url}` : `${site}/images/brand/pestkill-emblem.png`;
    const product = {
      '@context': 'https://schema.org', '@type': 'Product', name, description, image, sku: data.slug,
      ...(data.brand ? { brand: { '@type': 'Brand', name: data.brand } } : {}),
      ...(data.category ? { category: data.category } : {}),
    };
    // Prices go into structured data only once the MRP has been checked against the pack.
    if (data.mrp != null && extra?.mrp_verified) {
      product.offers = {
        '@type': 'Offer', priceCurrency: 'INR', price: price, url: `${site}/shop/${data.slug}`,
        availability: extra.stock === 0 ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
        seller: { '@type': 'Organization', name: 'PestKill Pest Solutions' },
      };
    }
    const crumbs = {
      '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: [['Home', '/'], ['PCO shop', '/shop'], [data.brand, `/shop/brand/${String(data.brand).toLowerCase()}`], [name, `/shop/${data.slug}`]]
        .map(([n, u], i) => ({ '@type': 'ListItem', position: i + 1, name: n, item: `${site}${u}` })),
    };
    const title = `${name} Price & Uses | PestKill`;
    return { ...meta, title: title.length > 65 ? `${name} Price | PestKill` : title, description, image, schema: [product, crumbs] };
  };

  // Server-rendered shop pages, cached briefly so repeated visits are fast.
  const TTL = 10 * 60 * 1000;
  const rendered = new Map();
  const jsonForScript = (obj) => JSON.stringify(obj).replace(/</g, '\\u003c');
  const renderDynamic = async (p, meta, site) => {
    const hit = rendered.get(p);
    if (hit && Date.now() - hit.at < TTL) return hit;
    let data;
    if (meta.dynamic === 'product') {
      data = await productDetail(p.slice('/shop/'.length));
      if (!data) return null;
      meta = await productHead(data, meta, site);
    } else {
      const [, qs = ''] = meta.apiPath.split('?');
      data = await listProducts(Object.fromEntries(new URLSearchParams(qs)));
    }
    const preload = { [meta.apiPath]: data };
    let body = '';
    try { body = await seo.render(p, preload); } catch (err) { console.error(`Could not render ${p}:`, err.message); }
    const html = shell
      .replace(/<title>[\s\S]*?<\/title>/, '')
      .replace('<!--pk-head-->', `${seo.headTags(meta)}\n    <script type="application/json" id="pk-data">${jsonForScript(preload)}</script>`)
      .replace('<div id="root"></div>', `<div id="root">${body}</div>`);
    const out = { at: Date.now(), html, status: 200 };
    if (rendered.size > 500) rendered.clear();
    rendered.set(p, out);
    return out;
  };

  app.get('*', async (req, res, next) => {
    try {
      const site = siteUrlFor(req);
      const p = req.path;
      res.set('Cache-Control', 'no-cache');
      if (!seo) return res.send(finish(shell, site));

      if (prerendered.has(p)) {
        const file = p === '/' ? indexFile : path.join(distDir, p.slice(1), 'index.html');
        if (fs.existsSync(file)) return res.send(readPage(file, site));
      }

      let meta = seo.seoFor(p);
      if (meta.dynamic) {
        const page = await renderDynamic(p, meta, site);
        if (page) return res.status(page.status).send(finish(page.html, site));
        meta = { ...meta, title: 'Product not found | PestKill', noindex: true, status: 404, schema: [] };
      }
      const html = shell
        .replace(/<title>[\s\S]*?<\/title>/, '')
        .replace('<!--pk-head-->', seo.headTags(meta));
      res.status(meta.status || 200).send(finish(html, site));
    } catch (err) { next(err); }
  });
  return true;
};
