import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// SatQuest frontend3 — cinematic Three.js rebuild.
// Keeps API compatibility: /api/* is proxied to the NestJS backend in dev,
// and resolved relative to the host (or VITE_API_URL) in production.
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'icon.svg',
        'apple-touch-icon.png',
        'icon-192.png',
        'icon-512.png',
        'icon-maskable-512.png',
        'favicon-32.png',
        'favicon-16.png',
      ],
      manifest: {
        name: 'SatQuest – Learn Bitcoin',
        short_name: 'SatQuest',
        description: 'A cinematic Bitcoin learning experience. Stack real sats.',
        theme_color: '#050505',
        background_color: '#050505',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          { src: '/icon-192.png',          sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icon-512.png',          sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: '/apple-touch-icon.png',  sizes: '180x180', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webp,woff2}'],
      },
    }),
  ],
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
