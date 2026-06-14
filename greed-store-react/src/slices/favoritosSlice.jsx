import { createSlice } from '@reduxjs/toolkit';
import { apiFetch } from '../api'; // Reutilizando a sua configuração de conexão com o backend

const initialState = {
  items: [], // Começa vazio, sem ler do localStorage
};

const favoritosSlice = createSlice({
  name: 'favoritos',
  initialState,
  reducers: {
    // Agora temos apenas um reducer central que atualiza a lista toda
    // baseado no que o banco de dados nos devolver.
    setFavoritos(state, action) {
      state.items = action.payload;
    },
    limparFavoritos(state) {
      state.items = [];
    }
  }
});

export const { setFavoritos, limparFavoritos } = favoritosSlice.actions;

// ----------------------------------------------------
// THUNKS ASSÍNCRONOS (Comunicação com o MongoDB)
// ----------------------------------------------------

// 1. Buscar a lista de favoritos ao entrar na aplicação
export const fetchFavoritosThunk = () => async (dispatch, getState) => {
  const token = getState().user.currentUser?.token;
  if (!token) return;

  try {
    const response = await apiFetch('/api/favorites', { token });
    if (response.ok) {
      const data = await response.json();
      dispatch(setFavoritos(data));
    }
  } catch (error) {
    console.error("Erro ao buscar favoritos:", error);
  }
};

// 2. Adicionar uma carta aos favoritos
export const adicionarFavoritoThunk = (payload) => async (dispatch, getState) => {
  const token = getState().user.currentUser?.token;
  if (!token) return;

  // O payload antigo da sua UI mandava { carta, username }
  const cartaParaSalvar = payload.carta || payload;

  try {
    const response = await apiFetch('/api/favorites', {
      method: 'POST',
      body: { carta: cartaParaSalvar },
      token
    });

    if (response.ok) {
      const favoritosAtualizados = await response.json();
      // O backend devolve a lista completa nova, só precisamos subscrever
      dispatch(setFavoritos(favoritosAtualizados)); 
    }
  } catch (error) {
    console.error("Erro ao favoritar carta:", error);
  }
};

// 3. Remover uma carta dos favoritos
export const removerFavoritoThunk = (payload) => async (dispatch, getState) => {
  const state = getState();
  const token = state.user.currentUser?.token;
  if (!token) return;

  // A sua UI antiga enviava { nome, username } para deletar.
  // Como o backend precisa do ID da carta na URL, vamos procurar o ID na memória primeiro:
  const nomeDaCarta = payload.nome || payload.name;
  const cartaAlvo = state.favoritos.items.find((f) => f.nome === nomeDaCarta || f.name === nomeDaCarta);
  
  if (!cartaAlvo) return; // Se não achou na memória, aborta
  
  const idCarta = cartaAlvo.id || cartaAlvo._id;

  try {
    const response = await apiFetch(`/api/favorites/${idCarta}`, {
      method: 'DELETE',
      token
    });

    if (response.ok) {
      const data = await response.json();
      dispatch(setFavoritos(data.favorites)); // Atualiza com a lista sem a carta
    }
  } catch (error) {
    console.error("Erro ao remover favorito:", error);
  }
};

// ----------------------------------------------------
// ATALHOS DE COMPATIBILIDADE (Para não quebrar a sua UI)
// ----------------------------------------------------
// Exportamos os thunks usando os nomes exatos que os seus botões do React já chamam.
export const adicionarFavoritoGlobal = adicionarFavoritoThunk;
export const removerFavoritoGlobal = removerFavoritoThunk;

export default favoritosSlice.reducer;