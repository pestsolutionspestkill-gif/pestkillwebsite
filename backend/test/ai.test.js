// PestKill AI tests. Runs the real server against a local stand-in for the model API, so the whole
// request path (retrieval, role-scoped context, image handling, persistence, errors) is checked
// without calling a paid service. The stand-in only records requests and returns canned replies.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 5950 + Math.floor(Math.random() * 300);
const B = `http://127.0.0.1:${PORT}/api`;
const PNG = `data:image/png;base64,${Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64').toString('base64')}`;

// ---- Stand-in model API ----
let scenario = 'ok';
const seen = [];
const fake = http.createServer((req, res) => {
  let body = '';
  req.on('data', (c) => { body += c; });
  req.on('end', () => {
    seen.push({ path: req.url, headers: req.headers, body: JSON.parse(body || '{}') });
    const send = (status, json, extra = {}) => { res.writeHead(status, { 'content-type': 'application/json', 'x-should-retry': 'false', ...extra }); res.end(JSON.stringify(json)); };
    if (scenario === 'rate') return send(429, { type: 'error', error: { type: 'rate_limit_error', message: 'slow down' } });
    if (scenario === 'down') return send(529, { type: 'error', error: { type: 'overloaded_error', message: 'overloaded' } });
    if (scenario === 'badkey') return send(401, { type: 'error', error: { type: 'authentication_error', message: 'invalid x-api-key' } });
    return send(200, {
      id: 'msg_test', type: 'message', role: 'assistant', model: 'claude-opus-5-5',
      content: [{ type: 'text', text: scenario === 'refusal' ? '' : 'General pest control for a 2BHK is ₹1,500 plus GST [S2]. Book at /book.' }],
      stop_reason: scenario === 'refusal' ? 'refusal' : 'end_turn', stop_sequence: null,
      usage: { input_tokens: 1200, output_tokens: 40, cache_read_input_tokens: 900, cache_creation_input_tokens: 0 },
    });
  });
});
const last = () => seen[seen.length - 1];
const userText = (r) => {
  const c = r.body.messages.at(-1).content;
  return typeof c === 'string' ? c : c.filter((b) => b.type === 'text').map((b) => b.text).join('\n');
};

let server;
let log = '';
const call = async (method, p, body, token, headers = {}) => {
  const r = await fetch(B + p, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers }, body: body ? JSON.stringify(body) : undefined });
  let j = null;
  try { j = await r.json(); } catch { /* empty */ }
  return { s: r.status, j };
};
let phoneSeq = 0;
const register = async (name, email) => {
  const phone = `98291${String(24680 + (phoneSeq += 211)).padStart(5, '0')}`;
  const body = { name, email, phone, password: 'Passw0rd!x' };
  const start = await call('POST', '/users/register/start', body);
  return (await call('POST', '/users/register', { ...body, otp: start.j.devCode })).j.token;
};

