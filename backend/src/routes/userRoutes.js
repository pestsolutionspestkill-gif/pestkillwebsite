import express from 'express';
import bcrypt from 'bcryptjs';
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

router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    const existing = req.db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) return res.status(400).json({ error: 'Email already registered' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = req.db.prepare(
      'INSERT INTO users (name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)'
    ).run(name, email, phone || '', hashedPassword, 'user');
    const token = jwt.sign({ id: result.lastInsertRowid, role: 'user' }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ message: 'Registration successful', user: { id: result.lastInsertRowid, name, email, role: 'user' }, token });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = req.db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ message: 'Login successful', user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role }, token });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.get('/profile', auth, async (req, res) => {
  try {
    const user = req.db.prepare('SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?').get(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.get('/', adminAuth, async (req, res) => {
  try {
    const users = req.db.prepare('SELECT id, name, email, phone, role, created_at FROM users ORDER BY created_at DESC').all();
    res.json(users);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.delete('/:id', adminAuth, async (req, res) => {
  try {
    req.db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

export default router;
