// Model provider adapter for PestKill AI. Routes call only `aiConfig()` and `complete()`, so the
// provider can change without touching the rest of the code.
//
// Configuration (server-side environment variables only; never sent to the browser):
//   AI_PROVIDER         google | anthropic. Default: google when GEMINI_API_KEY is set, else anthropic.
//   GEMINI_API_KEY      Google AI Studio key (Gemma 4 on the Gemini API; free tier).
//   GOOGLE_AI_MODEL     default gemma-4-31b-it (gemma-4-26b-a4b-it is the faster option)
//   ANTHROPIC_API_KEY   Claude via the Anthropic API (paid).
//   AI_MODEL            Claude model, default claude-opus-5-5
//   AI_EFFORT           Claude effort: low | medium | high (default medium)
//   GOOGLE_AI_BASE_URL / ANTHROPIC_BASE_URL  optional (used by the automated tests' local stand-ins)
import Anthropic from '@anthropic-ai/sdk';

const DEFAULT_CLAUDE = 'claude-opus-5-5';
const DEFAULT_GEMMA = 'gemma-4-31b-it';

export class AiUnavailableError extends Error {
  constructor(message, code = 'AI_UNAVAILABLE', status = 503) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

const providerName = () => {
  const p = String(process.env.AI_PROVIDER || '').toLowerCase();
  if (p === 'google' || p === 'anthropic') return p;
  return process.env.GEMINI_API_KEY ? 'google' : 'anthropic';
};

export const aiConfig = () => {
  const provider = providerName();
  if (provider === 'google') {
    return {
      provider: 'google',
      configured: Boolean(process.env.GEMINI_API_KEY),
      model: process.env.GOOGLE_AI_MODEL || DEFAULT_GEMMA,
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

const googleCall = async (cfg, body) => {
  const base = (process.env.GOOGLE_AI_BASE_URL || 'https://generativelanguage.googleapis.com').replace(/\/$/, '');
  let res;
  try {
    res = await fetch(`${base}/v1beta/models/${encodeURIComponent(cfg.model)}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(90_000),
    });
  } catch {
    throw new AiUnavailableError('PestKill AI could not be reached. Please try again.', 'AI_CONNECTION');
  }
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
};

const completeGoogle = async ({ system, messages, maxTokens }) => {
  const cfg = aiConfig();
  if (!process.env.GEMINI_API_KEY) throw notConfigured();
  const contents = toGeminiContents(messages);
  const generationConfig = { maxOutputTokens: Math.min(maxTokens, 8192), temperature: 0.3 };
  let { status, json } = await googleCall(cfg, { systemInstruction: { parts: [{ text: system }] }, contents, generationConfig });
  // Some Gemma deployments reject system instructions: send the rules as the first user turn instead.
  if (status === 400 && /system|instruction/i.test(json?.error?.message || '')) {
    const withRules = [{ role: 'user', parts: [{ text: `${system}\n\n(These are your standing instructions.)` }] }, { role: 'model', parts: [{ text: 'Understood.' }] }, ...contents];
    ({ status, json } = await googleCall(cfg, { contents: withRules, generationConfig }));
  }
  if (status !== 200) {
    const msg = json?.error?.message || '';
    if (status === 429) throw new AiUnavailableError('PestKill AI is busy right now (free usage limit reached). Please try again in a minute.', 'AI_RATE_LIMIT', 429);
    if (status === 401 || status === 403 || /api key/i.test(msg)) throw new AiUnavailableError('PestKill AI is not available: the server API key was rejected.', 'AI_AUTH');
    if (status === 400) throw new AiUnavailableError('PestKill AI could not process this request.', 'AI_BAD_REQUEST', 400);
    throw new AiUnavailableError('PestKill AI had a problem answering. Please try again.', 'AI_UPSTREAM', 502);
  }
  const cand = json.candidates?.[0];
  const blocked = Boolean(json.promptFeedback?.blockReason) || cand?.finishReason === 'SAFETY' || cand?.finishReason === 'PROHIBITED_CONTENT';
  const text = (cand?.content?.parts || []).filter((p) => typeof p.text === 'string' && !p.thought).map((p) => p.text).join('').trim();
  return {
    text: blocked ? '' : text,
    model: json.modelVersion || cfg.model,
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
