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

  ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified INTEGER NOT NULL DEFAULT 0;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified INTEGER NOT NULL DEFAULT 0;
  -- Raised when the password changes, so every older login token stops working.
  ALTER TABLE users ADD COLUMN IF NOT EXISTS token_version INTEGER NOT NULL DEFAULT 0;
  CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

  CREATE TABLE IF NOT EXISTS email_otps (
    email TEXT NOT NULL,
    purpose TEXT NOT NULL,
    salt TEXT NOT NULL,
    code_hash TEXT NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    sends INTEGER NOT NULL DEFAULT 0,
    window_start TIMESTAMP,
    last_sent TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    PRIMARY KEY (email, purpose)
  );

  ALTER TABLE leads ADD COLUMN IF NOT EXISTS household TEXT;

  CREATE TABLE IF NOT EXISTS warranty_claims (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    issue TEXT NOT NULL,
    preferred_date TEXT,
    status TEXT NOT NULL DEFAULT 'open',
    scheduled_at TEXT,
    admin_note TEXT,
    created_at TIMESTAMP DEFAULT ${NOW},
    updated_at TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_claims_lead ON warranty_claims(lead_id);
  CREATE INDEX IF NOT EXISTS idx_claims_status ON warranty_claims(status);

  CREATE TABLE IF NOT EXISTS job_photos (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    kind TEXT NOT NULL,
    mime TEXT NOT NULL,
    data BYTEA NOT NULL,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT ${NOW}
  );
  CREATE INDEX IF NOT EXISTS idx_job_photos_lead ON job_photos(lead_id);

  CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  ALTER TABLE products ALTER COLUMN price DROP NOT NULL;
  ALTER TABLE products ALTER COLUMN stock DROP DEFAULT;
  ALTER TABLE products ADD COLUMN IF NOT EXISTS slug TEXT;
  ALTER TABLE products ADD COLUMN IF NOT EXISTS brand TEXT;
  ALTER TABLE products ADD COLUMN IF NOT EXISTS technical TEXT;
  ALTER TABLE products ADD COLUMN IF NOT EXISTS formulation TEXT;
  ALTER TABLE products ADD COLUMN IF NOT EXISTS pack_size TEXT;
  ALTER TABLE products ADD COLUMN IF NOT EXISTS pack_style TEXT;
  ALTER TABLE products ADD COLUMN IF NOT EXISTS mrp DOUBLE PRECISION;
  ALTER TABLE products ADD COLUMN IF NOT EXISTS pco_price DOUBLE PRECISION;
  ALTER TABLE products ADD COLUMN IF NOT EXISTS mrp_note TEXT;
  ALTER TABLE products ADD COLUMN IF NOT EXISTS mrp_verified INTEGER NOT NULL DEFAULT 0;
  ALTER TABLE products ADD COLUMN IF NOT EXISTS usage_info TEXT;
  ALTER TABLE products ADD COLUMN IF NOT EXISTS is_active INTEGER NOT NULL DEFAULT 1;
  ALTER TABLE products ADD COLUMN IF NOT EXISTS sort INTEGER NOT NULL DEFAULT 0;
  ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;
  ALTER TABLE products ADD COLUMN IF NOT EXISTS offer_price DOUBLE PRECISION;
  ALTER TABLE products ADD COLUMN IF NOT EXISTS offer_label TEXT;
  ALTER TABLE products ADD COLUMN IF NOT EXISTS offer_ends TEXT;
  -- Product page content, all entered by staff from the manufacturer's label and leaflet.
  ALTER TABLE products ADD COLUMN IF NOT EXISTS how_to_use TEXT;
  ALTER TABLE products ADD COLUMN IF NOT EXISTS storage_info TEXT;
  ALTER TABLE products ADD COLUMN IF NOT EXISTS faqs TEXT;              -- JSON [{ q, a }]
  ALTER TABLE products ADD COLUMN IF NOT EXISTS target_pests TEXT;      -- comma list, e.g. "termite,ant"
  ALTER TABLE products ADD COLUMN IF NOT EXISTS dose_per_litre DOUBLE PRECISION;      -- ml or g of product per litre of water (label rate)
  ALTER TABLE products ADD COLUMN IF NOT EXISTS solution_per_sqm DOUBLE PRECISION;    -- litres of diluted solution per m² (label rate)
  ALTER TABLE products ADD COLUMN IF NOT EXISTS dose_note TEXT;

  -- Technical datasheets, safety data sheets and labels (PDF), downloadable from the product page.
  CREATE TABLE IF NOT EXISTS product_documents (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    kind TEXT NOT NULL,
    mime TEXT NOT NULL,
    data BYTEA NOT NULL,
    size INTEGER NOT NULL,
    uploaded_at TIMESTAMP DEFAULT ${NOW},
    UNIQUE (product_id, kind)
  );
  -- Documents v2: several documents per type (e.g. certificates), with metadata and visibility.
  ALTER TABLE product_documents DROP CONSTRAINT IF EXISTS product_documents_product_id_kind_key;
  ALTER TABLE product_documents ADD COLUMN IF NOT EXISTS title TEXT;
  ALTER TABLE product_documents ADD COLUMN IF NOT EXISTS description TEXT;
  ALTER TABLE product_documents ADD COLUMN IF NOT EXISTS manufacturer TEXT;
  ALTER TABLE product_documents ADD COLUMN IF NOT EXISTS version TEXT;
  ALTER TABLE product_documents ADD COLUMN IF NOT EXISTS issue_date TEXT;
  ALTER TABLE product_documents ADD COLUMN IF NOT EXISTS revision_date TEXT;
  ALTER TABLE product_documents ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'public';
  ALTER TABLE product_documents ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;
  ALTER TABLE product_documents ADD COLUMN IF NOT EXISTS uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL;
  CREATE INDEX IF NOT EXISTS idx_product_documents_product ON product_documents(product_id);

  -- Label dosage data for the calculator. Only 'verified' records (with a source) produce quantities.
  CREATE TABLE IF NOT EXISTS dose_records (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    activity TEXT NOT NULL,
    method TEXT NOT NULL,
    product_per_litre DOUBLE PRECISION,
    rate_horizontal DOUBLE PRECISION,
    rate_vertical DOUBLE PRECISION,
    rate_running DOUBLE PRECISION,
    product_per_1000l DOUBLE PRECISION,
    bait_per_point DOUBLE PRECISION,
    amount_unit TEXT NOT NULL DEFAULT 'ml',
    notes TEXT,
    source_document_id INTEGER REFERENCES product_documents(id) ON DELETE SET NULL,
    source_note TEXT,
    status TEXT NOT NULL DEFAULT 'unverified',
    verified_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    verified_at TIMESTAMP,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT ${NOW},
    updated_at TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_dose_records_product ON dose_records(product_id);

  -- Business licences shown on the website. Validity and authority are shown only once verified.
  CREATE TABLE IF NOT EXISTS licences (
    id SERIAL PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    number TEXT NOT NULL,
    activity TEXT NOT NULL,
    issuing_authority TEXT,
    valid_from TEXT,
    valid_until TEXT,
    status TEXT NOT NULL DEFAULT 'unverified',
    display INTEGER NOT NULL DEFAULT 1,
    doc_mime TEXT,
    doc_data BYTEA,
    doc_size INTEGER,
    sort INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMP DEFAULT ${NOW}
  );

  -- Technical standards register (e.g. IS 6313), with where each fact was checked.
  CREATE TABLE IF NOT EXISTS technical_references (
    id SERIAL PRIMARY KEY,
    code TEXT NOT NULL,
    title TEXT NOT NULL,
    edition TEXT,
    amendment_status TEXT,
    scope TEXT,
    source_url TEXT,
    source_note TEXT,
    verification_status TEXT NOT NULL DEFAULT 'not_confirmed',
    verified_on TEXT,
    applies_to TEXT,
    display INTEGER NOT NULL DEFAULT 1,
    sort INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMP DEFAULT ${NOW}
  );
  ALTER TABLE dose_records ADD COLUMN IF NOT EXISTS standard_id INTEGER REFERENCES technical_references(id) ON DELETE SET NULL;

  -- Competitor / market reference prices. Kept apart from our own selling prices.
  CREATE TABLE IF NOT EXISTS reference_prices (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    source TEXT NOT NULL,
    source_url TEXT NOT NULL,
    ref_brand TEXT NOT NULL,
    ref_name TEXT NOT NULL,
    ref_pack TEXT,
    displayed_price DOUBLE PRECISION,
    displayed_mrp DOUBLE PRECISION,
    price_status TEXT NOT NULL DEFAULT 'listed',
    currency TEXT NOT NULL DEFAULT 'INR',
    checked_on TEXT NOT NULL,
    match_status TEXT NOT NULL DEFAULT 'review',
    notes TEXT,
    updated_at TIMESTAMP DEFAULT ${NOW},
    UNIQUE (source_url, ref_pack)
  );
  CREATE INDEX IF NOT EXISTS idx_reference_prices_product ON reference_prices(product_id);

  CREATE INDEX IF NOT EXISTS idx_dose_records_activity ON dose_records(activity, status);

  -- Licence and GST certificate copies uploaded by PCO buyers for verification.
  CREATE TABLE IF NOT EXISTS buyer_documents (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kind TEXT NOT NULL,
    mime TEXT NOT NULL,
    data BYTEA NOT NULL,
    size INTEGER NOT NULL,
    uploaded_at TIMESTAMP DEFAULT ${NOW},
    PRIMARY KEY (user_id, kind)
  );
  CREATE UNIQUE INDEX IF NOT EXISTS idx_products_slug ON products(slug);

  CREATE TABLE IF NOT EXISTS product_images (
    product_id INTEGER PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
    mime TEXT NOT NULL,
    data BYTEA NOT NULL,
    updated_at TIMESTAMP DEFAULT ${NOW}
  );
  -- Where each product photo came from (genuine pack photo vs. illustration).
  ALTER TABLE product_images ADD COLUMN IF NOT EXISTS source_url TEXT;
  ALTER TABLE product_images ADD COLUMN IF NOT EXISTS credit TEXT;
  ALTER TABLE product_images ADD COLUMN IF NOT EXISTS licence_note TEXT;

  CREATE TABLE IF NOT EXISTS buyer_profiles (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    firm_name TEXT NOT NULL,
    licence_no TEXT NOT NULL,
    licence_valid_till TEXT,
    gstin TEXT,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT,
    pincode TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    admin_note TEXT,
    applied_at TIMESTAMP DEFAULT ${NOW},
    reviewed_at TIMESTAMP,
    reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL
  );
  CREATE INDEX IF NOT EXISTS idx_buyers_status ON buyer_profiles(status);

  ALTER TABLE orders ADD COLUMN IF NOT EXISTS firm_name TEXT;
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS gstin TEXT;
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS city TEXT;
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS pincode TEXT;
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT;
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes TEXT;
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS admin_note TEXT;
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS item_count INTEGER;
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;
  ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_name TEXT;
  ALTER TABLE order_items ADD COLUMN IF NOT EXISTS brand TEXT;
  ALTER TABLE order_items ADD COLUMN IF NOT EXISTS pack_size TEXT;
  CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
  CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
  -- Lookups used by "my complaints", stock/delete checks, pack-size variants and "my claims".
  CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);
  CREATE INDEX IF NOT EXISTS idx_complaints_user ON complaints(user_id);
  CREATE INDEX IF NOT EXISTS idx_products_brand_name ON products(brand, name);
  CREATE INDEX IF NOT EXISTS idx_claims_user ON warranty_claims(user_id);
`;

export const slugify = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);

// Loads the starter PCO catalogue the first time the shop table has no catalogue products.
// Loads/updates the PCO catalogue when CATALOG_VERSION increases:
// - adds new products and their official pack photos,
// - refreshes products the owner has never edited (updated_at IS NULL),
// - never touches products, prices or photos the owner changed in the console.
// Licences, standards and reference prices: new rows only, never overwriting admin edits.
const seedRegistry = async () => {
  const { LICENCES, STANDARDS, REFERENCE_PRICES, REFERENCE_CHECKED_ON, REGISTRY_VERSION } = await import('./data/registry.js');
  for (const l of LICENCES) {
    await db.run('INSERT INTO licences (key, title, number, activity, sort) VALUES (?, ?, ?, ?, ?) ON CONFLICT (key) DO NOTHING', l.key, l.title, l.number, l.activity, l.sort);
  }
  const done = Number((await db.get("SELECT value FROM app_settings WHERE key = 'registry_version'"))?.value || 0);
  if (done >= REGISTRY_VERSION) return;
  for (const t of STANDARDS) {
    if (await db.get('SELECT 1 FROM technical_references WHERE code = ?', t.code)) continue;
    const keys = Object.keys(t);
    await db.run(`INSERT INTO technical_references (${keys.join(', ')}) VALUES (${keys.map(() => '?').join(', ')})`, ...keys.map((k) => t[k]));
  }
  for (const p of REFERENCE_PRICES) {
    const product = p.match ? await db.get('SELECT id FROM products WHERE brand = ? AND name = ? AND pack_size = ?', p.brand, p.match[0], p.match[1]) : null;
    const status = p.price != null || p.mrp != null ? 'listed' : /enquiry/i.test(p.note || '') ? 'on_enquiry' : 'not_shown';
    await db.run(`INSERT INTO reference_prices (product_id, source, source_url, ref_brand, ref_name, ref_pack, displayed_price, displayed_mrp, price_status, checked_on, match_status, notes)
      VALUES (?, 'bharatpest.in', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT (source_url, ref_pack) DO NOTHING`,
    product?.id ?? null, p.url, p.brand, p.name, p.pack, p.price, p.mrp, status, REFERENCE_CHECKED_ON, product ? 'matched' : 'review', p.note || null);
  }
  await db.run("INSERT INTO app_settings (key, value) VALUES ('registry_version', ?) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value", String(REGISTRY_VERSION));
};

const seedProducts = async () => {
  const { PRODUCT_SEED, CATALOG_VERSION, RETIRED_SLUGS } = await import('./data/productSeed.js');
  const done = Number((await db.get("SELECT value FROM app_settings WHERE key = 'catalog_version'"))?.value || 0);
  if (done >= CATALOG_VERSION) return;
  const imgDir = path.join(__dirname, 'data/product-images');
  let sort = 0;
  for (const p of PRODUCT_SEED) {
    sort += 10;
    const slug = slugify(`${p.brand} ${p.name} ${p.packSize}`);
    const fields = [p.name, p.brand, p.technical, p.formulation, p.category, p.packSize, p.packStyle, p.mrp, p.mrp, p.mrpNote, p.usage, `${p.technical}. ${p.usage}`, sort];
    const existing = await db.get('SELECT id, updated_at FROM products WHERE slug = ?', slug);
    let id = existing?.id;
    if (!existing) {
      id = (await db.get(`INSERT INTO products (name, brand, technical, formulation, category, pack_size, pack_style, mrp, price, mrp_note, usage_info, description, sort, slug, stock)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL) RETURNING id`, ...fields, slug)).id;
    } else if (existing.updated_at == null) {
      await db.run(`UPDATE products SET name = ?, brand = ?, technical = ?, formulation = ?, category = ?, pack_size = ?, pack_style = ?, mrp = ?, price = ?,
        mrp_note = ?, usage_info = ?, description = ?, sort = ? WHERE id = ?`, ...fields, id);
    }
    if (p.img && !await db.get('SELECT 1 FROM product_images WHERE product_id = ?', id)) {
      const file = path.join(imgDir, `${p.img}.webp`);
      if (fs.existsSync(file)) await db.run(`INSERT INTO product_images (product_id, mime, data, updated_at) VALUES (?, 'image/webp', ?, ${NOW})`, id, fs.readFileSync(file));
    }
    // Catalogue pack photos are the manufacturers' official product images; record that once.
    if (p.img) await db.run(`UPDATE product_images SET credit = ? WHERE product_id = ? AND credit IS NULL AND source_url IS NULL`, `${p.brand} official product image`, id);
  }
  for (const slug of RETIRED_SLUGS) await db.run('UPDATE products SET is_active = 0 WHERE slug = ? AND updated_at IS NULL', slug);
  await db.run("INSERT INTO app_settings (key, value) VALUES ('catalog_version', ?) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value", String(CATALOG_VERSION));
  console.log(`Shop catalogue updated to version ${CATALOG_VERSION} (${PRODUCT_SEED.length} products).`);
};

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
  await seedProducts();
  await seedRegistry();
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
  { key: 'buyers.manage', group: 'Orders', label: 'PCO buyer accounts', description: 'Approve or reject PCO buyer applications' },
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
