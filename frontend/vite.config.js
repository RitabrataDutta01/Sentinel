import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  base: './',
  plugins: [
    react(),
    tailwindcss()
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react'
            }
            if (id.includes('@radix-ui')) {
              return 'vendor-radix'
            }
            if (id.includes('recharts') || id.includes('d3-')) {
              return 'vendor-charts'
            }
            if (id.includes('@supabase') || id.includes('@tanstack/react-query')) {
              return 'vendor-supabase'
            }
            if (id.includes('axios') || id.includes('clsx') || id.includes('tailwind-merge') ||
                id.includes('class-variance-authority') || id.includes('lucide-react') ||
                id.includes('framer-motion') || id.includes('sonner')) {
              return 'vendor-utils'
            }
            return 'vendor-other'
          }
        },
      },
    },
  },
})
