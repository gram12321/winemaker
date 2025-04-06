import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

// Special method to exclude entire directory trees
const excludeWinemakerOld = () => {
  return {
    name: 'exclude-winemaker-old',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url && req.url.includes('winemaker_old')) {
          res.statusCode = 404;
          res.end();
          return;
        }
        next();
      });
    },
    resolveId(id) {
      if (id.includes('winemaker_old')) {
        return { id: 'virtual:empty-module', external: true };
      }
      return null;
    },
    load(id) {
      if (id === 'virtual:empty-module') {
        return 'export default {}';
      }
      return null;
    },
  };
};

// Configuration
export default defineConfig({
  plugins: [
    react(),
    excludeWinemakerOld(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Force ignore our old project - fix the wildcard pattern
  optimizeDeps: {
    entries: ['src/**/*.ts', 'src/**/*.tsx', 'index.html'],
    exclude: ['winemaker_old'],
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true, 
  },
});