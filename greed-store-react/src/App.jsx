// libs
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// ==========================================================
// IMPORTAÇÕES DO REDUX (O Cabo de Força)
// ==========================================================
import { Provider } from 'react-redux';

import { store } from './store'; 

// componentes
import Navbar from './components/Navbar';

import './css/Comunidade.css';
import './css/Marketplace.css';
import './css/Decks.css';
import './css/Perfil.css';
import './css/Admin.css';


import Footer from './components/Footer';
import Home from './pages/Home';
import Marketplace from './pages/Marketplace';
import Decks from './pages/Decks';
import Favoritos from './pages/Favoritos'
import Comunidade from './pages/Comunidade';
import Contas from './pages/Contas';
import Perfil from './pages/Perfil';
import Admin from './pages/Admin';
import EsqueciSenhaPage from "./pages/EsqueciSenhaPage";
import ResetSenha from "./pages/ResetSenha";

function App() {
    return (
        <Provider store={store}>
            <BrowserRouter>
                {/*Deixa o footer sempre no final do conteiner*/}
                <div className="d-flex flex-column min-vh-100">
                    
                    <Navbar />

                    {/* O conteúdo das páginas fica aqui no meio */}
                    <Routes>
                        <Route path="/" element={<Home/>} />
                        <Route path="/marketplace" element={<Marketplace />} />
                        <Route path="/decks" element={<Decks />} />
                        <Route path="/comunidade" element={<Comunidade />} />
                        <Route path="/favoritos" element={<Favoritos />} />
                        <Route path="/admin" element={<Admin />} />
                        <Route path="/perfil" element={<Perfil />} />
                        <Route path="/contas" element={<Contas />} />
                        <Route path="/esqueci-senha" element={<EsqueciSenhaPage />} />
                        <Route path="/reset" element={<ResetSenha />} />
                    </Routes>

                    <Footer />
                    
                </div>
            </BrowserRouter>
        </Provider>
    );
}

export default App;
