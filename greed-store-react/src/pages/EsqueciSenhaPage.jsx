import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api";

export default function EsqueciSenhaPage() {
  const navigate = useNavigate();

  const [etapa, setEtapa] = useState(1);
  const [username, setUsername] = useState('');
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mensagem, setMensagem] = useState(null);
  const [loading, setLoading] = useState(false);

  // ETAPA 1: Verifica usuário + senha atual (prova de identidade)
  async function verificarIdentidade(e) {
    e.preventDefault();
    setMensagem(null);
    setLoading(true);

    try {
      // Usa o endpoint de login para verificar a identidade — sem expor lista de usuários
      const response = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: { username: username.trim(), password: senhaAtual },
      });

      if (!response.ok) {
        setMensagem({ texto: 'Usuário ou senha atual incorretos.', tipo: 'danger' });
        return;
      }

      setEtapa(2);
    } catch {
      setMensagem({ texto: 'Erro ao conectar com o servidor.', tipo: 'danger' });
    } finally {
      setLoading(false);
    }
  }

  // ETAPA 2: Troca a senha — agora com autenticação via login
  async function salvarNovaSenha(e) {
    e.preventDefault();
    setMensagem(null);

    if (novaSenha !== confirmarSenha) {
      setMensagem({ texto: 'As senhas não coincidem.', tipo: 'danger' });
      return;
    }
    if (novaSenha.length < 6) {
      setMensagem({ texto: 'A nova senha deve ter pelo menos 6 caracteres.', tipo: 'danger' });
      return;
    }

    setLoading(true);
    try {
      // Faz login para obter o token JWT
      const loginRes = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: { username: username.trim(), password: senhaAtual },
      });

      if (!loginRes.ok) {
        setMensagem({ texto: 'Sessão expirada. Comece novamente.', tipo: 'danger' });
        setEtapa(1);
        return;
      }

      const { token, user } = await loginRes.json();

      // Atualiza a senha usando o token JWT do próprio usuário
      const updateRes = await apiFetch(`/api/users/${user._id}`, {
        method: 'PUT',
        token,
        body: { password: novaSenha },
      });

      if (!updateRes.ok) {
        const err = await updateRes.json();
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
          Alterar Senha
        </h3>

        {mensagem && (
          <div className={`alert alert-${mensagem.tipo} text-center fw-bold p-2`} role="alert">
            {mensagem.texto}
          </div>
        )}

        {etapa === 1 && (
          <form onSubmit={verificarIdentidade}>
            <p className="text-light" style={{ fontSize: '0.9rem' }}>
              Para alterar sua senha, confirme sua identidade primeiro.
            </p>
            <div className="mb-3">
              <label className="form-label text-light fw-bold">Nome de Usuário</label>
              <input
                type="text"
                className="form-control"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="mb-4">
              <label className="form-label text-light fw-bold">Senha Atual</label>
              <input
                type="password"
                className="form-control"
                required
                value={senhaAtual}
                onChange={(e) => setSenhaAtual(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-info w-100 fw-bold text-dark" disabled={loading}>
              {loading ? '⏳ Verificando...' : 'Confirmar Identidade'}
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
              ✅ Identidade confirmada. Defina sua nova senha.
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
