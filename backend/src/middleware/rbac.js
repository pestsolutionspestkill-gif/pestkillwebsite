import jwt from 'jsonwebtoken';
import db, { permissionsFor } from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_TTL = '7d';

export const signToken = (user) => jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: TOKEN_TTL });

const loadUser = (req) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;
  try {
    const { sub } = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT id, name, email, phone, role, is_active FROM users WHERE id = ?').get(sub);
    if (!user || !user.is_active) return null;
    user.permissions = permissionsFor(user);
    return user;
  } catch {
    return null;
  }
};

// Attaches req.user when a valid token is present, but never blocks the request.
export const optionalAuth = (req, _res, next) => {
  req.user = loadUser(req);
  next();
};

export const auth = (req, res, next) => {
  req.user = loadUser(req);
  if (!req.user) return res.status(401).json({ error: 'Please log in to continue.' });
  next();
};

export const requireRole = (...roles) => (req, res, next) => auth(req, res, () => {
  if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'You do not have access to this area.' });
  next();
});

export const ownerOnly = requireRole('owner');
export const staffOnly = requireRole('owner', 'manager');

// Owners pass every check; managers need the specific permission; clients never pass.
export const requirePermission = (...perms) => (req, res, next) => auth(req, res, () => {
  if (req.user.role === 'owner') return next();
  if (req.user.role === 'manager' && perms.some((p) => req.user.permissions.includes(p))) return next();
  return res.status(403).json({ error: 'You do not have permission for this action.' });
});

export const can = (user, perm) => user?.role === 'owner' || (user?.role === 'manager' && user.permissions.includes(perm));

// Minimal in-memory rate limiter for public form endpoints.
export const rateLimit = ({ windowMs, max }) => {
  const hits = new Map();
  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip;
    const entry = hits.get(key);
    if (!entry || now - entry.start > windowMs) {
      hits.set(key, { start: now, count: 1 });
      if (hits.size > 5000) hits.clear();
      return next();
    }
    entry.count += 1;
    if (entry.count > max) return res.status(429).json({ error: 'Too many requests. Please try again in a few minutes.' });
    next();
  };
};
