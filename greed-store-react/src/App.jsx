// libs
import { BrowserRouter, Routes, Route } from 'react-router-dom';


// componentes
import Navbar from './components/Navbar';

import './index.css';
import './Marketplace.css';
import './Decks.css';
import './Perfil.css';
import './Admin.css';



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
        <BrowserRouter>
            <Navbar />

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
        </BrowserRouter>
    );
}

export default App;