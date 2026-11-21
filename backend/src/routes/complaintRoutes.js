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

router.post('/', auth, async (req, res) => {
  try {
    const { subject, description } = req.body;
    const result = req.db.prepare(
      'INSERT INTO complaints (user_id, subject, description, status) VALUES (?, ?, ?, ?)'
    ).run(req.user.id, subject, description, 'pending');
    const complaint = req.db.prepare('SELECT * FROM complaints WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(complaint);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.get('/', async (req, res) => {
  try {
    const complaints = req.db.prepare('SELECT * FROM complaints ORDER BY created_at DESC').all();
    res.json(complaints);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.get('/my-complaints', auth, async (req, res) => {
  try {
    const complaints = req.db.prepare('SELECT * FROM complaints WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
    res.json(complaints);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    req.db.prepare('DELETE FROM complaints WHERE id = ?').run(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

export default router;