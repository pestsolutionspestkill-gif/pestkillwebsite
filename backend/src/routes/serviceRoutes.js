import express from 'express';
import db, { audit } from '../db.js';
import { requirePermission } from '../middleware/rbac.js';
import { str, intId } from '../utils/validate.js';

const router = express.Router();

router.get('/', (_req, res) => {
  res.json(db.prepare('SELECT * FROM services ORDER BY created_at DESC').all());
});

const read = (b) => [
  str(b.name, { field: 'Name', min: 2, max: 120, required: true }),
  str(b.description, { field: 'Description', max: 4000 }),
  b.price === undefined || b.price === '' ? null : Number(b.price),
  str(b.image, { field: 'Image', max: 500 }),
  str(b.city, { field: 'City', max: 60 }),
];

router.post('/', requirePermission('settings.manage'), (req, res, next) => {
  try {
    const { lastInsertRowid } = db.prepare('INSERT INTO services (name, description, price, image, city) VALUES (?, ?, ?, ?, ?)').run(...read(req.body));
    audit(req, 'service.create', 'service', lastInsertRowid);
    res.status(201).json(db.prepare('SELECT * FROM services WHERE id = ?').get(lastInsertRowid));
  } catch (e) { next(e); }
});

router.put('/:id', requirePermission('settings.manage'), (req, res, next) => {
  try {
    const id = intId(req.params.id);
    const r = db.prepare('UPDATE services SET name = ?, description = ?, price = ?, image = ?, city = ? WHERE id = ?').run(...read(req.body), id);
    if (!r.changes) return res.status(404).json({ error: 'Service not found.' });
    audit(req, 'service.update', 'service', id);
    res.json(db.prepare('SELECT * FROM services WHERE id = ?').get(id));
  } catch (e) { next(e); }
});

router.delete('/:id', requirePermission('settings.manage'), (req, res, next) => {
  try {
    const id = intId(req.params.id);
    const r = db.prepare('DELETE FROM services WHERE id = ?').run(id);
    if (!r.changes) return res.status(404).json({ error: 'Service not found.' });
    audit(req, 'service.delete', 'service', id);
    res.json({ message: 'Deleted.' });
  } catch (e) { next(e); }
});

export default router;
