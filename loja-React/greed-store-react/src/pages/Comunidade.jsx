import React, { useState } from "react";

const DB_POSTS = 'greedstore_posts';
const DB_DECKS = 'greedstore_decks';
const DB_USERS = 'greedstore_users';

// Helpers fora do componente (O ESLint não aplica regras de pureza do React aqui fora!)
function getCurrentUserObj() {
  const sessionData = sessionStorage.getItem('greedstore_session');
  if (sessionData) {
    try {
      return JSON.parse(sessionData);
    } catch {
      return null;
    }
  }
  return null;
}

function gerarIdPost() {
  return String(Date.now());
}

export default function Comunidade() {
  // ----------------------------------------------------
  // ESTADOS DE BANCO DE DADOS (Lazy Initialization)
  // ----------------------------------------------------
  // Posts precisam do setPosts, pois nós criamos novos posts nesta página
  const [posts, setPosts] = useState(() => {
    return JSON.parse(localStorage.getItem(DB_POSTS)) || [];
  });

  // Decks, Users e CurrentUser são apenas leitura aqui (remoção dos "set" não utilizados)
  const [decks] = useState(() => {
    return JSON.parse(localStorage.getItem(DB_DECKS)) || [];
  });

  const [users] = useState(() => {
    return JSON.parse(localStorage.getItem(DB_USERS)) || [];
  });

  const [currentUser] = useState(() => {
    return getCurrentUserObj();
  });

  // ----------------------------------------------------
  // ESTADOS DE MODAIS E FORMULÁRIOS
  // ----------------------------------------------------
  const [modalNovoPost, setModalNovoPost] = useState(false);
  const [modalEditarPost, setModalEditarPost] = useState(false);
  const [modalCompartilhar, setModalCompartilhar] = useState(false);
  const [modalDeckCompleto, setModalDeckCompleto] = useState(null);
  const [modalCartaInfo, setModalCartaInfo] = useState(null);

  // Estados dos inputs dos formulários
  const [postDeckId, setPostDeckId] = useState("");
  const [postContent, setPostContent] = useState("");
  const [postIdEmEdicao, setPostIdEmEdicao] = useState("");

  // Estados do Compartilhamento
  const [shareData, setShareData] = useState(null);

  // Estados de UI (Carta)
  const [carregandoCarta, setCarregandoCarta] = useState(false);
  const [imagemZoom, setImagemZoom] = useState(false);

  // ----------------------------------------------------
  // LÓGICA DE POSTAGEM
  // ----------------------------------------------------
  function abrirModalNovoPost() {
    if (!currentUser) {
      window.alert("Você precisa estar logado para publicar na comunidade!");
      return;
    }
    setPostDeckId("");
    setPostContent("");
    setModalNovoPost(true);
  }

  function salvarPost(e) {
    e.preventDefault();
    if (!postDeckId) {
      window.alert("Selecione um deck válido.");
      return;
    }

    // Usando a função auxiliar externa para gerar o ID sem irritar o ESLint
    const id = gerarIdPost();

    const novoPost = {
      id: id,
      author: currentUser.username,
      deckId: postDeckId,
      content: postContent,
      date: new Date().toISOString()
    };

    const novosPosts = [novoPost, ...posts];
    localStorage.setItem(DB_POSTS, JSON.stringify(novosPosts));
    setPosts(novosPosts);
    fecharModais();
  }

  function deletarPost(postId) {
    if (!window.confirm("Tem certeza que deseja excluir esta publicação? Essa ação não pode ser desfeita.")) {
      return;
    }
    const novosPosts = posts.filter((p) => p.id !== postId);
    localStorage.setItem(DB_POSTS, JSON.stringify(novosPosts));
    setPosts(novosPosts);
  }

  function abrirEdicaoPost(post) {
    setPostIdEmEdicao(post.id);
    setPostContent(post.content);
    setModalEditarPost(true);
  }

  function salvarEdicaoPost(e) {
    e.preventDefault();
    let novosPosts = [...posts];
    const index = novosPosts.findIndex((p) => p.id === postIdEmEdicao);

    if (index !== -1) {
      novosPosts[index].content = postContent;
      localStorage.setItem(DB_POSTS, JSON.stringify(novosPosts));
      setPosts(novosPosts);
      fecharModais();
    }
  }

  // ----------------------------------------------------
  // LÓGICA DE COMPARTILHAMENTO
  // ----------------------------------------------------
  function compartilharPost(post) {
    const deck = decks.find((d) => d.id === post.deckId);
    if (!deck) return;

    const counts = {};
    deck.cartas.forEach((c) => {
      counts[c.nome] = (counts[c.nome] || 0) + 1;
    });

    let lista = `🃏 *Deck: ${deck.nome}*\n\n`;

    for (let nomeCarta in counts) {
      if (Object.prototype.hasOwnProperty.call(counts, nomeCarta)) {
        lista += `${counts[nomeCarta]}x ${nomeCarta}\n`;
      }
    }

    lista += `\n📝 *Comentário:* ${post.content}\n\n🔗 Compartilhado via Greed Store`;

    setShareData({ text: lista, url: window.location.href });
    setModalCompartilhar(true);
  }

  function copiarLink() {
    navigator.clipboard.writeText(window.location.href)
      .then(() => {
        window.alert("Link da página copiado!");
        fecharModais();
      })
      .catch(() => {
        console.error("Erro ao copiar link");
      });
  }

  function compartilharRedeSocial(rede) {
    if (!shareData) return;

    const textEnc = encodeURIComponent(shareData.text);
    const urlEnc = encodeURIComponent(shareData.url);

    if (rede === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${urlEnc}`, '_blank', 'noopener,noreferrer');
    } else if (rede === 'twitter') {
      const shortText = encodeURIComponent(shareData.text.substring(0, 280));
      window.open(`https://twitter.com/intent/tweet?text=${shortText}&url=${urlEnc}`, '_blank', 'noopener,noreferrer');
    } else if (rede === 'whatsapp') {
      window.open(`https://wa.me/?text=${textEnc}`, '_blank', 'noopener,noreferrer');
    }
  }

  // ----------------------------------------------------
  // LÓGICA DE VISUALIZAÇÃO DE DECKS E CARTAS
  // ----------------------------------------------------
  function abrirVisualizacaoDeckComunidade(deckId) {
    const deck = decks.find((d) => d.id === deckId);
    if (deck) setModalDeckCompleto(deck);
  }

  async function mostrarDetalhesCarta(carta) {
    setModalCartaInfo({
      nome: carta.nome || carta.name,
      imagem: carta.imagem,
      tipo: "Carregando...",
      descricao: "Buscando informações..."
    });
    setCarregandoCarta(true);
    setImagemZoom(false);

    try {
      const url = `https://db.ygoprodeck.com/api/v7/cardinfo.php?language=pt&name=${encodeURIComponent(carta.nome || carta.name)}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data && data.data && data.data.length > 0) {
        const cartaFull = data.data[0];
        const imgUrl = (cartaFull.card_images && cartaFull.card_images.length > 0) ? cartaFull.card_images[0].image_url : carta.imagem;

        setModalCartaInfo({
          nome: cartaFull.name || cartaFull.nome || carta.nome,
          imagem: imgUrl,
          tipo: cartaFull.type || "N/A",
          descricao: cartaFull.desc || "Descrição não disponível no momento."
        });
      } else {
        setModalCartaInfo({
          nome: carta.nome || carta.name,
          imagem: carta.imagem,
          tipo: "N/A",
          descricao: carta.desc || "Detalhes não encontrados."
        });
      }
    } catch {
      setModalCartaInfo({
        nome: carta.nome || carta.name,
        imagem: carta.imagem,
        tipo: "Erro",
        descricao: "Erro de conexão ao buscar os detalhes da carta."
      });
    }
    setCarregandoCarta(false);
  }

  function fecharModais() {
    setModalNovoPost(false);
    setModalEditarPost(false);
    setModalCompartilhar(false);
    setModalDeckCompleto(null);
    setModalCartaInfo(null);
    setImagemZoom(false);
  }

  // ----------------------------------------------------
  // VARIÁVEIS COMPUTADAS PARA RENDERIZAÇÃO
  // ----------------------------------------------------
  const meusDecks = currentUser ? decks.filter((d) => d.owner === currentUser.username) : [];
  const isUserAdmin = currentUser && currentUser.role === 'admin';

  return (
    <main className="flex-grow-1 container mt-5 mb-5">
      {/* CABEÇALHO */}
      <div className="d-flex justify-content-between align-items-center mb-4 border-bottom border-secondary pb-3 flex-wrap gap-3">
        <h2 className="text-white fw-bold m-0">🤝 Feed da Comunidade</h2>
        <button className="btn btn-info fw-bold" onClick={abrirModalNovoPost}>✏️ Compartilhar Deck</button>
      </div>

      {/* FEED DE POSTAGENS */}
      <div className="row justify-content-center">
        <div className="col-lg-8 col-md-10">
          {posts.length === 0 ? (
            <div className="col-12 text-center mt-5" style={{ color: '#8b949e' }}>
              Nenhum deck compartilhado ainda. Seja o primeiro!
            </div>
          ) : (
            posts.map((post) => {
              const deck = decks.find((d) => d.id === post.deckId);
              if (!deck) return null;

              const autorUser = users.find((u) => u.username === post.author);

              // Verifica se o usuário do post tem uma foto no banco de dados
              const temFoto = autorUser && autorUser.profilePicUrl;

              const avatarStyle = temFoto
                ? { backgroundImage: `url('${autorUser.profilePicUrl}')`, backgroundSize: "cover", backgroundPosition: "center" }
                : {};

              const avatarContent = !temFoto ? post.author.charAt(0).toUpperCase() : "";

              const podeEditar = (currentUser && currentUser.username === post.author) || isUserAdmin;

              return (
                <div className="post-card p-4" key={post.id}>
                  <div className="d-flex justify-content-between align-items-start mb-3 border-bottom border-secondary pb-3">
                    <div className="d-flex align-items-center">
                      <div
                        className="author-avatar me-3 d-flex align-items-center justify-content-center fw-bold text-dark bg-info"
                        style={{
                          width: '50px',    // Garante que o círculo tenha tamanho fixo
                          height: '50px',   // Garante que o círculo tenha tamanho fixo
                          borderRadius: '50%',
                          flexShrink: 0,    // Impede que a foto "esmague" em telas menores
                          ...avatarStyle
                        }}
                      >
                        {avatarContent}
                      </div>
                      <div>
                        <h5 className="text-white mb-0 fw-bold">{post.author}</h5>
                        <small style={{ color: '#8b949e' }}>
                          Compartilhou o deck: <strong className="text-info">{deck.nome}</strong> ({deck.cartas.length} cartas)
                        </small>
                      </div>
                    </div>
                    <div>
                      <button className="btn btn-sm btn-outline-light" onClick={() => compartilharPost(post)} title="Compartilhar nas Redes">🔗</button>
                    </div>
                  </div>

                  <p style={{ whiteSpace: 'pre-wrap', fontSize: '1.05rem', lineHeight: '1.6', color: '#F2F3F4' }}>{post.content}</p>

                  <div className="d-flex justify-content-between mt-4 align-items-center flex-wrap gap-2">
                    <div>
                      {podeEditar && (
                        <>
                          <button className="btn btn-sm btn-outline-warning text-white fw-bold me-2" onClick={() => abrirEdicaoPost(post)} title="Editar Publicação">✏️ Editar</button>
                          <button className="btn btn-sm btn-outline-danger fw-bold" onClick={() => deletarPost(post.id)} title="Excluir Publicação">🗑️ Excluir</button>
                        </>
                      )}
                    </div>
                    <button className="btn btn-sm btn-info text-dark fw-bold px-4" onClick={() => abrirVisualizacaoDeckComunidade(deck.id)}>
                      👁️ Ver Deck Completo
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* MODAIS */}
      {/* ----------------------------------------------------------------- */}

      {/* MODAL: NOVO POST */}
      {modalNovoPost && (
        <>
          <div className="modal fade show d-block" tabIndex="-1" onClick={fecharModais}>
            <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
              <div className="modal-content" style={{ backgroundColor: '#161b22', border: '1px solid #30363d' }}>
                <div className="modal-header" style={{ borderBottom: '1px solid #30363d' }}>
                  <h5 className="modal-title text-white">Novo Post</h5>
                  <button type="button" className="btn-close btn-close-white" onClick={fecharModais}></button>
                </div>
                <div className="modal-body">
                  <form onSubmit={salvarPost}>
                    <div className="mb-3">
                      <label className="form-label fw-bold text-info">Selecione o Deck para Compartilhar:</label>
                      <select
                        className="form-select"
                        required
                        value={postDeckId}
                        onChange={(e) => setPostDeckId(e.target.value)}
                      >
                        {meusDecks.length === 0 ? (
                          <option value="">Crie um deck primeiro na aba Decks!</option>
                        ) : (
                          <>
                            <option value="">-- Selecione um Deck --</option>
                            {meusDecks.map((d) => {
                              return <option value={d.id} key={d.id}>{d.nome}</option>;
                            })}
                          </>
                        )}
                      </select>
                    </div>
                    <div className="mb-4">
                      <label className="form-label fw-bold text-info">Comentário / Estratégia:</label>
                      <textarea
                        className="form-control"
                        rows="5"
                        placeholder="Explique como esse deck funciona para a comunidade..."
                        required
                        value={postContent}
                        onChange={(e) => setPostContent(e.target.value)}
                      ></textarea>
                    </div>
                    <button type="submit" className="btn btn-success w-100 fw-bold">Publicar no Feed</button>
                  </form>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </>
      )}

      {/* MODAL: EDITAR POST */}
      {modalEditarPost && (
        <>
          <div className="modal fade show d-block" tabIndex="-1" onClick={fecharModais}>
            <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
              <div className="modal-content" style={{ backgroundColor: '#161b22', border: '1px solid #30363d' }}>
                <div className="modal-header" style={{ borderBottom: '1px solid #30363d' }}>
                  <h5 className="modal-title text-white">Editar Postagem</h5>
                  <button type="button" className="btn-close btn-close-white" onClick={fecharModais}></button>
                </div>
                <div className="modal-body">
                  <form onSubmit={salvarEdicaoPost}>
                    <div className="mb-4">
                      <label className="form-label fw-bold text-info">Comentário / Estratégia:</label>
                      <textarea
                        className="form-control"
                        rows="5"
                        required
                        value={postContent}
                        onChange={(e) => setPostContent(e.target.value)}
                      ></textarea>
                    </div>
                    <button type="submit" className="btn btn-warning w-100 fw-bold text-dark">Salvar Alterações</button>
                  </form>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </>
      )}

      {/* MODAL: COMPARTILHAR NAS REDES */}
      {modalCompartilhar && (
        <>
          <div className="modal fade show d-block" tabIndex="-1" onClick={fecharModais}>
            <div className="modal-dialog modal-dialog-centered modal-sm" onClick={(e) => e.stopPropagation()}>
              <div className="modal-content" style={{ backgroundColor: '#161b22', border: '1px solid #30363d' }}>
                <div className="modal-header" style={{ borderBottom: '1px solid #30363d' }}>
                  <h5 className="modal-title text-white">Compartilhar Deck</h5>
                  <button type="button" className="btn-close btn-close-white" onClick={fecharModais}></button>
                </div>
                <div className="modal-body text-center">
                  <p className="text-muted mb-3" style={{ fontSize: '0.9rem', color: '#8b949e' }}>Mostre sua estratégia para o mundo!</p>
                  <div className="d-flex justify-content-center gap-3 mb-4">
                    <button className="btn btn-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: '45px', height: '45px' }} title="Facebook" onClick={() => compartilharRedeSocial('facebook')}>
                      <strong style={{ fontSize: '1.2rem' }}>f</strong>
                    </button>
                    <button className="btn btn-info text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '45px', height: '45px' }} title="Twitter / X" onClick={() => compartilharRedeSocial('twitter')}>
                      <strong style={{ fontSize: '1.2rem' }}>X</strong>
                    </button>
                    <button className="btn btn-success rounded-circle d-flex align-items-center justify-content-center" style={{ width: '45px', height: '45px' }} title="WhatsApp" onClick={() => compartilharRedeSocial('whatsapp')}>
                      <strong style={{ fontSize: '1.2rem' }}>W</strong>
                    </button>
                  </div>
                  <button className="btn btn-outline-info btn-sm w-100 fw-bold" onClick={copiarLink}>🔗 Copiar Link da Página</button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </>
      )}

      {/* MODAL: VISUALIZAR DECK COMPLETO */}
      {modalDeckCompleto && (
        <>
          <div className="modal fade show d-block" tabIndex="-1" onClick={fecharModais}>
            <div className="modal-dialog modal-fullscreen" onClick={(e) => e.stopPropagation()}>
              <div className="modal-content" style={{ backgroundColor: '#0d1117', border: 'none' }}>
                <div className="modal-header" style={{ borderBottom: '1px solid #30363d' }}>
                  <h5 className="modal-title text-white">Deck: {modalDeckCompleto.nome} ({modalDeckCompleto.cartas.length} cartas)</h5>
                  <button type="button" className="btn-close btn-close-white" onClick={fecharModais}></button>
                </div>
                <div className="modal-body" style={{ backgroundColor: '#0d1117' }}>
                  <div className="row g-3">
                    {modalDeckCompleto.cartas.map((carta, idx) => {
                      return (
                        <div className="col-6 col-sm-4 col-md-3 col-lg-2" key={idx}>
                          <div
                            className="card-item"
                            style={{ backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '8px', padding: '10px', textAlign: 'center', cursor: 'pointer', transition: '0.2s' }}
                            onClick={() => mostrarDetalhesCarta(carta)}
                          >
                            <img src={carta.imagem} className="img-fluid" alt={carta.nome} />
                            <small className="d-block mt-2 text-truncate text-white" title={carta.nome}>{carta.nome}</small>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="modal-footer" style={{ borderTop: '1px solid #30363d', backgroundColor: '#0d1117' }}>
                  <button type="button" className="btn btn-outline-light" onClick={fecharModais}>Fechar</button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </>
      )}

      {/* MODAL: DETALHES DA CARTA (INFO ZOOM) */}
      {modalCartaInfo && (
        <>
          {/* Z-Index 1060 para ficar na frente do Modal do Deck Completo */}
          <div className="modal fade show d-block" tabIndex="-1" onClick={() => { setModalCartaInfo(null); setImagemZoom(false); }} style={{ zIndex: 1060 }}>
            <div className="modal-dialog modal-dialog-centered modal-lg" onClick={(e) => e.stopPropagation()}>
              <div className="modal-content" style={{ backgroundColor: '#161b22', border: '1px solid #30363d' }}>
                <div className="modal-header" style={{ borderBottom: '1px solid #30363d' }}>
                  <h5 className="modal-title text-white">Detalhes da Carta</h5>
                  <button type="button" className="btn-close btn-close-white" onClick={() => { setModalCartaInfo(null); setImagemZoom(false); }}></button>
                </div>
                <div className="modal-body text-center">
                  {carregandoCarta && <p className="text-info mt-3">Carregando informações...</p>}
                  <div className="row">
                    <div className="col-md-5 text-center">
                      <img
                        src={modalCartaInfo.imagem}
                        className={`img-fluid rounded border border-secondary img-zoomable ${imagemZoom ? 'img-zoomed' : ''}`}
                        style={{ maxHeight: '400px', objectFit: 'contain' }}
                        title="Clique para dar Zoom"
                        onClick={() => setImagemZoom(!imagemZoom)}
                        alt="Zoom Card"
                      />
                      <p className="mt-2" style={{ fontSize: '0.8rem', color: '#8b949e' }}>🔍 Clique na imagem para dar zoom</p>
                    </div>
                    <div className="col-md-7 text-start">
                      <h3 className="fw-bold text-white">{modalCartaInfo.nome}</h3>
                      <p className="text-light">
                        <strong>Tipo:</strong> <span style={{ color: '#00d2ff' }}>{modalCartaInfo.tipo}</span>
                      </p>
                      <hr style={{ borderColor: '#30363d' }} />
                      <p style={{ whiteSpace: 'pre-wrap', fontSize: '0.95rem', lineHeight: '1.6', color: '#F2F3F4' }}>
                        {modalCartaInfo.descricao}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" style={{ zIndex: 1055 }}></div>
        </>
      )}

    </main>
  );
}