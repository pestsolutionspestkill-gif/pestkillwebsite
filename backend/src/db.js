// PostgreSQL data layer.
// - Production: set DATABASE_URL (e.g. a free Neon Postgres URL). Data persists across deploys.
// - Local dev / tests: without DATABASE_URL an embedded Postgres (PGlite) is used, stored in
//   ~/.pestkill/pglite (or PGLITE_DIR; "memory://" for a throwaway database).
// Queries use "?" placeholders; they are converted to $1, $2… here. Never put a literal "?" in SQL.
import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Current UTC time as "timestamp without time zone", whole seconds (same shape the frontend expects).
export const NOW = "date_trunc('second', now() AT TIME ZONE 'utc')";
// A UTC timestamp column converted to the Indian calendar date.
export const IST_DATE = (col) => `((${col}) AT TIME ZONE 'utc' AT TIME ZONE 'Asia/Kolkata')::date`;

// Type OIDs: int8, numeric, date, timestamp, timestamptz — return plain numbers / strings.
const PARSERS = { 20: Number, 1700: Number, 1082: (s) => s, 1114: (s) => s, 1184: (s) => s };

const toPg = (sql) => { let i = 0; return sql.replace(/\?/g, () => `$${++i}`); };
const clean = (params) => params.map((v) => (v === undefined ? null : v));

const wrap = (exec) => ({
  all: async (sql, ...p) => (await exec(toPg(sql), clean(p))).rows,
  get: async (sql, ...p) => (await exec(toPg(sql), clean(p))).rows[0],
  run: async (sql, ...p) => {
    const r = await exec(toPg(sql), clean(p));
    return { changes: r.rowCount ?? r.affectedRows ?? 0, rows: r.rows };
  },
});

let driver; // { exec, tx, close, kind }

const connect = async () => {
  if (process.env.DATABASE_URL) {
    const { default: pg } = await import('pg');
    Object.entries(PARSERS).forEach(([oid, fn]) => pg.types.setTypeParser(Number(oid), fn));
    const pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      max: Number(process.env.DB_POOL_MAX) || 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 15000,
    });
    pool.on('error', (e) => console.error('Postgres pool error:', e.message));
    return {
      kind: 'postgres',
      exec: (sql, params) => pool.query(sql, params),
      tx: async (fn) => {
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          const out = await fn(wrap((s, p) => client.query(s, p)));
          await client.query('COMMIT');
          return out;
        } catch (e) {
          await client.query('ROLLBACK').catch(() => {});
          throw e;
        } finally {
          client.release();
        }
      },
      close: () => pool.end(),
    };
  }
  // Render's disk is wiped on every deploy/restart: refuse to silently store real bookings there.
  if (process.env.RENDER && !process.env.ALLOW_TEMPORARY_DB) {
    throw new Error('DATABASE_URL is not set. Create a free Neon database (neon.tech) and add its connection string '
      + 'as DATABASE_URL in Render -> Environment, then redeploy. (For a short demo only, set ALLOW_TEMPORARY_DB=1; data will be lost.)');
  }
  const { PGlite } = await import('@electric-sql/pglite');
  // Kept in the user's home folder, outside the project: cloud-sync folders (OneDrive, Dropbox)
  // lock and upload database files while they change, which breaks start-up.
  const dir = process.env.PGLITE_DIR || path.join(os.homedir(), '.pestkill', 'pglite');
  let releaseLock = () => {};
  if (!dir.includes('://')) {
    fs.mkdirSync(dir, { recursive: true });
    // Only one process may open the embedded database. PGlite's own postmaster.pid holds a fake
    // process id, so a crash or a closed window would otherwise block every later start.
    // Our lock file records the real process id, which lets us tell "in use" from "stale".
    const lockFile = `${dir}.lock`;
    const holder = Number(fs.existsSync(lockFile) ? fs.readFileSync(lockFile, 'utf8').trim() : 0);
    const alive = (pid) => { try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; } };
    if (holder && holder !== process.pid && alive(holder)) {
      throw new Error(`The local database is already open in another running process (id ${holder}). `
        + `Stop the other server or script first. If nothing else is running, delete ${lockFile}.`);
    }
    fs.rmSync(path.join(dir, 'postmaster.pid'), { force: true }); // stale lock from an unexpected stop
    fs.writeFileSync(lockFile, String(process.pid));
    releaseLock = () => {
      try { if (fs.readFileSync(lockFile, 'utf8').trim() === String(process.pid)) fs.rmSync(lockFile, { force: true }); } catch { /* already gone */ }
    };
    process.once('exit', releaseLock);
  }
  const lite = new PGlite(dir, { parsers: PARSERS });
  await lite.waitReady;
  return {
    kind: `embedded (${dir})`,
    exec: (sql, params) => lite.query(sql, params),
    tx: (fn) => lite.transaction((t) => fn(wrap((s, p) => t.query(s, p)))),
    close: async () => { await lite.close(); releaseLock(); },
  };
};

