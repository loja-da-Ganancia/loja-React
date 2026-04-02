import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

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

  // ==========================================================
  // LÓGICA DE DADOS E ESTATÍSTICAS
  // ==========================================================
  // Esta função agora só é chamada após uma ação do admin (ex: deletar usuário)
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

  // ==========================================================
  // AÇÕES DO ADMINISTRADOR
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

  // ==========================================================
  // RENDERIZAÇÃO
  // ==========================================================
  return (
    <div className="container mt-5 mb-5 flex-grow-1">
      <h2 className="mb-4 text-white border-bottom border-secondary pb-2 fw-bold">⚙️ Painel Administrativo</h2>

      {/* CARDS DE ESTATÍSTICAS */}
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