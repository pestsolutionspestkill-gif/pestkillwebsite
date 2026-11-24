import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { seoFor, SITE_URL_TOKEN } from './meta';
import { headTags } from './head';

// The real site address. The server writes it into <meta name="pk-site">; during local
// development the current origin is used.
const siteUrl = () => document.querySelector('meta[name="pk-site"]')?.content || window.location.origin;

const replaceHead = (seo) => {
  const html = headTags(seo).split(SITE_URL_TOKEN).join(siteUrl());
  const tpl = document.createElement('template');
  tpl.innerHTML = html;
  document.head.querySelectorAll('[data-pk-seo]').forEach((el) => el.remove());
  tpl.content.querySelectorAll('title').forEach((el) => { document.title = el.textContent; el.remove(); });
  document.head.append(tpl.content);
};

/** Lets a page refine its own title/description once its data has loaded (e.g. a product). */
export const refineHead = ({ title, description }) => {
  if (title) document.title = title;
  if (description) {
    document.head.querySelectorAll('meta[name="description"], meta[property="og:description"], meta[name="twitter:description"]')
      .forEach((m) => m.setAttribute('content', description));
  }
  if (title) {
    document.head.querySelectorAll('meta[property="og:title"], meta[name="twitter:title"]').forEach((m) => m.setAttribute('content', title));
  }
};

// Keeps <head> in step with the current page on every client-side navigation.
const RouteSeo = () => {
  const { pathname } = useLocation();
  const first = useRef(true);
  useEffect(() => {
    const seo = seoFor(pathname);
    // On the first load the server has already sent the correct head (including
    // database details such as product names), so leave it untouched.
    const served = document.querySelector('meta[name="pk-seo-path"]')?.content;
    if (first.current && served === seo.path) { first.current = false; return; }
    first.current = false;
    replaceHead(seo);
  }, [pathname]);
  return null;
};

export default RouteSeo;
