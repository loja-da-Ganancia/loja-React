import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// ==========================================================
// FUNÇÕES AUXILIARES DE AUTENTICAÇÃO (Antigo auth.js)
// ==========================================================
const USERS_KEY = 'greedstore_users';
const SESSION_KEY = 'greedstore_session';

function obterUsuarios() {
  const users = localStorage.getItem(USERS_KEY);
  return users ? JSON.parse(users) : [];
}

function salvarUsuarios(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function registrarUsuario(username, password) {
  const users = obterUsuarios();

  // Verifica se usuário já existe
  const existe = users.find((u) => u.username === username);
  if (existe) {
    return { success: false, message: 'Nome de usuário já existe.' };
  }

  if (username.length < 3 || password.length < 3) {
    return { success: false, message: 'Usuário e senha devem ter pelo menos 3 caracteres.' };
  }

  users.push({ username: username, password: password, role: 'user' });
  salvarUsuarios(users);
  return { success: true, message: 'Cadastro realizado com sucesso!' };
}

function realizarLogin(username, password) {
  const users = obterUsuarios();
  const user = users.find((u) => u.username === username && u.password === password);

  if (!user) {
    return { success: false, message: 'Usuário ou senha incorretos.' };
  }

  sessionStorage.setItem(SESSION_KEY, JSON.stringify({
    username: user.username,
    role: user.role,
    loggedAt: Date.now()
  }));

  return { success: true, message: `Bem-vindo, ${user.username}!` };
}

// ==========================================================
// COMPONENTE PRINCIPAL
// ==========================================================
export default function Contas() {
  const navigate = useNavigate();

  // Estado para controlar qual aba está aberta ('login' ou 'cadastro')
  const [abaAtiva, setAbaAtiva] = useState('login');

  // Estados dos formulários
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Estado para feedback na tela
  const [mensagem, setMensagem] = useState(null); // formato: { texto: '', tipo: 'success' | 'danger' }

  // Verifica se já está logado ao entrar na página
  useEffect(() => {
    // Garante que o admin base exista
    let users = localStorage.getItem(USERS_KEY);
    if (!users) {
      salvarUsuarios([{ username: 'admin', password: 'admin', role: 'admin' }]);
    }

    // Se tiver sessão, manda pro perfil
    if (sessionStorage.getItem(SESSION_KEY)) {
      navigate('/perfil');
    }
  }, [navigate]);

  // Limpa os campos e mensagens sempre que trocar de aba
  function mudarAba(novaAba) {
    setAbaAtiva(novaAba);
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setMensagem(null);
  }

  // Função disparada ao enviar o formulário de Login
  function submeterLogin(e) {
    e.preventDefault(); // Impede o recarregamento da página
    setMensagem(null);

    const resultado = realizarLogin(username, password);

    if (resultado.success) {
      setMensagem({ texto: resultado.message, tipo: 'success' });

      // Aguarda 1 segundo para o usuário ler a mensagem e redireciona
      setTimeout(() => {
        navigate('/perfil');
      }, 1000);
    } else {
      setMensagem({ texto: resultado.message, tipo: 'danger' });
    }
  }

  // Função disparada ao enviar o formulário de Cadastro
  function submeterCadastro(e) {
    e.preventDefault();
    setMensagem(null);

    if (password !== confirmPassword) {
      setMensagem({ texto: 'As senhas não coincidem.', tipo: 'danger' });
      return;
    }

    const resultado = registrarUsuario(username, password);

    if (resultado.success) {
      setMensagem({ texto: resultado.message + ' Agora faça login.', tipo: 'success' });
      // Troca automaticamente para a aba de login para o usuário entrar
      setTimeout(() => {
        mudarAba('login');
        setMensagem({ texto: 'Cadastro concluído! Faça seu login.', tipo: 'success' });
      }, 1500);
    } else {
      setMensagem({ texto: resultado.message, tipo: 'danger' });
    }
  }

  return (
    <div className="container flex-grow-1 d-flex align-items-center justify-content-center mt-5 mb-5">
      <div className="form-container w-100">

        {/* NAVEGAÇÃO DAS ABAS */}
        <ul className="nav nav-tabs mb-4" role="tablist">
          <li className="nav-item" role="presentation">
            <button
              className={`nav-link fw-bold ${abaAtiva === 'login' ? 'active text-dark' : 'text-info'}`}
              type="button"
              onClick={() => mudarAba('login')}
              style={{ backgroundColor: abaAtiva === 'login' ? '#00d2ff' : 'transparent', border: 'none' }}
            >
              Entrar
            </button>
          </li>
          <li className="nav-item" role="presentation">
            <button
              className={`nav-link fw-bold ${abaAtiva === 'cadastro' ? 'active text-dark' : 'text-info'}`}
              type="button"
              onClick={() => mudarAba('cadastro')}
              style={{ backgroundColor: abaAtiva === 'cadastro' ? '#00d2ff' : 'transparent', border: 'none' }}
            >
              Cadastrar
            </button>
          </li>
        </ul>

        {/* MENSAGEM DE FEEDBACK GERAL */}
        {mensagem && (
          <div className={`alert alert-${mensagem.tipo} text-center fw-bold`} role="alert">
            {mensagem.texto}
          </div>
        )}

        {/* CONTEÚDO DAS ABAS */}
        <div className="tab-content">

          {/* FORMULÁRIO DE LOGIN */}
          {abaAtiva === 'login' && (
            <div className="tab-pane fade show active">
              <form onSubmit={submeterLogin}>
                <div className="mb-3">
                  <label className="form-label text-light fw-bold">Usuário</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
                <div className="mb-4">
                  <label className="form-label text-light fw-bold">Senha</label>
                  <input
                    type="password"
                    className="form-control"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn btn-info w-100 fw-bold">Entrar</button>
                <div className="text-end mt-2">
                  <button
                    type="button"
                    className="btn btn-link p-0 text-info"
                    onClick={() => navigate('/esqueci-senha')}
                  >
                    Esqueci minha senha
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* FORMULÁRIO DE CADASTRO */}
          {abaAtiva === 'cadastro' && (
            <div className="tab-pane fade show active">
              <form onSubmit={submeterCadastro}>
                <div className="mb-3">
                  <label className="form-label text-light fw-bold">Usuário</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    minLength="3"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label text-light fw-bold">Senha</label>
                  <input
                    type="password"
                    className="form-control"
                    required
                    minLength="3"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div className="mb-4">
                  <label className="form-label text-light fw-bold">Confirmar senha</label>
                  <input
                    type="password"
                    className="form-control"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn btn-success w-100 fw-bold">Criar Conta</button>
              </form>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}