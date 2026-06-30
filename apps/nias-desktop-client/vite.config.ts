import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';

export default defineConfig({
  // Use relative asset URLs so renderer works from Electron file:// loading.
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  plugins: [
    react(),
    electron([
      {
        // Main Process
        entry: 'electron/main/index.ts',
        vite: {
          build: {
            outDir: 'dist-electron/main',
            lib: {
              entry: 'electron/main/index.ts',
              formats: ['cjs'], // FORCE CommonJS explicitly
              fileName: () => 'index.js',
            },
            emptyOutDir: true,
            rollupOptions: {
              external: ['better-sqlite3-multiple-ciphers', 'argon2'],
              output: {
                format: 'cjs',
                entryFileNames: '[name].js',
              },
            },
          },
        },
      },
      {
        // Preload Script
        entry: 'electron/preload/index.ts',
        onstart(options) {
          options.reload();
        },vite: {
          build: {
            outDir: 'dist-electron/preload',
            lib: {
              entry: 'electron/preload/index.ts',
              formats: ['cjs'], // FORCE CommonJS explicitly
              fileName: () => 'index.js',
            },
            emptyOutDir: true,
            rollupOptions: {
              external: ['electron'],
              output: {
                format: 'cjs',
                entryFileNames: '[name].js',
              },
            },
          },
        },
      },
    ]),
  ],
});