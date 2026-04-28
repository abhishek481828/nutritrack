import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // Output to client/dist — Express serves this in production
  build: {
    outDir: 'dist',
    sourcemap: false,      // disable sourcemaps in production for security
    chunkSizeWarningLimit: 600,
  },

  // Dev server + proxy (only used during `npm run dev`)
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
