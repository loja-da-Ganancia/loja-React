// ============================================================
// TESTES DA API — Backend rodando em http://localhost:5000
// ============================================================
// IMPORTANTE: o backend precisa estar rodando antes de rodar esses testes!
// No Terminal 1: cd backend → npm run dev

const BASE = 'http://localhost:5000/api'

// ============================================================
// GRUPO 1 — Rota de Registro (/api/auth/register)
// ============================================================

test('Registro: rejeita quando não envia username nem senha', async () => {
  const res = await fetch(`${BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}), // corpo vazio de propósito
  })
  const data = await res.json()

  expect(res.status).toBe(400)
  expect(data.erro ?? data.error).toContain('obrigatórios')
})

test('Registro: rejeita username com menos de 3 caracteres', async () => {
  const res = await fetch(`${BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'ab', password: 'senha123' }),
  })
  const data = await res.json()

  expect(res.status).toBe(400)
  expect(data.erro ?? data.error).toContain('3 caracteres')
})

// ============================================================
// GRUPO 2 — Rota de Login (/api/auth/login)
// ============================================================

test('Login: rejeita credenciais erradas', async () => {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'usuarioquenaoeexiste999', password: 'senhaerrada' }),
  })
  const data = await res.json()

  expect(res.status).toBe(400)
  expect(data.erro ?? data.error).toBeTruthy() // tem mensagem de erro
})

test('Login: rejeita quando não envia nada', async () => {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  })
  const data = await res.json()

  expect(res.status).toBe(400)
  expect(data.erro ?? data.error).toContain('obrigatórios')
})

// ============================================================
// GRUPO 3 — Rota de Posts (/api/posts)
// ============================================================

test('Posts: lista posts sem precisar estar logado', async () => {
  const res = await fetch(`${BASE}/posts`)
  const data = await res.json()

  expect(res.status).toBe(200)
  expect(Array.isArray(data)).toBe(true) // resposta é uma lista
})

test('Posts: bloqueia criação de post sem token JWT', async () => {
  const res = await fetch(`${BASE}/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Teste', content: 'Conteúdo' }),
    // sem Authorization header — deve bloquear
  })

  expect(res.status).toBe(401) // não autorizado
})
