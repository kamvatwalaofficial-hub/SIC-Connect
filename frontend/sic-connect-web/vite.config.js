import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Optional dev proxy so the SPA can call /api directly during development.
      '/api': {
        target: process.env.VITE_API_PROXY_TARGET || 'https://localhost:5001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
