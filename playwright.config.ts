import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './test',
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:4173',
    // Some sandboxes preinstall a chromium and expose it here; CI and local
    // dev fall back to the standard `playwright install` browsers.
    ...(process.env['PLAYWRIGHT_CHROMIUM_PATH']
      ? {
          launchOptions: {
            executablePath: process.env['PLAYWRIGHT_CHROMIUM_PATH'],
          },
        }
      : {}),
  },
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env['CI'],
    timeout: 120_000,
  },
});
