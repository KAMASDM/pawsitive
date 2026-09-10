const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir: './tests/pwa', workers: 1, timeout: 45000,
  use: { baseURL: 'http://127.0.0.1:4180', screenshot: 'only-on-failure' },
  webServer: { command: 'node tests/pwa/server.cjs', url: 'http://127.0.0.1:4180', reuseExistingServer: false },
});
