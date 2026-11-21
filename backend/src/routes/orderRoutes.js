import express from 'express';
import jwt from 'jsonwebtoken';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) { res.status(401).json({ error: 'Invalid token' }); }
};

router.post('/', async (req, res) => {
  try {
    const { items, address, phone, userId } = req.body;
    if (!items || items.length === 0) return res.status(400).json({ error: 'No items' });
    let subtotal = 0;
    for (const item of items) {
      const product = req.db.prepare('SELECT * FROM products WHERE id = ?').get(item.productId);
      if (!product) return res.status(400).json({ error: `Product not found: ${item.productId}` });
      subtotal += product.price * item.quantity;
    }
    const shipping = subtotal > 500 ? 0 : 50;
    const tax = Math.round(subtotal * 0.18);
    const total = subtotal + tax + shipping;
    const orderResult = req.db.prepare(
      'INSERT INTO orders (user_id, total, status, address, phone) VALUES (?, ?, ?, ?, ?)'
    ).run(userId || null, total, 'pending', address, phone);
    const orderId = orderResult.lastInsertRowid;
    for (const item of items) {
      const product = req.db.prepare('SELECT price FROM products WHERE id = ?').get(item.productId);
      req.db.prepare(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)'
      ).run(orderId, item.productId, item.quantity, product.price);
      req.db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?').run(item.quantity, item.productId);
    }
    const order = req.db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    res.status(201).json(order);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.get('/', async (req, res) => {
  try {
    const orders = req.db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all();
    res.json(orders);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.get('/my-orders', auth, async (req, res) => {
  try {
    const orders = req.db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
    res.json(orders);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const order = req.db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    if (!order) return res.status(404).json({ error: 'Not found' });
    res.json(order);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

export default router;