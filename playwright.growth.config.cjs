const { defineConfig, devices } = require('@playwright/test');
const base = require('./playwright.config.cjs');
module.exports = defineConfig({
  ...base,
  testMatch: /growth\.spec\.js/,
  projects: [
    { name: 'desktop-chrome', use: { browserName: 'chromium', viewport: { width: 1280, height: 960 } } },
    { name: 'android-chrome', use: { ...devices['Pixel 7'] } },
    { name: 'iphone-webkit', use: { ...devices['iPhone 13'] } },
  ],
});
