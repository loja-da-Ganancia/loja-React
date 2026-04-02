import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

// ==========================================================
// CONSTANTES E HELPERS DE BANCO DE DADOS
// ==========================================================
// Chaves usadas para buscar os dados no LocalStorage e SessionStorage
const USERS_KEY = 'greedstore_users';
const SESSION_KEY = 'greedstore_session';
const DECKS_KEY = 'greedstore_decks';

// Função auxiliar para pegar o usuário da sessão atual (logado)
function getCurrentUser() {
  const session = sessionStorage.getItem(SESSION_KEY);
  return session ? JSON.parse(session) : null;
}

export default function Perfil() {
  const navigate = useNavigate();
  const userLogado = getCurrentUser();

  // ==========================================================
  // ESTADOS DE DADOS (Com Lazy Initialization para evitar o Erro do ESLint)
  // ==========================================================

  // Inicializa o usuário buscando os dados no LocalStorage logo no momento em que o componente é criado.
  // Isso resolve o aviso do ESLint e evita re-renderizações desnecessárias.
  const [usuario, setUsuario] = useState(() => {
    if (!userLogado) return null;
    const allUsers = JSON.parse(localStorage.getItem(USERS_KEY)) || [];
    return allUsers.find((u) => u.username === userLogado.username) || userLogado;
  });

  // Inicializa os decks filtrando apenas os que pertencem ao usuário logado
  const [meusDecks] = useState(() => {
    if (!userLogado) return [];
    const allDecks = JSON.parse(localStorage.getItem(DECKS_KEY)) || [];
    return allDecks.filter((deck) => deck.owner === userLogado.username);
  });

  // ==========================================================
  // ESTADOS DE FORMULÁRIO E MODAIS
  // ==========================================================

  // Controla qual modal está aberto ('capa', 'foto', 'nome' ou null para fechado)
  const [modalAberto, setModalAberto] = useState(null);

  // Estado para o input de mudança de nome. Já inicia com o nome do usuário validado acima.
  const [novoNome, setNovoNome] = useState(() => usuario ? usuario.username : "");

  // Estados para armazenar os arquivos de imagem selecionados pelo usuário no computador
  const [arquivoCapa, setArquivoCapa] = useState(null);
  const [arquivoFoto, setArquivoFoto] = useState(null);

  // ==========================================================
  // PROTEÇÃO DE ROTA (Efeito Colateral)
  // ==========================================================
  // Verifica se o usuário não existe. Se não existir, chuta de volta para a tela de contas.
  // Como removemos os setStates síncronos daqui, o ESLint para de reclamar.
  useEffect(() => {
    if (!userLogado) {
      navigate('/contas');
    }
  }, [userLogado, navigate]);

  // ==========================================================
  // LÓGICA DE ATUALIZAÇÃO E LOGOUT
  // ==========================================================

  // Função central para atualizar dados do usuário no LocalStorage e na Sessão
  function atualizarUsuarioNoBanco(novosDados) {
    let users = JSON.parse(localStorage.getItem(USERS_KEY)) || [];
    const userIndex = users.findIndex((u) => u.username === usuario.username);

    if (userIndex !== -1) {
      // Verifica se o novo nome de usuário passado já existe no banco
      if (novosDados.username) {
        const existe = users.some((u) => u.username === novosDados.username);
        if (existe) {
          window.alert("Este nome de usuário já está sendo usado por outro Duelista.");
          return;
        }
        users[userIndex].username = novosDados.username;
      }

      // Atualiza as URLs das imagens se elas forem passadas no objeto
      if (novosDados.profilePicUrl !== undefined) {
        users[userIndex].profilePicUrl = novosDados.profilePicUrl;
      }
      if (novosDados.bannerUrl !== undefined) {
        users[userIndex].bannerUrl = novosDados.bannerUrl;
      }

      // Salva as alterações globais no LocalStorage
      localStorage.setItem(USERS_KEY, JSON.stringify(users));

      // Atualiza a sessão atual para refletir as mudanças (caso o nome tenha mudado)
      const session = JSON.parse(sessionStorage.getItem(SESSION_KEY));
      if (novosDados.username) session.username = novosDados.username;
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));

      // Atualiza o estado da tela instantaneamente com os novos dados
      setUsuario(users[userIndex]);
      fecharModais();
    }
  }

  // Valida o novo nome e pede confirmação antes de salvar
  function salvarNome() {
    const nomeTrim = novoNome.trim();
    if (nomeTrim.length < 3) {
      window.alert("O nome deve ter pelo menos 3 caracteres.");
      return;
    }

    if (nomeTrim === usuario.username) {
      fecharModais();
      return;
    }

    const confirmacao = window.confirm("⚠️ ATENÇÃO:\nVocê está prestes a alterar seu nome de usuário. Isso afetará como você é visto em todo o sistema.\nDeseja realmente continuar?");
    if (confirmacao) {
      atualizarUsuarioNoBanco({ username: nomeTrim });
    }
  }

  // Lê a imagem da capa como DataURL (Base64) usando FileReader e salva no banco
  function salvarCapa() {
    if (arquivoCapa) {
      const reader = new FileReader();
      reader.onload = (e) => {
        atualizarUsuarioNoBanco({ bannerUrl: e.target.result });
      };
      reader.readAsDataURL(arquivoCapa);
    } else {
      window.alert("Por favor, selecione uma imagem primeiro.");
    }
  }
  // Remove a imagem da capa (banner) definindo-a como null no banco
  function removerCapa() {
    if (window.confirm("Deseja realmente remover sua imagem de capa?")) {
      atualizarUsuarioNoBanco({ bannerUrl: null });
    }
  }

  // Remove a foto de perfil definindo-a como null no banco
  function removerFoto() {
    if (window.confirm("Deseja realmente remover sua foto de perfil?")) {
      atualizarUsuarioNoBanco({ profilePicUrl: null });
    }
  }
  // Lê a imagem de perfil como DataURL (Base64) usando FileReader e salva no banco
  function salvarFoto() {
    if (arquivoFoto) {
      const reader = new FileReader();
      reader.onload = (e) => {
        atualizarUsuarioNoBanco({ profilePicUrl: e.target.result });
      };
      reader.readAsDataURL(arquivoFoto);
    } else {
      window.alert("Por favor, selecione uma imagem primeiro.");
    }
  }

  // Reseta os estados dos modais e limpa os arquivos selecionados para não vazar memória
  function fecharModais() {
    setModalAberto(null);
    setArquivoCapa(null);
    setArquivoFoto(null);
    if (usuario) setNovoNome(usuario.username);
  }

  // Remove a sessão do usuário e redireciona para a página inicial
  function fazerLogout() {
    if (window.confirm("Tem certeza que deseja sair da sua conta?")) {
      sessionStorage.removeItem(SESSION_KEY);
      navigate('/');
    }
  }

  // Previne a renderização do HTML caso o usuário não esteja logado (aguardando o redirect)
  if (!usuario) return null;

  // ==========================================================
  // RENDERIZAÇÃO DO COMPONENTE
  // ==========================================================
  return (
    <div className="flex-grow-1 mb-5">
      {/* 1. BANNER: Área clicável para alterar a imagem de fundo */}
      <div
        className={`banner-perfil ${usuario.bannerUrl ? 'tem-imagem' : ''}`}
        onClick={() => setModalAberto('capa')}
      >
        {usuario.bannerUrl && <img src={usuario.bannerUrl} alt="Banner" />}
        <div className="edit-overlay">✏️ Editar Capa</div>
      </div>

      <div className="container mt-4">
        <div className="row justify-content-center">
          <div className="col-12 text-center">

            {/* 2. FOTO DE PERFIL: Área clicável para alterar o avatar */}
            <div className="perfil-avatar-container" onClick={() => setModalAberto('foto')}>
              <div className={`foto-perfil ${usuario.profilePicUrl ? 'tem-imagem' : ''}`}>
                {usuario.profilePicUrl && <img src={usuario.profilePicUrl} alt="Foto de Perfil" />}
                {!usuario.profilePicUrl && <span>👤</span>}
                <div className="edit-overlay">📷 Editar</div>
              </div>
            </div>

            {/* 3. NOME EDITÁVEL E BIO */}
            <div className="mt-3">
              <div className="nome-editavel" onClick={() => setModalAberto('nome')} title="Editar Nome">
                <h2 className="m-0 fw-bold text-white">{usuario.username}</h2>
                <span className="ms-2 edit-icon">✏️</span>
              </div>
            </div>

            <p className="mt-2" style={{ color: '#8b949e' }}>
              Bem-vindo ao seu perfil! Aqui você pode ver suas informações e seus decks.
              {usuario.role === 'admin' && (
                <><br /><span className="badge bg-danger mt-2">Administrador</span></>
              )}
            </p>

            {/* BOTÃO DE LOGOUT */}
            <button onClick={fazerLogout} className="btn btn-outline-danger mt-3 fw-bold px-4">
              🚪 Sair da Conta
            </button>
          </div>
        </div>

        {/* 4. LISTAGEM DE DECKS DO USUÁRIO */}
        <div className="row mt-5">
          <div className="col-12">
            <h3 className="border-bottom border-secondary pb-2 text-white">📚 Meus Decks</h3>

            <div className="row g-4 mt-2">
              {/* Verifica se existem decks e renderiza a lista ou uma mensagem vazia encorajando a criação */}
              {meusDecks.length === 0 ? (
                <div className="col-12 text-center text-muted">
                  Você ainda não criou nenhum deck. <Link to="/decks" className="text-info">Crie agora!</Link>
                </div>
              ) : (
                meusDecks.map((deck) => (
                  <div className="col-12 col-sm-6 col-md-4 col-lg-3" key={deck.id}>
                    <div className="deck-card h-100 p-3 rounded" style={{ backgroundColor: '#161b22', border: '1px solid #30363d' }}>
                      <h5 className="text-white">{deck.nome}</h5>
                      <p style={{ color: '#8b949e' }}>{deck.cartas.length} carta(s)</p>
                      <Link to="/decks" className="btn btn-sm btn-info fw-bold text-dark">Gerenciar</Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================== */}
      {/* MODAIS (Renderização Condicional React)                      */}
      {/* ========================================================== */}

      {/* MODAL: EDITAR CAPA */}
      {modalAberto === 'capa' && (
        <>
          {/* Fundo clicável para fechar o modal caso clique fora da janela */}
          <div className="modal fade show d-block" tabIndex="-1" onClick={fecharModais}>
            {/* stopPropagation() impede que o clique dentro do modal acabe fechando ele */}
            <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
              <div className="modal-content" style={{ backgroundColor: '#161b22', border: '1px solid #30363d' }}>
                <div className="modal-header border-secondary">
                  <h5 className="modal-title text-white">Editar Capa</h5>
                  <button type="button" className="btn-close btn-close-white" onClick={fecharModais}></button>
                </div>
                <div className="modal-body">
                  <label className="form-label text-light">Escolha uma nova imagem de capa do seu PC:</label>
                  <input
                    type="file"
                    className="form-control"
                    accept="image/*"
                    onChange={(e) => setArquivoCapa(e.target.files[0])}
                  />
                </div>
                <div className="modal-footer border-secondary">
                  {/* Botão de excluir (só aparece se o usuário já tiver uma capa) */}
                  {usuario.bannerUrl && (
                    <button type="button" className="btn btn-outline-danger me-auto fw-bold" onClick={removerCapa}>
                      Remover Capa
                    </button>
                  )}
                  <button type="button" className="btn btn-secondary fw-bold" onClick={fecharModais}>Cancelar</button>
                  <button type="button" className="btn btn-info fw-bold text-dark" onClick={salvarCapa}>Salvar Capa</button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </>
      )}

      {/* MODAL: EDITAR FOTO */}
      {modalAberto === 'foto' && (
        <>
          <div className="modal fade show d-block" tabIndex="-1" onClick={fecharModais}>
            <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
              <div className="modal-content" style={{ backgroundColor: '#161b22', border: '1px solid #30363d' }}>
                <div className="modal-header border-secondary">
                  <h5 className="modal-title text-white">Editar Foto de Perfil</h5>
                  <button type="button" className="btn-close btn-close-white" onClick={fecharModais}></button>
                </div>
                <div className="modal-body">
                  <label className="form-label text-light">Escolha uma nova foto de perfil do seu PC:</label>
                  <input
                    type="file"
                    className="form-control"
                    accept="image/*"
                    onChange={(e) => setArquivoFoto(e.target.files[0])}
                  />
                </div>
                <div className="modal-footer border-secondary">
                  {/* Botão de excluir (só aparece se o usuário já tiver uma foto) */}
                  {usuario.profilePicUrl && (
                    <button type="button" className="btn btn-outline-danger me-auto fw-bold" onClick={removerFoto}>
                      Remover Foto
                    </button>
                  )}
                  <button type="button" className="btn btn-secondary fw-bold" onClick={fecharModais}>Cancelar</button>
                  <button type="button" className="btn btn-info fw-bold text-dark" onClick={salvarFoto}>Salvar Foto</button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </>
      )}

      {/* MODAL: EDITAR NOME */}
      {modalAberto === 'nome' && (
        <>
          <div className="modal fade show d-block" tabIndex="-1" onClick={fecharModais}>
            <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
              <div className="modal-content" style={{ backgroundColor: '#161b22', border: '1px solid #30363d' }}>
                <div className="modal-header border-secondary">
                  <h5 className="modal-title text-white">Editar Nome de Usuário</h5>
                  <button type="button" className="btn-close btn-close-white" onClick={fecharModais}></button>
                </div>
                <div className="modal-body">
                  <label className="form-label text-light">Novo Nome:</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={novoNome}
                    onChange={(e) => setNovoNome(e.target.value)}
                  />
                </div>
                <div className="modal-footer border-secondary">
                  <button type="button" className="btn btn-secondary fw-bold" onClick={fecharModais}>Cancelar</button>
                  <button type="button" className="btn btn-danger fw-bold" onClick={salvarNome}>Salvar Alteração</button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </>
      )}
    </div>
  );
}