import mongoose from 'mongoose';

const DeckSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  cards: { type: Array, default: [] },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Deck', DeckSchema);
