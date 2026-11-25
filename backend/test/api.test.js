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
      OWNER_NAME: 'Test Owner', OWNER_EMAIL: 'owner@test.local', OWNER_PASSWORD: 'OwnerPass123', GMAIL_USER: '', GMAIL_APP_PASSWORD: '', SMTP_USER: '', SMTP_PASS: '', EMAIL_OTP: 'on', RATE_LIMITS: process.env.KEEP_LIMITS ? '' : 'off', ANTHROPIC_API_KEY: '', ANTHROPIC_AUTH_TOKEN: '', ANTHROPIC_BASE_URL: '' },
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
  let premise = r.j.products.find((p) => p.slug === 'envu-premise-sc-250-ml');
  // Unchecked MRPs (from retailer listings) are "price on request" for customers until staff check the pack.
  assert.equal(premise.mrp, null, 'unverified MRP is not public');
  assert.equal((await call('GET', `/products/${premise.slug}`, null, O)).j.mrp, 1245, 'staff see the stored figure');
  const premiseIds = r.j.products.filter((p) => p.brand === 'Envu' && p.name === 'Premise SC').map((p) => p.id);
  r = await call('PATCH', '/products/bulk', { updates: premiseIds.map((id) => ({ id, mrpVerified: true })) }, O);
  assert.equal(r.s, 200, JSON.stringify(r.j));
  premise = (await call('GET', `/products/${premise.slug}`)).j;
  assert.equal(premise.mrp, 1245, 'verified MRP is public');
  const staffView = (await call('GET', `/products/${premise.slug}`, null, O)).j;
  assert.ok(staffView.mrp_verified_at, 'verification date recorded');

  const P = await register('Ravi Pest', 'pco@example.com');
  r = await call('POST', '/orders', { items: [{ productId: premise.id, quantity: 1 }], address: 'Shop 4, MI Road', city: 'Jaipur' }, P);
  assert.equal(r.s, 403, 'not approved yet');
  const validTill = new Date(Date.now() + 365 * 86400e3).toISOString().slice(0, 10);
  const firm = { firmName: 'Ravi Pest Control', licenceNo: 'RJ/PCO/123', licenceValidTill: validTill, address: 'Shop 4, MI Road', city: 'Jaipur', state: 'Rajasthan' };
  r = await call('POST', '/buyers/apply', firm, P);
  assert.equal(r.s, 400, 'licence copy is required');
  assert.match(r.j.error, /licence/);
  const fakePdf = `data:application/pdf;base64,${Buffer.from('not a pdf').toString('base64')}`;
  r = await call('POST', '/buyers/documents/licence', { dataUrl: fakePdf }, P);
  assert.equal(r.s, 400, 'file content is checked, not just its type');
  const pdf = `data:application/pdf;base64,${Buffer.from('%PDF-1.4\n% licence\n').toString('base64')}`;
  r = await call('POST', '/buyers/documents/licence', { dataUrl: pdf }, P);
  assert.equal(r.s, 201);
  r = await call('POST', '/buyers/apply', { ...firm, firmName: 'Chutiya Pest Control' }, P);
  assert.equal(r.s, 400, 'abusive firm name');
  r = await call('POST', '/buyers/apply', { ...firm, licenceValidTill: '2020-01-01' }, P);
  assert.equal(r.s, 400, 'expired licence');
  r = await call('POST', '/buyers/apply', { ...firm, gstin: '08ABCDE1234F1Z4' }, P);
  assert.match(r.j.error, /not valid/, 'GSTIN check digit');
  r = await call('POST', '/buyers/apply', { ...firm, gstin: '27AAPFU0939F1ZV', state: 'Rajasthan' }, P);
  assert.match(r.j.error, /registered in Maharashtra/, 'GSTIN state code');
  r = await call('POST', '/buyers/apply', { ...firm, gstin: '27AAPFU0939F1ZV', state: 'Maharashtra' }, P);
  assert.equal(r.s, 201, JSON.stringify(r.j));
  assert.equal(r.j.documents[0].kind, 'licence');
  const me = (await call('GET', '/admin/users?q=pco@example.com', null, O)).j[0];
  const doc = await fetch(`${B}/buyers/${me.id}/documents/licence`, { headers: { Authorization: `Bearer ${O}` } });
  assert.equal(doc.status, 200);
  assert.equal((await fetch(`${B}/buyers/${me.id}/documents/licence`, { headers: { Authorization: `Bearer ${P}` } })).status, 403, 'buyers cannot read other documents');
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

