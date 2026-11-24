// Turns page metadata (from seoFor) into <head> tags. Used by the pre-renderer and the server.
// Every tag carries data-pk-seo so the browser can swap them on navigation.
import { SITE_NAME, SITE_URL_TOKEN } from './meta';

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// JSON inside <script> must not be able to close the tag.
export const jsonLd = (obj) => JSON.stringify(obj).replace(/</g, '\\u003c');

const absUrl = (u) => (/^https?:\/\//.test(u) ? u : `${SITE_URL_TOKEN}${u}`);

export const headTags = (seo) => {
  const url = `${SITE_URL_TOKEN}${seo.path === '/' ? '/' : seo.path}`;
  const image = absUrl(seo.image || '/images/technician.jpg');
  const t = [
    `<title>${esc(seo.title)}</title>`,
    `<meta name="description" content="${esc(seo.description)}" data-pk-seo />`,
    `<meta name="robots" content="${seo.noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large, max-snippet:-1'}" data-pk-seo />`,
    `<meta name="pk-seo-path" content="${esc(seo.path)}" data-pk-seo />`,
  ];
  if (!seo.noindex) {
    t.push(
      `<link rel="canonical" href="${esc(url)}" data-pk-seo />`,
      `<link rel="alternate" hreflang="en-IN" href="${esc(url)}" data-pk-seo />`,
      `<link rel="alternate" hreflang="x-default" href="${esc(url)}" data-pk-seo />`,
    );
  }
  t.push(
    `<meta property="og:type" content="${esc(seo.type || 'website')}" data-pk-seo />`,
    `<meta property="og:site_name" content="${esc(SITE_NAME)}" data-pk-seo />`,
    `<meta property="og:locale" content="en_IN" data-pk-seo />`,
    `<meta property="og:title" content="${esc(seo.title)}" data-pk-seo />`,
    `<meta property="og:description" content="${esc(seo.description)}" data-pk-seo />`,
    `<meta property="og:url" content="${esc(url)}" data-pk-seo />`,
    `<meta property="og:image" content="${esc(image)}" data-pk-seo />`,
    `<meta name="twitter:card" content="summary_large_image" data-pk-seo />`,
    `<meta name="twitter:title" content="${esc(seo.title)}" data-pk-seo />`,
    `<meta name="twitter:description" content="${esc(seo.description)}" data-pk-seo />`,
    `<meta name="twitter:image" content="${esc(image)}" data-pk-seo />`,
  );
  for (const s of seo.schema || []) t.push(`<script type="application/ld+json" data-pk-seo>${jsonLd(s)}</script>`);
  return t.join('\n    ');
};
