import express from 'express';
import bcrypt from 'bcryptjs';
import db, { permissionsFor, audit, NOW } from '../db.js';
import { auth, signToken, rateLimit, ah } from '../middleware/rbac.js';
import { str, email, password, phone } from '../utils/validate.js';

const router = express.Router();
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });

export const publicUser = async (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  phone: u.phone,
  role: u.role,
  address: u.address ?? null,
  city: u.city ?? null,
  permissions: await permissionsFor(u),
});

// Registration always creates a client; staff accounts are created by the owner.
router.post('/register', authLimiter, ah(async (req, res) => {
  const name = str(req.body.name, { field: 'Name', min: 2, max: 80, required: true });
  const mail = email(req.body.email, { required: true });
  const mobile = phone(req.body.phone);
  const pass = password(req.body.password);
  if (await db.get('SELECT 1 FROM users WHERE email = ?', mail)) {
    return res.status(409).json({ error: 'An account with this email already exists.' });
  }
  const hash = await bcrypt.hash(pass, 12);
  const user = await db.get("INSERT INTO users (name, email, phone, password, role) VALUES (?, ?, ?, ?, 'client') RETURNING *", name, mail, mobile, hash);
  res.status(201).json({ user: await publicUser(user), token: signToken(user) });
}));

router.post('/login', authLimiter, ah(async (req, res) => {
  const mail = email(req.body.email, { required: true });
  const user = await db.get('SELECT * FROM users WHERE email = ?', mail);
  const ok = user && await bcrypt.compare(String(req.body.password || ''), user.password);
  if (!ok) return res.status(401).json({ error: 'Incorrect email or password.' });
  if (!user.is_active) return res.status(403).json({ error: 'This account has been suspended. Please contact support.' });
  await db.run(`UPDATE users SET last_login = ${NOW} WHERE id = ?`, user.id);
  if (user.role !== 'client') audit({ ip: req.ip, user }, 'auth.login', 'user', user.id);
  res.json({ user: await publicUser(user), token: signToken(user) });
}));

router.get('/profile', auth, ah(async (req, res) => {
  res.json(await publicUser(await db.get('SELECT * FROM users WHERE id = ?', req.user.id)));
}));

router.put('/profile', auth, ah(async (req, res) => {
  const name = str(req.body.name, { field: 'Name', min: 2, max: 80, required: true });
  const mobile = phone(req.body.phone);
  const address = str(req.body.address, { field: 'Address', max: 300 });
  const city = str(req.body.city, { field: 'City', max: 60 });
  const user = await db.get('UPDATE users SET name = ?, phone = ?, address = ?, city = ? WHERE id = ? RETURNING *', name, mobile, address, city, req.user.id);
  res.json(await publicUser(user));
}));

router.put('/password', auth, authLimiter, ah(async (req, res) => {
  const user = await db.get('SELECT * FROM users WHERE id = ?', req.user.id);
  if (!await bcrypt.compare(String(req.body.currentPassword || ''), user.password)) {
    return res.status(400).json({ error: 'Your current password is incorrect.' });
  }
  const hash = await bcrypt.hash(password(req.body.newPassword), 12);
  await db.run('UPDATE users SET password = ? WHERE id = ?', hash, user.id);
  audit(req, 'auth.password_changed', 'user', user.id);
  res.json({ message: 'Password updated.' });
}));

export default router;
