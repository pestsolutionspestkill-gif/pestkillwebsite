import express from 'express';
import crypto from 'crypto';
import db, { audit } from '../db.js';
import { auth, optionalAuth, requirePermission, ownerOnly, rateLimit, can } from '../middleware/rbac.js';
import { str, phone, email, oneOf, intId, ValidationError } from '../utils/validate.js';

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
router.post('/', publicLimiter, optionalAuth, (req, res, next) => {
  try {
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
      name: str(b.name, { field: 'Name', min: 2, max: 80, required: true }),
      phone: phone(b.phone),
      email: email(b.email),
      address: str(b.address, { field: 'Address', max: 300 }),
      city: str(b.city, { field: 'City', max: 60 }),
      message: str(b.message, { field: 'Message', max: 2000 }),
      source: str(b.source, { field: 'Source', max: 120 }),
      user_id: req.user?.role === 'client' ? req.user.id : null,
    };
    if (lead.type === 'booking' && (!lead.service || !lead.preferred_date)) throw new ValidationError('Please choose a service and date.');
    db.prepare(`INSERT INTO leads (ref, type, service, property, preferred_date, preferred_slot, estimate, name, phone, email, address, city, message, source, user_id)
      VALUES (@ref, @type, @service, @property, @preferred_date, @preferred_slot, @estimate, @name, @phone, @email, @address, @city, @message, @source, @user_id)`).run(lead);
    res.status(201).json({ ref: lead.ref });
  } catch (e) { next(e); }
});

// Client: own bookings
router.get('/mine', auth, (req, res) => {
  const rows = db.prepare(`SELECT ref, type, service, property, preferred_date, preferred_slot, estimate, status, created_at
    FROM leads WHERE user_id = ? OR (phone = ? AND user_id IS NULL) ORDER BY created_at DESC`).all(req.user.id, String(req.user.phone || '').slice(-10));
  res.json(rows);
});

// Staff: owners and managers with services.assign see everything; other managers see only their assignments.
router.get('/', requirePermission('services.view', 'services.assign'), (req, res, next) => {
  try {
    const where = [];
    const params = [];
    if (!can(req.user, 'services.assign')) { where.push('l.assigned_to = ?'); params.push(req.user.id); }
    if (req.query.status) { where.push('l.status = ?'); params.push(oneOf(req.query.status, LEAD_STATUSES, 'status')); }
    if (req.query.type) { where.push('l.type = ?'); params.push(oneOf(req.query.type, TYPES, 'type')); }
    if (req.query.q) {
      where.push('(l.name LIKE ? OR l.phone LIKE ? OR l.ref LIKE ? OR l.service LIKE ? OR l.city LIKE ?)');
      const q = `%${String(req.query.q).slice(0, 60)}%`;
      params.push(q, q, q, q, q);
    }
    const sql = `${LIST_SQL} ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY l.created_at DESC LIMIT 500`;
    res.json(db.prepare(sql).all(...params));
  } catch (e) { next(e); }
});

router.patch('/:id', requirePermission('services.manage', 'services.assign'), (req, res, next) => {
  try {
    const id = intId(req.params.id);
    const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(id);
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
        const staff = db.prepare("SELECT id FROM users WHERE id = ? AND role IN ('owner','manager') AND is_active = 1").get(intId(req.body.assignedTo));
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
          const tech = db.prepare("SELECT id FROM users WHERE id = ? AND role IN ('technician','manager','owner') AND is_active = 1").get(intId(req.body.technicianId));
          if (!tech) throw new ValidationError('Choose an active technician.');
          changes.technician_id = tech.id;
        }
      }
      if (req.body.scheduledAt !== undefined) {
        const v = req.body.scheduledAt;
        if (v && Number.isNaN(Date.parse(v))) throw new ValidationError('Invalid schedule date.');
        changes.scheduled_at = v || null;
        if (v && lead.status === 'new') changes.status = changes.status || 'scheduled';
      }
    }
    if (req.body.amount !== undefined || req.body.areaSqft !== undefined || req.body.warranty !== undefined) {
      if (!can(req.user, 'services.manage')) return res.status(403).json({ error: 'You cannot edit job details.' });
      if (req.body.amount !== undefined) changes.amount = req.body.amount === '' || req.body.amount === null ? null : Math.max(0, Number(req.body.amount) || 0);
      if (req.body.areaSqft !== undefined) changes.area_sqft = req.body.areaSqft === '' || req.body.areaSqft === null ? null : Math.max(0, Number(req.body.areaSqft) || 0);
      if (req.body.warranty !== undefined) changes.warranty = str(req.body.warranty, { field: 'Warranty', max: 80 });
    }
    if (changes.status === 'completed' && !lead.completed_at) changes.completed_at = new Date().toISOString();
    if (!Object.keys(changes).length) return res.status(400).json({ error: 'Nothing to update.' });

    const sets = Object.keys(changes).map((k) => `${k} = @${k}`).join(', ');
    db.prepare(`UPDATE leads SET ${sets}, updated_at = CURRENT_TIMESTAMP WHERE id = @id`).run({ ...changes, id });
    audit(req, 'lead.update', 'lead', lead.ref, changes);
    res.json(db.prepare(`${LIST_SQL} WHERE l.id = ?`).get(id));
  } catch (e) { next(e); }
});

router.delete('/:id', ownerOnly, (req, res, next) => {
  try {
    const id = intId(req.params.id);
    const lead = db.prepare('SELECT ref FROM leads WHERE id = ?').get(id);
    if (!lead) return res.status(404).json({ error: 'Booking not found.' });
    db.prepare('DELETE FROM leads WHERE id = ?').run(id);
    audit(req, 'lead.delete', 'lead', lead.ref);
    res.json({ message: 'Deleted.' });
  } catch (e) { next(e); }
});

// Treatment / warranty certificate data for a completed job.
router.get('/:ref/certificate', auth, (req, res) => {
  const lead = db.prepare(`${LIST_SQL} WHERE l.ref = ?`).get(String(req.params.ref).slice(0, 40));
  const isOwnerClient = lead && req.user.role === 'client' && (lead.user_id === req.user.id || (lead.user_id == null && lead.phone === String(req.user.phone || '').slice(-10)));
  const isStaff = ['owner', 'manager', 'technician'].includes(req.user.role) && (can(req.user, 'services.view') || can(req.user, 'invoices.manage') || lead?.technician_id === req.user.id);
  if (!lead || !(isOwnerClient || isStaff)) return res.status(404).json({ error: 'Certificate not found.' });
  if (lead.status !== 'completed') return res.status(409).json({ error: 'The certificate is available once the treatment is completed.' });
  res.json({
    number: `PK-CERT-${lead.ref}`,
    ref: lead.ref, service: lead.service, property: lead.property, area_sqft: lead.area_sqft,
    name: lead.name, address: lead.address, city: lead.city,
    completed_at: lead.completed_at || lead.updated_at, technician: lead.technician_name,
    chemicals_used: lead.chemicals_used, warranty: lead.warranty, notes: lead.completion_notes,
  });
});

export default router;