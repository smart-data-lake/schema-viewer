import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { buildFixtureSchemas } from './tests/e2e/fixtures/schemas';

/**
 * Vite config for the end-to-end tests, started by playwright.config.ts.
 *
 * It serves the same dev harness as `yarn start` (src/index.tsx), but with the schemas coming from the
 * fixtures instead of from smartdatalake.ch, so that the tests neither depend on the network nor on
 * whatever schema versions happen to be deployed.
 */

const schemasUrl = '/schemas/';

export default defineConfig({
  plugins: [
    react(),
    serveFixtureSchemas()
  ],
  define: {
    'import.meta.env.VITE_SCHEMAS_URL': JSON.stringify(schemasUrl)
  }
});

/**
 * Serves the fixture schemas the way the deployed schema directory does: a request on the directory
 * itself returns the list of the available file names, a request on a file its content.
 */
function serveFixtureSchemas(): Plugin {
  const schemas = buildFixtureSchemas();
  return {
    name: 'serve-fixture-schemas',
    configureServer(server) {
      server.middlewares.use(schemasUrl, (req, res, next) => {
        const requestedFile = decodeURIComponent((req.url ?? '/').split('?')[0].replace(/^\//, ''));
        const content = requestedFile === '' ? Object.keys(schemas) : schemas[requestedFile];
        if (!content) {
          next();
          return;
        }
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(content));
      });
    }
  };
}
