const { test, expect } = require('@playwright/test');

test.use({ serviceWorkers: 'block' });
test.beforeEach(async ({ context }) => {
  await context.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
});

test('a missing route shows recovery and can load successfully after reloading', async ({ page }) => {
  const missing = '**/Login-*.js';
  await page.route(missing, route => route.fulfill({ status: 404, contentType: 'text/plain', body: 'Missing app asset' }));
  await page.goto('/login');
  await expect(page.getByRole('button', { name: 'Reload app' })).toBeVisible();
  await page.unroute(missing);
  await page.getByRole('button', { name: 'Reload app' }).click();
  await expect(page.getByRole('button', { name: 'Reload app' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: /welcome back/i }).first()).toBeVisible();
});

test('a persistent missing route never enters an automatic reload loop', async ({ page }) => {
  await page.route('**/Login-*.js', route => route.fulfill({ status: 404, contentType: 'text/plain', body: 'Missing app asset' }));
  await page.goto('/login');
  await expect(page.getByRole('button', { name: 'Reload app' })).toBeVisible();
  let navigations = 0;
  page.on('framenavigated', frame => { if (frame === page.mainFrame()) navigations++; });
  await page.getByRole('button', { name: 'Reload app' }).click();
  await expect.poll(() => navigations).toBe(1);
  await expect(page.getByRole('button', { name: 'Reload app' })).toBeVisible();
  await page.waitForTimeout(600);
  expect(navigations).toBe(1);
});

test('an offline retry preserves the recovery screen instead of reloading', async ({ page, context }) => {
  await page.route('**/Login-*.js', route => route.abort());
  await page.goto('/login');
  await expect(page.getByRole('button', { name: 'Reload app' })).toBeVisible();
  await context.setOffline(true);
  let navigations = 0;
  page.on('framenavigated', frame => { if (frame === page.mainFrame()) navigations++; });
  await page.getByRole('button', { name: 'Reload app' }).click();
  await expect(page.getByText('Check your connection, then try again.')).toBeVisible();
  expect(navigations).toBe(0);
});

test('missing assets return an error instead of the application HTML', async ({ request }) => {
  const response = await request.get('/assets/does-not-exist.js');
  expect(response.status()).toBe(404);
  expect(response.headers()['content-type']).toBe('text/plain');
});
