import jwt from 'jsonwebtoken';
import db, { permissionsFor } from '../db.js';

const TOKEN_TTL = '7d';

// Set once at start-up (see resolveJwtSecret in db.js) before the server accepts requests.
let JWT_SECRET = null;
export const setJwtSecret = (secret) => {
  if (!secret || secret.length < 32) throw new Error('JWT secret must be at least 32 characters.');
  JWT_SECRET = secret;
};

// `tv` (token version) ties the token to the current password; changing the password signs out old tokens.
export const signToken = (user) => jwt.sign({ sub: user.id, tv: user.token_version || 0 }, JWT_SECRET, { expiresIn: TOKEN_TTL, algorithm: 'HS256' });

// The user is reloaded from the database on every request, so suspensions, role changes
// and permission changes take effect immediately.
const loadUser = async (req) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;
  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
  } catch {
    return null;
  }
  const user = await db.get('SELECT id, name, email, phone, role, is_active, token_version FROM users WHERE id = ?', Number(payload.sub));
  if (!user || !user.is_active) return null;
  if ((payload.tv || 0) !== (user.token_version || 0)) return null; // signed out by a password change
  user.permissions = await permissionsFor(user);
  return user;
};

// Attaches req.user when a valid token is present, but never blocks the request.
export const optionalAuth = async (req, _res, next) => {
  try {
    req.user = await loadUser(req);
    next();
  } catch (e) { next(e); }
};

const withUser = async (req, res, next, check) => {
  try {
    req.user = await loadUser(req);
  } catch (e) { return next(e); }
  if (!req.user) return res.status(401).json({ error: 'Please log in to continue.' });
  return check(req, res, next);
};

export const auth = (req, res, next) => withUser(req, res, next, (_q, _s, n) => n());

export const requireRole = (...roles) => (req, res, next) => withUser(req, res, next, (q, s, n) => {
  if (!roles.includes(q.user.role)) return s.status(403).json({ error: 'You do not have access to this area.' });
  return n();
});

export const ownerOnly = requireRole('owner');
export const staffOnly = requireRole('owner', 'manager');

// Owners pass every check; managers need one of the listed permissions; others never pass.
export const requirePermission = (...perms) => (req, res, next) => withUser(req, res, next, (q, s, n) => {
  if (q.user.role === 'owner') return n();
  if (q.user.role === 'manager' && perms.some((p) => q.user.permissions.includes(p))) return n();
  return s.status(403).json({ error: 'You do not have permission for this action.' });
});

export const can = (user, perm) => user?.role === 'owner' || (user?.role === 'manager' && user.permissions.includes(perm));

// Wraps an async route handler so rejected promises reach the error handler.
export const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Minimal in-memory rate limiter for public form endpoints.
export const rateLimit = ({ windowMs, max }) => {
  const hits = new Map();
  // Automated tests may switch limits off; never possible in production.
  const disabled = process.env.NODE_ENV === 'test' && process.env.RATE_LIMITS === 'off';
  return (req, res, next) => {
    if (disabled) return next();
    const now = Date.now();
    const key = req.ip;
    const entry = hits.get(key);
    if (!entry || now - entry.start > windowMs) {
      // Drop only expired entries when the table grows, so busy clients keep their counts.
      if (hits.size > 5000) for (const [k, v] of hits) if (now - v.start > windowMs) hits.delete(k);
      hits.set(key, { start: now, count: 1 });
      return next();
    }
    entry.count += 1;
    if (entry.count > max) return res.status(429).json({ error: 'Too many requests. Please try again in a few minutes.' });
    next();
  };
};
