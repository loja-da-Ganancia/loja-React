import express from 'express';
import auth from '../middleware/auth.js';
import Click from '../models/Click.js';
import User from '../models/User.js';

const router = express.Router();

// GET /api/clicks
// Traz a lista de cliques. Se for admin, traz de TODOS os usuários.
router.get('/', auth, async (req, res) => {
  try {
    // Busca o usuário logado para verificar o nível de acesso
    const usuarioLogado = await User.findById(req.user._id || req.user.id);
    if (!usuarioLogado) return res.status(404).json({ error: 'Usuário não encontrado' });

    let filtro = {}; // Filtro vazio = traz tudo do banco
    
    // Se NÃO for admin, restringe para trazer apenas os cliques do próprio usuário
    if (usuarioLogado.role !== 'admin') {
      filtro = { userId: usuarioLogado._id };
    }

    const clicks = await Click.find(filtro)
                              .sort({ timestamp: -1 })
                              .lean();
    res.json(clicks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/clicks
// Registra um novo clique
router.post('/', auth, async (req, res) => {
  try {
    const { cardId, affiliateStore } = req.body;
    const userId = req.user._id || req.user.id;

    const novoClique = new Click({
      userId,
      cardId,
      affiliateStore
    });

    await novoClique.save();
    res.status(201).json(novoClique);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/clicks/:id
// Deleta um registro específico
router.delete('/:id', auth, async (req, res) => {
  try {
    const click = await Click.findById(req.params.id);
    if (!click) return res.status(404).json({ error: 'Registro não encontrado' });

    const usuarioLogado = await User.findById(req.user._id || req.user.id);

    // Trava: garante que o usuário só apague os seus próprios cliques, a menos que seja admin
    if (click.userId.toString() !== usuarioLogado._id.toString() && usuarioLogado.role !== 'admin') {
      return res.status(403).json({ error: 'Não autorizado' });
    }

    await click.deleteOne();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/clicks
// Limpa o histórico de cliques
router.delete('/', auth, async (req, res) => {
  try {
    const usuarioLogado = await User.findById(req.user._id || req.user.id);

    if (usuarioLogado.role === 'admin') {
      // Admin purga o banco inteiro (botão do dashboard)
      await Click.deleteMany({});
      res.json({ success: true, message: 'Todo o histórico de cliques do sistema foi limpo' });
    } else {
      // Usuário normal limpa apenas os dele
      await Click.deleteMany({ userId: usuarioLogado._id });
      res.json({ success: true, message: 'Seu histórico de cliques foi limpo' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;