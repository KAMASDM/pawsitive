const { test, expect } = require('@playwright/test');

test.use({ reducedMotion: 'reduce', serviceWorkers: 'block' });
const callable = (route, result) => route.fulfill({ status: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization,content-type', 'Access-Control-Allow-Methods': 'POST,OPTIONS' }, contentType: 'application/json', body: JSON.stringify({ result }) });

test.beforeEach(async ({ page, request }) => {
  await page.route('**/*', route => ['127.0.0.1', 'localhost'].includes(new URL(route.request().url()).hostname) ? route.continue() : route.abort());
  const email = `ui-${Date.now()}@example.test`, password = 'local-emulator-password';
  const signup = await request.post('http://127.0.0.1:9098/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-key', { data: { email, password, returnSecureToken: true } });
  const account = await signup.json();
  await request.post('http://127.0.0.1:9098/identitytoolkit.googleapis.com/v1/accounts:update?key=demo-key', { headers: { Authorization: 'Bearer owner' }, data: { localId: account.localId, emailVerified: true } });
  await request.patch('http://127.0.0.1:9015/.json?ns=demo-pawppy-default-rtdb&access_token=owner', { data: {
    [`users/${account.localId}`]: { displayName: 'Local parent', email, timeZone: 'UTC' },
    [`userPets/${account.localId}/milo`]: { name: 'Milo', type: 'Dog' },
    [`careRoutines/${account.localId}/water`]: { petId: 'milo', title: 'Fresh water', kind: 'water', time: '08:00', startDate: '2020-01-01', active: true },
  } });
  await page.goto('/login'); await page.getByLabel('Email Address').fill(email); await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign In', exact: true }).click(); await expect(page).toHaveURL(/today/);
  await expect(page.getByRole('button', { name: 'Complete Fresh water for Milo' })).toBeVisible();
});

test('five destinations stay available while scrolling and show the current section', async ({ page }) => {
  const nav = page.getByRole('navigation', { name: 'Main navigation', exact: true });
  await expect(nav.getByRole('link')).toHaveCount(5);
  await expect(nav.getByRole('link', { name: 'Today', exact: true })).toHaveAttribute('aria-current', 'page');
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect(nav).toBeInViewport();
  await nav.getByRole('link', { name: 'Care', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Care', exact: true })).toBeVisible();
  await expect(nav.getByRole('link', { name: 'Care', exact: true })).toHaveAttribute('aria-current', 'page');
  await page.setViewportSize({ width: 320, height: 740 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('link', { name: 'Settings', exact: true }).click();
  await expect(nav.getByRole('link', { name: 'Profile', exact: true })).toHaveAttribute('aria-current', 'page');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('routine and search sheets contain focus, dismiss cleanly and preserve a draft', async ({ page }) => {
  const add = page.getByRole('button', { name: 'Add a routine', exact: true });
  await add.click();
  const dialog = page.getByRole('dialog', { name: 'Choose a daily routine', exact: true });
  await expect(dialog).toBeVisible();
  const box = await dialog.boundingBox();
  expect(box.width).toBe(390);
  await dialog.getByLabel('Routine name').fill('A little playtime');
  for (let i = 0; i < 16; i++) {
    await page.keyboard.press('Tab');
    expect(await dialog.evaluate(el => el.contains(document.activeElement))).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(add).toBeFocused();
  await add.click();
  await expect(dialog.getByLabel('Routine name')).toHaveValue('A little playtime');
  await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
  await page.getByRole('button', { name: 'Search Pawppy', exact: true }).click();
  const search = page.getByRole('dialog', { name: 'Search Pawppy', exact: true });
  await expect(search.getByLabel('Search pets and features')).toBeFocused();
  await search.getByLabel('Search pets and features').fill('Care records');
  await search.getByRole('button', { name: /Care records/ }).click();
  await expect(page).toHaveURL(/\/care$/);
  await expect(search).toHaveCount(0);
});

test('removing a caregiver requires a deliberate confirmation', async ({ page }) => {
  let removed = false;
  await page.route('**/listCareFamily', route => callable(route, { members: removed ? {} : { riya: { displayName: 'Riya', role: 'caregiver', expiresAt: Date.now() + 86400000 } }, invitations: {} }));
  await page.route('**/revokeCareAccess', route => { if (route.request().method() === 'POST') removed = true; return callable(route, { ok: true }); });
  await page.goto('/family');
  await page.getByRole('button', { name: 'Remove', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Remove Riya’s access?' });
  await expect(dialog).toBeVisible(); expect(removed).toBe(false);
  await dialog.getByRole('button', { name: 'Keep access' }).click(); expect(removed).toBe(false);
  await page.getByRole('button', { name: 'Remove', exact: true }).click();
  await dialog.getByRole('button', { name: 'Remove access', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Caregiver access removed.'); expect(removed).toBe(true);
});
