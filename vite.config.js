import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['images/icon-192.png', 'images/icon-512.png'],
      manifest: {
        name: 'Sake App',
        short_name: 'Sake',
        description: 'あなたのおすすめの日本酒が見つかるサイト',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        theme_color: '#081a3a',
        background_color: '#000000',
        icons: [
          {
            src: '/images/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/images/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        navigateFallback: '/index.html',
      },
    }),
  ],
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