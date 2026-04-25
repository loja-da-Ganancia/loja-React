import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { addPost, deletePost, editPost } from "../slices/postSlice";

function gerarIdPost() {
  return String(Date.now());
}

export default function Comunidade() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // ====================================================
  // 1. ESTADOS GLOBAIS E LOCAIS
  // ====================================================
  const currentUser = useSelector((state) => state.user.currentUser);
  const users = useSelector((state) => state.user.allUsers);
  const posts = useSelector((state) => state.posts.items);
  const decks = useSelector((state) => state.decks.decksSalvos);

  const [modalNovoPost, setModalNovoPost] = useState(false);
  const [modalEditarPost, setModalEditarPost] = useState(false);
  const [modalCompartilhar, setModalCompartilhar] = useState(false);
  const [modalDeckCompleto, setModalDeckCompleto] = useState(null);
  const [modalCartaInfo, setModalCartaInfo] = useState(null);

  const [postDeckId, setPostDeckId] = useState("");
  const [postContent, setPostContent] = useState("");
  const [postIdEmEdicao, setPostIdEmEdicao] = useState("");

  const [shareData, setShareData] = useState(null);
  const [carregandoCarta, setCarregandoCarta] = useState(false);
  const [imagemZoom, setImagemZoom] = useState(false);

  // ====================================================
  // 2. TELA DE BLOQUEIO (GATEKEEPER)
  // ====================================================
  if (!currentUser) {
    return (
      <div className="container mt-5 mb-5 d-flex flex-column align-items-center justify-content-center flex-grow-1" style={{ minHeight: '65vh' }}>
        <div className="text-center p-5 rounded-4 shadow-lg" style={{ backgroundColor: '#161b22', border: '1px solid #30363d', maxWidth: '500px' }}>
          <div style={{ fontSize: '4.5rem', marginBottom: '10px', lineHeight: '1' }}>🔒</div>
          <h3 className="text-white fw-bold mt-2">Acesso Restrito</h3>
          <p className="mt-3 mb-4" style={{ color: '#8b949e', fontSize: '1.05rem', lineHeight: '1.6' }}>
            Você precisa estar conectado para acessar esta área. Faça login ou crie uma conta gratuita para interagir com a comunidade!
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
  // 3. VARIÁVEIS DERIVADAS (Usuário Logado)
  // ====================================================
  const meusDecks = decks.filter((d) => d.owner === currentUser.username);
  const isUserAdmin = currentUser.role === 'admin';

  // ====================================================
  // 4. LÓGICA DE POSTAGEM VIA REDUX
  // ====================================================
  function abrirModalNovoPost() {
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
    const novoPost = { id: gerarIdPost(), author: currentUser.username, deckId: postDeckId, content: postContent, date: new Date().toISOString() };
    dispatch(addPost(novoPost));
    fecharModais();
  }

  function deletarPostLocal(postId) {
    if (!window.confirm("Tem certeza que deseja excluir esta publicação? Essa ação não pode ser desfeita.")) return;
    dispatch(deletePost(postId));
  }

  function abrirEdicaoPost(post) {
    setPostIdEmEdicao(post.id);
    setPostContent(post.content);
    setModalEditarPost(true);
  }

  function salvarEdicaoPost(e) {
    e.preventDefault();
    dispatch(editPost({ id: postIdEmEdicao, content: postContent }));
    fecharModais();
  }

  // ====================================================
  // 5. COMPARTILHAMENTO & VISUALIZAÇÃO
  // ====================================================
  function compartilharPost(post) {
    const deck = decks.find((d) => d.id === post.deckId);
    if (!deck) return;

    const counts = {};
    deck.cartas.forEach((c) => counts[c.nome] = (counts[c.nome] || 0) + 1);
    let lista = `🃏 *Deck: ${deck.nome}*\n\n`;
    for (let nomeCarta in counts) {
      if (Object.prototype.hasOwnProperty.call(counts, nomeCarta)) lista += `${counts[nomeCarta]}x ${nomeCarta}\n`;
    }
    lista += `\n📝 *Comentário:* ${post.content}\n\n🔗 Compartilhado via Greed Store`;

    setShareData({ text: lista, url: window.location.href });
    setModalCompartilhar(true);
  }

  function copiarLink() {
    navigator.clipboard.writeText(window.location.href).then(() => { window.alert("Link da página copiado!"); fecharModais(); });
  }

  function compartilharRedeSocial(rede) {
    if (!shareData) return;
    const textEnc = encodeURIComponent(shareData.text);
    const urlEnc = encodeURIComponent(shareData.url);

    if (rede === 'facebook') window.open(`https://www.facebook.com/sharer/sharer.php?u=${urlEnc}`, '_blank', 'noopener,noreferrer');
    else if (rede === 'twitter') window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareData.text.substring(0, 280))}&url=${urlEnc}`, '_blank', 'noopener,noreferrer');
    else if (rede === 'whatsapp') window.open(`https://wa.me/?text=${textEnc}`, '_blank', 'noopener,noreferrer');
  }

  function abrirVisualizacaoDeckComunidade(deckId) {
    const deck = decks.find((d) => d.id === deckId);
    if (deck) setModalDeckCompleto(deck);
  }

  async function mostrarDetalhesCarta(carta) {
    setModalCartaInfo({ nome: carta.nome || carta.name, imagem: carta.imagem, tipo: "Carregando...", descricao: "Buscando informações..." });
    setCarregandoCarta(true);
    setImagemZoom(false);

    try {
      const url = `https://db.ygoprodeck.com/api/v7/cardinfo.php?language=pt&name=${encodeURIComponent(carta.nome || carta.name)}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data && data.data && data.data.length > 0) {
        const cartaFull = data.data[0];
        const imgUrl = (cartaFull.card_images && cartaFull.card_images.length > 0) ? cartaFull.card_images[0].image_url : carta.imagem;
        setModalCartaInfo({ nome: cartaFull.name || cartaFull.nome || carta.nome, imagem: imgUrl, tipo: cartaFull.type || "N/A", descricao: cartaFull.desc || "Descrição não disponível no momento." });
      } else {
        setModalCartaInfo({ nome: carta.nome || carta.name, imagem: carta.imagem, tipo: "N/A", descricao: carta.desc || "Detalhes não encontrados." });
      }
    } catch {
      setModalCartaInfo({ nome: carta.nome || carta.name, imagem: carta.imagem, tipo: "Erro", descricao: "Erro de conexão ao buscar os detalhes da carta." });
    }
    setCarregandoCarta(false);
  }

  function fecharModais() {
    setModalNovoPost(false); setModalEditarPost(false); setModalCompartilhar(false); setModalDeckCompleto(null); setModalCartaInfo(null); setImagemZoom(false);
  }

  // ====================================================
  // 6. RENDERIZAÇÃO DA PÁGINA
  // ====================================================
  return (
    <main className="flex-grow-1 container mt-5 mb-5">
      <div className="d-flex justify-content-between align-items-center mb-4 border-bottom border-secondary pb-3 flex-wrap gap-3">
        <h2 className="text-white fw-bold m-0">🤝 Feed da Comunidade</h2>
        <button className="btn btn-info fw-bold" onClick={abrirModalNovoPost}>✏️ Compartilhar Deck</button>
      </div>

      <div className="row justify-content-center">
        <div className="col-lg-8 col-md-10">
          {posts.length === 0 ? (
            <div className="col-12 text-center mt-5" style={{ color: '#8b949e' }}>Nenhum deck compartilhado ainda. Seja o primeiro!</div>
          ) : (
            posts.map((post) => {
              const deck = decks.find((d) => d.id === post.deckId);
              if (!deck) return null;

              const autorUser = users.find((u) => u.username === post.author);
              const temFoto = autorUser && autorUser.profilePicUrl;
              const avatarStyle = temFoto ? { backgroundImage: `url('${autorUser.profilePicUrl}')`, backgroundSize: "cover", backgroundPosition: "center" } : {};
              const avatarContent = !temFoto ? post.author.charAt(0).toUpperCase() : "";
              const podeEditar = (currentUser.username === post.author) || isUserAdmin;

              return (
                <div className="post-card p-4 mb-4 rounded-3 shadow-sm" key={post.id} style={{ backgroundColor: '#161b22', border: '1px solid #30363d' }}>
                  <div className="d-flex justify-content-between align-items-start mb-3 border-bottom border-secondary pb-3">
                    <div className="d-flex align-items-center">
                      <div className="author-avatar me-3 d-flex align-items-center justify-content-center fw-bold text-dark bg-info" style={{ width: '50px', height: '50px', borderRadius: '50%', flexShrink: 0, ...avatarStyle }}>
                        {avatarContent}
                      </div>
                      <div>
                        <h5 className="text-white mb-0 fw-bold">{post.author}</h5>
                        <small style={{ color: '#8b949e' }}>Compartilhou o deck: <strong className="text-info">{deck.nome}</strong> ({deck.cartas.length} cartas)</small>
                      </div>
                    </div>
                    <div><button className="btn btn-sm btn-outline-light" onClick={() => compartilharPost(post)} title="Compartilhar nas Redes">🔗</button></div>
                  </div>
                  <p style={{ whiteSpace: 'pre-wrap', fontSize: '1.05rem', lineHeight: '1.6', color: '#F2F3F4' }}>{post.content}</p>
                  <div className="d-flex justify-content-between mt-4 align-items-center flex-wrap gap-2">
                    <div>
                      {podeEditar && (
                        <>
                          <button className="btn btn-sm btn-outline-warning text-white fw-bold me-2" onClick={() => abrirEdicaoPost(post)}>✏️ Editar</button>
                          <button className="btn btn-sm btn-outline-danger fw-bold" onClick={() => deletarPostLocal(post.id)}>🗑️ Excluir</button>
                        </>
                      )}
                    </div>
                    <button className="btn btn-sm btn-info text-dark fw-bold px-4" onClick={() => abrirVisualizacaoDeckComunidade(deck.id)}>👁️ Ver Deck</button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* MODAIS: (Novo Post, Compartilhar, Ver Deck, etc) */}
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
                      <select className="form-select bg-dark text-light border-secondary" required value={postDeckId} onChange={(e) => setPostDeckId(e.target.value)}>
                        {meusDecks.length === 0 ? <option value="">Crie um deck primeiro na aba Decks!</option> : (
                          <>
                            <option value="">-- Selecione um Deck --</option>
                            {meusDecks.map((d) => <option value={d.id} key={d.id}>{d.nome}</option>)}
                          </>
                        )}
                      </select>
                    </div>
                    <div className="mb-4">
                      <label className="form-label fw-bold text-info">Comentário / Estratégia:</label>
                      <textarea className="form-control bg-dark text-light border-secondary" rows="5" placeholder="Explique como esse deck funciona para a comunidade..." required value={postContent} onChange={(e) => setPostContent(e.target.value)}></textarea>
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
                      <textarea className="form-control bg-dark text-light border-secondary" rows="5" required value={postContent} onChange={(e) => setPostContent(e.target.value)}></textarea>
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
                    <button className="btn btn-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: '45px', height: '45px' }} title="Facebook" onClick={() => compartilharRedeSocial('facebook')}><strong style={{ fontSize: '1.2rem' }}>f</strong></button>
                    <button className="btn btn-info text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '45px', height: '45px' }} title="Twitter / X" onClick={() => compartilharRedeSocial('twitter')}><strong style={{ fontSize: '1.2rem' }}>X</strong></button>
                    <button className="btn btn-success rounded-circle d-flex align-items-center justify-content-center" style={{ width: '45px', height: '45px' }} title="WhatsApp" onClick={() => compartilharRedeSocial('whatsapp')}><strong style={{ fontSize: '1.2rem' }}>W</strong></button>
                  </div>
                  <button className="btn btn-outline-info btn-sm w-100 fw-bold" onClick={copiarLink}>🔗 Copiar Link da Página</button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </>
      )}

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
                    {modalDeckCompleto.cartas.map((carta, idx) => (
                      <div className="col-6 col-sm-4 col-md-3 col-lg-2" key={idx}>
                        <div className="card-item" style={{ backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '8px', padding: '10px', textAlign: 'center', cursor: 'pointer', transition: '0.2s' }} onClick={() => mostrarDetalhesCarta(carta)}>
                          <img src={carta.imagem} className="img-fluid" alt={carta.nome} />
                          <small className="d-block mt-2 text-truncate text-white" title={carta.nome}>{carta.nome}</small>
                        </div>
                      </div>
                    ))}
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

      {modalCartaInfo && (
        <>
          <div className="modal fade show d-block" tabIndex="-1" onClick={() => { setModalCartaInfo(null); setImagemZoom(false); }} style={{ zIndex: 1060 }}>
            <div className="modal-dialog modal-dialog-centered modal-lg" onClick={(e) => e.stopPropagation()}>
              <div className="modal-content" style={{ backgroundColor: '#161b22', border: '1px solid #30363d' }}>
                <div className="modal-header" style={{ borderBottom: '1px solid #30363d' }}>
                  <h5 className="modal-title text-white">Detalhes da Carta</h5>
                  <button type="button" className="ms-auto" onClick={() => { setModalCartaInfo(null); setImagemZoom(false); }} style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '1.8rem', fontWeight: 'bold', cursor: 'pointer', lineHeight: '1', padding: '0 10px' }} aria-label="Fechar">&times;</button>
                </div>
                <div className="modal-body text-center">
                  {carregandoCarta && <p className="text-info mt-3">Carregando informações...</p>}
                  <div className="row">
                    <div className="col-md-5 text-center">
                      <img 
                        src={modalCartaInfo.imagem} 
                        className="img-fluid rounded border border-secondary" 
                        style={{ maxHeight: '400px', objectFit: 'contain', cursor: 'zoom-in' }} 
                        title="Clique para dar Zoom" 
                        onClick={() => setImagemZoom(true)} 
                        alt={modalCartaInfo.nome} 
                      />
                      <p className="mt-2" style={{ fontSize: '0.8rem', color: '#8b949e' }}>🔍 Clique na imagem para dar zoom</p>
                    </div>
                    <div className="col-md-7 text-start">
                      <h3 className="fw-bold text-white">{modalCartaInfo.nome}</h3>
                      <p className="text-light"><strong>Tipo:</strong> <span style={{ color: '#00d2ff' }}>{modalCartaInfo.tipo}</span></p>
                      <hr style={{ borderColor: '#30363d' }} />
                      <p style={{ whiteSpace: 'pre-wrap', fontSize: '0.95rem', lineHeight: '1.6', color: '#F2F3F4' }}>{modalCartaInfo.descricao}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Fundo Escuro padrão do Bootstrap para o Modal Normal */}
          {!imagemZoom && <div className="modal-backdrop fade show" style={{ zIndex: 1055 }}></div>}

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
                src={modalCartaInfo.imagem} 
                alt={modalCartaInfo.nome}
                style={{ maxWidth: '100vw', maxHeight: '100vh', objectFit: 'contain' }}
              />
            </div>
          )}
        </>
      )}

    </main>
  );
}