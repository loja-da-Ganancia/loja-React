# Greed Store

Projeto de e-commerce desenvolvido com React + Vite + Redux no frontend e Express + MongoDB no backend.

## Como rodar

### Pré-requisitos
- Node.js instalado
- Conta no MongoDB Atlas

### 1. Configurar o backend

Dentro da pasta `backend/`, crie um arquivo `.env` baseado no `.env.example`:

```bash
cp backend/.env.example backend/.env
```

Preencha os valores no `.env` com suas próprias credenciais.

### 2. Rodar o backend

```bash
cd backend
npm install
npm run dev
```

### 3. Rodar o frontend

```bash
cd greed-store-react
npm install
npm run dev
```

Acesse `http://localhost:5173` no navegador.

## Testes automatizados

```bash
cd greed-store-react
npx vitest run --reporter=verbose
```

