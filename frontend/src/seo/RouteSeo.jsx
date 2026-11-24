import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

// The real site address. The server writes it into <meta name="pk-site">; during local
// development the current origin is used.
const siteUrl = () => document.querySelector('meta[name="pk-site"]')?.content || window.location.origin;

// The metadata module is loaded on demand: the first page already has its head from the server.
const loadSeo = () => Promise.all([import('./meta'), import('./head')]);

// The page's own refined title/description (see refineHead), kept if the generic head loads later.
let refined = null;

const replaceHead = (seo, headTags, token) => {
  const html = headTags(seo).split(token).join(siteUrl());
  const tpl = document.createElement('template');
  tpl.innerHTML = html;
  document.head.querySelectorAll('[data-pk-seo]').forEach((el) => el.remove());
  tpl.content.querySelectorAll('title').forEach((el) => { document.title = el.textContent; el.remove(); });
  document.head.append(tpl.content);
  if (refined?.path === window.location.pathname) applyRefined(refined);
};

const applyRefined = ({ title, description }) => {
  if (title) document.title = title;
  if (description) {
    document.head.querySelectorAll('meta[name="description"], meta[property="og:description"], meta[name="twitter:description"]')
      .forEach((m) => m.setAttribute('content', description));
  }
  if (title) {
    document.head.querySelectorAll('meta[property="og:title"], meta[name="twitter:title"]').forEach((m) => m.setAttribute('content', title));
  }
};

/** Lets a page refine its own title/description once its data has loaded (e.g. a product). */
export const refineHead = (values) => {
  refined = { ...values, path: window.location.pathname };
  applyRefined(values);
};

// Keeps <head> in step with the current page on every client-side navigation.
const RouteSeo = () => {
  const { pathname } = useLocation();
  const first = useRef(true);
  useEffect(() => {
    // On the first load the server has already sent the correct head (including
    // database details such as product names), so leave it untouched.
    const served = document.querySelector('meta[name="pk-seo-path"]')?.content;
    const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : '/';
    if (first.current && served === path) { first.current = false; return undefined; }
    first.current = false;
    let live = true;
    loadSeo().then(([meta, head]) => {
      if (live) replaceHead(meta.seoFor(pathname), head.headTags, meta.SITE_URL_TOKEN);
    }).catch(() => { /* metadata is an enhancement; the page itself still works */ });
    return () => { live = false; };
  }, [pathname]);
  return null;
};

export default RouteSeo;
