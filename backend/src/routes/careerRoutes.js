import express from 'express';
import db, { audit } from '../db.js';
import { requirePermission, rateLimit } from '../middleware/rbac.js';
import { str, phone, oneOf, intId } from '../utils/validate.js';

const router = express.Router();
const STATUSES = ['new', 'shortlisted', 'interview', 'hired', 'rejected'];

router.post('/apply', rateLimit({ windowMs: 60 * 60 * 1000, max: 5 }), (req, res, next) => {
  try {
    const b = req.body || {};
    if (b.company) return res.status(201).json({ message: 'Application received.' });
    db.prepare('INSERT INTO job_applications (role, name, phone, experience, city, message) VALUES (?, ?, ?, ?, ?, ?)').run(
      str(b.role, { field: 'Role', max: 80, required: true }),
      str(b.name, { field: 'Name', min: 2, max: 80, required: true }),
      phone(b.phone),
      str(b.experience, { field: 'Experience', max: 40 }),
      str(b.city, { field: 'City', max: 60 }),
      str(b.message, { field: 'Message', max: 2000 }),
    );
    res.status(201).json({ message: 'Application received.' });
  } catch (e) { next(e); }
});

router.get('/applications', requirePermission('careers.manage'), (_req, res) => {
  res.json(db.prepare('SELECT * FROM job_applications ORDER BY created_at DESC LIMIT 500').all());
});

router.patch('/applications/:id', requirePermission('careers.manage'), (req, res, next) => {
  try {
    const id = intId(req.params.id);
    const status = oneOf(req.body.status, STATUSES, 'status');
    const r = db.prepare('UPDATE job_applications SET status = ? WHERE id = ?').run(status, id);
    if (!r.changes) return res.status(404).json({ error: 'Application not found.' });
    audit(req, 'application.update', 'application', id, { status });
    res.json(db.prepare('SELECT * FROM job_applications WHERE id = ?').get(id));
  } catch (e) { next(e); }
});

export default router;
