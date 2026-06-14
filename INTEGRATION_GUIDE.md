# Backend + Frontend Integration Guide

## ✅ Status de Implementação

### Backend Express + MongoDB (COMPLETO)
- ✅ Autenticação JWT 
- ✅ Hash bcryptjs para senhas
- ✅ Rotas CRUD para Users, Decks, Posts
- ✅ Middleware de autorização
- ✅ Modelos MongoDB com Mongoose
- ✅ package.json com dependências

### Frontend React Atualizado (COMPLETO)
- ✅ `api.js` - cliente HTTP com suporte a JWT
- ✅ `userSlice.jsx` - Redux com async thunks
- ✅ `Contas.jsx` - Login/Cadastro via API
- ✅ Redux integrado com backend auth

---

## 🚀 Como Iniciar

### 1. Configurar Backend

```bash
cd backend
npm install
cp .env.example .env
```

Editar `.env`:
```
MONGO_URI=mongodb://localhost:27017/greed_store
JWT_SECRET=seu-secret-super-seguro-aqui
PORT=5000
```

Iniciar o backend (em outro terminal):
```bash
npm run dev
```

Server rodará em `http://localhost:5000`

### 2. Configurar Frontend

Frontend usa `http://localhost:5000` como API_BASE (em `src/api.js`).

Se o MongoDB não estiver rodando, o backend mostrará erro. **Instale MongoDB** ou use **MongoDB Atlas** (cloud):
- Mude `MONGO_URI` em `.env` para: `mongodb+srv://user:pass@cluster.mongodb.net/greed_store`

### 3. Testar Login/Cadastro

1. Abra o frontend (Vite dev server) em `http://localhost:5173/loja-React`
2. Vá para `/contas`
3. Cadastre novo usuário ou use admin/admin
4. Token JWT salvo em `sessionStorage` automaticamente
5. Perfil agora busca dados do backend

---

## 🔌 Endpoints Disponíveis

### Autenticação
- `POST /api/auth/register` - { username, password } → { token, user }
- `POST /api/auth/login` - { username, password } → { token, user }

### Usuários
- `GET /api/users` - lista todos (sem senhas)
- `GET /api/users/:id` - usuário específico
- `PUT /api/users/:id` - atualizar (requer JWT)
- `DELETE /api/users/:id` - deletar (requer JWT)

### Decks (Requer JWT Token)
- `GET /api/decks` - listar todos
- `POST /api/decks` - criar deck { title, description, cards }
- `GET /api/decks/:id` - buscar deck
- `PUT /api/decks/:id` - atualizar (apenas proprietário)
- `DELETE /api/decks/:id` - remover (apenas proprietário)

### Posts (Requer JWT Token)
- `GET /api/posts` - listar posts
- `POST /api/posts` - criar post { title, content }
- `GET /api/posts/:id` - buscar post
- `PUT /api/posts/:id` - atualizar (apenas autor)
- `DELETE /api/posts/:id` - remover (apenas autor)

---

## 📋 Headers para Rotas Protegidas

```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

Exemplo com curl:
```bash
curl -X GET http://localhost:5000/api/users/123 \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json"
```

---

## 🐛 Troubleshooting

### MongoDB não conecta
- Verifique se MongoDB está rodando: `mongod`
- Se usar Atlas, confirme IP whitelist e credenciais em `.env`

### CORS error
- Backend usa `cors` middleware (habilitado para qualquer origem)
- Verifique que frontend chama `http://localhost:5000` (não HTTPS)

### Token inválido
- Token JWT válido por 7 dias
- Se expirar, faça login novamente
- Token salvo em `sessionStorage` (limpa ao fechar aba)

### Usuário não encontrado
- Verifique case-sensitivity do username
- Tome cuidado ao atualizar o campo `username` via PUT

---

## 📝 Próximas Tarefas Sugeridas

1. **Integrar Decks com Backend**
   - Atualizar `decksSlice.jsx` para usar `/api/decks`
   - Salvar decks no banco em vez de localStorage

2. **Integrar Posts com Backend**
   - Atualizar `postSlice.jsx` para usar `/api/posts`
   - Mostrar posts por usuário/deck

3. **Proteção de Rotas**
   - Criar componente `PrivateRoute` que redireciona se não autenticado
   - Usar token `currentUser.token` para validar

4. **Autenticação Admin**
   - Criar page `/admin` que lista todos os usuários
   - Permitir promover/rebaixar roles (admin only)

5. **Upload de Imagens**
   - Adicionar multer no backend para upload
   - Serializar images como base64 ou URLs S3

---

## 🔐 Segurança

- **Passwords**: Hasheadas com bcryptjs (salt rounds: 10)
- **JWT**: Validade de 7 dias, assinado com `JWT_SECRET`
- **Middleware**: `auth.js` valida token em todas as rotas protegidas
- **CORS**: Habilitado para localhost durante dev

**Produção**: 
- Mude `API_BASE` para domínio real
- Use HTTPS para todas as requisições
- Aumente salt rounds do bcrypt
- Rotacione JWT_SECRET periodicamente

---

Desenvolvido com Express.js + MongoDB + React + Redux Toolkit 🎉
