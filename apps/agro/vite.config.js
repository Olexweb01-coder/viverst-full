import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { routeHeads } from '../../packages/ui/build/routeHeads.js'
import { ROUTE_HEADS } from './src/community/seo.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const pkg = (n) => path.resolve(here, '../../packages', n)

export default defineConfig(() => ({
  /* routeHeads gives /community and /community/privacy their own <head> in
     the built files, for search engines and link previews. See the plugin. */
  plugins: [react(), routeHeads(ROUTE_HEADS)],
  resolve: {
    alias: {
      '@viverst/ui': path.join(pkg('ui'), 'src'),
      '@viverst/brand': path.join(pkg('brand'), 'src'),
      '@brand-assets': path.join(pkg('brand'), 'assets'),
    },
  },
  build: { reportCompressedSize: false },
}))
