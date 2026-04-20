import React, { useState, useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { adicionarFavoritoGlobal } from "../slices/favoritosSlice";

const CARTAS_POR_PAGINA = 15;
const AMAZON_AFFILIATE_TAG = '3153150d-20';

// Função auxiliar encapsulada fora do componente para evitar recriação de escopo em renderizações sucessivas.
function obterPreco(carta) {
  if (!carta.card_prices || !carta.card_prices[0]) return 0.00;
  return parseFloat(carta.card_prices[0].tcgplayer_price || 0);
}

export default function Marketplace() {
  // ====================================================
  // 1. INTEGRAÇÃO DE ESTADO GLOBAL (Redux) E ROTEAMENTO
  // ====================================================
  const dispatch = useDispatch();
  const navigate = useNavigate(); 
  
  // Extração reativa da lista de favoritos e do usuário atual do estado global
  const favoritos = useSelector((state) => state.favoritos.items);
  const currentUser = useSelector((state) => state.user.currentUser); 

  // ====================================================
  // 2. ESTADOS LOCAIS (Dados e Filtros)
  // ====================================================
  const [todasAsCartas, setTodasAsCartas] = useState([]);
  const [cartasFiltradas, setCartasFiltradas] = useState([]);
  const [paginaAtual, setPaginaAtual] = useState(0);
  const [carregando, setCarregando] = useState(false);
  const [mensagemErro, setMensagemErro] = useState("");
  const [mostrarToast, setMostrarToast] = useState(false);

  const [termoPesquisa, setTermoPesquisa] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroAtributo, setFiltroAtributo] = useState("");
  const [filtroNivel, setFiltroNivel] = useState("");
  const [filtroAtk, setFiltroAtk] = useState("");
  const [filtroDef, setFiltroDef] = useState("");
  const [filtroPrecoMin, setFiltroPrecoMin] = useState("");
  const [filtroPrecoMax, setFiltroPrecoMax] = useState("");
  const [ocultarSemPreco, setOcultarSemPreco] = useState(true);

  const [filtrosAbertos, setFiltrosAbertos] = useState(false);

  // ====================================================
  // 3. ESTADOS LOCAIS (Modal de Detalhes)
  // ====================================================
  const [cartaSelecionada, setCartaSelecionada] = useState(null);
  const [nomeInglesModal, setNomeInglesModal] = useState("");
  const [carregandoModal, setCarregandoModal] = useState(false);
  const [imagemZoom, setImagemZoom] = useState(false);

  // ====================================================
  // 4. REQUISIÇÕES E LÓGICA DE NEGÓCIO
  // ====================================================
  async function buscarCartasAPI() {
    setCarregando(true);
    setMensagemErro("");
    setPaginaAtual(0);

    let url = "https://db.ygoprodeck.com/api/v7/cardinfo.php?language=pt";
    if (termoPesquisa) url += "&fname=" + encodeURIComponent(termoPesquisa);
    if (filtroTipo) url += "&type=" + encodeURIComponent(filtroTipo);
    if (filtroAtributo) url += "&attribute=" + encodeURIComponent(filtroAtributo);
    if (filtroNivel) url += "&level=" + encodeURIComponent(filtroNivel);
    if (filtroAtk) url += "&atk=" + encodeURIComponent(filtroAtk);
    if (filtroDef) url += "&def=" + encodeURIComponent(filtroDef);

    try {
      const resposta = await fetch(url);
      
      if (resposta.status === 400) {
        setMensagemErro("Nenhuma carta encontrada com esses filtros.");
        setTodasAsCartas([]);
        setCarregando(false);
        return;
      }

      const dados = await resposta.json();
      if (!dados.data || dados.data.length === 0) {
        setMensagemErro("Nenhuma carta encontrada.");
        setTodasAsCartas([]);
      } else {
        setTodasAsCartas(dados.data);
      }
    } catch (erro) {
      console.error("Erro na request:", erro);
      setMensagemErro("Erro de conexão com o servidor.");
      setTodasAsCartas([]);
    }
    setCarregando(false);
  }

  const aplicarFiltroDePrecoLocal = useCallback((cartas) => {
    if (!cartas || cartas.length === 0) {
      setCartasFiltradas([]);
      return;
    }

    const precoMin = parseFloat(filtroPrecoMin);
    const precoMax = parseFloat(filtroPrecoMax);

    let filtradas = cartas.filter((carta) => {
      let preco = obterPreco(carta);
      
      if (ocultarSemPreco && preco <= 0) return false;
      if (!isNaN(precoMin) && preco < precoMin) return false;
      if (!isNaN(precoMax) && preco > precoMax) return false;
      
      return true;
    });

    filtradas.sort((a, b) => obterPreco(a) - obterPreco(b));
    setCartasFiltradas(filtradas);
    setPaginaAtual(0);
  }, [filtroPrecoMin, filtroPrecoMax, ocultarSemPreco]); 

  // ====================================================
  // 5. CICLO DE VIDA (Hooks)
  // ====================================================
  useEffect(() => {
    const timeoutPesquisa = setTimeout(() => {
      buscarCartasAPI();
    }, 800);

    return () => clearTimeout(timeoutPesquisa);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [termoPesquisa]); 

  useEffect(() => {
    aplicarFiltroDePrecoLocal(todasAsCartas);
  }, [todasAsCartas, aplicarFiltroDePrecoLocal]);

  // ====================================================
  // 6. FUNÇÕES INTERATIVAS
  // ====================================================
  function resetarFiltros() {
    setTermoPesquisa("");
    setFiltroTipo("");
    setFiltroAtributo("");
    setFiltroNivel("");
    setFiltroAtk("");
    setFiltroDef("");
    setFiltroPrecoMin("");
    setFiltroPrecoMax("");
    setOcultarSemPreco(true);
    buscarCartasAPI();
  }

  async function abrirModalDetalhes(carta) {
    setCartaSelecionada(carta);
    setNomeInglesModal(carta.name); 
    setCarregandoModal(true);
    setImagemZoom(false); 

    try {
      const url = "https://db.ygoprodeck.com/api/v7/cardinfo.php?id=" + carta.id;
      const response = await fetch(url);
      const data = await response.json();
      if (data.data && data.data[0] && data.data[0].name) {
        setNomeInglesModal(data.data[0].name);
      }
    } catch (err) {
      console.error("Falha ao puxar nome gringo da carta:", err);
    }
    setCarregandoModal(false);
  }

  function fecharModal() {
    setCartaSelecionada(null);
    setImagemZoom(false);
  }

  function adicionarFavorito(carta) {
    if (!currentUser) {
      window.alert("Você precisa fazer login para favoritar cartas!");
      navigate('/contas'); // CORREÇÃO: O navigate agora é usado para levar o utilizador ao login
      return; 
    }

    let precoParaFavorito = obterPreco(carta).toFixed(2);
    let novaCarta = {
      nome: carta.name,
      imagem: carta.card_images[0].image_url,
      preco: precoParaFavorito
    };

    // Validação de duplicidade vinculada ao usuário logado
    let jaExiste = favoritos.some((f) => f.nome === novaCarta.nome && f.owner === currentUser.username);

    if (!jaExiste) {
      dispatch(adicionarFavoritoGlobal({ carta: novaCarta, username: currentUser.username }));
      
      setMostrarToast(true);
      setTimeout(() => setMostrarToast(false), 2000);
    } else {
      window.alert("Esta carta já está na sua lista de favoritos!");
    }
  }

  function mudarPagina(direcao) {
    setPaginaAtual((prev) => prev + direcao);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Cálculos dinâmicos de paginação
  const inicioPaginacao = paginaAtual * CARTAS_POR_PAGINA;
  const fimPaginacao = inicioPaginacao + CARTAS_POR_PAGINA;
  const cartasDestaPagina = cartasFiltradas.slice(inicioPaginacao, fimPaginacao);
  const totalPaginas = Math.ceil(cartasFiltradas.length / CARTAS_POR_PAGINA);

  function formatarPrecoModal(valor, simbolo = "US$") {
    let valFloat = parseFloat(valor || 0);
    if (valFloat > 0) {
      return <span className="vendor-price">{simbolo} {valFloat.toFixed(2)}</span>;
    }
    return <span className="vendor-price indisponivel">Fora de estoque</span>;
  }

  // ====================================================
  // 7. RENDERIZAÇÃO DA INTERFACE
  // ====================================================
  return (
    <div>
      {/* INPUT PRINCIPAL */}
      <div className="barra-pesquisa">
        <div className="container">
          <div className="input-group input-group-lg">
            <input
              type="text"
              className="form-control"
              placeholder="Buscar carta pelo nome..."
              value={termoPesquisa}
              onChange={(e) => setTermoPesquisa(e.target.value)}
            />
            <button className="btn btn-info fw-bold" onClick={buscarCartasAPI}>Pesquisar</button>
          </div>
          {/* Controle do Menu Lateral Responsivo */}
          <button
            className="btn btn-outline-info w-100 mt-3 d-lg-none"
            type="button"
            onClick={() => setFiltrosAbertos(!filtrosAbertos)}
          >
            {filtrosAbertos ? "✖ Esconder Filtros Avançados" : "⚙️ Mostrar Filtros Avançados"}
          </button>
        </div>
      </div>

      <div className="container mt-4">
        <div className="row g-4">
          
          {/* SIDEBAR DE FILTROS */}
          <aside className="col-lg-3">
            <div className={`collapse d-lg-block ${filtrosAbertos ? 'show' : ''}`} id="painelFiltros">
              <div className="filtro-container">
                <h5 className="text-white border-bottom border-secondary pb-2 mb-3">Filtros</h5>

                <label>Tipo de Carta</label>
                <select className="form-select form-select-sm" value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
                  <option value="">Todos</option>
                  <option value="Normal Monster">Monstro Normal</option>
                  <option value="Effect Monster">Monstro de Efeito</option>
                  <option value="Fusion Monster">Monstro de Fusão</option>
                  <option value="Synchro Monster">Monstro Synchro</option>
                  <option value="XYZ Monster">Monstro XYZ</option>
                  <option value="Link Monster">Monstro Link</option>
                  <option value="Spell Card">Carta Mágica</option>
                  <option value="Trap Card">Carta Armadilha</option>
                </select>

                <label>Atributo</label>
                <select className="form-select form-select-sm" value={filtroAtributo} onChange={(e) => setFiltroAtributo(e.target.value)}>
                  <option value="">Todos</option>
                  <option value="DARK">DARK (Trevas)</option>
                  <option value="LIGHT">LIGHT (Luz)</option>
                  <option value="EARTH">EARTH (Terra)</option>
                  <option value="WATER">WATER (Água)</option>
                  <option value="FIRE">FIRE (Fogo)</option>
                  <option value="WIND">WIND (Vento)</option>
                  <option value="DIVINE">DIVINE (Divino)</option>
                </select>

                <label>Nível / Rank</label>
                <input type="number" className="form-control form-control-sm" min="1" max="12" placeholder="Ex: 4" value={filtroNivel} onChange={(e) => setFiltroNivel(e.target.value)} />

                <div className="row mt-2">
                  <div className="col-6">
                    <label>ATK (Exato)</label>
                    <input type="number" className="form-control form-control-sm" placeholder="ATK" value={filtroAtk} onChange={(e) => setFiltroAtk(e.target.value)} />
                  </div>
                  <div className="col-6">
                    <label>DEF (Exato)</label>
                    <input type="number" className="form-control form-control-sm" placeholder="DEF" value={filtroDef} onChange={(e) => setFiltroDef(e.target.value)} />
                  </div>
                </div>

                <label className="mt-3 text-info">Faixa de Preço (US$)</label>
                <div className="row">
                  <div className="col-6">
                    <input type="number" className="form-control form-control-sm" placeholder="Min" step="0.50" value={filtroPrecoMin} onChange={(e) => setFiltroPrecoMin(e.target.value)} />
                  </div>
                  <div className="col-6">
                    <input type="number" className="form-control form-control-sm" placeholder="Max" step="0.50" value={filtroPrecoMax} onChange={(e) => setFiltroPrecoMax(e.target.value)} />
                  </div>
                </div>

                <div className="form-check mt-3">
                  <input className="form-check-input" type="checkbox" id="filtroOcultarSemPreco" checked={ocultarSemPreco} onChange={(e) => setOcultarSemPreco(e.target.checked)} />
                  <label className="form-check-label text-light" htmlFor="filtroOcultarSemPreco" style={{ marginTop: 0 }}>
                    Ocultar Indisponíveis
                  </label>
                </div>

                <button className="btn btn-info w-100 mt-4 fw-bold" onClick={buscarCartasAPI}>Aplicar Filtros</button>
                <button className="btn btn-outline-danger w-100 mt-2 btn-sm" onClick={resetarFiltros}>Limpar Tudo</button>
              </div>
            </div>
          </aside>

          {/* LISTAGEM DE CARTAS */}
          <main className="col-lg-9">
            <div className="row g-4">
              {carregando && (
                <h4 className='text-center w-100 text-info mt-5'>Buscando no banco de dados...</h4>
              )}

              {!carregando && mensagemErro && (
                <h4 className='text-center w-100 text-warning mt-5'>{mensagemErro}</h4>
              )}

              {/* Componente condicional que alerta a ausência de correspondência após filtragem client-side */}
              {!carregando && !mensagemErro && cartasFiltradas.length === 0 && todasAsCartas.length > 0 && (
                <h4 className='text-center w-100 text-warning mt-5'>Nenhuma carta atende aos filtros de preço solicitados.</h4>
              )}

              {!carregando && cartasDestaPagina.map((carta) => {
                let precoRaw = obterPreco(carta);
                return (
                  <div className="col-12 col-sm-6 col-md-4 mb-4" key={carta.id}>
                    <div className="card h-100 shadow-sm rounded-3">
                      <button
                        className="favoritar-btn"
                        title="Adicionar aos Favoritos"
                        onClick={(e) => { e.stopPropagation(); adicionarFavorito(carta); }}
                      >
                        ⭐
                      </button>
                      <div onClick={() => abrirModalDetalhes(carta)} style={{ cursor: 'pointer' }}>
                        <img src={carta.card_images[0].image_url} className="card-img-top w-100" alt={carta.name} loading="lazy" />
                        <div className="card-body text-center d-flex flex-column justify-content-between pb-3">
                          <div>
                            <p className="card-text fw-bold text-white mb-1" style={{ fontSize: '14px', minHeight: '40px' }}>{carta.name}</p>
                            <p className="card-text text-success fw-bold m-0" style={{ fontSize: '18px' }}>
                              <span style={{ fontSize: '12px', color: '#20aeea' }}>TCGPlayer:</span><br />
                              {precoRaw > 0 ? `US$ ${precoRaw.toFixed(2)}` : <span className="text-secondary" style={{ fontSize: '12px' }}>Indisponível</span>}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* CONTROLES DE PAGINAÇÃO */}
            {!carregando && totalPaginas > 1 && (
              <nav className="mt-5 mb-5">
                <div className="d-flex justify-content-center align-items-center gap-3">
                  <button className="btn btn-outline-info" disabled={paginaAtual === 0} onClick={() => mudarPagina(-1)}>⮜ Anterior</button>
                  <span className="fw-bold text-light">Página {paginaAtual + 1} de {totalPaginas}</span>
                  <button className="btn btn-outline-info" disabled={paginaAtual >= totalPaginas - 1} onClick={() => mudarPagina(1)}>Próxima ⮞</button>
                </div>
              </nav>
            )}
          </main>
        </div>
      </div>

      {/* MODAL DETALHES */}
      {cartaSelecionada && (
        <>
          <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1" onClick={fecharModal}>
            <div className="modal-dialog modal-lg" onClick={(e) => e.stopPropagation()}>
              <div className="modal-content">
                
                <div className="modal-header border-secondary">
                  <h5 className="modal-title text-white">Detalhes da Carta</h5>
                  
                  <button 
                    type="button"
                    className="ms-auto" 
                    onClick={fecharModal}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'white',
                      fontSize: '1.8rem',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      lineHeight: '1',
                      padding: '0 10px'
                    }}
                    aria-label="Fechar"
                  >
                    &times;
                  </button>
                </div>
                
                <div className="modal-body">
                  {carregandoModal ? (
                    <div className="text-center py-5">
                      <div className="spinner-border text-info" role="status"></div>
                      <p className="mt-3">Carregando informações da carta...</p>
                    </div>
                  ) : (
                    <div className="row">
                      <div className="col-md-5 text-center mb-4">
                        <div style={{ position: 'static' }}>
                          {imagemZoom && (
                            <div className="overlay" onClick={() => setImagemZoom(false)} />
                          )}
                          <img
                            src={cartaSelecionada.card_images[0].image_url}
                            className={`img-fluid rounded border border-secondary ${imagemZoom ? 'img-zoomed' : ''}`}
                            alt={cartaSelecionada.name}
                            style={{
                              boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
                              maxHeight: '400px',
                              objectFit: 'contain',
                              cursor: 'pointer'
                            }}
                            title="Clique para dar Zoom"
                            onClick={() => setImagemZoom(!imagemZoom)}
                          />
                        </div>
                        <p className="mt-2" style={{ fontSize: '0.8rem', color: '#8b949e' }}>🔍 Clique na imagem para dar zoom</p>
                      </div>
                      <div className="col-md-7">
                        <h3 className="fw-bold text-white border-bottom border-secondary pb-2 mb-3">{cartaSelecionada.name}</h3>

                        <div className="d-flex flex-wrap gap-2 mb-4">
                          <span className="badge bg-dark border border-secondary p-2">Tipo: {cartaSelecionada.type || 'N/A'}</span>
                          <span className="badge bg-dark border border-secondary p-2">Atr: {cartaSelecionada.attribute || 'N/A'}</span>
                          <span className="badge bg-dark border border-secondary p-2">Nv/Rank: {cartaSelecionada.level || cartaSelecionada.rank || 'N/A'}</span>
                          <span className="badge bg-dark border border-secondary p-2">ATK/DEF: {cartaSelecionada.atk !== undefined ? cartaSelecionada.atk : 'N/A'} / {cartaSelecionada.def !== undefined ? cartaSelecionada.def : 'N/A'}</span>
                        </div>

                        <h5 className="text-info fw-bold mb-3">🛒 Comparar Ofertas</h5>
                        <div className="vendor-list mb-4">
                          <a href={`https://www.tcgplayer.com/search/yugioh/product?q=${encodeURIComponent(nomeInglesModal)}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
                            <div className="vendor-card">
                              <div className="vendor-name"><span style={{ color: '#20aeea', fontSize: '1.2rem' }}>🔵</span> TCGPlayer</div>
                              {formatarPrecoModal(cartaSelecionada.card_prices?.[0]?.tcgplayer_price)}
                            </div>
                          </a>
                          <a href={`https://www.amazon.com/s?k=${encodeURIComponent("Yu-Gi-Oh! " + nomeInglesModal)}&tag=${AMAZON_AFFILIATE_TAG}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
                            <div className="vendor-card">
                              <div className="vendor-name"><span style={{ color: '#ff9900', fontSize: '1.2rem' }}>🅰️</span> Amazon</div>
                              {formatarPrecoModal(cartaSelecionada.card_prices?.[0]?.amazon_price)}
                            </div>
                          </a>
                          <a href={`https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(nomeInglesModal + " yugioh")}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
                            <div className="vendor-card">
                              <div className="vendor-name"><span style={{ color: '#e53238', fontSize: '1.2rem' }}>🛍️</span> eBay</div>
                              {formatarPrecoModal(cartaSelecionada.card_prices?.[0]?.ebay_price)}
                            </div>
                          </a>
                          <a href={`https://www.cardmarket.com/en/YuGiOh/Products/Search?searchString=${encodeURIComponent(nomeInglesModal)}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
                            <div className="vendor-card">
                              <div className="vendor-name"><span style={{ color: '#0055ff', fontSize: '1.2rem' }}>🇪🇺</span> Cardmarket</div>
                              {formatarPrecoModal(cartaSelecionada.card_prices?.[0]?.cardmarket_price, '€')}
                            </div>
                          </a>
                          <a href={`https://www.coolstuffinc.com/page/1088?query=${encodeURIComponent(nomeInglesModal)}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
                            <div className="vendor-card">
                              <div className="vendor-name"><span style={{ color: '#a55eea', fontSize: '1.2rem' }}>🎲</span> CoolStuffInc</div>
                              {formatarPrecoModal(cartaSelecionada.card_prices?.[0]?.coolstuffinc_price)}
                            </div>
                          </a>
                        </div>

                        <div className="text-center mt-3 mb-4 p-2 rounded" style={{ background: 'rgba(0, 210, 255, 0.1)', border: '1px solid #00d2ff', borderRadius: '8px' }}>
                          <p className="mb-0" style={{ fontSize: '0.85rem', color: '#b0e0ff' }}>
                            💡 <strong>Clique em qualquer loja acima</strong> para ser direcionado ao site parceiro e garantir o melhor preço!
                          </p>
                          <p className="mb-0" style={{ fontSize: '0.75rem', color: '#8b949e' }}>
                            🔗 Você estará apoiando a Greed Store — comissão revertida em melhorias!
                          </p>
                        </div>

                        <h5 className="border-bottom border-secondary pb-2">Efeito da Carta</h5>
                        <p className="text-light" style={{ whiteSpace: 'pre-wrap', fontSize: '0.95rem', lineHeight: '1.6' }}>{cartaSelecionada.desc}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </>
      )}

      {/* COMPONENTE DE AVISO (TOAST) EFÊMERO LOCAL */}
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: '#28a745',
        color: 'white',
        padding: '10px 20px',
        borderRadius: '5px',
        display: mostrarToast ? 'block' : 'none',
        zIndex: 9999,
        fontWeight: 'bold',
        boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
      }}>
        ⭐ Adicionado aos favoritos!
      </div>
    </div>
  );
}