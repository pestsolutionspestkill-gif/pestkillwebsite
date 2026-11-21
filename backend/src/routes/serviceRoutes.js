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

router.get('/', async (req, res) => {
  try {
    const services = req.db.prepare('SELECT * FROM services ORDER BY created_at DESC').all();
    res.json(services);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { name, description, price, image, city } = req.body;
    const result = req.db.prepare(
      'INSERT INTO services (name, description, price, image, city) VALUES (?, ?, ?, ?, ?)'
    ).run(name, description, price, image, city);
    const service = req.db.prepare('SELECT * FROM services WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(service);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { name, description, price, image, city } = req.body;
    req.db.prepare(
      'UPDATE services SET name = ?, description = ?, price = ?, image = ?, city = ? WHERE id = ?'
    ).run(name, description, price, image, city, req.params.id);
    const service = req.db.prepare('SELECT * FROM services WHERE id = ?').get(req.params.id);
    res.json(service);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    req.db.prepare('DELETE FROM services WHERE id = ?').run(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

export default router;
