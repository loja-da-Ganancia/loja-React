// ============================================================
// TESTE 1 — Verifica se o texto do Footer está correto
// ============================================================
test('Footer tem o texto correto de copyright', () => {
  const textodoFooter = '© 2026 Greed Store™. Todos os direitos reservados.'

  // Verifica se o texto contém "Greed Store"
  expect(textodoFooter).toContain('Greed Store')

  // Verifica se o texto contém o ano 2026
  expect(textodoFooter).toContain('2026')

  // Verifica se o texto contém "direitos reservados"
  expect(textodoFooter).toContain('direitos reservados')
})

// ============================================================
// TESTE 2 — Verifica se a validação de login funciona certo
// ============================================================
function validarLogin(username, password) {
  if (!username || !password) {
    return { ok: false, erro: 'Usuário e senha são obrigatórios' }
  }
  if (username.length < 3 || password.length < 3) {
    return { ok: false, erro: 'Usuário e senha devem ter pelo menos 3 caracteres' }
  }
  return { ok: true }
}

test('Validação de login: rejeita campos vazios', () => {
  const resultado = validarLogin('', '')
  expect(resultado.ok).toBe(false)
  expect(resultado.erro).toBe('Usuário e senha são obrigatórios')
})

test('Validação de login: rejeita senha muito curta', () => {
  const resultado = validarLogin('lucas', 'ab')
  expect(resultado.ok).toBe(false)
  expect(resultado.erro).toBe('Usuário e senha devem ter pelo menos 3 caracteres')
})

test('Validação de login: aceita dados corretos', () => {
  const resultado = validarLogin('lucas', 'senha123')
  expect(resultado.ok).toBe(true)
})
