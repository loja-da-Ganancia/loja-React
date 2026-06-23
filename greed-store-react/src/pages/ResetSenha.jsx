import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

const USERS_KEY = 'greedstore_users';

export default function ResetSenha() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get("token");

    const [novaSenha, setNovaSenha] = useState("");
    const [confirmarSenha, setConfirmarSenha] = useState("");
    const [mensagem, setMensagem] = useState("");

    function salvarNovaSenha(e) {
        e.preventDefault();

        if (novaSenha !== confirmarSenha) {
            setMensagem("❌ As senhas não coincidem.");
            return;
        }

        const users = JSON.parse(localStorage.getItem(USERS_KEY)) || [];
        
        // Procuramos o usuário que tenha esse token e que o token não tenha expirado
        const userIndex = users.findIndex(u => u.resetToken === token && u.resetExpira > Date.now());

        if (userIndex === -1) {
            setMensagem("❌ Token inválido ou expirado. Solicite um novo link.");
            return;
        }

        // Atualizamos a senha e limpamos o token para não ser usado de novo
        users[userIndex].password = novaSenha;
        delete users[userIndex].resetToken;
        delete users[userIndex].resetExpira;

        localStorage.setItem(USERS_KEY, JSON.stringify(users));
        setMensagem("✅ Senha alterada com sucesso! Redirecionando...");

        // Espera 2 segundos e manda para o login
        setTimeout(() => navigate("/contas"), 2000);
    }

    if (!token) {
        return <div className="container mt-5 text-white"><h2>Token ausente!</h2></div>;
    }

    return (
        <div className="container mt-5 text-white" style={{ maxWidth: '400px' }}>
            <h2>🔒 Nova Senha</h2>
            <p className="text-muted">Redefinindo para o token: <br/><small>{token}</small></p>

            <form onSubmit={salvarNovaSenha}>
                <input
                    type="password"
                    className="form-control mt-3"
                    placeholder="Nova senha"
                    required
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                />
                <input
                    type="password"
                    className="form-control mt-3"
                    placeholder="Confirme a nova senha"
                    required
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                />
                <button type="submit" className="btn btn-success w-100 mt-4">
                    Salvar Nova Senha
                </button>
            </form>

            {mensagem && <div className="alert alert-info mt-3">{mensagem}</div>}
        </div>
    );
}