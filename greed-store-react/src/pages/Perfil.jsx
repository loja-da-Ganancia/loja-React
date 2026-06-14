import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { updateUserAsync, logoutUser } from "../slices/userSlice"; 
import { fetchDecksThunk, setCurrentDeck } from "../slices/decksSlice";
import { setTelaAtual, showToastAsync} from "../slices/uiSlice";
import {deleteUserAsync} from "../slices/userSlice";

export default function Perfil() {
  const navigate = useNavigate();
  const dispatch = useDispatch(); 

  const usuario = useSelector((state) => state.user.currentUser);
  const todosOsDecks = useSelector((state) => state.decks.decksSalvos || []);

  const meusDecks = todosOsDecks.filter(deck => usuario && deck.owner === usuario.username);

  const toastMsg = useSelector((state) => state.ui.toastMsg);

  const [modalAberto, setModalAberto] = useState(null);
  const [novoNome, setNovoNome] = useState("");
  const [arquivoCapa, setArquivoCapa] = useState(null);
  const [arquivoFoto, setArquivoFoto] = useState(null);
  const [previewBannerUrl, setPreviewBannerUrl] = useState(null);
  const [previewFotoUrl, setPreviewFotoUrl] = useState(null);
  const [removerBanner, setRemoverBanner] = useState(false);
  const [removerFoto, setRemoverFoto] = useState(false);
  const [modalExcluirConta, setModalExcluirConta] = useState(false);
  const [mostrarModalLogout, setMostrarModalLogout] = useState(false);



  useEffect(() => {
    if (usuario) {
      dispatch(fetchDecksThunk());
    }
  }, [dispatch, usuario]);

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

const handleConfirmarAutoExclusao = async () => {
    const userId = usuario?.id || usuario?._id;
    if (!userId) return;

    const resultAction = await dispatch(deleteUserAsync(userId));
    
    if (deleteUserAsync.fulfilled.match(resultAction)) {
      dispatch(logoutUser()); 
      setModalExcluirConta(false);
      navigate('/'); 
    } else {
      // FECHA O MODAL E MOSTRA O ERRO DO BACKEND NA TELA
      setModalExcluirConta(false);
      const mensagemErro = resultAction.payload || "Erro ao tentar excluir a conta.";
      dispatch(showToastAsync(`❌ ${mensagemErro}`, "error"));
    }
  };

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
      dispatch(showToastAsync("⚠️ O nome deve ter pelo menos 3 caracteres.", "warning"));
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
        dispatch(showToastAsync("❌ Não foi possível ler a imagem de capa. Tente novamente.", "error"));
        return;
      }
    }

    if (removerFoto) {
      updates.profilePicUrl = null;
    } else if (arquivoFoto) {
      try {
        updates.profilePicUrl = await readFileAsDataURL(arquivoFoto);
      } catch {
        dispatch(showToastAsync("❌ Não foi possível ler a foto de perfil. Tente novamente.", "error"));
        return;
      }
    }

    if (Object.keys(updates).length === 0) {
      dispatch(showToastAsync("⚠️ Nenhuma alteração foi feita no perfil.", "warning"));
      return;
    }

    dispatch(updateUserAsync(updates));
    dispatch(showToastAsync("✔️ Perfil atualizado com sucesso!", "success"));
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

  function fazerLogout() {
    setMostrarModalLogout(true);
  }

  function confirmarLogout() {
    dispatch(logoutUser()); 
    navigate('/');
    setMostrarModalLogout(false);
  }

  function gerenciarDeckDireto(deck) {
    dispatch(setCurrentDeck({ deck, isEditing: true }));
    dispatch(setTelaAtual('builder')); 
    navigate('/decks');
  }

  if (!usuario) return null;

  return (
    <div className="flex-grow-1 mb-5">
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

            {/* RETÂNGULO ESTILIZADO DE LOGOUT (Sem Ícone) */}
            <div className="d-flex justify-content-center mt-4">
              <div
                onClick={fazerLogout}
                className="d-flex align-items-center justify-content-between p-3 rounded-3 shadow-sm"
                style={{
                  backgroundColor: '#161b22',
                  border: '1px solid #30363d',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  width: '100%',
                  maxWidth: '400px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#dc3545';
                  e.currentTarget.style.backgroundColor = 'rgba(220, 53, 69, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#30363d';
                  e.currentTarget.style.backgroundColor = '#161b22';
                }}
              >
                <div className="text-start ps-2">
                  <h6 className="text-danger fw-bold m-0" style={{ fontSize: '1rem' }}>Sair da Conta</h6>
                  <small style={{ color: '#8b949e', fontSize: '0.8rem' }}>Encerrar sessão neste dispositivo</small>
                </div>
                <div style={{ color: '#8b949e', fontSize: '1.2rem' }}>❯</div>
              </div>
            </div>
        </div>
        </div>

        <div className="row mt-5">
          <div className="col-12">
            <h3 className="border-bottom border-secondary pb-2 text-white">📚 Meus Decks</h3>
            <div className="row g-4 mt-2">
              {meusDecks.length === 0 ? (
                <div className="col-12 text-muted">
                  <span className="text-white">Ainda não há decks.</span> <Link to="/decks" className="text-info">Crie um!</Link>
                </div>
              ) : (
                meusDecks.map((deck) => (
                  <div className="col-12 col-sm-6 col-md-4 col-lg-3" key={deck.id || deck._id}>
                    <div className="deck-card h-100 p-3 rounded" style={{ backgroundColor: '#161b22', border: '1px solid #30363d' }}>
                      <h5 className="text-white">{deck.nome}</h5>
                      <p style={{ color: '#8b949e' }}>{deck.cartas?.length || 0} carta(s)</p>
                      <button 
                        onClick={() => gerenciarDeckDireto(deck)} 
                        className="btn btn-sm btn-info fw-bold text-dark"
                      >
                        Gerenciar
                      </button>
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
                        disabled={usuario?.username?.toLowerCase() === 'admin'}
                      />
                      {/* Mensagem dinâmica explicando o motivo do bloqueio */}
                      {usuario?.username?.toLowerCase() === 'admin' ? (
                        <p className="text-warning mt-2 small">
                          * O nome do administrador base está protegido e não pode ser modificado por questões de integridade do sistema.
                        </p>
                      ) : (
                        <p className="text-secondary mt-2">Use um nome claro e fácil de reconhecer. O mínimo é 3 caracteres.</p>
                      )}
                    </section>

                  </div>
                </div>
                <div className="modal-footer border-secondary">
                  <button className="btn btn-danger fw-bold btn-sm" onClick={() => setModalExcluirConta(true)}>
                      Excluir Minha Conta
                      </button>
                  <button type="button" className="btn btn-secondary fw-bold" onClick={fecharModais}>Cancelar</button>
                  <button type="button" className="btn btn-info fw-bold text-dark" onClick={salvarPerfil}>Salvar alterações</button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </>
      )}

      {mostrarModalLogout && (
        <>
          <div className="modal fade show d-block" tabIndex="-1" onClick={() => setMostrarModalLogout(false)} style={{zIndex: 1080}}>
            <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
              <div className="modal-content text-center p-4 shadow-lg" style={{backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '15px'}}>
                <div className="mb-3">
                  <span style={{ fontSize: '3.5rem' }}></span>
                </div>
                <h4 className="text-white fw-bold mb-3">Sair da Conta?</h4>
                <p style={{ color: '#8b949e', fontSize: '1.05rem', lineHeight: '1.5' }}>
                  Tem certeza que deseja encerrar a sua sessão neste dispositivo?
                </p>
                <div className="d-flex justify-content-center gap-3 mt-4">
                  <button className="btn btn-outline-secondary fw-bold px-4" onClick={() => setMostrarModalLogout(false)}>
                    Cancelar
                  </button>
                  <button className="btn btn-danger fw-bold px-4 shadow" onClick={confirmarLogout}>
                    Sim, Sair
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" style={{zIndex: 1075}}></div>
        </>
      )}
      
      {/* MODAL CUSTOMIZADO: AUTOEXCLUSÃO DE CONTA */}
      {modalExcluirConta && (
        <>
          <div className="modal fade show d-block" tabIndex="-1" onClick={() => setModalExcluirConta(false)} style={{ zIndex: 1080 }}>
            <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
              <div className="modal-content text-center p-4 shadow-lg" style={{ backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '15px' }}>
                <div className="mb-3">
                  <span style={{ fontSize: '3.5rem' }}>⚠️</span>
                </div>
                <h4 className="text-white fw-bold mb-3">Excluir sua conta permanentemente?</h4>
                <p style={{ color: '#8b949e', fontSize: '1.05rem', lineHeight: '1.5' }}>
                  Tem certeza que deseja fazer isso, <strong className="text-white">@{usuario?.username}</strong>? <br/>
                  <span className="text-danger">Seus decks, postagens e interações serão completamente eliminados de forma irreversível.</span>
                </p>
                <div className="d-flex justify-content-center gap-3 mt-4">
                  <button className="btn btn-outline-secondary fw-bold px-4" onClick={() => setModalExcluirConta(false)}>
                    Cancelar
                  </button>
                  <button className="btn btn-danger fw-bold px-4 shadow" onClick={handleConfirmarAutoExclusao}>
                    Sim, Excluir Minha Conta
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" style={{ zIndex: 1075 }}></div>
        </>
      )}
      {/* CAIXA VISUAL DO TOAST PARA MENSAGENS DE ERRO/SUCESSO */}
      <div style={{
        position: 'fixed', 
        bottom: '30px', 
        right: '20px', 
        background: toastMsg?.tipo === 'error' || toastMsg?.tipo === 'warning' ? '#dc3545' : '#28a745', 
        color: 'white', 
        padding: '10px 20px', 
        borderRadius: '5px', 
        display: toastMsg?.visivel ? 'block' : 'none',
        zIndex: 9999, 
        fontWeight: 'bold', 
        boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
      }}>
      {toastMsg?.texto}
      </div>
    </div>
  );
}