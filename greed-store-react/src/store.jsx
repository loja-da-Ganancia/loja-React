import { configureStore } from '@reduxjs/toolkit';

// Importação dos módulos (slices)
import userReducer from './slices/userSlice'; 
import postReducer from './slices/postSlice';
import uiReducer from './slices/uiSlice';
import searchReducer from './slices/searchSlice';
import decksReducer from './slices/decksSlice';
import favoritosReducer from './slices/favoritosSlice';
import affiliatesReducer from './slices/affiliateSlice';

export const store = configureStore({
  reducer: {
    user: userReducer,
    posts: postReducer,
    ui: uiReducer,
    search: searchReducer,
    decks: decksReducer,
    favoritos: favoritosReducer,
    affiliates: affiliatesReducer,
  },
});
