import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const pkg = (n) => path.resolve(here, '../../packages', n)

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    ...(mode === 'test' ? [] : [VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png'],
      manifest: {
        name: 'Viverst Admin',
        short_name: 'Viverst',
        description: 'Run the Viverst shop, stock, orders and content.',
        start_url: '/',
        display: 'standalone',
        background_color: '#f5faff',
        theme_color: '#06065d',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // app shell is cached; data always comes live from Supabase
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        runtimeCaching: [{ urlPattern: /supabase\.co/, handler: 'NetworkOnly' }],
      },
    })]),
  ],
  resolve: {
    alias: {
      '@viverst/brand': path.join(pkg('brand'), 'src'),
      '@brand-assets': path.join(pkg('brand'), 'assets'),
      // the headless test swaps the real client for a canned one
      ...(mode === 'test' ? { '@supabase/supabase-js': path.resolve(here, 'test/supabase-mock.js') } : {}),
    },
  },
  build: { reportCompressedSize: false },
}))
