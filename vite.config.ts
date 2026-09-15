import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath } from 'node:url'

const base = process.env.GITHUB_ACTIONS ? '/chaser-mobile/' : '/'

export default defineConfig({
  base,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['icons/icon.svg'],
      manifest: {
        name: 'Chaser Mobile', short_name: 'Chaser Mobile', description: 'Companion não oficial de Grand Chase Mobile',
        theme_color: '#090d18', background_color: '#090d18', display: 'standalone', start_url: base, lang: 'pt-BR',
        icons: [{ src: 'icons/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }]
      },
      workbox: {
        navigateFallback: `${base}index.html`,
        globPatterns: ['**/*.{js,css,html,svg,webp,json}'],
        runtimeCaching: [{ urlPattern: /\/data\/.*\.json$/, handler: 'StaleWhileRevalidate', options: { cacheName: 'gcdc-data' } }]
      }
    })
  ],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  build: {
    target: 'es2022', sourcemap: true,
    rollupOptions: { output: { manualChunks: { react: ['react','react-dom'], router: ['@tanstack/react-router'], storage: ['dexie','zustand'], validation: ['zod'], icons: ['lucide-react'] } } }
  }
})
