import { defineConfig } from 'vite';

// Chemins relatifs : le jeu marche à la racine en local et sous /kotodama/ sur GitHub Pages.
export default defineConfig({
  base: './',
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 2000,
  },
});
