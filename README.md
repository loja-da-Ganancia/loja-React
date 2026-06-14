# Greed Store — Testes Automatizados com Vitest

Este documento descreve as mudanças feitas na versão original do projeto **Greed Store** para adicionar testes automatizados usando o Vitest.

---

## O que foi adicionado

### Dois arquivos de teste

**`src/meus-testes.test.js`** — testes de lógica do frontend

Esse arquivo testa partes do código que não dependem de servidor nem banco de dados. Ele verifica se o texto do componente Footer está correto e se a função de validação de login se comporta como esperado em diferentes situações: campos vazios, senha curta demais e dados corretos.

**`src/api.test.js`** — testes da API do backend

Esse arquivo faz requisições HTTP reais para o backend rodando na porta 5000 e verifica se as respostas estão corretas. Ele testa o registro de usuários, o login e as rotas de posts — incluindo verificar se a API bloqueia corretamente quem tenta criar um post sem estar autenticado.

### Mudança no `vite.config.js`

Foi adicionado um bloco `test` no arquivo de configuração do Vite para que o Vitest saiba como rodar os testes e gerar o relatório:

```js
test: {
  environment: 'node',
  globals: true,
  reporters: ['verbose', 'html'],
  outputFile: 'relatorio-testes.html',
}
```

---

## O que é o Vitest

Vitest é uma ferramenta de testes automatizados feita especificamente para projetos que usam Vite. Ela lê arquivos com extensão `.test.js`, executa cada verificação definida dentro deles e exibe no terminal quais passaram e quais falharam.

Testes automatizados existem para resolver um problema simples: conforme um projeto cresce, fica impossível testar tudo manualmente toda vez que alguém muda o código. Com o Vitest, um único comando verifica o projeto inteiro em questão de milissegundos.

No contexto deste projeto, o Vitest foi escolhido por ser a opção mais compatível com o Vite — que já é usado para rodar e construir o frontend. Não foi necessário instalar ferramentas extras como Babel ou configurar suporte a módulos ES, pois o Vitest já entende o mesmo formato de código que o projeto usa.

---

## Como rodar os testes

O backend precisa estar rodando antes de executar os testes da API.

**Terminal 1 — backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 — testes:**
```bash
cd greed-store-react
npx vitest run --reporter=verbose --reporter=html --outputFile=relatorio-testes.html
```

Para abrir a interface visual dos testes no navegador:
```bash
npx vitest --ui
```

---

##


<img width="1600" height="800" alt="WhatsApp Image 2026-06-14 at 04 27 56" src="https://github.com/user-attachments/assets/7ba5ef86-9ae1-4f63-a488-ea5f35897571" />
<img width="1600" height="799" alt="WhatsApp Image 2026-06-14 at 04 35 09" src="https://github.com/user-attachments/assets/6c835361-9ca3-4002-9154-549a4ebfa42b" />

[Uploading VitestTesteW.html…]()


10 testes divididos em 2 arquivos, cobrindo validação de formulário, texto de componentes e comportamento das rotas da API de autenticação e posts.
