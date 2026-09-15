import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const pkg = (n) => path.resolve(here, '../../packages', n)

export default defineConfig(({ mode }) => ({
  plugins: [react(), ...(mode === 'singlefile' ? [viteSingleFile()] : [])],
  resolve: {
    alias: {
      '@viverst/ui': path.join(pkg('ui'), 'src'),
      '@viverst/brand': path.join(pkg('brand'), 'src'),
      '@brand-assets': path.join(pkg('brand'), 'assets'),
    },
  },
  build: mode === 'singlefile'
    ? { assetsInlineLimit: 100_000_000, cssCodeSplit: false, reportCompressedSize: false }
    : { reportCompressedSize: false },
}))
