import express from 'express';
import db, { audit, NOW } from '../db.js';
import { auth, requirePermission, can, ah } from '../middleware/rbac.js';
import { str, phone, oneOf, intId, ValidationError } from '../utils/validate.js';
import { isApprovedBuyer, bestPrice } from './productRoutes.js';

const router = express.Router();
const STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
const PAYMENT = ['cod', 'upi', 'bank'];
const round2 = (n) => Math.round(n * 100) / 100;

const itemsFor = (orderIds) => (orderIds.length
  ? db.all(`SELECT oi.order_id, oi.product_id, oi.quantity, oi.price, COALESCE(oi.product_name, p.name) AS name,
      COALESCE(oi.brand, p.brand) AS brand, COALESCE(oi.pack_size, p.pack_size) AS pack_size, p.slug
    FROM order_items oi LEFT JOIN products p ON p.id = oi.product_id
    WHERE oi.order_id IN (${orderIds.map(() => '?').join(', ')}) ORDER BY oi.id`, ...orderIds)
  : Promise.resolve([]));

const withItems = async (orders) => {
  const items = await itemsFor(orders.map((o) => o.id));
  return orders.map((o) => ({ ...o, items: items.filter((i) => i.order_id === o.id) }));
};

// Licensed PCOs only. Prices are always read from the database: the lowest of MRP, a running offer
// and the PCO price;
// MRP is inclusive of all taxes, so the total is the sum of the lines.
router.post('/', auth, ah(async (req, res) => {
  if (!await isApprovedBuyer(req.user.id)) {
    return res.status(403).json({ error: 'Orders are open to approved PCO buyer accounts only. Apply from the Shop page.', code: 'BUYER_NOT_APPROVED' });
  }
  const items = Array.isArray(req.body.items) ? req.body.items : [];
  if (!items.length || items.length > 50) throw new ValidationError('Your cart is empty.');
  const address = str(req.body.address, { field: 'Delivery address', min: 6, max: 300, required: true });
  const city = str(req.body.city, { field: 'City', min: 2, max: 60, required: true });
  const pincode = str(req.body.pincode, { field: 'PIN code', max: 6 });
  if (pincode && !/^[1-9][0-9]{5}$/.test(pincode)) throw new ValidationError('Enter a valid 6-digit PIN code.');
  const mobile = phone(req.body.phone || req.user.phone);
  const paymentMethod = oneOf(req.body.paymentMethod || 'cod', PAYMENT, 'payment method');
  const notes = str(req.body.notes, { field: 'Notes', max: 500 });

  // Merge repeated products and lock rows in id order (prevents deadlocks between concurrent orders).
  const qtyById = new Map();
  items.forEach((it) => {
    const qty = Number(it.quantity);
    if (!Number.isInteger(qty) || qty < 1 || qty > 999) throw new ValidationError('Invalid quantity.');
    const id = intId(it.productId);
    qtyById.set(id, (qtyById.get(id) || 0) + qty);
  });
  const wanted = [...qtyById].sort((a, b) => a[0] - b[0]);
  const buyer = await db.get('SELECT firm_name, gstin FROM buyer_profiles WHERE user_id = ?', req.user.id);

  const order = await db.tx(async (t) => {
    let subtotal = 0;
    let count = 0;
    const lines = [];
    for (const [productId, qty] of wanted) {
      const p = await t.get('SELECT id, name, brand, pack_size, mrp, mrp_verified, pco_price, offer_price, offer_ends, stock, is_active FROM products WHERE id = ? FOR UPDATE', productId);
      if (!p || !p.is_active) throw new ValidationError('A product in your cart is no longer available.');
      const price = bestPrice(p, { pco: true });
      if (price == null) throw new ValidationError(`${p.name} (${p.pack_size}) is price-on-request. Remove it and ask us for a quote.`);
      if (p.stock != null && p.stock < qty) throw new ValidationError(p.stock ? `Only ${p.stock} left of ${p.name} (${p.pack_size}).` : `${p.name} (${p.pack_size}) is out of stock.`);
      subtotal += price * qty;
      count += qty;
      lines.push({ p, qty, price });
    }
    const row = await t.get(`INSERT INTO orders (user_id, total, status, address, phone, city, pincode, firm_name, gstin, payment_method, notes, item_count, updated_at)
      VALUES (?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ${NOW}) RETURNING *`,
    req.user.id, round2(subtotal), address, mobile, city, pincode, buyer?.firm_name, buyer?.gstin, paymentMethod, notes, count);
    for (const { p, qty, price } of lines) {
      await t.run('INSERT INTO order_items (order_id, product_id, quantity, price, product_name, brand, pack_size) VALUES (?, ?, ?, ?, ?, ?, ?)',
        row.id, p.id, qty, price, p.name, p.brand, p.pack_size);
      if (p.stock != null) await t.run('UPDATE products SET stock = stock - ? WHERE id = ?', qty, p.id);
    }
    return row;
  });
  audit(req, 'order.create', 'order', order.id, { total: order.total });
  res.status(201).json((await withItems([order]))[0]);
}));

router.get('/my-orders', auth, ah(async (req, res) => {
  res.json(await withItems(await db.all('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT 200', req.user.id)));
}));

