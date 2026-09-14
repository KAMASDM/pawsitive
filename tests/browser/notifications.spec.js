const { test, expect } = require('@playwright/test');
test('Settings shows device registration and sends a test only after an explicit click', async ({ page, request }) => {
  await page.route('**/*', route => ['127.0.0.1', 'localhost'].includes(new URL(route.request().url()).hostname) ? route.continue() : route.abort());
  const email = `push-${Date.now()}@example.test`, password = 'local-emulator-password';
  const signup = await request.post('http://127.0.0.1:9098/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-key', { data: { email, password, returnSecureToken: true } });
  const user = await signup.json();
  await request.post('http://127.0.0.1:9098/identitytoolkit.googleapis.com/v1/accounts:update?key=demo-key', { headers: { Authorization: 'Bearer owner' }, data: { localId: user.localId, emailVerified: true } });
  await request.patch('http://127.0.0.1:9015/.json?ns=demo-pawppy-default-rtdb&access_token=owner', { data: { [`users/${user.localId}`]: { email, notificationPreferences: { push: { enabled: false } } } } });
  await page.goto('/login');
  await page.getByLabel('Email Address').fill(email); await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign In', exact: true }).click(); await expect(page).toHaveURL(/today/);
  await page.goto('/settings');
  await expect(page.getByText('Push notifications are not connected on this device.', { exact: false })).toBeVisible();
  await expect(page.getByText('Push is turned off for your account.', { exact: false })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Send test notification' })).toBeDisabled();
  await page.evaluate(() => localStorage.setItem('pawppy_notification_device', 'browser-test-device'));
  await request.patch('http://127.0.0.1:9015/.json?ns=demo-pawppy-default-rtdb&access_token=owner', { data: { [`notificationDevices/${user.localId}/browser-test-device`]: { token: 'fixture-token' } } });
  let calls = 0;
  await page.route('**/testNotificationDevice', route => {
    if (route.request().method() === 'POST') { calls++; expect(route.request().postDataJSON().data).toEqual({ deviceId: 'browser-test-device' }); }
    return route.fulfill({ status: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization,content-type', 'Access-Control-Allow-Methods': 'POST,OPTIONS' }, contentType: 'application/json', body: JSON.stringify({ result: { accepted: true } }) });
  });
  await expect(page.getByRole('button', { name: 'Send test notification' })).toBeEnabled(); expect(calls).toBe(0);
  await page.getByRole('button', { name: 'Send test notification' }).click();
  await expect(page.getByRole('status')).toContainText('Firebase accepted the test'); expect(calls).toBe(1);
});
