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
    // Server unreachable: never open a window here (it would be blocked after the await). The form
    // shows a "Send on WhatsApp" button instead, so the visitor's own tap opens WhatsApp.
    if (e.status === 0 || e.status >= 500) {
      const err = new ApiError('We could not reach our server, so your request was not saved. Tap the button to send the same details on WhatsApp.', e.status);
      err.waUrl = waLink(whatsappNumber, whatsappText);
      throw err;
    }
    throw e;
  }
};

export { waLink };

/* Files ---------------------------------------------------------------- */

/** Reads a chosen file as a base64 data URL (for PDF / document uploads). */
export const fileToDataUrl = (file, { maxMb = 5 } = {}) => new Promise((resolve, reject) => {
  if (!file) { reject(new Error('Choose a file.')); return; }
  if (file.size > maxMb * 1024 * 1024) { reject(new Error(`The file is too large (max ${maxMb} MB).`)); return; }
  const r = new FileReader();
  r.onload = () => resolve(r.result);
  r.onerror = () => reject(new Error('Could not read this file.'));
  r.readAsDataURL(file);
});

/** Opens a private file (sent only with the login token) in a new tab. */
export const openPrivateFile = async (path) => {
  const w = window.open('', '_blank'); // opened now, so pop-up blockers allow it
  try {
    const res = await fetch(`${API_URL}${path}`, { headers: { Authorization: `Bearer ${tokenStore.get()}` } });
    if (!res.ok) throw new Error('Could not open the file.');
    const url = URL.createObjectURL(await res.blob());
    if (w) w.location.href = url; else window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  } catch (err) {
    w?.close();
    throw err;
  }
};
