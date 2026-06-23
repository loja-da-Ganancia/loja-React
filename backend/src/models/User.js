import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, unique: true, sparse: true },
  password: { type: String },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  bannerUrl: { type: String, default: null },
  profilePicUrl: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  favorites: { type: [Object], default: [] }
});

export default mongoose.model('User', UserSchema);
