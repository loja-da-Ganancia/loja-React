import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

// IMPORTAÇÕES DO REDUX
import { useSelector, useDispatch } from "react-redux";
import { resetUserPassword } from "../slices/userSlice";

export default function EsqueciSenhaPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Puxa a lista inteira de usuários do Redux para verificação
  const usuarios = useSelector((state) => state.user.allUsers);

  // Estados de controle da interface
  const [etapa, setEtapa] = useState(1); // 1: Buscar usuário | 2: Digitar nova senha
  const [username, setUsername] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mensagem, setMensagem] = useState(null);

  // ETAPA 1: Verifica se a conta existe no sistema
  function buscarUsuario(e) {
    e.preventDefault();
    setMensagem(null);

    // Ignora maiúsculas e minúsculas na busca
    const existe = usuarios.find((u) => u.username.toLowerCase() === username.toLowerCase());
    if (existe) {
      // Se achou, guarda o nome exato como está no banco e avança a tela
      setUsername(existe.username); 
      setEtapa(2); 
    } else {
      setMensagem({ texto: 'Usuário não encontrado no sistema.', tipo: 'danger' });
    }
  }

  // ETAPA 2: Valida as senhas e envia para o Redux salvar
  function salvarNovaSenha(e) {
    e.preventDefault();
    setMensagem(null);

    if (novaSenha !== confirmarSenha) {
      setMensagem({ texto: 'As senhas não coincidem.', tipo: 'danger' });
      return;
    }

    if (novaSenha.length < 3) {
      setMensagem({ texto: 'A senha deve ter pelo menos 3 caracteres.', tipo: 'danger' });
      return;
    }

    // Dispara a ordem para o Redux alterar a senha
    dispatch(resetUserPassword({ username: username, newPassword: novaSenha }));
    
    setMensagem({ texto: 'Senha alterada com sucesso! Redirecionando...', tipo: 'success' });
    
    // Devolve o usuário para a tela de login
    setTimeout(() => {
      navigate('/contas');
    }, 1500);
  }

  return (
    <div className="container flex-grow-1 d-flex align-items-center justify-content-center mt-5 mb-5">
      <div className="form-container w-100" style={{ maxWidth: '400px', backgroundColor: '#161b22', padding: '2rem', borderRadius: '8px', border: '1px solid #30363d' }}>
        
        <h3 className="text-white text-center mb-4 border-bottom border-secondary pb-2">
          Recuperar Senha
        </h3>

        {mensagem && (
          <div className={`alert alert-${mensagem.tipo} text-center fw-bold p-2`} role="alert">
            {mensagem.texto}
          </div>
        )}

        {/* TELA 1: BUSCAR O NOME */}
        {etapa === 1 && (
          <form onSubmit={buscarUsuario}>
            <p className="text-light" style={{ fontSize: '0.9rem' }}>
              Digite o seu nome de usuário para localizarmos a sua conta.
            </p>
            <div className="mb-4">
              <label className="form-label text-light fw-bold">Nome de Usuário</label>
              <input
                type="text"
                className="form-control"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-info w-100 fw-bold text-dark">
              Buscar Conta
            </button>
            <button 
              type="button" 
              className="btn btn-link text-secondary w-100 mt-2 text-decoration-none" 
              onClick={() => navigate('/contas')}
            >
              Voltar para o Login
            </button>
          </form>
        )}

        {/* TELA 2: DIGITAR A NOVA SENHA */}
        {etapa === 2 && (
          <form onSubmit={salvarNovaSenha}>
            <p className="text-success fw-bold text-center mb-3">
              Conta localizada: {username}
            </p>
            <div className="mb-3">
              <label className="form-label text-light fw-bold">Nova Senha</label>
              <input
                type="password"
                className="form-control"
                required
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
              />
            </div>
            <div className="mb-4">
              <label className="form-label text-light fw-bold">Confirmar Nova Senha</label>
              <input
                type="password"
                className="form-control"
                required
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-success w-100 fw-bold">
              Salvar Nova Senha
            </button>
            <button 
              type="button" 
              className="btn btn-link text-secondary w-100 mt-2 text-decoration-none" 
              onClick={() => setEtapa(1)}
            >
              Cancelar
            </button>
          </form>
        )}

      </div>
    </div>
  );
}