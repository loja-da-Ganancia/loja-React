import { createSlice } from '@reduxjs/toolkit';
import { showToastAsync } from './uiSlice';
import { apiFetch } from '../api'; // Importando o mensageiro da API

// Funções puras de utilidade auxiliar
export const isExtraDeckCard = (type) => type && /fusion|synchro|xyz|link/i.test(type);
export const isSpell = (type) => type && /spell/i.test(type);
export const isTrap = (type) => type && /trap/i.test(type);
const gerarId = () => Date.now() + '-' + Math.random().toString(36).substr(2, 8);

export const getCurrentUsername = () => {
  const sessionData = sessionStorage.getItem('greedstore_session');
  try {
    return sessionData ? JSON.parse(sessionData).username : null;
  } catch {
    return null;
  }
};

const initialState = {
  decksSalvos: [],
  deckAtual: null,
  isEditing: false,
};

const decksSlice = createSlice({
  name: 'decks',
  initialState,
  reducers: {
    // Reducers agora apenas atualizam a memória RAM (estado), sem localStorage
    setDecksCarregados(state, action) {
      state.decksSalvos = action.payload;
    },
    startNewDeck(state) {
      const currentUser = getCurrentUsername();
      let count = 1;
      let novoNome = `Novo Deck ${count}`;
      while (state.decksSalvos.some((d) => d.owner === currentUser && d.nome.toLowerCase() === novoNome.toLowerCase())) {
        count++;
        novoNome = `Novo Deck ${count}`;
      }

      // O ID temporário gerado aqui servirá para identificar que é um deck novo na hora de salvar
      state.deckAtual = { id: gerarId(), nome: novoNome, cartas: [], owner: currentUser };
      state.isEditing = true;
    },
    closeCurrentDeck(state) {
      state.deckAtual = null;
      state.isEditing = false;
    },
    setCurrentDeck(state, action) {
      state.deckAtual = action.payload.deck;
      state.isEditing = action.payload.isEditing;
    },
    toggleEditingStatus(state, action) {
      state.isEditing = action.payload;
    },
    renameDeck(state, action) {
      if (state.deckAtual) state.deckAtual.nome = action.payload;
    },
    pushCard(state, action) {
      state.deckAtual.cartas.push(action.payload);
    },
    removeCard(state, action) {
      state.deckAtual.cartas.splice(action.payload, 1);
    },
    syncDeckLocal(state, action) {
      const deckAtualizado = action.payload;
      const index = state.decksSalvos.findIndex((d) => d.id === deckAtualizado.id);
      if (index !== -1) {
        state.decksSalvos[index] = deckAtualizado;
      } else {
        state.decksSalvos.push(deckAtualizado);
      }
    },
    removeDeckLocal(state, action) {
      state.decksSalvos = state.decksSalvos.filter((d) => d.id !== action.payload);
    }
  }
});

export const { 
  setDecksCarregados, startNewDeck, closeCurrentDeck, setCurrentDeck, 
  toggleEditingStatus, renameDeck, pushCard, removeCard, syncDeckLocal, removeDeckLocal 
} = decksSlice.actions;

// ----------------------------------------------------
// THUNKS ASSÍNCRONOS (Comunicação com MongoDB)
// ----------------------------------------------------

// 1. Buscar os decks armazenados na nuvem
export const fetchDecksThunk = () => async (dispatch, getState) => {
  const token = getState().user.currentUser?.token;
  if (!token) return;

  try {
    const response = await apiFetch('/api/decks', { token });
    if (response.ok) {
      const data = await response.json();
      
      
      // Traduz os termos em inglês do back-end para os termos que a interface já usa
      const decksFormatados = data.map(d => ({
        id: d._id,
        nome: d.title,
        cartas: d.cards || [],
        // Agora o backend manda o owner como um objeto { _id: "...", username: "Michael" }
        owner: d.owner ? d.owner.username : 'Desconhecido'
      }));
      
      dispatch(setDecksCarregados(decksFormatados));
    }
  } catch (error) {
    console.error("Erro ao buscar decks:", error);
  }
};

