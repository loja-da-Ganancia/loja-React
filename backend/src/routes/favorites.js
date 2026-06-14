import express from 'express';
import auth from '../middleware/auth.js';
import User from '../models/User.js';

const router = express.Router();

// GET /api/favorites
// Busca todas as cartas favoritas do usuário autenticado
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('favorites').lean();
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
    
    res.json(user.favorites || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/favorites
// Adiciona uma nova carta à lista de favoritos do usuário
router.post('/', auth, async (req, res) => {
  try {
    const { carta } = req.body; // Espera o objeto da carta enviado pelo front-end

    if (!carta || (!carta.id && !carta._id)) {
      return res.status(400).json({ error: 'Dados da carta inválidos.' });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

    // Identifica o ID da carta independentemente do formato vindo da API externa
    const idCartaNova = String(carta.id || carta._id);

    // Evita duplicidade: checa se a carta já foi favoritada por este usuário
    const jaExiste = user.favorites.some(f => String(f.id || f._id) === idCartaNova);
    if (jaExiste) {
      return res.status(400).json({ error: 'Esta carta já está nos seus favoritos.' });
    }

    // Adiciona o objeto completo da carta no array do documento do usuário
    user.favorites.push(carta);
    await user.save();

    res.status(201).json(user.favorites);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/favorites/:id
// Remove uma carta específica dos favoritos usando o ID da carta
router.delete('/:id', auth, async (req, res) => {
  try {
    const idCartaParaRemover = String(req.params.id);

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

    // Filtra o array mantendo apenas as cartas que possuem ID diferente do informado
    const totalAntes = user.favorites.length;
    user.favorites = user.favorites.filter(f => String(f.id || f._id) !== idCartaParaRemover);

    if (user.favorites.length === totalAntes) {
      return res.status(404).json({ error: 'Carta não encontrada na lista de favoritos.' });
    }

    await user.save();
    res.json({ success: true, favorites: user.favorites });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;