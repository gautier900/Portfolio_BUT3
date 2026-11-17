import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // Chemins relatifs : le site fonctionne à la racine d'un domaine comme dans un sous-dossier
  // (https://gautier900.github.io/Portfolio_BUT3/).
  base: './',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      { find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) },
      // Les composants Skiper UI sont écrits pour Next.js : leurs imports
      // next/link et next/image sont redirigés vers de simples <a> et <img>.
      { find: /^next\/link$/, replacement: fileURLToPath(new URL('./src/lib/next/link.tsx', import.meta.url)) },
      { find: /^next\/image$/, replacement: fileURLToPath(new URL('./src/lib/next/image.tsx', import.meta.url)) },
    ],
  },
  server: { port: 5500 },
  preview: { port: 5500 },
});