// 2. Criar ou Atualizar um deck
export const saveDeckThunk = () => async (dispatch, getState) => {
  const { deckAtual, decksSalvos } = getState().decks;
  const currentUser = getState().user.currentUser;

  if (!deckAtual) return;
  
  if (!currentUser) {
    dispatch(showToastAsync('⚠️ Você precisa estar logado para salvar.', 'warning'));
    return;
  }

  const jaExiste = decksSalvos.some((d) => d.owner === currentUser.username && d.nome.toLowerCase() === deckAtual.nome.toLowerCase() && d.id !== deckAtual.id);
  
  if (jaExiste) {
    dispatch(showToastAsync('⚠️ Já existe um deck salvo com este nome! Renomeie antes de salvar.', 'warning'));
    return;
  }

  try {
    // Prepara os dados com as palavras-chave que o Mongoose exige
    const payload = {
      title: deckAtual.nome,
      cards: deckAtual.cartas
    };

    // Identifica se é um deck novo pelo traço "-" do gerarId()
    const isNewDeck = String(deckAtual.id).includes('-');
    let response;

    if (isNewDeck) {
      response = await apiFetch('/api/decks', {
        method: 'POST',
        body: payload,
        token: currentUser.token
      });
    } else {
      response = await apiFetch(`/api/decks/${deckAtual.id}`, {
        method: 'PUT',
        body: payload,
        token: currentUser.token
      });
    }

    if (!response.ok) throw new Error('Erro na resposta do servidor');

    const savedDeck = await response.json();

    // Traduz o retorno do banco de volta para a interface
    const deckFormatado = {
      id: savedDeck._id,
      nome: savedDeck.title,
      cartas: savedDeck.cards || [],
      owner: currentUser.username
    };

    dispatch(syncDeckLocal(deckFormatado));
    dispatch(closeCurrentDeck());
    dispatch(showToastAsync(`✔️ Deck "${deckFormatado.nome}" guardado na nuvem!`, 'success'));

  } catch (error) {
    dispatch(showToastAsync('❌ Falha ao salvar o deck no servidor.', 'error'));
  }
};

// 3. Excluir o deck
export const deleteDeckThunk = (deckId) => async (dispatch, getState) => {
  const token = getState().user.currentUser?.token;
  
  try {
    const response = await apiFetch(`/api/decks/${deckId}`, {
      method: 'DELETE',
      token
    });

    if (!response.ok) throw new Error();

    dispatch(removeDeckLocal(deckId));
    
    const { deckAtual } = getState().decks;
    if (deckAtual && deckAtual.id === deckId) {
      dispatch(closeCurrentDeck());
    }
    dispatch(showToastAsync('Deck excluído da nuvem com sucesso.', 'success'));
  } catch (error) {
    dispatch(showToastAsync('❌ Erro ao tentar excluir o deck.', 'error'));
  }
};

// Thunk de validação (mantido original)
export const addCardThunk = (cartaAPI) => (dispatch, getState) => {
  const { deckAtual, isEditing } = getState().decks;

  if (!deckAtual) {
    dispatch(showToastAsync('⚠️ Crie ou carregue um deck primeiro!', 'warning'));
    return;
  }
  if (!isEditing) {
    dispatch(showToastAsync('⚠️ Você precisa clicar em "Editar Deck" para modificá-lo.', 'warning'));
    return;
  }

  const copiasAtuais = deckAtual.cartas.filter(c => c.nome === cartaAPI.name).length;
  if (copiasAtuais >= 3) {
    dispatch(showToastAsync(`⚠️ Limite atingido: Você já possui 3 cópias de "${cartaAPI.name}".`, 'warning'));
    return;
  }

  const ehExtra = isExtraDeckCard(cartaAPI.type);
  const extraCount = deckAtual.cartas.filter(c => isExtraDeckCard(c.type)).length;
  const mainCount = deckAtual.cartas.length - extraCount;

  if (ehExtra && extraCount >= 15) {
    dispatch(showToastAsync(`⚠️ Seu Extra Deck está cheio (Máx 15 cartas).`, 'warning'));
    return;
  }
  if (!ehExtra && mainCount >= 60) {
    dispatch(showToastAsync(`⚠️ Seu Main Deck está cheio (Máx 60 cartas).`, 'warning'));
    return;
  }

  const novaCartaFormatada = {
    id: cartaAPI.id,
    nome: cartaAPI.name,
    imagem: cartaAPI.card_images[0].image_url,
    preco: cartaAPI.card_prices?.[0]?.tcgplayer_price || '0.00',
    type: cartaAPI.type,
    desc: cartaAPI.desc
  };

  dispatch(pushCard(novaCartaFormatada));
  dispatch(showToastAsync(`➕ ${cartaAPI.name} adicionada!`, 'success'));
};

export const loadDecksFromStorage = fetchDecksThunk;

export default decksSlice.reducer;