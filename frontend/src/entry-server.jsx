// Server entry used only at build time (scripts/prerender.mjs) to turn every public page into
// real HTML, so search engines and link previews see the full content without running JavaScript.
import { StrictMode } from 'react';
import { renderToPipeableStream } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import { Writable } from 'node:stream';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { seoFor, PRERENDER_PATHS, REDIRECTS, SITE_URL_TOKEN, sitemapPriority, lastModFor, SERVER_RENDERED_PATHS } from './seo/meta';
import { headTags } from './seo/head';
import { PreloadProvider } from './lib/preload';

export { seoFor, PRERENDER_PATHS, REDIRECTS, SITE_URL_TOKEN, sitemapPriority, lastModFor, SERVER_RENDERED_PATHS, headTags };

export const render = (url, data = {}) => new Promise((resolve, reject) => {
  let html = '';
  const sink = new Writable({
    write(chunk, _enc, cb) { html += chunk.toString(); cb(); },
    final(cb) { resolve(html); cb(); },
  });
  const { pipe } = renderToPipeableStream(
    <StrictMode>
      <PreloadProvider data={data}>
      <StaticRouter location={url}>
        <AuthProvider>
          <CartProvider>
            <App />
          </CartProvider>
        </AuthProvider>
      </StaticRouter>
      </PreloadProvider>
    </StrictMode>,
    {
      onAllReady() { pipe(sink); },
      onShellError: reject,
      onError(err) { reject(err); },
    },
  );
});
