import { createSlice } from '@reduxjs/toolkit';
import { apiFetch } from '../api'; // 🚀 VOLTAMOS COM O SEU ARQUIVO API AQUI!

const initialState = {
  items: [],
};

const affiliatesSlice = createSlice({
  name: 'affiliates',
  initialState,
  reducers: {
    setCliques(state, action) {
      state.items = action.payload || [];
    },
    limparCliquesLocal(state) {
      state.items = [];
    }
  }
});

export const { setCliques, limparCliquesLocal } = affiliatesSlice.actions;

// 1. Busca os cliques no Mongo
export const fetchCliquesThunk = () => async (dispatch, getState) => {
  const token = getState().user.currentUser?.token;
  if (!token) return;

  try {
    const response = await apiFetch('/api/clicks', { token });
    if (response.ok) {
      const data = await response.json();
      dispatch(setCliques(data));
    }
  } catch (error) {
    console.error("Erro ao buscar histórico de cliques:", error);
  }
};

// 2. Envia o clique para o Mongo
export const registrarCliqueGlobal = (payload) => async (dispatch, getState) => {
  const token = getState().user.currentUser?.token;
  if (!token) return;

  try {
    await apiFetch('/api/clicks', {
      method: 'POST',
      body: payload, // Manda o { affiliateStore, cardId }
      token
    });
    
    // Atualiza a lista na mesma hora
    dispatch(fetchCliquesThunk());
  } catch (error) {
    console.error("Erro ao registrar clique:", error);
  }
};

// 3. Deleta um clique do Mongo
export const deletarCliqueGlobal = (id) => async (dispatch, getState) => {
  const token = getState().user.currentUser?.token;
  if (!token) return;

  try {
    const response = await apiFetch(`/api/clicks/${id}`, {
      method: 'DELETE',
      token
    });
    if (response.ok) {
      dispatch(fetchCliquesThunk());
    }
  } catch (error) {
    console.error("Erro ao deletar clique:", error);
  }
};

// 4. Limpa todos os cliques do Mongo
export const limparCliquesGlobal = () => async (dispatch, getState) => {
  const token = getState().user.currentUser?.token;
  if (!token) return;

  try {
    const response = await apiFetch('/api/clicks', {
      method: 'DELETE',
      token
    });
    if (response.ok) {
      dispatch(limparCliquesLocal());
    }
  } catch (error) {
    console.error("Erro ao limpar cliques:", error);
  }
};

export default affiliatesSlice.reducer;