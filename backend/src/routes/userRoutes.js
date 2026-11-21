import express from 'express';
import bcrypt from 'bcryptjs';
import db, { permissionsFor, audit } from '../db.js';
import { auth, signToken, rateLimit } from '../middleware/rbac.js';
import { str, email, password, phone } from '../utils/validate.js';

const router = express.Router();
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });

export const publicUser = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  phone: u.phone,
  role: u.role,
  address: u.address ?? null,
  city: u.city ?? null,
  permissions: permissionsFor(u),
});

// Registration always creates a client; staff accounts are created by the owner.
router.post('/register', authLimiter, async (req, res, next) => {
  try {
    const name = str(req.body.name, { field: 'Name', min: 2, max: 80, required: true });
    const mail = email(req.body.email, { required: true });
    const mobile = phone(req.body.phone);
    const pass = password(req.body.password);
    if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(mail)) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }
    const hash = await bcrypt.hash(pass, 12);
    const { lastInsertRowid } = db.prepare("INSERT INTO users (name, email, phone, password, role) VALUES (?, ?, ?, ?, 'client')").run(name, mail, mobile, hash);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(lastInsertRowid);
    res.status(201).json({ user: publicUser(user), token: signToken(user) });
  } catch (e) { next(e); }
});

router.post('/login', authLimiter, async (req, res, next) => {
  try {
    const mail = email(req.body.email, { required: true });
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(mail);
    const ok = user && await bcrypt.compare(String(req.body.password || ''), user.password);
    if (!ok) return res.status(401).json({ error: 'Incorrect email or password.' });
    if (!user.is_active) return res.status(403).json({ error: 'This account has been suspended. Please contact support.' });
    db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);
    if (user.role !== 'client') audit({ ip: req.ip, user }, 'auth.login', 'user', user.id);
    res.json({ user: publicUser(user), token: signToken(user) });
  } catch (e) { next(e); }
});

router.get('/profile', auth, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  res.json(publicUser(user));
});

router.put('/profile', auth, (req, res, next) => {
  try {
    const name = str(req.body.name, { field: 'Name', min: 2, max: 80, required: true });
    const mobile = phone(req.body.phone);
    const address = str(req.body.address, { field: 'Address', max: 300 });
    const city = str(req.body.city, { field: 'City', max: 60 });
    db.prepare('UPDATE users SET name = ?, phone = ?, address = ?, city = ? WHERE id = ?').run(name, mobile, address, city, req.user.id);
    res.json(publicUser(db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)));
  } catch (e) { next(e); }
});

router.put('/password', auth, authLimiter, async (req, res, next) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    if (!await bcrypt.compare(String(req.body.currentPassword || ''), user.password)) {
      return res.status(400).json({ error: 'Your current password is incorrect.' });
    }
    const hash = await bcrypt.hash(password(req.body.newPassword), 12);
    db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hash, user.id);
    audit(req, 'auth.password_changed', 'user', user.id);
    res.json({ message: 'Password updated.' });
  } catch (e) { next(e); }
});

export default router;
