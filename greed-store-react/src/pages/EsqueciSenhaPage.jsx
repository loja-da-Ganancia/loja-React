import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { apiFetch } from "../api";

export default function EsqueciSenhaPage() {
  const navigate = useNavigate();

  const [etapa, setEtapa] = useState(1);
  const [username, setUsername] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mensagem, setMensagem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);

  // ETAPA 1: Verifica se a conta existe no backend
  async function buscarUsuario(e) {
    e.preventDefault();
    setMensagem(null);
    setLoading(true);

    try {
      const response = await apiFetch(`/api/users?username=${username.trim()}`);
      const users = await response.json();
      const encontrado = Array.isArray(users)
        ? users.find((u) => u.username.toLowerCase() === username.trim().toLowerCase())
        : null;

      if (encontrado) {
        setUsername(encontrado.username);
        setUserId(encontrado._id);
        setEtapa(2);
      } else {
        setMensagem({ texto: 'Usuário não encontrado no sistema.', tipo: 'danger' });
      }
    } catch {
      setMensagem({ texto: 'Erro ao conectar com o servidor.', tipo: 'danger' });
    } finally {
      setLoading(false);
    }
  }

  // ETAPA 2: Salva nova senha via backend
  async function salvarNovaSenha(e) {
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

    setLoading(true);
    try {
      const response = await apiFetch(`/api/users/${userId}`, {
        method: 'PUT',
        body: { password: novaSenha },
      });

      if (!response.ok) {
        const err = await response.json();
        setMensagem({ texto: err.error || 'Erro ao alterar senha.', tipo: 'danger' });
        return;
      }

      setMensagem({ texto: 'Senha alterada com sucesso! Redirecionando...', tipo: 'success' });
      setTimeout(() => navigate('/contas'), 1500);
    } catch {
      setMensagem({ texto: 'Erro ao conectar com o servidor.', tipo: 'danger' });
    } finally {
      setLoading(false);
    }
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
            <button type="submit" className="btn btn-info w-100 fw-bold text-dark" disabled={loading}>
              {loading ? '⏳ Buscando...' : 'Buscar Conta'}
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

        {etapa === 2 && (
          <form onSubmit={salvarNovaSenha}>
            <p className="text-success fw-bold text-center mb-3">
              ✅ Conta localizada: {username}
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
            <button type="submit" className="btn btn-success w-100 fw-bold" disabled={loading}>
              {loading ? '⏳ Salvando...' : 'Salvar Nova Senha'}
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
