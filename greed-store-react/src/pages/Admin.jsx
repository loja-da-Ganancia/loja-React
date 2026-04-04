import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAffiliateTracking } from "../hooks/useAffiliateTracking";

// ==========================================================
// CONSTANTES E HELPERS DE BANCO DE DADOS
// ==========================================================
const USERS_KEY = 'greedstore_users';
const DECKS_KEY = 'greedstore_decks';
const SESSION_KEY = 'greedstore_session';

function getCurrentUser() {
  const session = sessionStorage.getItem(SESSION_KEY);
  return session ? JSON.parse(session) : null;
}

export default function Admin() {
  const navigate = useNavigate();
  const affiliate = useAffiliateTracking();

  // ==========================================================
  // ESTADOS DO PAINEL (Lazy Initialization)
  // ==========================================================
  const [usuarios, setUsuarios] = useState(() => {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
  });

  const [estatisticas, setEstatisticas] = useState(() => {
    const usersDB = JSON.parse(localStorage.getItem(USERS_KEY)) || [];
    const decksDB = JSON.parse(localStorage.getItem(DECKS_KEY)) || [];
    
    // Calcula o total de cartas somando as cartas de todos os decks
    const totalCartas = decksDB.reduce((acumulador, deck) => {
      return acumulador + (deck.cartas ? deck.cartas.length : 0);
    }, 0);

    return {
      totalUsuarios: usersDB.length,
      totalDecks: decksDB.length,
      totalCartas: totalCartas
    };
  });

  // ========== ESTADOS PARA MONITORAMENTO DE AFILIADAS ==========
  const [cliqueAtualizacoes, setCliqueAtualizacoes] = useState(0);
  const [estatisticasAfiliadas, setEstatisticasAfiliadas] = useState(() => {
    return affiliate.obterEstatisticas();
  });

  const [filtroAfiliadaSelecionada, setFiltroAfiliadaSelecionada] = useState('');
  const [filtroUsuarioSelecionado, setFiltroUsuarioSelecionado] = useState('');
  const [cliquesFiltrados, setCliquesFiltrados] = useState([]);
  const [mostrarDetalhesCliques, setMostrarDetalhesCliques] = useState(false);

  // ==========================================================
  // LÓGICA DE DADOS E ESTATÍSTICAS
  // ==========================================================
  function carregarDados() {
    const usersDB = JSON.parse(localStorage.getItem(USERS_KEY)) || [];
    const decksDB = JSON.parse(localStorage.getItem(DECKS_KEY)) || [];

    const totalCartas = decksDB.reduce((acumulador, deck) => {
      return acumulador + (deck.cartas ? deck.cartas.length : 0);
    }, 0);

    setUsuarios(usersDB);
    setEstatisticas({
      totalUsuarios: usersDB.length,
      totalDecks: decksDB.length,
      totalCartas: totalCartas
    });
  }

  // ========== FUNÇÕES PARA MONITORAMENTO DE AFILIADAS ==========
  
  /**
   * Atualiza as estatísticas de cliques em afiliadas
   */
  function atualizarEstatisticasAfiliadas() {
    const novasEstatisticas = affiliate.obterEstatisticas();
    setEstatisticasAfiliadas(novasEstatisticas);
    setCliqueAtualizacoes(prev => prev + 1);
  }

  /**
   * Aplica filtros aos cliques
   */
  function aplicarFiltros() {
    let cliques = affiliate.obterTodosOsCliques();

    if (filtroAfiliadaSelecionada) {
      cliques = cliques.filter(c => c.afiliada === filtroAfiliadaSelecionada);
    }

    if (filtroUsuarioSelecionado) {
      cliques = cliques.filter(c => c.usuario === filtroUsuarioSelecionado);
    }

    // Ordena por data descendente (mais recentes primeiro)
    cliques.sort((a, b) => new Date(b.data) - new Date(a.data));
    setCliquesFiltrados(cliques);
  }

  /**
   * Reseta os filtros
   */
  function resetarFiltros() {
    setFiltroAfiliadaSelecionada('');
    setFiltroUsuarioSelecionado('');
    setCliquesFiltrados(affiliate.obterTodosOsCliques());
  }

  // ==========================================================
  // INICIALIZAÇÃO E PROTEÇÃO DE ROTA (Apenas Admins)
  // ==========================================================
  useEffect(() => {
    const userLogado = getCurrentUser();
    
    // Se não estiver logado ou não for admin, manda pra longe
    if (!userLogado || userLogado.role !== 'admin') {
      window.alert('Acesso negado. Você não é administrador.');
      navigate('/');
    }
  }, [navigate]);

  // ========== EFEITO PARA ATUALIZAR DADOS DE AFILIADAS ==========
  useEffect(() => {
    atualizarEstatisticasAfiliadas();
    const cliques = affiliate.obterTodosOsCliques();
    setCliquesFiltrados(cliques);
  }, []);

  // ========== EFEITO PARA APLICAR FILTROS ==========
  useEffect(() => {
    aplicarFiltros();
  }, [filtroAfiliadaSelecionada, filtroUsuarioSelecionado]);

  // ==========================================================
  // AÇÕES DO ADMINISTRADOR - USUÁRIOS
  // ==========================================================
  function alternarPapelUsuario(username) {
    let usersDB = JSON.parse(localStorage.getItem(USERS_KEY)) || [];
    const userIndex = usersDB.findIndex((u) => u.username === username);
    
    if (userIndex !== -1) {
      // Se for o admin principal, impede de se rebaixar
      if (username === 'admin') {
        window.alert('O administrador principal não pode ter seu papel alterado.');
        return;
      }

      // Alterna entre 'admin' e 'user'
      const papelAtual = usersDB[userIndex].role;
      usersDB[userIndex].role = papelAtual === 'admin' ? 'user' : 'admin';
      
      localStorage.setItem(USERS_KEY, JSON.stringify(usersDB));
      carregarDados(); // Recarrega para atualizar a tabela na hora
    }
  }

  function deletarUsuario(username) {
    if (username === 'admin') {
      window.alert('O administrador principal não pode ser excluído.');
      return;
    }

    if (window.confirm(`Tem certeza que deseja excluir o usuário '${username}'? Todos os dados dele serão mantidos, mas a conta sumirá.`)) {
      let usersDB = JSON.parse(localStorage.getItem(USERS_KEY)) || [];
      
      // Filtra removendo o usuário
      usersDB = usersDB.filter((u) => u.username !== username);
      
      localStorage.setItem(USERS_KEY, JSON.stringify(usersDB));
      carregarDados();
    }
  }

  // ========== AÇÕES DO ADMINISTRADOR - AFILIADAS ==========
  
  function deletarClique(cliqueId) {
    if (window.confirm('Tem certeza que deseja deletar este registro de clique?')) {
      let cliques = affiliate.obterTodosOsCliques();
      cliques = cliques.filter(c => c.id !== cliqueId);
      localStorage.setItem('greedstore_affiliate_clicks', JSON.stringify(cliques));
      atualizarEstatisticasAfiliadas();
    }
  }

  function limparTodosOsCliques() {
    if (window.confirm('⚠️ ATENÇÃO: Você está prestes a DELETAR TODOS os registros de cliques em afiliadas.\nEsta ação é IRREVERSÍVEL. Deseja continuar?')) {
      if (window.confirm('Tem ABSOLUTA certeza? Digite "SIM" para confirmar... (apenas clique OK para continuar)')) {
        affiliate.limparDados();
        atualizarEstatisticasAfiliadas();
      }
    }
  }

  // ==========================================================
  // RENDERIZAÇÃO
  // ==========================================================
  return (
    <div className="container mt-5 mb-5 flex-grow-1">
      <h2 className="mb-4 text-white border-bottom border-secondary pb-2 fw-bold">⚙️ Painel Administrativo</h2>

      {/* CARDS DE ESTATÍSTICAS - USUÁRIOS E DECKS */}
      <div className="row g-4 mb-5">
        <div className="col-md-4">
          <div className="card text-white bg-primary h-100 admin-stat-card">
            <div className="card-header fw-bold border-secondary text-center" style={{backgroundColor: 'rgba(0,0,0,0.2)'}}>
              Total de Usuários
            </div>
            <div className="card-body d-flex align-items-center justify-content-center">
              <h2 className="card-title m-0 fw-bold display-4">{estatisticas.totalUsuarios}</h2>
            </div>
          </div>
        </div>
        
        <div className="col-md-4">
          <div className="card text-white bg-success h-100 admin-stat-card">
            <div className="card-header fw-bold border-secondary text-center" style={{backgroundColor: 'rgba(0,0,0,0.2)'}}>
              Total de Decks Criados
            </div>
            <div className="card-body d-flex align-items-center justify-content-center">
              <h2 className="card-title m-0 fw-bold display-4">{estatisticas.totalDecks}</h2>
            </div>
          </div>
        </div>
        
        <div className="col-md-4">
          <div className="card text-white bg-info h-100 admin-stat-card">
            <div className="card-header fw-bold border-secondary text-center" style={{backgroundColor: 'rgba(0,0,0,0.1)'}}>
              Total de Cartas nos Decks
            </div>
            <div className="card-body d-flex align-items-center justify-content-center">
              <h2 className="card-title m-0 fw-bold display-4">{estatisticas.totalCartas}</h2>
            </div>
          </div>
        </div>
      </div>

      {/* SEÇÃO DE MONITORAMENTO DE CLIQUES EM AFILIADAS */}
      <div className="mb-5 p-4 rounded" style={{backgroundColor: 'rgba(255, 193, 7, 0.05)', border: '2px solid rgba(255, 193, 7, 0.3)'}}>
        <h3 className="border-bottom border-warning pb-2 mb-4 text-warning fw-bold">
          📊 Monitoramento de Cliques em Afiliadas
        </h3>

        {/* CARDS DE ESTATÍSTICAS DE CLIQUES */}
        <div className="row g-3 mb-4">
          <div className="col-md-3">
            <div className="card text-white bg-dark h-100" style={{borderLeft: '4px solid #ffc107'}}>
              <div className="card-body text-center">
                <p className="card-text mb-2" style={{fontSize: '0.9rem', color: '#ffc107'}}>Total de Cliques</p>
                <h4 className="m-0 fw-bold" style={{fontSize: '2rem'}}>{estatisticasAfiliadas.totalCliques}</h4>
              </div>
            </div>
          </div>
          
          <div className="col-md-3">
            <div className="card text-white bg-dark h-100" style={{borderLeft: '4px solid #17a2b8'}}>
              <div className="card-body text-center">
                <p className="card-text mb-2" style={{fontSize: '0.9rem', color: '#17a2b8'}}>Afiliadas Únicas</p>
                <h4 className="m-0 fw-bold" style={{fontSize: '2rem'}}>
                  {Object.keys(estatisticasAfiliadas.cliquesPorAfiliada).length}
                </h4>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card text-white bg-dark h-100" style={{borderLeft: '4px solid #28a745'}}>
              <div className="card-body text-center">
                <p className="card-text mb-2" style={{fontSize: '0.9rem', color: '#28a745'}}>Usuários Ativos</p>
                <h4 className="m-0 fw-bold" style={{fontSize: '2rem'}}>
                  {Object.keys(estatisticasAfiliadas.cliquesPorUsuario).length}
                </h4>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card text-white bg-dark h-100" style={{borderLeft: '4px solid #dc3545'}}>
              <div className="card-body text-center">
                <p className="card-text mb-2" style={{fontSize: '0.9rem', color: '#dc3545'}}>Atualizações</p>
                <h4 className="m-0 fw-bold" style={{fontSize: '2rem'}}>{cliqueAtualizacoes}</h4>
              </div>
            </div>
          </div>
        </div>

        {/* GRÁFICO DE CLIQUES POR AFILIADA */}
        {Object.keys(estatisticasAfiliadas.cliquesPorAfiliada).length > 0 && (
          <div className="row g-3 mb-4">
            <div className="col-md-6">
              <div className="card text-white bg-dark">
                <div className="card-header bg-dark border-secondary fw-bold">📈 Cliques por Afiliada</div>
                <div className="card-body">
                  {Object.entries(estatisticasAfiliadas.cliquesPorAfiliada).map(([afiliada, total]) => (
                    <div key={afiliada} className="mb-3">
                      <div className="d-flex justify-content-between mb-1">
                        <span className="fw-bold" style={{fontSize: '0.95rem'}}>{afiliada}</span>
                        <span className="badge bg-warning text-dark">{total}</span>
                      </div>
                      <div className="progress bg-dark" style={{height: '20px'}}>
                        <div 
                          className="progress-bar bg-warning text-dark fw-bold"
                          style={{
                            width: `${(total / estatisticasAfiliadas.totalCliques * 100)}%`,
                            fontSize: '0.85rem'
                          }}
                        >
                          {Math.round(total / estatisticasAfiliadas.totalCliques * 100)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* CLIQUES POR USUÁRIO */}
            <div className="col-md-6">
              <div className="card text-white bg-dark">
                <div className="card-header bg-dark border-secondary fw-bold">👥 Top 5 Usuários</div>
                <div className="card-body">
                  {Object.entries(estatisticasAfiliadas.cliquesPorUsuario)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([usuario, total]) => (
                      <div key={usuario} className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom border-secondary">
                        <span className="text-light">{usuario}</span>
                        <span className="badge bg-info text-dark">{total}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FILTROS E CONTROLES */}
        <div className="row g-3 mb-4">
          <div className="col-md-4">
            <label className="form-label text-light fw-bold">Filtrar por Afiliada:</label>
            <select
              className="form-select bg-dark text-light border-secondary"
              value={filtroAfiliadaSelecionada}
              onChange={(e) => setFiltroAfiliadaSelecionada(e.target.value)}
            >
              <option value="">Todas as Afiliadas</option>
              {Object.keys(estatisticasAfiliadas.cliquesPorAfiliada).map((afiliada) => (
                <option key={afiliada} value={afiliada}>{afiliada}</option>
              ))}
            </select>
          </div>

          <div className="col-md-4">
            <label className="form-label text-light fw-bold">Filtrar por Usuário:</label>
            <select
              className="form-select bg-dark text-light border-secondary"
              value={filtroUsuarioSelecionado}
              onChange={(e) => setFiltroUsuarioSelecionado(e.target.value)}
            >
              <option value="">Todos os Usuários</option>
              {Object.keys(estatisticasAfiliadas.cliquesPorUsuario)
                .sort((a, b) => estatisticasAfiliadas.cliquesPorUsuario[b] - estatisticasAfiliadas.cliquesPorUsuario[a])
                .map((usuario) => (
                  <option key={usuario} value={usuario}>{usuario}</option>
                ))}
            </select>
          </div>

          <div className="col-md-4 d-flex align-items-end gap-2">
            <button
              className="btn btn-outline-warning fw-bold w-100"
              onClick={resetarFiltros}
            >
              🔄 Resetar Filtros
            </button>
          </div>
        </div>

        {/* BOTÕES DE AÇÃO */}
        <div className="row g-2 mb-4">
          <div className="col-auto">
            <button
              className="btn btn-sm btn-success fw-bold"
              onClick={affiliate.exportarCSV}
              disabled={estatisticasAfiliadas.totalCliques === 0}
            >
              📥 Exportar CSV
            </button>
          </div>
          <div className="col-auto">
            <button
              className="btn btn-sm btn-info fw-bold text-dark"
              onClick={affiliate.exportarDados}
              disabled={estatisticasAfiliadas.totalCliques === 0}
            >
              📥 Exportar JSON
            </button>
          </div>
          <div className="col-auto">
            <button
              className="btn btn-sm btn-danger fw-bold"
              onClick={() => setMostrarDetalhesCliques(!mostrarDetalhesCliques)}
            >
              {mostrarDetalhesCliques ? '🔽 Ocultar' : '🔼 Ver'} Detalhes ({cliquesFiltrados.length})
            </button>
          </div>
          <div className="col-auto">
            <button
              className="btn btn-sm btn-outline-danger fw-bold"
              onClick={limparTodosOsCliques}
              disabled={estatisticasAfiliadas.totalCliques === 0}
            >
              🗑️ Limpar Tudo
            </button>
          </div>
        </div>

        {/* TABELA DE DETALHES DE CLIQUES */}
        {mostrarDetalhesCliques && (
          <div className="table-responsive">
            <table className="table table-dark table-striped table-sm align-middle">
              <thead className="table-secondary text-dark">
                <tr className="text-center">
                  <th style={{width: '10%'}}>ID</th>
                  <th style={{width: '20%'}}>Afiliada</th>
                  <th style={{width: '25%'}}>Carta</th>
                  <th style={{width: '20%'}}>Usuário</th>
                  <th style={{width: '20%'}}>Data/Hora</th>
                  <th style={{width: '5%'}}>Ação</th>
                </tr>
              </thead>
              <tbody>
                {cliquesFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center text-muted py-3">Nenhum clique encontrado com os filtros selecionados.</td>
                  </tr>
                ) : (
                  cliquesFiltrados.map((clique) => (
                    <tr key={clique.id} className="text-center">
                      <td className="text-muted" style={{fontSize: '0.85rem'}}>{clique.id}</td>
                      <td className="fw-bold text-warning">{clique.afiliada}</td>
                      <td className="text-light text-truncate" title={clique.nomeCarta}>{clique.nomeCarta}</td>
                      <td className="text-info">{clique.usuario}</td>
                      <td style={{fontSize: '0.85rem', color: '#8b949e'}}>{clique.dataLegivel}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => deletarClique(clique.id)}
                          title="Deletar este registro"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ÚLTIMA ATUALIZAÇÃO */}
        {estatisticasAfiliadas.ultimoClique && (
          <div className="alert alert-dark border-secondary small mt-3 mb-0">
            <strong>📌 Último clique:</strong> {estatisticasAfiliadas.ultimoClique.afiliada} - {estatisticasAfiliadas.ultimoClique.nomeCarta} ({estatisticasAfiliadas.ultimoClique.dataLegivel})
          </div>
        )}
      </div>

      {/* TABELA DE USUÁRIOS */}
      <h3 className="border-bottom border-secondary pb-2 mb-3 text-white">📋 Gerenciar Usuários</h3>
      
      <div className="table-responsive">
        <table className="table table-dark table-striped table-bordered align-middle table-hover">
          <thead className="table-active text-center">
            <tr>
              <th scope="col" style={{width: '40%'}}>Usuário</th>
              <th scope="col" style={{width: '30%'}}>Papel (Role)</th>
              <th scope="col" style={{width: '30%'}}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.length === 0 ? (
              <tr>
                <td colSpan="3" className="text-center text-muted py-4">Nenhum usuário encontrado.</td>
              </tr>
            ) : (
              usuarios.map((user) => {
                const isSuperAdmin = user.username === 'admin';
                
                return (
                  <tr key={user.username}>
                    <td className="fw-bold px-3">{user.username}</td>
                    
                    <td className="text-center">
                      <span className={`badge ${user.role === 'admin' ? 'bg-warning text-dark' : 'bg-secondary'}`} style={{fontSize: '0.9rem'}}>
                        {user.role.toUpperCase()}
                      </span>
                    </td>
                    
                    <td className="text-center">
                      <div className="d-flex justify-content-center gap-2">
                        <button 
                          className={`btn btn-sm fw-bold ${user.role === 'admin' ? 'btn-outline-secondary' : 'btn-warning text-dark'}`}
                          onClick={() => alternarPapelUsuario(user.username)}
                          disabled={isSuperAdmin}
                          title={user.role === 'admin' ? 'Rebaixar para Usuário' : 'Promover a Admin'}
                        >
                          {user.role === 'admin' ? '↓ Rebaixar' : '↑ Promover'}
                        </button>
                        
                        <button 
                          className="btn btn-sm btn-danger fw-bold"
                          onClick={() => deletarUsuario(user.username)}
                          disabled={isSuperAdmin}
                        >
                          🗑️ Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      
      <div className="text-center mt-3">
        <p style={{fontSize: '0.85rem', color: '#8b949e'}}>
          * O usuário "admin" base não pode ser rebaixado ou excluído por motivos de segurança do sistema.
        </p>
      </div>
    </div>
  );
}