// End-to-end tests: the production build served by the real API server (in-memory database),
// driven in Microsoft Edge / Chrome through playwright-core.
//   npm run build && npm run test:e2e
// Set E2E_BROWSER_PATH to use another Chromium-based browser.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const here = path.dirname(fileURLToPath(import.meta.url));
const backendDir = path.resolve(here, '../../backend');
const PORT = 6100 + Math.floor(Math.random() * 400);
const BASE = `http://127.0.0.1:${PORT}`;
const OWNER = { email: 'owner@e2e.local', password: 'OwnerPass123' };
const axeSource = fs.readFileSync(path.resolve(here, '../node_modules/axe-core/axe.min.js'), 'utf8');

let server;
let browser;
let log = '';

before(async () => {
  if (!fs.existsSync(path.resolve(here, '../dist/_shell.html'))) throw new Error('Run "npm run build" first.');
  server = spawn(process.execPath, ['src/server.js'], {
    cwd: backendDir,
    env: { ...process.env, PORT: String(PORT), PGLITE_DIR: 'memory://', DATABASE_URL: '', NODE_ENV: 'test', RATE_LIMITS: 'off', SITE_URL: '',
      JWT_SECRET: 'e'.repeat(40), OWNER_NAME: 'E2E Owner', OWNER_EMAIL: OWNER.email, OWNER_PASSWORD: OWNER.password,
      GMAIL_USER: '', GMAIL_APP_PASSWORD: '', SMTP_USER: '', SMTP_PASS: '', EMAIL_OTP: 'on', ANTHROPIC_API_KEY: '', ANTHROPIC_AUTH_TOKEN: '', ANTHROPIC_BASE_URL: '', GEMINI_API_KEY: '', AI_PROVIDER: '' },
  });
  server.stdout.on('data', (d) => { log += d; });
  server.stderr.on('data', (d) => { log += d; });
  let up = false;
  for (let i = 0; i < 120 && !up; i += 1) {
    try { up = (await fetch(`${BASE}/api/health`)).ok; } catch { /* starting */ }
    if (!up) await new Promise((r) => setTimeout(r, 500));
  }
  if (!up) throw new Error(`API server did not start:\n${log}`);
  // Fixture: the owner has checked the Premise SC packs against the printed MRP (unchecked MRPs are
  // "price on request" for customers). Used by the shop, cart and calculator journeys.
  const owner = (await (await fetch(`${BASE}/api/users/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(OWNER) })).json()).token;
  const all = (await (await fetch(`${BASE}/api/products?q=Premise`, { headers: { Authorization: `Bearer ${owner}` } })).json()).products;
  const ids = all.filter((p) => p.brand === 'Envu' && p.name === 'Premise SC').map((p) => ({ id: p.id, mrpVerified: true }));
  const set = await fetch(`${BASE}/api/products/bulk`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${owner}` }, body: JSON.stringify({ updates: ids }) });
  if (!set.ok) throw new Error(`Could not prepare fixtures: ${await set.text()}`);
  browser = await chromium.launch(process.env.E2E_BROWSER_PATH ? { executablePath: process.env.E2E_BROWSER_PATH } : { channel: 'msedge' });
});
after(async () => { await browser?.close(); server?.kill(); });

