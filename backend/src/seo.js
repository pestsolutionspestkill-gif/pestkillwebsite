// Serves the built website with search-friendly behaviour:
//  • pre-rendered HTML for public pages, with the real site address filled in,
//  • a proper 404 status for unknown pages and 301s for moved URLs,
//  • /sitemap.xml (pages + shop products) and /robots.txt,
//  • product titles, descriptions and Product structured data from the database.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import express from 'express';
import db from './db.js';

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
  const productHead = async (slug, meta, site) => {
    const p = await db.get('SELECT id, slug, name, brand, pack_size, technical, description, mrp, mrp_verified, offer_price, offer_ends, stock FROM products WHERE slug = ? AND is_active = 1', slug.slice(0, 100));
    if (!p) return null;
    const name = [p.brand, p.name, p.pack_size].filter(Boolean).join(' ');
    const description = (p.description || `${name}${p.technical ? ` (${p.technical})` : ''}. Professional pest control product for licensed pest control operators, available from PestKill, Jaipur.`).slice(0, 158);
    const image = `${site}/api/products/${p.id}/image`;
    const product = {
      '@context': 'https://schema.org', '@type': 'Product', name, description, image, sku: p.slug,
      ...(p.brand ? { brand: { '@type': 'Brand', name: p.brand } } : {}),
    };
    // Prices go into structured data only once the MRP has been checked against the pack.
    if (p.mrp != null && p.mrp_verified) {
      product.offers = {
        '@type': 'Offer', priceCurrency: 'INR', price: p.mrp, url: `${site}/shop/${p.slug}`,
        availability: p.stock === 0 ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
        seller: { '@type': 'Organization', name: 'PestKill Pest Solutions' },
      };
    }
    return { ...meta, title: `${name} | PCO Shop | PestKill`, description, image, schema: [product] };
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
      if (meta.dynamic === 'product') {
        const m = /^\/shop\/([a-z0-9-]+)$/.exec(p);
        meta = (m && await productHead(m[1], meta, site))
          || { ...meta, title: 'Product not found | PestKill', noindex: true, status: 404, schema: [] };
      }
      const html = shell
        .replace(/<title>[\s\S]*?<\/title>/, '')
        .replace('<!--pk-head-->', seo.headTags(meta));
      res.status(meta.status || 200).send(finish(html, site));
    } catch (err) { next(err); }
  });
  return true;
};
