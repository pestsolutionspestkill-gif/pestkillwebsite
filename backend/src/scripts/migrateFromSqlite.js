// One-time copy of the old SQLite database (backend/pestkill.db) into Postgres.
// Usage: set DATABASE_URL in backend/.env (or leave unset for the local embedded DB), then
//   npm run migrate-sqlite            (or: npm run migrate-sqlite -- path/to/pestkill.db)
// Safe to stop: it refuses to run if the target already has users, so nothing is duplicated.
import '../env.js';
import path from 'path';
import { fileURLToPath } from 'url';
import db, { initDb } from '../db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const file = process.argv[2] || path.join(__dirname, '../../pestkill.db');

// Parents before children so foreign keys are satisfied.
const TABLES = ['users', 'services', 'products', 'orders', 'order_items', 'complaints', 'leads', 'job_applications', 'manager_permissions', 'audit_logs', 'invoices'];
const WITH_ID = new Set(TABLES.filter((t) => t !== 'manager_permissions'));
const TIME_COLS = new Set(['created_at', 'updated_at', 'last_login', 'completed_at', 'issued_at', 'paid_at']);

// SQLite stored times as "YYYY-MM-DD HH:MM:SS" (UTC) or ISO strings; normalise to UTC "YYYY-MM-DD HH:MM:SS".
const toTs = (v) => {
  if (v == null || v === '') return null;
  const s = String(v);
  const d = new Date(s.includes('T') ? s : `${s.replace(' ', 'T')}Z`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 19).replace('T', ' ');
};

let Database;
try {
  ({ default: Database } = await import('better-sqlite3'));
} catch {
  console.error('better-sqlite3 is not installed. Run: npm install better-sqlite3 --no-save');
  process.exit(1);
}

try {
  const src = new Database(file, { readonly: true, fileMustExist: true });
  await initDb();
  if ((await db.get('SELECT COUNT(*)::int c FROM users')).c > 0) {
    console.error('The target database already has users. Migration skipped to avoid duplicates.');
    process.exit(1);
  }
  await db.tx(async (t) => {
    for (const table of TABLES) {
      const exists = src.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?").get(table);
      if (!exists) continue;
      const targetCols = (await t.all('SELECT column_name FROM information_schema.columns WHERE table_name = ?', table)).map((c) => c.column_name);
      const rows = src.prepare(`SELECT * FROM ${table}`).all();
      for (const row of rows) {
        const cols = Object.keys(row).filter((c) => targetCols.includes(c));
        const vals = cols.map((c) => (TIME_COLS.has(c) ? toTs(row[c]) : row[c]));
        await t.run(`INSERT INTO ${table} (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')}) ON CONFLICT DO NOTHING`, ...vals);
      }
      if (WITH_ID.has(table)) await t.run(`SELECT setval(pg_get_serial_sequence('${table}', 'id'), COALESCE((SELECT MAX(id) FROM ${table}), 0) + 1, false)`);
      console.log(`${table}: ${rows.length} rows`);
    }
  });
  src.close();
  await db.close();
  console.log('Migration complete.');
  process.exit(0);
} catch (e) {
  console.error(`Migration failed: ${e.message}`);
  process.exit(1);
}
