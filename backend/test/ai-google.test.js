// PestKill AI on Google's Gemma (Gemini API). The real server talks to a local stand-in for
// generativelanguage.googleapis.com, so the request format, privacy limits and error handling are
// checked without calling Google.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 6260 + Math.floor(Math.random() * 300);
const B = `http://127.0.0.1:${PORT}/api`;
const PNG = `data:image/png;base64,${Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64').toString('base64')}`;

let scenario = 'ok';
const seen = [];
const fake = http.createServer((req, res) => {
  let body = '';
  req.on('data', (c) => { body += c; });
  req.on('end', () => {
    const b = JSON.parse(body || '{}');
    seen.push({ path: req.url, headers: req.headers, body: b });
    const send = (status, json) => { res.writeHead(status, { 'content-type': 'application/json' }); res.end(JSON.stringify(json)); };
    if (scenario === 'nosystem' && b.systemInstruction) return send(400, { error: { code: 400, message: 'Developer instruction is not enabled for models/gemma-4-31b-it', status: 'INVALID_ARGUMENT' } });
    if (scenario === 'busy-all' || (scenario === 'busy-main' && req.url.includes('26b'))) return send(503, { error: { code: 503, message: 'This model is currently experiencing high demand.', status: 'UNAVAILABLE' } });
    if (scenario === 'rate') return send(429, { error: { code: 429, message: 'Resource has been exhausted (e.g. check quota).', status: 'RESOURCE_EXHAUSTED' } });
    if (scenario === 'badkey') return send(400, { error: { code: 400, message: 'API key not valid. Please pass a valid API key.', status: 'INVALID_ARGUMENT' } });
    if (scenario === 'safety') return send(200, { candidates: [{ finishReason: 'SAFETY', content: { parts: [] } }] });
    return send(200, {
      candidates: [{ finishReason: 'STOP', content: { role: 'model', parts: [{ text: 'thinking…', thought: true }, { text: 'A 2BHK costs ₹1,500 plus GST [S2].' }] } }],
      usageMetadata: { promptTokenCount: 900, candidatesTokenCount: 30 }, modelVersion: 'gemma-4-31b-it',
    });
  });
});
const last = () => seen[seen.length - 1];
const allText = (r) => JSON.stringify(r.body.contents) + JSON.stringify(r.body.systemInstruction || '');

let server;
let log = '';
const call = async (method, p, body, token, headers = {}) => {
  const r = await fetch(B + p, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers }, body: body ? JSON.stringify(body) : undefined });
  let j = null;
  try { j = await r.json(); } catch { /* empty */ }
  return { s: r.status, j };
};

before(async () => {
  await new Promise((r) => fake.listen(0, '127.0.0.1', r));
  server = spawn(process.execPath, ['src/server.js'], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(PORT), PGLITE_DIR: 'memory://', DATABASE_URL: '', RENDER: '', SITE_URL: '', NODE_ENV: 'test', JWT_SECRET: 'g'.repeat(40),
      OWNER_NAME: 'G Owner', OWNER_EMAIL: 'owner@g.test', OWNER_PASSWORD: 'OwnerPass123', GMAIL_USER: '', GMAIL_APP_PASSWORD: '', SMTP_USER: '', SMTP_PASS: '', EMAIL_OTP: 'on', RATE_LIMITS: 'off',
      AI_PROVIDER: '', ANTHROPIC_API_KEY: '', GEMINI_API_KEY: 'test-google-key', GOOGLE_AI_BASE_URL: `http://127.0.0.1:${fake.address().port}`, GOOGLE_AI_MODEL: '' },
  });
  server.stdout.on('data', (d) => { log += d; });
  server.stderr.on('data', (d) => { log += d; });
  for (let i = 0; i < 120; i += 1) {
    try { if ((await fetch(`${B}/health`)).ok) return; } catch { /* starting */ }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`server did not start:\n${log}`);
});
after(() => { server?.kill(); fake.close(); });

test('Gemma: chosen automatically with GEMINI_API_KEY; request format; thoughts hidden', async () => {
  const st = (await call('GET', '/ai/status')).j;
  assert.deepEqual([st.configured, st.provider, st.model, st.sharesWithProvider], [true, 'google', 'gemma-4-26b-a4b-it', true]);
  scenario = 'ok';
  const r = await call('POST', '/ai/chat', { message: '2BHK price?' });
  assert.equal(r.s, 200, JSON.stringify(r.j));
  assert.equal(r.j.message.content, 'A 2BHK costs ₹1,500 plus GST [S2].', 'thought parts are not shown');
  const req = last();
  assert.equal(req.path, '/v1beta/models/gemma-4-26b-a4b-it:generateContent');
  assert.equal(req.headers['x-goog-api-key'], 'test-google-key');
  assert.deepEqual(req.body.generationConfig.thinkingConfig, { thinkingLevel: 'minimal' });
  assert.match(req.body.systemInstruction.parts[0].text, /never state a pesticide dose/i);
  assert.equal(req.body.contents.at(-1).role, 'user');
  assert.match(req.body.contents.at(-1).parts[0].text, /2BHK ₹1,500/);
});

