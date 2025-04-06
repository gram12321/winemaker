import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const excludeWinemakerOld = () => {
  return {
    name: 'exclude-winemaker-old',
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

export default defineConfig({
  plugins: [react(), excludeWinemakerOld()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5000,
    hmr: {
      clientPort: 443,
      protocol: 'wss',
    }
  },
  optimizeDeps: {
    entries: ['src/**/*.ts', 'src/**/*.tsx', 'index.html'],
    exclude: ['winemaker_old'],
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  }
});