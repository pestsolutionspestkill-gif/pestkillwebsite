// PestKill AI API.
//   GET  /api/ai/status                 configured?, model, modes for this user
//   GET  /api/ai/search?q=              verified-knowledge search (works without an AI key)
//   POST /api/ai/quote                  deterministic estimate from the official price list
//   POST /api/ai/chat                   ask PestKill AI (text + optional photo)
//   GET  /api/ai/conversations          signed-in user's conversations
//   GET  /api/ai/conversations/:id      one conversation (owner, or a visitor holding its key)
//   POST /api/ai/messages/:id/feedback  helpful / not helpful
//   GET  /api/ai/admin/overview         owner: usage, errors and feedback
import crypto from 'node:crypto';
import express from 'express';
import db, { audit } from '../db.js';
import { optionalAuth, auth, ownerOnly, ah, rateLimit } from '../middleware/rbac.js';
import { str, oneOf, intId, ValidationError } from '../utils/validate.js';
import { readDataUrl } from '../utils/files.js';
import { aiConfig, complete, AiUnavailableError } from '../ai/provider.js';
import { search, coreSources } from '../ai/knowledge.js';
import { modesFor, customerContext, technicianContext, adminContext } from '../ai/context.js';
import { SYSTEM_PROMPT, formatSources } from '../ai/prompt.js';
import { estimate, QUOTE_SERVICES } from '../../../frontend/src/data/pricing.js';

const router = express.Router();
const MODES = ['assistant', 'identify', 'diagnose', 'quote', 'field', 'insights'];
const chatLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 20 });
const searchLimiter = rateLimit({ windowMs: 60 * 1000, max: 60 });
const DAILY_LIMIT = { visitor: Number(process.env.AI_DAILY_LIMIT_VISITOR) || 25, user: Number(process.env.AI_DAILY_LIMIT_USER) || 80, staff: Number(process.env.AI_DAILY_LIMIT_STAFF) || 300 };

const hash = (s) => crypto.createHash('sha256').update(String(s)).digest('hex').slice(0, 32);
const clientKey = (req) => (req.user ? `u:${req.user.id}` : `ip:${hash(req.ip)}`);

router.get('/status', optionalAuth, (req, res) => {
  const cfg = aiConfig();
  res.json({ configured: cfg.configured, provider: cfg.provider, model: cfg.configured ? cfg.model : null, modes: modesFor(req.user), signedIn: Boolean(req.user) });
});

router.get('/search', searchLimiter, ah(async (req, res) => {
  const q = str(req.query.q, { field: 'Search', max: 300 });
  if (!q) return res.json([]);
  res.json((await search(q, { k: 8 })).map(({ text, ...s }) => ({ ...s, snippet: text.slice(0, 280) })));
}));

router.post('/quote', searchLimiter, (req, res) => {
  const b = req.body || {};
  res.json(estimate({ service: b.service, size: b.size, areaSqft: b.areaSqft, propertyType: b.propertyType === 'business' ? 'business' : 'home' }));
});

/** Conversation access: the signed-in owner, or a visitor presenting the conversation's key. */
const loadConversation = async (req, id) => {
  const c = await db.get('SELECT * FROM ai_conversations WHERE id = ?', id);
  if (!c) return null;
  if (c.user_id) return req.user && req.user.id === c.user_id ? c : null;
  const key = String(req.get('x-ai-key') || '');
  return key && c.anon_key && key.length === c.anon_key.length && crypto.timingSafeEqual(Buffer.from(key), Buffer.from(c.anon_key)) ? c : null;
};

