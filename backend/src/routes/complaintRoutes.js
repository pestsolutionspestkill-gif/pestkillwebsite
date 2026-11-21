import express from 'express';
import db, { audit } from '../db.js';
import { auth, requirePermission } from '../middleware/rbac.js';
import { str, oneOf, intId } from '../utils/validate.js';

const router = express.Router();
const STATUSES = ['pending', 'in_progress', 'resolved', 'closed'];

router.post('/', auth, (req, res, next) => {
  try {
    const subject = str(req.body.subject, { field: 'Subject', min: 3, max: 150, required: true });
    const description = str(req.body.description, { field: 'Description', min: 10, max: 3000, required: true });
    const { lastInsertRowid } = db.prepare("INSERT INTO complaints (user_id, subject, description, status) VALUES (?, ?, ?, 'pending')").run(req.user.id, subject, description);
    res.status(201).json(db.prepare('SELECT * FROM complaints WHERE id = ?').get(lastInsertRowid));
  } catch (e) { next(e); }
});

router.get('/my-complaints', auth, (req, res) => {
  res.json(db.prepare('SELECT id, subject, description, status, response, created_at, updated_at FROM complaints WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id));
});

router.get('/', requirePermission('complaints.manage'), (_req, res) => {
  res.json(db.prepare(`SELECT c.*, u.name AS user_name, u.phone AS user_phone, u.email AS user_email
    FROM complaints c LEFT JOIN users u ON u.id = c.user_id ORDER BY c.created_at DESC LIMIT 500`).all());
});

router.patch('/:id', requirePermission('complaints.manage'), (req, res, next) => {
  try {
    const id = intId(req.params.id);
    const existing = db.prepare('SELECT * FROM complaints WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ error: 'Complaint not found.' });
    const status = req.body.status !== undefined ? oneOf(req.body.status, STATUSES, 'status') : existing.status;
    const response = req.body.response !== undefined ? str(req.body.response, { field: 'Response', max: 3000 }) : existing.response;
    db.prepare('UPDATE complaints SET status = ?, response = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, response, id);
    audit(req, 'complaint.update', 'complaint', id, { status });
    res.json(db.prepare('SELECT * FROM complaints WHERE id = ?').get(id));
  } catch (e) { next(e); }
});

export default router;