test('shop: pest filter, product page content, dose rate and datasheet downloads', async () => {
  let r = await call('GET', '/products?pest=termite');
  assert.equal(r.s, 200);
  assert.ok(r.j.products.length > 0 && r.j.products.every((p) => p.pests.includes('termite')), 'only termite products');
  assert.ok(r.j.pests.some((x) => x.key === 'termite' && x.n > 0), 'pest counts for the filter');
  const prod = r.j.products[0];

  r = await call('PUT', `/products/${prod.id}`, {
    howToUse: 'Dilute as per label.\nSpray along walls.', storageInfo: 'Cool, dry place.', targetPests: ['termite', 'ant'],
    faqs: [{ q: 'Is it odourless?', a: 'Low odour.' }], dosePerLitre: 2.5, solutionPerSqm: 5, doseNote: 'Post-construction',
  }, O);
  assert.equal(r.s, 200, JSON.stringify(r.j));
  assert.deepEqual(r.j.pests, ['termite', 'ant']);
  assert.equal(r.j.dose.per_litre, 2.5);
  assert.equal((await call('PUT', `/products/${prod.id}`, { targetPests: ['dragons'] }, O)).s, 400);
  assert.equal((await call('PUT', `/products/${prod.id}`, { dosePerLitre: -1 }, O)).s, 400);

  const pdf = `data:application/pdf;base64,${Buffer.from('%PDF-1.4\n% tds\n').toString('base64')}`;
  const doc = { productId: prod.id, kind: 'tds', title: 'Technical datasheet', version: '2.1' };
  assert.equal((await call('POST', '/documents', { ...doc, dataUrl: `data:application/pdf;base64,${Buffer.from('hello').toString('base64')}` }, O)).s, 400, 'not a real PDF');
  r = await call('POST', '/documents', { ...doc, dataUrl: pdf }, O);
  assert.equal(r.s, 201, JSON.stringify(r.j));
  const C = await register('Curious Client', 'curious@example.com');
  assert.equal((await call('POST', '/documents', { ...doc, kind: 'msds', dataUrl: pdf }, C)).s, 403, 'clients cannot upload');

  const page = await call('GET', `/products/${prod.slug}`);
  assert.equal(page.j.documents[0].kind, 'tds');
  assert.equal(page.j.documents[0].version, '2.1');
  assert.equal(page.j.faqs[0].q, 'Is it odourless?');
  const old = await fetch(`${B}/products/${prod.id}/documents/tds`, { redirect: 'manual' });
  assert.equal(old.status, 302, 'old links redirect to the new file URL');
  const file = await fetch(`${SITE}${page.j.documents[0].url}`);
  assert.equal(file.headers.get('content-type'), 'application/pdf');
  const lib = await call('GET', '/documents');
  assert.ok(lib.j.some((d) => d.product_id === prod.id && d.kind === 'tds'));
});

