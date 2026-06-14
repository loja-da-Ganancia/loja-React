import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Deck from '../models/Deck.js';   
import auth from '../middleware/auth.js'; 
import Click from '../models/Click.js';
import Post from '../models/Post.js';

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

// ====================================================
// ROTA: PROMOVER OU REBAIXAR USUÁRIO (Acesso Admin)
// ====================================================
router.put('/:id/role', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado. Apenas administradores podem gerir cargos.' });
    }

    const userAlvo = await User.findById(req.params.id);
    if (!userAlvo) return res.status(404).json({ error: 'Usuário não encontrado.' });

    if (userAlvo.username === 'admin') {
      return res.status(400).json({ error: 'O administrador principal não pode ser rebaixado.' });
    }

    // Altera o nível de acesso
    userAlvo.role = userAlvo.role === 'admin' ? 'user' : 'admin';
    await userAlvo.save();

    res.json({
      id: userAlvo._id,
      _id: userAlvo._id,
      username: userAlvo.username,
      email: userAlvo.email,
      role: userAlvo.role,
      bannerUrl: userAlvo.bannerUrl,
      profilePicUrl: userAlvo.profilePicUrl
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/:id (Atualização de Perfil comum)
router.put('/:id', auth, async (req, res) => {
  try {
    const updates = { ...req.body };
    delete updates.role; // Proteção contra escalonamento de privilégios

    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    if (updates.profilePicUrl === null) updates.profilePicUrl = null;
    if (updates.bannerUrl === null) updates.bannerUrl = null;

    const user = await User.findByIdAndUpdate(
      req.params.id, 
      updates, 
      { new: true }
    ).select('-password');
    
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ====================================================
// DELETE /api/users/:id (Remoção Definitiva e em Cascata)
// ====================================================
router.delete('/:id', auth, async (req, res) => {
  try {
    const userAlvo = await User.findById(req.params.id);
    if (!userAlvo) return res.status(404).json({ error: 'Usuário não encontrado.' });


    const ehOProprioUsuario = String(req.user._id) === String(userAlvo._id);
    const ehAdmin = req.user.role === 'admin';

    if (userAlvo.username === 'Admin') {
      return res.status(400).json({ error: 'O administrador principal não pode ser excluído.' });
    }

    if (!ehAdmin && !ehOProprioUsuario) {
      return res.status(403).json({ error: 'Acesso negado. Você não tem permissão para excluir esta conta.' });
    }

    // =======================================================
    // SEQUÊNCIA EM CASCATA ESTRITA
    // =======================================================
    
    // 1. Deleta os posts do usuário
    await Post.deleteMany({ author: userAlvo._id });

    // 2. Deleta os decks do usuário
    await Deck.deleteMany({ owner: userAlvo._id });

    // 3. Limpa cliques de afiliado vinculados
    await Click.deleteMany({ userId: userAlvo._id });

    // 4. Deleta o próprio usuário por fim
    await User.findByIdAndDelete(req.params.id);
    
    res.json({ success: true, message: 'Sua conta e todos os seus dados foram apagados com sucesso.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


export default router;