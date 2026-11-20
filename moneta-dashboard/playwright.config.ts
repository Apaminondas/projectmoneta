import { defineConfig } from '@playwright/test';

const baseURL = process.env.FRONTEND_URL || 'http://localhost:3000';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 2,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: 'list',
  snapshotPathTemplate: '{testDir}/__snapshots__/{projectName}/{arg}{ext}',
  globalSetup: './e2e/global-setup.ts',
  use: {
    baseURL,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'desktop',
      use: {
        browserName: 'chromium',
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: 'mobile',
      use: {
        browserName: 'chromium',
        viewport: { width: 375, height: 812 },
      },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: baseURL,
    reuseExistingServer: true,
  },
});
