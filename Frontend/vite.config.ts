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
  server: {
    host: true,
    port: 3000,
    proxy: {
      '/api': {
        target: process.env.VITE_BACKEND_URL || 'http://localhost:5256',
        changeOrigin: true,
        secure: false,
      },
      '/hubs': {
        target: process.env.VITE_BACKEND_URL || 'http://localhost:5256',
        ws: true,
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
