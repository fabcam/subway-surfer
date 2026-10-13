import { defineConfig } from 'vite';

// base relativa para que funcione publicado en GitHub Pages (subcarpeta del repo)
export default defineConfig({
  base: './',
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 900,
    // Los sonidos son chiquitos: van dentro del juego, así carga todo de una vez y anda sin internet
    assetsInlineLimit: 16 * 1024,
  },
});
