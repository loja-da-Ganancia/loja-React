import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

// IDs Oficiais: Dragão Arco-Íris, Super Polimerização, Mago Negro e Kuriboh
const CARTAS_BASE_IDS = [79856792, 48130397, 46986414, 40640057];

export default function Home() {
  const [cartasDestaque, setCartasDestaque] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const buscarCartas = async () => {
      setCarregando(true);
      try {
        const response = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${CARTAS_BASE_IDS.join(',')}&language=pt`);
        const result = await response.json();
        if (result.data) {
          setCartasDestaque(result.data);
        }
      } catch (error) {
        console.error("Erro ao carregar as cartas da Home:", error);
      } finally {
        setCarregando(false);
      }
    };
    buscarCartas();
  }, []);

  return (
    <main className="flex-grow-1">
      {/* TÍTULO PRINCIPAL */}
      <section className="banner-home pt-5 pb-5 text-center">
        <h1 className="fw-bold mb-3" style={{ fontSize: '3.5rem', color: '#fff' }}>
          Greed Store
        </h1>
        <p className="fs-5 text-light opacity-75" style={{ maxWidth: '600px', margin: '0 auto' }}>
          O lugar certo para quem joga Yu-Gi-Oh! pesquisar preços, montar decks e interagir com outros duelistas.
        </p>
      </section>

      {/* CARTAS EM DESTAQUE */}
      <section className="container mb-5">
        <h3 className="text-white fw-bold mb-4 border-start border-info border-4 ps-3">
          ⭐ Cartas em Destaque
        </h3>
        <div className="row g-4">
          {carregando ? (
            <div className="col-12 text-center text-info">Carregando cartas...</div>
          ) : (
            cartasDestaque.map((carta) => (
              <div className="col-12 col-sm-6 col-md-3" key={carta.id}>
                <div className="card h-100 shadow-sm" style={{ backgroundColor: '#161b22', border: '1px solid #30363d' }}>
                  <img 
                    src={carta.card_images[0].image_url} 
                    className="card-img-top p-2" 
                    style={{ backgroundColor: '#0d1117', objectFit: 'contain', height: '230px' }} 
                    alt={carta.name}
                  />
                  <div className="card-body text-center p-3">
                    <h6 className="text-white fw-bold text-truncate" title={carta.name}>
                        {carta.name}
                    </h6>
                    <p className="text-success fw-bold m-0 mt-2">
                        US$ {carta.card_prices[0].tcgplayer_price}
                    </p>
                  </div>
                  <div className="card-footer bg-transparent border-0 pb-3">
                    <Link to="/marketplace" className="btn btn-sm btn-outline-info w-100 fw-bold">Ver na Loja</Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* GUIA DE OPERAÇÃO (COMO FUNCIONA) */}
      <section className="container mb-5">
        <h3 className="text-white fw-bold mb-4 border-start border-info border-4 ps-3">
          Como usar o site
        </h3>
        <div className="row g-4">
          <div className="col-md-4">
            <div className="p-4 rounded h-100" style={{ backgroundColor: '#161b22', border: '1px solid #30363d' }}>
              <h5 className="text-info fw-bold mb-3">1. Pesquise e Compare</h5>
              <p className="text-light opacity-75">
                No <strong>Marketplace</strong>, você digita o nome de qualquer carta e a gente te mostra os preços em várias lojas diferentes. Assim você sempre paga o menor valor.
              </p>
            </div>
          </div>
          <div className="col-md-4">
            <div className="p-4 rounded h-100" style={{ backgroundColor: '#161b22', border: '1px solid #30363d' }}>
              <h5 className="text-info fw-bold mb-3">2. Crie seu Próprio Deck</h5>
              <p className="text-light opacity-75">
                Na aba de <strong>Decks</strong>, você pode escolher suas cartas favoritas e salvar suas estratégias. O site ajuda você a não passar do limite de 60 cartas.
              </p>
            </div>
          </div>
          <div className="col-md-4">
            <div className="p-4 rounded h-100" style={{ backgroundColor: '#161b22', border: '1px solid #30363d' }}>
              <h5 className="text-info fw-bold mb-3">3. Entre na Comunidade</h5>
              <p className="text-light opacity-75">
                Depois de criar um deck legal, você pode postar ele no <strong>Feed</strong>. Assim, outros jogadores podem ver suas ideias e você pode se inspirar nos decks deles.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ATALHOS RÁPIDOS */}
      <section className="container mb-5">
        <div className="row g-3">
          <div className="col-md-4">
            <Link to="/marketplace" className="btn btn-dark w-100 py-3 border-secondary fw-bold text-decoration-none">🛒 Ir para o Marketplace</Link>
          </div>
          <div className="col-md-4">
            <Link to="/decks" className="btn btn-dark w-100 py-3 border-secondary fw-bold text-decoration-none">🎴 Montar um Deck</Link>
          </div>
          <div className="col-md-4">
            <Link to="/comunidade" className="btn btn-dark w-100 py-3 border-secondary fw-bold text-decoration-none">🤝 Ver o Feed</Link>
          </div>
        </div>
      </section>
    </main>
  );
}