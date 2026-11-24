// Must stay first: loads .env and validates secrets before any route module reads them.
import './env.js';
import express from 'express';
import cors from 'cors';
import compression from 'compression';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

import db, { initDb, resolveJwtSecret, audit } from './db.js';
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
import buyerRoutes from './routes/buyerRoutes.js';
import claimRoutes from './routes/claimRoutes.js';
import verifyRoutes from './routes/verifyRoutes.js';
import { ah, setJwtSecret } from './middleware/rbac.js';
import { mountWebsite } from './seo.js';

const PORT = process.env.PORT || 5000;
// The website is served from this same server, so same-origin calls need no CORS entry.
// CLIENT_ORIGIN is only for a frontend hosted elsewhere; Render's own URL is added automatically.
const allowedOrigins = [
  ...(process.env.CLIENT_ORIGIN || 'http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173').split(','),
  process.env.RENDER_EXTERNAL_URL || '',
  process.env.SITE_URL || '',
].map((o) => o.trim().replace(/\/$/, '')).filter(Boolean);

// Owner login from environment variables (for hosts without a shell, e.g. Render).
// While OWNER_EMAIL and OWNER_PASSWORD are set, that account always exists as an active Owner and
// OWNER_PASSWORD always works: to change the password, change the variable and restart.
const syncOwnerFromEnv = async () => {
  const email = String(process.env.OWNER_EMAIL || '').trim().toLowerCase();
  const pass = String(process.env.OWNER_PASSWORD || '').trim();
  if (!email && !pass) return;
  if (!email || !pass) { console.error('Owner login not set: add both OWNER_EMAIL and OWNER_PASSWORD.'); return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { console.error(`Owner login not set: OWNER_EMAIL "${email}" is not a valid email address.`); return; }
  if (pass.length < 8) { console.error('Owner login not set: OWNER_PASSWORD must be at least 8 characters.'); return; }

  const user = await db.get('SELECT id, password, role, is_active FROM users WHERE email = ?', email);
  if (!user) {
    const phoneDigits = String(process.env.OWNER_PHONE || '').replace(/\D/g, '').slice(-10) || null;
    await db.run("INSERT INTO users (name, email, phone, password, role) VALUES (?, ?, ?, ?, 'owner')",
      String(process.env.OWNER_NAME || '').trim() || 'Owner', email, phoneDigits, await bcrypt.hash(pass, 12));
    console.log(`Owner login created: ${email}`);
    return;
  }
  const passwordMatches = await bcrypt.compare(pass, user.password);
  if (passwordMatches && user.role === 'owner' && user.is_active) { console.log(`Owner login ready: ${email}`); return; }
  await db.run("UPDATE users SET password = ?, role = 'owner', is_active = 1 WHERE id = ?",
    passwordMatches ? user.password : await bcrypt.hash(pass, 12), user.id);
  await db.run('DELETE FROM manager_permissions WHERE user_id = ?', user.id);
  audit({ ip: 'server' }, 'auth.owner_from_env', 'user', user.id, { passwordChanged: !passwordMatches });
  console.log(`Owner login updated from OWNER_EMAIL / OWNER_PASSWORD: ${email}`);
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
// Product photo uploads (owner console) may be up to ~2 MB as base64; everything else stays small.
const smallJson = express.json({ limit: '100kb' });
const imageJson = express.json({ limit: '2.5mb' });
app.use((req, res, next) => (/^\/api\/(products\/\d+\/image|jobs\/\d+\/photos)$/.test(req.path) ? imageJson : smallJson)(req, res, next));

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
app.use('/api/buyers', buyerRoutes);
app.use('/api/claims', claimRoutes);
app.use('/api/verify', verifyRoutes);

app.get('/api/health', ah(async (_req, res) => {
  await db.get('SELECT 1');
  res.json({ status: 'ok', time: new Date().toISOString() });
}));

app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found.' }));

// Production: serve the built website (frontend/dist) from the same server, so one
// Render/host service runs the whole site. See seo.js for pre-rendered pages, sitemap and redirects.
const distDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../frontend/dist');
await mountWebsite(app, distDir);

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
  setJwtSecret(await resolveJwtSecret());
  await syncOwnerFromEnv();
} catch (e) {
  console.error(`\n*** PestKill could not start: ${e.message}\n`);
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
