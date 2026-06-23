import dns from 'dns';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// O caminho correto para o modelo estando na raiz do backend
import User from './src/models/User.js'; 

// Força a resolução de DNS pelo Google para evitar o erro de provedor
dns.setServers(['8.8.8.8', '8.8.4.4']);

// Como o script e o .env estão lado a lado no backend, fica apenas config()
dotenv.config();

const criarAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Conectado ao MongoDB. A verificar usuário Admin...');

    const adminExiste = await User.findOne({ username: 'Admin' });

    if (adminExiste) {
      console.log('O usuário "Admin" já existe no banco de dados. Nenhuma alteração foi feita.');
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash('Admin', 10);

    const novoAdmin = new User({
      username: 'Admin',
      password: hashedPassword,
      role: 'admin'
    });

    await novoAdmin.save();
    console.log('✅ Usuário Admin padrão criado com sucesso!');
    process.exit(0);

  } catch (erro) {
    console.error('❌ Erro ao criar admin:', erro);
    process.exit(1);
  }
};

criarAdmin();