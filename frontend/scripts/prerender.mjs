// Pre-renders every public page to static HTML after `vite build`.
//   dist/index.html            → home page (pre-rendered)
//   dist/<path>/index.html     → every other path in PRERENDER_PATHS
//   dist/_shell.html           → empty app shell for pages that are not pre-rendered
// The server (backend/src/seo.js) fills in the site address and serves these files.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const ssrEntry = path.join(root, 'dist-ssr', 'entry-server.js');

const { render, seoFor, headTags, PRERENDER_PATHS } = await import(pathToFileURL(ssrEntry).href);

const template = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
if (!template.includes('<!--pk-head-->') || !template.includes('<div id="root"></div>')) {
  throw new Error('index.html is missing the <!--pk-head--> marker or the empty #root element.');
}

const fill = (seo, body = '') => template
  .replace(/<title>[\s\S]*?<\/title>/, '')
  .replace('<!--pk-head-->', headTags(seo))
  .replace('<div id="root"></div>', `<div id="root">${body}</div>`);

// Empty shell: the server adds the right head for each request.
fs.writeFileSync(path.join(dist, '_shell.html'), template);

let ok = 0;
const failed = [];
for (const route of PRERENDER_PATHS) {
  const seo = seoFor(route);
  if (seo.status !== 200 || seo.noindex || seo.dynamic) continue;
  try {
    const body = await render(route);
    const file = route === '/' ? path.join(dist, 'index.html') : path.join(dist, route.slice(1), 'index.html');
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, fill(seo, body));
    ok += 1;
  } catch (err) {
    failed.push(`${route}: ${err.message}`);
  }
}

// Paths list for the server (sitemap and "is this page pre-rendered?").
fs.writeFileSync(path.join(dist, 'prerendered.json'), JSON.stringify({ builtAt: new Date().toISOString(), paths: PRERENDER_PATHS }, null, 2));

console.log(`Pre-rendered ${ok} pages.`);
if (failed.length) {
  console.error(`Could not pre-render ${failed.length} page(s); they will load as a normal app page:\n  ${failed.join('\n  ')}`);
}
