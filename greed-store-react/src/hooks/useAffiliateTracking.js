// ============================================================
// HOOK CUSTOMIZADO: useAffiliateTracking
// ============================================================
// Fornece funções para rastrear cliques em links de afiliados
// e armazenar os dados no localStorage

import { useCallback } from 'react';

const AFFILIATE_CLICKS_KEY = 'greedstore_affiliate_clicks';

export function useAffiliateTracking() {
  
  // ========== FUNÇÕES INTERNAS ==========
  
  /**
   * Recupera todos os registros de cliques do localStorage
   */
  const obterTodosOsCliques = useCallback(() => {
    try {
      const dados = localStorage.getItem(AFFILIATE_CLICKS_KEY);
      return dados ? JSON.parse(dados) : [];
    } catch (erro) {
      console.error('Erro ao recuperar cliques:', erro);
      return [];
    }
  }, []);

  /**
   * Registra um novo clique em um link de afiliado
   * @param {string} afiliada - Nome da afiliada (TCGPlayer, Amazon, eBay, etc)
   * @param {string} nomeCarta - Nome da carta clicada
   * @param {string} usuarioLogado - Username do usuário logado (pode ser 'Anônimo')
   */
  const registrarClique = useCallback((afiliada, nomeCarta, usuarioLogado = 'Anônimo') => {
    try {
      const cliques = obterTodosOsCliques();
      
      const novoClique = {
        id: Date.now(), // ID único baseado em timestamp
        afiliada: afiliada || 'Desconhecida',
        nomeCarta: nomeCarta || 'Sem nome',
        usuario: usuarioLogado,
        data: new Date().toISOString(),
        dataLegivel: new Date().toLocaleString('pt-BR'),
      };
      
      cliques.push(novoClique);
      localStorage.setItem(AFFILIATE_CLICKS_KEY, JSON.stringify(cliques));
      
      return novoClique;
    } catch (erro) {
      console.error('Erro ao registrar clique:', erro);
      return null;
    }
  }, [obterTodosOsCliques]);

  /**
   * Obtém estatísticas de cliques (total, por afiliada, por usuário)
   */
  const obterEstatisticas = useCallback(() => {
    const cliques = obterTodosOsCliques();
    
    if (cliques.length === 0) {
      return {
        totalCliques: 0,
        cliquesPorAfiliada: {},
        cliquesPorUsuario: {},
        ultimoClique: null,
        primeiroClique: null,
      };
    }

    const cliquesPorAfiliada = {};
    const cliquesPorUsuario = {};

    cliques.forEach((clique) => {
      // Contagem por afiliada
      if (cliquesPorAfiliada[clique.afiliada]) {
        cliquesPorAfiliada[clique.afiliada]++;
      } else {
        cliquesPorAfiliada[clique.afiliada] = 1;
      }

      // Contagem por usuário
      if (cliquesPorUsuario[clique.usuario]) {
        cliquesPorUsuario[clique.usuario]++;
      } else {
        cliquesPorUsuario[clique.usuario] = 1;
      }
    });

    return {
      totalCliques: cliques.length,
      cliquesPorAfiliada,
      cliquesPorUsuario,
      ultimoClique: cliques[cliques.length - 1],
      primeiroClique: cliques[0],
    };
  }, [obterTodosOsCliques]);

  /**
   * Limpa todos os registros de cliques
   */
  const limparDados = useCallback(() => {
    try {
      if (window.confirm('Tem certeza que deseja LIMPAR todos os registros de cliques? Esta ação não pode ser desfeita.')) {
        localStorage.removeItem(AFFILIATE_CLICKS_KEY);
        return true;
      }
      return false;
    } catch (erro) {
      console.error('Erro ao limpar dados:', erro);
      return false;
    }
  }, []);

  /**
   * Filtra cliques por afiliada
   */
  const filtrarPorAfiliada = useCallback((afiliada) => {
    const cliques = obterTodosOsCliques();
    return cliques.filter((clique) => clique.afiliada === afiliada);
  }, [obterTodosOsCliques]);

  /**
   * Filtra cliques por usuário
   */
  const filtrarPorUsuario = useCallback((usuario) => {
    const cliques = obterTodosOsCliques();
    return cliques.filter((clique) => clique.usuario === usuario);
  }, [obterTodosOsCliques]);

  /**
   * Filtra cliques por data (range)
   */
  const filtrarPorData = useCallback((dataInicio, dataFim) => {
    const cliques = obterTodosOsCliques();
    const inicio = new Date(dataInicio).getTime();
    const fim = new Date(dataFim).getTime();

    return cliques.filter((clique) => {
      const dataClique = new Date(clique.data).getTime();
      return dataClique >= inicio && dataClique <= fim;
    });
  }, [obterTodosOsCliques]);

  /**
   * Exporta os dados de cliques como JSON
   */
  const exportarDados = useCallback(() => {
    const cliques = obterTodosOsCliques();
    const dataString = JSON.stringify(cliques, null, 2);
    const blob = new Blob([dataString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cliques-afiliadas-${new Date().getTime()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [obterTodosOsCliques]);

  /**
   * Exporta os dados como CSV
   */
  const exportarCSV = useCallback(() => {
    const cliques = obterTodosOsCliques();
    
    if (cliques.length === 0) {
      alert('Não há dados para exportar');
      return;
    }

    const headers = ['ID', 'Afiliada', 'Carta', 'Usuário', 'Data', 'Hora Legível'];
    const rows = cliques.map((clique) => [
      clique.id,
      clique.afiliada,
      clique.nomeCarta,
      clique.usuario,
      clique.data,
      clique.dataLegivel,
    ]);

    let csv = headers.join(',') + '\n';
    rows.forEach((row) => {
      csv += row.map((cell) => `"${cell}"`).join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cliques-afiliadas-${new Date().getTime()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [obterTodosOsCliques]);

  return {
    registrarClique,
    obterTodosOsCliques,
    obterEstatisticas,
    limparDados,
    filtrarPorAfiliada,
    filtrarPorUsuario,
    filtrarPorData,
    exportarDados,
    exportarCSV,
  };
}
