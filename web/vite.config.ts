import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';
import {
  formatChunkBudgetError,
  getOversizedAppChunks,
  type BuildBundle,
} from './src/build/chunk-budget';

const dirname = path.dirname(fileURLToPath(import.meta.url));

const nearbyfeedChunkBudgetPlugin = (): Plugin => ({
  name: 'nearbyfeed-chunk-budget',
  apply: 'build',
  generateBundle(_, bundle) {
    const oversizedChunks = getOversizedAppChunks(bundle as BuildBundle);

    if (oversizedChunks.length > 0) {
      this.error(formatChunkBudgetError(oversizedChunks));
    }
  },
});

export default defineConfig({
  plugins: [react(), nearbyfeedChunkBudgetPlugin()],
  resolve: {
    alias: {
      '@nearbyfeed/shared': path.resolve(dirname, '../packages/shared/src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/v1': 'http://127.0.0.1:8080',
    },
  },
  build: {
    chunkSizeWarningLimit: 2048,
    rollupOptions: {
      output: {
        manualChunks: {
          mapbox: ['mapbox-gl'],
          maplibre: ['maplibre-gl'],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/vitest.setup.ts',
  },
});
