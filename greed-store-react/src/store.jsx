import { configureStore } from '@reduxjs/toolkit';

import userReducer from './slices/userSlice'; 
import postReducer from './slices/postSlice';
import uiReducer from './slices/uiSlice';
import searchReducer from './slices/searchSlice';
import decksReducer from './slices/decksSlice';

// Nova importação
import favoritosReducer from './slices/favoritosSlice';

export const store = configureStore({
  reducer: {
    user: userReducer,
    posts: postReducer,
    ui: uiReducer,
    search: searchReducer,
    decks: decksReducer,
    // Acoplamento da gaveta de favoritos
    favoritos: favoritosReducer,
  },
});