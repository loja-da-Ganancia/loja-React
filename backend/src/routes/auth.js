import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import User from '../models/User.js';
import auth from '../middleware/auth.js';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be defined');
}

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

const createToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '7d',
    algorithm: 'HS256',
  });
};

// POST /api/auth/register
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Usuário e senha são obrigatórios' });
    }
    if (username.trim().length < 3 || password.length < 6) {
      return res.status(400).json({ error: 'Usuário deve ter pelo menos 3 caracteres e senha pelo menos 6' });
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Email inválido' });
    }

    const existing = await User.findOne({ username });
    if (existing) {
      return res.status(400).json({ error: 'Nome de usuário já está em uso' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username: username.trim(), email: email || undefined, password: hashedPassword });
    await user.save();

    res.status(201).json({
      token: createToken(user._id),
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        bannerUrl: user.bannerUrl,
        profilePicUrl: user.profilePicUrl,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro interno ao registrar usuário' });
  }
});

// POST /api/auth/login
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Usuário e senha são obrigatórios' });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ error: 'Credenciais inválidas' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Credenciais inválidas' });
    }

    res.json({
      token: createToken(user._id),
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        bannerUrl: user.bannerUrl,
        profilePicUrl: user.profilePicUrl,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro interno ao autenticar usuário' });
  }
});

// GET /api/auth/me — retorna dados do usuário logado
router.get('/me', auth, async (req, res) => {
  res.json(req.user);
});

export default router;