before(async () => {
  await new Promise((r) => fake.listen(0, '127.0.0.1', r));
  server = spawn(process.execPath, ['src/server.js'], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(PORT), PGLITE_DIR: 'memory://', DATABASE_URL: '', RENDER: '', SITE_URL: '', NODE_ENV: 'test', JWT_SECRET: 'y'.repeat(40),
      OWNER_NAME: 'AI Owner', OWNER_EMAIL: 'owner@ai.test', OWNER_PASSWORD: 'OwnerPass123', GMAIL_USER: '', GMAIL_APP_PASSWORD: '', SMTP_USER: '', SMTP_PASS: '', EMAIL_OTP: 'on', RATE_LIMITS: 'off',
      ANTHROPIC_API_KEY: 'sk-test-local-stand-in', ANTHROPIC_BASE_URL: `http://127.0.0.1:${fake.address().port}`, AI_MODEL: '', AI_DAILY_LIMIT_VISITOR: '12' },
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

test('status: configured, default model, visitor modes exclude staff tools', async () => {
  const r = await call('GET', '/ai/status');
  assert.equal(r.j.configured, true);
  assert.equal(r.j.model, 'claude-opus-5-5');
  assert.deepEqual(r.j.modes, ['assistant', 'identify', 'diagnose', 'quote']);
});

test('chat: grounded request (cached rules, verified sources, prices, fallbacks), stored conversation, cited sources', async () => {
  scenario = 'ok';
  const r = await call('POST', '/ai/chat', { message: '2BHK pest control kitna hai?', lang: 'hi' });
  assert.equal(r.s, 200, JSON.stringify(r.j));
  const req = last();
  assert.equal(req.path, '/v1/messages');
  assert.equal(req.headers.authorization, 'Bearer sk-test-local-stand-in', 'key sent only server-to-server');
  assert.match(req.headers['anthropic-beta'] || '', /server-side-fallback-2026-07-01/);
  assert.equal(req.body.model, 'claude-opus-5-5');
  assert.equal(req.body.fallbacks, 'default');
  assert.deepEqual(req.body.system[0].cache_control, { type: 'ephemeral' });
  assert.match(req.body.system[0].text, /never state a pesticide dose/i);
  const t = userText(req);
  assert.match(t, /<source id="S2" kind="pricing"[\s\S]*2BHK ₹1,500[\s\S]*3BHK ₹1,800/);
  assert.match(t, /dispatched from Jaipur/);
  assert.match(t, /language="hi"/);
  assert.match(t, /Visitor \(not signed in\)/);
  assert.ok(r.j.conversationId && r.j.conversationKey);
  assert.deepEqual(r.j.message.sources.map((s) => s.ref), ['S2'], 'only sources the answer cites');

  // Continuing needs the conversation key; history is sent back to the model.
  assert.equal((await call('POST', '/ai/chat', { message: 'and 3BHK?', conversationId: r.j.conversationId })).s, 404);
  const r2 = await call('POST', '/ai/chat', { message: 'and 3BHK?', conversationId: r.j.conversationId }, null, { 'x-ai-key': r.j.conversationKey });
  assert.equal(r2.s, 200);
  assert.equal(last().body.messages.length, 3);
  const convo = await call('GET', `/ai/conversations/${r.j.conversationId}`, null, null, { 'x-ai-key': r.j.conversationKey });
  assert.equal(convo.j.messages.length, 4);
  assert.equal((await call('GET', `/ai/conversations/${r.j.conversationId}`)).s, 404, 'no key, no access');

  // Feedback.
  const msgId = r2.j.message.id;
  assert.equal((await call('POST', `/ai/messages/${msgId}/feedback`, { helpful: true })).s, 404);
  assert.equal((await call('POST', `/ai/messages/${msgId}/feedback`, { helpful: true }, null, { 'x-ai-key': r.j.conversationKey })).s, 200);
});

test('photos: sent to the model as an image block, validated, never stored', async () => {
  scenario = 'ok';
  assert.equal((await call('POST', '/ai/chat', { mode: 'identify', message: 'what is this?' })).s, 400, 'identify needs a photo');
  const fakePng = `data:image/png;base64,${Buffer.from('not really a png').toString('base64')}`;
  assert.equal((await call('POST', '/ai/chat', { mode: 'identify', image: fakePng })).s, 400, 'content is checked, not just the type');
  const pdf = `data:application/pdf;base64,${Buffer.from('%PDF-1.4').toString('base64')}`;
  assert.equal((await call('POST', '/ai/chat', { mode: 'identify', image: pdf })).s, 400);
  const r = await call('POST', '/ai/chat', { mode: 'identify', image: PNG, message: 'found near the door frame' });
  assert.equal(r.s, 200, JSON.stringify(r.j));
  const content = last().body.messages.at(-1).content;
  assert.equal(content[0].type, 'image');
  assert.equal(content[0].source.media_type, 'image/png');
  assert.match(content[1].text, /mode="identify"/);
  const convo = await call('GET', `/ai/conversations/${r.j.conversationId}`, null, null, { 'x-ai-key': r.j.conversationKey });
  assert.equal(convo.j.messages[0].had_image, 1);
  assert.doesNotMatch(JSON.stringify(convo.j), /iVBOR|base64/, 'the photo is not stored');
});

test('roles: customers see only their own records; staff tools are gated', async () => {
  scenario = 'ok';
  const A = await register('Meena Gupta', 'meena.ai@example.com');
  const Bt = await register('Rohan Das', 'rohan.ai@example.com');
  const la = (await call('POST', '/leads', { type: 'inspection', name: 'Meena Gupta', phone: '9829012345', service: 'Cockroach Control', address: '14 Shastri Nagar', city: 'Jaipur' }, A)).j.ref;
  const lb = (await call('POST', '/leads', { type: 'inspection', name: 'Rohan Das', phone: '9829054321', service: 'Termite Control', address: '9 Civil Lines', city: 'Ajmer' }, Bt)).j.ref;
  assert.ok(la && lb);
  const r = await call('POST', '/ai/chat', { message: 'What is the status of my booking?' }, A);
  assert.equal(r.s, 200);
  const t = userText(last());
  assert.ok(t.includes(la), 'own booking included');
  assert.ok(!t.includes(lb) && !t.includes('Rohan'), 'other customers never included');

  assert.equal((await call('POST', '/ai/chat', { mode: 'insights', message: 'leads?' })).s, 401);
  assert.equal((await call('POST', '/ai/chat', { mode: 'insights', message: 'leads?' }, A)).s, 403);
  assert.equal((await call('POST', '/ai/chat', { mode: 'field', message: 'jobs?' }, A)).s, 403);
  assert.equal((await call('GET', '/ai/admin/overview', null, A)).s, 403);

  const O = (await call('POST', '/users/login', { email: 'owner@ai.test', password: 'OwnerPass123' })).j.token;
  assert.ok((await call('GET', '/ai/status', null, O)).j.modes.includes('insights'));
  const ins = await call('POST', '/ai/chat', { mode: 'insights', message: 'Which leads need follow-up?' }, O);
  assert.equal(ins.s, 200);
  const it = userText(last());
  assert.match(it, /Business data \(read-only/);
  assert.ok(it.includes(la) && it.includes(lb), 'owner insights see all leads');
  const ov = await call('GET', '/ai/admin/overview', null, O);
  assert.ok(ov.j.totals.calls >= 5);
  assert.equal(ov.j.config.apiKey, undefined, 'the key is never returned');
  assert.equal(JSON.stringify(ov.j).includes('sk-test'), false);
  assert.ok(ov.j.feedback.length >= 1);
});

test('failures: refusals, rate limits, outages and bad keys are reported honestly', async () => {
  scenario = 'refusal';
  let r = await call('POST', '/ai/chat', { message: 'tell me something' });
  assert.equal(r.s, 200);
  assert.equal(r.j.message.refused, true);
  scenario = 'rate';
  r = await call('POST', '/ai/chat', { message: 'hello' });
  assert.equal(r.s, 429);
  assert.equal(r.j.code, 'AI_RATE_LIMIT');
  scenario = 'down';
  r = await call('POST', '/ai/chat', { message: 'hello' });
  assert.equal(r.s, 502);
  assert.equal(r.j.code, 'AI_UPSTREAM');
  scenario = 'badkey';
  r = await call('POST', '/ai/chat', { message: 'hello' });
  assert.equal(r.s, 503);
  assert.equal(r.j.code, 'AI_AUTH');
  assert.doesNotMatch(JSON.stringify(r.j), /x-api-key|sk-test|Bearer/);
  scenario = 'ok';
});

test('quote engine and knowledge search work without the model', async () => {
  const before = seen.length;
  let r = await call('POST', '/ai/quote', { service: 'termite_pre', areaSqft: 1000 });
  assert.deepEqual([r.j.subtotal.min, r.j.subtotal.max, r.j.gst.rate, r.j.total.max], [12000, 15000, 18, 17700]);
  r = await call('POST', '/ai/quote', { service: 'general', size: 'Larger' });
  assert.equal(r.j.ok, false);
  r = await call('POST', '/ai/quote', { service: 'general', size: '1BHK', propertyType: 'business' });
  assert.equal(r.j.ok, false, 'commercial sites are never priced as homes');
  r = await call('GET', `/ai/search?q=${encodeURIComponent('दीमक')}`);
  assert.ok(r.j.some((s) => s.kind === 'guide' && /दीमक/.test(s.title)));
  r = await call('GET', '/ai/search?q=replacement%20expired');
  assert.equal(r.j[0].url, '/replacement-policy');
  assert.equal(seen.length, before, 'no model calls');
});

test('daily limit per visitor', async () => {
  scenario = 'ok';
  let r;
  for (let i = 0; i < 15; i += 1) {
    r = await call('POST', '/ai/chat', { message: `question ${i}` });
    if (r.s === 429) break;
  }
  assert.equal(r.s, 429);
  assert.equal(r.j.code, 'AI_DAILY_LIMIT');
});
