import express from 'express';
import db, { audit } from '../db.js';
import { requirePermission, can, ah } from '../middleware/rbac.js';
import { str, intId, ValidationError } from '../utils/validate.js';

const router = express.Router();

const num = (v, field, { min = 0 } = {}) => {
  const n = Number(v);
  if (!Number.isFinite(n) || n < min) throw new ValidationError(`Invalid ${field}.`);
  return n;
};

router.get('/', ah(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(48, Math.max(1, parseInt(req.query.limit, 10) || 12));
  const where = [];
  const params = [];
  if (req.query.category) { where.push('category = ?'); params.push(String(req.query.category).slice(0, 80)); }
  if (req.query.search) { where.push('(name ILIKE ? OR description ILIKE ?)'); const q = `%${String(req.query.search).slice(0, 60)}%`; params.push(q, q); }
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const { total } = await db.get(`SELECT COUNT(*)::int AS total FROM products ${clause}`, ...params);
  const products = await db.all(`SELECT * FROM products ${clause} ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`, ...params, limit, (page - 1) * limit);
  res.json({ products, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
}));

router.get('/:id', ah(async (req, res) => {
  const product = await db.get('SELECT * FROM products WHERE id = ?', intId(req.params.id));
  if (!product) return res.status(404).json({ error: 'Product not found.' });
  res.json(product);
}));

router.post('/', requirePermission('products.create'), ah(async (req, res) => {
  const b = req.body;
  const row = await db.get('INSERT INTO products (name, description, price, image, category, stock) VALUES (?, ?, ?, ?, ?, ?) RETURNING *',
    str(b.name, { field: 'Name', min: 2, max: 150, required: true }),
    str(b.description, { field: 'Description', max: 4000 }),
    num(b.price, 'price'),
    str(b.image, { field: 'Image', max: 500 }),
    str(b.category, { field: 'Category', max: 80 }),
    Math.floor(num(b.stock ?? 0, 'stock')));
  audit(req, 'product.create', 'product', row.id);
  res.status(201).json(row);
}));

// products.edit may change any field; inventory.manage may only change stock.
router.put('/:id', requirePermission('products.edit', 'inventory.manage'), ah(async (req, res) => {
  const id = intId(req.params.id);
  const p = await db.get('SELECT * FROM products WHERE id = ?', id);
  if (!p) return res.status(404).json({ error: 'Product not found.' });
  const b = req.body;
  const fullEdit = can(req.user, 'products.edit');
  const n = {
    name: fullEdit && b.name !== undefined ? str(b.name, { field: 'Name', min: 2, max: 150, required: true }) : p.name,
    description: fullEdit && b.description !== undefined ? str(b.description, { field: 'Description', max: 4000 }) : p.description,
    price: fullEdit && b.price !== undefined ? num(b.price, 'price') : p.price,
    image: fullEdit && b.image !== undefined ? str(b.image, { field: 'Image', max: 500 }) : p.image,
    category: fullEdit && b.category !== undefined ? str(b.category, { field: 'Category', max: 80 }) : p.category,
    stock: b.stock !== undefined ? Math.floor(num(b.stock, 'stock')) : p.stock,
  };
  const row = await db.get('UPDATE products SET name = ?, description = ?, price = ?, image = ?, category = ?, stock = ? WHERE id = ? RETURNING *',
    n.name, n.description, n.price, n.image, n.category, n.stock, id);
  audit(req, 'product.update', 'product', id, { fields: Object.keys(b) });
  res.json(row);
}));

router.delete('/:id', requirePermission('products.delete'), ah(async (req, res) => {
  const id = intId(req.params.id);
  if (await db.get('SELECT 1 FROM order_items WHERE product_id = ?', id)) {
    return res.status(409).json({ error: 'This product has orders and cannot be deleted. Set its stock to 0 instead.' });
  }
  const r = await db.run('DELETE FROM products WHERE id = ?', id);
  if (!r.changes) return res.status(404).json({ error: 'Product not found.' });
  audit(req, 'product.delete', 'product', id);
  res.json({ message: 'Deleted.' });
}));

export default router;
