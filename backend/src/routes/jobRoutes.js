import express from 'express';
import db, { audit } from '../db.js';
import { requireRole } from '../middleware/rbac.js';
import { str, oneOf, intId } from '../utils/validate.js';

const router = express.Router();
const fieldStaff = requireRole('technician', 'manager', 'owner');
const TECH_STATUSES = ['scheduled', 'in_progress', 'completed'];

const JOB_SQL = `
  SELECT id, ref, service, property, preferred_date, preferred_slot, scheduled_at, name, phone, address, city, message,
         status, area_sqft, completion_notes, chemicals_used, warranty, completed_at, internal_notes
  FROM leads`;

// Jobs assigned to the signed-in field staff member.
router.get('/mine', fieldStaff, (req, res) => {
  res.json(db.prepare(`${JOB_SQL}
    WHERE technician_id = ? AND (status NOT IN ('completed','cancelled') OR completed_at >= datetime('now', '-14 days'))
    ORDER BY CASE WHEN scheduled_at IS NULL THEN 1 ELSE 0 END, scheduled_at, created_at`).all(req.user.id));
});

// Visit updates: only on jobs assigned to this person, only visit fields.
router.patch('/:id', fieldStaff, (req, res, next) => {
  try {
    const id = intId(req.params.id);
    const job = db.prepare('SELECT * FROM leads WHERE id = ?').get(id);
    if (!job || job.technician_id !== req.user.id) return res.status(404).json({ error: 'Job not found.' });
    if (job.status === 'cancelled') return res.status(409).json({ error: 'This job was cancelled.' });

    const changes = {};
    if (req.body.status !== undefined) changes.status = oneOf(req.body.status, TECH_STATUSES, 'status');
    if (req.body.completionNotes !== undefined) changes.completion_notes = str(req.body.completionNotes, { field: 'Notes', max: 3000 });
    if (req.body.chemicalsUsed !== undefined) changes.chemicals_used = str(req.body.chemicalsUsed, { field: 'Chemicals', max: 500 });
    if (changes.status === 'completed') {
      if (!(changes.completion_notes || job.completion_notes)) return res.status(400).json({ error: 'Add a short visit report before completing the job.' });
      changes.completed_at = new Date().toISOString();
    }
    if (!Object.keys(changes).length) return res.status(400).json({ error: 'Nothing to update.' });

    const sets = Object.keys(changes).map((k) => `${k} = @${k}`).join(', ');
    db.prepare(`UPDATE leads SET ${sets}, updated_at = CURRENT_TIMESTAMP WHERE id = @id`).run({ ...changes, id });
    audit(req, 'job.update', 'lead', job.ref, { status: changes.status });
    res.json(db.prepare(`${JOB_SQL} WHERE id = ?`).get(id));
  } catch (e) { next(e); }
});

export default router;
