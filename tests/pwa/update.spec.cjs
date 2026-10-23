const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ request }) => { await request.post('/__reset'); });

test('a real service worker update activates once and does not prompt after reload', async ({ page, context, request }) => {
  await context.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
  await page.goto('/');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  await page.reload();
  await expect(page.getByText('New version available', { exact: true })).toHaveCount(0);
  await expect(page.getByText('App saved on this device', { exact: true })).toHaveCount(0);
  await request.post('/__next-worker');
  await page.evaluate(async () => (await navigator.serviceWorker.getRegistration()).update());
  await expect(page.getByText('New version available', { exact: true })).toBeVisible({ timeout: 20000 });
  let navigations = 0;
  page.on('framenavigated', frame => { if (frame === page.mainFrame()) navigations++; });
  await page.getByRole('button', { name: 'Update Now', exact: true }).click();
  await expect.poll(() => navigations).toBe(1);
  await expect(page.getByText('New version available', { exact: true })).toHaveCount(0);
  await expect.poll(() => page.evaluate(async () => Boolean((await navigator.serviceWorker.getRegistration()).waiting))).toBe(false);
  await page.reload();
  await expect(page.getByText('New version available', { exact: true })).toHaveCount(0);
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
  await page.evaluate(() => { ServiceWorkerRegistration.prototype.update = () => Promise.reject(new Error('An active update needs no network recheck')); });
  await page.getByRole('button', { name: 'Update Now', exact: true }).click();
  await expect.poll(() => navigations, { timeout: 5000 }).toBe(1);
  await expect(page.getByRole('button', { name: 'Update Now', exact: true })).toHaveCount(0);
});

test('a release announcement does not offer an update before the worker is ready', async ({ page, context, request }) => {
  await installedPage(page, context);
  await request.post('/__release-version', { data: { buildId: 'new-release-for-stale-tab' } });
  await page.evaluate(() => window.dispatchEvent(new Event('pageshow')));
  await expect(page.getByText('Downloading update…', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Update Now', exact: true })).toHaveCount(0);
  expect(await page.evaluate(async () => Boolean((await navigator.serviceWorker.getRegistration()).waiting))).toBe(false);
  let navigations = 0;
  page.on('framenavigated', frame => { if (frame === page.mainFrame()) navigations++; });
  await page.getByRole('button', { name: 'Later', exact: true }).click();
  await expect(page.getByText('Downloading update…', { exact: true })).toHaveCount(0);
  expect(navigations).toBe(0);
  // When the worker arrives, a dismissed download notice must not hide readiness.
  await request.post('/__release-version', { data: { buildId: null } });
  await request.post('/__next-worker');
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(page.getByRole('button', { name: 'Update Now', exact: true })).toBeVisible();
});

test('accepts a downloaded update even if another update check would fail', async ({ page, context, request }) => {
  await installedPage(page, context);
  await request.post('/__next-worker');
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(page.getByRole('button', { name: 'Update Now', exact: true })).toBeVisible({ timeout: 20000 });
  await page.evaluate(() => {
    localStorage.setItem('pwa-preserve-record', 'saved');
    ServiceWorkerRegistration.prototype.update = () => Promise.reject(new Error('Network unavailable'));
  });
  let navigations = 0;
  page.on('framenavigated', frame => { if (frame === page.mainFrame()) navigations++; });
  await page.getByRole('button', { name: 'Update Now', exact: true }).click();
  await expect.poll(() => navigations).toBe(1);
  await expect(page.getByRole('button', { name: 'Update Now', exact: true })).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('pwa-preserve-record'))).toBe('saved');
});

test('online launches fetch current HTML and network failures retain the installed shell for deep links', async ({ page, context, request }) => {
  await installedPage(page, context);
  const installedRelease = await page.locator('html').getAttribute('data-release');
  await request.post('/__next-worker');
  await page.reload();
  await expect(page.locator('html')).not.toHaveAttribute('data-release', installedRelease);
  await expect(page.getByRole('button', { name: 'Update Now', exact: true })).toBeVisible({ timeout: 20000 });
  // Fail at the server so WebKit's request interception cannot bypass the worker.
  await request.post('/__fail-navigation');
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: /welcome back/i }).first()).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-release', installedRelease);
});

test('slow updates download in the background and accepting a ready update reloads promptly', async ({ page, context, request }) => {
  test.setTimeout(70000);
  await installedPage(page, context);
  await request.post('/__release-version', { data: { buildId: 'slow-next-release' } });
  await request.post('/__slow-worker');
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(page.getByText('Downloading update…', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Update Now', exact: true })).toHaveCount(0);
  let navigations = 0;
  page.on('framenavigated', frame => { if (frame === page.mainFrame()) navigations++; });
  await page.waitForTimeout(28000);
  await expect(page.getByText('Downloading update…', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Update Now', exact: true })).toHaveCount(0);
  expect(navigations).toBe(0);
  await request.post('/__release-version', { data: { buildId: null } });
  await expect(page.getByRole('button', { name: 'Update Now', exact: true })).toBeVisible({ timeout: 20000 });
  await page.getByRole('button', { name: 'Update Now', exact: true }).click();
  await expect.poll(() => navigations, { timeout: 5000 }).toBe(1);
  await expect(page.getByText('Downloading update…', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Update Now', exact: true })).toHaveCount(0);
  await request.post('/__next-worker');
});