test('technical documents: metadata, visibility, replace, download name and delete', async () => {
  const prod = (await call('GET', '/products?brand=Envu')).j.products[0];
  const pdf = (t) => `data:application/pdf;base64,${Buffer.from(`%PDF-1.4\n% ${t}\n`).toString('base64')}`;
  let r = await call('POST', '/documents', { productId: prod.id, kind: 'msds', title: 'Safety data sheet', manufacturer: 'Envu', version: '1.0',
    issueDate: '2025-01-10', revisionDate: '2024-01-01', dataUrl: pdf('sds') }, O);
  assert.equal(r.s, 400, 'revision date before issue date');
  r = await call('POST', '/documents', { productId: prod.id, kind: 'msds', title: 'Safety data sheet', manufacturer: 'Envu', version: '1.0',
    issueDate: '2025-01-10', revisionDate: '2025-06-01', dataUrl: pdf('sds') }, O);
  assert.equal(r.s, 201);
  const sds = r.j;
  r = await call('POST', '/documents', { productId: prod.id, kind: 'certificate', title: 'Registration certificate', visibility: 'pco', dataUrl: pdf('cert') }, O);
  const cert = r.j;
  r = await call('POST', '/documents', { productId: prod.id, kind: 'other', title: 'Internal price note', visibility: 'staff', dataUrl: pdf('staff') }, O);
  const internal = r.j;

  const publicList = (await call('GET', `/documents?productId=${prod.id}`)).j.map((d) => d.id);
  assert.ok(publicList.includes(sds.id) && !publicList.includes(cert.id) && !publicList.includes(internal.id), 'visitors see public documents only');
  assert.equal((await fetch(`${B}/documents/${cert.id}/file`)).status, 404, 'PCO-only file hidden from visitors');
  const staffList = (await call('GET', `/documents?productId=${prod.id}`, null, O)).j.map((d) => d.id);
  assert.ok(staffList.includes(cert.id) && staffList.includes(internal.id));

  const dl = await fetch(`${B}/documents/${sds.id}/file?download=1`);
  assert.match(dl.headers.get('content-disposition'), /^attachment; filename=".*-msds-v1\.0\.pdf"$/);
  r = await call('PATCH', `/documents/${sds.id}`, { version: '1.1', revisionDate: '2025-09-01', dataUrl: pdf('sds v1.1') }, O);
  assert.equal(r.j.version, '1.1');
  assert.match(await (await fetch(`${B}/documents/${sds.id}/file`)).text(), /sds v1\.1/, 'file replaced');

  const M = await register('Doc Manager', 'docmanager@example.com');
  const mId = (await call('GET', '/admin/users?q=docmanager@example.com', null, O)).j[0].id;
  await call('PATCH', `/admin/users/${mId}`, { role: 'manager' }, O);
  await call('PUT', `/admin/managers/${mId}/permissions`, { permissions: ['products.view', 'products.edit'] }, O);
  assert.equal((await call('DELETE', `/documents/${internal.id}`, null, M)).s, 403, 'deleting needs products.delete');
  assert.equal((await call('DELETE', `/documents/${internal.id}`, null, O)).s, 200);
  assert.equal((await fetch(`${B}/documents/${internal.id}/file`, { headers: { Authorization: `Bearer ${O}` } })).status, 404);
});