router.get('/', requirePermission('orders.view', 'orders.manage'), ah(async (req, res) => {
  const where = [];
  const params = [];
  if (req.query.status && STATUSES.includes(req.query.status)) { where.push('o.status = ?'); params.push(req.query.status); }
  if (req.query.q) {
    const q = `%${String(req.query.q).slice(0, 60)}%`;
    where.push('(o.firm_name ILIKE ? OR u.name ILIKE ? OR o.phone ILIKE ? OR CAST(o.id AS TEXT) = ?)'); params.push(q, q, q, String(req.query.q).replace(/\D/g, ''));
  }
  const rows = await db.all(`SELECT o.*, u.name AS user_name, u.email AS user_email FROM orders o LEFT JOIN users u ON u.id = o.user_id
    ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY o.created_at DESC, o.id DESC LIMIT 500`, ...params);
  res.json(await withItems(rows));
}));

router.get('/:id', auth, ah(async (req, res) => {
  const order = await db.get('SELECT o.*, u.name AS user_name, u.email AS user_email FROM orders o LEFT JOIN users u ON u.id = o.user_id WHERE o.id = ?', intId(req.params.id));
  if (!order || (order.user_id !== req.user.id && !can(req.user, 'orders.view') && !can(req.user, 'orders.manage'))) return res.status(404).json({ error: 'Order not found.' });
  res.json((await withItems([order]))[0]);
}));

// Status changes. Cancelling puts tracked stock back.
const setStatus = async (orderId, status, adminNote) => db.tx(async (t) => {
  const o = await t.get('SELECT * FROM orders WHERE id = ? FOR UPDATE', orderId);
  if (!o) return null;
  if (o.status === 'cancelled' && status !== 'cancelled') throw new ValidationError('A cancelled order cannot be reopened. Ask the buyer to order again.');
  if (status === 'cancelled' && o.status !== 'cancelled') {
    const lines = await t.all('SELECT product_id, quantity FROM order_items WHERE order_id = ?', orderId);
    for (const l of lines) await t.run('UPDATE products SET stock = stock + ? WHERE id = ? AND stock IS NOT NULL', l.quantity, l.product_id);
  }
  return t.get(`UPDATE orders SET status = ?, admin_note = COALESCE(?, admin_note), updated_at = ${NOW} WHERE id = ? RETURNING *`, status, adminNote, orderId);
});

router.patch('/:id', requirePermission('orders.manage'), ah(async (req, res) => {
  const id = intId(req.params.id);
  const status = oneOf(req.body.status, STATUSES, 'status');
  const row = await setStatus(id, status, str(req.body.adminNote, { field: 'Note', max: 500 }));
  if (!row) return res.status(404).json({ error: 'Order not found.' });
  audit(req, 'order.update', 'order', id, { status });
  res.json((await withItems([row]))[0]);
}));

// Record a manual payment (COD, UPI or bank transfer). Only staff with order rights can do this, and a
// payment reference (UTR / transaction ID / receipt number) is required, so an order is never marked
// paid without a confirmation to show for it.
router.patch('/:id/payment', requirePermission('orders.manage'), ah(async (req, res) => {
  const id = intId(req.params.id);
  const status = oneOf(req.body.status, ['paid', 'unpaid'], 'payment status');
  const ref = str(req.body.reference, { field: 'Payment reference', max: 120 });
  const o = await db.get('SELECT status, payment_method FROM orders WHERE id = ?', id);
  if (!o) return res.status(404).json({ error: 'Order not found.' });
  if (status === 'paid') {
    if (o.status === 'cancelled') throw new ValidationError('A cancelled order cannot be marked paid.');
    if (!ref || ref.length < 4) throw new ValidationError(o.payment_method === 'cod'
      ? 'Enter the cash receipt number or a note of who collected the payment.'
      : 'Enter the UPI / bank transaction reference (UTR) from the payment confirmation.');
  }
  const row = await db.get(status === 'paid'
    ? `UPDATE orders SET payment_status = 'paid', payment_ref = ?, paid_at = ${NOW}, payment_recorded_by = ?, updated_at = ${NOW} WHERE id = ? RETURNING *`
    : `UPDATE orders SET payment_status = 'unpaid', payment_ref = NULL, paid_at = NULL, payment_recorded_by = ?, updated_at = ${NOW} WHERE id = ? RETURNING *`,
  ...(status === 'paid' ? [ref, req.user.id, id] : [req.user.id, id]));
  audit(req, `order.payment_${status}`, 'order', id, { reference: ref });
  res.json((await withItems([row]))[0]);
}));

// Buyers can cancel their own order until it is confirmed.
router.post('/:id/cancel', auth, ah(async (req, res) => {
  const id = intId(req.params.id);
  const o = await db.get('SELECT user_id, status FROM orders WHERE id = ?', id);
  if (!o || o.user_id !== req.user.id) return res.status(404).json({ error: 'Order not found.' });
  if (o.status !== 'pending') return res.status(409).json({ error: 'This order is already being processed. Please call us to cancel it.' });
  const row = await setStatus(id, 'cancelled', null);
  audit(req, 'order.cancel', 'order', id);
  res.json((await withItems([row]))[0]);
}));

export default router;
