import React, { useState } from "react";
import { Link } from "react-router-dom";

export default function Favoritos() {
  // Lazy Initialization: Carrega os favoritos direto do localStorage na primeira renderização.
  // Isso remove a necessidade do useEffect e da função carregarFavoritos.
  const [favoritos, setFavoritos] = useState(() => {
    return JSON.parse(localStorage.getItem("favoritos")) || [];
  });
  
  // Estados do Modal
  const [modalInfo, setModalInfo] = useState(null);
  const [carregandoModal, setCarregandoModal] = useState(false);
  const [imagemZoom, setImagemZoom] = useState(false);

  function removerFavorito(index) {
    if (!window.confirm("Tem certeza que deseja remover esta carta dos seus favoritos?")) {
      return;
    }
    
    // Copia o array atual, remove o item e salva novamente
    let novosFavoritos = [...favoritos];
    novosFavoritos.splice(index, 1);
    
    localStorage.setItem("favoritos", JSON.stringify(novosFavoritos));
    setFavoritos(novosFavoritos); // Atualiza a tela instantaneamente
  }

  async function abrirDetalhesFavorito(carta) {
    // Estado temporário enquanto carrega a API
    setModalInfo({
      nome: carta.nome,
      imagem: carta.imagem,
      tipo: "Carregando...",
      descricao: "Buscando informações do banco de dados..."
    });
    setCarregandoModal(true);
    setImagemZoom(false); // Reseta o zoom

    try {
      const url = "https://db.ygoprodeck.com/api/v7/cardinfo.php?language=pt&name=" + encodeURIComponent(carta.nome);
      const response = await fetch(url);
      const data = await response.json();

      if (data && data.data && data.data.length > 0) {
        const cartaFull = data.data[0];
        const imgUrl = (cartaFull.card_images && cartaFull.card_images.length > 0) 
          ? cartaFull.card_images[0].image_url 
          : carta.imagem;

        setModalInfo({
          nome: cartaFull.name || cartaFull.nome || carta.nome,
          imagem: imgUrl,
          tipo: cartaFull.type || "N/A",
          descricao: cartaFull.desc || "Descrição não disponível no momento."
        });
      } else {
        // Fallback caso a API não ache o nome exato
        setModalInfo({
          nome: carta.nome,
          imagem: carta.imagem,
          tipo: "N/A",
          descricao: "Detalhes não encontrados."
        });
      }
    } catch {
      // Omitido o parâmetro 'erro' do catch para resolver o aviso do ESLint "no-unused-vars"
      setModalInfo({
        nome: carta.nome,
        imagem: carta.imagem,
        tipo: "Erro",
        descricao: "Erro de conexão ao buscar os detalhes da carta."
      });
    }
    
    setCarregandoModal(false);
  }

  function fecharModal() {
    setModalInfo(null);
    setImagemZoom(false);
  }

  return (
    <div className="container mt-4 mb-5 flex-grow-1">
      <h2 className="mb-4 border-bottom border-secondary pb-2 text-white">⭐ Cartas Favoritas</h2>
      
      <div className="row g-4">
        {favoritos.length === 0 ? (
          <div className="col-12 text-center mt-5" style={{color: '#8b949e', fontSize: '1.1rem'}}>
            Você ainda não favoritou nenhuma carta. <br/>
            <Link to="/marketplace" className="text-info text-decoration-none mt-2 d-inline-block">
              Explore o Marketplace!
            </Link>
          </div>
        ) : (
          favoritos.map((carta, index) => (
            <div className="col-12 col-sm-6 col-md-4 col-lg-3 mb-4" key={index}>
              <div className="card card-favorito h-100 shadow-sm rounded-3">
                <div onClick={() => abrirDetalhesFavorito(carta)} style={{cursor: 'pointer'}} title="Ver detalhes">
                  <img src={carta.imagem} className="card-img-top w-100" alt={carta.nome} loading="lazy" />
                  <div className="card-body text-center d-flex flex-column justify-content-between pb-2">
                    <div>
                      <h5 className="card-title fw-bold text-white mb-2" style={{fontSize: '15px', minHeight: '40px'}}>
                        {carta.nome}
                      </h5>
                      <p className="card-text text-success fw-bold m-0" style={{fontSize: '16px'}}>
                        US$ {carta.preco}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="card-footer bg-transparent border-0 pt-0 text-center pb-3">
                  <button 
                    className="btn btn-outline-danger btn-sm w-100 fw-bold" 
                    onClick={() => removerFavorito(index)}
                  >
                    🗑️ Remover dos Favoritos
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL DE DETALHES DA CARTA (Renderização Condicional Pura) */}
      {modalInfo && (
        <>
          <div className="modal fade show d-block" tabIndex="-1" onClick={fecharModal} style={{zIndex: 1060}}>
            <div className="modal-dialog modal-dialog-centered modal-lg" onClick={(e) => e.stopPropagation()}>
              <div className="modal-content" style={{backgroundColor: '#161b22', border: '1px solid #30363d'}}>
                <div className="modal-header" style={{borderBottom: '1px solid #30363d'}}>
                  <h5 className="modal-title text-white">Detalhes da Carta</h5>
                  <button type="button" className="btn-close btn-close-white" onClick={fecharModal}></button>
                </div>
                <div className="modal-body text-center">
                  {carregandoModal && (
                    <p className="text-info mt-3">Carregando informações do banco de dados...</p>
                  )}
                  <div className="row">
                    <div className="col-md-5 text-center">
                      <img 
                        src={modalInfo.imagem} 
                        className={`img-fluid rounded border border-secondary img-zoomable ${imagemZoom ? 'img-zoomed' : ''}`} 
                        style={{maxHeight: '400px', objectFit: 'contain'}} 
                        title="Clique para dar Zoom"
                        onClick={() => setImagemZoom(!imagemZoom)}
                        alt="Zoom Card"
                      />
                      <p className="mt-2" style={{fontSize: '0.8rem', color: '#8b949e'}}>🔍 Clique na imagem para dar zoom</p>
                    </div>
                    <div className="col-md-7 text-start">
                      <h3 className="fw-bold text-white">{modalInfo.nome}</h3>
                      <p className="text-light">
                        <strong>Tipo:</strong> <span style={{color: '#00d2ff'}}>{modalInfo.tipo}</span>
                      </p>
                      <hr style={{borderColor: '#30363d'}} />
                      <p style={{whiteSpace: 'pre-wrap', fontSize: '0.95rem', lineHeight: '1.6', color: '#F2F3F4'}}>
                        {modalInfo.descricao}
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
    </div>
  );
}