/** A fresh browser tab that records console errors, page errors and CSP violations. */
const openPage = async ({ mobile = false, bypassCSP = false, reducedMotion = 'no-preference' } = {}) => {
  const ctx = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1280, height: 900 }, isMobile: mobile, hasTouch: mobile, bypassCSP, reducedMotion });
  await ctx.addInitScript(() => {
    try { sessionStorage.setItem('pk_intro', '1'); } catch { /* ignore */ }
    window.__csp = [];
    document.addEventListener('securitypolicyviolation', (e) => window.__csp.push(`${e.violatedDirective} ${e.blockedURI}`));
  });
  const page = await ctx.newPage();
  const problems = [];
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') problems.push(`console: ${m.text()}`); });
  page.problems = async () => [...problems, ...(await page.evaluate(() => window.__csp || []).catch(() => [])).map((v) => `csp: ${v}`)];
  return page;
};
const api = async (method, p, body, token) => {
  const r = await fetch(`${BASE}/api${p}`, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
  return { s: r.status, j: await r.json().catch(() => null) };
};

const PUBLIC_PAGES = ['/', '/pest-control/jaipur', '/termite-control', '/services', '/book', '/shop', '/shop/pest/termite',
  '/shop/envu-premise-sc-1-l', '/pest-identifier', '/contact', '/about', '/blog', '/locations', '/login', '/register', '/pco-account', '/technical-standards',
  '/privacy-policy', '/terms', '/shipping-delivery', '/replacement-policy', '/disclaimer', '/pestkill-ai'];

test('public pages load with content, no console errors and no CSP violations', async () => {
  const page = await openPage();
  for (const p of PUBLIC_PAGES) {
    const res = await page.goto(BASE + p, { waitUntil: 'load' });
    assert.equal(res.status(), 200, p);
    await page.waitForSelector('h1', { timeout: 15000 });
    assert.ok((await page.textContent('h1')).trim().length > 2, `${p} has a heading`);
    await page.waitForTimeout(400);
  }
  assert.deepEqual(await page.problems(), []);
  await page.context().close();
});

test('accessibility: no serious or critical axe violations on key pages', async () => {
  // Motion off, so axe checks final colours rather than mid-animation states.
  const page = await openPage({ bypassCSP: true, reducedMotion: 'reduce' });
  const found = [];
  for (const p of ['/', '/pest-control/jaipur', '/book', '/shop', '/shop/envu-premise-sc-1-l', '/login', '/register', '/contact', '/shop/dose-calculator', '/knowledge', '/knowledge/aedes-mosquito?lang=hi', '/shop/library']) {
    await page.goto(BASE + p, { waitUntil: 'load' });
    await page.waitForSelector('h1');
    await page.waitForTimeout(900);
    await page.evaluate(axeSource);
    const v = await page.evaluate(async () => (await window.axe.run(document, { runOnly: ['wcag2a', 'wcag2aa'] })).violations
      .filter((x) => ['serious', 'critical'].includes(x.impact))
      .map((x) => `${x.id} (${x.nodes.length}): ${x.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`));
    for (const x of v) found.push(`${p} → ${x}`);
  }
  assert.deepEqual(found, []);
  await page.context().close();
});

test('booking: a visitor books a service and the booking is saved', async () => {
  const page = await openPage();
  await page.goto(`${BASE}/book`);
  await page.click('.book-option:has-text("Cockroach")');
  await page.click('button:has-text("Continue")');
  await page.locator('button:text-is("Home")').first().click();
  await page.click('.book-size');
  await page.click('button:has-text("Continue")');
  await page.click('.book-date');
  await page.click('.book-slot');
  await page.click('button:has-text("Continue")');
  await page.fill('#b-name', 'Rohit Sharma');
  await page.fill('#b-phone', '9829061547');
  await page.fill('#b-address', '12 Vaishali Nagar, Jaipur');
  // PIN code is required; the service-area note never promises a date.
  await page.click('button:has-text("Continue")');
  assert.match(await page.textContent('#b-pin ~ .field-error'), /PIN code/);
  await page.fill('#b-pin', '302021');
  assert.match(await page.textContent('.book-area'), /Jaipur: served directly from our office/);
  await page.selectOption('#b-state', 'Maharashtra');
  await page.fill('#b-city', 'Pune');
  await page.fill('#b-pin', '411001');
  assert.match(await page.textContent('.book-area'), /outstation visit, subject to confirmation[\s\S]*Nothing is booked until we confirm/);
  await page.selectOption('#b-state', 'Rajasthan');
  await page.fill('#b-city', 'Jaipur');
  await page.fill('#b-pin', '302021');
  await page.click('button:has-text("Continue")');
  assert.match(await page.textContent('.book-hint'), /confirmed only on that call/);
  await page.click('button:has-text("Send booking request")');
  await page.waitForSelector('text=Your request reference is');
  assert.match(await page.textContent('.book-done'), /not confirmed until that call/);
  const ref = (await page.textContent('strong:near(:text("request reference"))')).trim();
  const owner = (await api('POST', '/users/login', OWNER)).j.token;
  const leads = (await api('GET', `/leads?q=${encodeURIComponent(ref)}`, null, owner)).j;
  assert.equal(leads[0]?.name, 'Rohit Sharma', 'booking reached the database');
  assert.match(leads[0]?.address || '', /PIN 302021/);
  assert.deepEqual(await page.problems(), []);
  await page.context().close();
});

test('accounts: sign up with email code, sign out, wrong password, sign in, reset password', async () => {
  const page = await openPage();
  await page.goto(`${BASE}/register`);
  await page.fill('#name', 'Anjali Verma');
  await page.fill('#email', 'anjali.e2e@gmail.com');
  await page.fill('#phone', '9829074512');
  await page.fill('#password', 'Anjali#2026');
  await page.fill('#confirm', 'Anjali#2026');
  await page.click('form button[type="submit"]');
  const code = (await page.textContent('.otp-dev strong', { timeout: 15000 })).trim();
  await page.fill('.otp-input', code);
  await page.click('button[type="submit"]:has-text("Verify")');
  await page.waitForURL('**/dashboard**');
  await page.waitForSelector('text=Hello, Anjali');

  await page.click('.dash-logout');
  await page.goto(`${BASE}/login`);
  await page.fill('#email', 'anjali.e2e@gmail.com');
  await page.fill('#password', 'wrong-password');
  await page.click('form button[type="submit"]');
  await page.waitForSelector('.auth-error');
  assert.match(await page.textContent('.auth-error'), /Incorrect email or password/);

  await page.goto(`${BASE}/forgot-password`);
  await page.fill('#fp-email', 'anjali.e2e@gmail.com');
  await page.click('button:has-text("Send code")');
  await page.waitForFunction(() => /Development code: \d{6}/.test(document.querySelector('.auth-header p')?.textContent || ''));
  const note = await page.textContent('.auth-header p');
  const resetCode = /Development code: (\d{6})/.exec(note)?.[1];
  assert.ok(resetCode, 'reset code shown in test mode');
  await page.fill('#fp-otp', resetCode);
  await page.fill('#fp-pass', 'NewAnjali#2026');
  await page.click('button:has-text("Set new password")');
  await page.waitForURL('**/dashboard**');
  assert.equal((await api('POST', '/users/login', { email: 'anjali.e2e@gmail.com', password: 'Anjali#2026' })).s, 401, 'old password no longer works');
  assert.equal((await api('POST', '/users/login', { email: 'anjali.e2e@gmail.com', password: 'NewAnjali#2026' })).s, 200);
  assert.deepEqual((await page.problems()).filter((x) => !/401|Unauthorized/.test(x)), []);
  await page.context().close();
});

test('access control: customers cannot open the staff console', async () => {
  const signup = await api('POST', '/users/register/start', { name: 'Kavita Joshi', email: 'kavita.e2e@gmail.com', phone: '9829033781', password: 'Kavita#2026' });
  const { token } = (await api('POST', '/users/register', { name: 'Kavita Joshi', email: 'kavita.e2e@gmail.com', phone: '9829033781', password: 'Kavita#2026', otp: signup.j.devCode })).j;
  assert.equal((await api('GET', '/admin/users', null, token)).s, 403);
  const page = await openPage();
  await page.goto(`${BASE}/login`);
  await page.evaluate((t) => localStorage.setItem('pk_token', t), token);
  await page.goto(`${BASE}/admin`);
  await page.waitForURL('**/dashboard**');
  await page.context().close();
});

test('shop: filter by pest, open a product, add to cart', async () => {
  const page = await openPage();
  await page.goto(`${BASE}/shop`);
  await page.click('.shop-pests button:has-text("Termites")');
  await page.waitForSelector('.filter-pill:has-text("Termites")');
  await page.waitForFunction(() => document.querySelectorAll('.pgrid .pcard:not(.skeleton)').length > 3);
  await page.goto(`${BASE}/shop/envu-premise-sc-1-l`);
  assert.match(await page.textContent('h1'), /Premise SC/);
  await page.click('.pd-buy button:has-text("Add to cart")');
  await page.waitForSelector('.nav-cart-badge');
  await page.goto(`${BASE}/cart`);
  await page.waitForSelector('text=Premise SC');
  assert.deepEqual(await page.problems(), []);
  await page.context().close();
});

test('staff console: the owner signs in and opens warranty claims', async () => {
  const page = await openPage();
  await page.goto(`${BASE}/login`);
  await page.fill('#email', OWNER.email);
  await page.fill('#password', OWNER.password);
  await page.click('form button[type="submit"]');
  await page.waitForURL('**/admin**');
  await page.click('button:has-text("Warranty claims")');
  await page.waitForSelector('h1:has-text("Warranty claims")');
  assert.deepEqual(await page.problems(), []);
  await page.context().close();
});

test('unknown pages return 404 and old URLs redirect', async () => {
  const page = await openPage();
  const res = await page.goto(`${BASE}/this-page-does-not-exist`);
  assert.equal(res.status(), 404);
  await page.waitForSelector('text=Page not found');
  await page.goto(`${BASE}/jaipur`);
  assert.match(page.url(), /\/pest-control\/jaipur$/);
  await page.context().close();
});

test('mobile: the menu opens and links work', async () => {
  const page = await openPage({ mobile: true });
  await page.goto(`${BASE}/`);
  await page.click('.menu-btn');
  await page.click('.mobile-shop');
  await page.waitForURL('**/shop');
  assert.deepEqual(await page.problems(), []);
  await page.context().close();
});

test('mobile shop: no sideways scrolling, two-column grid, buy bar always visible', async () => {
  const page = await openPage({ mobile: true });
  for (const p of ['/shop', '/shop/pest/termite', '/shop/envu-premise-sc-1-l']) {
    await page.goto(BASE + p);
    await page.waitForSelector('h1');
    await page.waitForTimeout(800);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    assert.equal(overflow, 0, `${p} has no horizontal overflow`);
  }
  await page.goto(`${BASE}/shop`);
  await page.waitForSelector('.pgrid .pcard:not(.skeleton)');
  const cols = await page.evaluate(() => getComputedStyle(document.querySelector('.pgrid')).gridTemplateColumns.split(' ').length);
  assert.equal(cols, 2, 'two products per row on phones');
  await page.goto(`${BASE}/shop/envu-premise-sc-1-l`);
  await page.waitForSelector('.pd-buy');
  const bar = await page.evaluate(() => { const r = document.querySelector('.pd-buy').getBoundingClientRect(); return { bottom: Math.round(r.bottom), vh: innerHeight, pos: getComputedStyle(document.querySelector('.pd-buy')).position }; });
  assert.equal(bar.pos, 'fixed');
  const navTop = await page.evaluate(() => Math.round(document.querySelector('.bottom-nav').getBoundingClientRect().top));
  assert.ok(Math.abs(bar.bottom - navTop) <= 2, `buy bar sits just above the bottom navigation: ${JSON.stringify({ ...bar, navTop })}`);
  await page.click('.pd-buy button:has-text("Add to cart")');
  await page.waitForSelector('.nav-cart-badge');
  assert.deepEqual(await page.problems(), []);
  await page.context().close();
});

/* ------------------------------------------------------------------
   Directive user journeys. Label rates below are TEST FIXTURES, not real doses.
------------------------------------------------------------------ */
const ownerToken = async () => (await api('POST', '/users/login', OWNER)).j.token;
const pdfData = (t) => `data:application/pdf;base64,${Buffer.from(`%PDF-1.4\n% ${t}\n`).toString('base64')}`;

test('journey 1: termite slide → service → dosage calculator with a verified product', async () => {
  const O = await ownerToken();
  const prod = (await api('GET', '/products?q=Premise')).j.products.find((p) => p.pack_size === '1 L');
  const rec = (await api('POST', '/doses', { productId: prod.id, activity: 'termite_pre', method: 'Soil treatment (test fixture)', productPerLitre: 2, rateHorizontal: 5, rateVertical: 7.5, rateRunning: 7.5 }, O)).j;
  await api('POST', `/doses/${rec.id}/verify`, { sourceNote: 'E2E test fixture, not a real label', confirm: true }, O);

  const page = await openPage();
  await page.goto(`${BASE}/`);
  await page.click('.ps-dots button[aria-label="Termite Control"]');
  await page.click('.ps-slide.is-active .ps-cta');
  await page.waitForURL('**/termite-control');
  await page.goto(`${BASE}/shop/dose-calculator?activity=termite_pre`);
  await page.waitForSelector('button[aria-pressed="true"]:has-text("Verified label data (1)")');
  await page.fill('.dc-field:has-text("Building length") input', '10');
  await page.fill('.dc-field:has-text("Building width") input', '8');
  await page.fill('.dc-field:has-text("Trench width") input', '0.6');
  await page.fill('.dc-field:has-text("Trench depth") input', '1.2');
  assert.match(await page.textContent('.dc-derived'), /Plinth area\s*80/);
  await page.waitForSelector('.dc-result .dc-totals');
  const totals = await page.textContent('.dc-totals');
  assert.match(totals, /1,426\s*L/, 'diluted solution 1426 L');
  assert.match(totals, /2,852\s*ml/, 'product 2852 ml');
  assert.match(totals, /Packs of 1 L\s*3/, 'three 1 L packs');
  assert.match(totals, /₹13,890/, 'cost from the listed MRP');
  await page.click('.dc-units button:has-text("Imperial")');
  assert.match(await page.textContent('.dc-derived'), /sq ft/);
  await api('DELETE', `/doses/${rec.id}`, null, O);
  assert.deepEqual(await page.problems(), []);
  await page.context().close();
});

test('journey 2: brand drawer → Syngenta → product → technical documents → download SDS', async () => {
  const O = await ownerToken();
  const list = (await api('GET', '/products?brand=Syngenta')).j.products;
  const prod = list.find((p) => /Icon 10 CS/.test(p.name)) || list[0];
  const doc = (await api('POST', '/documents', { productId: prod.id, kind: 'msds', title: 'Safety data sheet', version: '3.0', manufacturer: 'Syngenta', dataUrl: pdfData('sds') }, O)).j;

  const page = await openPage();
  await page.goto(`${BASE}/`);
  await page.click('.side-explore button:has-text("Brand")');
  await page.waitForSelector('#explore-panel .ex-list a:has-text("Syngenta")');
  await page.click('#explore-panel .ex-list a:has-text("Syngenta")');
  await page.waitForURL('**/shop/brand/syngenta');
  await page.click(`a.pcard-name[href="/shop/${prod.slug}"]`);
  await page.waitForSelector('.px-docs');
  assert.match(await page.textContent('.px-docs'), /Version 3\.0/);
  const [download] = await Promise.all([page.waitForEvent('download'), page.click('.px-doc-actions a:has-text("Download")')]);
  assert.match(download.suggestedFilename(), /-msds-v3\.0\.pdf$/);
  await api('DELETE', `/documents/${doc.id}`, null, O);
  assert.deepEqual((await page.problems()).filter((x) => !/download/i.test(x)), []);
  await page.context().close();
});

test('journey 3: knowledge centre → mosquito guide → switch to Hindi', async () => {
  const page = await openPage();
  await page.goto(`${BASE}/knowledge`);
  await page.click('.kc-card:has-text("Aedes mosquito")');
  await page.waitForURL('**/knowledge/aedes-mosquito');
  await page.waitForFunction(() => document.querySelector('h1')?.textContent.trim() === 'Aedes mosquito');
  assert.match(await page.textContent('.kc-grid'), /Dengue/);
  await page.click('.kc-lang button:has-text("हिन्दी")');
  await page.waitForURL('**/knowledge/aedes-mosquito?lang=hi');
  await page.waitForFunction(() => document.querySelector('h1')?.textContent.trim() === 'एडीज़ मच्छर');
  assert.match(await page.textContent('.kc-grid'), /डेंगू/, 'body content is translated, not just the label');
  assert.equal(await page.getAttribute('.kc-page', 'lang'), 'hi');
  await page.click('.kc-lang button:has-text("English")');
  await page.waitForFunction(() => document.querySelector('h1').textContent.trim() === 'Aedes mosquito');
  assert.deepEqual(await page.problems(), []);
  await page.context().close();
});

test('journey 4: admin uploads an SDS from the console and customers can see it', async () => {
  const page = await openPage();
  await page.goto(`${BASE}/login`);
  await page.fill('#email', OWNER.email);
  await page.fill('#password', OWNER.password);
  await page.click('form button[type="submit"]');
  await page.waitForURL('**/admin**');
  await page.click('button:has-text("Products") >> nth=0');
  await page.fill('.toolbar input', 'Agenda');
  await page.click('tr:has-text("Agenda 25 EC"):has-text("100 ml")');
  await page.click('button:has-text("Upload document")');
  await page.selectOption('.doc-form select >> nth=0', 'msds');
  await page.fill('.doc-form input[placeholder="e.g. Safety data sheet"]', 'Agenda safety data sheet');
  await page.fill('.doc-form input[placeholder="As printed on the document"]', '1.2');
  await page.setInputFiles('.doc-form input[type="file"]', { name: 'agenda-sds.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\n% agenda sds\n') });
  await page.click('.doc-form button[type="submit"]');
  await page.waitForSelector('.doc-row:has-text("Agenda safety data sheet")');

  const customer = await openPage();
  await customer.goto(`${BASE}/shop/envu-agenda-25-ec-100-ml`);
  await customer.waitForSelector('.px-docs');
  assert.match(await customer.textContent('.px-docs'), /Agenda safety data sheet[\s\S]*Version 1\.2/);
  const href = await customer.getAttribute('.px-doc-actions a:has-text("View")', 'href');
  const res = await fetch(BASE + href);
  assert.equal(res.headers.get('content-type'), 'application/pdf');
  assert.deepEqual(await page.problems(), []);
  await page.context().close();
  await customer.context().close();
});

