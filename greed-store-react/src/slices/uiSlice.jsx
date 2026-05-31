import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  telaAtual: 'menu', // 'menu', 'builder', 'visualizador'
  toastMsg: { texto: '', tipo: 'success', visivel: false }
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Reducer responsável por alternar as views principais do componente
    setTelaAtual(state, action) {
      state.telaAtual = action.payload;
    },
    // Reducer responsável por definir as propriedades da notificação
    setToast(state, action) {
      state.toastMsg = {
        texto: action.payload.texto,
        tipo: action.payload.tipo || 'success',
        visivel: true
      };
    },
    // Reducer responsável por ocultar a notificação
    hideToast(state) {
      state.toastMsg.visivel = false;
    }
  }
});

export const { setTelaAtual, setToast, hideToast } = uiSlice.actions;

// Thunk assíncrono para exibir a notificação e ocultá-la automaticamente após 2.5 segundos
export const showToastAsync = (texto, tipo) => (dispatch) => {
  dispatch(setToast({ texto, tipo }));
  setTimeout(() => {
    dispatch(hideToast());
  }, 2500);
};

export default uiSlice.reducer;