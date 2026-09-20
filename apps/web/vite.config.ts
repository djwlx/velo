import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': `${import.meta.dirname}/src`,
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return;
          if (id.includes('node_modules/zod/')) return 'zod';
          if (
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/react/') ||
            id.includes('node_modules/scheduler/')
          )
            return 'react';
        },
      },
    },
  },
});
