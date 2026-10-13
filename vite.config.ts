import { defineConfig } from 'vite';

// base relativa para que funcione publicado en GitHub Pages (subcarpeta del repo)
export default defineConfig({
  base: './',
  build: { target: 'es2020', chunkSizeWarningLimit: 900 },
});
