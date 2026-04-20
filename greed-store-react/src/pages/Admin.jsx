import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

// IMPORTAÇÕES DO REDUX
import { useSelector, useDispatch } from "react-redux";
import { toggleUserRole, deleteUser } from "../slices/userSlice";

export default function Admin() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // ====================================================
  // 1. EXTRAÇÃO DE ESTADOS GLOBAIS (Redux)
  // ====================================================
  const userLogado = useSelector((state) => state.user.currentUser);
  const usuarios = useSelector((state) => state.user.allUsers);
  
  // CORREÇÃO: Lê corretamente a variável 'decksSalvos' da gaveta 'decks' do Redux.
  const todosOsDecks = useSelector((state) => state.decks.decksSalvos);

  // ====================================================
  // 2. PROTEÇÃO DE ROTA (Apenas Admin)
  // ====================================================
  useEffect(() => {
    // Se não houver utilizador logado ou se o papel não for admin, expulsa para a home
    if (!userLogado || userLogado.role !== 'admin') {
      window.alert('Acesso negado. Esta área é restrita a administradores.');
      navigate('/');
    }
  }, [userLogado, navigate]);

  // Evita a renderização de componentes "fantasmas" enquanto o navigate atua
  if (!userLogado || userLogado.role !== 'admin') {
    return null; 
  }

  // ====================================================
  // 3. CÁLCULO DE ESTATÍSTICAS
  // ====================================================
  const totalUsuarios = usuarios.length;
  const totalDecks = todosOsDecks ? todosOsDecks.length : 0;
  
  // Percorre todos os decks e soma a quantidade de cartas de cada um
  const totalCartas = todosOsDecks 
    ? todosOsDecks.reduce((acumulador, deck) => acumulador + (deck.cartas ? deck.cartas.length : 0), 0)
    : 0;

  // ====================================================
  // 4. AÇÕES DE GESTÃO (Despachadas para o Redux)
  // ====================================================
  function alternarPapelUsuario(username) {
    if (username === 'admin') {
      window.alert('O administrador principal não pode ter o seu papel alterado.');
      return;
    }
    // Dispara a ordem para a central do Redux promover/rebaixar o utilizador
    dispatch(toggleUserRole(username));
  }

  function deletarUsuario(username) {
    if (username === 'admin') {
      window.alert('O administrador principal não pode ser excluído por motivos de segurança.');
      return;
    }
    if (window.confirm(`Tem a certeza que deseja excluir permanentemente o utilizador '${username}'?`)) {
      // Dispara a ordem de exclusão
      dispatch(deleteUser(username));
    }
  }

  // ====================================================
  // 5. RENDERIZAÇÃO DA INTERFACE
  // ====================================================
  return (
    <div className="container mt-5 mb-5 flex-grow-1">
      <h2 className="mb-4 text-white border-bottom border-secondary pb-2 fw-bold">⚙️ Painel Administrativo</h2>

      {/* CARDS DE ESTATÍSTICAS */}
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

      <h3 className="border-bottom border-secondary pb-2 mb-3 text-white">📋 Gerir Utilizadores</h3>
      
      {/* TABELA DE GESTÃO */}
      <div className="table-responsive shadow-sm rounded-3">
        <table className="table table-dark table-striped table-bordered align-middle table-hover m-0">
          <thead className="table-active text-center">
            <tr>
              <th scope="col" style={{width: '40%'}}>Utilizador</th>
              <th scope="col" style={{width: '30%'}}>Papel (Role)</th>
              <th scope="col" style={{width: '30%'}}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.length === 0 ? (
              <tr>
                <td colSpan="3" className="text-center text-muted py-4">Nenhum utilizador encontrado.</td>
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
          * O utilizador "admin" base não pode ser rebaixado ou excluído por motivos de segurança do sistema.
        </p>
      </div>
    </div>
  );
}