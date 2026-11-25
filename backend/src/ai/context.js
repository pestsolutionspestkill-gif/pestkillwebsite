// Role-scoped data for PestKill AI. The model only ever sees what the signed-in person is allowed to
// see through the normal app: a customer their own bookings/orders/complaints, a technician the jobs
// assigned to them, an owner/manager business summaries. Read-only: nothing here changes data.
import db, { NOW } from '../db.js';
import { can } from '../middleware/rbac.js';
import { warrantyStatus } from '../utils/warranty.js';

const day = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '—');
const clip = (s, n = 300) => (s ? String(s).replace(/\s+/g, ' ').slice(0, n) : '');

/** Which AI modes this user may use. */
export const modesFor = (user) => {
  const modes = ['assistant', 'identify', 'diagnose', 'quote'];
  if (user && ['technician', 'manager', 'owner'].includes(user.role)) modes.push('field');
  if (user && (user.role === 'owner' || (user.role === 'manager' && can(user, 'reports.view')))) modes.push('insights');
  return modes;
};

/** Customer's own records: the "Digital Pest Passport" view, built only from what is recorded. */
export const customerContext = async (user) => {
  const leads = await db.all(`SELECT id, ref, service, property, address, city, status, preferred_date, scheduled_at, completed_at, warranty,
      completion_notes, chemicals_used, created_at FROM leads WHERE user_id = ? ORDER BY created_at DESC LIMIT 30`, user.id);
  const orders = await db.all(`SELECT id, status, payment_status, payment_method, total, created_at FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 10`, user.id);
  const complaints = await db.all('SELECT id, subject, status, response, created_at FROM complaints WHERE user_id = ? ORDER BY created_at DESC LIMIT 10', user.id);
  const buyer = await db.get('SELECT status, licence_valid_till FROM buyer_profiles WHERE user_id = ?', user.id);
  const lines = [`Customer: ${user.name}.`];
  if (!leads.length) lines.push('No bookings recorded for this account.');
  // Group visits by address: one "property" per address.
  const props = new Map();
  for (const l of leads) {
    const key = `${clip(l.address, 120) || 'Address not recorded'}${l.city ? `, ${l.city}` : ''}`;
    if (!props.has(key)) props.set(key, []);
    props.get(key).push(l);
  }
  let n = 0;
  for (const [addr, visits] of props) {
    n += 1;
    lines.push(`Property ${n}: ${addr}`);
    for (const l of visits) {
      const w = l.status === 'completed' ? warrantyStatus(l) : null;
      lines.push(`  - Booking ${l.ref}: ${l.service || 'service'}; status ${l.status}; requested ${day(l.created_at)}` +
        `${l.scheduled_at ? `; scheduled ${day(l.scheduled_at)}` : ''}${l.completed_at ? `; completed ${day(l.completed_at)}` : ''}` +
        `${l.warranty ? `; warranty recorded: ${l.warranty}${w ? ` (${w.active ? `${w.days_left} days left` : 'expired'})` : ''}` : '; no warranty recorded'}` +
        `${l.chemicals_used ? `; products used: ${clip(l.chemicals_used, 200)}` : ''}${l.completion_notes ? `; visit report: ${clip(l.completion_notes)}` : ''}`);
    }
  }
  if (orders.length) lines.push(`Shop orders: ${orders.map((o) => `#${o.id} ${o.status}, payment ${o.payment_status || 'unpaid'} (${o.payment_method || '—'}), ₹${o.total}, ${day(o.created_at)}`).join('; ')}`);
  if (complaints.length) lines.push(`Complaints: ${complaints.map((c) => `#${c.id} "${clip(c.subject, 80)}" ${c.status}${c.response ? ` (reply: ${clip(c.response, 120)})` : ''}`).join('; ')}`);
  if (buyer) lines.push(`PCO buyer application: ${buyer.status}; licence valid till ${buyer.licence_valid_till || 'not recorded'}.`);
  return lines.join('\n');
};

/** Technician: only jobs assigned to them. */
export const technicianContext = async (user) => {
  const jobs = await db.all(`SELECT ref, service, property, address, city, status, scheduled_at, area_sqft, message, completion_notes, chemicals_used
    FROM leads WHERE technician_id = ? AND (status NOT IN ('completed','cancelled') OR completed_at >= ${NOW} - interval '14 days')
    ORDER BY (scheduled_at IS NULL), scheduled_at LIMIT 20`, user.id);
  if (!jobs.length) return `Technician: ${user.name}. No jobs assigned right now.`;
  return [`Technician: ${user.name}. Assigned jobs:`, ...jobs.map((j) => `  - ${j.ref}: ${j.service}; ${j.property || ''}; ${clip(j.address, 100)}${j.city ? `, ${j.city}` : ''}; status ${j.status}` +
    `${j.scheduled_at ? `; scheduled ${day(j.scheduled_at)}` : ''}${j.area_sqft ? `; area ${j.area_sqft} sq.ft.` : ''}${j.message ? `; customer note: ${clip(j.message, 160)}` : ''}` +
    `${j.completion_notes ? `; report so far: ${clip(j.completion_notes, 200)}` : ''}${j.chemicals_used ? `; products recorded: ${clip(j.chemicals_used, 120)}` : ''}`)].join('\n');
};

/** Owner / manager: aggregated business data (no passwords, no documents). */
export const adminContext = async () => {
  const q = async (sql, ...p) => (await db.get(sql, ...p))?.n ?? 0;
  const byStatus = await db.all("SELECT status, COUNT(*)::int n FROM leads WHERE created_at >= NOW() - interval '90 days' GROUP BY status ORDER BY n DESC");
  const newLeads = await db.all("SELECT ref, name, service, city, status, created_at FROM leads WHERE created_at >= NOW() - interval '7 days' ORDER BY created_at DESC LIMIT 15");
  const unassigned = await q("SELECT COUNT(*)::int n FROM leads WHERE technician_id IS NULL AND status IN ('new','contacted','scheduled')");
  const followUp = await db.all("SELECT ref, name, service, created_at FROM leads WHERE status = 'new' AND created_at < NOW() - interval '1 day' ORDER BY created_at LIMIT 10");
  const complaints = await db.all("SELECT id, subject, created_at FROM complaints WHERE status = 'pending' ORDER BY created_at LIMIT 10");
  const claims = await q("SELECT COUNT(*)::int n FROM warranty_claims WHERE status IN ('open','scheduled')");
  const lowStock = await db.all('SELECT brand, name, pack_size, stock FROM products WHERE is_active = 1 AND stock IS NOT NULL AND stock <= 5 ORDER BY stock LIMIT 15');
  const pcoPending = await q("SELECT COUNT(*)::int n FROM buyer_profiles WHERE status = 'pending'");
  const unpaid = await db.get("SELECT COUNT(*)::int n, COALESCE(SUM(total),0) t FROM orders WHERE payment_status <> 'paid' AND status <> 'cancelled'");
  const replacements = await q("SELECT COUNT(*)::int n FROM replacement_requests WHERE status = 'pending'");
  const mrpToCheck = await q('SELECT COUNT(*)::int n FROM products WHERE is_active = 1 AND mrp IS NOT NULL AND mrp_verified = 0');
  const licences = await db.all('SELECT title, status, valid_until FROM licences');
  const orders30 = await db.get("SELECT COUNT(*)::int n, COALESCE(SUM(total),0) t FROM orders WHERE status <> 'cancelled' AND created_at >= NOW() - interval '30 days'");
  const completed30 = await q("SELECT COUNT(*)::int n FROM leads WHERE status = 'completed' AND completed_at >= NOW() - interval '30 days'");
  return [
    'Business data (read-only, from the PestKill database):',
    `Bookings/leads last 90 days by status: ${byStatus.map((s) => `${s.status} ${s.n}`).join(', ') || 'none'}.`,
    `New leads last 7 days: ${newLeads.map((l) => `${l.ref} ${clip(l.name, 40)} (${l.service || '—'}, ${l.city || '—'}, ${l.status}, ${day(l.created_at)})`).join('; ') || 'none'}.`,
    `Leads still "new" after a day (follow up): ${followUp.map((l) => `${l.ref} ${clip(l.name, 40)} ${l.service || ''} ${day(l.created_at)}`).join('; ') || 'none'}.`,
    `Open jobs without a technician: ${unassigned}. Jobs completed last 30 days: ${completed30}.`,
    `Pending complaints: ${complaints.map((c) => `#${c.id} "${clip(c.subject, 80)}" ${day(c.created_at)}`).join('; ') || 'none'}. Open warranty claims: ${claims}.`,
    `Low stock (≤5): ${lowStock.map((p) => `${p.brand} ${p.name} ${p.pack_size}: ${p.stock}`).join('; ') || 'none'}. Batch expiry dates are not tracked in the system.`,
    `Shop: ${orders30.n} orders in 30 days worth ₹${Math.round(orders30.t)}. Unpaid orders: ${unpaid.n} (₹${Math.round(unpaid.t)}). Pending PCO applications: ${pcoPending}. Pending replacement requests: ${replacements}. MRPs waiting to be checked against the pack: ${mrpToCheck}.`,
    `Licences: ${licences.map((l) => `${l.title} ${l.status}${l.valid_until ? ` (valid until ${l.valid_until})` : ''}`).join('; ')}.`,
  ].join('\n');
};
