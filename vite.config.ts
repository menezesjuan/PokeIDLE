import { defineConfig, Plugin } from 'vite';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { handleApiRequest } = require('./server/api.cjs');

function sqliteApiPlugin(): Plugin {
  return {
    name: 'pokeidle-sqlite-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url && (req.url.startsWith('/api/') || req.url === '/api')) {
          try {
            const handled = await handleApiRequest(req, res);
            if (handled) return;
          } catch (e) {
            console.error('API Error in Vite Middleware:', e);
          }
        }
        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url && (req.url.startsWith('/api/') || req.url === '/api')) {
          try {
            const handled = await handleApiRequest(req, res);
            if (handled) return;
          } catch (e) {
            console.error('API Error in Preview Middleware:', e);
          }
        }
        next();
      });
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [sqliteApiPlugin()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
  },
  server: {
    port: 5173,
    open: false,
  },
});
