import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { toggleUserRoleAsync, deleteUserAsync, fetchAllUsersAsync, logoutUser } from "../slices/userSlice";
import { fetchCliquesThunk } from "../slices/affiliateSlice";
import { useAffiliateTracking } from "../hooks/userAffiliateTracking";
import { fetchDecksThunk } from "../slices/decksSlice";



export default function Admin() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // ====================================================
  // 1. EXTRAÇÃO DE ESTADOS GLOBAIS E HOOKS (Redux)
  // ====================================================
  const userLogado = useSelector((state) => state.user.currentUser);
  const usuarios = useSelector((state) => state.user.allUsers);
  const todosOsDecks = useSelector((state) => state.decks.decksSalvos);

  const { 
    cliques, 
    obterEstatisticas, 
    deletarClique, 
    limparDados, 
    exportarDados, 
    exportarCSV 
  } = useAffiliateTracking();

  // ====================================================
  // 2. ESTADOS LOCAIS PARA FILTROS E RELATÓRIOS
  // ====================================================
  const [filtroAfiliada, setFiltroAfiliada] = useState('');
  const [filtroUsuario, setFiltroUsuario] = useState('');
  const [mostrarDetalhesCliques, setMostrarDetalhesCliques] = useState(false);
  const [usuarioParaDeletar, setUsuarioParaDeletar] = useState(null);
  const [cliqueParaDeletar, setCliqueParaDeletar] = useState(null);

  // ====================================================
  // 3. PROTEÇÃO DE ROTA ATIVA (useEffect)
  // ====================================================
useEffect(() => {
    if (!userLogado || userLogado.role !== 'admin') {
      navigate('/');
    } else {
      dispatch(fetchAllUsersAsync());
      dispatch(fetchCliquesThunk());
      dispatch(fetchDecksThunk()); 
    }
  }, [userLogado, navigate, dispatch]);

  // Conversor de ID de usuário para Username legível
  const obterNomeUsuario = useCallback((id) => {
    if (!id || id === 'Anônimo') return 'Anônimo';
    const userEncontrado = usuarios.find(u => String(u._id || u.id) === String(id));
    return userEncontrado ? userEncontrado.username : id; 
  }, [usuarios]);

  if (!userLogado || userLogado.role !== 'admin') return null; 

  // ====================================================
  // 4. LÓGICA E ESTATÍSTICAS DERIVADAS
  // ====================================================
  const totalUsuarios = usuarios.length;
  const totalDecks = todosOsDecks ? todosOsDecks.length : 0;
  const totalCartas = todosOsDecks 
    ? todosOsDecks.reduce((acc, deck) => acc + (deck.cartas ? deck.cartas.length : 0), 0)
    : 0;

  const estatisticasAfiliadas = obterEstatisticas();

  const cliquesPorUsuario = {};
  cliques.forEach((clique) => {
    const usuarioId = clique?.userId || 'Anônimo';
    cliquesPorUsuario[usuarioId] = (cliquesPorUsuario[usuarioId] || 0) + 1;
  });

  const cliquesFiltrados = cliques.filter(c => {
    if (filtroAfiliada && c.affiliateStore !== filtroAfiliada) return false;
    if (filtroUsuario && c.userId !== filtroUsuario) return false;
    return true;
  }).sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));

  // ====================================================
  // 5. AÇÕES DE GESTÃO DO PAINEL
  // ====================================================
  const handleMudarPapelUsuario = async (user) => {
    if (user.username === 'admin') {
      window.alert('O administrador principal não pode ter o seu papel alterado.');
      return;
    }
    const userId = user._id || user.id;
    await dispatch(toggleUserRoleAsync(userId));
    dispatch(fetchAllUsersAsync());
  };

