import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: [],
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
            src: '/pwa-192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
          },
          {
            src: '/pwa-512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
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