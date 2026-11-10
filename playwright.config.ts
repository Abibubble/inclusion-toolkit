import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;
const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  reporter: isCI
    ? [['github'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
  },
  // Firefox and WebKit skip tests tagged @every-page, which test every toolkit resource when a
  // sample is enough (see e2e/support/routes.ts). `pnpm commit:check` skips them in Chromium too,
  // and CI's Chromium run tests every page
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] }, grepInvert: /@every-page/ },
    { name: 'webkit', use: { ...devices['Desktop Safari'] }, grepInvert: /@every-page/ },
  ],
  // Tests run against the production build, so they see exactly what visitors get.
  webServer: {
    // The tests build the site themselves, so `pnpm commit:check` doesn't build it as well
    command: 'pnpm build && pnpm preview',
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !isCI,
    timeout: 120_000,
  },
});
