import { createSlice } from '@reduxjs/toolkit';

const FAVORITOS_KEY = 'favoritos';

const initialState = {
  items: JSON.parse(localStorage.getItem(FAVORITOS_KEY)) || [],
};

const favoritosSlice = createSlice({
  name: 'favoritos',
  initialState,
  reducers: {
    removerFavoritoGlobal(state, action) {
      const { nome, username } = action.payload;
      // Remove apenas se o nome da carta e o dono baterem
      state.items = state.items.filter((f) => !(f.nome === nome && f.owner === username));
      localStorage.setItem(FAVORITOS_KEY, JSON.stringify(state.items));
    },
    adicionarFavoritoGlobal(state, action) {
      const { carta, username } = action.payload;
      // Verifica se ESTE usuário já favoritou ESTA carta
      const jaExiste = state.items.some((f) => f.nome === carta.nome && f.owner === username);
      if (!jaExiste) {
        state.items.push({ ...carta, owner: username }); // Anexa o dono à carta
        localStorage.setItem(FAVORITOS_KEY, JSON.stringify(state.items));
      }
    }
  }
});

export const { removerFavoritoGlobal, adicionarFavoritoGlobal } = favoritosSlice.actions;
export default favoritosSlice.reducer;