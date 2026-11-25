// Model provider adapter for PestKill AI. Routes call only `aiConfig()` and `complete()`, so the
// provider can change without touching the rest of the code.
//
// Configuration (server-side environment variables only; never sent to the browser):
//   AI_PROVIDER         google | anthropic. Default: google when GEMINI_API_KEY is set, else anthropic.
//   GEMINI_API_KEY      Google AI Studio key (Gemma 4 on the Gemini API; free tier).
//   GOOGLE_AI_MODEL     default gemma-4-26b-a4b-it; GOOGLE_AI_FALLBACK_MODEL default gemma-4-31b-it ('none' to disable)
//   GOOGLE_AI_THINKING  minimal (default, fastest) | low | medium | high
//   ANTHROPIC_API_KEY   Claude via the Anthropic API (paid).
//   AI_MODEL            Claude model, default claude-opus-5-5
//   AI_EFFORT           Claude effort: low | medium | high (default medium)
//   GOOGLE_AI_BASE_URL / ANTHROPIC_BASE_URL  optional (used by the automated tests' local stand-ins)
import Anthropic from '@anthropic-ai/sdk';

const DEFAULT_CLAUDE = 'claude-opus-5-5';
// The 26B A4B model answers in seconds on the free tier; the 31B model is the fallback when it is
// overloaded (Google returns 503 "high demand").
const DEFAULT_GEMMA = 'gemma-4-26b-a4b-it';
const FALLBACK_GEMMA = 'gemma-4-31b-it';

