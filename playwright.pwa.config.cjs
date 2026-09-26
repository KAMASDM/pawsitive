const { defineConfig, devices } = require('@playwright/test');
module.exports = defineConfig({
  testDir: './tests/pwa', workers: 1, timeout: 45000,
  use: { baseURL: 'http://127.0.0.1:4180', screenshot: 'only-on-failure' },
  projects: [
    { name: 'desktop-chrome', use: { browserName: 'chromium' } },
    { name: 'android-chrome', use: { ...devices['Pixel 7'] } },
    { name: 'iphone-webkit', use: { ...devices['iPhone 13'] } },
  ],
  webServer: { command: 'node tests/pwa/server.cjs', url: 'http://127.0.0.1:4180', reuseExistingServer: false },
});
