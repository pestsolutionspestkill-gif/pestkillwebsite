import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database(process.env.DB_PATH || path.join(__dirname, '../pestkill.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const columns = (table) => db.prepare(`PRAGMA table_info(${table})`).all().map((c) => c.name);
const addColumn = (table, column, def) => {
  if (!columns(table).includes(column)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${def}`);
};

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'client',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price REAL,
    image TEXT,
    city TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    image TEXT,
    category TEXT,
    stock INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    total REAL NOT NULL,
    status TEXT DEFAULT 'pending',
    address TEXT,
    phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL REFERENCES orders(id),
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL,
    price REAL NOT NULL
  );

  CREATE TABLE IF NOT EXISTS complaints (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Bookings, inspection requests, contact messages and quotes from the website
  CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
  CREATE INDEX IF NOT EXISTS idx_leads_assigned ON leads(assigned_to);
  CREATE INDEX IF NOT EXISTS idx_leads_user ON leads(user_id);

  CREATE TABLE IF NOT EXISTS job_applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    experience TEXT,
    city TEXT,
    message TEXT,
    status TEXT NOT NULL DEFAULT 'new',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS manager_permissions (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission TEXT NOT NULL,
    granted_by INTEGER REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, permission)
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    user_name TEXT,
    user_role TEXT,
    action TEXT NOT NULL,
    target_type TEXT,
    target_id TEXT,
    details TEXT,
    ip TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Migrations for databases created by earlier versions
addColumn('users', 'is_active', 'INTEGER NOT NULL DEFAULT 1');
addColumn('users', 'address', 'TEXT');
addColumn('users', 'city', 'TEXT');
addColumn('users', 'last_login', 'DATETIME');
addColumn('complaints', 'response', 'TEXT');
addColumn('complaints', 'updated_at', 'DATETIME');
// Job scheduling & completion
addColumn('leads', 'scheduled_at', 'TEXT');
addColumn('leads', 'technician_id', 'INTEGER REFERENCES users(id)');
addColumn('leads', 'area_sqft', 'REAL');
addColumn('leads', 'amount', 'REAL');
addColumn('leads', 'completion_notes', 'TEXT');
addColumn('leads', 'chemicals_used', 'TEXT');
addColumn('leads', 'warranty', 'TEXT');
addColumn('leads', 'completed_at', 'DATETIME');
db.exec('CREATE INDEX IF NOT EXISTS idx_leads_technician ON leads(technician_id)');
db.exec('CREATE INDEX IF NOT EXISTS idx_leads_scheduled ON leads(scheduled_at)');

db.exec(`
  CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    number TEXT UNIQUE NOT NULL,
    lead_id INTEGER REFERENCES leads(id),
    user_id INTEGER REFERENCES users(id),
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    customer_email TEXT,
    customer_address TEXT,
    customer_gstin TEXT,
    items TEXT NOT NULL,
    subtotal REAL NOT NULL,
    gst_rate REAL NOT NULL DEFAULT 18,
    gst_amount REAL NOT NULL,
    total REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'unpaid',
    notes TEXT,
    issued_by INTEGER REFERENCES users(id),
    issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    paid_at DATETIME
  );
  CREATE INDEX IF NOT EXISTS idx_invoices_lead ON invoices(lead_id);
`);
db.exec("UPDATE users SET role = 'owner' WHERE role = 'admin'");
db.exec("UPDATE users SET role = 'client' WHERE role = 'user' OR role IS NULL");

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

export const permissionsFor = (user) => {
  if (!user) return [];
  if (user.role === 'owner') return PERMISSIONS.map((p) => p.key);
  if (user.role === 'manager') {
    return db.prepare('SELECT permission FROM manager_permissions WHERE user_id = ?').all(user.id)
      .map((r) => r.permission)
      .filter((p) => GRANTABLE.includes(p));
  }
  return [];
};

export const audit = (req, action, targetType, targetId, details) => {
  try {
    db.prepare(`INSERT INTO audit_logs (user_id, user_name, user_role, action, target_type, target_id, details, ip)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
      req.user?.id ?? null, req.user?.name ?? null, req.user?.role ?? null,
      action, targetType ?? null, targetId == null ? null : String(targetId),
      details ? JSON.stringify(details).slice(0, 1000) : null, req.ip,
    );
  } catch (e) {
    console.error('audit log failed:', e.message);
  }
};

export default db;
