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

/** Trocar role de usuário (Admin): PUT /api/users/:id/role */
export const toggleUserRoleAsync = createAsyncThunk(
  'user/toggleUserRoleAsync',
  async (id, thunkAPI) => {
    const token = thunkAPI.getState().user.currentUser?.token;
    const response = await apiFetch(`/api/users/${id}/role`, {
      method: 'PUT',
      token
    });
    if (!response.ok) {
      const error = await response.json();
      return thunkAPI.rejectWithValue(error.error);
    }
    return response.json(); // Retorna o user atualizado
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
        const targetId = updated._id || updated.id;
        
        // 1. Atualiza o usuário na lista global (tabela do admin)
        const idx = state.allUsers.findIndex((u) => (u._id || u.id) === targetId);
        if (idx !== -1) state.allUsers[idx] = updated;

        // 2. SINCRONIZAÇÃO DE SEGURANÇA: Se você se despromoveu, atualiza sua sessão
        const currentUserId = state.currentUser?.id || state.currentUser?._id;
        if (currentUserId && String(currentUserId) === String(targetId)) {
          state.currentUser.role = updated.role;
          sessionStorage.setItem(SESSION_KEY, JSON.stringify(state.currentUser));
        }
      })
      .addCase(toggleUserRoleAsync.rejected, (state, action) => {
        state.error = action.payload || action.error.message;
      });

    // ----- deleteUserAsync -----
    builder
      .addCase(deleteUserAsync.fulfilled, (state, action) => {
        const deletedUserId = action.payload;
        
        // 1. Remove da lista global (tabela do admin)
        state.allUsers = state.allUsers.filter(
          (u) => String(u._id || u.id) !== String(deletedUserId)
        );

        // 2. SINCRONIZAÇÃO DE SEGURANÇA: Se deletou a própria conta, desloga na hora
        const currentUserId = state.currentUser?.id || state.currentUser?._id;
        if (currentUserId && String(currentUserId) === String(deletedUserId)) {
          state.currentUser = null;
          sessionStorage.removeItem(SESSION_KEY);
        }
      })
      .addCase(deleteUserAsync.rejected, (state, action) => {
        state.error = action.payload || action.error.message;
      });
  },
});

export const { logoutUser, updateUser, toggleUserRole, deleteUser } =
  userSlice.actions;
export default userSlice.reducer;