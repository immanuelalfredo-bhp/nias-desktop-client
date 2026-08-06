import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import copy from 'rollup-plugin-copy';
import { visualizer } from "rollup-plugin-visualizer";
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const sharedCommonEntry = resolve(__dirname, '../nias-shared/dist/index.common.js');

export default defineConfig({
  // Use relative asset URLs so renderer works from Electron file:// loading.
  base: './',
  resolve: {
    alias: {
      '@nias/shared': sharedCommonEntry,
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  assetsInclude: ['**/*.sql'],
  plugins: [
    visualizer({ open: true }),
    react(),
    electron([
      {
        // Main Process
        entry: 'electron/main/index.ts',
        vite: {
          resolve: {
            alias: {
              '@nias/shared': sharedCommonEntry,
            },
          },
          plugins: [
            copy({
              targets: [
                // Copies from project root/src/migrations to dist-electron/main/migrations
                { src: 'electron/main/db/migrations', dest: 'dist-electron/main' }
              ]
            })
          ],
          build: {
            outDir: 'dist-electron/main',
            lib: {
              entry: 'electron/main/index.ts',
              formats: ['cjs'], // FORCE CommonJS explicitly
              fileName: () => 'index.cjs',
            },
            emptyOutDir: true,
            rollupOptions: {
              external: [
                '@nias/shared/server',
                'better-sqlite3-multiple-ciphers',
              ],
              output: {
                format: 'cjs',
                entryFileNames: '[name].cjs',
              },
            },
          },
        },
      },
      {
        // Preload Script
        onstart(options) {
          options.reload();
        },
        vite: {
          resolve: {
            alias: {
              '@nias/shared': sharedCommonEntry,
            },
          },
          build: {
            outDir: 'dist-electron/preload',
            lib: {
              entry: 'electron/preload/index.ts',
              formats: ['cjs'], // FORCE CommonJS explicitly
              fileName: () => 'index.cjs',
            },
            emptyOutDir: true,
            rollupOptions: {
              external: ['electron'],
              output: {
                format: 'cjs',
                entryFileNames: '[name].cjs',
              },
            },
          },
        },
      },
    ]),
  ],
});