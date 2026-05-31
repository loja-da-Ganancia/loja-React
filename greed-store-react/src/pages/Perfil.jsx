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
import { updateUserAsync, logoutUser } from "../slices/userSlice"; 

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
  const [previewBannerUrl, setPreviewBannerUrl] = useState(null);
  const [previewFotoUrl, setPreviewFotoUrl] = useState(null);
  const [removerBanner, setRemoverBanner] = useState(false);
  const [removerFoto, setRemoverFoto] = useState(false);

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

  useEffect(() => {
    if (arquivoCapa) {
      const url = URL.createObjectURL(arquivoCapa);
      setPreviewBannerUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewBannerUrl(null);
  }, [arquivoCapa]);

  useEffect(() => {
    if (arquivoFoto) {
      const url = URL.createObjectURL(arquivoFoto);
      setPreviewFotoUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewFotoUrl(null);
  }, [arquivoFoto]);

  /**
   * FUNÇÕES DE INTERFACE
   * Limpam os estados temporários ao fechar os modais para evitar resíduos de dados.
   */
  function fecharModais() {
    setModalAberto(null);
    setArquivoCapa(null);
    setArquivoFoto(null);
    setPreviewBannerUrl(null);
    setPreviewFotoUrl(null);
    setRemoverBanner(false);
    setRemoverFoto(false);
    if (usuario) setNovoNome(usuario.username);
  }

  const readFileAsDataURL = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  async function salvarPerfil() {
    const nomeTrim = novoNome.trim();
    const updates = {};

    if (nomeTrim !== usuario.username && nomeTrim.length < 3) {
      window.alert("O nome deve ter pelo menos 3 caracteres.");
      return;
    }

    if (nomeTrim !== usuario.username) {
      updates.username = nomeTrim;
    }

    if (removerBanner) {
      updates.bannerUrl = null;
    } else if (arquivoCapa) {
      try {
        updates.bannerUrl = await readFileAsDataURL(arquivoCapa);
      } catch {
        window.alert("Não foi possível ler a imagem de capa. Tente novamente.");
        return;
      }
    }

    if (removerFoto) {
      updates.profilePicUrl = null;
    } else if (arquivoFoto) {
      try {
        updates.profilePicUrl = await readFileAsDataURL(arquivoFoto);
      } catch {
        window.alert("Não foi possível ler a foto de perfil. Tente novamente.");
        return;
      }
    }

    if (Object.keys(updates).length === 0) {
      window.alert("Nenhuma alteração feita.");
      return;
    }

    dispatch(updateUserAsync(updates));
    fecharModais();
  }

  function marcarRemoverCapa() {
    setArquivoCapa(null);
    setPreviewBannerUrl(null);
    setRemoverBanner(true);
  }

  function marcarRemoverFoto() {
    setArquivoFoto(null);
    setPreviewFotoUrl(null);
    setRemoverFoto(true);
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
      <div className={`banner-perfil ${usuario.bannerUrl ? 'tem-imagem' : ''}`}>
        <button
          type="button"
          className="perfil-config-btn"
          onClick={() => setModalAberto('editarPerfil')}
          title="Editar perfil"
        >
          ⚙️
        </button>
        {usuario.bannerUrl && <img src={usuario.bannerUrl} alt="Banner" />}
      </div>

      <div className="container mt-4">
        <div className="row justify-content-center">
          <div className="col-12 text-center">

            {/* SEÇÃO DA FOTO: Dados extraídos do objeto 'usuario' do Redux */}
            <div className="perfil-avatar-container">
              <div className={`foto-perfil ${usuario.profilePicUrl ? 'tem-imagem' : ''}`}>
                {usuario.profilePicUrl && <img src={usuario.profilePicUrl} alt="Foto de Perfil" />}
                {!usuario.profilePicUrl && <span>👤</span>}
              </div>
            </div>

            <div className="mt-3">
              <div className="nome-editavel">
                <h2 className="m-0 fw-bold text-white">{usuario.username}</h2>
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
                <div className="col-12  text-muted">
                  <span className="text-white">Ainda não há decks.</span> <Link to="/decks" className="text-info">Crie um!</Link>
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

      {modalAberto === 'editarPerfil' && (
        <>
          <div className="modal fade show d-block" tabIndex="-1" onClick={fecharModais}>
            <div className="modal-dialog modal-dialog-centered modal-xl" onClick={(e) => e.stopPropagation()}>
              <div className="modal-content perfil-edit-modal">
                <div className="modal-header border-secondary">
                  <h5 className="modal-title text-white">Editar Perfil</h5>
                  <button type="button" className="btn-close btn-close-white" onClick={fecharModais}></button>
                </div>
                <div className="modal-body">
                  <div className="perfil-edit-grid">
                    <section className="perfil-edit-card">
                      <h6 className="text-white mb-3">Imagem de Capa</h6>
                      <div className="perfil-preview-box mb-3">
                        {removerBanner ? (
                          <div className="text-muted">Pronto para remover a capa atual.</div>
                        ) : (previewBannerUrl || usuario.bannerUrl) ? (
                          <img src={previewBannerUrl || usuario.bannerUrl} alt="Prévia da Capa" />
                        ) : (
                          <div className="text-muted">Nenhuma capa configurada.</div>
                        )}
                      </div>
                      <input
                        type="file"
                        className="form-control mb-3"
                        accept="image/*"
                        onChange={(e) => {
                          setArquivoCapa(e.target.files[0]);
                          setRemoverBanner(false);
                        }}
                      />
                      <div className="d-flex flex-wrap gap-2 align-items-center">
                        <button type="button" className="btn btn-outline-danger fw-bold" onClick={marcarRemoverCapa}>
                          Remover capa
                        </button>
                        <span className="text-secondary">Tamanho recomendado: 1200x400</span>
                      </div>
                    </section>

                    <section className="perfil-edit-card">
                      <h6 className="text-white mb-3">Foto de Perfil</h6>
                      <div className="perfil-preview-box perfil-preview-avatar mb-3">
                        {removerFoto ? (
                          <div className="text-muted">Pronto para remover a foto atual.</div>
                        ) : (previewFotoUrl || usuario.profilePicUrl) ? (
                          <img src={previewFotoUrl || usuario.profilePicUrl} alt="Prévia da Foto" />
                        ) : (
                          <div className="text-muted">Nenhuma foto configurada.</div>
                        )}
                      </div>
                      <input
                        type="file"
                        className="form-control mb-3"
                        accept="image/*"
                        onChange={(e) => {
                          setArquivoFoto(e.target.files[0]);
                          setRemoverFoto(false);
                        }}
                      />
                      <div className="d-flex flex-wrap gap-2 align-items-center">
                        <button type="button" className="btn btn-outline-danger fw-bold" onClick={marcarRemoverFoto}>
                          Remover foto
                        </button>
                        <span className="text-secondary">Tamanho recomendado: 400x400</span>
                      </div>
                    </section>

                    <section className="perfil-edit-card perfil-edit-card-full">
                      <h6 className="text-white mb-3">Nome de Usuário</h6>
                      <label className="form-label text-light">Digite o nome que aparecerá em sua conta:</label>
                      <input
                        type="text"
                        className="form-control"
                        value={novoNome}
                        onChange={(e) => setNovoNome(e.target.value)}
                      />
                      <p className="text-secondary mt-2">Use um nome claro e fácil de reconhecer. O mínimo é 3 caracteres.</p>
                    </section>
                  </div>
                </div>
                <div className="modal-footer border-secondary">
                  <button type="button" className="btn btn-secondary fw-bold" onClick={fecharModais}>Cancelar</button>
                  <button type="button" className="btn btn-info fw-bold text-dark" onClick={salvarPerfil}>Salvar alterações</button>
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
