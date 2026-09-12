const { test, expect } = require('@playwright/test');

async function setup(page, request) {
  await page.route('**/*', route => ['127.0.0.1', 'localhost'].includes(new URL(route.request().url()).hostname) ? route.continue() : route.abort());
  const email = `copilot-${Date.now()}@example.test`, password = 'local-emulator-password';
  const response = await request.post('http://127.0.0.1:9098/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-key', { data: { email, password, returnSecureToken: true } });
  const account = await response.json();
  await request.post('http://127.0.0.1:9098/identitytoolkit.googleapis.com/v1/accounts:update?key=demo-key', { headers: { Authorization: 'Bearer owner' }, data: { localId: account.localId, emailVerified: true } });
  await request.patch('http://127.0.0.1:9015/.json?ns=demo-pawppy-default-rtdb&access_token=owner', { data: { [`users/${account.localId}`]: { displayName: 'Local parent', email }, [`userPets/${account.localId}/milo`]: { name: 'Milo', type: 'Cat' } } });
  await page.goto('/login');
  await page.getByLabel('Email Address').fill(email); await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign In', exact: true }).click(); await expect(page).toHaveURL(/today/);
}
const callable = (route, result) => route.fulfill({ status: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization,content-type', 'Access-Control-Allow-Methods': 'POST,OPTIONS' }, contentType: 'application/json', body: JSON.stringify({ result }) });

test('questions require consent, send no records, and clear without storing a conversation', async ({ page, request }) => {
  await setup(page, request);
  let payload;
  await page.route('**/getCopilotStatus', route => callable(route, { enabled: true, consentVersion: 'copilot-v1', dailyLimit: 5 }));
  await page.route('**/askPetCopilot', route => { if (route.request().method() === 'POST') payload = route.request().postDataJSON().data; return callable(route, { answer: 'Try short, supervised play sessions.', references: [], followUpQuestions: ['Which games does your pet enjoy?'], provider: 'Google Gemini on Vertex AI', model: 'test-model' }); });
  await page.getByRole('link', { name: /A little help from Pawppy Copilot/ }).click();
  await page.getByLabel('Your question').fill('Suggest indoor enrichment for my cat.');
  await expect(page.getByRole('button', { name: 'Ask Copilot', exact: true })).toBeDisabled();
  await page.getByLabel('I agree to send this question', { exact: false }).check();
  await page.getByRole('button', { name: 'Ask Copilot', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Copilot answer' })).toContainText('Try short, supervised play sessions.');
  expect(payload.mode).toBe('question'); expect(payload.petId).toBeUndefined(); expect(payload.sources).toBeUndefined(); expect(payload.consent).toBe(true);
  await expect(page.getByLabel('I agree to send this question', { exact: false })).not.toBeChecked();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/copilot-mobile.png', fullPage: true });
  await page.setViewportSize({ width: 1360, height: 1000 }); await page.screenshot({ path: 'test-results/copilot-desktop.png', fullPage: true });
  await page.getByRole('button', { name: 'Clear this session' }).click();
  await expect(page.getByRole('region', { name: 'Copilot answer' })).toHaveCount(0);
  await expect(page.getByLabel('Your question')).toBeEmpty();
});

test('record summaries require separate preview approval and changing pets clears consent', async ({ page, request }) => {
  await setup(page, request);
  let payload;
  await page.route('**/getCopilotStatus', route => callable(route, { enabled: true, consentVersion: 'copilot-v1', dailyLimit: 5 }));
  await page.route('**/previewCopilotRecords', route => callable(route, { fingerprint: 'preview-fingerprint', scope: 'Selected fields only', sources: [{ id: 'profile', label: 'Pet profile', value: 'Milo · Cat' }] }));
  await page.route('**/askPetCopilot', route => { if (route.request().method() === 'POST') payload = route.request().postDataJSON().data; return callable(route, { answer: 'Milo is recorded as a cat.', references: ['profile'], followUpQuestions: [], provider: 'Google Gemini on Vertex AI', model: 'test-model' }); });
  await page.goto('/copilot?pet=milo');
  await expect(page.getByRole('region', { name: 'Records to send' })).toContainText('Milo · Cat');
  await page.getByLabel('I agree to send this question', { exact: false }).check();
  await expect(page.getByRole('button', { name: 'Prepare draft summary' })).toBeDisabled();
  await page.getByLabel('I approve sending these previewed records', { exact: false }).check();
  await page.getByRole('button', { name: 'Prepare draft summary' }).click();
  await expect(page.getByRole('region', { name: 'Copilot answer' })).toContainText('Milo is recorded as a cat.');
  expect(payload.petId).toBe('milo'); expect(payload.fingerprint).toBe('preview-fingerprint'); expect(payload.approveRecords).toBe(true); expect(payload.sources).toBeUndefined();
  await page.getByLabel('Choose your pet').selectOption('');
  await expect(page.getByRole('region', { name: 'Copilot answer' })).toHaveCount(0);
  await expect(page.getByLabel('I agree to send this question', { exact: false })).not.toBeChecked();
  await page.getByRole('button', { name: 'Review my records', exact: true }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
