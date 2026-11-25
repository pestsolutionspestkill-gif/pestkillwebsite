// Model provider adapter for PestKill AI. The rest of the code calls only `aiProvider()`
// and `complete()`, so another provider can be added here without touching routes.
//
// Configuration (server-side environment variables only; never sent to the browser):
//   ANTHROPIC_API_KEY   required to enable PestKill AI
//   AI_MODEL            optional, defaults to claude-opus-5-5
//   AI_EFFORT           optional: low | medium | high (default medium)
//   ANTHROPIC_BASE_URL  optional (the SDK reads it; used by the automated tests' local stand-in API)
import Anthropic from '@anthropic-ai/sdk';

const DEFAULT_MODEL = 'claude-opus-5-5';

export class AiUnavailableError extends Error {
  constructor(message, code = 'AI_UNAVAILABLE', status = 503) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

let client = null;
let clientKey = null;

export const aiConfig = () => ({
  provider: 'anthropic',
  configured: Boolean(process.env.ANTHROPIC_API_KEY),
  model: process.env.AI_MODEL || DEFAULT_MODEL,
  effort: ['low', 'medium', 'high'].includes(process.env.AI_EFFORT) ? process.env.AI_EFFORT : 'medium',
});

const getClient = () => {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new AiUnavailableError('PestKill AI is not configured yet. The owner needs to add an API key on the server.', 'AI_NOT_CONFIGURED');
  if (!client || clientKey !== key) {
    client = new Anthropic({ apiKey: key, maxRetries: 2, timeout: 90_000 });
    clientKey = key;
  }
  return client;
};

/**
 * One model call.
 *   system:   stable instructions (cached)
 *   messages: [{ role: 'user'|'assistant', content: string | ContentBlock[] }]
 * Returns { text, model, usage: { input, output, cacheRead }, refused }.
 */
export const complete = async ({ system, messages, maxTokens = 16000 }) => {
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
  const text = refused
    ? 'I can’t help with that request. For anything about treatments or products, please talk to our team.'
    : (res.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim();
  return {
    text: text || 'I could not produce an answer. Please rephrase your question or contact our team.',
    model: res.model || cfg.model,
    refused,
    truncated: res.stop_reason === 'max_tokens',
    usage: { input: res.usage?.input_tokens ?? null, output: res.usage?.output_tokens ?? null, cacheRead: res.usage?.cache_read_input_tokens ?? null },
  };
};
