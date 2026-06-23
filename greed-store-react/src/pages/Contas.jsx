import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { loginUserAsync, registerUserAsync } from "../slices/userSlice";

export default function Contas() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // ====================================================
  // 1. ESTADOS GLOBAIS E LOCAIS
  // ====================================================
  const currentUser = useSelector((state) => state.user.currentUser);
  const { status, error } = useSelector((state) => ({
    status: state.user.status,
    error: state.user.error,
  }));

  const [abaAtiva, setAbaAtiva] = useState("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mensagem, setMensagem] = useState(null);

  // ====================================================
  // 2. PROTEÇÃO DE ROTA (Usuário já logado)
  // ====================================================
  useEffect(() => {
    if (currentUser) {
      navigate("/perfil");
    }
  }, [currentUser, navigate]);

  // ====================================================
  // 3. LÓGICA DE NEGÓCIO (Formulários)
  // ====================================================
  function mudarAba(novaAba) {
    setAbaAtiva(novaAba);
    setUsername("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setMensagem(null);
  }

  function submeterLogin(e) {
    e.preventDefault();
    setMensagem(null);

    const userFormatado = username.trim();

    dispatch(loginUserAsync({ username: userFormatado, password })).then(
      (result) => {
        if (result.type === loginUserAsync.fulfilled.type) {
          setMensagem({
            texto: `Bem-vindo, ${result.payload.user.username}!`,
            tipo: "success",
          });
          setTimeout(() => navigate("/perfil"), 1000);
        }
      }
    );
  }

  function submeterCadastro(e) {
    e.preventDefault();
    setMensagem(null);

    const userFormatado = username.trim();
    const emailFormatado = email.trim();

    if (password !== confirmPassword) {
      setMensagem({ texto: "As senhas não coincidem.", tipo: "danger" });
      return;
    }
    if (userFormatado.length < 3 || password.length < 3) {
      setMensagem({
        texto: "Usuário e senha devem ter pelo menos 3 caracteres.",
        tipo: "danger",
      });
      return;
    }

    dispatch(
      registerUserAsync({
        username: userFormatado,
        email: emailFormatado || undefined,
        password,
      })
    ).then((result) => {
      if (result.type === registerUserAsync.fulfilled.type) {
        setMensagem({
          texto: "Cadastro concluído! Autenticando...",
          tipo: "success",
        });
        setTimeout(() => navigate("/perfil"), 1500);
      }
    });
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
              className={`nav-link fw-bold ${
                abaAtiva === "login" ? "active text-dark" : "text-info"
              }`}
              type="button"
              onClick={() => mudarAba("login")}
              style={{
                backgroundColor:
                  abaAtiva === "login" ? "#00d2ff" : "transparent",
                border: "none",
              }}
            >
              Entrar
            </button>
          </li>
          <li className="nav-item" role="presentation">
            <button
              className={`nav-link fw-bold ${
                abaAtiva === "cadastro" ? "active text-dark" : "text-info"
              }`}
              type="button"
              onClick={() => mudarAba("cadastro")}
              style={{
                backgroundColor:
                  abaAtiva === "cadastro" ? "#00d2ff" : "transparent",
                border: "none",
              }}
            >
              Cadastrar
            </button>
          </li>
        </ul>

        {mensagem && (
          <div
            className={`alert alert-${mensagem.tipo} text-center fw-bold`}
            role="alert"
          >
            {mensagem.texto}
          </div>
        )}

        {error && !mensagem && (
          <div className="alert alert-danger text-center fw-bold" role="alert">
            ❌ {error}
          </div>
        )}

        <div className="tab-content">
          {/* ======= ABA LOGIN ======= */}
          {abaAtiva === "login" && (
            <div className="tab-pane fade show active">
              <form onSubmit={submeterLogin}>
                <div className="mb-3">
                  <label className="form-label text-light fw-bold">
                    Usuário
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
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
                    autoComplete="current-password"
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-info w-100 fw-bold text-dark"
                  disabled={status === "loading"}
                >
                  {status === "loading" ? "⏳ Entrando..." : "Entrar"}
                </button>
                <div className="text-end mt-2">
                  <button
                    type="button"
                    className="btn btn-link p-0 text-info"
                    onClick={() => navigate("/esqueci-senha")}
                  >
                    Esqueci minha senha
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ======= ABA CADASTRO ======= */}
          {abaAtiva === "cadastro" && (
            <div className="tab-pane fade show active">
              <form onSubmit={submeterCadastro}>
                <div className="mb-3">
                  <label className="form-label text-light fw-bold">
                    Usuário <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    minLength="3"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label text-light fw-bold">
                    E-mail{" "}
                    <span className="text-secondary" style={{ fontSize: "0.8rem" }}>
                      (opcional)
                    </span>
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    placeholder="seu@email.com"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label text-light fw-bold">
                    Senha <span className="text-danger">*</span>
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    required
                    minLength="3"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
                <div className="mb-4">
                  <label className="form-label text-light fw-bold">
                    Confirmar senha <span className="text-danger">*</span>
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                  {confirmPassword && password !== confirmPassword && (
                    <div className="text-danger mt-1" style={{ fontSize: "0.85rem" }}>
                      ⚠️ As senhas não coincidem
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  className="btn btn-success w-100 fw-bold"
                  disabled={status === "loading"}
                >
                  {status === "loading" ? "⏳ Criando conta..." : "Criar Conta"}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
