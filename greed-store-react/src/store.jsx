import { configureStore } from '@reduxjs/toolkit';
import userReducer from './pages/userSlice'; 
import postReducer from './pages/postSlice'; // <-- Nova ligação

export const store = configureStore({
  reducer: {
    user: userReducer,
    posts: postReducer, // <-- Nova gaveta de dados
  },
});