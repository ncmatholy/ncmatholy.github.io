const { existsSync } = require('node:fs');
const { defineConfig } = require('@playwright/test');

const chromiumPath = process.env.CHROMIUM_PATH ||
  (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined);

module.exports = defineConfig({
  testDir: './tests',
  testMatch: 'browser.spec.js',
  fullyParallel: true,
  workers: 2,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:8765',
    browserName: 'chromium',
    launchOptions: chromiumPath ? { executablePath: chromiumPath } : {},
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 1000 } } },
    { name: 'mobile', use: { viewport: { width: 390, height: 844 } } },
  ],
  webServer: {
    command: 'python -m http.server 8765 --bind 127.0.0.1 --directory output',
    url: 'http://127.0.0.1:8765',
    env: { PYTHONDONTWRITEBYTECODE: '1' },
    reuseExistingServer: !process.env.CI,
  },
});
