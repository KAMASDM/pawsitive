const { test, expect } = require('@playwright/test');

test('a real service worker update activates once and does not prompt after reload', async ({ page, context, request }) => {
  await context.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
  await page.goto('/');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  await page.reload();
  await expect(page.getByText('New Version Available! 🎉', { exact: true })).toHaveCount(0);
  await expect(page.getByText('App saved on this device', { exact: true })).toHaveCount(0);
  await request.post('/__next-worker');
  await page.evaluate(async () => (await navigator.serviceWorker.getRegistration()).update());
  await expect(page.getByText('New Version Available! 🎉', { exact: true })).toBeVisible({ timeout: 20000 });
  let navigations = 0;
  page.on('framenavigated', frame => { if (frame === page.mainFrame()) navigations++; });
  await page.getByRole('button', { name: 'Update Now', exact: true }).click();
  await expect.poll(() => navigations).toBe(1);
  await expect(page.getByText('New Version Available! 🎉', { exact: true })).toHaveCount(0);
  await expect.poll(() => page.evaluate(async () => Boolean((await navigator.serviceWorker.getRegistration()).waiting))).toBe(false);
  await page.reload();
  await expect(page.getByText('New Version Available! 🎉', { exact: true })).toHaveCount(0);
  const hero = page.getByRole('img', { name: 'A golden retriever and a ginger cat sitting side by side' });
  await expect.poll(() => hero.evaluate(img => img.complete && img.naturalWidth === 1254)).toBe(true);
});
