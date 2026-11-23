import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// During local dev (npm run dev), proxy API calls to the backend so the
// browser can call relative /api/... URLs without CORS juggling.
// In production the compiled app is served by server.js, which injects
// the real backend URL as window.__CONFIG__ (see index.html / server.js).
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': process.env.VITE_DEV_API_URL || 'http://localhost:3000',
    },
  },
});
