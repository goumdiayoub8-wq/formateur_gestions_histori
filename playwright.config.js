const { defineConfig } = require('./tests/helpers/playwright');

delete process.env.NO_COLOR;

module.exports = defineConfig({
  testDir: './tests',
  testMatch: ['**/*.spec.js'],
  timeout: 180000,
  reportSlowTests: null,
  expect: {
    timeout: 10000,
  },
  reporter: [['list']],
  outputDir: './test-results/playwright',
  use: {
    baseURL: process.env.PLAYWRIGHT_APP_URL || 'http://127.0.0.1:5173',
    headless: true,
    viewport: { width: 1440, height: 960 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
});
