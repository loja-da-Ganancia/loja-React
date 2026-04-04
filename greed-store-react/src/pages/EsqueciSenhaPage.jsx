import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";


const USERS_KEY = 'greedstore_users';

function gerarToken() {
    return Math.random().toString(36).substring(2) + Date.now();
}

export default function EsqueciSenhaPage() {
    const [username, setUsername] = useState("");
    const [mensagem, setMensagem] = useState("");
    const [linkReset, setLinkReset] = useState("");
    const navigate = useNavigate();

    function solicitarReset() {
        console.log("Iniciando solicitação para:", username);
        const users = JSON.parse(localStorage.getItem(USERS_KEY)) || [];
        const user = users.find(u => u.username.toLowerCase() === username.toLowerCase()); // Case-insensitive

        if (!user) {
            setMensagem("❌ Usuário não encontrado.");
            setLinkReset(""); // Limpa o link anterior se der erro
            return;
        }

        const token = gerarToken();
        user.resetToken = token;
        user.resetExpira = Date.now() + (10 * 60 * 1000);
        localStorage.setItem(USERS_KEY, JSON.stringify(users));

        // Garanta que o link comece com barra
        const link = `/reset?token=${token}`;
        setMensagem("✅ Link gerado! (simulação de email)");
        setLinkReset(link);
    }

    return (
        <div className="container mt-5 text-white">
            <h2>🔑 Recuperar Senha</h2>

            <input
                className="form-control mt-3"
                placeholder="Digite seu usuário"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
            />

            <button className="btn btn-info mt-3" onClick={solicitarReset}>
                Gerar Link
            </button>

            {mensagem && <div className="alert alert-info mt-3">{mensagem}</div>}

            {linkReset && (
                <div className="alert alert-warning mt-3">
                    🔗 Link gerado com sucesso!<br />
                    {/* O Link funciona como um <a> mas sem recarregar a página */}
                    <Link to={linkReset} className="btn btn-warning mt-2">
                        Ir para redefinição
                    </Link>
                </div>
            )}
        </div>
    );
}
