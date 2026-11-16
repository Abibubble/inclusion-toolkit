import { defineConfig, devices } from '@playwright/test';

const PORT = 4174;
const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: './e2e-pages',
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  reporter: isCI ? [['github'], ['list']] : [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    ...devices['Desktop Chrome'],
  },
  webServer: {
    command: 'node scripts/serve-pages.ts',
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
