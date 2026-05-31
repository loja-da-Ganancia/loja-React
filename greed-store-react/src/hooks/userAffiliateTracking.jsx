import { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { registrarCliqueGlobal, deletarCliqueGlobal, limparCliquesGlobal } from '../slices/affiliateSlice';

/**
 * Hook customizado para orquestrar as métricas e o registo de cliques em afiliadas,
 * mantendo total compatibilidade com a arquitetura Redux.
 */
export function useAffiliateTracking() {
  const dispatch = useDispatch();
  
  // Extração reativa e otimizada diretamente do estado global
  const cliques = useSelector((state) => state.affiliates.items);

  /**
   * Formata e despacha um novo evento de clique para o Redux.
   * @param {string} afiliada - Nome da loja (TCGPlayer, Amazon, etc).
   * @param {string} nomeCarta - Nome do produto/carta alvo.
   * @param {string} usuarioLogado - Identificador do utilizador (padrão: 'Anônimo').
   */
  const registrarClique = useCallback((afiliada, nomeCarta, usuarioLogado = 'Anônimo') => {
    const novoClique = {
      id: Date.now(),
      afiliada: afiliada || 'Desconhecida',
      nomeCarta: nomeCarta || 'Sem nome',
      usuario: usuarioLogado,
      data: new Date().toISOString(),
      dataLegivel: new Date().toLocaleString('pt-BR'),
    };
    
    dispatch(registrarCliqueGlobal(novoClique));
    return novoClique;
  }, [dispatch]);

  /**
   * Compila os dados brutos num objeto estatístico consumível pelo Dashboard.
   */
  const obterEstatisticas = useCallback(() => {
    if (!cliques || cliques.length === 0) {
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
      // Agrupamento por loja
      cliquesPorAfiliada[clique.afiliada] = (cliquesPorAfiliada[clique.afiliada] || 0) + 1;
      // Agrupamento por utilizador
      cliquesPorUsuario[clique.usuario] = (cliquesPorUsuario[clique.usuario] || 0) + 1;
    });

    return {
      totalCliques: cliques.length,
      cliquesPorAfiliada,
      cliquesPorUsuario,
      ultimoClique: cliques[cliques.length - 1],
      primeiroClique: cliques[0],
    };
  }, [cliques]);

  /**
   * Delega a deleção de um registo específico para o Redux.
   */
  const deletarClique = useCallback((id) => {
    dispatch(deletarCliqueGlobal(id));
  }, [dispatch]);

  /**
   * Delega a purga completa do banco de rastreamento para o Redux.
   */
  const limparDados = useCallback(() => {
    dispatch(limparCliquesGlobal());
  }, [dispatch]);

  /**
   * Exporta a coleção de cliques no formato JSON.
   */
  const exportarDados = useCallback(() => {
    if (cliques.length === 0) return;
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
  }, [cliques]);

  /**
   * Exporta a coleção de cliques no formato CSV.
   */
  const exportarCSV = useCallback(() => {
    if (cliques.length === 0) {
      window.alert('Não há dados para exportar no momento.');
      return;
    }

    const headers = ['ID', 'Afiliada', 'Carta', 'Usuário', 'Data ISO', 'Data Legível'];
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

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cliques-afiliadas-${new Date().getTime()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [cliques]);

  // Exposição da API do Hook
  return {
    cliques, // Exportamos a matriz crua, caso o componente precise mapeá-la diretamente
    registrarClique,
    obterEstatisticas,
    deletarClique,
    limparDados,
    exportarDados,
    exportarCSV,
  };
}