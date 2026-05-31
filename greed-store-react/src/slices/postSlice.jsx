import { createSlice } from '@reduxjs/toolkit';

const DB_POSTS = 'greedstore_posts';

export const postSlice = createSlice({
  name: 'posts',
  initialState: {
    // Puxa os posts salvos no momento em que o sistema liga
    items: JSON.parse(localStorage.getItem(DB_POSTS)) || [],
  },
  reducers: {
    addPost: (state, action) => {
      const novoPost = action.payload;
      // Coloca o post novo no topo da lista (início do vetor)
      state.items.unshift(novoPost);
      localStorage.setItem(DB_POSTS, JSON.stringify(state.items));
    },
    deletePost: (state, action) => {
      const postId = action.payload;
      state.items = state.items.filter((p) => p.id !== postId);
      localStorage.setItem(DB_POSTS, JSON.stringify(state.items));
    },
    editPost: (state, action) => {
      const { id, content } = action.payload;
      const index = state.items.findIndex((p) => p.id === id);
      if (index !== -1) {
        state.items[index].content = content;
        localStorage.setItem(DB_POSTS, JSON.stringify(state.items));
      }
    }
  }
});

export const { addPost, deletePost, editPost } = postSlice.actions;
export default postSlice.reducer;