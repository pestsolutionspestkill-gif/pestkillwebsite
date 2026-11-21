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

const adminAuth = async (req, res, next) => {
  await auth(req, res, () => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    next();
  });
};

router.get('/', async (req, res) => {
  try {
    const { category, search, page = 1, limit = 12 } = req.query;
    let query = '1=1';
    const params = [];
    if (category) { query += ' AND category = ?'; params.push(category); }
    if (search) { query += ' AND (name LIKE ? OR description LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    const total = req.db.prepare(`SELECT COUNT(*) as total FROM products WHERE ${query}`).get(...params).total;
    const offset = (page - 1) * limit;
    const products = req.db.prepare(`SELECT * FROM products WHERE ${query} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(parseInt(limit), offset, ...params);
    res.json({ products, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) } });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.get('/featured', async (req, res) => {
  try {
    const products = req.db.prepare('SELECT * FROM products ORDER BY created_at DESC LIMIT 8').all();
    res.json(products);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.get('/brands', async (req, res) => {
  try {
    const brands = req.db.prepare('SELECT DISTINCT category FROM products').all();
    res.json(brands.map(b => b.category));
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const product = req.db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!product) return res.status(404).json({ error: 'Not found' });
    res.json(product);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/', adminAuth, async (req, res) => {
  try {
    const { name, description, price, image, category, stock } = req.body;
    const result = req.db.prepare(
      'INSERT INTO products (name, description, price, image, category, stock) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(name, description, price, image, category, stock || 0);
    const product = req.db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(product);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { name, description, price, image, category, stock } = req.body;
    req.db.prepare(
      'UPDATE products SET name = ?, description = ?, price = ?, image = ?, category = ?, stock = ? WHERE id = ?'
    ).run(name, description, price, image, category, stock, req.params.id);
    const product = req.db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    res.json(product);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.delete('/:id', adminAuth, async (req, res) => {
  try {
    req.db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

export default router;