test('journey 5: mobile home → swipe slider → explore drawer → pest → product', async () => {
  const page = await openPage({ mobile: true });
  await page.goto(`${BASE}/`);
  const stage = await page.waitForSelector('.ps-stage');
  await page.evaluate(() => document.querySelector('.ps-stage').scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(1200); // smooth scrolling settles
  const before = await stage.getAttribute('aria-label');
  const box = await stage.boundingBox();
  // A real finger swipe from right to left (touch events through the DevTools protocol).
  const cdp = await page.context().newCDPSession(page);
  const y = box.y + box.height / 2;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: box.x + box.width * 0.8, y }] });
  for (let i = 1; i <= 6; i += 1) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: box.x + box.width * (0.8 - i * 0.1), y }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.waitForFunction((b) => document.querySelector('.ps-stage').getAttribute('aria-label') !== b, before);
  await page.click('.bottom-nav .bn-explore');
  await page.waitForSelector('#explore-panel');
  await page.click('#explore-panel .ex-tabs button:has-text("Pest")');
  await page.click('#explore-panel .ex-list a:has-text("Termites")');
  await page.waitForURL('**/shop/pest/termite');
  await page.waitForSelector('.pgrid .pcard .pcard-name');
  await page.click('.pgrid .pcard .pcard-name >> nth=0');
  await page.waitForSelector('.pd-info h1');
  assert.deepEqual(await page.problems(), []);
  await page.context().close();
});

