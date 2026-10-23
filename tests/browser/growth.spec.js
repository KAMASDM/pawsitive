const { test, expect } = require('@playwright/test');
const crypto = require('node:crypto');
const token = () => crypto.randomBytes(32).toString('base64url');
const callable = (route, result) => route.fulfill({ status: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization,content-type', 'Access-Control-Allow-Methods': 'POST,OPTIONS' }, contentType: 'application/json', body: JSON.stringify({ result }) });

test.use({ reducedMotion: 'reduce', serviceWorkers: 'block' });
test.beforeEach(async ({ page, request }, testInfo) => {
  await page.route('**/*', route => (['127.0.0.1', 'localhost'].includes(new URL(route.request().url()).hostname) || route.request().url().startsWith('blob:http://127.0.0.1:4175/')) ? route.continue() : route.abort());
  const email = `growth-${Date.now()}-${testInfo.workerIndex}@example.test`, password = 'local-emulator-password';
  const signup = await request.post('http://127.0.0.1:9098/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-key', { data: { email, password, returnSecureToken: true } });
  const account = await signup.json(); testInfo.annotations.push({ type: 'uid', description: account.localId });
  await request.post('http://127.0.0.1:9098/identitytoolkit.googleapis.com/v1/accounts:update?key=demo-key', { headers: { Authorization: 'Bearer owner' }, data: { localId: account.localId, emailVerified: true } });
  await request.patch('http://127.0.0.1:9015/.json?ns=demo-pawppy-default-rtdb&access_token=owner', { data: {
    [`users/${account.localId}`]: { displayName: 'Local parent', email, timeZone: 'UTC' },
    [`petOwners/milo`]: account.localId,
    [`userPets/${account.localId}/milo`]: { id: 'milo', name: 'Milo', type: 'dog', breed: 'Labrador Retriever', privacy: { isPrivate: true }, vaccinations: [{ id: 'existing', name: 'DHPP', date: '2025-01-01', nextDue: '2026-01-01' }] },
    [`careRoutines/${account.localId}/water`]: { petId: 'milo', title: 'Fresh water', kind: 'water', time: '08:00', startDate: '2020-01-01', active: true },
  } });
  await page.goto('/login'); await page.getByLabel('Email Address').fill(email); await page.getByLabel('Password', { exact: true }).fill(password); await page.getByRole('button', { name: 'Sign In', exact: true }).click(); await expect(page).toHaveURL(/today/);
});

test('card import requires review, keeps a draft, preserves old records and deduplicates a retry', async ({ page, request }, testInfo) => {
  await page.goto('/care/milo/import');
  await page.getByLabel('Choose vaccination card').setInputFiles({ name: 'milo-vaccinations.txt', mimeType: 'text/plain', buffer: Buffer.from('Rabies 04/03/2026 04/03/2027') });
  await expect(page.getByLabel('Vaccine name', { exact: true })).toHaveValue('Rabies');
  await expect(page.getByRole('button', { name: 'Save reviewed vaccinations' })).toBeDisabled();
  await page.goto('/today'); await page.goto('/care/milo/import');
  await expect(page.getByLabel('Vaccine name', { exact: true })).toHaveValue('Rabies');
  await page.getByLabel('Include this record').check();
  await page.getByLabel('I compared the selected names and dates').check();
  await page.getByRole('button', { name: 'Save reviewed vaccinations' }).click();
  await expect(page.getByRole('status')).toContainText('Reviewed records saved');
  await page.getByLabel('Include this record').check(); await page.getByLabel('I compared the selected names and dates').check();
  await page.getByRole('button', { name: 'Save reviewed vaccinations' }).click();
  await expect(page.getByRole('button', { name: 'Save reviewed vaccinations' })).toBeDisabled();
  const uid = testInfo.annotations.find(item => item.type === 'uid').description;
  const saved = await (await request.get(`http://127.0.0.1:9015/userPets/${uid}/milo/vaccinations.json?ns=demo-pawppy-default-rtdb&access_token=owner`)).json();
  expect(saved).toHaveLength(2); expect(saved[0].name).toBe('DHPP'); expect(saved[1].date).toBe('2026-03-04');
  await page.setViewportSize({ width: 320, height: 740 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('a photo is read on-device with the real OCR worker', async ({ page }) => {
  test.setTimeout(90000);
  await page.goto('/care/milo/import');
  const image = await page.evaluate(() => { const canvas = document.createElement('canvas'); canvas.width = 3200; canvas.height = 800; const ctx = canvas.getContext('2d'); ctx.fillStyle = 'white'; ctx.fillRect(0,0,3200,800); ctx.fillStyle = 'black'; ctx.font = '90px Arial'; ctx.fillText('Rabies 2026-03-04 2027-03-04', 100, 360); return canvas.toDataURL('image/png').split(',')[1]; });
  await page.getByLabel('Choose vaccination card').setInputFiles({ name: 'vaccination-photo.png', mimeType: 'image/png', buffer: Buffer.from(image, 'base64') });
  await expect(page.getByLabel('Vaccine name', { exact: true })).toHaveValue(/rabies/i, { timeout: 60000 });
  await expect(page.getByLabel('Given date', { exact: true })).toHaveValue('2026-03-04');
  await expect(page.getByRole('button', { name: 'Save reviewed vaccinations' })).toBeDisabled();
});

test('starter plans save once and keep custom routines', async ({ page, request }, testInfo) => {
  await page.goto('/care/milo/start');
  await page.setViewportSize({ width: 320, height: 740 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Add selected routines' }).click();
  await expect(page.getByRole('status')).toContainText('already saved');
  // The existing water routine is recognised; adding another suggested activity
  // must preserve it and save a single occurrence across repeated submissions.
  await page.getByLabel('Add to Today', { exact: true }).first().check();
  await page.getByRole('button', { name: 'Add selected routines' }).click();
  await expect(page.getByRole('status')).toContainText('selected routines are on Today');
  await page.getByRole('button', { name: 'Add selected routines' }).click();
  await expect(page.getByRole('status')).toContainText('already saved');
  const uid = testInfo.annotations.find(item => item.type === 'uid').description;
  const saved = await (await request.get(`http://127.0.0.1:9015/careRoutines/${uid}.json?ns=demo-pawppy-default-rtdb&access_token=owner`)).json();
  expect(Object.values(saved)).toHaveLength(2); expect(saved.water.title).toBe('Fresh water');
});

test('safety card choices, printable QR and account-free finder contact work', async ({ page, context }) => {
  let config = null; const cardToken = token();
  await page.route('**/getMySafetyCard', route => callable(route, config));
  await page.route('**/saveSafetyCard', route => { config = { ...route.request().postDataJSON().data, token: cardToken }; return callable(route, config); });
  await page.goto('/care/milo/safety');
  await page.getByLabel('Enable the public safety card').check();
  await page.getByLabel('Contact phone', { exact: true }).fill('+91 9999999999');
  await page.getByRole('button', { name: 'Save safety card', exact: true }).click();
  await expect(page.getByLabel('Safety card link', { exact: true })).toHaveValue(new RegExp(`/found/${cardToken}`));
  await expect(page.getByRole('button', { name: 'Print safety card' })).toBeVisible();
  const visitor = await context.browser().newContext({ viewport: { width: 320, height: 740 }, serviceWorkers: 'block' });
  await visitor.route('**/*', route => (['127.0.0.1', 'localhost'].includes(new URL(route.request().url()).hostname) || route.request().url().startsWith('blob:http://127.0.0.1:4175/')) ? route.continue() : route.abort());
  await visitor.route('**/getSafetyCard', route => callable(route, { name: 'Milo', type: 'Dog', phone: config.phone, message: 'Please call my parent.' }));
  const finder = await visitor.newPage(); await finder.goto(`/found/${cardToken}`);
  await expect(finder.getByRole('link', { name: /Call/ })).toHaveAttribute('href', 'tel:+919999999999');
  await expect(finder.getByRole('heading', { name: 'Have you found Milo?' })).toBeVisible();
  expect(await finder.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await finder.getByRole('link', { name: 'Create my pet’s space' }).click();
  await expect(finder).toHaveURL(/source=safety/); await visitor.close();
  await page.getByLabel('Enable the public safety card').uncheck(); await page.getByRole('button', { name: 'Save safety card', exact: true }).click();
  await expect(page.getByLabel('Safety card link', { exact: true })).toHaveCount(0);
});

test('handover drafts survive navigation and completed care accepts a private team update', async ({ page }) => {
  await page.goto('/family/handover');
  await page.getByLabel('Food & water instructions').fill('Use the food in the labelled container.');
  await page.goto('/today'); await page.goto('/family/handover');
  await expect(page.getByLabel('Food & water instructions')).toHaveValue('Use the food in the labelled container.');
  await page.getByRole('button', { name: 'Save Milo’s instructions' }).click();
  await expect(page.getByRole('status')).toContainText('Instructions saved');
  await page.reload(); await expect(page.getByLabel('Food & water instructions')).toHaveValue('Use the food in the labelled container.');
  await page.goto('/today'); await page.getByRole('button', { name: 'Complete Fresh water for Milo' }).click();
  await page.getByRole('button', { name: 'Add update for Fresh water for Milo' }).click();
  const sheet = page.getByRole('dialog', { name: 'Fresh water · Milo' });
  await sheet.getByLabel('A little update').fill('Fresh water and a happy dog.');
  const photo = await page.evaluate(() => { const canvas = document.createElement('canvas'); canvas.width = canvas.height = 100; const ctx = canvas.getContext('2d'); ctx.fillStyle = '#71568e'; ctx.fillRect(0, 0, 100, 100); return canvas.toDataURL('image/png').split(',')[1]; });
  await sheet.getByLabel('Choose a photo', { exact: false }).setInputFiles({ name: 'care-photo.png', mimeType: 'image/png', buffer: Buffer.from(photo, 'base64') });
  await expect(sheet.getByAltText('Photo ready to attach')).toBeVisible();
  await sheet.getByRole('button', { name: 'Save care update' }).click();
  await expect(sheet.getByRole('status')).toHaveText('Update saved for the care team.');
  await expect(sheet.getByAltText('Care update for Milo')).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'View update for Fresh water for Milo' }).click();
  await expect(page.locator('.growth-saved-update').getByText('Fresh water and a happy dog.', { exact: true })).toBeVisible();
});

test('weekly cards require publishing, support image downloads and can revoke a link', async ({ page }) => {
  let cards = [], published = null;
  await page.route('**/listMyWeeklyCards', route => callable(route, cards));
  await page.route('**/publishWeeklyCard', route => { const data = route.request().postDataJSON().data; published = { token: data.requestId, card: { name: 'Milo', caption: data.caption, photo: '', startDate: '2026-10-18', endDate: '2026-10-24', milestones: [] } }; cards = [{ token: data.requestId, endDate: '2026-10-24', createdAt: Date.now() }]; return callable(route, published); });
  await page.route('**/revokeWeeklyCard', route => { cards = []; return callable(route, { success: true }); });
  await page.goto('/care/milo/week');
  await page.getByLabel('A little caption').fill('A sunny walk and a favourite toy.');
  await expect(page.getByLabel('Weekly card link', { exact: true })).toHaveCount(0);
  const download = page.waitForEvent('download'); await page.getByRole('button', { name: 'Download card image' }).click(); expect((await download).suggestedFilename()).toBe('pawppy-week.png');
  await page.getByRole('button', { name: 'Create reviewed share link' }).click();
  await expect(page.getByLabel('Weekly card link', { exact: true })).toHaveValue(new RegExp(`/week/${published.token}`));
  await page.setViewportSize({ width: 320, height: 740 }); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: 'test-results/weekly-card-mobile.png', fullPage: true });
  await page.getByRole('button', { name: 'Turn off link', exact: true }).click();
  const confirmation = page.getByRole('dialog', { name: 'Turn off this weekly card?' }); await confirmation.getByRole('button', { name: 'Turn off link', exact: true }).click();
  await expect(page.getByLabel('Weekly card link', { exact: true })).toHaveCount(0);
});

test('PDF cards use the document reader and still require explicit review', async ({ page }) => {
  await page.goto('/care/milo/import');
  const content = 'BT /F1 20 Tf 40 700 Td (Rabies 2026-03-04 2027-03-04) Tj ET';
  const objects = ['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>', '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 600 800] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>', `<< /Length ${content.length} >>\nstream\n${content}\nendstream`];
  let pdf = '%PDF-1.4\n'; const offsets = [0];
  objects.forEach((object, index) => { offsets.push(Buffer.byteLength(pdf)); pdf += `${index + 1} 0 obj\n${object}\nendobj\n`; });
  const xref = Buffer.byteLength(pdf); pdf += `xref\n0 6\n0000000000 65535 f \n${offsets.slice(1).map(offset => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  await page.getByLabel('Choose vaccination card').setInputFiles({ name: 'vaccinations.pdf', mimeType: 'application/pdf', buffer: Buffer.from(pdf) });
  await expect(page.getByLabel('Vaccine name', { exact: true })).toHaveValue('Rabies', { timeout: 20000 });
  await expect(page.getByLabel('Given date', { exact: true })).toHaveValue('2026-03-04');
  await expect(page.getByRole('button', { name: 'Save reviewed vaccinations' })).toBeDisabled();
});

test('an invitation can be reviewed before signup and retains the acceptance destination', async ({ page, context }) => {
  const visitor = await context.browser().newContext({ serviceWorkers: 'block' });
  await visitor.route('**/*', route => (['127.0.0.1', 'localhost'].includes(new URL(route.request().url()).hostname) || route.request().url().startsWith('blob:http://127.0.0.1:4175/')) ? route.continue() : route.abort());
  await visitor.route('**/previewCareInvitation', route => callable(route, { ownerName: 'Riya', role: 'sitter', accessDays: 3, expiresAt: Date.now() + 86400000 }));
  const guest = await visitor.newPage(), invitationToken = token();
  await guest.goto(`/invite/owner/${invitationToken}`);
  await expect(guest.getByRole('heading', { name: 'Riya invited you to help with care' })).toBeVisible();
  await expect(guest.getByText('3 days of access after accepting', { exact: false })).toBeVisible();
  await guest.getByRole('link', { name: 'Create an account to join' }).click();
  await expect(guest).toHaveURL(/source=family/);
  expect(new URL(guest.url()).searchParams.get('next')).toBe(`/family?owner=owner&invite=${invitationToken}`);
  await visitor.close();
});

test('share attribution records an allowlisted signup source without storing a public token', async ({ page, request }, testInfo) => {
  const uid = testInfo.annotations.find(item => item.type === 'uid').description;
  await request.put(`http://127.0.0.1:9015/productEvents/${uid}/signup.json?ns=demo-pawppy-default-rtdb&access_token=owner`, { data: { name: 'signup_completed', screen: 'login', sessionId: 'signup-before-navigation', timestamp: Date.now(), platform: 'browser' } });
  await page.evaluate(uid => { sessionStorage.setItem('pawppy_signup_pending', uid); sessionStorage.setItem('pawppy_share_source', JSON.stringify({ source: 'safety', at: Date.now() })); }, uid);
  await page.reload();
  await expect.poll(async () => {
    const response = await request.get(`http://127.0.0.1:9015/productEvents/${uid}.json?ns=demo-pawppy-default-rtdb&access_token=owner`);
    return Object.values(await response.json() || {}).some(event => event.name === 'safety_link_signup');
  }).toBe(true);
  const response = await request.get(`http://127.0.0.1:9015/productEvents/${uid}.json?ns=demo-pawppy-default-rtdb&access_token=owner`);
  const events = Object.values(await response.json() || {});
  for (const event of events) expect(Object.keys(event).sort()).toEqual(['name','platform','screen','sessionId','timestamp'].sort());
});