export class AiUnavailableError extends Error {
  constructor(message, code = 'AI_UNAVAILABLE', status = 503) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

/**
 * The Gemini key as Google expects it. Tolerates common paste mistakes in hosting dashboards:
 * surrounding quotes or spaces, or a whole line such as  process.env.GEMINI_API_KEY = "AIza…" .
 */
export const geminiKey = () => {
  const raw = String(process.env.GEMINI_API_KEY || '');
  const google = /AIza[0-9A-Za-z_-]{30,}/.exec(raw);
  if (google) return google[0];
  return raw.replace(/^\s*(process\.env\.)?GEMINI_API_KEY\s*[=:]\s*/i, '').trim().replace(/^['"`]+|['"`;]+$/g, '').trim();
};

/** Upstream error text that is safe to show staff (never contains the key). */
const safeDetail = (status, msg) => `HTTP ${status}${msg ? `: ${String(msg).replace(/AIza[0-9A-Za-z_-]{10,}/g, '[key]').replace(/key=[^&\s]+/g, 'key=[key]').slice(0, 240)}` : ''}`;

const providerName = () => {
  const p = String(process.env.AI_PROVIDER || '').toLowerCase();
  if (p === 'google' || p === 'anthropic') return p;
  return geminiKey() ? 'google' : 'anthropic';
};

export const aiConfig = () => {
  const provider = providerName();
  if (provider === 'google') {
    return {
      provider: 'google',
      configured: Boolean(geminiKey()),
      model: process.env.GOOGLE_AI_MODEL || DEFAULT_GEMMA,
      fallbackModel: process.env.GOOGLE_AI_FALLBACK_MODEL === 'none' ? null : (process.env.GOOGLE_AI_FALLBACK_MODEL || FALLBACK_GEMMA),
      // Google's free tier may use submitted content to improve its products, so personal details
      // (names, addresses, phone numbers) are left out of what PestKill AI sends.
      limitPersonalData: true,
    };
  }
  return {
    provider: 'anthropic',
    configured: Boolean(process.env.ANTHROPIC_API_KEY),
    model: process.env.AI_MODEL || DEFAULT_CLAUDE,
    effort: ['low', 'medium', 'high'].includes(process.env.AI_EFFORT) ? process.env.AI_EFFORT : 'medium',
    limitPersonalData: false,
  };
};

const notConfigured = () => new AiUnavailableError('PestKill AI is not configured yet. The owner needs to add an API key on the server.', 'AI_NOT_CONFIGURED');

/* ---------------- Anthropic (Claude) ---------------- */
let client = null;
let clientKey = null;
const getClient = () => {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw notConfigured();
  if (!client || clientKey !== key) {
    client = new Anthropic({ apiKey: key, maxRetries: 2, timeout: 90_000 });
    clientKey = key;
  }
  return client;
};

const completeAnthropic = async ({ system, messages, maxTokens }) => {
  const cfg = aiConfig();
  const api = getClient();
  let res;
  try {
    res = await api.beta.messages.create({
      model: cfg.model,
      max_tokens: maxTokens,
      // The large instruction block is identical on every call, so it is cached.
      system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
      messages,
      output_config: { effort: cfg.effort },
      // If the model declines on a safety classifier, the API retries on a fallback model.
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
    });
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError || e instanceof Anthropic.PermissionDeniedError) {
      throw new AiUnavailableError('PestKill AI is not available: the server API key was rejected.', 'AI_AUTH');
    }
    if (e instanceof Anthropic.RateLimitError) throw new AiUnavailableError('PestKill AI is busy right now. Please try again in a minute.', 'AI_RATE_LIMIT', 429);
    if (e instanceof Anthropic.BadRequestError) throw new AiUnavailableError('PestKill AI could not process this request.', 'AI_BAD_REQUEST', 400);
    if (e instanceof Anthropic.APIConnectionError) throw new AiUnavailableError('PestKill AI could not be reached. Please try again.', 'AI_CONNECTION');
    if (e instanceof Anthropic.APIError) throw new AiUnavailableError('PestKill AI had a problem answering. Please try again.', 'AI_UPSTREAM', 502);
    throw e;
  }
  const refused = res.stop_reason === 'refusal';
  return {
    text: refused ? '' : (res.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim(),
    model: res.model || cfg.model,
    refused,
    truncated: res.stop_reason === 'max_tokens',
    usage: { input: res.usage?.input_tokens ?? null, output: res.usage?.output_tokens ?? null, cacheRead: res.usage?.cache_read_input_tokens ?? null },
  };
};

/* ---------------- Google (Gemma 4 on the Gemini API) ---------------- */
// Converts the shared message format ({ role, content: string | [{type:'text'|'image'}] }) to
// Gemini "contents".
const toGeminiContents = (messages) => messages.map((m) => ({
  role: m.role === 'assistant' ? 'model' : 'user',
  parts: (typeof m.content === 'string' ? [{ type: 'text', text: m.content }] : m.content).map((b) => (b.type === 'image'
    ? { inline_data: { mime_type: b.source.media_type, data: b.source.data } }
    : { text: b.text })),
}));

const googleCall = async (model, body, timeoutMs) => {
  const base = (process.env.GOOGLE_AI_BASE_URL || 'https://generativelanguage.googleapis.com').replace(/\/$/, '');
  let res;
  try {
    res = await fetch(`${base}/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': geminiKey() },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (e) {
    // Timeouts and network failures are treated like an overloaded model (retry / fall back).
    return { status: 599, json: { error: { message: e?.name === 'TimeoutError' ? `No answer within ${Math.round(timeoutMs / 1000)} s` : 'Network error' } } };
  }
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
};

const completeGoogle = async ({ system, messages, maxTokens }) => {
  const cfg = aiConfig();
  if (!geminiKey()) throw notConfigured();
  const contents = toGeminiContents(messages);
  const thinking = ['minimal', 'low', 'medium', 'high'].includes(process.env.GOOGLE_AI_THINKING) ? process.env.GOOGLE_AI_THINKING : 'minimal';
  let generationConfig = { maxOutputTokens: Math.min(maxTokens, 8192), temperature: 0.3, thinkingConfig: { thinkingLevel: thinking } };
  const withSystem = { systemInstruction: { parts: [{ text: system }] }, contents, generationConfig };
  const withRules = { contents: [{ role: 'user', parts: [{ text: `${system}\n\n(These are your standing instructions.)` }] }, { role: 'model', parts: [{ text: 'Understood.' }] }, ...contents], generationConfig };
  const overloaded = (st) => st === 503 || st === 500 || st === 599;
  // Attempts: main model, main model again after a short pause, then the fallback model.
  const attempts = [[cfg.model, 0], [cfg.model, 1500], ...(cfg.fallbackModel && cfg.fallbackModel !== cfg.model ? [[cfg.fallbackModel, 0]] : [])];
  const started = Date.now();
  let status = 0;
  let json = {};
  let usedModel = cfg.model;
  for (const [model, pause] of attempts) {
    const left = 110_000 - (Date.now() - started);
    if (left < 8000) break;
    if (pause) await new Promise((r) => setTimeout(r, pause));
    usedModel = model;
    ({ status, json } = await googleCall(model, withSystem, Math.min(60_000, left)));
    // Some Gemma deployments reject system instructions: send the rules as the first user turn instead.
    // If a model does not accept the thinking setting, ask again without it.
    if (status === 400 && /thinking/i.test(json?.error?.message || '')) {
      generationConfig = { maxOutputTokens: generationConfig.maxOutputTokens, temperature: generationConfig.temperature };
      withSystem.generationConfig = generationConfig; withRules.generationConfig = generationConfig;
      ({ status, json } = await googleCall(model, withSystem, Math.min(60_000, left)));
    }
    if (status === 400 && /system|instruction/i.test(json?.error?.message || '')) ({ status, json } = await googleCall(model, withRules, Math.min(60_000, left)));
    if (!overloaded(status) && status !== 429) break;
    // Free-tier quotas are per model: on 429 skip straight to the other model.
    if (status === 429 && model === cfg.model && attempts.some(([m]) => m !== cfg.model)) attempts.splice(1, 1);
    console.warn(`[PestKill AI] ${model} unavailable (${safeDetail(status, json?.error?.message)}), trying again`);
  }
  if (status !== 200) {
    const msg = json?.error?.message || '';
    let err;
    if (status === 429) err = new AiUnavailableError('PestKill AI is busy right now (free usage limit reached). Please try again in a minute.', 'AI_RATE_LIMIT', 429);
    else if (status === 401 || status === 403 || /api key/i.test(msg)) err = new AiUnavailableError('PestKill AI is not available: the server API key was rejected.', 'AI_AUTH');
    else if (status === 404) err = new AiUnavailableError('PestKill AI is not available: the AI model was not found.', 'AI_MODEL', 503);
    else if (status === 400) err = new AiUnavailableError('PestKill AI could not process this request.', 'AI_BAD_REQUEST', 400);
    else if (overloaded(status)) err = new AiUnavailableError('PestKill AI is very busy right now (Google’s free AI service is overloaded). Please try again in a minute.', 'AI_BUSY', 503);
    else err = new AiUnavailableError('PestKill AI had a problem answering. Please try again.', 'AI_UPSTREAM', 502);
    err.detail = safeDetail(status, msg);
    console.warn(`[PestKill AI] Google ${err.code} ${err.detail}`);
    throw err;
  }
  const cand = json.candidates?.[0];
  const blocked = Boolean(json.promptFeedback?.blockReason) || cand?.finishReason === 'SAFETY' || cand?.finishReason === 'PROHIBITED_CONTENT';
  const text = (cand?.content?.parts || []).filter((p) => typeof p.text === 'string' && !p.thought).map((p) => p.text).join('').trim();
  return {
    text: blocked ? '' : text,
    model: json.modelVersion || usedModel,
    refused: blocked,
    truncated: cand?.finishReason === 'MAX_TOKENS',
    usage: { input: json.usageMetadata?.promptTokenCount ?? null, output: json.usageMetadata?.candidatesTokenCount ?? null, cacheRead: json.usageMetadata?.cachedContentTokenCount ?? null },
  };
};

/**
 * One model call.
 *   system:   stable instructions
 *   messages: [{ role: 'user'|'assistant', content: string | ContentBlock[] }]
 * Returns { text, model, usage: { input, output, cacheRead }, refused, truncated }.
 */
export const complete = async ({ system, messages, maxTokens = 16000 }) => {
  const out = aiConfig().provider === 'google' ? await completeGoogle({ system, messages, maxTokens }) : await completeAnthropic({ system, messages, maxTokens });
  if (out.refused) out.text = 'I can’t help with that request. For anything about treatments or products, please talk to our team.';
  if (!out.text) out.text = 'I could not produce an answer. Please rephrase your question or contact our team.';
  return out;
};