test('explore drawer: Escape and outside click close it; professional roles show resources', async () => {
  const page = await openPage();
  await page.goto(`${BASE}/shop`);
  await page.click('.side-explore button:has-text("Professional")');
  await page.waitForSelector('#explore-panel');
  await page.keyboard.press('Escape');
  await page.waitForSelector('#explore-panel', { state: 'detached' });
  await page.click('.side-explore button:has-text("Pest")');
  await page.waitForSelector('#explore-panel');
  await page.mouse.click(1200, 400); // outside the panel
  await page.waitForSelector('#explore-panel', { state: 'detached' });
  await page.click('.side-explore button:has-text("Professional")');
  for (const role of ['Pest Control Operator', 'Architect', 'Builder / Developer', 'Contractor']) {
    await page.click(`.ex-roles button:has-text("${role}")`);
    assert.ok((await page.$$('#explore-panel .ex-role .ex-list li')).length >= 3, `${role} shows resources`);
    await page.click('.ex-back');
  }
  await page.click('.ex-roles button:has-text("Architect")');
  await page.click('.ex-role a:has-text("Send a project enquiry")');
  await page.waitForURL('**/contact?subject=Architect%20project%20enquiry');
  assert.equal(await page.inputValue('#c-subject'), 'Architect project enquiry');
  await page.context().close();
});

test('responsive: no sideways scrolling from 360 px to 1440 px', async () => {
  const pages = ['/', '/pestkill-ai', '/shop', '/shop/envu-premise-sc-1-l', '/shop/dose-calculator', '/knowledge/aedes-mosquito', '/pest-control/jaipur', '/contact', '/book'];
  const issues = [];
  for (const width of [360, 375, 390, 414, 768, 1024, 1440]) {
    const ctx = await browser.newContext({ viewport: { width, height: 860 }, isMobile: width < 768 });
    await ctx.addInitScript(() => { try { sessionStorage.setItem('pk_intro', '1'); } catch { /* ignore */ } });
    const page = await ctx.newPage();
    for (const p of pages) {
      await page.goto(BASE + p);
      await page.waitForSelector('h1');
      await page.waitForTimeout(300);
      const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      if (over > 0) issues.push(`${width}px ${p}: ${over}px overflow`);
    }
    await ctx.close();
  }
  assert.deepEqual(issues, []);
});

/* ---------- Directive 2: licences, shop flow, admin registers ---------- */
const PCO_LIC = 'PCO/Jaipur/DD/2025-26/68';
const SALE_LIC = 'SL/Jaipur/DD/2025-26/63';
const loginUi = async (page, email, password) => {
  await page.goto(`${BASE}/login`);
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.click('form button[type="submit"]');
  await page.waitForURL((u) => !u.pathname.startsWith('/login'));
};
const signUp = async (name, email, phone, password) => {
  const s = await api('POST', '/users/register/start', { name, email, phone, password });
  return (await api('POST', '/users/register', { name, email, phone, password, otp: s.j.devCode })).j.token;
};

test('journey 6: licence numbers appear exactly where required, also without JavaScript', async () => {
  // Pre-rendered / server-rendered HTML (what search engines and no-JS visitors get).
  for (const [p, want] of [['/', [PCO_LIC, SALE_LIC]], ['/about', [PCO_LIC, SALE_LIC]], ['/termite-control', [PCO_LIC]], ['/shop/envu-premise-sc-1-l', [SALE_LIC]]]) {
    const html = await (await fetch(BASE + p)).text();
    for (const n of want) assert.ok(html.includes(n), `${p} HTML has ${n}`);
  }
  const where = {
    '/': [PCO_LIC, SALE_LIC], '/about': [PCO_LIC, SALE_LIC], '/contact': [PCO_LIC, SALE_LIC], '/services': [PCO_LIC],
    '/services/general-pest-control': [PCO_LIC], '/termite-control': [PCO_LIC], '/cockroach-control': [PCO_LIC], '/book': [PCO_LIC],
    '/shop': [SALE_LIC], '/shop/envu-premise-sc-1-l': [SALE_LIC], '/pest-control/jaipur': [PCO_LIC, SALE_LIC], '/technical-standards': [PCO_LIC, SALE_LIC],
  };
  for (const mobile of [false, true]) {
    const page = await openPage({ mobile });
    for (const [p, nums] of Object.entries(where)) {
      await page.goto(BASE + p);
      await page.waitForSelector('h1');
      const main = await page.evaluate(() => { const f = document.querySelector('footer'); return document.body.innerText.replace(f ? f.innerText : '', ''); });
      for (const n of nums) assert.ok(main.includes(n), `${mobile ? 'mobile' : 'desktop'} ${p} shows ${n} outside the footer`);
      const foot = await page.textContent('footer');
      assert.ok(foot.includes(PCO_LIC) && foot.includes(SALE_LIC), `${p} footer shows both licences`);
    }
    // Service pages carry the pest control licence; product sales carry the sale licence.
    await page.goto(`${BASE}/services/general-pest-control`);
    assert.equal(await page.textContent('.cred-section .cred-no [translate="no"]'), PCO_LIC);
    await page.goto(`${BASE}/shop`);
    assert.equal(await page.textContent('.cred-section .cred-no [translate="no"]'), SALE_LIC);
    // No authority or validity is shown until the owner verifies them.
    await page.goto(`${BASE}/about`);
    await page.waitForSelector('#credentials .cred-card');
    assert.doesNotMatch(await page.textContent('#credentials'), /Issued by|Valid/);
    assert.equal(await page.$('#credentials a[href*="/licences/"]'), null, 'licence copies are never linked publicly');
    assert.deepEqual(await page.problems(), []);
    await page.context().close();
  }
});

