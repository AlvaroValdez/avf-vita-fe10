// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      external: [
        'fs',
        'path', 
        'url',
        'http',
        'https',
        'stream',
        'util',
        'os',
        'child_process',
        'crypto',
        'buffer',
        'querystring',
        'zlib'
      ]
    }
  },
  define: {
    global: 'globalThis',
  }
})