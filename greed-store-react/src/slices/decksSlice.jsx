import { createSlice } from '@reduxjs/toolkit';
import { showToastAsync } from './uiSlice';

const STORAGE_KEY = 'greedstore_decks';

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
    // Carrega a coleção de decks persistida e atualiza a referência de usuário
    loadDecksFromStorage(state) {
      const dados = localStorage.getItem(STORAGE_KEY);
      let decks = dados ? JSON.parse(dados) : [];
      const currentUser = getCurrentUsername();
      
      let modificacaoNecessaria = false;
      decks = decks.map((deck) => {
        if (!deck.owner) {
          modificacaoNecessaria = true;
          return { ...deck, owner: currentUser };
        }
        return deck;
      });
      
      if (modificacaoNecessaria) localStorage.setItem(STORAGE_KEY, JSON.stringify(decks));
      state.decksSalvos = decks;
    },
    // Cria uma nova instância vazia de deck no modo construtor
    startNewDeck(state) {
      const currentUser = getCurrentUsername();
      let count = 1;
      let novoNome = `Novo Deck ${count}`;
      while (state.decksSalvos.some((d) => d.owner === currentUser && d.nome.toLowerCase() === novoNome.toLowerCase())) {
        count++;
        novoNome = `Novo Deck ${count}`;
      }

      state.deckAtual = { id: gerarId(), nome: novoNome, cartas: [], owner: currentUser };
      state.isEditing = true;
    },
    // Encerra a manipulação do deck atual
    closeCurrentDeck(state) {
      state.deckAtual = null;
      state.isEditing = false;
    },
    // Define um deck pré-existente como ativo na área de trabalho
    setCurrentDeck(state, action) {
      state.deckAtual = action.payload.deck;
      state.isEditing = action.payload.isEditing;
    },
    // Alterna o estado de proteção contra sobreescrita do deck
    toggleEditingStatus(state, action) {
      state.isEditing = action.payload;
    },
    // Modifica a propriedade "nome" do objeto de deck armazenado no estado
    renameDeck(state, action) {
      if (state.deckAtual) state.deckAtual.nome = action.payload;
    },
    // Insere um objeto iterável de carta na lista do deck
    pushCard(state, action) {
      state.deckAtual.cartas.push(action.payload);
    },
    // Remove um elemento do array baseando-se no seu índice numérico
    removeCard(state, action) {
      state.deckAtual.cartas.splice(action.payload, 1);
    },
    // Consolida o array em memória para a estrutura estática do localStorage
    syncDecks(state, action) {
      state.decksSalvos = action.payload;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(action.payload));
    }
  }
});

export const { 
  loadDecksFromStorage, startNewDeck, closeCurrentDeck, setCurrentDeck, 
  toggleEditingStatus, renameDeck, pushCard, removeCard, syncDecks 
} = decksSlice.actions;

// ----------------------------------------------------
// THUNKS COMPLEXOS (Validações de Regra de Negócio)
// ----------------------------------------------------

export const saveDeckThunk = () => (dispatch, getState) => {
  const { deckAtual, decksSalvos } = getState().decks;
  if (!deckAtual) return;

  const currentUser = getCurrentUsername();
  const jaExiste = decksSalvos.some((d) => d.owner === currentUser && d.nome.toLowerCase() === deckAtual.nome.toLowerCase() && d.id !== deckAtual.id);
  
  if (jaExiste) {
    dispatch(showToastAsync('⚠️ Já existe um deck salvo com este nome! Renomeie antes de salvar.', 'warning'));
    return;
  }

  let novosDecks = [...decksSalvos];
  const index = novosDecks.findIndex((d) => d.id === deckAtual.id);
  
  if (index !== -1) novosDecks[index] = deckAtual;
  else novosDecks.push(deckAtual);

  dispatch(syncDecks(novosDecks));
  dispatch(closeCurrentDeck());
  dispatch(showToastAsync(`✔️ Deck "${deckAtual.nome}" guardado no Banco de Dados!`, 'success'));
};

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

export const deleteDeckThunk = (deckId) => (dispatch, getState) => {
  const { decksSalvos, deckAtual } = getState().decks;
  let novosDecks = decksSalvos.filter((d) => d.id !== deckId);
  
  if (deckAtual && deckAtual.id === deckId) {
    dispatch(closeCurrentDeck());
  }
  dispatch(syncDecks(novosDecks));
  dispatch(showToastAsync('Deck excluído com sucesso.', 'success'));
};

export default decksSlice.reducer;