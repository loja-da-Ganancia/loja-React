// ============================================================
// HELPER PARA REGISTRAR CLIQUES NO MARKETPLACE
// ============================================================
// Este arquivo contém funções auxiliares para rastrear
// cliques em links de afiliados no Marketplace

import { useAffiliateTracking } from './useAffiliateTracking';

/**
 * Hook que retorna uma função para rastrear cliques em afiliadas
 * USE ISSO NO MARKETPLACE PARA REGISTRAR CLIQUES
 */
export function useRegistrarCliqueParceiro() {
  const { registrarClique } = useAffiliateTracking();

  const registrarEAbrir = (url, afiliada, nomeCarta, usuario = 'Anônimo') => {
    // Registra o clique
    registrarClique(afiliada, nomeCarta, usuario);
    
    // Abre o link em nova aba
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return { registrarEAbrir };
}

/**
 * Integração simplificada para usar nos links <a>
 * Exemplo de uso:
 * 
 * <a 
 *   href={url}
 *   onClick={(e) => {
 *     e.preventDefault();
 *     rastrearCliqueParceiro(url, 'Amazon', 'Blue-Eyes White Dragon', usuario);
 *   }}
 * >
 *   Amazon
 * </a>
 */
export function rastrearCliqueParceiro(url, afiliada, nomeCarta, usuario = 'Anônimo') {
  const { registrarClique } = useAffiliateTracking();
  
  // Registra no localStorage
  registrarClique(afiliada, nomeCarta, usuario);
  
  // Log no console (útil para debug)
  console.log(`[Afiliada] Clique registrado: ${afiliada} - ${nomeCarta}`);
  
  // Abre o link
  window.open(url, '_blank', 'noopener,noreferrer');
}
