import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

/**
 * IMPORTAÇÕES DO REDUX
 * useSelector: Permite que o componente extraia dados do estado da Store do Redux.
 * useDispatch: Retorna uma referência à função dispatch da Store, usada para disparar ações (actions).
 */
import { useSelector, useDispatch } from "react-redux";

/**
 * IMPORTAÇÃO DAS ACTIONS
 * updateUser e logoutUser são as funções (actions) definidas no Slice do Redux
 * que contêm a lógica de como o estado deve ser alterado.
 */
import { updateUser, logoutUser } from "./userSlice"; 

export default function Perfil() {
  const navigate = useNavigate();
  const dispatch = useDispatch(); 

  /**
   * ACESSO AO ESTADO GLOBAL (Redux)
   * Em vez de ler o SessionStorage ou LocalStorage manualmente, o componente
   * "assina" o estado global. Sempre que o estado mudar na Store, este componente
   * será re-renderizado automaticamente com os valores atualizados.
   */
  const usuario = useSelector((state) => state.user.currentUser);
  const todosOsDecks = useSelector((state) => state.decks?.items || []);

  /**
   * LÓGICA DE DERIVAÇÃO DE DADOS
   * Filtramos a lista global de decks para exibir apenas aqueles cujo 'owner' 
   * corresponde ao username do usuário que está logado no momento.
   */
  const meusDecks = todosOsDecks.filter(deck => usuario && deck.owner === usuario.username);

  /**
   * ESTADOS LOCAIS (UI State)
   * Estes estados controlam apenas elementos visuais da tela que não precisam ser globais,
   * como a abertura de modais e o valor temporário que o usuário digita nos inputs.
   */
  const [modalAberto, setModalAberto] = useState(null);
  const [novoNome, setNovoNome] = useState("");
  const [arquivoCapa, setArquivoCapa] = useState(null);
  const [arquivoFoto, setArquivoFoto] = useState(null);

  /**
   * PROTEÇÃO DE ROTA E SINCRONIZAÇÃO
   * Se o estado 'usuario' no Redux se tornar nulo (ex: após logout), 
   * o useEffect detecta a mudança e redireciona para a tela de login.
   */
  useEffect(() => {
    if (!usuario) {
      navigate('/contas');
    } else {
      setNovoNome(usuario.username);
    }
  }, [usuario, navigate]);

  /**
   * FUNÇÕES DE INTERFACE
   * Limpam os estados temporários ao fechar os modais para evitar resíduos de dados.
   */
  function fecharModais() {
    setModalAberto(null);
    setArquivoCapa(null);
    setArquivoFoto(null);
    if (usuario) setNovoNome(usuario.username);
  }

  /**
   * SALVAR NOME (Redux Dispatch)
   * Valida o input e dispara a action 'updateUser'. 
   * O Redux cuidará de atualizar o banco (LocalStorage) e o estado global simultaneamente.
   */
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
    const confirmacao = window.confirm("Deseja realmente alterar seu nome?");
    if (confirmacao) {
      dispatch(updateUser({ username: nomeTrim })); 
      fecharModais();
    }
  }

  /**
   * PROCESSAMENTO DE IMAGENS
   * O FileReader converte o arquivo físico em uma string Base64.
   * Essa string é enviada via dispatch para o Redux salvar no perfil do usuário.
   */
  function salvarCapa() {
    if (arquivoCapa) {
      const reader = new FileReader();
      reader.onload = (e) => {
        dispatch(updateUser({ bannerUrl: e.target.result })); 
        fecharModais();
      };
      reader.readAsDataURL(arquivoCapa);
    } else {
      window.alert("Por favor, selecione uma imagem primeiro.");
    }
  }

  function removerCapa() {
    if (window.confirm("Deseja realmente remover sua imagem de capa?")) {
      dispatch(updateUser({ bannerUrl: null }));
    }
  }

  function salvarFoto() {
    if (arquivoFoto) {
      const reader = new FileReader();
      reader.onload = (e) => {
        dispatch(updateUser({ profilePicUrl: e.target.result })); 
        fecharModais();
      };
      reader.readAsDataURL(arquivoFoto);
    } else {
      window.alert("Por favor, selecione uma imagem primeiro.");
    }
  }

  function removerFoto() {
    if (window.confirm("Deseja realmente remover sua foto de perfil?")) {
      dispatch(updateUser({ profilePicUrl: null }));
    }
  }

  /**
   * LOGOUT
   * Dispara a action 'logoutUser', que limpa o currentUser na Store e remove a sessão.
   */
  function fazerLogout() {
    if (window.confirm("Tem certeza que deseja sair da sua conta?")) {
      dispatch(logoutUser()); 
      navigate('/');
    }
  }

  // Previne renderização se o Redux ainda estiver processando o estado do usuário
  if (!usuario) return null;

  return (
    <div className="flex-grow-1 mb-5">
      {/* SEÇÃO DO BANNER: Exibe imagem do Redux ou fundo vazio */}
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

            {/* SEÇÃO DA FOTO: Dados extraídos do objeto 'usuario' do Redux */}
            <div className="perfil-avatar-container" onClick={() => setModalAberto('foto')}>
              <div className={`foto-perfil ${usuario.profilePicUrl ? 'tem-imagem' : ''}`}>
                {usuario.profilePicUrl && <img src={usuario.profilePicUrl} alt="Foto de Perfil" />}
                {!usuario.profilePicUrl && <span>👤</span>}
                <div className="edit-overlay">📷 Editar</div>
              </div>
            </div>

            <div className="mt-3">
              <div className="nome-editavel" onClick={() => setModalAberto('nome')} title="Editar Nome">
                <h2 className="m-0 fw-bold text-white">{usuario.username}</h2>
                <span className="ms-2 edit-icon">✏️</span>
              </div>
            </div>

            <p className="mt-2" style={{ color: '#8b949e' }}>
              Bem-vindo ao seu perfil!
              {usuario.role === 'admin' && (
                <><br /><span className="badge bg-danger mt-2">Administrador</span></>
              )}
            </p>

            <button onClick={fazerLogout} className="btn btn-outline-danger mt-3 fw-bold px-4">
              🚪 Sair da Conta
            </button>
          </div>
        </div>

        {/* LISTAGEM DE DECKS: Mapeia o estado filtrado 'meusDecks' */}
        <div className="row mt-5">
          <div className="col-12">
            <h3 className="border-bottom border-secondary pb-2 text-white">📚 Meus Decks</h3>
            <div className="row g-4 mt-2">
              {meusDecks.length === 0 ? (
                <div className="col-12 text-center text-muted">
                  Ainda não há decks. <Link to="/decks" className="text-info">Crie um!</Link>
                </div>
              ) : (
                meusDecks.map((deck) => (
                  <div className="col-12 col-sm-6 col-md-4 col-lg-3" key={deck.id}>
                    <div className="deck-card h-100 p-3 rounded" style={{ backgroundColor: '#161b22', border: '1px solid #30363d' }}>
                      <h5 className="text-white">{deck.nome}</h5>
                      <p style={{ color: '#8b949e' }}>{deck.cartas?.length || 0} carta(s)</p>
                      <Link to="/decks" className="btn btn-sm btn-info fw-bold text-dark">Gerenciar</Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL DE EDIÇÃO DE CAPA */}
      {modalAberto === 'capa' && (
        <>
          <div className="modal fade show d-block" tabIndex="-1" onClick={fecharModais}>
            <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
              <div className="modal-content" style={{ backgroundColor: '#161b22', border: '1px solid #30363d' }}>
                <div className="modal-header border-secondary">
                  <h5 className="modal-title text-white">Editar Capa</h5>
                  <button type="button" className="btn-close btn-close-white" onClick={fecharModais}></button>
                </div>
                <div className="modal-body">
                  <label className="form-label text-light">Escolha uma nova imagem:</label>
                  <input
                    type="file"
                    className="form-control"
                    accept="image/*"
                    onChange={(e) => setArquivoCapa(e.target.files[0])}
                  />
                </div>
                <div className="modal-footer border-secondary">
                  {usuario.bannerUrl && (
                    <button type="button" className="btn btn-outline-danger me-auto fw-bold" onClick={removerCapa}>
                      Remover
                    </button>
                  )}
                  <button type="button" className="btn btn-secondary fw-bold" onClick={fecharModais}>Cancelar</button>
                  <button type="button" className="btn btn-info fw-bold text-dark" onClick={salvarCapa}>Salvar</button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </>
      )}

      {/* MODAL DE EDIÇÃO DE FOTO */}
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
                  <label className="form-label text-light">Escolha uma nova foto:</label>
                  <input
                    type="file"
                    className="form-control"
                    accept="image/*"
                    onChange={(e) => setArquivoFoto(e.target.files[0])}
                  />
                </div>
                <div className="modal-footer border-secondary">
                  {usuario.profilePicUrl && (
                    <button type="button" className="btn btn-outline-danger me-auto fw-bold" onClick={removerFoto}>
                      Remover
                    </button>
                  )}
                  <button type="button" className="btn btn-secondary fw-bold" onClick={fecharModais}>Cancelar</button>
                  <button type="button" className="btn btn-info fw-bold text-dark" onClick={salvarFoto}>Salvar</button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </>
      )}

      {/* MODAL DE EDIÇÃO DE NOME */}
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