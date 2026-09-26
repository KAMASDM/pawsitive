const { test, expect } = require('@playwright/test');

test.use({ reducedMotion: 'reduce', serviceWorkers: 'block' });

test('fits small screens and keeps filtering, read actions and navigation working', async ({ page, request, browserName }, testInfo) => {
  await page.route('**/*', route => ['127.0.0.1', 'localhost'].includes(new URL(route.request().url()).hostname) ? route.continue() : route.abort());
  const fixtureId = `inbox-${browserName}-${Date.now()}`;
  const email = `${fixtureId}@example.test`, password = 'local-emulator-password';
  const authUrl = 'http://127.0.0.1:9098/identitytoolkit.googleapis.com/v1';
  const databaseUrl = 'http://127.0.0.1:9015/.json?ns=demo-pawppy-default-rtdb&access_token=owner';
  const signup = await request.post(`${authUrl}/accounts:signUp?key=demo-key`, { data: { email, password, returnSecureToken: true } });
  const account = await signup.json();
  await request.post(`${authUrl}/accounts:update?key=demo-key`, { headers: { Authorization: 'Bearer owner' }, data: { localId: account.localId, emailVerified: true } });
  const longTitle = 'NotificationWithAnUnbrokenTitleThatMustStillFitOnASmallPhoneScreen';
  await request.patch(databaseUrl, { data: {
    [`users/${account.localId}`]: { displayName: 'Local parent', email },
    [`notifications/${account.localId}`]: {
      reminder: { title: 'Time for Milo’s evening walk', body: 'A little fresh air and time together. Your evening routine is ready.', type: 'push', timestamp: Date.now(), data: { path: '/care' } },
      message: { title: 'A new message about Milo', body: 'Hi! Is Milo available for a walk in the park tomorrow morning?', type: 'message', read: true, timestamp: Date.now() - 3600000 },
      long: { title: longTitle, body: `https://pawppy.com/notifications/${'longidentifier'.repeat(10)}`, timestamp: Date.now() - 7200000 },
    },
    [`broadcastNotifications/${fixtureId}`]: { title: 'A Pawppy community update', body: 'New places to explore together this weekend.', active: true, timestamp: Date.now() - 1800000 },
  } });

  try {
    await page.goto('/login');
    await page.getByLabel('Email Address').fill(email);
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();
    await expect(page).toHaveURL(/today/);
    await page.goto('/notifications');
    await expect(page.getByText(longTitle, { exact: true })).toBeVisible();
    await expect(page.getByText('A Pawppy community update', { exact: true })).toBeVisible();

    for (const width of [320, 390, 768, 1280]) {
      await page.setViewportSize({ width, height: 844 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const cards = page.locator('.inbox-notification');
      expect(await cards.evaluateAll(elements => elements.every(element => element.scrollWidth <= element.clientWidth))).toBe(true);
      const heading = await page.getByRole('heading', { name: 'Notifications', exact: true }).boundingBox();
      const action = await page.getByRole('button', { name: 'Mark all read', exact: true }).boundingBox();
      expect(action.y).toBeGreaterThanOrEqual(heading.y + heading.height);
      for (const control of await page.locator('.inbox-toolbar button').all()) {
        const box = await control.boundingBox();
        expect(box.height).toBeGreaterThanOrEqual(44);
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(width);
      }
      await page.screenshot({ path: testInfo.outputPath(`notifications-${width}.png`), fullPage: true });
    }

    await page.setViewportSize({ width: 320, height: 740 });
    await page.getByRole('button', { name: 'Unread', exact: true }).click();
    await expect(page.getByText('A new message about Milo', { exact: true })).toHaveCount(0);
    await page.getByRole('button', { name: /Time for Milo’s evening walk/ }).click();
    await expect(page).toHaveURL(/\/care$/);
    await page.goto('/notifications');
    await page.getByRole('button', { name: 'Unread', exact: true }).click();
    await expect(page.getByText('Time for Milo’s evening walk', { exact: true })).toHaveCount(0);
    await expect(page.getByText(longTitle, { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Mark all read', exact: true }).click();
    await expect(page.getByText('Nothing waiting', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Mark all read', exact: true })).toBeDisabled();
    await page.reload();
    await page.getByRole('button', { name: 'Unread', exact: true }).click();
    await expect(page.getByText('Nothing waiting', { exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  } finally {
    await request.patch(databaseUrl, { data: {
      [`broadcastNotifications/${fixtureId}`]: null,
      [`notifications/${account.localId}`]: null,
      [`notificationReads/${account.localId}`]: null,
      [`users/${account.localId}`]: null,
    } });
  }
});
