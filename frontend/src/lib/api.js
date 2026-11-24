import { API_URL } from '../config';

const TOKEN_KEY = 'pk_token';

export const tokenStore = {
  // Guarded so the pages can also be pre-rendered on the server, where there is no localStorage.
  get: () => { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } },
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export const api = async (path, { method = 'GET', body, signal } = {}) => {
  const token = tokenStore.get();
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      signal,
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    if (e.name === 'AbortError') throw e;
    throw new ApiError('Cannot reach the server. Please check your connection and try again.', 0);
  }
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401 && token) window.dispatchEvent(new Event('pk:unauthorized'));
    throw new ApiError(data?.error || 'Something went wrong. Please try again.', res.status);
  }
  return data;
};

/* Website forms -------------------------------------------------------- */

const waLink = (number, text) => `https://wa.me/${number.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`;

/**
 * Saves a website request (booking, inspection, contact, quote).
 * If the server cannot be reached, falls back to WhatsApp so the enquiry is never lost.
 * Returns { ref } on success, or { fallback: true } when WhatsApp was used.
 */
export const submitLead = async (lead, { whatsappNumber, whatsappText }) => {
  try {
    return await api('/leads', { method: 'POST', body: lead });
  } catch (e) {
    if (e.status === 0 || e.status >= 500) {
      window.open(waLink(whatsappNumber, whatsappText), '_blank', 'noopener');
      return { fallback: true };
    }
    throw e;
  }
};

export { waLink };
