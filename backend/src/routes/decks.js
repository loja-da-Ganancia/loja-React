import express from 'express';
import auth from '../middleware/auth.js'
import Deck from '../models/Deck.js'
const router = express.Router();



// GET /api/decks
router.get('/', async (req, res) => {
  try {
    const decks = await Deck.find().lean();
    res.json(decks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/decks/:id
router.get('/:id', async (req, res) => {
  try {
    const deck = await Deck.findById(req.params.id);
    if (!deck) return res.status(404).json({ error: 'Deck not found' });
    res.json(deck);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/decks
router.post('/', auth, async (req, res) => {
  try {
    const deck = new Deck({ ...req.body, owner: req.user._id });
    await deck.save();
    res.status(201).json(deck);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/decks/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const deck = await Deck.findById(req.params.id);
    if (!deck) return res.status(404).json({ error: 'Deck not found' });
    if (!deck.owner || deck.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    Object.assign(deck, req.body);
    await deck.save();
    res.json(deck);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/decks/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const deck = await Deck.findById(req.params.id);
    if (!deck) return res.status(404).json({ error: 'Deck not found' });
    if (!deck.owner || deck.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    await deck.deleteOne();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;