// Warranty claims: customers ask for a free re-treatment in one tap while their warranty is active;
// staff schedule, resolve or (with a reason) reject them.
import express from 'express';
import db, { audit, NOW } from '../db.js';
import { auth, requirePermission, can, rateLimit, ah } from '../middleware/rbac.js';
import { str, oneOf, intId, ValidationError } from '../utils/validate.js';
import { checkCleanText } from '../utils/antiAbuse.js';
import { warrantyStatus } from '../utils/warranty.js';

const router = express.Router();
const STATUSES = ['open', 'scheduled', 'resolved', 'rejected'];
const claimLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 10 });

router.post('/', auth, claimLimiter, ah(async (req, res) => {
  const ref = String(req.body?.ref || '').slice(0, 40);
  const lead = await db.get('SELECT id, ref, user_id, status, warranty, completed_at, service FROM leads WHERE ref = ?', ref);
  if (!lead || lead.user_id !== req.user.id) return res.status(404).json({ error: 'Booking not found.' });
  if (lead.status !== 'completed') throw new ValidationError('A warranty claim is possible after the treatment is completed.');
  const w = warrantyStatus(lead);
  if (!w) throw new ValidationError('This booking has no warranty on record. Please call us and we will help.');
  if (!w.active) throw new ValidationError(`The warranty for this service ended on ${w.until}.`);
  if (await db.get("SELECT 1 FROM warranty_claims WHERE lead_id = ? AND status IN ('open','scheduled')", lead.id)) {
    return res.status(409).json({ error: 'You already have an open claim for this service. We will contact you shortly.' });
  }
  const issue = checkCleanText(str(req.body.issue, { field: 'Problem description', min: 10, max: 1000, required: true }), 'Problem description');
  const preferred = str(req.body.preferredDate, { field: 'Preferred date', max: 20 });
  if (preferred && !/^\d{4}-\d{2}-\d{2}$/.test(preferred)) throw new ValidationError('Choose a valid preferred date.');
  const claim = await db.get('INSERT INTO warranty_claims (lead_id, user_id, issue, preferred_date) VALUES (?, ?, ?, ?) RETURNING *', lead.id, req.user.id, issue, preferred);
  audit(req, 'claim.create', 'lead', lead.ref, { claim: claim.id });
  res.status(201).json({ ...claim, ref: lead.ref, service: lead.service });
}));

router.get('/mine', auth, ah(async (req, res) => {
  res.json(await db.all(`SELECT c.*, l.ref, l.service FROM warranty_claims c JOIN leads l ON l.id = c.lead_id
    WHERE c.user_id = ? ORDER BY c.created_at DESC, c.id DESC`, req.user.id));
}));

router.get('/', requirePermission('services.view', 'services.assign', 'services.manage'), ah(async (req, res) => {
  const where = [];
  const params = [];
  if (req.query.status && STATUSES.includes(req.query.status)) { where.push('c.status = ?'); params.push(req.query.status); }
  if (!can(req.user, 'services.assign')) { where.push('(l.assigned_to = ? OR l.technician_id = ?)'); params.push(req.user.id, req.user.id); }
  res.json(await db.all(`SELECT c.*, l.ref, l.service, l.name, l.phone, l.address, l.city, l.warranty, l.completed_at, l.technician_id, t.name AS technician_name
    FROM warranty_claims c JOIN leads l ON l.id = c.lead_id LEFT JOIN users t ON t.id = l.technician_id
    ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
    ORDER BY CASE c.status WHEN 'open' THEN 0 WHEN 'scheduled' THEN 1 ELSE 2 END, c.created_at DESC LIMIT 500`, ...params));
}));

router.patch('/:id', requirePermission('services.manage'), ah(async (req, res) => {
  const id = intId(req.params.id);
  const claim = await db.get('SELECT * FROM warranty_claims WHERE id = ?', id);
  if (!claim) return res.status(404).json({ error: 'Claim not found.' });
  const status = oneOf(req.body.status, STATUSES, 'status');
  const note = str(req.body.adminNote, { field: 'Note', max: 500 });
  if (status === 'rejected' && !note) throw new ValidationError('Add a reason so the customer knows why the claim was declined.');
  let scheduledAt = claim.scheduled_at;
  if (req.body.scheduledAt !== undefined) {
    if (req.body.scheduledAt && Number.isNaN(Date.parse(req.body.scheduledAt))) throw new ValidationError('Invalid visit date.');
    scheduledAt = req.body.scheduledAt ? new Date(req.body.scheduledAt).toISOString() : null;
  }
  if (status === 'scheduled' && !scheduledAt) throw new ValidationError('Choose the re-treatment visit date and time.');
  const row = await db.get(`UPDATE warranty_claims SET status = ?, admin_note = COALESCE(?, admin_note), scheduled_at = ?, updated_at = ${NOW} WHERE id = ? RETURNING *`,
    status, note, scheduledAt, id);
  audit(req, `claim.${status}`, 'claim', id, { note });
  res.json(row);
}));

export default router;
