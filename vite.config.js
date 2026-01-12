// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  publicDir: 'public', // Ensure public files like _redirects are copied to dist
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
    // Asegurar que archivos de public se copien
    copyPublicDir: true
  },
  define: {
    global: 'globalThis',
  }
})