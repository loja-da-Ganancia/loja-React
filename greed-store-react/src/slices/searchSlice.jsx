import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const CARTAS_POR_PAGINA = 15;

// Thunk assíncrono encarregado de realizar a requisição HTTP para a API do YGOProDeck
export const fetchCartasAPI = createAsyncThunk(
  'search/fetchCartasAPI',
  async ({ termoBusca, paginaAlvo }, { rejectWithValue }) => {
    let url = `https://db.ygoprodeck.com/api/v7/cardinfo.php?language=pt&num=${CARTAS_POR_PAGINA}&offset=${paginaAlvo * CARTAS_POR_PAGINA}`;
    
    if (termoBusca && termoBusca.trim() !== '') {
      url += `&fname=${encodeURIComponent(termoBusca)}`;
    }

    try {
      const response = await fetch(url);
      if (response.status === 400) {
        return { data: [], total: 0 };
      }
      const data = await response.json();
      return { data: data.data || [], total: data.data ? data.data.length : 0 };
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

const initialState = {
  cartasPesquisa: [],
  termoBusca: '',
  paginaCartas: 0,
  carregandoCartas: false,
  totalRecebido: 0,
};

const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    // Atualiza os parâmetros de busca armazenados no estado global
    setParametrosBusca(state, action) {
      if (action.payload.termoBusca !== undefined) state.termoBusca = action.payload.termoBusca;
      if (action.payload.paginaCartas !== undefined) state.paginaCartas = action.payload.paginaCartas;
    }
  },
  // ExtraReducers lidam com as promessas geradas pelo Thunk de requisição
  extraReducers: (builder) => {
    builder
      .addCase(fetchCartasAPI.pending, (state) => {
        state.carregandoCartas = true;
      })
      .addCase(fetchCartasAPI.fulfilled, (state, action) => {
        state.carregandoCartas = false;
        state.cartasPesquisa = action.payload.data;
        state.totalRecebido = action.payload.total;
      })
      .addCase(fetchCartasAPI.rejected, (state) => {
        state.carregandoCartas = false;
        state.cartasPesquisa = [];
        state.totalRecebido = 0;
      });
  }
});

export const { setParametrosBusca } = searchSlice.actions;
export default searchSlice.reducer;