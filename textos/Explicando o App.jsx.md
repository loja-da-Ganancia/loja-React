# App.jsx – O coração da aplicação

## O que esse arquivo representa?

Se o `main.jsx` é o **motor de arranque**, o `App.jsx` é o **motor principal** já em funcionamento. É aqui que a gente:

- Liga o Redux à interface (com `<Provider>`).
- Configura o sistema de navegação entre páginas (`BrowserRouter`).
- Define o esqueleto visual que se repete em todo o site (Navbar, conteúdo central, Footer).
- Mapeia cada caminho da URL para a página correspondente.

Pense no `App.jsx` como o **diretor de palco**: ele decide qual ator (página) entra em cena, garante que todos tenham acesso ao figurino (Redux) e que o cenário principal (Navbar e Footer) esteja sempre visível.

---

## Explicando linha por linha

### Importações de bibliotecas e ferramentas

```jsx
// libs
import { BrowserRouter, Routes, Route } from 'react-router-dom';
```

**Tradução:**  
Pega três ferramentas da biblioteca `react-router-dom`, que cuida da navegação tipo site (muda a URL sem recarregar a página):
- `BrowserRouter`: o **gerente de rotas** que usa a barra de endereço real do navegador. Envolve todo o sistema de páginas.
- `Routes`: a **prateleira** onde colocamos todas as rotas. Só uma página por vez é exibida.
- `Route`: cada **ficha** que associa um caminho de URL a um componente (ex: `/perfil` → `<Perfil />`).

---

### As importações do Redux (o "cabo de força")

```jsx
// ==========================================================
// IMPORTAÇÕES DO REDUX (O Cabo de Força)
// ==========================================================
import { Provider } from 'react-redux';
// Puxa a bateria (store) que você criou no passo anterior.
// Se o arquivo store.js estiver em outra pasta, é só ajustar este caminho.
import { store } from './store'; 
```

**Tradução:**  
- `Provider`: uma **tomada geral** que espalha a energia (os dados) do Redux para todos os componentes. Sem ele, ninguém consegue acessar a store.
- `store`: a **bateria central** que importamos do `store.js` (ou `store.jsx`). É o grande armário de dados que já estudamos.

Aqui está a resposta para a dúvida anterior: **o `<Provider>` está no `App.jsx`**! Ele envolve tudo, então qualquer componente dentro de `<Provider>` pode acessar as gavetas da store usando `useSelector` e `useDispatch`.

---

### Componentes visuais fixos (o cenário)

```jsx
// componentes
import Navbar from './components/Navbar';
import Footer from './components/Footer';
```

**Tradução:**  
Importa dois **componentes que aparecem em todas as páginas**:
- `Navbar`: a barra de navegação superior (menu principal, links, talvez um campo de busca).
- `Footer`: o rodapé que fecha o layout.

Eles ficam fora do `<Routes>`, portanto aparecem **sempre**, independente da URL.

---

### Estilos específicos de cada página

```jsx
import './css/Comunidade.css';
import './css/Marketplace.css';
import './css/Decks.css';
import './css/Perfil.css';
import './css/Admin.css';
```

**Tradução:**  
Carrega arquivos de estilo exclusivos para certas páginas. O Bootstrap já dá a base, mas aqui você tem **ajustes finos** para cada tela. São importados globalmente, mas pela nomenclatura, cada um deve conter classes usadas apenas naquela página específica (ex: `.Comunidade` container, `.Marketplace` grid).

---

### Páginas da aplicação (os atores)

```jsx
import Home from './pages/Home';
import Marketplace from './pages/Marketplace';
import Decks from './pages/Decks';
import Favoritos from './pages/Favoritos'
import Comunidade from './pages/Comunidade';
import Contas from './pages/Contas';
import Perfil from './pages/Perfil';
import Admin from './pages/Admin';
import EsqueciSenhaPage from "./pages/EsqueciSenhaPage";
import ResetSenha from "./pages/ResetSenha";
```

**Tradução:**  
Aqui são chamadas todas as **páginas** do site. Cada uma é um componente React que será mostrado quando o usuário acessar um caminho específico. A lista revela as seções do seu site:

