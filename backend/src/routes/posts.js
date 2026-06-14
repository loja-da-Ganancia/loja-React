import express from 'express';
import auth from '../middleware/auth.js';
import Post from '../models/Post.js';
const router = express.Router();

// GET /api/posts
router.get('/', async (req, res) => {
  try {
    // O populate converte o ID do autor para mostrar o nome dele
    const posts = await Post.find().populate('author', 'username').lean();
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const post = new Post({ ...req.body, author: req.user._id });
    await post.save();
    res.status(201).json(post);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/posts/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post não encontrado' });

    // LIBERAÇÃO PARA ADMIN: Verifica se é o dono da postagem OU se tem a role 'admin'
    if (post.author !== req.user.username && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado. Apenas o autor ou um admin podem editar.' });
    }

    // Atualiza apenas os campos enviados
    if (req.body.title) post.title = req.body.title;
    if (req.body.content) post.content = req.body.content;

    await post.save();
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/posts/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post não encontrado' });

    // LIBERAÇÃO PARA ADMIN: Verifica se é o dono da postagem OU se tem a role 'admin'
    if (post.author !== req.user.username && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado. Apenas o autor ou um admin podem excluir.' });
    }

    await post.deleteOne();
    res.json({ success: true, message: 'Post excluído com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
