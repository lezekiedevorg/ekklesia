import { defineConfig } from '@playwright/test';
import path from 'path';

export default defineConfig({
  testDir: './specs',
  timeout: 120_000,
  retries: 0,
  workers: 1,
  fullyParallel: false,
  reporter: [
    ['html', { open: 'never', outputFolder: './test-results/html-report' }],
    ['list'],
  ],
  use: {
    baseURL: 'http://localhost:3000',
    headless: false,
    screenshot: 'on',
    video: 'on',
    trace: 'on',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    viewport: { width: 1440, height: 900 },
  },
  projects: [
    {
      name: 'desktop',
      use: {
        browserName: 'chromium',
        viewport: { width: 1440, height: 900 },
        screenshot: 'on',
        video: 'on',
      },
    },
    {
      name: 'mobile',
      use: {
        browserName: 'chromium',
        viewport: { width: 375, height: 812 },
        screenshot: 'on',
        video: 'on',
      },
    },
  ],
  outputDir: './test-results/artifacts',
});