const confirmarEliminarUsuario = async () => {
    if (!usuarioParaDeletar) return;
    const userId = usuarioParaDeletar._id || usuarioParaDeletar.id;
    const currentUserId = userLogado.id || userLogado._id;

    const resultAction = await dispatch(deleteUserAsync(userId));
    
    if (deleteUserAsync.fulfilled.match(resultAction)) {
      if (String(userId) === String(currentUserId)) {
        dispatch(logoutUser());
        window.alert("A sua conta foi excluída permanentemente. Sessão encerrada.");
        navigate('/');
      } else {
        dispatch(fetchAllUsersAsync());
        dispatch(fetchCliquesThunk());
        dispatch(fetchDecksThunk());
        setUsuarioParaDeletar(null);
      }
    } else {
      // ISSO AQUI VAI MOSTRAR POR QUE ESTÁ FALHANDO
      window.alert("O servidor recusou a exclusão. Erro: " + (resultAction.payload || resultAction.error.message));
    }
  };

  // Abre o modal guardando o ID
  function handleDeletarClique(cliqueId) {
    setCliqueParaDeletar(cliqueId);
  }

  // Executa a exclusão quando o usuário confirma no modal
  function confirmarDeletarClique() {
    if (cliqueParaDeletar) {
      deletarClique(cliqueParaDeletar);
      setCliqueParaDeletar(null);
    }
  }

  // Fecha o modal se o usuário cancelar
  function cancelarDeletarClique() {
    setCliqueParaDeletar(null);
  }

  function handleLimparTodosOsCliques() {
    if (window.confirm('⚠️ ATENÇÃO: Vai apagar TODOS os registos de cliques do banco de dados. Deseja continuar?')) {
      limparDados();
    }
  }

  return (
    <div className="container mt-5 mb-5 flex-grow-1">
      <h2 className="mb-4 text-white border-bottom border-secondary pb-2 fw-bold">Painel Administrativo</h2>

      {/* CARDS DE ESTATÍSTICAS GERAIS */}
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
              <h2 className="card-title m-0 fw-bold display-4 text-white">{totalCartas}</h2>
            </div>
          </div>
        </div>
      </div>

      {/* MONITORAMENTO DE AFILIADOS */}
      <div className="mb-5 p-4 rounded" style={{backgroundColor: 'rgba(255, 193, 7, 0.05)', border: '2px solid rgba(255, 193, 7, 0.3)'}}>
        <h3 className="border-bottom border-warning pb-2 mb-4 text-warning fw-bold">
          Monitorização de Afiliados
        </h3>

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
                  {Object.keys(cliquesPorUsuario).length}
                </h4>
              </div>
            </div>
          </div>
        </div>

        {Object.keys(estatisticasAfiliadas.cliquesPorAfiliada).length > 0 && (
          <div className="row g-3 mb-4">
            <div className="col-md-6">
              <div className="card text-white bg-dark">
                <div className="card-header bg-dark border-secondary fw-bold">Cliques por Parceiro</div>
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
                <div className="card-header bg-dark border-secondary fw-bold">Top 5 Utilizadores (Cliques)</div>
                <div className="card-body">
                  {Object.entries(cliquesPorUsuario)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([usuarioId, total]) => (
                      <div key={usuarioId} className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom border-secondary">
                        <span className="text-light text-truncate fw-bold" style={{maxWidth: '80%'}} title={usuarioId}>
                          {obterNomeUsuario(usuarioId)}
                        </span>
                        <span className="badge bg-info text-dark">{total}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

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
              {Object.keys(cliquesPorUsuario)
                .sort((a, b) => cliquesPorUsuario[b] - cliquesPorUsuario[a])
                .map((usuarioId) => (
                  <option key={usuarioId} value={usuarioId}>
                    {obterNomeUsuario(usuarioId)}
                  </option>
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

        {mostrarDetalhesCliques && (
          <div className="table-responsive">
            <table className="table table-dark table-striped table-sm align-middle">
              <thead className="table-secondary text-dark">
                <tr className="text-center">
                  <th style={{width: '20%'}}>ID Registro (Mongo)</th>
                  <th style={{width: '20%'}}>Parceiro</th>
                  <th style={{width: '15%'}}>ID da Carta</th>
                  <th style={{width: '20%'}}>Utilizador</th>
                  <th style={{width: '20%'}}>Horário (Timestamp)</th>
                  <th style={{width: '5%'}}>Ação</th>
                </tr>
              </thead>
              <tbody>
                {cliquesFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center text-muted py-3">Sem resultados para o filtro selecionado.</td>
                  </tr>
                ) : (
                  cliquesFiltrados.map((clique) => {
                    const currentId = clique._id || clique.id;
                    const dataLegivel = clique.timestamp ? new Date(clique.timestamp).toLocaleString('pt-BR') : 'N/A';
                    
                    return (
                      <tr key={currentId} className="text-center">
                        <td className="text-light" style={{fontSize: '0.85rem'}}>{currentId}</td>
                        <td className="fw-bold text-warning">{clique.affiliateStore || 'Desconhecida'}</td>
                        <td className="text-light">{clique.cardId || 'N/A'}</td>
                        <td className="text-info fw-bold text-truncate" style={{maxWidth: '120px'}} title={clique.userId}>
                          {obterNomeUsuario(clique.userId)}
                        </td>
                        <td style={{fontSize: '0.85rem', color: '#8b949e'}}>{dataLegivel}</td>
                        <td>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDeletarClique(currentId)}
                            title="Remover registo"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {estatisticasAfiliadas.ultimoClique && (
          <div className="alert alert-dark border-secondary small mt-3 mb-0">
            <strong>📌 Última interação detetada:</strong> Loja: {estatisticasAfiliadas.ultimoClique.affiliateStore} - ID da Carta: {estatisticasAfiliadas.ultimoClique.cardId} ({estatisticasAfiliadas.ultimoClique.timestamp ? new Date(estatisticasAfiliadas.ultimoClique.timestamp).toLocaleString('pt-BR') : 'N/A'})
          </div>
        )}
      </div>

      {/* GESTÃO DE UTILIZADORES */}
      <h3 className="border-bottom border-secondary pb-2 mb-3 text-white">Gerir Utilizadores</h3>
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
                        {user.role ? user.role.toUpperCase() : 'USER'}
                      </span>
                    </td>
                    
                    <td className="text-center">
                      <div className="d-flex justify-content-center gap-2">
                        <button 
                          className={`btn btn-sm fw-bold ${user.role === 'admin' ? 'btn-outline-secondary text-light' : 'btn-warning text-dark'}`}
                          onClick={() => handleMudarPapelUsuario(user)}
                          disabled={isSuperAdmin}
                          title={user.role === 'admin' ? 'Rebaixar para Utilizador' : 'Promover a Admin'}
                        >
                          {user.role === 'admin' ? '↓ Rebaixar' : '↑ Promover'}
                        </button>
                        
                        <button 
                          className="btn btn-sm btn-danger fw-bold"
                          onClick={() => setUsuarioParaDeletar(user)}
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

      {/* MODAL CUSTOMIZADO: DELEÇÃO DE CONTA */}
      {usuarioParaDeletar && (
        <>
          <div className="modal fade show d-block" tabIndex="-1" onClick={() => setUsuarioParaDeletar(null)} style={{zIndex: 1080}}>
            <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
              <div className="modal-content text-center p-4 shadow-lg" style={{backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '15px'}}>
                <div className="mb-3">
                  <span style={{ fontSize: '3.5rem' }}>🗑️</span>
                </div>
                <h4 className="text-white fw-bold mb-3">Excluir Conta?</h4>
                <p style={{ color: '#8b949e', fontSize: '1.05rem', lineHeight: '1.5' }}>
                  Tem a certeza que deseja excluir permanentemente o utilizador <strong className="text-white">"{usuarioParaDeletar.username}"</strong>? <br/>
                  <span className="text-danger">Esta ação purgará a conta e todos os dados associados de forma irreversível.</span>
                </p>
                <div className="d-flex justify-content-center gap-3 mt-4">
                  <button className="btn btn-outline-secondary fw-bold px-4" onClick={() => setUsuarioParaDeletar(null)}>
                    Cancelar
                  </button>
                  <button className="btn btn-danger fw-bold px-4 shadow" onClick={confirmarEliminarUsuario}>
                    Sim, Excluir
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" style={{zIndex: 1075}}></div>
        </>
      )}

      {/* MODAL CUSTOMIZADO: DELEÇÃO DE CLIQUE ESPECÍFICO */}
      {cliqueParaDeletar && (
        <>
          <div className="modal fade show d-block" tabIndex="-1" onClick={cancelarDeletarClique} style={{zIndex: 1080}}>
            <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
              <div className="modal-content text-center p-4 shadow-lg" style={{backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '15px'}}>
                <div className="mb-3">
                  <span style={{ fontSize: '3.5rem' }}>🗑️</span>
                </div>
                <h4 className="text-white fw-bold mb-3">Excluir Registo?</h4>
                <p style={{ color: '#8b949e', fontSize: '1.05rem', lineHeight: '1.5' }}>
                  Tem a certeza que deseja excluir este registo de interação? <br/>
                  <span className="text-danger">Esta ação apagará o dado de forma irreversível.</span>
                </p>
                <div className="d-flex justify-content-center gap-3 mt-4">
                  <button className="btn btn-outline-secondary fw-bold px-4" onClick={cancelarDeletarClique}>
                    Cancelar
                  </button>
                  <button className="btn btn-danger fw-bold px-4 shadow" onClick={confirmarDeletarClique}>
                    Sim, Excluir
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" style={{zIndex: 1075}}></div>
        </>
      )}

    </div>
  );
}