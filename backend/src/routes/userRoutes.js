import express from 'express';
import bcrypt from 'bcryptjs';
import db, { permissionsFor, audit, NOW } from '../db.js';
import { auth, signToken, rateLimit, ah } from '../middleware/rbac.js';
import { str, email, password, phone } from '../utils/validate.js';
import { checkPersonName, checkEmailDomain } from '../utils/antiAbuse.js';
import { issueOtp, verifyOtp } from '../utils/otp.js';
import { mailConfigured, isProduction, sendMail, otpEmail } from '../utils/mailer.js';

const router = express.Router();
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });
const otpLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 8 });

// Email OTP is on unless explicitly switched off (EMAIL_OTP=off, e.g. for automated tests).
const otpRequired = () => String(process.env.EMAIL_OTP || 'on').toLowerCase() !== 'off';
// DNS check that the email domain can receive mail: on in production, or when EMAIL_CHECK_MX=on.
const mxCheck = () => isProduction() || String(process.env.EMAIL_CHECK_MX || '').toLowerCase() === 'on';

export const publicUser = async (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  phone: u.phone,
  role: u.role,
  address: u.address ?? null,
  city: u.city ?? null,
  email_verified: Boolean(u.email_verified),
  permissions: await permissionsFor(u),
});

// Shared checks for both sign-up steps: real name, real mobile, deliverable non-temporary email, unused email and mobile.
const readSignup = async (body) => {
  const name = checkPersonName(body.name, 'Name');
  const mail = email(body.email, { required: true });
  const mobile = phone(body.phone);
  const pass = password(body.password);
  await checkEmailDomain(mail, { checkMx: mxCheck() });
  if (await db.get('SELECT 1 FROM users WHERE email = ?', mail)) throw Object.assign(new Error('An account with this email already exists. Please log in.'), { status: 409 });
  if (await db.get('SELECT 1 FROM users WHERE phone = ?', mobile)) throw Object.assign(new Error('An account with this mobile number already exists. Please log in.'), { status: 409 });
  return { name, mail, mobile, pass };
};

// Step 1: validate the details and email a 6-digit code.
router.post('/register/start', otpLimiter, ah(async (req, res) => {
  const { name, mail } = await readSignup(req.body || {});
  if (!otpRequired()) return res.json({ sent: false, otpRequired: false });
  if (!mailConfigured() && isProduction()) {
    console.error('Email OTP cannot be sent: set GMAIL_USER and GMAIL_APP_PASSWORD (or SMTP_*) in the environment.');
    return res.status(503).json({ error: 'Email verification is not available right now. Please contact us on WhatsApp to register.' });
  }
  const code = await issueOtp(mail, 'register');
  if (mailConfigured()) {
    try {
      await sendMail({ to: mail, ...otpEmail(code, name) });
    } catch (e) {
      console.error('OTP email failed:', e.message);
      await db.run("UPDATE email_otps SET last_sent = last_sent - interval '1 minute' WHERE email = ? AND purpose = 'register'", mail); // allow an immediate retry
      return res.status(502).json({ error: 'We could not send the email. Please check the address and try again.' });
    }
    return res.json({ sent: true, email: mail, expiresInMinutes: 10 });
  }
  // Local development without email set up: show the code in the server log and on screen.
  console.log(`[dev] Email OTP for ${mail}: ${code}`);
  res.json({ sent: true, email: mail, expiresInMinutes: 10, devCode: code });
}));

// Step 2: check the code and create the account (always a client; staff are created by the owner).
router.post('/register', authLimiter, ah(async (req, res) => {
  const { name, mail, mobile, pass } = await readSignup(req.body || {});
  if (otpRequired()) await verifyOtp(mail, 'register', req.body.otp);
  const hash = await bcrypt.hash(pass, 12);
  const user = await db.get("INSERT INTO users (name, email, phone, password, role, email_verified) VALUES (?, ?, ?, ?, 'client', ?) RETURNING *",
    name, mail, mobile, hash, otpRequired() ? 1 : 0);
  audit({ ip: req.ip, user }, 'auth.register', 'user', user.id, { emailVerified: otpRequired() });
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
  const name = checkPersonName(req.body.name, 'Name');
  const mobile = phone(req.body.phone);
  const address = str(req.body.address, { field: 'Address', max: 300 });
  const city = str(req.body.city, { field: 'City', max: 60 });
  if (await db.get('SELECT 1 FROM users WHERE phone = ? AND id <> ?', mobile, req.user.id)) {
    return res.status(409).json({ error: 'This mobile number is already used by another account.' });
  }
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
