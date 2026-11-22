// Must stay first: loads .env and validates secrets before any route module reads them.
import './env.js';
import express from 'express';
import cors from 'cors';
import compression from 'compression';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

import db, { initDb } from './db.js';
import userRoutes from './routes/userRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import leadRoutes from './routes/leadRoutes.js';
import careerRoutes from './routes/careerRoutes.js';
import serviceRoutes from './routes/serviceRoutes.js';
import complaintRoutes from './routes/complaintRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import jobRoutes from './routes/jobRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import { ah } from './middleware/rbac.js';

const PORT = process.env.PORT || 5000;
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173')
  .split(',').map((o) => o.trim().replace(/\/$/, '')).filter(Boolean);

// One-time owner bootstrap for hosts without a shell (e.g. Render free plan):
// set OWNER_NAME, OWNER_EMAIL, OWNER_PHONE, OWNER_PASSWORD. Runs only while no owner exists,
// so changing the password later from the website is never overwritten.
const bootstrapOwner = async () => {
  const { OWNER_EMAIL, OWNER_PASSWORD, OWNER_NAME, OWNER_PHONE } = process.env;
  if (!OWNER_EMAIL || !OWNER_PASSWORD) return;
  if (await db.get("SELECT 1 FROM users WHERE role = 'owner'")) return;
  if (OWNER_PASSWORD.length < 8) { console.error('OWNER_PASSWORD must be at least 8 characters; owner not created.'); return; }
  const email = OWNER_EMAIL.trim().toLowerCase();
  const hash = await bcrypt.hash(OWNER_PASSWORD, 12);
  const existing = await db.get('SELECT id FROM users WHERE email = ?', email);
  if (existing) await db.run("UPDATE users SET password = ?, role = 'owner', is_active = 1 WHERE id = ?", hash, existing.id);
  else await db.run("INSERT INTO users (name, email, phone, password, role) VALUES (?, ?, ?, ?, 'owner')", OWNER_NAME || 'Owner', email, String(OWNER_PHONE || '').replace(/\D/g, '').slice(-10) || null, hash);
  console.log(`Owner account ready: ${email}`);
};

const app = express();
app.disable('x-powered-by');
if (process.env.TRUST_PROXY) app.set('trust proxy', 1);

app.use((_req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  });
  if (process.env.NODE_ENV === 'production' || process.env.TRUST_PROXY) res.set('Strict-Transport-Security', 'max-age=15552000');
  next();
});
app.use(compression());
app.use('/api', cors({ origin: (origin, cb) => cb(null, !origin || allowedOrigins.includes(origin)) }));
app.use(express.json({ limit: '100kb' }));

app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/careers', careerRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/invoices', invoiceRoutes);

app.get('/api/health', ah(async (_req, res) => {
  await db.get('SELECT 1');
  res.json({ status: 'ok', time: new Date().toISOString() });
}));

app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found.' }));

// Production: serve the built website (frontend/dist) from the same server, so one
// Render/host service runs the whole site. Unknown paths fall back to index.html (SPA routes).
const distDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../frontend/dist');
if (fs.existsSync(path.join(distDir, 'index.html'))) {
  app.use(express.static(distDir, {
    index: false,
    setHeaders: (res, file) => {
      if (file.endsWith('.html')) res.set('Cache-Control', 'no-cache');
      else if (file.includes(`${path.sep}assets${path.sep}`)) res.set('Cache-Control', 'public, max-age=31536000, immutable'); // hashed build files
      else res.set('Cache-Control', 'public, max-age=604800');
    },
  }));
  app.get('*', (_req, res) => { res.set('Cache-Control', 'no-cache'); res.sendFile(path.join(distDir, 'index.html')); });
}

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid request body.' });
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Request is too large.' });
  if (err.code === '23505') return res.status(409).json({ error: 'This record already exists.' });
  if (err.code === '23503') return res.status(409).json({ error: 'This record is linked to other data and cannot be changed.' });
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ error: status >= 500 ? 'Something went wrong. Please try again.' : err.message });
});

try {
  await initDb();
  await bootstrapOwner();
} catch (e) {
  console.error('Database start-up failed:', e.message);
  process.exit(1);
}

const server = app.listen(PORT, () => {
  console.log(`PestKill API running on http://localhost:${PORT} (database: ${db.kind})`);
});

const shutdown = () => {
  server.close(async () => { await db.close().catch(() => {}); process.exit(0); });
  setTimeout(() => process.exit(0), 8000).unref();
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
