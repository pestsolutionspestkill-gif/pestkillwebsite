// End-to-end API tests. Starts the real server on a throwaway in-memory database.
// Run: npm test   (from backend/)
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 5600 + Math.floor(Math.random() * 300);
const B = `http://127.0.0.1:${PORT}/api`;
let server;
let log = '';

const call = async (method, p, body, token) => {
  const r = await fetch(B + p, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
  let j = null;
  try { j = await r.json(); } catch { /* empty body */ }
  return { s: r.status, j };
};
const login = async (email, password) => (await call('POST', '/users/login', { email, password })).j?.token;

// Sign-up with email OTP (in development the server returns the code as devCode).
let phoneSeq = 0;
const nextPhone = () => `98290${String(13579 + (phoneSeq += 137)).padStart(5, '0')}`;
const register = async (name, email, password = 'Passw0rd!x', phone = nextPhone()) => {
  const start = await call('POST', '/users/register/start', { name, email, phone, password });
  assert.equal(start.s, 200, JSON.stringify(start.j));
  const r = await call('POST', '/users/register', { name, email, phone, password, otp: start.j.devCode });
  assert.equal(r.s, 201, JSON.stringify(r.j));
  return r.j.token;
};

before(async () => {
  server = spawn(process.execPath, ['src/server.js'], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(PORT), PGLITE_DIR: 'memory://', DATABASE_URL: '', RENDER: '', SITE_URL: '', NODE_ENV: 'test', JWT_SECRET: 'x'.repeat(40),
      OWNER_NAME: 'Test Owner', OWNER_EMAIL: 'owner@test.local', OWNER_PASSWORD: 'OwnerPass123', GMAIL_USER: '', GMAIL_APP_PASSWORD: '', SMTP_USER: '', SMTP_PASS: '', EMAIL_OTP: 'on', RATE_LIMITS: process.env.KEEP_LIMITS ? '' : 'off' },
  });
  server.stdout.on('data', (d) => { log += d; });
  server.stderr.on('data', (d) => { log += d; });
  for (let i = 0; i < 120; i += 1) {
    try { if ((await fetch(`${B}/health`)).ok) return; } catch { /* starting */ }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`server did not start:\n${log}`);
});
after(() => server?.kill());

let O; // owner token

test('owner login from env', async () => {
  O = await login('owner@test.local', 'OwnerPass123');
  assert.ok(O);
});

test('sign-up requires a valid email OTP', async () => {
  const body = { name: 'Asha Verma', email: 'asha@example.com', phone: '9829011111', password: 'AshaPass123' };
  const start = await call('POST', '/users/register/start', body);
  assert.equal(start.s, 200);
  assert.match(start.j.devCode, /^\d{6}$/);
  assert.match(log, /\[dev\] Email OTP for asha@example.com/);
  let r = await call('POST', '/users/register', body);
  assert.equal(r.s, 400, 'no code');
  const wrong = start.j.devCode === '111111' ? '222222' : '111111';
  r = await call('POST', '/users/register', { ...body, otp: wrong });
  assert.equal(r.s, 400);
  assert.match(r.j.error, /4 tries left/);
  r = await call('POST', '/users/register/start', body);
  assert.equal(r.s, 429, 'resend cooldown');
  r = await call('POST', '/users/register', { ...body, otp: start.j.devCode });
  assert.equal(r.s, 201, JSON.stringify(r.j));
  assert.equal(r.j.user.role, 'client');
  assert.equal(r.j.user.email_verified, true);
  r = await call('POST', '/users/register', { ...body, otp: start.j.devCode });
  assert.equal(r.s, 409, 'email already used');
});

test('OTP locks after 5 wrong attempts', async () => {
  const body = { name: 'Lock Test', email: 'lock@example.com', phone: '9829022222', password: 'LockPass123' };
  const start = await call('POST', '/users/register/start', body);
  const wrong = start.j.devCode === '111111' ? '222222' : '111111';
  for (let i = 0; i < 5; i += 1) await call('POST', '/users/register', { ...body, otp: wrong });
  const r = await call('POST', '/users/register', { ...body, otp: start.j.devCode });
  assert.equal(r.s, 400);
  assert.match(r.j.error, /Too many wrong attempts/);
});

test('sign-up blocks abusive names, fake mobiles, temporary emails and reused mobiles', async () => {
  const base = { name: 'Real Person', email: 'real@example.com', phone: '9829033333', password: 'RealPass123' };
  const cases = [
    [{ name: 'Chutiya Kumar' }, /not allowed/],
    [{ name: 'Rahul123' }, /only letters/],
    [{ name: 'Admin' }, /not allowed/],
    [{ phone: '9999999999' }, /does not look real/],
    [{ phone: '9876543210' }, /does not look real/],
    [{ phone: '98290333331' }, /10-digit/],
    [{ email: 'x@mailinator.com' }, /Temporary email/],
    [{ email: 'real@gmial.com' }, /Did you mean/],
    [{ phone: '9829011111' }, /mobile number already exists/],
  ];
  for (const [change, msg] of cases) {
    const r = await call('POST', '/users/register/start', { ...base, ...change });
    assert.ok(r.s === 400 || r.s === 409, `${JSON.stringify(change)} -> ${r.s}`);
    assert.match(r.j.error, msg, JSON.stringify(change));
  }
});