test('Gemma: photos go as inline data; personal details never leave the server', async () => {
  const phone = '9829066' + String(Math.floor(Math.random() * 900) + 100);
  const start = await call('POST', '/users/register/start', { name: 'Sunita Kumari', email: 'sunita.g@example.com', phone, password: 'Passw0rd!x' });
  const T = (await call('POST', '/users/register', { name: 'Sunita Kumari', email: 'sunita.g@example.com', phone, password: 'Passw0rd!x', otp: start.j.devCode })).j.token;
  const ref = (await call('POST', '/leads', { type: 'inspection', name: 'Sunita Kumari', phone, service: 'Termite Control', address: '22 Gopalpura Bypass', city: 'Jaipur' }, T)).j.ref;
  const r = await call('POST', '/ai/chat', { mode: 'identify', image: PNG, message: 'near my bed' }, T);
  assert.equal(r.s, 200, JSON.stringify(r.j));
  const parts = last().body.contents.at(-1).parts;
  assert.equal(parts[0].inline_data.mime_type, 'image/png');
  const sent = allText(last());
  assert.ok(sent.includes(ref), 'booking reference is included');
  for (const secret of ['Sunita', 'Gopalpura', phone, 'sunita.g@example.com']) assert.ok(!sent.includes(secret), `${secret} not sent to the provider`);

  const O = (await call('POST', '/users/login', { email: 'owner@g.test', password: 'OwnerPass123' })).j.token;
  assert.equal((await call('POST', '/ai/chat', { mode: 'insights', message: 'leads?' }, O)).s, 200);
  const ins = allText(last());
  assert.ok(ins.includes(ref) && !ins.includes('Sunita'), 'owner insights use references, not names');
});

test('Gemma: falls back when system instructions are refused; errors and safety blocks handled', async () => {
  scenario = 'nosystem';
  let r = await call('POST', '/ai/chat', { message: 'hello' });
  assert.equal(r.s, 200, JSON.stringify(r.j));
  assert.equal(last().body.systemInstruction, undefined);
  assert.match(last().body.contents[0].parts[0].text, /never state a pesticide dose/i, 'rules sent as the first turn instead');
  scenario = 'rate';
  r = await call('POST', '/ai/chat', { message: 'hello' });
  assert.deepEqual([r.s, r.j.code], [429, 'AI_RATE_LIMIT']);
  scenario = 'badkey';
  r = await call('POST', '/ai/chat', { message: 'hello' });
  assert.deepEqual([r.s, r.j.code], [503, 'AI_AUTH']);
  assert.doesNotMatch(JSON.stringify(r.j), /test-google-key/);
  scenario = 'safety';
  r = await call('POST', '/ai/chat', { message: 'hello' });
  assert.equal(r.j.message.refused, true);
  scenario = 'ok';
});

test('Gemma: owner connection test shows the provider error without the key; key paste mistakes are cleaned', async () => {
  const O = (await call('POST', '/users/login', { email: 'owner@g.test', password: 'OwnerPass123' })).j.token;
  scenario = 'ok';
  let r = await call('POST', '/ai/admin/test', null, O);
  assert.equal(r.j.ok, true);
  scenario = 'badkey';
  r = await call('POST', '/ai/admin/test', null, O);
  assert.deepEqual([r.j.ok, r.j.code], [false, 'AI_AUTH']);
  assert.match(r.j.detail, /HTTP 400: API key not valid/);
  assert.doesNotMatch(JSON.stringify(r.j), /test-google-key/);
  const ov = (await call('GET', '/ai/admin/overview', null, O)).j;
  assert.ok(ov.errors.some((e) => /AI_AUTH HTTP 400/.test(e.error)), 'the reason is kept for the owner');
  scenario = 'ok';
  const ph = '9829077' + String(Math.floor(Math.random() * 900) + 100);
  const T = (await call('POST', '/users/register/start', { name: 'Kavya Rathore', email: 'kavya.g@example.com', phone: ph, password: 'Passw0rd!x' })).j;
  const C = (await call('POST', '/users/register', { name: 'Kavya Rathore', email: 'kavya.g@example.com', phone: ph, password: 'Passw0rd!x', otp: T.devCode })).j.token;
  assert.ok(C, 'customer signed up');
  assert.equal((await call('POST', '/ai/admin/test', null, C)).s, 403, 'owner only');
  assert.equal((await call('POST', '/ai/admin/test')).s, 401);

  const { geminiKey } = await import('../src/ai/provider.js');
  const saved = process.env.GEMINI_API_KEY;
  const k = `AIza${'Q'.repeat(35)}`;
  for (const v of [k, ` ${k} `, `"${k}"`, `process.env.GEMINI_API_KEY = "${k}";`, `GEMINI_API_KEY=${k}`]) {
    process.env.GEMINI_API_KEY = v;
    assert.equal(geminiKey(), k, `cleaned: ${v.slice(0, 20)}`);
  }
  process.env.GEMINI_API_KEY = saved;
});

test('Gemma: when the main model is overloaded it retries, then answers from the fallback model', async () => {
  scenario = 'busy-main';
  const before = seen.length;
  const r = await call('POST', '/ai/chat', { message: 'hello' });
  assert.equal(r.s, 200, JSON.stringify(r.j));
  const paths = seen.slice(before).map((x) => x.path);
  assert.deepEqual(paths, ['/v1beta/models/gemma-4-26b-a4b-it:generateContent', '/v1beta/models/gemma-4-26b-a4b-it:generateContent', '/v1beta/models/gemma-4-31b-it:generateContent']);
  scenario = 'busy-all';
  const busy = await call('POST', '/ai/chat', { message: 'hello again' });
  assert.deepEqual([busy.s, busy.j.code], [503, 'AI_BUSY']);
  scenario = 'ok';
});
