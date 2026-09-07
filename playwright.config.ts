import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end tests, which drive the dev harness (src/App.tsx) in a real browser. The schemas are served
 * from the fixtures by the dev server started below, see vite.config.e2e.ts.
 *
 * A real browser is needed because the graph is drawn by d3 into an SVG and depends on layout
 * measurements (see src/setupTests.ts for the geometry APIs jsdom is missing).
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }]]
    : [['list']],
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    // the share button writes the link to the clipboard, which the link spec reads back
    permissions: ['clipboard-read', 'clipboard-write'],
    ...devices['Desktop Chrome'],
    // a large viewport gives the tree enough room that nodes stay clickable without panning
    viewport: { width: 1600, height: 1000 }
  },
  projects: [
    { name: 'chromium' }
  ],
  webServer: {
    command: 'yarn vite --config vite.config.e2e.ts --port 3000 --strictPort',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  }
});
