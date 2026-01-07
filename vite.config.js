import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/sakenowa-data': {
        target: 'https://muro.sakenowa.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/sakenowa-data/, '/sakenowa-data'),
      },
    },
  },
})