import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import nodePolyfills from 'rollup-plugin-node-polyfills';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      plugins: [nodePolyfills()],
    },
  },
  define: {
    global: 'window', // ✅ moved outside 'server'
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080', // your backend
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
