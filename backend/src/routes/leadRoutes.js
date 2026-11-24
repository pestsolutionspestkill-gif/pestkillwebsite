import express from 'express';
import crypto from 'crypto';
import db, { audit, NOW } from '../db.js';
import { auth, optionalAuth, requirePermission, ownerOnly, rateLimit, can, ah } from '../middleware/rbac.js';
import { str, phone, email, oneOf, intId, ValidationError } from '../utils/validate.js';
import { checkPersonName, checkCleanText } from '../utils/antiAbuse.js';
import { warrantyStatus } from '../utils/warranty.js';

// Who lives at the property, for the Safe Home plan: only these yes/no flags are stored.
const HOUSEHOLD_KEYS = ['kids', 'pets', 'elderly', 'pregnant', 'asthma', 'aquarium'];
const readHousehold = (h) => {
  if (!h || typeof h !== 'object') return null;
  const flags = Object.fromEntries(HOUSEHOLD_KEYS.filter((k) => h[k] === true).map((k) => [k, true]));
  return Object.keys(flags).length ? JSON.stringify(flags) : null;
};
export const parseHousehold = (s) => { try { return s ? JSON.parse(s) : null; } catch { return null; } };

const router = express.Router();
const TYPES = ['booking', 'inspection', 'contact', 'quote'];
export const LEAD_STATUSES = ['new', 'contacted', 'scheduled', 'in_progress', 'completed', 'cancelled'];
const publicLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 15 });

