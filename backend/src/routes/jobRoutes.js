import express from 'express';
import db, { audit, NOW } from '../db.js';
import { requireRole, ah } from '../middleware/rbac.js';
import { str, oneOf, intId } from '../utils/validate.js';

const router = express.Router();
const fieldStaff = requireRole('technician', 'manager', 'owner');
const TECH_STATUSES = ['scheduled', 'in_progress', 'completed'];

const JOB_SQL = `
  SELECT id, ref, service, property, preferred_date, preferred_slot, scheduled_at, name, phone, address, city, message,
         status, area_sqft, completion_notes, chemicals_used, warranty, completed_at, internal_notes
  FROM leads`;

// Jobs assigned to the signed-in field staff member.
router.get('/mine', fieldStaff, ah(async (req, res) => {
  res.json(await db.all(`${JOB_SQL}
    WHERE technician_id = ? AND (status NOT IN ('completed','cancelled') OR completed_at >= ${NOW} - interval '14 days')
    ORDER BY (scheduled_at IS NULL), scheduled_at, created_at`, req.user.id));
}));

// Visit updates: only on jobs assigned to this person, only visit fields.
router.patch('/:id', fieldStaff, ah(async (req, res) => {
  const id = intId(req.params.id);
  const job = await db.get('SELECT * FROM leads WHERE id = ?', id);
  if (!job || job.technician_id !== req.user.id) return res.status(404).json({ error: 'Job not found.' });
  if (job.status === 'cancelled') return res.status(409).json({ error: 'This job was cancelled.' });

  const changes = {};
  if (req.body.status !== undefined) changes.status = oneOf(req.body.status, TECH_STATUSES, 'status');
  if (req.body.completionNotes !== undefined) changes.completion_notes = str(req.body.completionNotes, { field: 'Notes', max: 3000 });
  if (req.body.chemicalsUsed !== undefined) changes.chemicals_used = str(req.body.chemicalsUsed, { field: 'Chemicals', max: 500 });
  if (changes.status === 'completed' && !(changes.completion_notes || job.completion_notes)) {
    return res.status(400).json({ error: 'Add a short visit report before completing the job.' });
  }
  const keys = Object.keys(changes);
  if (!keys.length) return res.status(400).json({ error: 'Nothing to update.' });

  const stamp = changes.status === 'completed' ? `, completed_at = ${NOW}` : '';
  await db.run(`UPDATE leads SET ${keys.map((k) => `${k} = ?`).join(', ')}${stamp}, updated_at = ${NOW} WHERE id = ?`, ...keys.map((k) => changes[k]), id);
  audit(req, 'job.update', 'lead', job.ref, { status: changes.status });
  res.json(await db.get(`${JOB_SQL} WHERE id = ?`, id));
}));

export default router;