test('roles: managers get default permissions; clients cannot reach admin', async () => {
  let r = await call('POST', '/admin/users', { name: 'Mona Manager', email: 'mgr@example.com', phone: '9829044444', password: 'MgrPass1234', role: 'manager' }, O);
  assert.equal(r.s, 201, JSON.stringify(r.j));
  const M = await login('mgr@example.com', 'MgrPass1234');
  r = await call('GET', '/users/profile', null, M);
  assert.ok(r.j.permissions.includes('services.view'));
  assert.ok(!r.j.permissions.includes('users.assign_roles'));
  r = await call('POST', '/admin/users', { name: 'Bad Name', email: 'x2@example.com', phone: '9829055555', password: 'Passw0rd!x', role: 'manager' }, M);
  assert.equal(r.s, 403, 'manager cannot create staff');
  r = await call('POST', '/admin/users', { name: 'Madarchod', email: 'x3@example.com', phone: '9829066666', password: 'Passw0rd!x', role: 'client' }, O);
  assert.equal(r.s, 400, 'owner also cannot create abusive names');
  const C = await login('asha@example.com', 'AshaPass123');
  r = await call('GET', '/admin/stats', null, C);
  assert.equal(r.s, 403);
});

test('bookings: public form filters names; clients see only their own', async () => {
  let r = await call('POST', '/leads', { type: 'booking', service: 'Cockroach Control', preferredDate: '2026-12-01', name: 'Bhosdike', phone: '9829077777' });
  assert.equal(r.s, 400);
  r = await call('POST', '/leads', { type: 'booking', service: 'Cockroach Control', preferredDate: '2026-12-01', name: 'Guest Customer', phone: '9829011111', address: 'Secret House 7' });
  assert.equal(r.s, 201);
  const C = await login('asha@example.com', 'AshaPass123');
  r = await call('GET', '/leads/mine', null, C);
  assert.equal(r.j.length, 0, 'same phone does not leak guest bookings');
  await call('POST', '/leads', { type: 'booking', service: 'Termite Control', preferredDate: '2026-12-02', name: 'Asha Verma', phone: '9829011111' }, C);
  r = await call('GET', '/leads/mine', null, C);
  assert.equal(r.j.length, 1);
});

test('invoices: unique numbers under parallel creation', async () => {
  const res = await Promise.all(Array.from({ length: 6 }, () => call('POST', '/invoices', { customerName: 'Bulk Buyer', customerPhone: '9829088888', gstRate: 18, items: [{ description: 'Service', qty: 1, rate: 1000 }] }, O)));
  assert.ok(res.every((x) => x.s === 201), JSON.stringify(res.map((x) => x.j)));
  assert.equal(new Set(res.map((x) => x.j.number)).size, 6);
  assert.equal(res[0].j.total, 1180);
});

test('shop: catalogue, photos, PCO approval, offers, stock and orders', async () => {
  let r = await call('GET', '/products');
  assert.ok(r.j.products.length >= 140);
  assert.ok(r.j.products.filter((p) => p.image_url).length >= 100);
  const premise = r.j.products.find((p) => p.slug === 'envu-premise-sc-250-ml');
  assert.equal(premise.mrp, 1245);

  const P = await register('Ravi Pest', 'pco@example.com');
  r = await call('POST', '/orders', { items: [{ productId: premise.id, quantity: 1 }], address: 'Shop 4, MI Road', city: 'Jaipur' }, P);
  assert.equal(r.s, 403, 'not approved yet');
  r = await call('POST', '/buyers/apply', { firmName: 'Chutiya Pest Control', licenceNo: 'RJ/1', address: 'Shop 4, MI Road', city: 'Jaipur' }, P);
  assert.equal(r.s, 400, 'abusive firm name');
  r = await call('POST', '/buyers/apply', { firmName: 'Ravi Pest Control', licenceNo: 'RJ/PCO/123', address: 'Shop 4, MI Road', city: 'Jaipur' }, P);
  assert.equal(r.s, 201);
  const me = (await call('GET', '/admin/users?q=pco@example.com', null, O)).j[0];
  r = await call('PATCH', `/buyers/${me.id}`, { status: 'approved' }, O);
  assert.equal(r.j.status, 'approved');

  const tomorrow = new Date(Date.now() + 5.5 * 3600e3 + 86400e3).toISOString().slice(0, 10);
  r = await call('PATCH', '/products/bulk', { updates: [{ id: premise.id, offerPrice: 1100, offerLabel: 'Diwali offer', offerEnds: tomorrow, stock: 3 }] }, O);
  assert.equal(r.s, 200, JSON.stringify(r.j));
  r = await call('PATCH', '/products/bulk', { updates: [{ id: premise.id, offerPrice: 1300 }] }, O);
  assert.equal(r.s, 400, 'offer above MRP');
  r = await call('GET', `/products/${premise.slug}`);
  assert.equal(r.j.offer.price, 1100);

  const orders = await Promise.all(Array.from({ length: 5 }, () => call('POST', '/orders', { items: [{ productId: premise.id, quantity: 1 }], address: 'Shop 4, MI Road', city: 'Jaipur' }, P)));
  const ok = orders.filter((o) => o.s === 201);
  assert.equal(ok.length, 3, 'no overselling');
  assert.equal(ok[0].j.total, 1100, 'charged at offer price');
  r = await call('POST', `/orders/${ok[0].j.id}/cancel`, null, P);
  assert.equal(r.j.status, 'cancelled');
  r = await call('GET', `/products/${premise.id}`, null, O);
  assert.equal(r.j.stock, 1, 'stock restored on cancel');
});

