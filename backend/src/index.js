import dotenv from "dotenv";
dotenv.config({ path: './.env' }); // Carrega as variáveis de ambiente

import express from 'express';
import cors from 'cors';
import connectDB from './config/database.js'; // Note a extensão .js no final

import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);

import authRouter from './routes/auth.js';
import usersRouter from './routes/users.js';
import decksRouter from './routes/decks.js';
import postsRouter from './routes/posts.js';
import clicksRouter from './routes/clicks.js';
import favoritesRouter from './routes/favorites.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ limit: '5mb', extended: true }));

// Conexão com MongoDB
connectDB();

// Rotas API
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/decks', decksRouter);
app.use('/api/posts', postsRouter);
app.use('/api/clicks', clicksRouter);
app.use('/api/favorites', favoritesRouter);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});