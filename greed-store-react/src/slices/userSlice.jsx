import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiFetch } from '../api';

const SESSION_KEY = 'greedstore_session';

// ============================================================
// THUNKS ASSÍNCRONOS — comunicam com o backend real (MongoDB)
// ============================================================

/** Login: POST /api/auth/login */
export const loginUserAsync = createAsyncThunk(
  'user/loginUserAsync',
  async ({ username, password }, thunkAPI) => {
    const response = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: { username, password },
    });
    if (!response.ok) {
      const error = await response.json();
      return thunkAPI.rejectWithValue(error.error || 'Falha no login');
    }
    return response.json(); // { token, user }
  }
);

/** Cadastro: POST /api/auth/register */
export const registerUserAsync = createAsyncThunk(
  'user/registerUserAsync',
  async ({ username, email, password }, thunkAPI) => {
    const response = await apiFetch('/api/auth/register', {
      method: 'POST',
      body: { username, email, password },
    });
    if (!response.ok) {
      const error = await response.json();
      return thunkAPI.rejectWithValue(error.error || 'Falha no cadastro');
    }
    return response.json(); // { token, user }
  }
);

/** Buscar todos os usuários (Admin): GET /api/users */
export const fetchAllUsersAsync = createAsyncThunk(
  'user/fetchAllUsersAsync',
  async (_, thunkAPI) => {
    const state = thunkAPI.getState();
    const token = state.user.currentUser?.token;
    const response = await apiFetch('/api/users', { token });
    if (!response.ok) {
      const error = await response.json();
      return thunkAPI.rejectWithValue(error.error || 'Falha ao buscar usuários');
    }
    return response.json(); // array de users
  }
);

/** Atualizar perfil: PUT /api/users/:id */
export const updateUserAsync = createAsyncThunk(
  'user/updateUserAsync',
  async (updates, thunkAPI) => {
    const state = thunkAPI.getState();
    const currentUser = state.user.currentUser;
    if (!currentUser) return thunkAPI.rejectWithValue('Não autenticado');

    const response = await apiFetch(`/api/users/${currentUser.id}`, {
      method: 'PUT',
      body: updates,
      token: currentUser.token,
    });
    if (!response.ok) {
      const error = await response.json();
      return thunkAPI.rejectWithValue(error.error || 'Falha ao atualizar perfil');
    }
    return response.json(); // user atualizado
  }
);

/** Trocar role de usuário (Admin): PUT /api/users/:id */
export const toggleUserRoleAsync = createAsyncThunk(
  'user/toggleUserRoleAsync',
  async (userId, thunkAPI) => {
    const state = thunkAPI.getState();
    const token = state.user.currentUser?.token;
    const allUsers = state.user.allUsers;
    const targetUser = allUsers.find((u) => u._id === userId || u.id === userId);
    if (!targetUser) return thunkAPI.rejectWithValue('Usuário não encontrado');

    const newRole = targetUser.role === 'admin' ? 'user' : 'admin';
    const response = await apiFetch(`/api/users/${userId}`, {
      method: 'PUT',
      body: { role: newRole },
      token,
    });
    if (!response.ok) {
      const error = await response.json();
      return thunkAPI.rejectWithValue(error.error || 'Falha ao alterar papel');
    }
    return response.json(); // user atualizado
  }
);

/** Deletar usuário (Admin): DELETE /api/users/:id */
export const deleteUserAsync = createAsyncThunk(
  'user/deleteUserAsync',
  async (userId, thunkAPI) => {
    const state = thunkAPI.getState();
    const token = state.user.currentUser?.token;
    const response = await apiFetch(`/api/users/${userId}`, {
      method: 'DELETE',
      token,
    });
    if (!response.ok) {
      const error = await response.json();
      return thunkAPI.rejectWithValue(error.error || 'Falha ao deletar usuário');
    }
    return userId;
  }
);

// ============================================================
// SLICE
// ============================================================
export const userSlice = createSlice({
  name: 'user',
  initialState: {
    currentUser: sessionStorage.getItem(SESSION_KEY)
      ? JSON.parse(sessionStorage.getItem(SESSION_KEY))
      : null,
    allUsers: [],
    status: 'idle',
    error: null,
  },
  reducers: {
    /** Logout local — limpa sessão */
    logoutUser: (state) => {
      state.currentUser = null;
      sessionStorage.removeItem(SESSION_KEY);
    },
    /** Atualização local otimista (usado internamente pelos thunks) */
    updateUser: (state, action) => {
      if (!state.currentUser) return;
      state.currentUser = { ...state.currentUser, ...action.payload };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(state.currentUser));
    },
    // Mantidos por compatibilidade com Admin.jsx legado:
    toggleUserRole: (state, action) => {
      const userId = action.payload;
      const idx = state.allUsers.findIndex((u) => (u._id || u.id) === userId);
      if (idx !== -1) {
        state.allUsers[idx].role =
          state.allUsers[idx].role === 'admin' ? 'user' : 'admin';
      }
    },
    deleteUser: (state, action) => {
      const userId = action.payload;
      state.allUsers = state.allUsers.filter(
        (u) => (u._id || u.id) !== userId
      );
    },
  },
  extraReducers: (builder) => {
    // ----- loginUserAsync -----
    builder
      .addCase(loginUserAsync.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loginUserAsync.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const { token, user } = action.payload;
        state.currentUser = { ...user, token };
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(state.currentUser));
      })
      .addCase(loginUserAsync.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || action.error.message;
      });

    // ----- registerUserAsync -----
    builder
      .addCase(registerUserAsync.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(registerUserAsync.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const { token, user } = action.payload;
        state.currentUser = { ...user, token };
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(state.currentUser));
      })
      .addCase(registerUserAsync.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || action.error.message;
      });

    // ----- fetchAllUsersAsync -----
    builder
      .addCase(fetchAllUsersAsync.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchAllUsersAsync.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.allUsers = action.payload;
      })
      .addCase(fetchAllUsersAsync.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || action.error.message;
      });

    // ----- updateUserAsync -----
    builder
      .addCase(updateUserAsync.fulfilled, (state, action) => {
        const updatedUser = action.payload;
        // Mantém o token (a rota PUT não retorna token)
        state.currentUser = { ...state.currentUser, ...updatedUser };
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(state.currentUser));
      })
      .addCase(updateUserAsync.rejected, (state, action) => {
        state.error = action.payload || action.error.message;
      });

    // ----- toggleUserRoleAsync -----
    builder
      .addCase(toggleUserRoleAsync.fulfilled, (state, action) => {
        const updated = action.payload;
        const idx = state.allUsers.findIndex(
          (u) => (u._id || u.id) === (updated._id || updated.id)
        );
        if (idx !== -1) state.allUsers[idx] = updated;
      })
      .addCase(toggleUserRoleAsync.rejected, (state, action) => {
        state.error = action.payload || action.error.message;
      });

    // ----- deleteUserAsync -----
    builder
      .addCase(deleteUserAsync.fulfilled, (state, action) => {
        const userId = action.payload;
        state.allUsers = state.allUsers.filter(
          (u) => (u._id || u.id) !== userId
        );
      })
      .addCase(deleteUserAsync.rejected, (state, action) => {
        state.error = action.payload || action.error.message;
      });
  },
});

export const { logoutUser, updateUser, toggleUserRole, deleteUser } =
  userSlice.actions;
export default userSlice.reducer;
