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
      GMAIL_USER: '', GMAIL_APP_PASSWORD: '', SMTP_USER: '', SMTP_PASS: '', EMAIL_OTP: 'on' },
  });
  server.stdout.on('data', (d) => { log += d; });
  server.stderr.on('data', (d) => { log += d; });
  let up = false;
  for (let i = 0; i < 120 && !up; i += 1) {
    try { up = (await fetch(`${BASE}/api/health`)).ok; } catch { /* starting */ }
    if (!up) await new Promise((r) => setTimeout(r, 500));
  }
  if (!up) throw new Error(`API server did not start:\n${log}`);
  browser = await chromium.launch(process.env.E2E_BROWSER_PATH ? { executablePath: process.env.E2E_BROWSER_PATH } : { channel: 'msedge' });
});
after(async () => { await browser?.close(); server?.kill(); });

/** A fresh browser tab that records console errors, page errors and CSP violations. */
const openPage = async ({ mobile = false, bypassCSP = false, reducedMotion = 'no-preference' } = {}) => {
  const ctx = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1280, height: 900 }, isMobile: mobile, bypassCSP, reducedMotion });
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
  '/shop/envu-premise-sc-1-l', '/pest-identifier', '/contact', '/about', '/blog', '/locations', '/login', '/register', '/pco-account'];

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
  for (const p of ['/', '/pest-control/jaipur', '/book', '/shop', '/shop/envu-premise-sc-1-l', '/login', '/register', '/contact']) {
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
  await page.click('button:has-text("Continue")');
  await page.click('button:has-text("Confirm booking")');
  await page.waitForSelector('text=Your booking reference is');
  const ref = (await page.textContent('strong:near(:text("booking reference"))')).trim();
  const owner = (await api('POST', '/users/login', OWNER)).j.token;
  const leads = (await api('GET', `/leads?q=${encodeURIComponent(ref)}`, null, owner)).j;
  assert.equal(leads[0]?.name, 'Rohit Sharma', 'booking reached the database');
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
  assert.ok((await page.$$('.pgrid .pcard:not(.skeleton)')).length > 3);
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
  assert.ok(Math.abs(bar.bottom - bar.vh) <= 2, `buy bar sits at the bottom of the screen: ${JSON.stringify(bar)}`);
  await page.click('.pd-buy button:has-text("Add to cart")');
  await page.waitForSelector('.nav-cart-badge');
  assert.deepEqual(await page.problems(), []);
  await page.context().close();
});