const newRef = () => `PK${Date.now().toString(36).toUpperCase().slice(-5)}${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

const LIST_SQL = `
  SELECT l.*, a.name AS assigned_name, t.name AS technician_name
  FROM leads l
  LEFT JOIN users a ON a.id = l.assigned_to
  LEFT JOIN users t ON t.id = l.technician_id`;

// Public: website forms (booking wizard, inspection, contact, quote)
router.post('/', publicLimiter, optionalAuth, ah(async (req, res) => {
  const b = req.body || {};
  if (b.company) return res.status(201).json({ ref: newRef() }); // honeypot: silently drop bots
  const lead = {
    ref: newRef(),
    type: oneOf(b.type || 'inspection', TYPES, 'request type'),
    service: str(b.service, { field: 'Service', max: 120 }),
    property: str(b.property, { field: 'Property', max: 120 }),
    preferred_date: str(b.preferredDate, { field: 'Date', max: 40 }),
    preferred_slot: str(b.preferredSlot, { field: 'Time slot', max: 60 }),
    estimate: str(b.estimate, { field: 'Estimate', max: 80 }),
    name: checkPersonName(b.name, 'Name'),
    phone: phone(b.phone),
    email: email(b.email),
    address: str(b.address, { field: 'Address', max: 300 }),
    city: str(b.city, { field: 'City', max: 60 }),
    message: checkCleanText(str(b.message, { field: 'Message', max: 2000 }), 'Message'),
    source: str(b.source, { field: 'Source', max: 120 }),
    user_id: req.user?.role === 'client' ? req.user.id : null,
    household: readHousehold(b.household),
  };
  if (lead.type === 'booking' && (!lead.service || !lead.preferred_date)) throw new ValidationError('Please choose a service and date.');
  const cols = Object.keys(lead);
  await db.run(`INSERT INTO leads (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`, ...cols.map((k) => lead[k]));
  res.status(201).json({ ref: lead.ref });
}));

// Client: own bookings. Linked by account only — phone numbers are not verified,
// so matching on phone would let anyone see a stranger's bookings.
// Includes the warranty wallet (days left), the latest warranty claim and whether service proof exists.
router.get('/mine', auth, ah(async (req, res) => {
  const rows = await db.all(`SELECT l.id, l.ref, l.type, l.service, l.property, l.preferred_date, l.preferred_slot, l.estimate, l.status, l.scheduled_at,
      l.created_at, l.completed_at, l.warranty, l.household, l.completion_notes IS NOT NULL AS has_report,
      (SELECT COUNT(*)::int FROM job_photos p WHERE p.lead_id = l.id) AS photo_count,
      (SELECT row_to_json(c) FROM (SELECT id, status, issue, scheduled_at, admin_note, created_at FROM warranty_claims WHERE lead_id = l.id ORDER BY id DESC LIMIT 1) c) AS last_claim
    FROM leads l WHERE l.user_id = ? ORDER BY l.created_at DESC`, req.user.id);
  res.json(rows.map(({ id, household, last_claim: claim, ...l }) => ({
    ...l,
    household: parseHousehold(household),
    warranty_status: l.status === 'completed' ? warrantyStatus(l) : null,
    last_claim: typeof claim === 'string' ? JSON.parse(claim) : claim,
  })));
}));

// Service proof for the customer (or staff): visit report, products used and before/after photos.
router.get('/:ref/proof', auth, ah(async (req, res) => {
  const lead = await db.get(`SELECT l.id, l.ref, l.user_id, l.assigned_to, l.technician_id, l.service, l.status, l.completed_at, l.scheduled_at,
      l.completion_notes, l.chemicals_used, l.warranty, t.name AS technician_name
    FROM leads l LEFT JOIN users t ON t.id = l.technician_id WHERE l.ref = ?`, String(req.params.ref).slice(0, 40));
  const allowed = lead && ((req.user.role === 'client' && lead.user_id === req.user.id)
    || can(req.user, 'services.assign') || lead.assigned_to === req.user.id || lead.technician_id === req.user.id);
  if (!allowed) return res.status(404).json({ error: 'Booking not found.' });
  const photos = await db.all('SELECT id, kind, mime, data, created_at FROM job_photos WHERE lead_id = ? ORDER BY id', lead.id);
  const { id, user_id: u, assigned_to: a, technician_id: t, ...rest } = lead;
  res.json({
    ...rest,
    technician_name: lead.technician_name ? lead.technician_name.split(' ')[0] : null,
    warranty_status: lead.status === 'completed' ? warrantyStatus(lead) : null,
    photos: photos.map((p) => ({ id: p.id, kind: p.kind, created_at: p.created_at, url: `data:${p.mime};base64,${Buffer.from(p.data).toString('base64')}` })),
  });
}));

// Staff: owners and managers with services.assign see everything; other managers see only their assignments.
router.get('/', requirePermission('services.view', 'services.assign'), ah(async (req, res) => {
  const where = [];
  const params = [];
  if (!can(req.user, 'services.assign')) { where.push('l.assigned_to = ?'); params.push(req.user.id); }
  if (req.query.status) { where.push('l.status = ?'); params.push(oneOf(req.query.status, LEAD_STATUSES, 'status')); }
  if (req.query.type) { where.push('l.type = ?'); params.push(oneOf(req.query.type, TYPES, 'type')); }
  if (req.query.q) {
    where.push('(l.name ILIKE ? OR l.phone ILIKE ? OR l.ref ILIKE ? OR l.service ILIKE ? OR l.city ILIKE ?)');
    const q = `%${String(req.query.q).slice(0, 60)}%`;
    params.push(q, q, q, q, q);
  }
  res.json(await db.all(`${LIST_SQL} ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY l.created_at DESC, l.id DESC LIMIT 500`, ...params));
}));

const toNumberOrNull = (v) => (v === '' || v === null ? null : Math.max(0, Number(v) || 0));

router.patch('/:id', requirePermission('services.manage', 'services.assign'), ah(async (req, res) => {
  const id = intId(req.params.id);
  const lead = await db.get('SELECT * FROM leads WHERE id = ?', id);
  if (!lead) return res.status(404).json({ error: 'Booking not found.' });

  const canAssign = can(req.user, 'services.assign');
  if (!canAssign && lead.assigned_to !== req.user.id) return res.status(403).json({ error: 'This booking is not assigned to you.' });

  const changes = {};
  if (req.body.status !== undefined) {
    if (!can(req.user, 'services.manage')) return res.status(403).json({ error: 'You cannot change booking status.' });
    changes.status = oneOf(req.body.status, LEAD_STATUSES, 'status');
  }
  if (req.body.internalNotes !== undefined) {
    if (!can(req.user, 'services.manage')) return res.status(403).json({ error: 'You cannot edit booking notes.' });
    changes.internal_notes = str(req.body.internalNotes, { field: 'Notes', max: 4000 });
  }
  if (req.body.assignedTo !== undefined) {
    if (!canAssign) return res.status(403).json({ error: 'You cannot assign bookings.' });
    if (req.body.assignedTo === null || req.body.assignedTo === '') {
      changes.assigned_to = null;
    } else {
      const staff = await db.get("SELECT id FROM users WHERE id = ? AND role IN ('owner','manager') AND is_active = 1", intId(req.body.assignedTo));
      if (!staff) throw new ValidationError('Choose an active staff member.');
      changes.assigned_to = staff.id;
    }
  }
  if (req.body.technicianId !== undefined || req.body.scheduledAt !== undefined) {
    if (!canAssign) return res.status(403).json({ error: 'You cannot schedule jobs.' });
    if (req.body.technicianId !== undefined) {
      if (req.body.technicianId === null || req.body.technicianId === '') {
        changes.technician_id = null;
      } else {
        const tech = await db.get("SELECT id FROM users WHERE id = ? AND role IN ('technician','manager','owner') AND is_active = 1", intId(req.body.technicianId));
        if (!tech) throw new ValidationError('Choose an active technician.');
        changes.technician_id = tech.id;
      }
    }
    if (req.body.scheduledAt !== undefined) {
      const v = req.body.scheduledAt;
      if (v && Number.isNaN(Date.parse(v))) throw new ValidationError('Invalid schedule date.');
      // Stored as a UTC ISO string so text ordering equals time ordering.
      changes.scheduled_at = v ? new Date(v).toISOString() : null;
      if (v && lead.status === 'new') changes.status = changes.status || 'scheduled';
    }
  }
  if (req.body.amount !== undefined || req.body.areaSqft !== undefined || req.body.warranty !== undefined) {
    if (!can(req.user, 'services.manage')) return res.status(403).json({ error: 'You cannot edit job details.' });
    if (req.body.amount !== undefined) changes.amount = toNumberOrNull(req.body.amount);
    if (req.body.areaSqft !== undefined) changes.area_sqft = toNumberOrNull(req.body.areaSqft);
    if (req.body.warranty !== undefined) changes.warranty = str(req.body.warranty, { field: 'Warranty', max: 80 });
  }
  const keys = Object.keys(changes);
  if (!keys.length) return res.status(400).json({ error: 'Nothing to update.' });

  const stamp = changes.status === 'completed' && !lead.completed_at ? `, completed_at = ${NOW}` : '';
  await db.run(`UPDATE leads SET ${keys.map((k) => `${k} = ?`).join(', ')}${stamp}, updated_at = ${NOW} WHERE id = ?`, ...keys.map((k) => changes[k]), id);
  audit(req, 'lead.update', 'lead', lead.ref, changes);
  res.json(await db.get(`${LIST_SQL} WHERE l.id = ?`, id));
}));

router.delete('/:id', ownerOnly, ah(async (req, res) => {
  const id = intId(req.params.id);
  const lead = await db.get('SELECT ref FROM leads WHERE id = ?', id);
  if (!lead) return res.status(404).json({ error: 'Booking not found.' });
  await db.run('DELETE FROM leads WHERE id = ?', id);
  audit(req, 'lead.delete', 'lead', lead.ref);
  res.json({ message: 'Deleted.' });
}));

// Treatment / warranty certificate data for a completed job.
router.get('/:ref/certificate', auth, ah(async (req, res) => {
  const lead = await db.get(`${LIST_SQL} WHERE l.ref = ?`, String(req.params.ref).slice(0, 40));
  const isOwnerClient = lead && req.user.role === 'client' && lead.user_id === req.user.id;
  const isStaff = lead && ['owner', 'manager', 'technician'].includes(req.user.role)
    && (can(req.user, 'services.assign') || can(req.user, 'invoices.manage') || lead.assigned_to === req.user.id || lead.technician_id === req.user.id);
  if (!lead || !(isOwnerClient || isStaff)) return res.status(404).json({ error: 'Certificate not found.' });
  if (lead.status !== 'completed') return res.status(409).json({ error: 'The certificate is available once the treatment is completed.' });
  res.json({
    number: `PK-CERT-${lead.ref}`,
    ref: lead.ref, service: lead.service, property: lead.property, area_sqft: lead.area_sqft,
    name: lead.name, address: lead.address, city: lead.city,
    completed_at: lead.completed_at || lead.updated_at, technician: lead.technician_name,
    chemicals_used: lead.chemicals_used, warranty: lead.warranty, notes: lead.completion_notes,
  });
}));

export default router;
