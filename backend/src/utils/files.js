import { ValidationError } from './validate.js';

/**
 * Decodes a base64 data URL upload and checks its type and size.
 * Returns { mime, data } or throws a ValidationError with a friendly message.
 */
export const readDataUrl = (dataUrl, { types, maxBytes, label = 'file' }) => {
  const m = /^data:([a-z]+\/[a-z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/.exec(String(dataUrl || ''));
  if (!m || !types.includes(m[1])) {
    throw new ValidationError(`Upload the ${label} as ${types.map((t) => t.split('/')[1].toUpperCase().replace('JPEG', 'JPG')).join(', ')}.`);
  }
  const data = Buffer.from(m[2], 'base64');
  if (!data.length) throw new ValidationError(`The ${label} is empty.`);
  if (data.length > maxBytes) throw new ValidationError(`The ${label} is too large (max ${Math.round(maxBytes / 1024 / 1024)} MB).`);
  // Check the file really is what it says (magic bytes), not just its declared type.
  const head = data.subarray(0, 12);
  const ok = {
    'application/pdf': head.subarray(0, 5).toString('latin1') === '%PDF-',
    'image/jpeg': head[0] === 0xff && head[1] === 0xd8,
    'image/png': head.subarray(1, 4).toString('latin1') === 'PNG',
    'image/webp': head.subarray(0, 4).toString('latin1') === 'RIFF' && head.subarray(8, 12).toString('latin1') === 'WEBP',
  }[m[1]];
  if (ok === false) throw new ValidationError(`The ${label} file looks damaged or is not really a ${m[1].split('/')[1].toUpperCase()}.`);
  return { mime: m[1], data };
};
