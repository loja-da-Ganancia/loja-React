import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { loginUser, registerUser } from "../slices/userSlice"; 

export default function Contas() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // ====================================================
  // 1. ESTADOS GLOBAIS E LOCAIS
  // ====================================================
  const usuarios = useSelector((state) => state.user.allUsers);
  const currentUser = useSelector((state) => state.user.currentUser);

  const [abaAtiva, setAbaAtiva] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mensagem, setMensagem] = useState(null);

  // ====================================================
  // 2. PROTEÇÃO DE ROTA (Usuário já logado)
  // ====================================================
  useEffect(() => {
    if (currentUser) {
      navigate('/perfil');
    }
  }, [currentUser, navigate]);

  // ====================================================
  // 3. LÓGICA DE NEGÓCIO (Formulários)
  // ====================================================
  function mudarAba(novaAba) {
    setAbaAtiva(novaAba);
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setMensagem(null);
  }

  function submeterLogin(e) {
    e.preventDefault();
    setMensagem(null);

    const userFormatado = username.trim();

    // Tratamento case-insensitive
    const user = usuarios.find((u) => 
      u.username.toLowerCase() === userFormatado.toLowerCase() && 
      u.password === password
    );

    if (user) {
      setMensagem({ texto: `Bem-vindo, ${user.username}!`, tipo: 'success' });
      dispatch(loginUser({ username: user.username, role: user.role, loggedAt: Date.now() }));
      setTimeout(() => navigate('/perfil'), 1000);
    } else {
      setMensagem({ texto: 'Usuário ou senha incorretos.', tipo: 'danger' });
    }
  }

  function submeterCadastro(e) {
    e.preventDefault();
    setMensagem(null);

    const userFormatado = username.trim();

    if (password !== confirmPassword) {
      setMensagem({ texto: 'As senhas não coincidem.', tipo: 'danger' });
      return;
    }
    if (userFormatado.length < 3 || password.length < 3) {
      setMensagem({ texto: 'Usuário e senha devem ter pelo menos 3 caracteres.', tipo: 'danger' });
      return;
    }

    const existe = usuarios.find((u) => u.username.toLowerCase() === userFormatado.toLowerCase());
    if (existe) {
      setMensagem({ texto: 'Nome de usuário já existe.', tipo: 'danger' });
      return;
    }

    dispatch(registerUser({ username: userFormatado, password: password, role: 'user' }));
    setMensagem({ texto: 'Cadastro concluído! Agora faça login.', tipo: 'success' });
    
    setTimeout(() => {
      mudarAba('login');
      setMensagem({ texto: 'Cadastro concluído! Faça seu login.', tipo: 'success' });
    }, 1500);
  }

  // ====================================================
  // 4. RENDERIZAÇÃO DA INTERFACE
  // ====================================================
  return (
    <div className="container flex-grow-1 d-flex align-items-center justify-content-center mt-5 mb-5">
      <div className="form-container w-100">

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

        {mensagem && (
          <div className={`alert alert-${mensagem.tipo} text-center fw-bold`} role="alert">
            {mensagem.texto}
          </div>
        )}

        <div className="tab-content">
          {abaAtiva === 'login' && (
            <div className="tab-pane fade show active">
              <form onSubmit={submeterLogin}>
                <div className="mb-3">
                  <label className="form-label text-light fw-bold">Usuário</label>
                  <input type="text" className="form-control" required value={username} onChange={(e) => setUsername(e.target.value)} />
                </div>
                <div className="mb-4">
                  <label className="form-label text-light fw-bold">Senha</label>
                  <input type="password" className="form-control" required value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <button type="submit" className="btn btn-info w-100 fw-bold text-dark">Entrar</button>
                <div className="text-end mt-2">
                  <button type="button" className="btn btn-link p-0 text-info" onClick={() => navigate('/esqueci-senha')}>Esqueci minha senha</button>
                </div>
              </form>
            </div>
          )}

          {abaAtiva === 'cadastro' && (
            <div className="tab-pane fade show active">
              <form onSubmit={submeterCadastro}>
                <div className="mb-3">
                  <label className="form-label text-light fw-bold">Usuário</label>
                  <input type="text" className="form-control" required minLength="3" value={username} onChange={(e) => setUsername(e.target.value)} />
                </div>
                <div className="mb-3">
                  <label className="form-label text-light fw-bold">Senha</label>
                  <input type="password" className="form-control" required minLength="3" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <div className="mb-4">
                  <label className="form-label text-light fw-bold">Confirmar senha</label>
                  <input type="password" className="form-control" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
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