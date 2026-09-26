const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  // Do not send requests to Maps, EmailJS, or production Firebase during tests.
  await page.route('**/*', (route) => {
    const url = new URL(route.request().url());
    return ['127.0.0.1', 'localhost'].includes(url.hostname) ? route.continue() : route.abort();
  });
});

test('mobile landing describes the product without fabricated matching claims', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Pet Parent Operating System', { exact: true })).toBeVisible();
  await expect(page.getByText('98% success', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Sign in', exact: true }).first()).toBeVisible();
  const hero = page.getByRole('img', { name: 'A golden retriever and a ginger cat sitting side by side' });
  await expect(hero).toBeVisible();
  await expect.poll(() => hero.evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('an authenticated parent can change reminder preferences and opt out of measurement', async ({ page, request }) => {
  const email = `parent-${Date.now()}@example.test`;
  const password = 'local-emulator-password';
  const signup = await request.post('http://127.0.0.1:9098/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-key', { data: { email, password, returnSecureToken: true } });
  expect(signup.ok()).toBe(true);
  const account = await signup.json();
  const verified = await request.post('http://127.0.0.1:9098/identitytoolkit.googleapis.com/v1/accounts:update?key=demo-key', { headers: { Authorization: 'Bearer owner' }, data: { localId: account.localId, emailVerified: true } });
  expect(verified.ok()).toBe(true);
  await request.put(`http://127.0.0.1:9015/users/${account.localId}.json?ns=demo-pawppy-default-rtdb&access_token=owner`, { data: { displayName: 'Local parent', email, timeZone: 'Asia/Kolkata' } });
  await page.goto('/login');
  await page.locator('input[type=email]').fill(email);
  await page.locator('input[type=password]').fill(password);
  await page.getByRole('button', { name: 'Sign In', exact: true }).click();
  await expect(page).toHaveURL(/today/);
  await expect(page.getByRole('link', { name: 'Settings', exact: true })).toBeVisible();
  await page.goto('/settings');
  await expect(page.getByRole('heading', { name: 'Reminders & preferences' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Check for updates', exact: true })).toBeVisible();
  await expect(page.getByLabel('Vaccination dates: email')).toBeChecked();
  await page.getByLabel('Vaccination dates: email').uncheck();
  await page.getByLabel('Time zone', { exact: true }).fill('Europe/London');
  await page.getByLabel('Quiet hours for personal reminders').check();
  await page.getByLabel('Help improve Pawppy', { exact: false }).uncheck();
  await page.getByRole('button', { name: 'Save preferences' }).click();
  await expect(page.getByRole('status')).toHaveText('Your preferences have been saved.');
  await page.reload();
  await expect(page.getByLabel('Vaccination dates: email')).not.toBeChecked();
  await expect(page.getByLabel('Time zone', { exact: true })).toHaveValue('Europe/London');
  await expect(page.getByLabel('Help improve Pawppy', { exact: false })).not.toBeChecked();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  await page.goto('/today');
  await page.getByLabel('Pet’s name').fill('Milo');
  await page.getByRole('button', { name: 'Add my pet' }).click();
  await expect(page.getByRole('heading', { name: 'Choose a daily routine' })).toBeVisible();
  await page.getByRole('button', { name: 'Save daily routine' }).click();
  await page.getByRole('button', { name: 'Complete Fresh water for Milo' }).click();
  await expect(page.getByRole('button', { name: 'Undo Fresh water for Milo' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Undo Fresh water for Milo' })).toBeVisible();
  await page.getByRole('button', { name: 'Undo Fresh water for Milo' }).click();
  await expect(page.getByRole('button', { name: 'Complete Fresh water for Milo' })).toBeVisible();
  const seededPet = await request.put(`http://127.0.0.1:9015/userPets/${account.localId}/luna.json?ns=demo-pawppy-default-rtdb&access_token=owner`, { data: { name: 'Luna', type: 'Cat', image: '/missing-pet-photo-test.jpg' } });
  expect(seededPet.ok()).toBe(true);
  await page.getByRole('button', { name: 'Show Luna’s routines', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Complete Fresh water for Milo' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Show Milo’s routines', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Complete Fresh water for Milo' })).toBeVisible();
  await page.getByRole('button', { name: 'Everyone', exact: false }).click();
  await expect(page.getByRole('navigation', { name: 'Pet care shortcuts' })).toBeVisible();
  await page.getByRole('button', { name: 'Manage routines' }).click();
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await page.getByRole('button', { name: 'Close Manage routines' }).click();
  await expect(page.getByRole('button', { name: 'Complete Fresh water for Milo' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Manage routines', exact: true }).click();
  await page.getByRole('button', { name: 'Resume', exact: true }).click();
  await page.getByRole('button', { name: 'Close Manage routines' }).click();
  await expect(page.getByRole('button', { name: 'Complete Fresh water for Milo' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: 'test-results/today-mobile.png', fullPage: true });
  await page.setViewportSize({ width: 1280, height: 960 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: 'test-results/today-desktop.png' });
});

test('sample day is interactive and clearly separate from saved care', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Complete Fresh water for Luna' }).click();
  await expect(page.getByRole('status')).toContainText('2 of 3 sample routines done');
  await page.getByRole('button', { name: 'Luna', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('1 of 1 sample routines done');
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(page.getByRole('status')).toContainText('1 of 3 sample routines done');
  await page.screenshot({ path: 'test-results/landing-mobile.png', fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/landing-desktop.png', fullPage: true });
});

test('shared Today records the caregiver and removes access after revocation', async ({ page, request }) => {
  const email = `caregiver-${Date.now()}@example.test`;
  const password = 'local-emulator-password';
  const signup = await request.post('http://127.0.0.1:9098/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-key', { data: { email, password, returnSecureToken: true } });
  const account = await signup.json();
  await request.post('http://127.0.0.1:9098/identitytoolkit.googleapis.com/v1/accounts:update?key=demo-key', { headers: { Authorization: 'Bearer owner' }, data: { localId: account.localId, emailVerified: true } });
  const uid = account.localId;
  const owner = `family-owner-${Date.now()}`;
  const dataUrl = 'http://127.0.0.1:9015';
  const suffix = '.json?ns=demo-pawppy-default-rtdb&access_token=owner';
  const access = { role: 'caregiver', expiresAt: Date.now() + 86400000, displayName: 'Alice' };
  const seeded = await request.patch(`${dataUrl}/${suffix}`, { data: {
    [`users/${uid}`]: { displayName: 'Caregiver', email, timeZone: 'Asia/Kolkata' },
    [`userPets/${owner}/milo`]: { name: 'Milo', medical: { notes: 'private' } },
    [`careFamilies/${owner}/members/${uid}`]: access,
    [`careAccess/${uid}/${owner}`]: access,
    [`careRoutines/${owner}/water`]: { petId: 'milo', title: 'Fresh water', kind: 'water', time: '08:00', startDate: '2020-01-01', active: true, createdAt: Date.now() },
  } });
  expect(seeded.ok(), await seeded.text()).toBe(true);
  const seededAccess = await request.get(`${dataUrl}/careAccess/${uid}/${owner}${suffix}`);
  expect((await seededAccess.json())?.role).toBe('caregiver');
  // The callable projection has separate handler tests against the database.
  // Stub only its transport here; subscriptions and writes use real rules.
  await page.route('**/getSharedCarePets', route => route.fulfill({ status: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization,content-type', 'Access-Control-Allow-Methods': 'POST,OPTIONS' }, contentType: 'application/json', body: JSON.stringify({ result: { pets: { milo: { name: 'Milo', type: 'Cat', image: '' } }, ownerName: 'Alice', members: { [uid]: 'Caregiver' }, timeZone: 'Asia/Kolkata' } }) }));
  await page.goto('/login');
  await page.getByLabel('Email Address').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign In', exact: true }).click();
  await expect(page).toHaveURL(/today/);
  await page.goto(`/today?family=${owner}`);
  await expect(page.getByText('Shared care · Alice’s pets')).toBeVisible();
  await page.getByRole('button', { name: 'Complete Fresh water for Milo' }).click();
  await expect(page.getByRole('button', { name: 'Undo Fresh water for Milo' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add a routine', exact: true })).toHaveCount(0);
  await request.patch(`${dataUrl}/${suffix}`, { data: { [`careFamilies/${owner}/members/${uid}`]: null, [`careAccess/${uid}/${owner}`]: null } });
  await expect(page.getByRole('alert')).toContainText('unavailable');
  await expect(page.getByRole('button', { name: 'Undo Fresh water for Milo' })).toHaveCount(0);
});
