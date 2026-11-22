import express from 'express';
import db, { audit, NOW } from '../db.js';
import { auth, requirePermission, ah } from '../middleware/rbac.js';
import { str, oneOf, intId } from '../utils/validate.js';

const router = express.Router();
const STATUSES = ['pending', 'in_progress', 'resolved', 'closed'];

router.post('/', auth, ah(async (req, res) => {
  const subject = str(req.body.subject, { field: 'Subject', min: 3, max: 150, required: true });
  const description = str(req.body.description, { field: 'Description', min: 10, max: 3000, required: true });
  res.status(201).json(await db.get("INSERT INTO complaints (user_id, subject, description, status) VALUES (?, ?, ?, 'pending') RETURNING *", req.user.id, subject, description));
}));

router.get('/my-complaints', auth, ah(async (req, res) => {
  res.json(await db.all('SELECT id, subject, description, status, response, created_at, updated_at FROM complaints WHERE user_id = ? ORDER BY created_at DESC, id DESC', req.user.id));
}));

router.get('/', requirePermission('complaints.manage'), ah(async (_req, res) => {
  res.json(await db.all(`SELECT c.*, u.name AS user_name, u.phone AS user_phone, u.email AS user_email
    FROM complaints c LEFT JOIN users u ON u.id = c.user_id ORDER BY c.created_at DESC, c.id DESC LIMIT 500`));
}));

router.patch('/:id', requirePermission('complaints.manage'), ah(async (req, res) => {
  const id = intId(req.params.id);
  const existing = await db.get('SELECT * FROM complaints WHERE id = ?', id);
  if (!existing) return res.status(404).json({ error: 'Complaint not found.' });
  const status = req.body.status !== undefined ? oneOf(req.body.status, STATUSES, 'status') : existing.status;
  const response = req.body.response !== undefined ? str(req.body.response, { field: 'Response', max: 3000 }) : existing.response;
  const row = await db.get(`UPDATE complaints SET status = ?, response = ?, updated_at = ${NOW} WHERE id = ? RETURNING *`, status, response, id);
  audit(req, 'complaint.update', 'complaint', id, { status });
  res.json(row);
}));

export default router;
