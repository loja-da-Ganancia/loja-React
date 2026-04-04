import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
    const location = useLocation();
    
    // Estado que controla se o menu mobile está aberto ou fechado
    const [menuAberto, setMenuAberto] = useState(false);

    const sessionData = sessionStorage.getItem('greedstore_session');
    const usuarioLogado = sessionData ? JSON.parse(sessionData) : null;

    // Funções para manipular o menu mobile
    function alternarMenu() {
        setMenuAberto(!menuAberto);
    }

    function fecharMenu() {
        setMenuAberto(false);
    }

    return (
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark px-4 border-bottom border-secondary sticky-top">
            <Link className="navbar-brand" to="/" onClick={fecharMenu}>
                <img className="logo-nav-bar" src="src/assets/logo_sem_fundo_greedstore.png" alt="Logo Greedstore" style={{height: '45px'}} />
            </Link>
            
            {/* O botão agora chama a nossa função do React em vez do data-bs-toggle */}
            <button 
                className="navbar-toggler" 
                type="button" 
                onClick={alternarMenu}
            >
                <span className="navbar-toggler-icon"></span>
            </button>

            {/* A classe 'show' é adicionada dinamicamente se o estado for true */}
            <div className={`collapse navbar-collapse ${menuAberto ? 'show' : ''}`} id="menu">
                <div className="navbar-nav ms-auto text-center text-lg-start mt-3 mt-lg-0">
                    
                    <Link className={`nav-link ${location.pathname === '/' ? 'active' : ''}`} to="/" onClick={fecharMenu}>Home</Link>
                    <Link className={`nav-link ${location.pathname === '/marketplace' ? 'active' : ''}`} to="/marketplace" onClick={fecharMenu}>Marketplace</Link>
                    <Link className={`nav-link ${location.pathname === '/decks' ? 'active' : ''}`} to="/decks" onClick={fecharMenu}>Decks</Link>
                    <Link className={`nav-link ${location.pathname === '/comunidade' ? 'active' : ''}`} to="/comunidade" onClick={fecharMenu}>Comunidade</Link>
                    <Link className={`nav-link ${location.pathname === '/favoritos' ? 'active' : ''}`} to="/favoritos" onClick={fecharMenu}>Favoritos</Link>
                    
                    <div className="vr bg-secondary mx-2 d-none d-lg-block"></div>
                    {menuAberto && <hr className="d-lg-none border-secondary" />}

                    {usuarioLogado ? (
                        <>
                            {usuarioLogado.role === 'admin' && (
                                <Link className={`nav-link text-warning fw-bold ${location.pathname === '/admin' ? 'active' : ''}`} to="/admin" onClick={fecharMenu}>👑 Admin</Link>
                            )}
                            <Link className={`nav-link text-info fw-bold ${location.pathname === '/perfil' ? 'active' : ''}`} to="/perfil" onClick={fecharMenu}>Meu Perfil</Link>
                        </>
                    ) : (
                        <Link className={`nav-link text-info fw-bold ${location.pathname === '/contas' ? 'active' : ''}`} to="/contas" onClick={fecharMenu}>Login/Cadastro</Link>
                    )}

                </div>
            </div>
        </nav>
    );
}