test('journey 7: PCO searches, filters, fills the cart, changes quantity, removes and checks out', async () => {
  const O = await ownerToken();
  const email = 'jaipur.pco.e2e@gmail.com';
  const password = 'PcoBuyer#2026';
  const P = await signUp('Mahesh Saini', email, '9829044512', password);
  assert.equal((await api('POST', '/buyers/documents/licence', { dataUrl: pdfData('pco licence') }, P)).s, 201);
  const validTill = new Date(Date.now() + 365 * 86400e3).toISOString().slice(0, 10);
  const applied = await api('POST', '/buyers/apply', { firmName: 'Saini Pest Services', licenceNo: 'RJ/PCO/778', licenceValidTill: validTill, address: 'Plot 9, Sanganer', city: 'Jaipur', state: 'Rajasthan' }, P);
  assert.equal(applied.s, 201, JSON.stringify(applied.j));
  const me = (await api('GET', `/admin/users?q=${email}`, null, O)).j[0];
  assert.equal((await api('PATCH', `/buyers/${me.id}`, { status: 'approved' }, O)).j.status, 'approved');

  const page = await openPage();
  await loginUi(page, email, password);
  await page.goto(`${BASE}/shop`);
  // Search by active ingredient.
  await page.fill('.shop-search input', 'Fipronil');
  await page.waitForURL(/q=Fipronil/);
  await page.waitForFunction(() => {
    const t = [...document.querySelectorAll('.pgrid .pcard:not(.skeleton) .pcard-tech')];
    return t.length > 0 && t.every((e) => /fipronil/i.test(e.textContent));
  });
  await page.fill('.shop-search input', '');
  await page.waitForURL((u) => !u.search.includes('q='));
  // Brand, pest and formulation filters.
  await page.click('.shop-filters .filter-group button:has-text("Envu")');
  await page.waitForURL(/brand=Envu/);
  await page.click('.shop-pests button:has-text("Termites")');
  await page.waitForURL(/pest=termite/);
  await page.click('.shop-filters .filter-group:has(h4:text-is("Formulation")) button:text-matches("^SC")');
  await page.waitForURL(/formulation=SC/);
  await page.waitForFunction(() => {
    const c = [...document.querySelectorAll('.pgrid .pcard:not(.skeleton) .pcard-chip')];
    return c.length > 0 && c.every((e) => e.textContent === 'SC');
  });
  const brands = await page.$$eval('.pgrid .pcard:not(.skeleton) .pcard-brand', (els) => els.map((e) => e.textContent));
  assert.ok(brands.every((b) => b === 'Envu'), `only Envu products: ${brands.join(', ')} · ${page.url()}`);

  // Product page → cart, plus a second product.
  await page.goto(`${BASE}/shop/envu-premise-sc-1-l`);
  await page.click('.pd-buy button:has-text("Add to cart")');
  await page.goto(`${BASE}/shop/envu-premise-sc-250-ml`);
  await page.click('.pd-buy button:has-text("Add to cart")');
  await page.goto(`${BASE}/cart`);
  await page.waitForSelector('.cart-line:has-text("· 1 L")');
  assert.equal((await page.$$('.cart-line')).length, 2);
  await page.click('.cart-line:has-text("· 1 L") button[aria-label="Increase"]');
  assert.equal(await page.inputValue('.cart-line:has-text("· 1 L") input[aria-label="Quantity"]'), '2');
  await page.click('.cart-line:has-text("· 250 ml") button:has-text("Remove")');
  await page.waitForFunction(() => document.querySelectorAll('.cart-line').length === 1);
  assert.ok((await page.textContent('.checkout')).includes(SALE_LIC), 'sale licence shown at checkout');
  await page.fill('.checkout textarea', 'Plot 9, Sanganer, near the RIICO gate');
  await page.fill('.checkout-row label:has-text("City") input', 'Jaipur');
  await page.fill('.checkout label:has-text("Mobile") input', '9829044512');
  await page.click('.checkout button[type="submit"]');
  await page.waitForSelector('h1:has-text("Order placed")');
  const id = (await page.textContent('.cart-done p strong')).replace(/\D/g, '');

  // The order is stored with the right product and quantity.
  const order = (await api('GET', '/orders', null, O)).j.find((o) => String(o.id) === id);
  assert.ok(order, 'order saved');
  assert.equal(order.items.length, 1);
  assert.equal(order.items[0].quantity, 2);
  const premise1l = (await api('GET', '/products/envu-premise-sc-1-l')).j;
  assert.equal(order.items[0].product_id, premise1l.id);
  assert.deepEqual(await page.problems(), []);
  await page.context().close();
});

