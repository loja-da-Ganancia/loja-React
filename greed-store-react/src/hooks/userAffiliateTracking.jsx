import { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { registrarCliqueGlobal, deletarCliqueGlobal, limparCliquesGlobal } from '../slices/affiliateSlice';

// A criação de um array constante fora do componente evita loops infinitos de renderização no Redux
const ARRAY_VAZIO = [];

export function useAffiliateTracking() {
  const dispatch = useDispatch();
  
  // Extração extremamente rigorosa para nunca causar "Cannot read properties of undefined"
  const cliques = useSelector((state) => {
    if (state?.affiliates?.items) {
      return state.affiliates.items;
    }
    return ARRAY_VAZIO;
  });

  const registrarClique = useCallback((affiliateStore, cardId) => {
    if (!affiliateStore || !cardId) return;
    dispatch(registrarCliqueGlobal({ affiliateStore, cardId }));
  }, [dispatch]);

  const obterEstatisticas = useCallback(() => {
    if (!cliques || cliques.length === 0) {
      return {
        totalCliques: 0,
        cliquesPorAfiliada: {},
        ultimoClique: null,
        primeiroClique: null,
      };
    }

    const cliquesPorAfiliada = {};

    cliques.forEach((clique) => {
      const loja = clique?.affiliateStore || 'Desconhecida';
      cliquesPorAfiliada[loja] = (cliquesPorAfiliada[loja] || 0) + 1;
    });

    const cliquesOrdenados = [...cliques].sort((a, b) => {
      const dateA = a?.timestamp ? new Date(a.timestamp).getTime() : 0;
      const dateB = b?.timestamp ? new Date(b.timestamp).getTime() : 0;
      return dateA - dateB;
    });

    return {
      totalCliques: cliques.length,
      cliquesPorAfiliada,
      ultimoClique: cliquesOrdenados[cliquesOrdenados.length - 1] || null,
      primeiroClique: cliquesOrdenados[0] || null,
    };
  }, [cliques]);

  const deletarClique = useCallback((idMongo) => {
    if (idMongo) dispatch(deletarCliqueGlobal(idMongo));
  }, [dispatch]);

  const limparDados = useCallback(() => {
    dispatch(limparCliquesGlobal());
  }, [dispatch]);

  const exportarDados = useCallback(() => {
    if (!cliques || cliques.length === 0) return;
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

  const exportarCSV = useCallback(() => {
    if (!cliques || cliques.length === 0) {
      window.alert('Não há dados para exportar no momento.');
      return;
    }

    const headers = ['ID do Registro', 'Loja Afiliada', 'ID da Carta', 'ID Utilizador', 'Data ISO', 'Data Legível'];
    
    const rows = cliques.map((clique) => {
      const dataCriacao = clique?.timestamp ? new Date(clique.timestamp) : new Date();
      
      return [
        clique?._id || clique?.id || 'N/A',
        clique?.affiliateStore || 'N/A',
        clique?.cardId || 'N/A',
        clique?.userId || 'N/A',
        clique?.timestamp || 'N/A',
        dataCriacao.toLocaleString('pt-BR'),
      ];
    });

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

  return {
    cliques, 
    registrarClique,
    obterEstatisticas,
    deletarClique,
    limparDados,
    exportarDados,
    exportarCSV,
  };
}