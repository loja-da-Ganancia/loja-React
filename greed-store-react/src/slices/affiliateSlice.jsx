import { createSlice } from '@reduxjs/toolkit';

const AFFILIATE_CLICKS_KEY = 'greedstore_affiliate_clicks';

const initialState = {
  // Inicialização estática (Lazy Initialization) a partir do armazenamento do navegador
  items: JSON.parse(localStorage.getItem(AFFILIATE_CLICKS_KEY)) || [],
};

const affiliatesSlice = createSlice({
  name: 'affiliates',
  initialState,
  reducers: {
    /**
     * Regista um novo clique de afiliado e persiste no armazenamento local.
     */
    registrarCliqueGlobal(state, action) {
      state.items.push(action.payload);
      localStorage.setItem(AFFILIATE_CLICKS_KEY, JSON.stringify(state.items));
    },
    /**
     * Remove um registo específico com base no identificador (ID).
     */
    deletarCliqueGlobal(state, action) {
      state.items = state.items.filter((c) => c.id !== action.payload);
      localStorage.setItem(AFFILIATE_CLICKS_KEY, JSON.stringify(state.items));
    },
    /**
     * Purga todo o histórico de cliques da aplicação.
     */
    limparCliquesGlobal(state) {
      state.items = [];
      localStorage.removeItem(AFFILIATE_CLICKS_KEY);
    }
  }
});

export const { registrarCliqueGlobal, deletarCliqueGlobal, limparCliquesGlobal } = affiliatesSlice.actions;
export default affiliatesSlice.reducer;