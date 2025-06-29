import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Optimizări pentru dezvoltare
  server: {
    hmr: {
      overlay: false, // Dezactivează overlay-ul HMR pentru performanță mai bună
    },
    watch: {
      usePolling: false, // Dezactivează polling pentru a reduce utilizarea CPU
    },
  },
  // Optimizări pentru build
  build: {
    target: 'esnext', // Folosește sintaxa modernă pentru bundle mai mic
    minify: 'esbuild', // Folosește esbuild pentru minificare mai rapidă
  },
  // Optimizări pentru Electron
  optimizeDeps: {
    exclude: ['electron'], // Exclude electron din optimizarea dependențelor
  }
})