router.post('/chat', chatLimiter, optionalAuth, ah(async (req, res) => {
  const b = req.body || {};
  const mode = oneOf(b.mode || 'assistant', MODES, 'mode');
  if (!modesFor(req.user).includes(mode)) {
    return res.status(req.user ? 403 : 401).json({ error: mode === 'insights' ? 'Business insights are for the owner and managers.' : 'This assistant mode is for PestKill staff.' });
  }
  const message = str(b.message, { field: 'Message', max: 4000 }) || '';
  const image = b.image ? readDataUrl(b.image, { types: ['image/jpeg', 'image/png', 'image/webp'], maxBytes: 4 * 1024 * 1024, label: 'photo' }) : null;
  if (!message && !image) throw new ValidationError('Type a question or add a photo.');
  if (mode === 'identify' && !image) throw new ValidationError('Add a photo of the pest or the damage.');
  const lang = b.lang === 'hi' ? 'hi' : 'en';
  const page = str(b.page, { field: 'Page', max: 200 });

  // Daily cap per person / connection.
  const key = clientKey(req);
  const tier = !req.user ? 'visitor' : req.user.role === 'client' ? 'user' : 'staff';
  const used = (await db.get("SELECT COUNT(*)::int n FROM ai_usage WHERE client_key = ? AND created_at >= NOW() - interval '1 day'", key)).n;
  if (used >= DAILY_LIMIT[tier]) return res.status(429).json({ error: 'Daily PestKill AI limit reached. Please try again tomorrow, or call us on +91 6375338302.', code: 'AI_DAILY_LIMIT' });

  // Conversation: continue an existing one, or start a new one.
  let convo = null;
  let anonKey = null;
  if (b.conversationId) {
    convo = await loadConversation(req, intId(b.conversationId));
    if (!convo) return res.status(404).json({ error: 'Conversation not found.' });
  }
  const history = convo ? (await db.all('SELECT role, content FROM ai_messages WHERE conversation_id = ? ORDER BY id DESC LIMIT 12', convo.id)).reverse() : [];

  // Verified sources for this question (plus page context), and the person's own data.
  const query = [message, page, b.productSlug, mode === 'identify' ? 'pest identification termite cockroach bed bug ant rodent mosquito' : ''].filter(Boolean).join(' ');
  const found = await search(query, { k: 7 });
  const sources = [...await coreSources(), ...found.filter((s) => s.id !== 'business' && s.id !== 'pricing')];
  let account = 'Visitor (not signed in). No account records available.';
  if (req.user) {
    if (mode === 'insights') account = await adminContext();
    else if (mode === 'field') account = await technicianContext(req.user);
    else account = await customerContext(req.user);
  }
  let est = '';
  if (mode === 'quote' && b.quote) {
    const e = estimate({ service: b.quote.service, size: b.quote.size, areaSqft: b.quote.areaSqft, propertyType: b.quote.propertyType === 'business' ? 'business' : 'home' });
    est = `<estimate>${JSON.stringify(e)}</estimate>\n`;
  }

  const text = [
    `<request mode="${mode}" role="${req.user?.role || 'visitor'}" language="${lang}"${page ? ` page="${page.replace(/"/g, "'")}"` : ''}/>`,
    formatSources(sources),
    `<account>\n${account}\n</account>`,
    est,
    mode === 'identify' ? 'Identify the pest or evidence in the attached photo.' : '',
    message ? `Question: ${message}` : '',
  ].filter(Boolean).join('\n');
  const userContent = image
    ? [{ type: 'image', source: { type: 'base64', media_type: image.mime, data: image.data.toString('base64') } }, { type: 'text', text }]
    : text;
  const messages = [...history.map((h) => ({ role: h.role, content: h.content })), { role: 'user', content: userContent }];

  const started = Date.now();
  let out;
  try {
    out = await complete({ system: SYSTEM_PROMPT, messages, maxTokens: 16000 });
  } catch (e) {
    await db.run('INSERT INTO ai_usage (user_id, client_key, mode, ok, error, latency_ms) VALUES (?, ?, ?, 0, ?, ?)', req.user?.id ?? null, key, mode, e.code || e.message?.slice(0, 120), Date.now() - started);
    if (e instanceof AiUnavailableError) {
      return res.status(e.status).json({ error: e.message, code: e.code, sources: sources.slice(2).map(({ text: t, ...s }) => ({ ...s, snippet: t.slice(0, 200) })) });
    }
    throw e;
  }
  await db.run('INSERT INTO ai_usage (user_id, client_key, mode, model, input_tokens, output_tokens, cache_read_tokens, latency_ms) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    req.user?.id ?? null, key, mode, out.model, out.usage.input, out.usage.output, out.usage.cacheRead, Date.now() - started);

  if (!convo) {
    anonKey = req.user ? null : crypto.randomBytes(24).toString('hex');
    convo = await db.get('INSERT INTO ai_conversations (user_id, anon_key, mode, title) VALUES (?, ?, ?, ?) RETURNING *',
      req.user?.id ?? null, anonKey, mode, (message || 'Photo identification').slice(0, 80));
  }
  // Stored history keeps the question text only (photos are not stored).
  await db.run('INSERT INTO ai_messages (conversation_id, role, content, had_image) VALUES (?, ?, ?, ?)', convo.id, 'user', message || '(photo for identification)', image ? 1 : 0);
  const cited = sources.map((s, i) => ({ ref: `S${i + 1}`, title: s.title, url: s.url, kind: s.kind }));
  const reply = await db.get('INSERT INTO ai_messages (conversation_id, role, content, sources, model) VALUES (?, ?, ?, ?, ?) RETURNING id',
    convo.id, 'assistant', out.text, JSON.stringify(cited), out.model);
  await db.run('UPDATE ai_conversations SET updated_at = NOW() WHERE id = ?', convo.id);
  if (mode === 'insights') audit(req, 'ai.insights', 'ai_conversation', convo.id);

  res.json({
    conversationId: convo.id, ...(anonKey ? { conversationKey: anonKey } : {}),
    message: { id: reply.id, role: 'assistant', content: out.text, sources: cited.filter((c) => out.text.includes(`[${c.ref}]`)), refused: out.refused, truncated: out.truncated },
  });
}));

