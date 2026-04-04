// ============================================================
// EXEMPLOS DE INTEGRAÇÃO - MARKETPLACE
// ============================================================
// 
// Este arquivo mostra como integrar o rastreamento de cliques
// em afiliadas no seu Marketplace.jsx
//
// Existem 2 formas de integrar:
//

// ============================================================
// FORMA 1: Usando Hook (Recomendado)
// ============================================================

import { useAffiliateTracking } from '../hooks/useAffiliateTracking';

function MeuComponente() {
  const { registrarClique } = useAffiliateTracking();
  
  const userLogado = getCurrentUser(); // Sua função para obter usuário
  const nomeUsuario = userLogado?.username || 'Anônimo';
  
  const abrirAfiliada = (url, afiliada, nomeCarta) => {
    // Registra o clique
    registrarClique(afiliada, nomeCarta, nomeUsuario);
    
    // Abre o link
    window.open(url, '_blank', 'noopener,noreferrer');
  };
  
  return (
    <a 
      href="#"
      onClick={(e) => {
        e.preventDefault();
        abrirAfiliada(
          'https://www.tcgplayer.com/search/yugioh/product?q=Blue-Eyes',
          'TCGPlayer',
          'Blue-Eyes White Dragon'
        );
      }}
    >
      Comprar no TCGPlayer
    </a>
  );
}


// ============================================================
// FORMA 2: Usando Função Helper Simples
// ============================================================

import { rastrearCliqueParceiro } from '../hooks/affiliateHelpers';

function OutroComponente() {
  const userLogado = getCurrentUser();
  const nomeUsuario = userLogado?.username || 'Anônimo';
  
  return (
    <a 
      href="#"
      onClick={(e) => {
        e.preventDefault();
        rastrearCliqueParceiro(
          'https://www.amazon.com/s?k=Yu-Gi-Oh+Blue-Eyes&tag=3153150d-20',
          'Amazon',
          'Blue-Eyes White Dragon',
          nomeUsuario
        );
      }}
    >
      Comprar na Amazon
    </a>
  );
}


// ============================================================
// INTEGRAÇÃO NO MODAL DE DETALHES (MARKETPLACE)
// ============================================================

// NO ARQUIVO: Marketplace.jsx
// ENCONTRE ESTA SEÇÃO (linhas ~416-445):

/*
<a href={`https://www.tcgplayer.com/search/yugioh/product?q=${encodeURIComponent(nomeInglesModal)}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
  <div className="vendor-card">
    <div className="vendor-name"><span style={{ color: '#20aeea', fontSize: '1.2rem' }}>🔵</span> TCGPlayer</div>
    {formatarPrecoModal(cartaSelecionada.card_prices?.[0]?.tcgplayer_price)}
  </div>
</a>
*/

// ADICIONE O HOOK NO TOPO:
/*
import { useAffiliateTracking } from "../hooks/useAffiliateTracking";
*/

// E SUBSTITUA O COMPONENTE MARKETPLACE COM ESTE CÓDIGO NO FINAL:

export default function MarketplaceComRastreamento() {
  // ... código existente ...
  const { registrarClique } = useAffiliateTracking();
  
  const userLogado = getCurrentUser();
  const nomeUsuario = userLogado?.username || 'Anônimo';
  
  const abrirAfiliada = (url, afiliada, nomeCarta) => {
    registrarClique(afiliada, nomeCarta, nomeUsuario);
    window.open(url, '_blank', 'noopener,noreferrer');
  };
  
  // DEPOIS, NO MODAL (linhas ~414-445), SUBSTITUA OS <a> TAGS POR:
  
  /*
  <div 
    onClick={() => abrirAfiliada(
      `https://www.tcgplayer.com/search/yugioh/product?q=${encodeURIComponent(nomeInglesModal)}`,
      'TCGPlayer',
      cartaSelecionada.name
    )}
    style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
  >
    <div className="vendor-card">
      <div className="vendor-name"><span style={{ color: '#20aeea', fontSize: '1.2rem' }}>🔵</span> TCGPlayer</div>
      {formatarPrecoModal(cartaSelecionada.card_prices?.[0]?.tcgplayer_price)}
    </div>
  </div>
  
  <div 
    onClick={() => abrirAfiliada(
      `https://www.amazon.com/s?k=${encodeURIComponent("Yu-Gi-Oh! " + nomeInglesModal)}&tag=3153150d-20`,
      'Amazon',
      cartaSelecionada.name
    )}
    style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
  >
    <div className="vendor-card">
      <div className="vendor-name"><span style={{ color: '#ff9900', fontSize: '1.2rem' }}>🅰️</span> Amazon</div>
      {formatarPrecoModal(cartaSelecionada.card_prices?.[0]?.amazon_price)}
    </div>
  </div>
  
  // ... E ASSIM POR DIANTE PARA AS OUTRAS AFILIADAS ...
  */
}


// ============================================================
// O QUE É REGISTRADO AUTOMATICAMENTE?
// ============================================================
/*
{
  id: 1704067200000,              // Timestamp único
  afiliada: 'TCGPlayer',          // Nome da loja
  nomeCarta: 'Blue-Eyes White Dragon',  // Nome da carta
  usuario: 'joao123',             // Username ou 'Anônimo'
  data: '2024-01-01T12:00:00.000Z', // Data ISO 8601
  dataLegivel: '01/01/2024 12:00:00'  // Formatado para PT-BR
}
*/


// ============================================================
// COMO VISUALIZAR OS DADOS NO ADMIN?
// ============================================================
/*
1. Acesse: http://localhost:5173/admin
2. Role até "📊 Monitoramento de Cliques em Afiliadas"
3. Você verá:
   - Total de cliques
   - Afiliadas únicas
   - Usuários ativos
   - Gráficos de distribuição
   - Filtros por afiliada e usuário
   - Exportação em CSV e JSON
   - Tabela com todos os cliques
*/


// ============================================================
// LISTA DE AFILIADAS SUPORTADAS
// ============================================================
const AFILIADAS_EXEMPLO = [
  'TCGPlayer',
  'Amazon',
  'eBay',
  'Cardmarket',
  'CoolStuffInc',
  // ... adicione mais conforme necessário
];


export default function ExemploDeIntegracaoCompleta() {
  // Seu código aqui
}
