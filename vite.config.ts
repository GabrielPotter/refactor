import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  root: resolve(__dirname, 'src/renderer'),
  base: '/gui/',
  plugins: [react()],
  build: {
    outDir: resolve(__dirname, 'dist/gui'),
    emptyOutDir: true
  },
  server: {
    port: 5173
  }
});
