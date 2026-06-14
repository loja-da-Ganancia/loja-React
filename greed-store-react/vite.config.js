import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/loja-React/',
  test: {
    environment: 'node',
    globals: true,
    reporters: ['verbose', 'html'],
    outputFile: 'relatorio-testes.html',
  },
})