test('dosage records: only verified label data reaches the calculator', async () => {
  const prod = (await call('GET', '/products?q=Premise')).j.products.find((p) => p.pack_size === '1 L');
  let r = await call('POST', '/doses', { productId: prod.id, activity: 'termite_pre', method: 'Soil treatment' }, O);
  assert.equal(r.s, 400, 'a dilution and at least one rate are required');
  r = await call('POST', '/doses', { productId: prod.id, activity: 'termite_pre', method: 'Soil treatment as per label',
    productPerLitre: 2, rateHorizontal: 5, rateRunning: 7.5, amountUnit: 'ml' }, O);
  assert.equal(r.s, 201, JSON.stringify(r.j));
  const rec = r.j;
  assert.equal(rec.status, 'unverified');
  let calc = await call('GET', '/doses/calculator?activity=termite_pre');
  assert.equal(calc.j.records.length, 0, 'unverified data is never offered');
  assert.equal(calc.j.pending, 1);

  assert.equal((await call('POST', `/doses/${rec.id}/verify`, { confirm: true }, O)).s, 400, 'a source is required');
  assert.equal((await call('POST', `/doses/${rec.id}/verify`, { sourceNote: 'Label revision 3, printed on 1 L pack', confirm: false }, O)).s, 400, 'explicit confirmation required');
  const C = await register('Not Staff', 'notstaff@example.com');
  assert.equal((await call('POST', `/doses/${rec.id}/verify`, { sourceNote: 'Label revision 3', confirm: true }, C)).s, 403);
  r = await call('POST', `/doses/${rec.id}/verify`, { sourceNote: 'Label revision 3, printed on 1 L pack', confirm: true }, O);
  assert.equal(r.j.status, 'verified');
  calc = await call('GET', '/doses/calculator?activity=termite_pre');
  assert.equal(calc.j.records.length, 1);
  assert.ok(calc.j.records[0].packs.some((p) => p.pack_size === '1 L'), 'pack sizes for the pack calculation');
  assert.equal((await call('GET', `/products/${prod.slug}`)).j.doses.length, 1);

  r = await call('PATCH', `/doses/${rec.id}`, { rateHorizontal: 4 }, O);
  assert.equal(r.j.status, 'unverified', 'changing a number needs re-verification');
  assert.equal((await call('GET', '/doses/calculator?activity=termite_pre')).j.records.length, 0);
  assert.equal((await call('DELETE', `/doses/${rec.id}`, null, O)).s, 200);
});

test('catalogue: rename a brand or category on all products', async () => {
  const before = (await call('GET', '/products?category=Adjuvants')).j.products.length;
  assert.ok(before > 0);
  let r = await call('PATCH', '/products/rename', { field: 'category', from: 'Adjuvants', to: 'Spray Adjuvants' }, O);
  assert.equal(r.j.updated, before);
  assert.equal((await call('GET', '/products?category=Spray%20Adjuvants')).j.products.length, before);
  r = await call('PATCH', '/products/rename', { field: 'category', from: 'Spray Adjuvants', to: 'Adjuvants' }, O);
  assert.equal(r.s, 200);
  assert.equal((await call('PATCH', '/products/rename', { field: 'brand', from: 'Nope', to: 'X Brand' }, O)).s, 404);
});

