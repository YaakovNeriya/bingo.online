import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-core': ['react', 'react-dom', 'react-router-dom'],
          'ui-icons': ['lucide-react'],
          'ui-carousel': ['embla-carousel-react', 'embla-carousel-autoplay'],
          'ui-tools': ['react-datepicker', 'react-zoom-pan-pinch'],
          'media-tools': ['browser-image-compression'],
          'utils-vendor': ['date-fns', 'axios'],
          'auth-vendor': ['@react-oauth/google'],
          'sentry': ['@sentry/react']
        }
      }
    }
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://backend:8000',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://backend:8000',
        changeOrigin: true
      }
    }
  },
});
