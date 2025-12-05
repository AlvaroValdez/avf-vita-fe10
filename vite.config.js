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
        'zlib',
      ]
    },
    sourcemap: false, // Desactiva la generación de mapas de fuente
    chunkSizeWarningLimit: 1600, // Aumenta el límite de aviso (opcional, reduce ruido)
  },
  define: {
    global: 'globalThis',
  }
})