import express from 'express';
import db, { audit } from '../db.js';
import { auth, requirePermission, can, ah } from '../middleware/rbac.js';
import { str, phone, oneOf, intId, ValidationError } from '../utils/validate.js';

const router = express.Router();
const STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

// Prices are always read from the database; client-supplied totals are ignored.
router.post('/', auth, ah(async (req, res) => {
  const items = Array.isArray(req.body.items) ? req.body.items : [];
  if (!items.length || items.length > 50) throw new ValidationError('Your cart is empty.');
  const address = str(req.body.address, { field: 'Address', min: 6, max: 300, required: true });
  const mobile = phone(req.body.phone || req.user.phone);
  // Merge repeated products and lock rows in id order (prevents deadlocks between concurrent orders).
  const qtyById = new Map();
  items.forEach((it) => {
    const qty = Number(it.quantity);
    if (!Number.isInteger(qty) || qty < 1 || qty > 999) throw new ValidationError('Invalid quantity.');
    const id = intId(it.productId);
    qtyById.set(id, (qtyById.get(id) || 0) + qty);
  });
  const wanted = [...qtyById].sort((a, b) => a[0] - b[0]).map(([productId, qty]) => ({ productId, qty }));

  const order = await db.tx(async (t) => {
    let subtotal = 0;
    const lines = [];
    for (const { productId, qty } of wanted) {
      // Lock the row so two simultaneous orders cannot both take the last units.
      const product = await t.get('SELECT id, name, price, stock FROM products WHERE id = ? FOR UPDATE', productId);
      if (!product) throw new ValidationError('A product in your cart is no longer available.');
      if (product.stock < qty) throw new ValidationError(`Only ${product.stock} left of ${product.name}.`);
      subtotal += product.price * qty;
      lines.push({ product, qty });
    }
    const shipping = subtotal > 500 ? 0 : 50;
    const total = subtotal + Math.round(subtotal * 0.18) + shipping;
    const row = await t.get("INSERT INTO orders (user_id, total, status, address, phone) VALUES (?, ?, 'pending', ?, ?) RETURNING *", req.user.id, total, address, mobile);
    for (const { product, qty } of lines) {
      await t.run('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)', row.id, product.id, qty, product.price);
      await t.run('UPDATE products SET stock = stock - ? WHERE id = ?', qty, product.id);
    }
    return row;
  });
  res.status(201).json(order);
}));

router.get('/my-orders', auth, ah(async (req, res) => {
  res.json(await db.all('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC, id DESC', req.user.id));
}));

router.get('/', requirePermission('orders.view'), ah(async (_req, res) => {
  res.json(await db.all('SELECT o.*, u.name AS user_name FROM orders o LEFT JOIN users u ON u.id = o.user_id ORDER BY o.created_at DESC, o.id DESC LIMIT 500'));
}));

router.get('/:id', auth, ah(async (req, res) => {
  const order = await db.get('SELECT * FROM orders WHERE id = ?', intId(req.params.id));
  if (!order || (order.user_id !== req.user.id && !can(req.user, 'orders.view'))) return res.status(404).json({ error: 'Order not found.' });
  order.items = await db.all('SELECT oi.quantity, oi.price, p.name FROM order_items oi JOIN products p ON p.id = oi.product_id WHERE oi.order_id = ?', order.id);
  res.json(order);
}));

router.patch('/:id', requirePermission('orders.manage'), ah(async (req, res) => {
  const id = intId(req.params.id);
  const status = oneOf(req.body.status, STATUSES, 'status');
  const row = await db.get('UPDATE orders SET status = ? WHERE id = ? RETURNING *', status, id);
  if (!row) return res.status(404).json({ error: 'Order not found.' });
  audit(req, 'order.update', 'order', id, { status });
  res.json(row);
}));

export default router;
