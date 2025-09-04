import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
    'process.env': {},
    'process.platform': '"browser"',
    'process.version': '"v18.0.0"',
    'require': '((id) => { throw new Error(`Module "${id}" not found in browser environment`); })',
    '__dirname': '""',
    '__filename': '""',
  },
  resolve: {
    alias: {
      buffer: 'buffer',
      process: 'process/browser',
      util: 'util',
    },
  },
  optimizeDeps: {
    include: ['buffer', 'process', 'util', 'tesseract.js'],
    exclude: ['pdfjs-dist'] // Exclude heavy deps from pre-bundling
  },
  esbuild: {
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : []
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          supabase: ['@supabase/supabase-js'],
          ui: ['lucide-react', 'react-toastify'],
          ocr: ['tesseract.js'],
          pdf: ['pdfjs-dist'],
          ai: ['@google/generative-ai']
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    assetsInlineLimit: 4096 // Inline assets smaller than 4kb
  }
})
