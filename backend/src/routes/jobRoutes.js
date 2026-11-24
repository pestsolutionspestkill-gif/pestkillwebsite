import express from 'express';
import db, { audit, NOW } from '../db.js';
import { requireRole, can, ah } from '../middleware/rbac.js';
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

// ---------- Service proof photos (before / after) ----------
const MAX_PHOTOS = 8;
const MAX_PHOTO_BYTES = 1.5 * 1024 * 1024;

// The assigned technician, or staff allowed to manage bookings, may add proof photos.
const jobFor = async (req, id) => {
  const job = await db.get('SELECT id, ref, technician_id, assigned_to, status FROM leads WHERE id = ?', id);
  const ok = job && (job.technician_id === req.user.id || job.assigned_to === req.user.id || can(req.user, 'services.manage'));
  return ok ? job : null;
};

router.get('/:id/photos', fieldStaff, ah(async (req, res) => {
  const job = await jobFor(req, intId(req.params.id));
  if (!job) return res.status(404).json({ error: 'Job not found.' });
  const rows = await db.all('SELECT id, kind, mime, data, created_at FROM job_photos WHERE lead_id = ? ORDER BY id', job.id);
  res.json(rows.map((p) => ({ id: p.id, kind: p.kind, created_at: p.created_at, url: `data:${p.mime};base64,${Buffer.from(p.data).toString('base64')}` })));
}));

router.post('/:id/photos', fieldStaff, ah(async (req, res) => {
  const job = await jobFor(req, intId(req.params.id));
  if (!job) return res.status(404).json({ error: 'Job not found.' });
  if (job.status === 'cancelled') return res.status(409).json({ error: 'This job was cancelled.' });
  const kind = oneOf(req.body?.kind, ['before', 'after'], 'photo type');
  const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(String(req.body?.dataUrl || ''));
  if (!m) return res.status(400).json({ error: 'Upload a JPG, PNG or WebP photo.' });
  const data = Buffer.from(m[2], 'base64');
  if (data.length > MAX_PHOTO_BYTES) return res.status(400).json({ error: 'Photo is too large (max 1.5 MB).' });
  if ((await db.get('SELECT COUNT(*)::int c FROM job_photos WHERE lead_id = ?', job.id)).c >= MAX_PHOTOS) {
    return res.status(400).json({ error: `A job can have up to ${MAX_PHOTOS} photos. Remove one first.` });
  }
  const row = await db.get('INSERT INTO job_photos (lead_id, kind, mime, data, created_by) VALUES (?, ?, ?, ?, ?) RETURNING id, kind, created_at', job.id, kind, m[1], data, req.user.id);
  audit(req, 'job.photo', 'lead', job.ref, { kind });
  res.status(201).json({ ...row, url: `data:${m[1]};base64,${m[2]}` });
}));

router.delete('/:id/photos/:photoId', fieldStaff, ah(async (req, res) => {
  const job = await jobFor(req, intId(req.params.id));
  if (!job) return res.status(404).json({ error: 'Job not found.' });
  const r = await db.run('DELETE FROM job_photos WHERE id = ? AND lead_id = ?', intId(req.params.photoId), job.id);
  if (!r.changes) return res.status(404).json({ error: 'Photo not found.' });
  audit(req, 'job.photo_removed', 'lead', job.ref);
  res.json({ message: 'Removed.' });
}));

export default router;
