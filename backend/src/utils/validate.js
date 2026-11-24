import { checkMobile } from './antiAbuse.js';

export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.status = 400;
  }
}

export const str = (value, { field, min = 0, max = 500, required = false } = {}) => {
  const v = typeof value === 'string' ? value.trim() : value == null ? '' : String(value).trim();
  if (required && !v) throw new ValidationError(`${field} is required.`);
  if (v && v.length < min) throw new ValidationError(`${field} is too short.`);
  if (v.length > max) throw new ValidationError(`${field} is too long.`);
  return v || null;
};

// Exactly 10 digits (optional +91/91/0 prefix), starting 6–9, and not an obvious fake number.
export const phone = (value) => {
  try {
    return checkMobile(value);
  } catch (e) {
    throw new ValidationError(e.message);
  }
};

export const email = (value, { required = false } = {}) => {
  const v = str(value, { field: 'Email', max: 160, required });
  if (v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) throw new ValidationError('Please enter a valid email address.');
  return v ? v.toLowerCase() : null;
};

export const password = (value) => {
  const v = String(value || '');
  if (v.length < 8) throw new ValidationError('Password must be at least 8 characters.');
  if (v.length > 128) throw new ValidationError('Password is too long.');
  return v;
};

export const oneOf = (value, allowed, field) => {
  if (!allowed.includes(value)) throw new ValidationError(`Invalid ${field}.`);
  return value;
};

export const intId = (value) => {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) throw new ValidationError('Invalid id.');
  return n;
};
