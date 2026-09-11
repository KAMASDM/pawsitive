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

async function installedPage(page, context) {
  await context.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
  await page.goto('/');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  await page.reload();
}

test('returning online discovers an update and reopening restores a dismissed prompt', async ({ page, context, request }) => {
  await installedPage(page, context);
  await context.setOffline(true);
  await request.post('/__next-worker');
  await context.setOffline(false);
  await expect(page.getByRole('button', { name: 'Update Now', exact: true })).toBeVisible({ timeout: 20000 });
  await page.getByRole('button', { name: 'Later', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Update Now', exact: true })).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Update Now', exact: true })).toBeVisible();
  let navigations = 0;
  page.on('framenavigated', frame => { if (frame === page.mainFrame()) navigations++; });
  await page.getByRole('button', { name: 'Update Now', exact: true }).click();
  await expect.poll(() => navigations).toBe(1);
  await expect.poll(() => page.evaluate(async () => Boolean((await navigator.serviceWorker.getRegistration()).waiting))).toBe(false);
  await expect(page.getByRole('button', { name: 'Update Now', exact: true })).toHaveCount(0);
});

test('focus checks discover a release without a manual worker update', async ({ page, context, request }) => {
  await installedPage(page, context);
  await request.post('/__next-worker');
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(page.getByRole('button', { name: 'Update Now', exact: true })).toBeVisible({ timeout: 20000 });
  expect(await page.evaluate(async () => (await navigator.serviceWorker.getRegistration()).updateViaCache)).toBe('none');
});

test('another tab activating an update offers a reload without interrupting this page', async ({ page, context, request }) => {
  await installedPage(page, context);
  const second = await context.newPage();
  await second.goto('/');
  await request.post('/__next-worker');
  await second.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(second.getByRole('button', { name: 'Update Now', exact: true })).toBeVisible({ timeout: 20000 });
  let navigations = 0;
  page.on('framenavigated', frame => { if (frame === page.mainFrame()) navigations++; });
  await second.getByRole('button', { name: 'Update Now', exact: true }).click();
  await expect.poll(() => page.evaluate(async () => Boolean((await navigator.serviceWorker.getRegistration()).waiting))).toBe(false);
  await expect(page.getByRole('button', { name: 'Update Now', exact: true })).toBeVisible();
  expect(navigations).toBe(0);
  await page.getByRole('button', { name: 'Update Now', exact: true }).click();
  await expect.poll(() => navigations).toBe(1);
  await expect(page.getByRole('button', { name: 'Update Now', exact: true })).toHaveCount(0);
});

test('the independent release check detects stale code even without a waiting worker', async ({ page, context }) => {
  await installedPage(page, context);
  await page.route('**/version.json', route => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ buildId: 'new-release-for-stale-tab' }) }));
  await page.evaluate(() => window.dispatchEvent(new Event('pageshow')));
  await expect(page.getByRole('button', { name: 'Update Now', exact: true })).toBeVisible();
  expect(await page.evaluate(async () => Boolean((await navigator.serviceWorker.getRegistration()).waiting))).toBe(false);
});
