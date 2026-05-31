import express from 'express';
import bcrypt from 'bcryptjs'
import User from '../models/User.js'
const router = express.Router();

// GET /api/users - list
router.get('/', async (req, res) => {
  try {
    const users = await User.find().select('-password').lean();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/:id
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users
router.post('/', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;
    const user = new User({ username, email, password: hashedPassword, role });
    await user.save();
    const safeUser = user.toObject();
    delete safeUser.password;
    res.status(201).json(safeUser);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/users/:id
router.put('/:id', async (req, res) => {
  try {
    if (req.body.password) {
      req.body.password = await bcrypt.hash(req.body.password, 10);
    }
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/users/:id
router.delete('/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
