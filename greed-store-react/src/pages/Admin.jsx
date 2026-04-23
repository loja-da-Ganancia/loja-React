import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { toggleUserRole, deleteUser } from "../slices/userSlice";

// Importação do Hook de rastreamento adaptado ao Redux
import { useAffiliateTracking } from "../hooks/userAffiliateTracking";

export default function Admin() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // ====================================================
  // 1. EXTRAÇÃO DE ESTADOS GLOBAIS E HOOKS (Redux)
  // ====================================================
  const userLogado = useSelector((state) => state.user.currentUser);
  const usuarios = useSelector((state) => state.user.allUsers);
  const todosOsDecks = useSelector((state) => state.decks.decksSalvos);

  // Inicializa a API de rastreamento de parceiros
  const { 
    cliques, 
    obterEstatisticas, 
    deletarClique, 
    limparDados, 
    exportarDados, 
    exportarCSV 
  } = useAffiliateTracking();

  // ====================================================
  // 2. ESTADOS LOCAIS PARA FILTROS DO DASHBOARD
  // ====================================================
  const [filtroAfiliada, setFiltroAfiliada] = useState('');
  const [filtroUsuario, setFiltroUsuario] = useState('');
  const [mostrarDetalhesCliques, setMostrarDetalhesCliques] = useState(false);

  // ====================================================
  // 3. PROTEÇÃO DE ROTA (Acesso estrito a Admins)
  // ====================================================
  useEffect(() => {
    if (!userLogado || userLogado.role !== 'admin') {
      window.alert('Acesso negado. Esta área é restrita a administradores.');
      navigate('/');
    }
  }, [userLogado, navigate]);

  if (!userLogado || userLogado.role !== 'admin') return null; 

  // ====================================================
  // 4. LÓGICA E ESTATÍSTICAS DERIVADAS
  // ====================================================
  const totalUsuarios = usuarios.length;
  const totalDecks = todosOsDecks ? todosOsDecks.length : 0;
  const totalCartas = todosOsDecks 
    ? todosOsDecks.reduce((acc, deck) => acc + (deck.cartas ? deck.cartas.length : 0), 0)
    : 0;

  // Estatísticas e Filtros da nova seção de afiliados
  const estatisticasAfiliadas = obterEstatisticas();

  const cliquesFiltrados = cliques.filter(c => {
    if (filtroAfiliada && c.afiliada !== filtroAfiliada) return false;
    if (filtroUsuario && c.usuario !== filtroUsuario) return false;
    return true;
  }).sort((a, b) => new Date(b.data) - new Date(a.data));

  // ====================================================
  // 5. AÇÕES DE GESTÃO (Despachadas para a Store)
  // ====================================================
  function alternarPapelUsuario(username) {
    if (username === 'admin') {
      window.alert('O administrador principal não pode ter o seu papel alterado.');
      return;
    }
    dispatch(toggleUserRole(username));
  }

  function deletarUsuario(username) {
    if (username === 'admin') {
      window.alert('O administrador principal não pode ser excluído.');
      return;
    }
    if (window.confirm(`Tem a certeza que deseja excluir o utilizador '${username}'?`)) {
      dispatch(deleteUser(username));
    }
  }

  function handleDeletarClique(cliqueId) {
    if (window.confirm('Tem a certeza que deseja apagar este registo de clique?')) {
      deletarClique(cliqueId);
    }
  }

  function handleLimparTodosOsCliques() {
    if (window.confirm('⚠️ ATENÇÃO: Vai apagar TODOS os registos de cliques. Deseja continuar?')) {
      limparDados();
    }
  }

  // ====================================================
  // 6. RENDERIZAÇÃO DO PAINEL ADMINISTRATIVO
  // ====================================================
  return (
    <div className="container mt-5 mb-5 flex-grow-1">
      <h2 className="mb-4 text-white border-bottom border-secondary pb-2 fw-bold">⚙️ Painel Administrativo</h2>

      {/* CARDS DE ESTATÍSTICAS GERAIS (Utilizadores e Decks) */}
      <div className="row g-4 mb-5">
        <div className="col-md-4">
          <div className="card text-white bg-primary h-100 admin-stat-card shadow-sm border-0">
            <div className="card-header fw-bold border-secondary text-center" style={{backgroundColor: 'rgba(0,0,0,0.2)'}}>
              Total de Utilizadores
            </div>
            <div className="card-body d-flex align-items-center justify-content-center">
              <h2 className="card-title m-0 fw-bold display-4">{totalUsuarios}</h2>
            </div>
          </div>
        </div>
        
        <div className="col-md-4">
          <div className="card text-white bg-success h-100 admin-stat-card shadow-sm border-0">
            <div className="card-header fw-bold border-secondary text-center" style={{backgroundColor: 'rgba(0,0,0,0.2)'}}>
              Total de Decks Criados
            </div>
            <div className="card-body d-flex align-items-center justify-content-center">
              <h2 className="card-title m-0 fw-bold display-4">{totalDecks}</h2>
            </div>
          </div>
        </div>
        
        <div className="col-md-4">
          <div className="card text-white bg-info h-100 admin-stat-card shadow-sm border-0">
            <div className="card-header fw-bold border-secondary text-center" style={{backgroundColor: 'rgba(0,0,0,0.1)'}}>
              Total de Cartas nos Decks
            </div>
            <div className="card-body d-flex align-items-center justify-content-center">
              <h2 className="card-title m-0 fw-bold display-4 text-dark">{totalCartas}</h2>
            </div>
          </div>
        </div>
      </div>

      {/* SEÇÃO: MONITORAMENTO DE CLIQUES EM AFILIADAS (Dashboard Analítico) */}
      <div className="mb-5 p-4 rounded" style={{backgroundColor: 'rgba(255, 193, 7, 0.05)', border: '2px solid rgba(255, 193, 7, 0.3)'}}>
        <h3 className="border-bottom border-warning pb-2 mb-4 text-warning fw-bold">
          📊 Monitorização de Afiliados
        </h3>

        {/* ESTATÍSTICAS RÁPIDAS DE AFILIADOS */}
        <div className="row g-3 mb-4">
          <div className="col-md-4">
            <div className="card text-white bg-dark h-100" style={{borderLeft: '4px solid #ffc107'}}>
              <div className="card-body text-center">
                <p className="card-text mb-2" style={{fontSize: '0.9rem', color: '#ffc107'}}>Total de Cliques</p>
                <h4 className="m-0 fw-bold" style={{fontSize: '2rem'}}>{estatisticasAfiliadas.totalCliques}</h4>
              </div>
            </div>
          </div>
          
          <div className="col-md-4">
            <div className="card text-white bg-dark h-100" style={{borderLeft: '4px solid #17a2b8'}}>
              <div className="card-body text-center">
                <p className="card-text mb-2" style={{fontSize: '0.9rem', color: '#17a2b8'}}>Afiliadas Únicas</p>
                <h4 className="m-0 fw-bold" style={{fontSize: '2rem'}}>
                  {Object.keys(estatisticasAfiliadas.cliquesPorAfiliada).length}
                </h4>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card text-white bg-dark h-100" style={{borderLeft: '4px solid #28a745'}}>
              <div className="card-body text-center">
                <p className="card-text mb-2" style={{fontSize: '0.9rem', color: '#28a745'}}>Utilizadores Ativos</p>
                <h4 className="m-0 fw-bold" style={{fontSize: '2rem'}}>
                  {Object.keys(estatisticasAfiliadas.cliquesPorUsuario).length}
                </h4>
              </div>
            </div>
          </div>
        </div>

        {/* DISTRIBUIÇÃO GRÁFICA */}
        {Object.keys(estatisticasAfiliadas.cliquesPorAfiliada).length > 0 && (
          <div className="row g-3 mb-4">
            <div className="col-md-6">
              <div className="card text-white bg-dark">
                <div className="card-header bg-dark border-secondary fw-bold">📈 Cliques por Parceiro</div>
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

            <div className="col-md-6">
              <div className="card text-white bg-dark">
                <div className="card-header bg-dark border-secondary fw-bold">👥 Top 5 Utilizadores</div>
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

        {/* FILTROS DO RELATÓRIO */}
        <div className="row g-3 mb-4">
          <div className="col-md-4">
            <label className="form-label text-light fw-bold">Filtrar por Parceiro:</label>
            <select
              className="form-select bg-dark text-light border-secondary"
              value={filtroAfiliada}
              onChange={(e) => setFiltroAfiliada(e.target.value)}
            >
              <option value="">Todas as Lojas</option>
              {Object.keys(estatisticasAfiliadas.cliquesPorAfiliada).map((afiliada) => (
                <option key={afiliada} value={afiliada}>{afiliada}</option>
              ))}
            </select>
          </div>

          <div className="col-md-4">
            <label className="form-label text-light fw-bold">Filtrar por Utilizador:</label>
            <select
              className="form-select bg-dark text-light border-secondary"
              value={filtroUsuario}
              onChange={(e) => setFiltroUsuario(e.target.value)}
            >
              <option value="">Todos os Utilizadores</option>
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
              onClick={() => { setFiltroAfiliada(''); setFiltroUsuario(''); }}
            >
              🔄 Limpar Filtros
            </button>
          </div>
        </div>

        {/* COMANDOS DE EXPORTAÇÃO E CONTROLO */}
        <div className="row g-2 mb-4">
          <div className="col-auto">
            <button className="btn btn-sm btn-success fw-bold" onClick={exportarCSV} disabled={estatisticasAfiliadas.totalCliques === 0}>
              📥 Exportar CSV
            </button>
          </div>
          <div className="col-auto">
            <button className="btn btn-sm btn-info fw-bold text-dark" onClick={exportarDados} disabled={estatisticasAfiliadas.totalCliques === 0}>
              📥 Exportar JSON
            </button>
          </div>
          <div className="col-auto">
            <button className="btn btn-sm btn-danger fw-bold" onClick={() => setMostrarDetalhesCliques(!mostrarDetalhesCliques)}>
              {mostrarDetalhesCliques ? '🔽 Ocultar' : '🔼 Ver'} Detalhes ({cliquesFiltrados.length})
            </button>
          </div>
          <div className="col-auto">
            <button className="btn btn-sm btn-outline-danger fw-bold" onClick={handleLimparTodosOsCliques} disabled={estatisticasAfiliadas.totalCliques === 0}>
              🗑️ Purgar Registos
            </button>
          </div>
        </div>

        {/* TABELA ANALÍTICA DETALHADA */}
        {mostrarDetalhesCliques && (
          <div className="table-responsive">
            <table className="table table-dark table-striped table-sm align-middle">
              <thead className="table-secondary text-dark">
                <tr className="text-center">
                  <th style={{width: '10%'}}>ID</th>
                  <th style={{width: '20%'}}>Parceiro</th>
                  <th style={{width: '25%'}}>Carta Alvo</th>
                  <th style={{width: '20%'}}>Utilizador</th>
                  <th style={{width: '20%'}}>Timestamp</th>
                  <th style={{width: '5%'}}>Ação</th>
                </tr>
              </thead>
              <tbody>
                {cliquesFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center text-muted py-3">Sem resultados para o filtro selecionado.</td>
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
                          onClick={() => handleDeletarClique(clique.id)}
                          title="Remover registo"
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

        {/* REGISTO MAIS RECENTE */}
        {estatisticasAfiliadas.ultimoClique && (
          <div className="alert alert-dark border-secondary small mt-3 mb-0">
            <strong>📌 Última interação detetada:</strong> {estatisticasAfiliadas.ultimoClique.afiliada} - {estatisticasAfiliadas.ultimoClique.nomeCarta} ({estatisticasAfiliadas.ultimoClique.dataLegivel})
          </div>
        )}
      </div>

      {/* SEÇÃO: GESTÃO DE UTILIZADORES */}
      <h3 className="border-bottom border-secondary pb-2 mb-3 text-white">📋 Gerir Utilizadores</h3>
      <div className="table-responsive shadow-sm rounded-3">
        <table className="table table-dark table-striped table-bordered align-middle table-hover m-0">
          <thead className="table-active text-center">
            <tr>
              <th scope="col" style={{width: '40%'}}>Utilizador</th>
              <th scope="col" style={{width: '30%'}}>Nível de Acesso</th>
              <th scope="col" style={{width: '30%'}}>Ações Administrativas</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.length === 0 ? (
              <tr>
                <td colSpan="3" className="text-center text-muted py-4">Sem utilizadores registados.</td>
              </tr>
            ) : (
              usuarios.map((user) => {
                const isSuperAdmin = user.username === 'admin';
                
                return (
                  <tr key={user.username}>
                    <td className="fw-bold px-3 text-light">{user.username}</td>
                    
                    <td className="text-center">
                      <span className={`badge ${user.role === 'admin' ? 'bg-warning text-dark' : 'bg-secondary'}`} style={{fontSize: '0.9rem'}}>
                        {user.role.toUpperCase()}
                      </span>
                    </td>
                    
                    <td className="text-center">
                      <div className="d-flex justify-content-center gap-2">
                        <button 
                          className={`btn btn-sm fw-bold ${user.role === 'admin' ? 'btn-outline-secondary text-light' : 'btn-warning text-dark'}`}
                          onClick={() => alternarPapelUsuario(user.username)}
                          disabled={isSuperAdmin}
                          title={user.role === 'admin' ? 'Rebaixar para Utilizador' : 'Promover a Admin'}
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
      
      <div className="text-center mt-3 mb-5">
        <p style={{fontSize: '0.85rem', color: '#8b949e'}}>
          * O utilizador <strong>"admin"</strong> base está protegido contra rebaixamentos ou exclusões por razões arquiteturais de segurança.
        </p>
      </div>
    </div>
  );
}