| Página | Provável função |
|--------|-----------------|
| `Home` | Página inicial |
| `Marketplace` | Loja ou vitrine |
| `Decks` | Coleções/decks (função principal) |
| `Favoritos` | Itens salvos/marcados |
| `Comunidade` | Área social/fórum |
| `Contas` | Gerenciamento de conta |
| `Perfil` | Perfil do usuário |
| `Admin` | Painel administrativo |
| `EsqueciSenhaPage` | Recuperação de senha |
| `ResetSenha` | Redefinir senha com token |

---

### A função principal `App()`

```jsx
function App() {
    return (
        <Provider store={store}>
            <BrowserRouter>
                <div className="d-flex flex-column min-vh-100">
                    
                    <Navbar />

                    {/* O conteúdo das páginas fica aqui no meio */}
                    <Routes>
                        <Route path="/" element={<Home/>} />
                        <Route path="/marketplace" element={<Marketplace />} />
                        <Route path="/decks" element={<Decks />} />
                        <Route path="/comunidade" element={<Comunidade />} />
                        <Route path="/favoritos" element={<Favoritos />} />
                        <Route path="/admin" element={<Admin />} />
                        <Route path="/perfil" element={<Perfil />} />
                        <Route path="/contas" element={<Contas />} />
                        <Route path="/esqueci-senha" element={<EsqueciSenhaPage />} />
                        <Route path="/reset" element={<ResetSenha />} />
                    </Routes>

                    <Footer />
                    
                </div>
            </BrowserRouter>
        </Provider>
    );
}
```

Vamos destrinchar cada camada:

#### 1. `<Provider store={store}>`
A **tomada geral** do Redux. Tudo o que está aqui dentro terá acesso ao estado global. É a primeira casca, porque a store precisa estar disponível antes de qualquer navegação.

#### 2. `<BrowserRouter>`
O **roteador** que lê a URL do navegador e decide qual componente mostrar. Precisa envolver todas as rotas.

#### 3. `<div className="d-flex flex-column min-vh-100">`
Aqui entram as classes do **Bootstrap**:
- `d-flex`: transforma a `<div>` em um contêiner flexível.
- `flex-column`: empilha os filhos verticalmente (Navbar, conteúdo, Footer).
- `min-vh-100`: altura mínima de 100% da janela (`vh` = viewport height). Garante que o rodapé fique no fim da tela mesmo que o conteúdo seja pequeno.

É o **esqueleto do layout**: a página inteira é uma coluna flexível que ocupa pelo menos a altura total da tela.

#### 4. `<Navbar />` e `<Footer />`
Os componentes fixos: barra superior e rodapé. Como estão fora do `<Routes>`, são exibidos em todas as páginas.

#### 5. `<Routes>` e `<Route>`
O **miolo** que troca conforme a URL. Cada `<Route>` define um caminho e um componente:
- `path="/"` → `<Home/>` (raiz do site).
- `path="/marketplace"` → `<Marketplace/>`.
- ... e assim por diante.

Somente **uma rota casa por vez**. Se a URL for `/perfil`, apenas `<Perfil />` é renderizado ali no meio.

---

## Como a navegação funciona na prática?

Os links que acionam essas rotas provavelmente estão no `Navbar` ou em outros componentes, usando `<Link to="/perfil">Perfil</Link>` do `react-router-dom`. Ao clicar, a URL muda suavemente, o `<BrowserRouter>` percebe e o `<Routes>` troca o componente no meio, sem recarregar a página.

---

## Visualizando a estrutura (esqueleto)

```
<Provider>                     ← Energia do Redux
  <BrowserRouter>              ← Leitor de URL
    <div (coluna flexível)>    ← Layout Bootstrap
      <Navbar />               ← Sempre visível
      <Routes>
        <Rota "/" → Home/>
        <Rota "/marketplace" → Marketplace/>
        ...                    ← Troca dinamicamente
      </Routes>
      <Footer />               ← Sempre visível
    </div>
  </BrowserRouter>
</Provider>
```

---

## Resumo para fixar

- O `App.jsx` é o **maestro**: rege Redux, navegação e layout.
- O `<Provider>` injeta a store em toda a aplicação.
- O `<BrowserRouter>` cuida das URLs e da troca de páginas.
- As classes Bootstrap (`d-flex flex-column min-vh-100`) criam um layout que gruda o rodapé embaixo.
- O `<Routes>` é um **trocador de páginas** que exibe apenas uma por vez.
- Navbar e Footer são **permanentes**, emolduram o conteúdo.
