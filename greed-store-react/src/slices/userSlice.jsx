import { createSlice } from '@reduxjs/toolkit';

const USERS_KEY = 'greedstore_users';
const SESSION_KEY = 'greedstore_session';

// Garante que o usuário admin sempre exista logo na partida do sistema
let initialUsers = JSON.parse(localStorage.getItem(USERS_KEY));
if (!initialUsers || initialUsers.length === 0) {
  initialUsers = [{ username: 'admin', password: 'admin', role: 'admin' }];
  localStorage.setItem(USERS_KEY, JSON.stringify(initialUsers));
}

export const userSlice = createSlice({
  name: 'user',
  initialState: {
    currentUser: sessionStorage.getItem(SESSION_KEY) ? JSON.parse(sessionStorage.getItem(SESSION_KEY)) : null,
    allUsers: initialUsers,
  },
  reducers: {
    loginUser: (state, action) => {
      const user = action.payload;
      state.currentUser = user;
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
    },
    registerUser: (state, action) => {
      const newUser = action.payload;
      state.allUsers.push(newUser);
      localStorage.setItem(USERS_KEY, JSON.stringify(state.allUsers));
    },
    updateUser: (state, action) => {
      const novosDados = action.payload;
      if (!state.currentUser) return;
      const nomeAntigo = state.currentUser.username;
      
      state.currentUser = { ...state.currentUser, ...novosDados };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(state.currentUser));

      const userIndex = state.allUsers.findIndex((u) => u.username === nomeAntigo);
      if (userIndex !== -1) {
        state.allUsers[userIndex] = { ...state.allUsers[userIndex], ...novosDados };
        localStorage.setItem(USERS_KEY, JSON.stringify(state.allUsers));
      }
    },
    logoutUser: (state) => {
      state.currentUser = null;
      sessionStorage.removeItem(SESSION_KEY);
    },
    toggleUserRole: (state, action) => {
      const username = action.payload;
      if (username === 'admin') return; 
      const userIndex = state.allUsers.findIndex((u) => u.username === username);
      if (userIndex !== -1) {
        state.allUsers[userIndex].role = state.allUsers[userIndex].role === 'admin' ? 'user' : 'admin';
        localStorage.setItem(USERS_KEY, JSON.stringify(state.allUsers));
      }
    },
    deleteUser: (state, action) => {
      const username = action.payload;
      if (username === 'admin') return; 
      state.allUsers = state.allUsers.filter((u) => u.username !== username);
      localStorage.setItem(USERS_KEY, JSON.stringify(state.allUsers));
    },
    // NOVO COMANDO: Acha o usuário e sobrescreve a senha
    resetUserPassword: (state, action) => {
      const { username, newPassword } = action.payload;
      const userIndex = state.allUsers.findIndex((u) => u.username === username);
      if (userIndex !== -1) {
        state.allUsers[userIndex].password = newPassword;
        localStorage.setItem(USERS_KEY, JSON.stringify(state.allUsers));
      }
    }
  }
});

export const { loginUser, registerUser, updateUser, logoutUser, toggleUserRole, deleteUser, resetUserPassword } = userSlice.actions;
export default userSlice.reducer;