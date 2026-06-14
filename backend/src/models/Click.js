import mongoose from 'mongoose';

const ClickSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    cardId: { type: String, required: true },       // O ID da carta clicada    
    affiliateStore: { type: String, required: true }, // Nome ou ID da loja (ex: 'TCGPlayer', 'Ligamagic')
    timestamp: { type: Date, default: Date.now }
});

export default mongoose.model('Click', ClickSchema);