test('complaints block abusive text', async () => {
  const C = await login('asha@example.com', 'AshaPass123');
  let r = await call('POST', '/complaints', { subject: 'Bad service', description: 'Your technician is a chutiya' }, C);
  assert.equal(r.s, 400);
  r = await call('POST', '/complaints', { subject: 'Ants are back', description: 'Ants returned in the kitchen after a week.' }, C);
  assert.equal(r.s, 201);
});

test('OTP requests are rate-limited per IP', { skip: !process.env.KEEP_LIMITS && 'run with KEEP_LIMITS=1 to test limits' }, async () => {
  const codes = [];
  for (let i = 0; i < 10; i += 1) codes.push((await call('POST', '/users/register/start', { name: 'Spam Person', email: `spam${i}@example.com`, phone: nextPhone(), password: 'SpamPass123' })).s);
  assert.ok(codes.includes(429), codes.join(','));
});

test('warranty wallet, service proof photos, one-tap claims and QR verification', async () => {
  const C = await register('Neha Kapoor', 'neha@example.com');
  let r = await call('POST', '/leads', { type: 'booking', service: 'Cockroach Control', preferredDate: '2026-12-05', name: 'Neha Kapoor', phone: '9829099999',
    city: 'Jaipur', household: { kids: true, pets: true, hacker: true, elderly: 'yes' } }, C);
  assert.equal(r.s, 201);
  const ref = r.j.ref;
  const lead = (await call('GET', `/leads?q=${ref}`, null, O)).j[0];

  r = await call('GET', `/verify/${ref}`);
  assert.equal(r.j.valid, false, 'no certificate before completion');
  r = await call('POST', '/claims', { ref, issue: 'Cockroaches are back in the kitchen' }, C);
  assert.equal(r.s, 400, 'no claim before completion');

  // Service proof photo (1x1 PNG) and completion with warranty
  const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  r = await call('POST', `/jobs/${lead.id}/photos`, { kind: 'after', dataUrl: png }, O);
  assert.equal(r.s, 201, JSON.stringify(r.j));
  r = await call('POST', `/jobs/${lead.id}/photos`, { kind: 'after', dataUrl: png }, C);
  assert.equal(r.s, 403, 'customer cannot upload proof');
  r = await call('PATCH', `/leads/${lead.id}`, { status: 'completed', warranty: '90 days' }, O);
  assert.equal(r.s, 200, JSON.stringify(r.j));

  r = await call('GET', '/leads/mine', null, C);
  const mine = r.j.find((l) => l.ref === ref);
  assert.deepEqual(mine.household, { kids: true, pets: true }, 'only known yes/no flags stored');
  assert.equal(mine.warranty_status.active, true);
  assert.ok(mine.warranty_status.days_left >= 89);
  assert.equal(mine.photo_count, 1);

  r = await call('GET', `/leads/${ref}/proof`, null, C);
  assert.equal(r.j.photos.length, 1);
  assert.match(r.j.photos[0].url, /^data:image\/png;base64,/);
  const other = await register('Other Customer', 'other@example.com');
  r = await call('GET', `/leads/${ref}/proof`, null, other);
  assert.equal(r.s, 404, 'strangers cannot see proof');

  r = await call('POST', '/claims', { ref, issue: 'bhenchod still here' }, C);
  assert.equal(r.s, 400, 'abusive claim text');
  r = await call('POST', '/claims', { ref, issue: 'Cockroaches are back in the kitchen at night', preferredDate: '2026-12-20' }, C);
  assert.equal(r.s, 201, JSON.stringify(r.j));
  const claimId = r.j.id;
  r = await call('POST', '/claims', { ref, issue: 'Still seeing them in the bathroom too' }, C);
  assert.equal(r.s, 409, 'one open claim per service');
  r = await call('POST', '/claims', { ref, issue: 'Not my booking but trying anyway' }, other);
  assert.equal(r.s, 404);

  r = await call('PATCH', `/claims/${claimId}`, { status: 'scheduled' }, O);
  assert.equal(r.s, 400, 'scheduling needs a date');
  r = await call('PATCH', `/claims/${claimId}`, { status: 'scheduled', scheduledAt: '2026-12-21T10:00:00+05:30' }, O);
  assert.equal(r.j.status, 'scheduled');
  r = await call('GET', '/claims', null, O);
  assert.ok(r.j.some((c) => c.id === claimId && c.ref === ref));
  r = await call('GET', '/claims/mine', null, C);
  assert.equal(r.j[0].status, 'scheduled');

  r = await call('GET', `/verify/PK-CERT-${ref}`);
  assert.equal(r.j.valid, true);
  assert.equal(r.j.customer, 'N••• K•••••', 'name masked');
  assert.equal(r.j.city, 'Jaipur');
  assert.ok(!('phone' in r.j) && !('address' in r.j), 'no private data');
  assert.equal(r.j.warranty_status.active, true);
  r = await call('GET', '/verify/NOPE123');
  assert.equal(r.s, 404);
});

