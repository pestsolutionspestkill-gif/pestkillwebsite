import express from 'express';
import db, { audit } from '../db.js';
import { requirePermission, ah } from '../middleware/rbac.js';
import { str, intId, ValidationError } from '../utils/validate.js';

const router = express.Router();

router.get('/', ah(async (_req, res) => {
  res.json(await db.all('SELECT * FROM services ORDER BY created_at DESC, id DESC'));
}));

const read = (b) => {
  const price = b.price === undefined || b.price === '' || b.price === null ? null : Number(b.price);
  if (price !== null && !(price >= 0)) throw new ValidationError('Invalid price.');
  return [
    str(b.name, { field: 'Name', min: 2, max: 120, required: true }),
    str(b.description, { field: 'Description', max: 4000 }),
    price,
    str(b.image, { field: 'Image', max: 500 }),
    str(b.city, { field: 'City', max: 60 }),
  ];
};

router.post('/', requirePermission('settings.manage'), ah(async (req, res) => {
  const row = await db.get('INSERT INTO services (name, description, price, image, city) VALUES (?, ?, ?, ?, ?) RETURNING *', ...read(req.body));
  audit(req, 'service.create', 'service', row.id);
  res.status(201).json(row);
}));

router.put('/:id', requirePermission('settings.manage'), ah(async (req, res) => {
  const id = intId(req.params.id);
  const row = await db.get('UPDATE services SET name = ?, description = ?, price = ?, image = ?, city = ? WHERE id = ? RETURNING *', ...read(req.body), id);
  if (!row) return res.status(404).json({ error: 'Service not found.' });
  audit(req, 'service.update', 'service', id);
  res.json(row);
}));

router.delete('/:id', requirePermission('settings.manage'), ah(async (req, res) => {
  const id = intId(req.params.id);
  const r = await db.run('DELETE FROM services WHERE id = ?', id);
  if (!r.changes) return res.status(404).json({ error: 'Service not found.' });
  audit(req, 'service.delete', 'service', id);
  res.json({ message: 'Deleted.' });
}));

export default router;