test('journey 8: owner manages products, photos, licences, standards and reference prices; others cannot', async () => {
  const page = await openPage();
  page.on('dialog', (d) => d.accept());
  await loginUi(page, OWNER.email, OWNER.password);
  await page.waitForURL('**/admin**');

  // Product: create, photo with source, price edit, hide and restore.
  await page.click('.admin-side button:has-text("Products")');
  await page.click('button:has-text("Add product")');
  const drawer = '.drawer';
  await page.fill(`${drawer} label:has-text("Product name") input`, 'E2E Test Gel');
  await page.fill(`${drawer} label:has-text("Brand") input`, 'Envu');
  await page.fill(`${drawer} label:has-text("Category") input`, 'Cockroach Control');
  await page.fill(`${drawer} label:has-text("Pack size") input`, '20 g');
  await page.fill(`${drawer} label:has-text("Formulation") input`, 'Gel');
  await page.fill(`${drawer} label:has-text("MRP") input`, '450');
  await page.click(`${drawer} button[type="submit"]:has-text("Add product")`);
  await page.waitForSelector(`${drawer} .prod-photo-actions`);
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
  await page.setInputFiles(`${drawer} .prod-photo-actions input[type="file"]`, { name: 'gel.png', mimeType: 'image/png', buffer: png });
  await page.waitForSelector(`${drawer} .photo-source`);
  assert.match(await page.textContent(`${drawer} .photo-source`), /not recorded/);
  await page.click(`${drawer} .photo-source button:has-text("Edit source")`);
  await page.fill(`${drawer} .photo-source label:has-text("Credit") input`, 'Own photo, PestKill store');
  await page.click(`${drawer} .photo-source button:has-text("Save source")`);
  await page.waitForSelector(`${drawer} .photo-source:has-text("Own photo, PestKill store")`);
  assert.equal((await api('GET', `/products?q=${encodeURIComponent('E2E Test Gel')}`)).j.products[0].mrp, null, 'unchecked MRP is price on request');
  await page.fill(`${drawer} label:has-text("MRP (₹") input`, '480');
  await page.check(`${drawer} label:has-text("I have checked this MRP") input`);
  await page.click(`${drawer} button[type="submit"]:has-text("Save changes")`);
  await page.waitForSelector('.toast:has-text("Product saved")');
  const pub = (await api('GET', `/products?q=${encodeURIComponent('E2E Test Gel')}`)).j.products;
  assert.equal(pub.length, 1);
  assert.equal(pub[0].mrp, 480, 'checked MRP is public');
  assert.equal(pub[0].image_meta.credit, 'Own photo, PestKill store');
  await page.uncheck(`${drawer} label:has-text("Show in shop") input`);
  await page.click(`${drawer} button[type="submit"]:has-text("Save changes")`);
  await page.waitForTimeout(600);
  assert.equal((await api('GET', `/products?q=${encodeURIComponent('E2E Test Gel')}`)).j.products.length, 0, 'hidden from the shop');
  await page.check(`${drawer} label:has-text("Show in shop") input`);
  await page.click(`${drawer} button[type="submit"]:has-text("Save changes")`);
  await page.waitForTimeout(600);
  assert.equal((await api('GET', `/products?q=${encodeURIComponent('E2E Test Gel')}`)).j.products.length, 1, 'restored');
  await page.click(`${drawer} button[aria-label="Close"]`);

  // Licences: upload the copy, verify, hide and show.
  await page.click('.admin-side button:has-text("Licences")');
  const sale = '.lic-admin[data-licence="sale"]';
  await page.waitForSelector(sale);
  assert.equal(await page.textContent(`${sale} .lic-admin-no`), SALE_LIC);
  assert.ok(await page.isDisabled(`${sale} button:has-text("Mark verified")`), 'cannot verify without a copy');
  await page.setInputFiles(`${sale} input[type="file"]`, { name: 'sale-licence.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\n% sale licence\n') });
  await page.waitForSelector(`${sale} .lic-admin-dl button:has-text("View")`);
  // The owner opens the copy through a short-lived link in a new tab.
  const [tab] = await Promise.all([page.context().waitForEvent('page'), page.click(`${sale} .lic-admin-dl button:has-text("View")`)]);
  await tab.waitForURL(/\/api\/licences\/\d+\/document\?t=/);
  await tab.close();
  await page.click(`${sale} button:has-text("Mark verified")`);
  await page.waitForSelector(`${sale} .badge:has-text("Verified")`);
  const customer = await openPage();
  await customer.goto(`${BASE}/shop`);
  await customer.waitForSelector('.cred-section .cred-status.is-ok');
  assert.match(await customer.textContent('.cred-section'), /checked against the licence copy/);
  assert.equal(await customer.$('a[href*="/licences/"]'), null, 'no public link to the licence copy');
  await page.click(`${sale} button:has-text("Hide from website")`);
  await page.waitForSelector(`${sale} button:has-text("Show on website")`);
  const shown = (await api('GET', '/licences')).j.map((l) => l.key);
  assert.deepEqual(shown, ['pco'], 'hidden licence is not published');
  await page.click(`${sale} button:has-text("Show on website")`);
  await page.waitForSelector(`${sale} button:has-text("Hide from website")`);
  await customer.context().close();

  // Technical standards: add, publish, delete.
  await page.click('.admin-side button:has-text("Technical standards")');
  await page.waitForSelector('.std-admin');
  await page.click('button:has-text("Add reference")');
  await page.fill('.doc-form label:has-text("Standard number") input', 'IS 9999 : 2020 (E2E)');
  await page.fill('.doc-form label:text-is("Title") input', 'Test reference added by the end-to-end suite');
  await page.check('.doc-form label:has-text("Show on the public") input');
  await page.click('.doc-form button:has-text("Save reference")');
  await page.waitForSelector('.std-admin:has-text("IS 9999 : 2020 (E2E)")');
  assert.ok((await api('GET', '/standards')).j.some((s) => s.code === 'IS 9999 : 2020 (E2E)'));
  await page.click('.std-admin:has-text("IS 9999 : 2020 (E2E)") button:has-text("Delete")');
  await page.waitForSelector('.toast:has-text("Reference deleted")');
  assert.ok(!(await api('GET', '/standards')).j.some((s) => s.code === 'IS 9999 : 2020 (E2E)'));

  // Reference prices: comparison table, edit a competitor price; our price is untouched.
  await page.click('.admin-side button:has-text("Reference prices")');
  await page.waitForSelector('.ref-table tbody tr');
  await page.fill('input[aria-label="Search reference prices"]', 'Premise SC');
  await page.click('.ref-table tbody tr:has-text("Matched"):has-text("1 L") button:has-text("Review")');
  await page.fill('.ref-editor label:has-text("Their price") input', '3850');
  await page.click('.ref-editor button:has-text("Save")');
  await page.waitForSelector('.toast:has-text("Reference price saved")');
  const premise1l = (await api('GET', '/products/envu-premise-sc-1-l')).j;
  const ref = (await api('GET', '/reference-prices', null, await ownerToken())).j.find((r) => r.product_id === premise1l.id);
  assert.equal(ref.displayed_price, 3850);
  assert.notEqual(premise1l.mrp, 3850, 'our MRP is not overwritten');

  // Permissions: a customer cannot change any of this.
  const C = await signUp('Neha Sharma', 'neha.e2e@gmail.com', '9829055123', 'Neha#2026x');
  assert.equal((await api('POST', '/products', { name: 'X', brand: 'Y', category: 'Z', packSize: '1 L' }, C)).s, 403);
  assert.equal((await api('PATCH', `/products/${pub[0].id}/image`, { credit: 'x' }, C)).s, 403);
  assert.equal((await api('PATCH', '/licences/1', { display: false }, C)).s, 403);
  assert.equal((await api('POST', '/standards', { code: 'IS 1', title: 'x' }, C)).s, 403);
  assert.equal((await api('GET', '/reference-prices', null, C)).s, 403);
  assert.deepEqual(await page.problems(), []);
  await page.context().close();
});