const SITE = `http://127.0.0.1:${PORT}`;
const builtSite = fs.existsSync(path.join(ROOT, '../frontend/dist-ssr/entry-server.js'));
test('search engines: pre-rendered pages, 404s, redirects, sitemap and robots', { skip: !builtSite && 'run "npm run build" in frontend first' }, async () => {
  const page = async (p) => { const r = await fetch(SITE + p, { redirect: 'manual' }); return { s: r.status, loc: r.headers.get('location'), h: await r.text() }; };
  const title = (h) => (/<title>(.*?)<\/title>/.exec(h) || [])[1];

  const kota = await page('/pest-control/kota');
  assert.equal(kota.s, 200);
  assert.match(title(kota.h), /Pest Control in Kota/);
  assert.match(kota.h, /<h1>Pest control in <!-- -->Kota<\/h1>/, 'content is in the HTML, not only after JavaScript');
  assert.match(kota.h, new RegExp(`<link rel="canonical" href="${SITE}/pest-control/kota"`));
  assert.ok(!kota.h.includes('__PK_SITE_URL__'), 'site address placeholder is filled in');
  const ld = [...kota.h.matchAll(/<script type="application\/ld\+json" data-pk-seo>(.*?)<\/script>/g)].map((m) => JSON.parse(m[1])['@type']);
  assert.deepEqual(ld.sort(), ['BreadcrumbList', 'FAQPage', 'Service']);

  const missing = await page('/no-such-page');
  assert.equal(missing.s, 404);
  assert.match(missing.h, /noindex/);
  assert.equal((await page('/pest-control/atlantis')).s, 404);

  assert.deepEqual(await page('/jaipur').then((r) => [r.s, r.loc]), [301, '/pest-control/jaipur']);
  assert.deepEqual(await page('/kota/').then((r) => [r.s, r.loc]), [301, '/pest-control/kota']);
  assert.deepEqual(await page('/about/?x=1').then((r) => [r.s, r.loc]), [301, '/about?x=1']);

  const login = await page('/login');
  assert.equal(login.s, 200);
  assert.match(login.h, /noindex/);
  assert.ok(!login.h.includes('rel="canonical"'));

  const sitemap = await (await fetch(`${SITE}/sitemap.xml`)).text();
  assert.match(sitemap, new RegExp(`<loc>${SITE}/pest-control/jaipur</loc>`));
  assert.match(sitemap, /<loc>[^<]*\/shop\/[a-z0-9-]+<\/loc>/, 'shop products are listed');
  assert.ok(!sitemap.includes('/login') && !sitemap.includes('/admin'));
  const robots = await (await fetch(`${SITE}/robots.txt`)).text();
  assert.match(robots, new RegExp(`Sitemap: ${SITE}/sitemap.xml`));

  const products = await (await fetch(`${B}/products`)).json();
  const list = Array.isArray(products) ? products : products.products;
  const prod = await page(`/shop/${list[0].slug}`);
  assert.equal(prod.s, 200);
  assert.ok(title(prod.h).includes(list[0].name.replace(/&/g, '&amp;')), title(prod.h));
  assert.equal((await page('/shop/not-a-real-product')).s, 404);
});
