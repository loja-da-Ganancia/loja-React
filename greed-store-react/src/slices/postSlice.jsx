import { createSlice } from '@reduxjs/toolkit';
import { apiFetch } from '../api';
import { showToastAsync } from './uiSlice'; // Reaproveitando para dar feedback visual

const initialState = {
  items: [],
};

export const postSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    // Reducers agora atuam apenas na memória, sem localStorage
    setPostsCarregados: (state, action) => {
      state.items = action.payload;
    },
    addPostLocal: (state, action) => {
      // Coloca o post novo no topo da lista (início do vetor)
      state.items.unshift(action.payload);
    },
    deletePostLocal: (state, action) => {
      const postId = action.payload;
      state.items = state.items.filter((p) => p.id !== postId);
    },
    editPostLocal: (state, action) => {
      const { id, content, title } = action.payload;
      const index = state.items.findIndex((p) => p.id === id);
      if (index !== -1) {
        if (content) state.items[index].content = content;
        if (title) state.items[index].title = title;
      }
    }
  }
});

// Ações internas exportadas caso precise
export const { setPostsCarregados, addPostLocal, deletePostLocal, editPostLocal } = postSlice.actions;

// ----------------------------------------------------
// THUNKS ASSÍNCRONOS (Comunicação com MongoDB)
// ----------------------------------------------------

// 1. Buscar todos os posts
export const fetchPostsThunk = () => async (dispatch) => {
  try {
    const response = await apiFetch('/api/posts');
    if (response.ok) {
      const data = await response.json();
      
      // Tradução do _id do banco para o id que a interface usa
      const postsFormatados = data.map(p => ({
        id: p._id,
        title: p.title,
        content: p.content,
        author: p.author?.username || p.author || 'Anônimo', 
        createdAt: p.createdAt,
        deckId: p.deckId || p.deck // 👉 ADICIONADO: Mantém o elo de ligação
      }));
      
      dispatch(setPostsCarregados(postsFormatados));
    }
  } catch (error) {
    console.error("Erro ao buscar posts:", error);
  }
};

// 2. Criar um novo post
export const createPostThunk = (postData) => async (dispatch, getState) => {
  const currentUser = getState().user.currentUser;
  
  if (!currentUser?.token) {
    dispatch(showToastAsync('⚠️ Você precisa estar logado para postar.', 'warning'));
    return;
  }

  try {
    const response = await apiFetch('/api/posts', {
      method: 'POST',
      body: postData, // Esperado: { title: "...", content: "..." }
      token: currentUser.token
    });

    if (response.ok) {
      const savedPost = await response.json();
      
      // Formata a resposta para o front-end
      const postFormatado = {
        id: savedPost._id,
        title: savedPost.title,
        content: savedPost.content,
        author: currentUser.username, 
        createdAt: savedPost.createdAt,
        deckId: savedPost.deckId || savedPost.deck // 👉 ADICIONADO: Mantém o elo de ligação
      };
      
      dispatch(addPostLocal(postFormatado));
      dispatch(showToastAsync('✔️ Post publicado!', 'success'));
    } else {
      throw new Error();
    }
  } catch (error) {
    dispatch(showToastAsync('❌ Erro ao publicar o post.', 'error'));
  }
};

// 3. Editar um post existente
export const updatePostThunk = (id, postData) => async (dispatch, getState) => {
  const token = getState().user.currentUser?.token;
  if (!token) return;

  try {
    const response = await apiFetch(`/api/posts/${id}`, {
      method: 'PUT',
      body: postData,
      token
    });

    if (response.ok) {
      dispatch(editPostLocal({ id, ...postData }));
      dispatch(showToastAsync('✔️ Post atualizado!', 'success'));
    } else {
      throw new Error();
    }
  } catch (error) {
    dispatch(showToastAsync('❌ Erro ao atualizar o post.', 'error'));
  }
};

// 4. Deletar um post
export const deletePostThunk = (id) => async (dispatch, getState) => {
  const token = getState().user.currentUser?.token;
  if (!token) return;

  try {
    const response = await apiFetch(`/api/posts/${id}`, {
      method: 'DELETE',
      token
    });

    if (response.ok) {
      dispatch(deletePostLocal(id));
      dispatch(showToastAsync('✔️ Post excluído com sucesso.', 'success'));
    } else {
      throw new Error();
    }
  } catch (error) {
    dispatch(showToastAsync('❌ Erro ao tentar excluir.', 'error'));
  }
};

// Atalhos de compatibilidade (para não quebrar as telas que já usavam os nomes antigos)
export const addPost = createPostThunk;
export const editPost = updatePostThunk;
export const deletePost = deletePostThunk;

export default postSlice.reducer;