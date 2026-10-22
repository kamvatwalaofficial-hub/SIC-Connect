import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    // Public path the app is served from: "/" normally, "/SIC-Connect/" for the GitHub Pages
    // demo (set in .env.demo and used by `npm run build:demo`).
    base: env.VITE_BASE || '/',
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        // Optional dev proxy so the SPA can call /api directly during development.
        '/api': {
          target: env.VITE_API_PROXY_TARGET || 'https://localhost:5001',
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
