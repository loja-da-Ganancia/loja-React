import express from 'express';
import auth from '../middleware/auth.js';
import Post from '../models/Post.js';
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const posts = await Post.find().lean();
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

router.put('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (!post.author || post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    Object.assign(post, req.body);
    await post.save();
    res.json(post);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (!post.author || post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    await post.deleteOne();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
