import React, { useState } from "react"; // Removido o useEffect inútil
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { removerFavoritoGlobal } from "../slices/favoritosSlice";

export default function Favoritos() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // ====================================================
  // 1. ESTADOS GLOBAIS E LOCAIS
  // ====================================================
  const currentUser = useSelector((state) => state.user.currentUser);
  const todosFavoritos = useSelector((state) => state.favoritos.items);
  
  const [modalInfo, setModalInfo] = useState(null);
  const [carregandoModal, setCarregandoModal] = useState(false);
  const [imagemZoom, setImagemZoom] = useState(false);

  // ====================================================
  // 2. TELA DE BLOQUEIO (GATEKEEPER)
  // ====================================================
  // Sempre depois dos hooks!
  if (!currentUser) {
    return (
      <div className="container mt-5 mb-5 d-flex flex-column align-items-center justify-content-center flex-grow-1" style={{ minHeight: '65vh' }}>
        <div className="text-center p-5 rounded-4 shadow-lg" style={{ backgroundColor: '#161b22', border: '1px solid #30363d', maxWidth: '500px' }}>
          <div style={{ fontSize: '4.5rem', marginBottom: '10px', lineHeight: '1' }}>🔒</div>
          <h3 className="text-white fw-bold mt-2">Acesso Restrito</h3>
          <p className="mt-3 mb-4" style={{ color: '#8b949e', fontSize: '1.05rem', lineHeight: '1.6' }}>
            Você precisa estar conectado para acessar esta área. Faça login ou crie uma conta gratuita para guardar seus favoritos!
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
  // 3. LÓGICA DE NEGÓCIO (Usuário Logado)
  // ====================================================
  // Filtramos os favoritos somente após garantir que currentUser existe
  const meusFavoritos = todosFavoritos.filter(f => f.owner === currentUser.username);

  function removerFavorito(cartaNome) {
    if (!window.confirm("Tem certeza que deseja remover esta carta dos seus favoritos?")) return;
    dispatch(removerFavoritoGlobal({ nome: cartaNome, username: currentUser.username }));
  }

  async function abrirDetalhesFavorito(carta) {
    setModalInfo({
      nome: carta.nome, imagem: carta.imagem, tipo: "Carregando...", descricao: "Buscando informações do banco de dados..."
    });
    setCarregandoModal(true);
    setImagemZoom(false); 

    try {
      const url = "https://db.ygoprodeck.com/api/v7/cardinfo.php?language=pt&name=" + encodeURIComponent(carta.nome);
      const response = await fetch(url);
      const data = await response.json();

      if (data && data.data && data.data.length > 0) {
        const cartaFull = data.data[0];
        const imgUrl = (cartaFull.card_images && cartaFull.card_images.length > 0) ? cartaFull.card_images[0].image_url : carta.imagem;
        setModalInfo({
          nome: cartaFull.name || cartaFull.nome || carta.nome, imagem: imgUrl, tipo: cartaFull.type || "N/A", descricao: cartaFull.desc || "Descrição não disponível no momento."
        });
      } else {
        setModalInfo({ nome: carta.nome, imagem: carta.imagem, tipo: "N/A", descricao: "Detalhes não encontrados." });
      }
    } catch {
      setModalInfo({ nome: carta.nome, imagem: carta.imagem, tipo: "Erro", descricao: "Erro de conexão ao buscar os detalhes da carta." });
    }
    
    setCarregandoModal(false);
  }

  function fecharModal() {
    setModalInfo(null);
    setImagemZoom(false);
  }

  // ====================================================
  // 4. RENDERIZAÇÃO DA PÁGINA
  // ====================================================
  return (
    <div className="container mt-4 mb-5 flex-grow-1">
      <h2 className="mb-4 border-bottom border-secondary pb-2 text-white">⭐ Cartas Favoritas</h2>
      
      <div className="row g-4">
        {meusFavoritos.length === 0 ? (
          <div className="col-12 text-center mt-5" style={{color: '#8b949e', fontSize: '1.1rem'}}>
            Você ainda não favoritou nenhuma carta. <br/>
            <Link to="/marketplace" className="text-info text-decoration-none mt-2 d-inline-block">Explore o Marketplace!</Link>
          </div>
        ) : (
          meusFavoritos.map((carta, index) => (
            <div className="col-12 col-sm-6 col-md-4 col-lg-3 mb-4" key={index}>
              <div className="card card-favorito h-100 shadow-sm rounded-3">
                <div onClick={() => abrirDetalhesFavorito(carta)} style={{cursor: 'pointer'}} title="Ver detalhes">
                  <img src={carta.imagem} className="card-img-top w-100" alt={carta.nome} loading="lazy" />
                  <div className="card-body text-center d-flex flex-column justify-content-between pb-2">
                    <div>
                      <h5 className="card-title fw-bold text-white mb-2" style={{fontSize: '15px', minHeight: '40px'}}>{carta.nome}</h5>
                      <p className="card-text text-success fw-bold m-0" style={{fontSize: '16px'}}>US$ {carta.preco}</p>
                    </div>
                  </div>
                </div>
                <div className="card-footer bg-transparent border-0 pt-0 text-center pb-3">
                  <button className="btn btn-outline-danger btn-sm w-100 fw-bold" onClick={() => removerFavorito(carta.nome)}>
                    🗑️ Remover dos Favoritos
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL */}
      {modalInfo && (
        <>
          <div className="modal fade show d-block" tabIndex="-1" onClick={fecharModal} style={{zIndex: 1060}}>
            <div className="modal-dialog modal-dialog-centered modal-lg" onClick={(e) => e.stopPropagation()}>
              <div className="modal-content" style={{backgroundColor: '#161b22', border: '1px solid #30363d'}}>
                <div className="modal-header" style={{borderBottom: '1px solid #30363d'}}>
                  <h5 className="modal-title text-white">Detalhes da Carta</h5>
                  <button type="button" className="ms-auto" onClick={fecharModal} style={{background: 'transparent', border: 'none', color: 'white', fontSize: '1.8rem', fontWeight: 'bold', cursor: 'pointer', lineHeight: '1', padding: '0 10px'}} aria-label="Fechar">&times;</button>
                </div>
                <div className="modal-body text-center">
                  {carregandoModal && <p className="text-info mt-3">Carregando informações do banco de dados...</p>}
                  <div className="row">
                    <div className="col-md-5 text-center">
                      <img src={modalInfo.imagem} className={`img-fluid rounded border border-secondary img-zoomable ${imagemZoom ? 'img-zoomed' : ''}`} style={{maxHeight: '400px', objectFit: 'contain'}} title="Clique para dar Zoom" onClick={() => setImagemZoom(!imagemZoom)} alt="Zoom Card" />
                      <p className="mt-2" style={{fontSize: '0.8rem', color: '#8b949e'}}>🔍 Clique na imagem para dar zoom</p>
                    </div>
                    <div className="col-md-7 text-start">
                      <h3 className="fw-bold text-white">{modalInfo.nome}</h3>
                      <p className="text-light"><strong>Tipo:</strong> <span style={{color: '#00d2ff'}}>{modalInfo.tipo}</span></p>
                      <hr style={{borderColor: '#30363d'}} />
                      <p style={{whiteSpace: 'pre-wrap', fontSize: '0.95rem', lineHeight: '1.6', color: '#F2F3F4'}}>{modalInfo.descricao}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" style={{zIndex: 1055}}></div>
        </>
      )}
    </div>
  );
}