test('search engines: product and shop landing pages are rendered with full content', { skip: !builtSite && 'run "npm run build" in frontend first' }, async () => {
  const page = async (p) => { const r = await fetch(SITE + p, { redirect: 'manual' }); return { s: r.status, h: await r.text() }; };
  const prod = await page('/shop/envu-premise-sc-1-l');
  assert.equal(prod.s, 200);
  assert.match(prod.h, /<title>Envu Premise SC 1 L Price/);
  assert.match(prod.h, /<h1>Premise SC/, 'product name is in the HTML');
  assert.match(prod.h, /Poori jaankari/, 'Hinglish guide is in the HTML');
  assert.match(prod.h, /Imidacloprid 30\.5% SC/);
  assert.match(prod.h, /<script type="application\/json" id="pk-data">/, 'data for the first browser render');
  assert.ok(!/pco_price":\d/.test(prod.h), 'no trade prices in public HTML');
  const ld = [...prod.h.matchAll(/<script type="application\/ld\+json" data-pk-seo>(.*?)<\/script>/g)].map((m) => JSON.parse(m[1])['@type']);
  assert.ok(ld.includes('Product') && ld.includes('BreadcrumbList'));

  const termite = await page('/shop/pest/termite');
  assert.equal(termite.s, 200);
  assert.match(termite.h, /<title>Termite Control Chemicals Price List/);
  assert.match(termite.h, /Premise SC/, 'product list is in the HTML');
  assert.equal((await page('/shop/pest/dragons')).s, 404);
  const envu = await page('/shop/brand/envu');
  assert.match(envu.h, /Envu Pest Control Products/);
  assert.match(envu.h, /Maxforce/);

  const sitemap = await (await fetch(`${SITE}/sitemap.xml`)).text();
  assert.match(sitemap, /\/shop\/pest\/termite<\/loc>/);
  assert.match(sitemap, /\/shop\/brand\/kalyani<\/loc>/);
  const kota = await page('/pest-control/kota');
  assert.match(kota.h, /Pest control chemicals supply in <!-- -->Kota/);
});

test('passwords: reset by email code, old tokens signed out, no account enumeration', async () => {
  const T = await register('Meera Joshi', 'meera.reset@example.com');
  assert.equal((await call('GET', '/users/profile', null, T)).s, 200);

  const unknown = await call('POST', '/users/password/forgot', { email: 'nobody.here@example.com' });
  const known = await call('POST', '/users/password/forgot', { email: 'meera.reset@example.com' });
  assert.equal(unknown.s, 200);
  assert.equal(unknown.j.message, known.j.message, 'same answer whether or not the account exists');
  assert.equal(unknown.j.devCode, undefined);
  assert.match(known.j.devCode, /^\d{6}$/);

  let r = await call('POST', '/users/password/reset', { email: 'meera.reset@example.com', otp: known.j.devCode, newPassword: 'short' });
  assert.equal(r.s, 400, 'weak password rejected before the code is used');
  r = await call('POST', '/users/password/reset', { email: 'meera.reset@example.com', otp: '000000', newPassword: 'MeeraNew#2026' });
  assert.equal(r.s, 400);
  r = await call('POST', '/users/password/reset', { email: 'meera.reset@example.com', otp: known.j.devCode, newPassword: 'MeeraNew#2026' });
  assert.equal(r.s, 200, JSON.stringify(r.j));
  assert.ok(r.j.token);
  assert.equal((await call('GET', '/users/profile', null, T)).s, 401, 'token from before the reset no longer works');
  assert.equal((await call('GET', '/users/profile', null, r.j.token)).s, 200);
  assert.equal((await call('POST', '/users/password/reset', { email: 'meera.reset@example.com', otp: known.j.devCode, newPassword: 'Another#2026' })).s, 400, 'code cannot be reused');

  // Changing the password while logged in signs out other devices but keeps this one.
  const other = (await call('POST', '/users/login', { email: 'meera.reset@example.com', password: 'MeeraNew#2026' })).j.token;
  const changed = await call('PUT', '/users/password', { currentPassword: 'MeeraNew#2026', newPassword: 'MeeraThird#2026' }, r.j.token);
  assert.equal(changed.s, 200);
  assert.equal((await call('GET', '/users/profile', null, other)).s, 401);
  assert.equal((await call('GET', '/users/profile', null, changed.j.token)).s, 200);
});

test('security headers: CSP on pages, nosniff and frame protection everywhere', { skip: !builtSite && 'run "npm run build" in frontend first' }, async () => {
  const page = await fetch(`${SITE}/`);
  const csp = page.headers.get('content-security-policy') || '';
  assert.match(csp, /default-src 'self'/);
  assert.match(csp, /script-src 'self' 'sha256-/, 'inline scripts allowed only by hash');
  assert.match(csp, /frame-ancestors 'none'/);
  assert.ok(!/unsafe-eval/.test(csp));
  const apiRes = await fetch(`${B}/health`);
  assert.equal(apiRes.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(apiRes.headers.get('x-frame-options'), 'DENY');
  assert.equal(apiRes.headers.get('x-powered-by'), null);
});

test('uploads: images are checked by content, not just by declared type', async () => {
  const p = (await call('GET', '/products')).j.products[0];
  const fakePng = `data:image/png;base64,${Buffer.from('<svg onload=alert(1)>').toString('base64')}`;
  const r = await call('PUT', `/products/${p.id}/image`, { dataUrl: fakePng }, O);
  assert.equal(r.s, 400, 'a script disguised as a PNG is rejected');
  const svg = await call('PUT', `/products/${p.id}/image`, { dataUrl: `data:image/svg+xml;base64,${Buffer.from('<svg/>').toString('base64')}` }, O);
  assert.equal(svg.s, 400, 'SVG (can carry scripts) is not accepted');
});

test('licences: exact numbers, validity hidden until verified, copy required to verify', async () => {
  let r = await call('GET', '/licences');
  const byKey = Object.fromEntries(r.j.map((l) => [l.key, l]));
  assert.equal(byKey.pco.number, 'PCO/Jaipur/DD/2025-26/68');
  assert.equal(byKey.sale.number, 'SL/Jaipur/DD/2025-26/63');
  assert.equal(byKey.pco.has_document, false);
  assert.equal(byKey.pco.valid_until, undefined, 'no validity shown before verification');

  r = await call('PATCH', `/licences/${byKey.pco.id}`, { issuingAuthority: 'Test authority', validFrom: '2025-04-01', validUntil: '2026-03-31' }, O);
  assert.equal(r.s, 200);
  assert.equal((await call('PATCH', `/licences/${byKey.pco.id}`, { status: 'verified' }, O)).s, 400, 'a licence copy is needed first');
  const C = await register('Licence Viewer', 'licview@example.com');
  assert.equal((await call('PATCH', `/licences/${byKey.pco.id}`, { status: 'verified' }, C)).s, 403);
  r = await call('PUT', `/licences/${byKey.pco.id}/document`, { dataUrl: `data:application/pdf;base64,${Buffer.from('%PDF-1.4\n% licence\n').toString('base64')}` }, O);
  assert.equal(r.s, 200);
  r = await call('PATCH', `/licences/${byKey.pco.id}`, { status: 'verified' }, O);
  assert.equal(r.j.status, 'verified');
  const pub = (await call('GET', '/licences')).j.find((l) => l.key === 'pco');
  assert.equal(pub.valid_until, '2026-03-31');
  // The licence copy is private: no public URL, a 5-minute owner-only link, every view logged.
  assert.equal(pub.document_url, undefined);
  assert.equal(pub.has_document, true);
  assert.equal((await fetch(`${B}/licences/${pub.id}/document`)).status, 403, 'no link, no file');
  assert.equal((await call('POST', `/licences/${pub.id}/document-link`, null, C)).s, 403, 'customers cannot get a link');
  const link = (await call('POST', `/licences/${pub.id}/document-link`, null, O)).j;
  assert.equal(link.expires_in, 300);
  const file = await fetch(`${SITE}${link.url}`);
  assert.equal(file.headers.get('content-type'), 'application/pdf');
  assert.match(file.headers.get('cache-control'), /no-store/);
  const other = (await call('GET', '/licences')).j.find((l) => l.key === 'sale');
  assert.equal((await fetch(`${B}/licences/${other.id}/document?${link.url.split('?')[1]}`)).status, 403, 'a link opens only its own licence');
  assert.equal((await fetch(`${B}/licences/${pub.id}/document?t=forged.token.value`)).status, 403);
  await new Promise((r) => setTimeout(r, 200)); // audit rows are written in the background
  const actions = (await call('GET', '/admin/audit', null, O)).j.map((l) => l.action);
  assert.ok(actions.includes('licence.document_link') && actions.includes('licence.document_view'), 'links and views are audit-logged');
  r = await call('PATCH', `/licences/${byKey.pco.id}`, { validUntil: '2027-03-31' }, O);
  assert.equal(r.j.status, 'unverified', 'changing validity needs a new verification');
  await call('PATCH', `/licences/${byKey.pco.id}`, { issuingAuthority: null, validFrom: null, validUntil: null }, O);
});

test('standards register and reference prices', async () => {
  const pub = (await call('GET', '/standards')).j;
  assert.ok(pub.some((s) => s.code === 'IS 6313 (Part 2) : 2001' && s.verification_status === 'archived_copy'));
  assert.ok(!pub.some((s) => /2022/.test(s.code)), 'unconfirmed editions are not published');
  const all = (await call('GET', '/standards/all', null, O)).j;
  assert.ok(all.some((s) => /2022/.test(s.code) && s.verification_status === 'not_confirmed'));
  assert.equal((await call('POST', '/standards', { code: 'IS X', title: 'Test', sourceUrl: 'ftp://x' }, O)).s, 400, 'https sources only');

  const refs = (await call('GET', '/reference-prices', null, O)).j;
  assert.equal(refs.length, 88);
  const premise = refs.find((x) => x.ref_name === 'Premise SC');
  assert.equal(premise.match_status, 'matched');
  assert.equal(premise.our_pack, '1 L');
  assert.equal(premise.displayed_price, 3900);
  assert.equal(refs.find((x) => x.ref_name === 'FLIGON').match_status, 'review', 'different names are never auto-matched');
  assert.equal((await call('GET', '/reference-prices')).s, 401, 'staff only');
  const before = (await call('GET', '/products?q=Premise')).j.products.find((p) => p.pack_size === '1 L').mrp;
  const r = await call('PATCH', `/reference-prices/${premise.id}`, { displayedPrice: 3800 }, O);
  assert.equal(r.j.displayed_price, 3800);
  assert.equal((await call('GET', '/products?q=Premise')).j.products.find((p) => p.pack_size === '1 L').mrp, before, 'our own price is never changed');
});

test('shop: formulation filter and missing-photo list', async () => {
  const sc = (await call('GET', '/products?formulation=SC')).j;
  assert.ok(sc.products.length > 0 && sc.products.every((p) => p.formulation === 'SC'));
  assert.ok(sc.formulations.some((f) => f.name === 'SC'));
  const missing = (await call('GET', '/products?photo=missing')).j.products;
  assert.ok(missing.every((p) => p.image_url === null));
});

test('orders: manual payment needs a reference; expired-product replacement with photos', async () => {
  const P = await register('Kiran Pest Care', 'kiran.pco@example.com');
  const pdf = `data:application/pdf;base64,${Buffer.from('%PDF-1.4\n% licence\n').toString('base64')}`;
  assert.equal((await call('POST', '/buyers/documents/licence', { dataUrl: pdf }, P)).s, 201);
  const validTill = new Date(Date.now() + 200 * 86400e3).toISOString().slice(0, 10);
  assert.equal((await call('POST', '/buyers/apply', { firmName: 'Kiran Pest Care', licenceNo: 'RJ/PCO/901', licenceValidTill: validTill, address: 'Shop 2, Tonk Road', city: 'Jaipur', state: 'Rajasthan' }, P)).s, 201);
  const me = (await call('GET', '/admin/users?q=kiran.pco@example.com', null, O)).j[0];
  assert.equal((await call('PATCH', `/buyers/${me.id}`, { status: 'approved' }, O)).j.status, 'approved');
  const prod = (await call('GET', '/products?q=Premise')).j.products.find((p) => p.pack_size === '1 L');
  const order = (await call('POST', '/orders', { items: [{ productId: prod.id, quantity: 2 }], address: 'Shop 2, Tonk Road', city: 'Jaipur', paymentMethod: 'upi' }, P)).j;
  assert.equal(order.payment_status, 'unpaid', 'new orders are never paid');

  // Payment: staff only, reference required.
  assert.equal((await call('PATCH', `/orders/${order.id}/payment`, { status: 'paid', reference: 'UTR123456' }, P)).s, 403);
  let r = await call('PATCH', `/orders/${order.id}/payment`, { status: 'paid' }, O);
  assert.equal(r.s, 400);
  assert.match(r.j.error, /UTR/);
  r = await call('PATCH', `/orders/${order.id}/payment`, { status: 'paid', reference: 'UTR123456789' }, O);
  assert.equal(r.j.payment_status, 'paid');
  assert.equal(r.j.payment_ref, 'UTR123456789');
  assert.ok(r.j.paid_at);

  // Replacement: only after delivery, only an item of the order, only if the expiry date has passed, photos required.
  const png = `data:image/png;base64,${Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64').toString('base64')}`;
  const claim = { orderId: order.id, productId: prod.id, batchNo: 'PRM2301', expiryDate: '2025-01-31', quantity: 1, photos: [png] };
  r = await call('POST', '/replacements', claim, P);
  assert.equal(r.s, 400, 'not delivered yet');
  await call('PATCH', `/orders/${order.id}`, { status: 'delivered' }, O);
  const future = new Date(Date.now() + 90 * 86400e3).toISOString().slice(0, 10);
  assert.match((await call('POST', '/replacements', { ...claim, expiryDate: future }, P)).j.error, /already expired when supplied/);
  assert.match((await call('POST', '/replacements', { ...claim, photos: [] }, P)).j.error, /photos/);
  const other = await register('Someone Else', 'someone.else@example.com');
  assert.equal((await call('POST', '/replacements', claim, other)).s, 404, 'only the buyer who ordered');
  r = await call('POST', '/replacements', claim, P);
  assert.equal(r.s, 201, JSON.stringify(r.j));
  assert.equal(r.j.status, 'pending');
  assert.equal(r.j.photos.length, 1);
  assert.equal((await call('POST', '/replacements', claim, P)).s, 400, 'one open request per product');
  const photo = await fetch(`${SITE}${r.j.photos[0]}`, { headers: { Authorization: `Bearer ${P}` } });
  assert.equal(photo.headers.get('content-type'), 'image/png');
  assert.equal((await fetch(`${SITE}${r.j.photos[0]}`, { headers: { Authorization: `Bearer ${other}` } })).status, 404, 'photos are private');
  assert.equal((await call('PATCH', `/replacements/${r.j.id}`, { status: 'rejected' }, O)).s, 400, 'a reason is required');
  const done = await call('PATCH', `/replacements/${r.j.id}`, { status: 'approved' }, O);
  assert.equal(done.j.status, 'approved');
  assert.equal((await call('GET', '/replacements/mine', null, P)).j[0].status, 'approved');
  assert.equal((await call('GET', '/replacements', null, P)).s, 403);
});

test('PCO eligibility needs an unexpired licence date, in approval as in ordering', async () => {
  const P = await register('Late Renewal', 'late.renewal@example.com');
  const pdf = `data:application/pdf;base64,${Buffer.from('%PDF-1.4\n% lic\n').toString('base64')}`;
  await call('POST', '/buyers/documents/licence', { dataUrl: pdf }, P);
  const r = await call('POST', '/buyers/apply', { firmName: 'Late Renewal Pest', licenceNo: 'RJ/PCO/55', licenceValidTill: '', address: 'Plot 4, Malviya Nagar', city: 'Jaipur', state: 'Rajasthan' }, P);
  assert.equal(r.s, 400, 'a validity date is required');
  const me = (await call('GET', '/buyers/me', null, P)).j;
  assert.ok(!me || me.status !== 'approved');
});

test('PestKill AI without an API key: says so, never returns a made-up answer', async () => {
  const st = (await call('GET', '/ai/status')).j;
  assert.equal(st.configured, false);
  assert.equal(st.model, null);
  const r = await call('POST', '/ai/chat', { message: 'How much is 2BHK pest control?' });
  assert.equal(r.s, 503);
  assert.equal(r.j.code, 'AI_NOT_CONFIGURED');
  assert.equal(r.j.message, undefined, 'no answer text');
  const q = (await call('POST', '/ai/quote', { service: 'general', size: '2BHK' })).j;
  assert.deepEqual([q.subtotal.min, q.gst.min, q.total.min], [1500, 270, 1770]);
});