router.get('/conversations', auth, ah(async (req, res) => {
  res.json(await db.all('SELECT id, mode, title, updated_at FROM ai_conversations WHERE user_id = ? ORDER BY updated_at DESC LIMIT 50', req.user.id));
}));

router.get('/conversations/:id', optionalAuth, ah(async (req, res) => {
  const c = await loadConversation(req, intId(req.params.id));
  if (!c) return res.status(404).json({ error: 'Conversation not found.' });
  const msgs = await db.all('SELECT id, role, content, had_image, sources, created_at FROM ai_messages WHERE conversation_id = ? ORDER BY id', c.id);
  res.json({ id: c.id, mode: c.mode, title: c.title, messages: msgs.map((m) => ({ ...m, sources: m.sources ? JSON.parse(m.sources) : [] })) });
}));

router.post('/messages/:id/feedback', optionalAuth, ah(async (req, res) => {
  const m = await db.get("SELECT id, conversation_id FROM ai_messages WHERE id = ? AND role = 'assistant'", intId(req.params.id));
  if (!m || !await loadConversation(req, m.conversation_id)) return res.status(404).json({ error: 'Message not found.' });
  const rating = req.body?.helpful === true ? 1 : req.body?.helpful === false ? -1 : null;
  if (rating == null) throw new ValidationError('Say whether the answer was helpful.');
  const note = str(req.body?.note, { field: 'Note', max: 500 });
  await db.run(`INSERT INTO ai_feedback (message_id, user_id, rating, note) VALUES (?, ?, ?, ?)
    ON CONFLICT (message_id) DO UPDATE SET rating = EXCLUDED.rating, note = EXCLUDED.note`, m.id, req.user?.id ?? null, rating, note);
  res.json({ ok: true });
}));

router.get('/admin/overview', ownerOnly, ah(async (_req, res) => {
  const totals = await db.get(`SELECT COUNT(*)::int calls, COALESCE(SUM(CASE WHEN ok = 0 THEN 1 ELSE 0 END),0)::int errors,
    COALESCE(SUM(input_tokens),0)::bigint input_tokens, COALESCE(SUM(output_tokens),0)::bigint output_tokens, COALESCE(SUM(cache_read_tokens),0)::bigint cache_read_tokens,
    COALESCE(ROUND(AVG(latency_ms)),0)::int avg_latency FROM ai_usage WHERE created_at >= NOW() - interval '30 days'`);
  const byMode = await db.all("SELECT mode, COUNT(*)::int n FROM ai_usage WHERE created_at >= NOW() - interval '30 days' GROUP BY mode ORDER BY n DESC");
  const errors = await db.all("SELECT error, COUNT(*)::int n FROM ai_usage WHERE ok = 0 AND created_at >= NOW() - interval '30 days' GROUP BY error ORDER BY n DESC LIMIT 10");
  const feedback = await db.all(`SELECT f.rating, f.note, f.created_at, a.content AS answer,
      (SELECT content FROM ai_messages q WHERE q.conversation_id = a.conversation_id AND q.id < a.id AND q.role = 'user' ORDER BY q.id DESC LIMIT 1) AS question
    FROM ai_feedback f JOIN ai_messages a ON a.id = f.message_id ORDER BY f.created_at DESC LIMIT 30`);
  res.json({ config: { ...aiConfig(), apiKey: undefined }, totals: { ...totals, input_tokens: Number(totals.input_tokens), output_tokens: Number(totals.output_tokens), cache_read_tokens: Number(totals.cache_read_tokens) }, byMode, errors, feedback });
}));

router.get('/services', (_req, res) => res.json(Object.entries(QUOTE_SERVICES).map(([key, s]) => ({ key, label: s.label, unit: s.unit, rate: s.rate || null }))));

export default router;
