import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  base: './',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React framework
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // Charting libraries (heavy)
          'charts': ['chart.js', 'react-chartjs-2'],
          // D3 for 3D graph
          'd3': ['d3'],
          // Icons
          'icons': ['lucide-react'],
        },
      },
    },
    chunkSizeWarningLimit: 500,
  },
})
