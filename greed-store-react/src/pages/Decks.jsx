import React, { useState, useEffect } from "react";

const STORAGE_KEY = 'greedstore_decks';
const CARTAS_POR_PAGINA = 15;

// Funções Auxiliares (Fora do componente para não recriar a cada renderização)
function isExtraDeckCard(type) {
  if (!type) return false;
  const t = type.toLowerCase();
  return t.includes('fusion') || t.includes('synchro') || t.includes('xyz') || t.includes('link');
}

function isSpell(type) { 
  return type && type.toLowerCase().includes('spell'); 
}

function isTrap(type) { 
  return type && type.toLowerCase().includes('trap'); 
}

function gerarId() { 
  return Date.now() + '-' + Math.random().toString(36).substr(2, 8); 
}

function getCurrentUsername() {
  const sessionData = sessionStorage.getItem('greedstore_session');
  if (sessionData) {
    try {
      return JSON.parse(sessionData).username;
    } catch { // <-- CORRIGIDO AQUI: Retirado o (e) não utilizado
      return null;
    }
  }
  return null;
}

export default function Decks() {
  // ----------------------------------------------------
  // ESTADOS GERAIS E DE NAVEGAÇÃO
  // ----------------------------------------------------
  const [telaAtual, setTelaAtual] = useState('menu'); // 'menu', 'builder', 'visualizador'
  const [toastMsg, setToastMsg] = useState({ texto: '', tipo: 'success', visivel: false });

  // ----------------------------------------------------
  // ESTADOS DE BANCO DE DADOS E DECKS
  // ----------------------------------------------------
  const [decksSalvos, setDecksSalvos] = useState([]);
  const [deckAtual, setDeckAtual] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // ----------------------------------------------------
  // ESTADOS DE PESQUISA E PAGINAÇÃO DE CARTAS
  // ----------------------------------------------------
  const [cartasPesquisa, setCartasPesquisa] = useState([]);
  const [termoBusca, setTermoBusca] = useState('');
  const [paginaCartas, setPaginaCartas] = useState(0);
  const [carregandoCartas, setCarregandoCartas] = useState(false);
  const [totalRecebido, setTotalRecebido] = useState(0);

  // ----------------------------------------------------
  // ESTADOS DE MODAIS E EFEITOS DE UI
  // ----------------------------------------------------
  const [modalCardInfo, setModalCardInfo] = useState(null);
  const [modalFullDeck, setModalFullDeck] = useState(null);
  const [modalCarregar, setModalCarregar] = useState(false);
  const [imagemZoom, setImagemZoom] = useState(false);

  // Inicialização (Load Decks from Storage)
  useEffect(() => {
    carregarDecksDoStorage();
    buscarCartasAPI('', 0);
  }, []);

  // ----------------------------------------------------
  // LÓGICA DE STORAGE E GERENCIAMENTO DE DECKS
  // ----------------------------------------------------
  function carregarDecksDoStorage() {
    const dados = localStorage.getItem(STORAGE_KEY);
    let decks = dados ? JSON.parse(dados) : [];
    const currentUser = getCurrentUsername();
    
    let mudou = false;
    decks = decks.map((deck) => {
      if (!deck.owner) {
        mudou = true;
        return { ...deck, owner: currentUser };
      }
      return deck;
    });
    
    if (mudou) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(decks));
    }
    
    setDecksSalvos(decks);
  }

  function salvarDecksNoStorage(novosDecks) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(novosDecks));
    setDecksSalvos(novosDecks);
  }

  function mostrarToast(texto, tipo) {
    setToastMsg({ texto: texto, tipo: tipo || 'success', visivel: true });
    setTimeout(() => {
      setToastMsg((prev) => ({ ...prev, visivel: false }));
    }, 2500);
  }

  function mudarTela(novaTela) {
    setTelaAtual(novaTela);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ----------------------------------------------------
  // LÓGICA DO CONSTRUTOR (BUILDER)
  // ----------------------------------------------------
  function criarNovoDeckBuilder() {
    const currentUser = getCurrentUsername();
    if (deckAtual && isEditing) {
      if (!window.confirm("Você tem um deck em edição. Deseja descartar as alterações e criar um novo?")) return;
    }

    let count = 1;
    let novoNome = `Novo Deck ${count}`;
    while (decksSalvos.some((d) => d.owner === currentUser && d.nome.toLowerCase() === novoNome.toLowerCase())) {
      count++;
      novoNome = `Novo Deck ${count}`;
    }

    setDeckAtual({
      id: gerarId(),
      nome: novoNome,
      cartas: [],
      owner: currentUser
    });
    setIsEditing(true);
    mostrarToast('Novo deck iniciado. Pode começar a adicionar as cartas!', 'success');
  }

  function fecharDeckBuilder() {
    setDeckAtual(null);
    setIsEditing(false);
  }

  function alternarModoEdicao() {
    if (!deckAtual) return;
    
    if (isEditing) {
      // Descartar alterações (recarrega do original salvo)
      const deckOriginal = decksSalvos.find((d) => d.id === deckAtual.id);
      if (deckOriginal) {
        setDeckAtual(JSON.parse(JSON.stringify(deckOriginal)));
        setIsEditing(false);
        mostrarToast('Alterações descartadas.', 'warning');
      } else {
        setDeckAtual(null);
        setIsEditing(false);
      }
    } else {
      setIsEditing(true);
    }
  }

  function salvarDeckAtual() {
    if (!deckAtual || !isEditing) return;
    
    const currentUser = getCurrentUsername();
    const jaExiste = decksSalvos.some((d) => { 
      return d.owner === currentUser && d.nome.toLowerCase() === deckAtual.nome.toLowerCase() && d.id !== deckAtual.id; 
    });
    
    if (jaExiste) {
      mostrarToast('⚠️ Já existe um deck salvo com este nome! Renomeie antes de salvar.', 'warning');
      return;
    }

    let novosDecks = [...decksSalvos];
    const index = novosDecks.findIndex((d) => d.id === deckAtual.id);
    
    if (index !== -1) {
      novosDecks[index] = deckAtual;
    } else {
      novosDecks.push(deckAtual);
    }
    
    salvarDecksNoStorage(novosDecks);
    const nomeSalvo = deckAtual.nome;
    setDeckAtual(null);
    setIsEditing(false);
    mostrarToast(`✔️ Deck "${nomeSalvo}" guardado no Banco de Dados!`, 'success');
  }

  function renomearDeckAtual() {
    if (!deckAtual || !isEditing) return;
    const novoNome = window.prompt('Digite o novo nome do deck:', deckAtual.nome);
    
    if (novoNome && novoNome.trim() !== '') {
      const nomeFormatado = novoNome.trim();
      const currentUser = getCurrentUsername();
      const jaExiste = decksSalvos.some((d) => { 
        return d.owner === currentUser && d.nome.toLowerCase() === nomeFormatado.toLowerCase() && d.id !== deckAtual.id; 
      });
      
      if (jaExiste) {
        mostrarToast('⚠️ Já existe um deck com este nome! Escolha outro.', 'warning');
        return;
      }
      
      setDeckAtual((prev) => ({ ...prev, nome: nomeFormatado }));
    }
  }

  // Manipulação de Cartas no Deck
  function calcularStatsDeck(cartas) {
    let stats = { main: 0, extra: 0, monsters: 0, spells: 0, traps: 0 };
    if(!cartas) return stats;
    
    cartas.forEach((c) => {
      if (isExtraDeckCard(c.type)) {
        stats.extra++;
      } else {
        stats.main++;
        if (isSpell(c.type)) stats.spells++;
        else if (isTrap(c.type)) stats.traps++;
        else stats.monsters++;
      }
    });
    return stats;
  }

  function adicionarCartaAoDeck(cartaAPI) {
    if (!deckAtual) {
      mostrarToast('⚠️ Crie ou carregue um deck primeiro!', 'warning');
      return;
    }
    if (!isEditing) {
      mostrarToast('⚠️ Você precisa clicar em "Editar Deck" para modificá-lo.', 'warning');
      return;
    }

    let copiasAtuais = 0;
    deckAtual.cartas.forEach((c) => { 
      if(c.nome === cartaAPI.name) copiasAtuais++; 
    });

    if (copiasAtuais >= 3) {
      mostrarToast(`⚠️ Limite atingido: Você já possui 3 cópias de "${cartaAPI.name}".`, 'warning');
      return;
    }

    const ehExtra = isExtraDeckCard(cartaAPI.type);
    const stats = calcularStatsDeck(deckAtual.cartas);

    if (ehExtra && stats.extra >= 15) {
      mostrarToast(`⚠️ Seu Extra Deck está cheio (Máx 15 cartas).`, 'warning');
      return;
    }
    if (!ehExtra && stats.main >= 60) {
      mostrarToast(`⚠️ Seu Main Deck está cheio (Máx 60 cartas).`, 'warning');
      return;
    }

    const novaCartaFormatada = {
      id: cartaAPI.id,
      nome: cartaAPI.name,
      imagem: cartaAPI.card_images[0].image_url,
      preco: cartaAPI.card_prices?.[0]?.tcgplayer_price || '0.00',
      type: cartaAPI.type,
      desc: cartaAPI.desc
    };

    setDeckAtual((prev) => {
      return { ...prev, cartas: [...prev.cartas, novaCartaFormatada] };
    });
    mostrarToast(`➕ ${cartaAPI.name} adicionada!`, 'success');
  }

  function removerCartaDoDeck(indexPlano) {
    if (!isEditing) return;
    setDeckAtual((prev) => {
      let novasCartas = [...prev.cartas];
      novasCartas.splice(indexPlano, 1);
      return { ...prev, cartas: novasCartas };
    });
  }

  // ----------------------------------------------------
  // LÓGICA DE API (BUSCA DE CARTAS)
  // ----------------------------------------------------
  async function buscarCartasAPI(termoBuscaInput, paginaAlvo) {
    setCarregandoCartas(true);
    setTermoBusca(termoBuscaInput);
    setPaginaCartas(paginaAlvo);

    let url = "https://db.ygoprodeck.com/api/v7/cardinfo.php?language=pt&num=" + CARTAS_POR_PAGINA + "&offset=" + (paginaAlvo * CARTAS_POR_PAGINA);
    if (termoBuscaInput.trim() !== '') {
      url += "&fname=" + encodeURIComponent(termoBuscaInput);
    }

    try {
      const resp = await fetch(url);
      if (resp.status === 400) {
        setCartasPesquisa([]);
        setTotalRecebido(0);
      } else {
        const dados = await resp.json();
        setCartasPesquisa(dados.data || []);
        setTotalRecebido(dados.data ? dados.data.length : 0);
      }
    } catch (erro) {
      console.error(erro);
      setCartasPesquisa([]);
      setTotalRecebido(0);
    }
    setCarregandoCartas(false);
  }

  // ----------------------------------------------------
  // LÓGICA DA LISTA DE DECKS (VISUALIZAÇÃO)
  // ----------------------------------------------------
  function excluirDeck(deckId) {
    if (!window.confirm('Tem certeza que deseja excluir este deck permanentemente?')) return;
    
    let novosDecks = decksSalvos.filter((d) => d.id !== deckId);
    if (deckAtual && deckAtual.id === deckId) {
      setDeckAtual(null);
      setIsEditing(false);
    }
    salvarDecksNoStorage(novosDecks);
    mostrarToast('Deck excluído com sucesso.', 'success');
  }

  function carregarDeckParaEdicaoDireta(deckId) {
    const deckEncontrado = decksSalvos.find((d) => d.id === deckId);
    if (deckEncontrado) {
      setDeckAtual(JSON.parse(JSON.stringify(deckEncontrado)));
      setIsEditing(true);
      mudarTela('builder');
    }
  }

  function fecharModais() {
    setModalCardInfo(null);
    setModalFullDeck(null);
    setModalCarregar(false);
    setImagemZoom(false);
  }

  // ----------------------------------------------------
  // RENDERIZAÇÃO (JSX)
  // ----------------------------------------------------
  const currentUserDecks = decksSalvos.filter((d) => d.owner === getCurrentUsername());
  const statsAtuais = calcularStatsDeck(deckAtual ? deckAtual.cartas : null);

  return (
    <div className="d-flex flex-column min-vh-100 flex-grow-1 mb-5">
      {/* TELA MENU PRINCIPAL */}
      {telaAtual === 'menu' && (
        <div className="container" style={{ marginTop: '80px', marginBottom: '80px' }}>
          <h2 className="text-center text-white mb-5 fw-bold" style={{ fontSize: '2.5rem' }}>O que você deseja fazer?</h2>
          <div className="row g-4 justify-content-center">
            <div className="col-md-5">
              <div className="menu-card" onClick={() => mudarTela('builder')}>
                <div className="menu-card-icon">🛠️</div>
                <h3 className="fw-bold text-white">Construtor de Decks</h3>
                <p className="mt-2 text-light">Crie novos decks do zero, busque cartas e monte sua estratégia perfeita.</p>
              </div>
            </div>
            <div className="col-md-5">
              <div className="menu-card" onClick={() => mudarTela('visualizador')}>
                <div className="menu-card-icon">🗂️</div>
                <h3 className="fw-bold text-white">Meus Decks Salvos</h3>
                <p className="mt-2 text-light">Visualize, edite ou exclua os decks que você já guardou no banco de dados.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TELA DE CONTEÚDO (BUILDER OU VISUALIZADOR) */}
      {telaAtual !== 'menu' && (
        <div className="container mt-4">
          {/* Header de Navegação Interna */}
          <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
            <div className="d-flex align-items-center gap-3">
              <button className="btn btn-outline-light btn-sm fw-bold" onClick={() => mudarTela('menu')}>⬅️ Voltar ao Menu</button>
              <h4 className="text-white m-0">🗃️ Área de Decks</h4>
            </div>
            <div className="btn-group" role="group">
              <button 
                type="button" 
                className={`btn btn-outline-info mode-btn ${telaAtual === 'builder' ? 'active text-dark' : ''}`}
                onClick={() => mudarTela('builder')}
              >
                ✏️ Construtor
              </button>
              <button 
                type="button" 
                className={`btn btn-outline-info mode-btn ${telaAtual === 'visualizador' ? 'active text-dark' : ''}`}
                onClick={() => mudarTela('visualizador')}
              >
                👁️ Meus Decks Salvos
              </button>
            </div>
          </div>

          {/* MODO CONSTRUTOR */}
          {telaAtual === 'builder' && (
            <div className="row g-4">
              {/* COLUNA ESQUERDA: O Deck Atual */}
              <div className="col-12 col-lg-7">
                <div className="deck-card">
                  <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                    <div>
                      <strong className="deck-nome fw-bold">{deckAtual ? deckAtual.nome : "Nenhum Deck Carregado"}</strong>
                      {isEditing && (
                        <button className="editar-nome" title="Renomear" onClick={renomearDeckAtual}>✏️</button>
                      )}
                    </div>
                    <div className="d-flex gap-2">
                      {deckAtual && !isEditing && (
                        <button className="btn btn-sm btn-secondary fw-bold" onClick={fecharDeckBuilder}>✖️ Fechar</button>
                      )}
                      {deckAtual && !isEditing && (
                        <button className="btn btn-sm btn-warning fw-bold text-dark" onClick={alternarModoEdicao}>✏️ Editar</button>
                      )}
                      {deckAtual && isEditing && (
                        <>
                          <button className="btn btn-sm btn-danger fw-bold" onClick={alternarModoEdicao}>❌ Descartar</button>
                          <button className="btn btn-sm btn-success fw-bold" onClick={salvarDeckAtual}>💾 Salvar</button>
                        </>
                      )}
                      <button className="btn btn-sm btn-outline-info fw-bold" onClick={criarNovoDeckBuilder}>➕ Novo</button>
                    </div>
                  </div>

                  {/* Badges de Status */}
                  <div className="d-flex flex-wrap gap-2 mb-3 p-2 rounded" style={{background: '#0d1117', border: '1px solid #30363d', opacity: deckAtual ? '1' : '0.5'}}>
                    <span className={`badge badge-main ${statsAtuais.main === 60 ? 'bg-danger border border-white' : ''}`}>🎴 Main: <span>{statsAtuais.main}</span>/60</span>
                    <span className={`badge badge-extra ${statsAtuais.extra === 15 ? 'bg-danger border border-white' : ''}`}>🟣 Extra: <span>{statsAtuais.extra}</span>/15</span>
                    <span className="badge badge-monster">🐉 Monstros: <span>{statsAtuais.monsters}</span></span>
                    <span className="badge badge-spell">🪄 Mágicas: <span>{statsAtuais.spells}</span></span>
                    <span className="badge badge-trap">🪤 Armadilhas: <span>{statsAtuais.traps}</span></span>
                  </div>

                  {/* Main Deck Area */}
                  <h6 className="text-white m-0">Main Deck</h6>
                  <div className="deck-area mt-1 mb-3">
                    {!deckAtual && (
                      <div className="w-100 text-center align-self-center my-4" style={{color: '#8b949e'}}>
                        Selecione "Novo Deck" ou carregue um existente para começar.
                      </div>
                    )}
                    {deckAtual && deckAtual.cartas.map((carta, idx) => {
                      if (isExtraDeckCard(carta.type)) return null;
                      return (
                        <div className="carta-mini" key={idx}>
                          <img src={carta.imagem} alt={carta.nome} />
                          <p title={carta.nome}>{carta.nome}</p>
                          {isEditing && (
                            <button className="remover-carta" title="Remover" onClick={() => removerCartaDoDeck(idx)}>✕</button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Extra Deck Area */}
                  <h6 className="text-white m-0">Extra Deck <small style={{color: '#8b949e'}}>(Fusão, Synchro, XYZ, Link)</small></h6>
                  <div className="deck-area mt-1" style={{minHeight: '85px'}}>
                    {deckAtual && deckAtual.cartas.map((carta, idx) => {
                      if (!isExtraDeckCard(carta.type)) return null;
                      return (
                        <div className="carta-mini" key={idx}>
                          <img src={carta.imagem} alt={carta.nome} />
                          <p title={carta.nome}>{carta.nome}</p>
                          {isEditing && (
                            <button className="remover-carta" title="Remover" onClick={() => removerCartaDoDeck(idx)}>✕</button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="d-flex justify-content-end mt-3 border-top border-secondary pt-2">
                    <button className="btn btn-sm btn-outline-light" onClick={() => setModalCarregar(true)}>📂 Carregar Deck do Banco</button>
                  </div>
                </div>
              </div>

              {/* COLUNA DIREITA: Pesquisa de Cartas */}
              <div className="col-12 col-lg-5">
                <div className="sticky-top" style={{top: '20px', zIndex: 100}}>
                  <div className="p-3 rounded-3" style={{backgroundColor: '#161b22', border: '1px solid #30363d'}}>
                    <h5 className="text-white mb-3">🔍 Buscar Cartas</h5>
                    <div className="input-group mb-3">
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Ex: Mago Negro"
                        value={termoBusca}
                        onChange={(e) => setTermoBusca(e.target.value)}
                        onKeyDown={(e) => { if(e.key === 'Enter') buscarCartasAPI(termoBusca, 0); }}
                      />
                      <button className="btn btn-info fw-bold" onClick={() => buscarCartasAPI(termoBusca, 0)}>Buscar</button>
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
                          <div className="carta" key={carta.id} onClick={() => adicionarCartaAoDeck(carta)}>
                            <button 
                              className="info-btn" 
                              title="Ver Detalhes"
                              onClick={(e) => { e.stopPropagation(); setModalCardInfo(carta); }}
                            >i</button>
                            <img src={carta.card_images[0].image_url} alt={carta.name} loading="lazy" />
                            <p>{carta.name}</p>
                          </div>
                        );
                      })}
                    </div>

                    {/* Paginação da Busca */}
                    <div className="mt-4 d-flex justify-content-center">
                      <div className="d-flex gap-2">
                        <button className="btn btn-outline-info btn-sm fw-bold" disabled={paginaCartas === 0} onClick={() => buscarCartasAPI(termoBusca, paginaCartas - 1)}>⮜ Ant</button>
                        <span className="d-flex align-items-center" style={{fontSize: '14px', color: '#c9d1d9'}}>Pág {paginaCartas + 1}</span>
                        <button className="btn btn-outline-info btn-sm fw-bold" disabled={totalRecebido < CARTAS_POR_PAGINA} onClick={() => buscarCartasAPI(termoBusca, paginaCartas + 1)}>Próx ⮞</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MODO VISUALIZADOR */}
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
                          <button className="btn btn-sm btn-warning" onClick={() => carregarDeckParaEdicaoDireta(deck.id)}>✏️ Editar</button>
                          <button className="btn btn-sm btn-danger" onClick={() => excluirDeck(deck.id)}>🗑️ Del</button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* MODAIS (Renderização Condicional Pura)                              */}
      {/* ----------------------------------------------------------------- */}

      {/* Modal: Full Deck View */}
      {modalFullDeck && (
        <>
          <div className="modal fade show d-block" tabIndex="-1" onClick={fecharModais}>
            <div className="modal-dialog modal-fullscreen" onClick={(e) => e.stopPropagation()}>
              <div className="modal-content" style={{backgroundColor: '#0d1117', border: 'none'}}>
                <div className="modal-header" style={{borderBottom: '1px solid #30363d'}}>
                  <h5 className="modal-title text-white">Deck: {modalFullDeck.nome} ({modalFullDeck.cartas.length} cartas)</h5>
                  <button type="button" className="btn-close btn-close-white" onClick={fecharModais}></button>
                </div>
                <div className="modal-body" style={{backgroundColor: '#0d1117'}}>
                  <div className="row g-3">
                    {modalFullDeck.cartas.map((carta, idx) => {
                      return (
                        <div className="col-6 col-sm-4 col-md-3 col-lg-2" key={idx}>
                          <div 
                            className="card-item text-center p-2 rounded" 
                            style={{backgroundColor: '#161b22', border: '1px solid #30363d', cursor: 'pointer', transition: '0.2s'}}
                            onClick={() => setModalCardInfo(carta)}
                          >
                            <img src={carta.imagem} className="img-fluid rounded" alt={carta.nome} />
                            <small className="d-block mt-2 text-truncate text-white" title={carta.nome}>{carta.nome}</small>
                          </div>
                        </div>
                      );
                    })}
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

      {/* Modal: Card Info Detail */}
      {modalCardInfo && (
        <>
          {/* Z-index mais alto para sobrepor o modal FullDeck se ele estiver aberto */}
          <div className="modal fade show d-block" tabIndex="-1" onClick={() => { setModalCardInfo(null); setImagemZoom(false); }} style={{zIndex: 1060}}>
            <div className="modal-dialog modal-dialog-centered modal-lg" onClick={(e) => e.stopPropagation()}>
              <div className="modal-content" style={{backgroundColor: '#161b22', border: '1px solid #30363d'}}>
                <div className="modal-header" style={{borderBottom: '1px solid #30363d'}}>
                  <h5 className="modal-title text-white">Detalhes da Carta</h5>
                  <button type="button" className="btn-close btn-close-white" onClick={() => { setModalCardInfo(null); setImagemZoom(false); }}></button>
                </div>
                <div className="modal-body text-center">
                  <div className="row">
                    <div className="col-md-5 text-center">
                      <img 
                        src={modalCardInfo.card_images ? modalCardInfo.card_images[0].image_url : modalCardInfo.imagem} 
                        className={`img-fluid rounded border border-secondary img-zoomable ${imagemZoom ? 'img-zoomed' : ''}`} 
                        style={{maxHeight: '400px', objectFit: 'contain'}} 
                        title="Clique para dar Zoom"
                        onClick={() => setImagemZoom(!imagemZoom)}
                        alt="Zoom Card"
                      />
                      <p className="mt-2" style={{fontSize: '0.8rem', color: '#8b949e'}}>🔍 Clique na imagem para dar zoom</p>
                    </div>
                    <div className="col-md-7 text-start">
                      <h3 className="fw-bold text-white">{modalCardInfo.name || modalCardInfo.nome}</h3>
                      <p className="text-light"><strong>Tipo:</strong> <span style={{color: '#00d2ff'}}>{modalCardInfo.type || 'N/A'}</span></p>
                      <hr style={{borderColor: '#30363d'}} />
                      <p style={{whiteSpace: 'pre-wrap', fontSize: '0.95rem', lineHeight: '1.6', color: '#c9d1d9'}}>
                        {modalCardInfo.desc || 'Descrição não disponível no momento.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" style={{zIndex: 1055}}></div>
        </>
      )}

      {/* Modal: Carregar Deck (Substitui o Select do HTML Antigo) */}
      {modalCarregar && (
        <>
          <div className="modal fade show d-block" tabIndex="-1" onClick={fecharModais}>
            <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
              <div className="modal-content" style={{backgroundColor: '#161b22', border: '1px solid #30363d'}}>
                <div className="modal-header" style={{borderBottom: '1px solid #30363d'}}>
                  <h5 className="modal-title text-white">Carregar do Banco de Dados</h5>
                  <button type="button" className="btn-close btn-close-white" onClick={fecharModais}></button>
                </div>
                <div className="modal-body">
                  {currentUserDecks.length === 0 ? (
                    <p className="text-warning text-center">Você não possui decks salvos.</p>
                  ) : (
                    <div className="list-group">
                      {currentUserDecks.map((d) => {
                        return (
                          <button 
                            key={d.id} 
                            className="list-group-item list-group-item-action text-white" 
                            style={{backgroundColor: '#0d1117', borderColor: '#30363d'}}
                            onClick={() => { 
                              setDeckAtual(JSON.parse(JSON.stringify(d))); 
                              setIsEditing(false); 
                              fecharModais(); 
                              mostrarToast(`📂 Deck "${d.nome}" carregado para visualização.`, 'success'); 
                            }}
                          >
                            {d.nome} <small style={{color: '#8b949e'}}>({d.cartas.length} cartas)</small>
                          </button>
                        );
                      })}
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

      {/* TOAST ALERTA */}
      <div className="toast-alerta" style={{
        display: toastMsg.visivel ? 'block' : 'none',
        background: toastMsg.tipo === 'warning' ? '#d97700' : '#2ea043'
      }}>
        {toastMsg.texto}
      </div>
    </div>
  );
}