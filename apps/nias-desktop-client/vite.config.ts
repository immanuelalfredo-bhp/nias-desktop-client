import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';

export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        // Main Process
        entry: 'electron/main/index.ts',
        vite: {
          build: {
            rollupOptions: {
              external: ['better-sqlite3-multiple-ciphers'],
            },
          },
        },
      },
      {
        // Preload Script
        entry: 'electron/preload/index.ts',
        onstart(options) {
          options.reload();
        },
      },
    ]),
  ],
});