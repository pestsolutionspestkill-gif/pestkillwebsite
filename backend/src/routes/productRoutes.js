import express from 'express';
import db, { audit } from '../db.js';
import { requirePermission, can } from '../middleware/rbac.js';
import { str, intId, ValidationError } from '../utils/validate.js';

const router = express.Router();

const num = (v, field, { min = 0 } = {}) => {
  const n = Number(v);
  if (!Number.isFinite(n) || n < min) throw new ValidationError(`Invalid ${field}.`);
  return n;
};

router.get('/', (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(48, Math.max(1, parseInt(req.query.limit, 10) || 12));
  const where = [];
  const params = [];
  if (req.query.category) { where.push('category = ?'); params.push(String(req.query.category)); }
  if (req.query.search) { where.push('(name LIKE ? OR description LIKE ?)'); const q = `%${String(req.query.search).slice(0, 60)}%`; params.push(q, q); }
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const total = db.prepare(`SELECT COUNT(*) AS total FROM products ${clause}`).get(...params).total;
  const products = db.prepare(`SELECT * FROM products ${clause} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, limit, (page - 1) * limit);
  res.json({ products, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

router.get('/:id', (req, res, next) => {
  try {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(intId(req.params.id));
    if (!product) return res.status(404).json({ error: 'Product not found.' });
    res.json(product);
  } catch (e) { next(e); }
});

router.post('/', requirePermission('products.create'), (req, res, next) => {
  try {
    const b = req.body;
    const { lastInsertRowid } = db.prepare('INSERT INTO products (name, description, price, image, category, stock) VALUES (?, ?, ?, ?, ?, ?)').run(
      str(b.name, { field: 'Name', min: 2, max: 150, required: true }),
      str(b.description, { field: 'Description', max: 4000 }),
      num(b.price, 'price'),
      str(b.image, { field: 'Image', max: 500 }),
      str(b.category, { field: 'Category', max: 80 }),
      Math.floor(num(b.stock ?? 0, 'stock')),
    );
    audit(req, 'product.create', 'product', lastInsertRowid);
    res.status(201).json(db.prepare('SELECT * FROM products WHERE id = ?').get(lastInsertRowid));
  } catch (e) { next(e); }
});

// products.edit may change any field; inventory.manage may only change stock.
router.put('/:id', requirePermission('products.edit', 'inventory.manage'), (req, res, next) => {
  try {
    const id = intId(req.params.id);
    const p = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    if (!p) return res.status(404).json({ error: 'Product not found.' });
    const b = req.body;
    const fullEdit = can(req.user, 'products.edit');
    const next_ = {
      name: fullEdit && b.name !== undefined ? str(b.name, { field: 'Name', min: 2, max: 150, required: true }) : p.name,
      description: fullEdit && b.description !== undefined ? str(b.description, { field: 'Description', max: 4000 }) : p.description,
      price: fullEdit && b.price !== undefined ? num(b.price, 'price') : p.price,
      image: fullEdit && b.image !== undefined ? str(b.image, { field: 'Image', max: 500 }) : p.image,
      category: fullEdit && b.category !== undefined ? str(b.category, { field: 'Category', max: 80 }) : p.category,
      stock: b.stock !== undefined ? Math.floor(num(b.stock, 'stock')) : p.stock,
    };
    db.prepare('UPDATE products SET name=@name, description=@description, price=@price, image=@image, category=@category, stock=@stock WHERE id=@id').run({ ...next_, id });
    audit(req, 'product.update', 'product', id, { fields: Object.keys(b) });
    res.json(db.prepare('SELECT * FROM products WHERE id = ?').get(id));
  } catch (e) { next(e); }
});

router.delete('/:id', requirePermission('products.delete'), (req, res, next) => {
  try {
    const id = intId(req.params.id);
    if (db.prepare('SELECT 1 FROM order_items WHERE product_id = ?').get(id)) {
      return res.status(409).json({ error: 'This product has orders and cannot be deleted. Set its stock to 0 instead.' });
    }
    const r = db.prepare('DELETE FROM products WHERE id = ?').run(id);
    if (!r.changes) return res.status(404).json({ error: 'Product not found.' });
    audit(req, 'product.delete', 'product', id);
    res.json({ message: 'Deleted.' });
  } catch (e) { next(e); }
});

export default router;
