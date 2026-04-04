import React from "react";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <main className="flex-grow-1">
      <section className="banner-home">
        <div className="textoBanner">
          Bem-vindo à<br />
          <span id="greed-store1">
            Greed Store!
          </span>
        </div>

        <div className="textoIntroducao">
          <strong>O seu portal definitivo para o Duelo:</strong>
          <br />
          <br />
          💸 Compre e analise o preço das melhores cartas
          <br />
          🤚 Monte estratégias e construa decks imbatíveis
          <br />
          🌎 Conecte-se com duelistas de todo o mundo
        </div>

        <div className="container mt-4 mb-5">
          <h2 className="mb-4 text-center section-title">
            O que você deseja fazer?
          </h2>
          <div className="row justify-content-center g-4">
            <div className="col-md-4">
              {/* Trocado <a> por <Link to="..."> */}
              <Link to="/marketplace" className="quick-action-card">
                <div className="quick-action-icon">🛒</div>
                <h4 className="fw-bold text-white">Explorar Marketplace</h4>
                <p className="mt-2 mb-0">
                  Busque cartas, compare preços no TCGPlayer e adicione aos
                  favoritos.
                </p>
              </Link>
            </div>

            <div className="col-md-4" id="cardAtalhoDeck">
              {/* Trocado <a> por <Link to="..."> */}
              <Link to="/decks" className="quick-action-card">
                <div className="quick-action-icon">🎴</div>
                <h4 className="fw-bold text-white">Montar Novo Deck</h4>
                <p className="mt-2 mb-0">
                  Crie estratégias, adicione cartas ao seu Trunk e prepare-se
                  para o duelo.
                </p>
              </Link>
            </div>

            <div className="col-md-4">
              {/* Trocado <a> por <Link to="..."> */}
              <Link to="/comunidade" className="quick-action-card">
                <div className="quick-action-icon">🤝</div>
                <h4 className="fw-bold text-white">Ver Comunidade</h4>
                <p className="mt-2 mb-0">
                  Compartilhe suas decklists e veja as estratégias de outros
                  jogadores.
                </p>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section
        className="container text-center mt-2 mb-5"
        id="caixaRedesSociais"
      >
        <h3 className="text-white fw-bold mb-4">
          Siga-nos em nossas redes sociais 🤳📲🌎
        </h3>
        <div className="d-flex justify-content-center flex-wrap gap-3">
          {/* Mantivemos as tags <a> aqui porque redes sociais são links EXTERNOS */}
          <a href="#" className="btn btn-primary px-4 py-2 fw-bold">
            Facebook
          </a>
          <a href="#" className="btn btn-info px-4 py-2 fw-bold text-dark">
            BlueSky
          </a>
          <a href="#" className="btn btn-danger px-4 py-2 fw-bold">
            Instagram
          </a>
          <a href="#" className="btn btn-secondary px-4 py-2 fw-bold">
            LinkedIn
          </a>
        </div>
      </section>
    </main>
  );
}