const notReady = () => { throw new Error('Database not initialised. Call initDb() first.'); };

const db = {
  all: (...a) => (driver ? wrap(driver.exec).all(...a) : notReady()),
  get: (...a) => (driver ? wrap(driver.exec).get(...a) : notReady()),
  run: (...a) => (driver ? wrap(driver.exec).run(...a) : notReady()),
  /** Runs fn(t) in a transaction; use only `t` inside (not `db`). */
  tx: (fn) => (driver ? driver.tx(fn) : notReady()),
  close: async () => { if (driver) { await driver.close(); driver = null; } },
  get kind() { return driver?.kind; },
};

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'client',
    is_active INTEGER NOT NULL DEFAULT 1,
    address TEXT,
    city TEXT,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT ${NOW}
  );

  CREATE TABLE IF NOT EXISTS services (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price DOUBLE PRECISION,
    image TEXT,
    city TEXT,
    created_at TIMESTAMP DEFAULT ${NOW}
  );

  CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price DOUBLE PRECISION NOT NULL,
    image TEXT,
    category TEXT,
    stock INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT ${NOW}
  );

  CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    total DOUBLE PRECISION NOT NULL,
    status TEXT DEFAULT 'pending',
    address TEXT,
    phone TEXT,
    created_at TIMESTAMP DEFAULT ${NOW}
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id),
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL,
    price DOUBLE PRECISION NOT NULL
  );

  CREATE TABLE IF NOT EXISTS complaints (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    response TEXT,
    created_at TIMESTAMP DEFAULT ${NOW},
    updated_at TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS leads (
    id SERIAL PRIMARY KEY,
    ref TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL,
    service TEXT,
    property TEXT,
    preferred_date TEXT,
    preferred_slot TEXT,
    estimate TEXT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT,
    city TEXT,
    message TEXT,
    source TEXT,
    status TEXT NOT NULL DEFAULT 'new',
    assigned_to INTEGER REFERENCES users(id),
    user_id INTEGER REFERENCES users(id),
    internal_notes TEXT,
    scheduled_at TEXT,
    technician_id INTEGER REFERENCES users(id),
    area_sqft DOUBLE PRECISION,
    amount DOUBLE PRECISION,
    completion_notes TEXT,
    chemicals_used TEXT,
    warranty TEXT,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT ${NOW},
    updated_at TIMESTAMP DEFAULT ${NOW}
  );
  CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
  CREATE INDEX IF NOT EXISTS idx_leads_assigned ON leads(assigned_to);
  CREATE INDEX IF NOT EXISTS idx_leads_user ON leads(user_id);
  CREATE INDEX IF NOT EXISTS idx_leads_technician ON leads(technician_id);
  CREATE INDEX IF NOT EXISTS idx_leads_scheduled ON leads(scheduled_at);
  CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at);

  CREATE TABLE IF NOT EXISTS job_applications (
    id SERIAL PRIMARY KEY,
    role TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    experience TEXT,
    city TEXT,
    message TEXT,
    status TEXT NOT NULL DEFAULT 'new',
    created_at TIMESTAMP DEFAULT ${NOW}
  );

  CREATE TABLE IF NOT EXISTS manager_permissions (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission TEXT NOT NULL,
    granted_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT ${NOW},
    PRIMARY KEY (user_id, permission)
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    user_name TEXT,
    user_role TEXT,
    action TEXT NOT NULL,
    target_type TEXT,
    target_id TEXT,
    details TEXT,
    ip TEXT,
    created_at TIMESTAMP DEFAULT ${NOW}
  );
  CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);

  CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY,
    number TEXT UNIQUE NOT NULL,
    lead_id INTEGER REFERENCES leads(id) ON DELETE SET NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    customer_email TEXT,
    customer_address TEXT,
    customer_gstin TEXT,
    items TEXT NOT NULL,
    subtotal DOUBLE PRECISION NOT NULL,
    gst_rate DOUBLE PRECISION NOT NULL DEFAULT 18,
    gst_amount DOUBLE PRECISION NOT NULL,
    total DOUBLE PRECISION NOT NULL,
    status TEXT NOT NULL DEFAULT 'unpaid',
    notes TEXT,
    issued_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    issued_at TIMESTAMP DEFAULT ${NOW},
    paid_at TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_invoices_lead ON invoices(lead_id);
  CREATE INDEX IF NOT EXISTS idx_invoices_user ON invoices(user_id);

  CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`;

// Login-token signing key. Uses JWT_SECRET when it is set to 32+ characters; otherwise a random
// key is generated once and kept in the database, so sessions survive restarts without manual setup.
export const resolveJwtSecret = async () => {
  const fromEnv = process.env.JWT_SECRET || '';
  if (fromEnv.length >= 32) return fromEnv;
  if (fromEnv) console.warn('JWT_SECRET is shorter than 32 characters; using a generated key stored in the database instead.');
  await db.run("INSERT INTO app_settings (key, value) VALUES ('jwt_secret', ?) ON CONFLICT (key) DO NOTHING", crypto.randomBytes(48).toString('base64url'));
  return (await db.get("SELECT value FROM app_settings WHERE key = 'jwt_secret'")).value;
};

export const initDb = async () => {
  if (driver) return db;
  driver = await connect();
  for (const stmt of SCHEMA.split(';').map((s) => s.trim()).filter(Boolean)) {
    await driver.exec(stmt, []);
  }
  await db.run("UPDATE users SET role = 'owner' WHERE role = 'admin'");
  await db.run("UPDATE users SET role = 'client' WHERE role = 'user' OR role IS NULL");
  return db;
};

export const ROLES = ['owner', 'manager', 'technician', 'client'];
export const STAFF_ROLES = ['owner', 'manager', 'technician'];

export const PERMISSIONS = [
  { key: 'services.view', group: 'Bookings & Services', label: 'View bookings', description: 'See bookings assigned to them' },
  { key: 'services.assign', group: 'Bookings & Services', label: 'Assign bookings', description: 'See all bookings and assign them' },
  { key: 'services.manage', group: 'Bookings & Services', label: 'Update bookings', description: 'Change status and add notes' },
  { key: 'complaints.manage', group: 'Support', label: 'Manage complaints', description: 'View and respond to complaints' },
  { key: 'careers.manage', group: 'Support', label: 'Job applications', description: 'View and update job applications' },
  { key: 'invoices.manage', group: 'Billing', label: 'Invoices & certificates', description: 'Create invoices, mark payments, issue certificates' },
  { key: 'users.view', group: 'Customers', label: 'View customers', description: 'See client accounts' },
  { key: 'users.create', group: 'Customers', label: 'Create customers', description: 'Create client accounts' },
  { key: 'users.edit', group: 'Customers', label: 'Edit customers', description: 'Edit or suspend client accounts' },
  { key: 'users.delete', group: 'Customers', label: 'Delete customers', description: 'Delete client accounts' },
  { key: 'products.view', group: 'Products & Inventory', label: 'View products', description: 'See the product catalogue' },
  { key: 'products.create', group: 'Products & Inventory', label: 'Add products', description: 'Create products' },
  { key: 'products.edit', group: 'Products & Inventory', label: 'Edit products', description: 'Edit product details and prices' },
  { key: 'inventory.view', group: 'Products & Inventory', label: 'View inventory', description: 'See stock levels' },
  { key: 'inventory.manage', group: 'Products & Inventory', label: 'Update stock', description: 'Change stock quantities' },
  { key: 'orders.view', group: 'Orders', label: 'View orders', description: 'See shop orders' },
  { key: 'orders.manage', group: 'Orders', label: 'Update orders', description: 'Change order and delivery status' },
  { key: 'reports.view', group: 'Reports', label: 'Operational reports', description: 'Booking and workload statistics' },
  // Owner-only: can never be granted to a manager
  { key: 'users.assign_roles', group: 'Owner only', label: 'Assign roles', description: 'Create managers and change roles', ownerOnly: true },
  { key: 'products.delete', group: 'Owner only', label: 'Delete products', description: 'Permanently delete products', ownerOnly: true },
  { key: 'reports.financial', group: 'Owner only', label: 'Financial reports', description: 'Revenue and sales figures', ownerOnly: true },
  { key: 'settings.manage', group: 'Owner only', label: 'Website settings', description: 'Global configuration', ownerOnly: true },
];

export const GRANTABLE = PERMISSIONS.filter((p) => !p.ownerOnly).map((p) => p.key);

export const DEFAULT_MANAGER_PERMISSIONS = ['services.view', 'services.manage', 'complaints.manage', 'inventory.view', 'orders.view', 'reports.view'];

export const permissionsFor = async (user) => {
  if (!user) return [];
  if (user.role === 'owner') return PERMISSIONS.map((p) => p.key);
  if (user.role === 'manager') {
    return (await db.all('SELECT permission FROM manager_permissions WHERE user_id = ?', user.id))
      .map((r) => r.permission)
      .filter((p) => GRANTABLE.includes(p));
  }
  return [];
};

// Fire-and-forget: an audit failure must never break the request.
export const audit = (req, action, targetType, targetId, details) => {
  db.run(`INSERT INTO audit_logs (user_id, user_name, user_role, action, target_type, target_id, details, ip)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  req.user?.id ?? null, req.user?.name ?? null, req.user?.role ?? null,
  action, targetType ?? null, targetId == null ? null : String(targetId),
  details ? JSON.stringify(details).slice(0, 1000) : null, req.ip ?? null)
    .catch((e) => console.error('audit log failed:', e.message));
};

export default db;