test('dose calculator: any product, IS 6313 starting figures, label entry for others, pack and cost', async () => {
  const page = await openPage();
  await page.goto(`${BASE}/shop/dose-calculator?activity=termite_pre`);
  await page.click('button[aria-pressed]:has-text("Any product")');
  await page.waitForSelector('.dc-dose');
  await page.selectOption('label:has-text("Brand") select', 'Envu');
  await page.selectOption('label:has-text("Product") >> nth=0 >> select', { label: 'Durmet TC · Chlorpyrifos 20% EC' });
  await page.waitForSelector('.dc-dose-head:has-text("Durmet TC")');
  const dil = 'label.dc-field:has-text("Dilution") input';
  assert.equal(await page.inputValue(dil), '50', 'IS 6313 1.0% a.i. from 20% EC');
  assert.equal(await page.inputValue('label.dc-field:has-text("horizontal surface") input'), '5');
  assert.equal(await page.inputValue('label.dc-field:has-text("vertical surface") input'), '7.5');
  assert.match(await page.textContent('.dc-dose'), /IS 6313 \(Part 2\) : 2001, cl\. 7\.2\.1/);
  await page.fill('label.dc-field:has-text("Building length") input', '10');
  await page.fill('label.dc-field:has-text("Building width") input', '10');
  await page.waitForSelector('.dc-result .dc-totals');
  // 100 m² plinth × 5 + 40 m perimeter × 2.25 = 590 L; × 50 ml/L = 29,500 ml.
  const totals = await page.textContent('.dc-result .dc-totals');
  assert.match(totals, /590 L/);
  assert.match(totals, /29,500 ml/);
  assert.match(totals, /Packs of/);

  // A chemical the standard does not list: dilution is left for the label, and nothing is calculated without it.
  await page.selectOption('label:has-text("Product") >> nth=0 >> select', { label: 'Premise SC · Imidacloprid 30.5% SC' });
  await page.waitForSelector('.dc-dose-head:has-text("Premise SC")');
  assert.equal(await page.inputValue(dil), '');
  assert.match(await page.textContent('label.dc-field:has-text("Dilution")'), /Enter from the product label/);
  assert.match(await page.textContent('.dc-result'), /dilution has not been entered/);
  await page.fill(dil, '2.5');
  await page.waitForFunction(() => /1,475 ml/.test(document.querySelector('.dc-result')?.textContent || ''));
  assert.match(await page.textContent('label.dc-field:has-text("Dilution")'), /Your figure/);

  // Post-construction: drill holes along floor–wall junctions.
  await page.click('.dc-activities button:has-text("Termite: post-construction")');
  await page.click('button[aria-pressed]:has-text("Any product")');
  await page.waitForSelector('.dc-dose');
  await page.selectOption('label:has-text("Brand") select', 'Envu');
  await page.selectOption('label:has-text("Product") >> nth=0 >> select', { label: 'Durmet TC · Chlorpyrifos 20% EC' });
  await page.fill('label.dc-field:has-text("Building length") input', '10');
  await page.fill('label.dc-field:has-text("Building width") input', '10');
  await page.fill('label.dc-field:has-text("floor–wall junctions") input', '30');
  await page.waitForSelector('.dc-result tr:has-text("Drill holes")');
  // 40 m × 2.25 + 101 holes × 1 L = 191 L.
  assert.match(await page.textContent('.dc-result .dc-totals'), /191 L/);
  assert.deepEqual(await page.problems(), []);
  await page.context().close();
});

/* ---------- Production-readiness release ---------- */
test('footer: copyright with current year, developer credit opens WhatsApp, no social links anywhere', async () => {
  for (const mobile of [false, true]) {
    const page = await openPage({ mobile });
    for (const p of ['/', '/shop', '/contact', '/about', '/terms']) {
      await page.goto(BASE + p);
      await page.waitForSelector('footer .footer-credit');
      const copy = await page.textContent('footer .footer-copy');
      assert.ok(copy.includes(`© ${new Date().getFullYear()} PestKill Pest Solutions. All Rights Reserved.`), `${p} copyright`);
      assert.match(copy, /Designed & Created By\s*Prerit Mudgal/);
      const link = page.locator('footer .footer-credit a');
      assert.equal(await link.count(), 1, 'only the name is a link');
      assert.equal((await link.textContent()).trim(), 'Prerit Mudgal');
      assert.equal(await link.getAttribute('href'), 'https://wa.me/916375338302');
      assert.equal(await link.getAttribute('target'), '_blank');
      assert.match(await link.getAttribute('rel'), /noopener/);
      assert.match(await link.getAttribute('aria-label'), /WhatsApp/);
      assert.equal(await page.$('footer .footer-copy > p:first-child a'), null, 'the copyright text is not a link');
      const social = await page.$$eval('a[href]', (as) => as.map((a) => a.href).filter((h) => /instagram|facebook\.com|twitter\.com|x\.com\/|linkedin|youtube/i.test(h)));
      assert.deepEqual(social, [], `${p} has no social links`);
      // The credit is visible and not covered by the phone bottom bar.
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      await page.waitForTimeout(150);
      const hit = await page.evaluate(() => {
        const a = document.querySelector('footer .footer-credit a');
        const r = a.getBoundingClientRect();
        return document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2) === a;
      });
      assert.ok(hit, `${mobile ? 'mobile' : 'desktop'} ${p}: credit can be tapped`);
    }
    // Keyboard reachable.
    await page.focus('footer .footer-credit a');
    assert.equal(await page.evaluate(() => document.activeElement?.textContent), 'Prerit Mudgal');
    await page.context().close();
  }
});

test('lead forms: when the server is down, a tap-to-send WhatsApp button appears (no blocked pop-up)', async () => {
  const page = await openPage({ mobile: true });
  await page.route('**/api/leads', (r) => r.abort());
  await page.goto(`${BASE}/contact`);
  await page.fill('#c-name', 'Anil Verma');
  await page.fill('#c-phone', '9829077123');
  await page.fill('#c-subject', 'Termite inspection');
  await page.fill('#c-message', 'Termites in the door frame');
  const popups = [];
  page.context().on('page', (p) => popups.push(p));
  await page.click('.contact-form button[type="submit"]');
  const btn = page.locator('.contact-form .wa-fallback');
  await btn.waitFor();
  assert.equal(popups.length, 0, 'nothing opened automatically');
  const href = await btn.getAttribute('href');
  assert.match(href, /^https:\/\/wa\.me\/916375338302\?text=/);
  assert.match(decodeURIComponent(href), /Anil Verma[\s\S]*9829077123[\s\S]*Termite inspection/);
  assert.match(await page.textContent('.contact-form .form-error'), /was not saved/);
  assert.equal(await page.$('text=Thank You!'), null, 'no false success message');
  await page.context().close();
});

