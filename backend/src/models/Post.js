import mongoose from 'mongoose';

const PostSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  deckId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Post', PostSchema);
