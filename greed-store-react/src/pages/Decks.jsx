import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setTelaAtual, showToastAsync } from "../slices/uiSlice";
import { fetchCartasAPI, setParametrosBusca } from "../slices/searchSlice";
import { 
  loadDecksFromStorage, startNewDeck, closeCurrentDeck, setCurrentDeck, 
  toggleEditingStatus, renameDeck, removeCard, addCardThunk, saveDeckThunk, 
  deleteDeckThunk, isExtraDeckCard
} from "../slices/decksSlice";

const CARTAS_POR_PAGINA = 15;

export default function Decks() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // ====================================================
  // 1. EXTRAÇÃO DE ESTADOS GLOBAIS (Redux)
  // ====================================================
  const currentUser = useSelector((state) => state.user.currentUser);
  const { telaAtual, toastMsg } = useSelector((state) => state.ui);
  const { cartasPesquisa, termoBusca, paginaCartas, carregandoCartas, totalRecebido } = useSelector((state) => state.search);
  const { decksSalvos, deckAtual, isEditing } = useSelector((state) => state.decks);

  // ====================================================
  // 2. ESTADOS LOCAIS EFÊMEROS (UI)
  // ====================================================
  const [modalCardInfo, setModalCardInfo] = useState(null);
  const [modalFullDeck, setModalFullDeck] = useState(null);
  const [modalCarregar, setModalCarregar] = useState(false);
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [novoNomeDeck, setNovoNomeDeck] = useState('');
  const [imagemZoom, setImagemZoom] = useState(false);

  // ====================================================
  // 3. CICLO DE VIDA E TRAVA DE ESTADO
  // ====================================================
  useEffect(() => {
    if (currentUser) {
      dispatch(loadDecksFromStorage());
      dispatch(fetchCartasAPI({ termoBusca: '', paginaAlvo: 0 }));
      
      // Se o Redux iniciar com a tela 'menu' antiga, redireciona para o builder
      if (telaAtual === 'menu') {
        dispatch(setTelaAtual('builder'));
      }
    }
  }, [dispatch, currentUser, telaAtual]);

  // ====================================================
  // 4. TELA DE BLOQUEIO (GATEKEEPER)
  // ====================================================
  if (!currentUser) {
    return (
      <div className="container mt-5 mb-5 d-flex flex-column align-items-center justify-content-center flex-grow-1" style={{ minHeight: '65vh' }}>
        <div className="text-center p-5 rounded-4 shadow-lg" style={{ backgroundColor: '#161b22', border: '1px solid #30363d', maxWidth: '500px' }}>
          <div style={{ fontSize: '4.5rem', marginBottom: '10px', lineHeight: '1' }}>🔒</div>
          <h3 className="text-white fw-bold mt-2">Acesso Restrito</h3>
          <p className="mt-3 mb-4" style={{ color: '#8b949e', fontSize: '1.05rem', lineHeight: '1.6' }}>
            Você precisa estar conectado para acessar esta área. Faça login ou crie uma conta gratuita para montar suas estratégias!
          </p>
          <div className="d-flex gap-3 justify-content-center flex-wrap mt-2">
            <button className="btn btn-outline-secondary fw-bold text-light px-4" onClick={() => navigate('/marketplace')}>Voltar à Loja</button>
            <button className="btn btn-info fw-bold text-dark px-4 shadow-sm" onClick={() => navigate('/contas')}>Fazer Login</button>
          </div>
        </div>
      </div>
    );
  }

  // ====================================================
  // 5. LÓGICA DE NEGÓCIO (Usuário Logado)
  // ====================================================
  const mudarTela = (novaTela) => {
    dispatch(setTelaAtual(novaTela));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const efetuarBusca = (termo, pagina) => {
    dispatch(setParametrosBusca({ termoBusca: termo, paginaCartas: pagina }));
    dispatch(fetchCartasAPI({ termoBusca: termo, paginaAlvo: pagina }));
  };

  const alternarModoEdicaoLocal = () => {
    if (!deckAtual) return;
    if (isEditing) {
      const deckOriginal = decksSalvos.find((d) => d.id === deckAtual.id);
      if (deckOriginal) {
        dispatch(setCurrentDeck({ deck: JSON.parse(JSON.stringify(deckOriginal)), isEditing: false }));
        dispatch(showToastAsync('Alterações descartadas.', 'warning'));
      } else {
        dispatch(closeCurrentDeck());
      }
    } else {
      dispatch(toggleEditingStatus(true));
    }
  };

  const abrirModalRenomear = () => {
    if (!deckAtual || !isEditing) return;
    setNovoNomeDeck(deckAtual.nome || '');
    setRenameModalOpen(true);
  };

  const fecharModalRenomear = () => {
    setRenameModalOpen(false);
    setNovoNomeDeck('');
  };

  const confirmarRenomeacao = () => {
    if (!deckAtual || !isEditing) return;
    const nomeFormatado = novoNomeDeck.trim();
    if (!nomeFormatado) {
      dispatch(showToastAsync('⚠️ Informe um nome válido para o deck.', 'warning'));
      return;
    }

    const jaExiste = decksSalvos.some((d) => d.owner === currentUser.username && d.nome.toLowerCase() === nomeFormatado.toLowerCase() && d.id !== deckAtual.id);
    if (jaExiste) {
      dispatch(showToastAsync('⚠️ Já existe um deck com este nome! Escolha outro.', 'warning'));
      return;
    }

    dispatch(renameDeck(nomeFormatado));
    fecharModalRenomear();
  };

  const fecharModais = () => {
    setModalCardInfo(null);
    setModalFullDeck(null);
    setModalCarregar(false);
    setImagemZoom(false);
  };

  const currentUserDecks = decksSalvos.filter((d) => d.owner === currentUser.username);

  // ====================================================
  // 6. RENDERIZAÇÃO DA PÁGINA
  // ====================================================
  return (
    <div className="d-flex flex-column min-vh-100 flex-grow-1 mb-5">
      <div className="container mt-4">
        
        {/* CABEÇALHO SUPERIOR */}
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
          <div className="d-flex align-items-center gap-3">
            <h4 className="text-white m-0"> Área de Decks</h4>
          </div>
          
          <div className="btn-group" role="group">
            <button 
              type="button" 
              className={`btn btn-outline-info mode-btn ${telaAtual === 'builder' ? 'active text-dark' : ''}`} 
              onClick={() => mudarTela('builder')}
            >
              Construtor de Decks
            </button>
            <button 
              type="button" 
              className={`btn btn-outline-info mode-btn ${telaAtual === 'visualizador' ? 'active text-dark' : ''}`} 
              onClick={() => mudarTela('visualizador')}
            >
              Decks Salvos
            </button>
          </div>
        </div>

        {/* TELA: CONSTRUTOR DE DECKS */}
        {telaAtual === 'builder' && (
          <div className="row g-4">
            <div className="col-12 col-lg-7">
              <div className="deck-card p-4" style={{ backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '12px' }}>
                <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2 border-bottom border-secondary pb-3">
                  <div>
                    <strong className="deck-nome fw-bold" style={{ fontSize: '1.3rem' }}>{deckAtual ? deckAtual.nome : "Nenhum Deck Carregado"}</strong>
                    {isEditing && <button className="editar-nome ms-2 btn btn-sm btn-outline-secondary" title="Renomear" onClick={abrirModalRenomear}>✏️</button>}
                  </div>
                  <div className="d-flex gap-2">
                    {deckAtual && !isEditing && <button className="btn btn-sm btn-secondary fw-bold" onClick={() => dispatch(closeCurrentDeck())}>✖️ Fechar</button>}
                    {deckAtual && !isEditing && <button className="btn btn-sm btn-warning fw-bold text-dark" onClick={alternarModoEdicaoLocal}>✏️ Editar</button>}
                    {deckAtual && isEditing && (
                      <>
                        <button className="btn btn-sm btn-danger fw-bold" onClick={alternarModoEdicaoLocal}>❌ Descartar</button>
                        <button className="btn btn-sm btn-success fw-bold" onClick={() => dispatch(saveDeckThunk())}>💾 Salvar</button>
                      </>
                    )}
                    <button className="btn btn-sm btn-outline-info fw-bold" onClick={() => {
                      if (deckAtual && isEditing && !window.confirm("Você tem um deck em edição. Deseja descartar as alterações e criar um novo?")) return;
                      dispatch(startNewDeck());
                    }}>➕ Novo</button>
                  </div>
                </div>

                <h6 className="text-white m-0">Main Deck</h6>
                <div className="deck-area mt-2 mb-4 p-2 rounded" style={{ minHeight: '200px', backgroundColor: '#0d1117', border: '1px solid #30363d' }}>
                  {!deckAtual && <div className="w-100 text-center align-self-center my-4" style={{color: '#8b949e'}}>Selecione "Novo Deck" ou carregue um existente para começar.</div>}
                  {deckAtual && deckAtual.cartas.map((carta, idx) => {
                    if (isExtraDeckCard(carta.type)) return null;
                    return (
                      <div className="carta-mini" key={idx} style={{ transform: 'scale(1.08)', margin: '4px' }}>
                        <img src={carta.imagem} alt={carta.nome} style={{ borderRadius: '4px' }} />
                        <p title={carta.nome}>{carta.nome}</p>
                        {isEditing && <button className="remover-carta" title="Remover" onClick={() => dispatch(removeCard(idx))}>✕</button>}
                      </div>
                    );
                  })}
                </div>

                <h6 className="text-white m-0">Extra Deck <small style={{color: '#8b949e'}}>(Fusão, Synchro, XYZ, Link)</small></h6>
                <div className="deck-area mt-2 p-2 rounded" style={{ minHeight: '120px', backgroundColor: '#0d1117', border: '1px solid #30363d' }}>
                  {deckAtual && deckAtual.cartas.map((carta, idx) => {
                    if (!isExtraDeckCard(carta.type)) return null;
                    return (
                      <div className="carta-mini" key={idx} style={{ transform: 'scale(1.08)', margin: '4px' }}>
                        <img src={carta.imagem} alt={carta.nome} style={{ borderRadius: '4px' }} />
                        <p title={carta.nome}>{carta.nome}</p>
                        {isEditing && <button className="remover-carta" title="Remover" onClick={() => dispatch(removeCard(idx))}>✕</button>}
                      </div>
                    );
                  })}
                </div>

                <div className="d-flex justify-content-end mt-4 border-top border-secondary pt-3">
                  <button className="btn btn-sm btn-outline-light" onClick={() => setModalCarregar(true)}>📂 Carregar Deck do Banco</button>
                </div>
              </div>
            </div>

            <div className="col-12 col-lg-5">
              <div className="sticky-top" style={{top: '20px', zIndex: 100}}>
                <div className="p-3 rounded-3" style={{backgroundColor: '#161b22', border: '1px solid #30363d'}}>
                  <h5 className="text-white mb-3">🔍 Buscar Cartas</h5>
                  <div className="input-group mb-3">
                    <input 
                      type="text" className="form-control" placeholder="Ex: Mago Negro" value={termoBusca}
                      onChange={(e) => dispatch(setParametrosBusca({ termoBusca: e.target.value }))}
                      onKeyDown={(e) => { if(e.key === 'Enter') efetuarBusca(termoBusca, 0); }}
                    />
                    <button className="btn btn-info fw-bold" onClick={() => efetuarBusca(termoBusca, 0)}>Buscar</button>
                  </div>
                  
                  {(!deckAtual || !isEditing) && (
                    <div className="text-warning text-center mb-2" style={{fontSize: '0.9rem'}}>
                      ⚠️ Você precisa ativar o modo "Editar" ou criar um "Novo Deck" para adicionar cartas.
                    </div>
                  )}

                  <div className="cartas" style={{maxHeight: '60vh', overflowY: 'auto', paddingRight: '5px'}}>
                    {carregandoCartas && <div className="text-center text-info w-100 mt-4">Buscando cartas...</div>}
                    {!carregandoCartas && cartasPesquisa.length === 0 && <div className="text-center text-warning w-100 mt-4">Nenhuma carta encontrada.</div>}
                    {!carregandoCartas && cartasPesquisa.map((carta) => {
                      return (
                        <div className="carta" key={carta.id} onClick={() => dispatch(addCardThunk(carta))} style={{ transform: 'scale(1.08)', margin: '4px' }}>
                          <button className="info-btn" title="Ver Detalhes" onClick={(e) => { e.stopPropagation(); setModalCardInfo(carta); }}>i</button>
                          <img src={carta.card_images[0].image_url} alt={carta.name} loading="lazy" style={{ borderRadius: '4px' }} />
                          <p>{carta.name}</p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4 d-flex justify-content-center">
                    <div className="d-flex gap-2">
                      <button className="btn btn-outline-info btn-sm fw-bold" disabled={paginaCartas === 0} onClick={() => efetuarBusca(termoBusca, paginaCartas - 1)}>⮜ Ant</button>
                      <span className="d-flex align-items-center" style={{fontSize: '14px', color: '#c9d1d9'}}>Pág {paginaCartas + 1}</span>
                      <button className="btn btn-outline-info btn-sm fw-bold" disabled={totalRecebido < CARTAS_POR_PAGINA} onClick={() => efetuarBusca(termoBusca, paginaCartas + 1)}>Próx ⮞</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TELA: VISUALIZADOR DE DECKS */}
        {telaAtual === 'visualizador' && (
          <div className="row g-4">
            {currentUserDecks.length === 0 ? (
              <div className="col-12 text-center" style={{color: '#8b949e'}}>Você ainda não criou nenhum deck.</div>
            ) : (
              currentUserDecks.map((deck) => {
                return (
                  <div className="col-12 col-sm-6 col-md-4 col-lg-3" key={deck.id}>
                    <div className="deck-list-card h-100">
                      <h5 className="text-white">{deck.nome}</h5>
                      <p style={{color: '#8b949e'}}>{deck.cartas.length} carta(s)</p>
                      <div className="d-flex gap-2 mt-3">
                        <button className="btn btn-sm btn-info" onClick={() => setModalFullDeck(deck)}>👁️ Ver</button>
                        <button className="btn btn-sm btn-warning" onClick={() => {
                          dispatch(setCurrentDeck({ deck: JSON.parse(JSON.stringify(deck)), isEditing: true }));
                          mudarTela('builder');
                        }}>✏️ Editar</button>
                        <button className="btn btn-sm btn-danger" onClick={() => {
                          if (window.confirm('Tem certeza que deseja excluir este deck permanentemente?')) dispatch(deleteDeckThunk(deck.id));
                        }}>🗑️ Del</button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* ==================================================== */}
      {/* MODAIS E TOASTS */}
      {/* ==================================================== */}
      {modalFullDeck && (
        <>
          <div className="modal fade show d-block" tabIndex="-1" onClick={fecharModais}>
            <div className="modal-dialog modal-fullscreen" onClick={(e) => e.stopPropagation()}>
              <div className="modal-content" style={{backgroundColor: '#0d1117', border: 'none'}}>
                <div className="modal-header" style={{borderBottom: '1px solid #30363d'}}>
                  <h5 className="modal-title text-white">Deck: {modalFullDeck.nome} ({modalFullDeck.cartas.length} cartas)</h5>
                  <button type="button" className="ms-auto" onClick={fecharModais} style={{background: 'transparent', border: 'none', color: 'white', fontSize: '1.8rem', fontWeight: 'bold', cursor: 'pointer', lineHeight: '1', padding: '0 10px'}} aria-label="Fechar">&times;</button>
                </div>
                <div className="modal-body" style={{backgroundColor: '#0d1117'}}>
                  <div className="row g-3">
                    {modalFullDeck.cartas.map((carta, idx) => (
                      <div className="col-6 col-sm-4 col-md-3 col-lg-2" key={idx}>
                        <div className="card-item text-center p-2 rounded" style={{backgroundColor: '#161b22', border: '1px solid #30363d', cursor: 'pointer', transition: '0.2s'}} onClick={() => setModalCardInfo(carta)}>
                          <img src={carta.imagem} className="img-fluid rounded" alt={carta.nome} />
                          <small className="d-block mt-2 text-truncate text-white" title={carta.nome}>{carta.nome}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="modal-footer" style={{borderTop: '1px solid #30363d', backgroundColor: '#0d1117'}}>
                  <button type="button" className="btn btn-outline-light" onClick={fecharModais}>Fechar</button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </>
      )}

      {modalCardInfo && (
        <>
          {/* Modal Normal da Carta */}
          <div className="modal fade show d-block" tabIndex="-1" onClick={() => { setModalCardInfo(null); setImagemZoom(false); }} style={{zIndex: 1060}}>
            <div className="modal-dialog modal-dialog-centered modal-lg" onClick={(e) => e.stopPropagation()}>
              <div className="modal-content" style={{backgroundColor: '#161b22', border: '1px solid #30363d'}}>
                <div className="modal-header" style={{borderBottom: '1px solid #30363d'}}>
                  <h5 className="modal-title text-white">Detalhes da Carta</h5>
                  <button type="button" className="ms-auto" onClick={() => { setModalCardInfo(null); setImagemZoom(false); }} style={{background: 'transparent', border: 'none', color: 'white', fontSize: '1.8rem', fontWeight: 'bold', cursor: 'pointer', lineHeight: '1', padding: '0 10px'}} aria-label="Fechar">&times;</button>
                </div>
                <div className="modal-body text-center">
                  <div className="row">
                    <div className="col-md-5 text-center">
                      <div style={{ position: 'static' }}>
                        <img 
                          src={modalCardInfo.card_images ? modalCardInfo.card_images[0].image_url : modalCardInfo.imagem} 
                          className="img-fluid rounded border border-secondary" 
                          style={{boxShadow: '0 4px 15px rgba(0,0,0,0.5)', maxHeight: '400px', objectFit: 'contain', cursor: 'zoom-in'}} 
                          title="Clique para dar Zoom" 
                          onClick={() => setImagemZoom(true)} 
                          alt={modalCardInfo.name || modalCardInfo.nome} 
                        />
                      </div>
                      <p className="mt-2" style={{fontSize: '0.8rem', color: '#8b949e'}}>🔍 Clique na imagem para dar zoom</p>
                    </div>
                    <div className="col-md-7 text-start">
                      <h3 className="fw-bold text-white">{modalCardInfo.name || modalCardInfo.nome}</h3>
                      <p className="text-light"><strong>Tipo:</strong> <span style={{color: '#00d2ff'}}>{modalCardInfo.type || 'N/A'}</span></p>
                      <hr style={{borderColor: '#30363d'}} />
                      <p style={{whiteSpace: 'pre-wrap', fontSize: '0.95rem', lineHeight: '1.6', color: '#c9d1d9'}}>{modalCardInfo.desc || 'Descrição não disponível no momento.'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* O Fundo Escuro padrão do Bootstrap para o Modal Normal */}
          {!imagemZoom && <div className="modal-backdrop fade show" style={{zIndex: 1055}}></div>}

          {/* OVERLAY DE ZOOM GIGANTE (FORA DO MODAL) */}
          {imagemZoom && (
            <div 
              style={{
                position: 'fixed', 
                top: 0, 
                left: 0, 
                width: '100vw', 
                height: '100vh',
                backgroundColor: '#000000',
                zIndex: 1070,
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                cursor: 'zoom-out'
              }}
              onClick={() => setImagemZoom(false)}
            >
              <img 
                src={modalCardInfo.card_images ? modalCardInfo.card_images[0].image_url : modalCardInfo.imagem} 
                alt={modalCardInfo.name || modalCardInfo.nome}
                style={{ maxWidth: '100vw', maxHeight: '100vh', objectFit: 'contain' }}
              />
            </div>
          )}
        </>
      )}

      {renameModalOpen && (
        <>
          <div className="modal fade show d-block" tabIndex="-1" onClick={fecharModalRenomear}>
            <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
              <div className="modal-content rename-modal-card">
                <div className="modal-header" style={{borderBottom: '1px solid #30363d'}}>
                  <h5 className="modal-title text-white">Renomear Deck</h5>
                  <button type="button" className="ms-auto" onClick={fecharModalRenomear} style={{background: 'transparent', border: 'none', color: 'white', fontSize: '1.8rem', fontWeight: 'bold', cursor: 'pointer', lineHeight: '1', padding: '0 10px'}} aria-label="Fechar">&times;</button>
                </div>
                <div className="modal-body">
                  <p className="text-light mb-3">Atualize o nome do deck para algo mais claro e profissional.</p>
                  <input
                    type="text"
                    className="form-control rename-modal-input"
                    value={novoNomeDeck}
                    onChange={(e) => setNovoNomeDeck(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') confirmarRenomeacao(); }}
                    placeholder="Nome do Deck"
                    autoFocus
                  />
                </div>
                <div className="modal-footer" style={{borderTop: '1px solid #30363d'}}>
                  <button type="button" className="btn btn-outline-light" onClick={fecharModalRenomear}>Cancelar</button>
                  <button type="button" className="btn btn-info fw-bold" onClick={confirmarRenomeacao}>Salvar</button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </>
      )}

      {modalCarregar && (
        <>
          <div className="modal fade show d-block" tabIndex="-1" onClick={fecharModais}>
            <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
              <div className="modal-content" style={{backgroundColor: '#161b22', border: '1px solid #30363d'}}>
                <div className="modal-header" style={{borderBottom: '1px solid #30363d'}}>
                  <h5 className="modal-title text-white">Carregar do Banco de Dados</h5>
                  <button type="button" className="ms-auto" onClick={fecharModais} style={{background: 'transparent', border: 'none', color: 'white', fontSize: '1.8rem', fontWeight: 'bold', cursor: 'pointer', lineHeight: '1', padding: '0 10px'}} aria-label="Fechar">&times;</button>
                </div>
                <div className="modal-body">
                  {currentUserDecks.length === 0 ? (
                    <p className="text-warning text-center">Você não possui decks salvos.</p>
                  ) : (
                    <div className="list-group">
                      {currentUserDecks.map((d) => (
                        <button 
                          key={d.id} 
                          className="list-group-item list-group-item-action text-white" 
                          style={{backgroundColor: '#0d1117', borderColor: '#30363d'}}
                          onClick={() => { 
                            dispatch(setCurrentDeck({ deck: JSON.parse(JSON.stringify(d)), isEditing: false })); 
                            fecharModais(); 
                            dispatch(showToastAsync(`📂 Deck "${d.nome}" carregado para visualização.`, 'success')); 
                          }}
                        >
                          {d.nome} <small style={{color: '#8b949e'}}>({d.cartas.length} cartas)</small>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="modal-footer" style={{borderTop: '1px solid #30363d'}}>
                  <button type="button" className="btn btn-outline-light" onClick={fecharModais}>Cancelar</button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </>
      )}

      <div className="toast-alerta" style={{ display: toastMsg.visivel ? 'block' : 'none', background: toastMsg.tipo === 'warning' ? '#d97700' : '#2ea043' }}>
        {toastMsg.texto}
      </div>
    </div>
  );
}