test('prices and claims: official rates with GST note; unverified claims are gone', async () => {
  const page = await openPage();
  await page.goto(`${BASE}/termite-control`);
  await page.waitForSelector('.pricing-grid');
  const t = await page.textContent('main');
  assert.match(t, /₹7–9/);
  assert.match(t, /₹12–15/);
  assert.match(t, /₹22–27/);
  assert.match(t, /exclusive of GST/);
  await page.goto(`${BASE}/cockroach-control`);
  await page.waitForSelector('.pricing-grid');
  const c = await page.textContent('.pricing-grid');
  assert.match(c, /₹1,200[\s\S]*₹1,500[\s\S]*₹1,800/);
  for (const p of ['/', '/services', '/termite-control', '/cockroach-control', '/rodent-control', '/about', '/pest-control/jaipur']) {
    await page.goto(BASE + p);
    await page.waitForSelector('h1');
    const text = await page.evaluate(() => document.body.innerText);
    for (const bad of [/4\.9\s*\/\s*5/, /100% satisfaction/i, /10[- ]year warranty/i, /same[- ]day/i, /local teams/i, /government projects/i, /completely safe/i, /₹6[–-]9/, /₹22[–-]25\b/]) {
      assert.doesNotMatch(text, bad, `${p} still says ${bad}`);
    }
  }
  await page.goto(`${BASE}/`);
  assert.match(await page.textContent('main'), /dispatched from Jaipur/);
  // An MRP with no checked source (pack or public page) is never shown to customers…
  await page.goto(`${BASE}/shop/syngenta-icon-10-cs-100-ml`);
  await page.waitForSelector('.pd-info');
  assert.match(await page.textContent('.pd-info'), /Price on request/);
  // …while one matched to a public listing (URL and date recorded) is.
  await page.goto(`${BASE}/shop/envu-agenda-25-ec-100-ml`);
  await page.waitForSelector('.pd-info');
  assert.match(await page.textContent('.pd-info'), /₹320/);
  await page.context().close();
});

/* ---------- PestKill AI (no API key in the test environment) ---------- */
test('PestKill AI page: honest offline state, official estimates, verified search, entry points', async () => {
  const page = await openPage();
  await page.goto(`${BASE}/pestkill-ai`);
  await page.waitForSelector('.pkai-status .off');
  assert.match(await page.textContent('.pkai-status'), /not switched on yet/);

  // Estimate tool: computed from the shared official price list, GST shown separately.
  await page.click('.pkai-tabs button:has-text("Estimate price")');
  await page.waitForSelector('.pkai-estimate');
  let est = await page.textContent('.pkai-estimate');
  assert.match(est, /₹1,500[\s\S]*GST @ 18%[\s\S]*₹270[\s\S]*₹1,770/);
  await page.selectOption('.pkai-quote label:has-text("Service") select', 'termite_pre');
  await page.fill('.pkai-quote label:has-text("Area") input', '1000');
  est = await page.textContent('.pkai-estimate');
  assert.match(est, /₹12,000 – ₹15,000[\s\S]*₹14,160 – ₹17,700/);
  await page.selectOption('.pkai-quote label:has-text("Service") select', 'general');
  await page.selectOption('.pkai-quote label:has-text("Property") select', 'business');
  assert.match(await page.textContent('.pkai-estimate'), /quoted after inspection/);
  assert.equal(await page.$('.pkai-quote button:has-text("Ask PestKill AI")'), null, 'no AI button while AI is off');

  // Ask: without AI, answers come only from verified knowledge search, clearly labelled.
  await page.click('.pkai-tabs button:has-text("Ask")');
  await page.fill('.ai-composer textarea', 'expired product replacement');
  await page.click('.ai-send');
  await page.waitForSelector('.ai-msg.search');
  assert.match(await page.textContent('.ai-msg.search'), /Verified knowledge search \(AI answers are off\)[\s\S]*Product replacement policy/);
  assert.equal(await page.$('.ai-msg.assistant:not(.search)'), null, 'no AI-styled answer was invented');

  // Hindi
  await page.click('.pkai-lang button:has-text("हिन्दी")');
  assert.equal(await page.getAttribute('.ai-composer textarea', 'placeholder'), 'अपना सवाल लिखें…');

  // Entry points
  await page.goto(`${BASE}/`);
  await page.click('.nav-link.nav-ai');
  await page.waitForURL('**/pestkill-ai');
  await page.goto(`${BASE}/shop/envu-premise-sc-1-l`);
  await page.click('.ask-ai');
  await page.waitForURL(/\/pestkill-ai\?product=envu-premise-sc-1-l/);
  assert.deepEqual(await page.problems(), []);
  await page.context().close();

  const phone = await openPage({ mobile: true });
  await phone.goto(`${BASE}/`);
  await phone.click('.bottom-nav a[href="/pestkill-ai"]');
  await phone.waitForURL('**/pestkill-ai');
  const over = await phone.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert.equal(over, 0, 'no sideways scrolling on phones');
  await phone.context().close();
});

test('PestKill AI in the console: owner gets insights and usage; customers cannot', async () => {
  const page = await openPage();
  await page.goto(`${BASE}/login`);
  await page.fill('#email', OWNER.email);
  await page.fill('#password', OWNER.password);
  await page.click('form button[type="submit"]');
  await page.waitForURL('**/admin**');
  await page.click('.admin-side button:has-text("PestKill AI")');
  await page.waitForSelector('.ai-admin .toolbar button:has-text("Business insights")');
  assert.ok(await page.$('.ai-admin .toolbar button:has-text("Field assistant")'));
  await page.waitForSelector('.ai-overview');
  assert.match(await page.textContent('.ai-overview'), /Not configured: add GEMINI_API_KEY/);
  assert.deepEqual(await page.problems(), []);
  await page.context().close();
  const r = await api('POST', '/ai/chat', { mode: 'insights', message: 'leads' });
  assert.equal(r.s, 401);
});

test('MRP import: owner pastes a price list, previews, confirms; customers see the MRP and real pack size', async () => {
  const page = await openPage();
  await page.goto(`${BASE}/login`);
  await page.fill('#email', OWNER.email);
  await page.fill('#password', OWNER.password);
  await page.click('form button[type="submit"]');
  await page.waitForURL('**/admin**');
  await page.click('.admin-side button:has-text("Products")');
  await page.click('button:has-text("Import MRP list")');
  // Test fixture figures only (not real MRPs).
  await page.fill('.mrp-import textarea', 'Brand, Product, Pack, MRP\nKalyani\tPexter\t1 L\t1999\nKalyani, Nonexistent Product, 1 L, 50');
  await page.click('.mrp-import button:has-text("Preview")');
  await page.waitForSelector('.mrp-import table');
  const preview = await page.textContent('.mrp-import table');
  assert.match(preview, /Pexter[\s\S]*1 L[\s\S]*Set pack size \+ MRP/);
  assert.match(preview, /Nonexistent Product[\s\S]*No matching product/);
  assert.ok(await page.isDisabled('.mrp-import button:has-text("Apply")'), 'needs the confirmation tick');
  await page.check('.mrp-import .check-row input');
  await page.click('.mrp-import button:has-text("Apply 1 MRPs")');
  await page.waitForSelector('.toast:has-text("1 MRPs saved")');
  const p = (await api('GET', '/products?q=Pexter')).j.products.find((x) => x.brand === 'Kalyani');
  assert.deepEqual([p.pack_size, p.mrp], ['1 L', 1999]);
  const other = (await api('GET', '/products?q=Ozier')).j.products.find((x) => x.brand === 'Kalyani');
  assert.equal(other.pack_size, 'Pack size on request', 'placeholder sizes are not shown as sizes');
  assert.deepEqual(await page.problems(), []);
  await page.context().close();
});
