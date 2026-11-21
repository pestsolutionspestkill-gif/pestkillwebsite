import express from 'express';
import db, { audit } from '../db.js';
import { auth, requirePermission, can } from '../middleware/rbac.js';
import { str, phone, oneOf, intId, ValidationError } from '../utils/validate.js';

const router = express.Router();
const STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

// Prices are always read from the database; client-supplied totals are ignored.
router.post('/', auth, (req, res, next) => {
  try {
    const items = Array.isArray(req.body.items) ? req.body.items : [];
    if (!items.length || items.length > 50) throw new ValidationError('Your cart is empty.');
    const address = str(req.body.address, { field: 'Address', min: 6, max: 300, required: true });
    const mobile = phone(req.body.phone || req.user.phone);

    const place = db.transaction(() => {
      let subtotal = 0;
      const lines = items.map((it) => {
        const qty = Number(it.quantity);
        if (!Number.isInteger(qty) || qty < 1 || qty > 999) throw new ValidationError('Invalid quantity.');
        const product = db.prepare('SELECT id, name, price, stock FROM products WHERE id = ?').get(intId(it.productId));
        if (!product) throw new ValidationError('A product in your cart is no longer available.');
        if (product.stock < qty) throw new ValidationError(`Only ${product.stock} left of ${product.name}.`);
        subtotal += product.price * qty;
        return { product, qty };
      });
      const shipping = subtotal > 500 ? 0 : 50;
      const total = subtotal + Math.round(subtotal * 0.18) + shipping;
      const { lastInsertRowid } = db.prepare("INSERT INTO orders (user_id, total, status, address, phone) VALUES (?, ?, 'pending', ?, ?)").run(req.user.id, total, address, mobile);
      lines.forEach(({ product, qty }) => {
        db.prepare('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)').run(lastInsertRowid, product.id, qty, product.price);
        db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?').run(qty, product.id);
      });
      return lastInsertRowid;
    });
    res.status(201).json(db.prepare('SELECT * FROM orders WHERE id = ?').get(place()));
  } catch (e) { next(e); }
});

router.get('/my-orders', auth, (req, res) => {
  res.json(db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id));
});

router.get('/', requirePermission('orders.view'), (_req, res) => {
  res.json(db.prepare(`SELECT o.*, u.name AS user_name FROM orders o LEFT JOIN users u ON u.id = o.user_id ORDER BY o.created_at DESC LIMIT 500`).all());
});

router.get('/:id', auth, (req, res, next) => {
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(intId(req.params.id));
    if (!order || (order.user_id !== req.user.id && !can(req.user, 'orders.view'))) return res.status(404).json({ error: 'Order not found.' });
    order.items = db.prepare(`SELECT oi.quantity, oi.price, p.name FROM order_items oi JOIN products p ON p.id = oi.product_id WHERE oi.order_id = ?`).all(order.id);
    res.json(order);
  } catch (e) { next(e); }
});

router.patch('/:id', requirePermission('orders.manage'), (req, res, next) => {
  try {
    const id = intId(req.params.id);
    const status = oneOf(req.body.status, STATUSES, 'status');
    const r = db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, id);
    if (!r.changes) return res.status(404).json({ error: 'Order not found.' });
    audit(req, 'order.update', 'order', id, { status });
    res.json(db.prepare('SELECT * FROM orders WHERE id = ?').get(id));
  } catch (e) { next(e); }
});

export default router;
