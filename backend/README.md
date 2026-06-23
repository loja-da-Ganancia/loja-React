Backend CRUD básico usando Express + MongoDB (Mongoose) com autenticação JWT.

Setup:

1. Copie `.env.example` para `.env` e configure `MONGO_URI` e `JWT_SECRET`.
2. Rode `npm install` dentro da pasta `backend`.
3. `npm run dev` para iniciar com nodemon.

Endpoints principais:
- `POST /api/auth/register` - criar conta (name, email, password)
- `POST /api/auth/login` - login (email, password)
- `GET /api/users` - listar usuários (sem senhas)
- `GET /api/users/:id` - buscar usuário
- `POST /api/decks` - criar deck (autenticado)
- `PUT /api/decks/:id` - atualizar deck (autenticado, proprietário)
- `DELETE /api/decks/:id` - remover deck (autenticado, proprietário)
- `GET /api/decks` - listar decks
- `POST /api/posts` - criar post (autenticado)
- `PUT /api/posts/:id` - atualizar post (autenticado, autor)
- `DELETE /api/posts/:id` - remover post (autenticado, autor)

Use o cabeçalho `Authorization: Bearer <token>` em rotas protegidas.

Ajuste modelos/rotas conforme a necessidade do frontend.
