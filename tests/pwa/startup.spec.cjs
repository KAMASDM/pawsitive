const { test, expect } = require('@playwright/test');

test.use({ serviceWorkers: 'block', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
test.beforeEach(async ({ context }) => {
  await context.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
});

test('a missing entry script offers recovery before React can start', async ({ page }) => {
  await page.route('**/assets/index-*.js', route => route.fulfill({ status: 404, contentType: 'text/plain', body: 'Missing app asset' }));
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Reload app' })).toBeVisible();
  await page.unroute('**/assets/index-*.js');
  await page.getByRole('button', { name: 'Reload app' }).click();
  await expect(page.getByRole('heading', { name: /Less to remember/ })).toBeVisible();
  await expect(page.locator('#startup-recovery')).toBeHidden();
});

test('offline startup recovery stays actionable without reloading', async ({ page, context }) => {
  await page.route('**/assets/index-*.js', route => route.abort());
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Reload app' })).toBeVisible();
  await context.setOffline(true);
  let navigations = 0;
  page.on('framenavigated', frame => { if (frame === page.mainFrame()) navigations++; });
  await page.getByRole('button', { name: 'Reload app' }).click();
  await expect(page.getByText('Reconnect, then try again.')).toBeVisible();
  expect(navigations).toBe(0);
});
