import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { basename, resolve } from 'path';
import { existsSync, readdirSync, readFileSync } from 'fs';
import dts from 'vite-plugin-dts';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';

// `SCHEMAS_DIR=<folder> yarn start` serves the schemas of a local folder instead of the ones from smartdatalake.ch
const schemasDir = process.env.SCHEMAS_DIR;
const schemasUrl = '/schemas/';

export default defineConfig(({ command }) => ({
  plugins: [
    react(),
    dts({ include: ['src/main.ts'] }),
    ...(command === 'serve' && schemasDir ? [serveLocalSchemas(resolve(schemasDir))] : [])
  ],
  define: command === 'serve' && schemasDir
    ? { 'import.meta.env.VITE_SCHEMAS_URL': JSON.stringify(schemasUrl) }
    : {},
  build: {
    lib: {
      entry: resolve(__dirname, 'src/main.ts'),
      formats: ['es']
    },
    rollupOptions: {
      plugins: [peerDepsExternal()],
      output: {
        assetFileNames: 'assets/[name][extname]',
        entryFileNames: '[name].js',
      }      
    },
    copyPublicDir: false
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    include: ['src/**/*.test.{ts,tsx}'] // the specs in tests/e2e are run by playwright, see playwright.config.ts
  }
}));

/**
 * Serves the json files of a local folder the way the deployed schema directory does: a request on the
 * directory itself returns the list of the file names, a request on a file its content. The folder is read
 * on every request, so added or changed schemas only need a reload of the page.
 */
function serveLocalSchemas(dir: string): Plugin {
  return {
    name: 'serve-local-schemas',
    configureServer(server) {
      server.middlewares.use(schemasUrl, (req, res, next) => {
        const requestedFile = decodeURIComponent((req.url ?? '/').split('?')[0].replace(/^\//, ''));
        const file = resolve(dir, basename(requestedFile));
        if (requestedFile !== '' && (requestedFile !== basename(requestedFile) || !existsSync(file))) {
          next();
          return;
        }
        res.setHeader('Content-Type', 'application/json');
        res.end(requestedFile === ''
          ? JSON.stringify(readdirSync(dir).filter(f => f.endsWith('.json')))
          : readFileSync(file));
      });
    }
  };
}
