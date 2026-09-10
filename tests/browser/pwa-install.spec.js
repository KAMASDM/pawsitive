const { test, expect } = require('@playwright/test');

async function mountInstall(page, { standalone = false, ios = false } = {}) {
  await page.addInitScript(({ standalone, ios }) => {
    if (standalone) Object.defineProperty(navigator, 'standalone', { value: true });
    if (ios) Object.defineProperty(navigator, 'userAgent', { value: 'iPhone Safari' });
  }, { standalone, ios });
  await page.route('**/__install-review', route => route.fulfill({ contentType: 'text/html', body: '<div id="root"></div>' }));
  await page.goto('/__install-review');
  await page.evaluate(async () => {
    const RefreshRuntime = (await import('/@react-refresh')).default;
    RefreshRuntime.injectIntoGlobalHook(window);
    window.$RefreshReg$ = () => {};
    window.$RefreshSig$ = () => type => type;
    window.__vite_plugin_react_preamble_installed__ = true;
    const React = (await import('/node_modules/.vite/deps/react.js')).default;
    const { createRoot } = (await import('/node_modules/.vite/deps/react-dom_client.js')).default;
    const Install = (await import('/src/components/InstallPWA/InstallPWA.jsx')).default;
    createRoot(document.getElementById('root')).render(React.createElement(Install));
  });
  // A second event-loop turn lets React mount its effect before browser events.
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

async function offerInstall(page, outcome = 'dismissed') {
  await page.evaluate(outcome => {
    const event = new Event('beforeinstallprompt', { cancelable: true });
    event.prompt = async () => {};
    event.userChoice = Promise.resolve({ outcome });
    window.dispatchEvent(event);
  }, outcome);
}

test('installation cancels a pending banner and survives a later browser visit', async ({ page }) => {
  await mountInstall(page);
  await page.clock.install();
  await offerInstall(page);
  await page.evaluate(() => window.dispatchEvent(new Event('appinstalled')));
  await page.clock.fastForward(3000);
  await expect(page.getByText('Install Pawppy', { exact: true })).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('pwa-installed'))).toBe('true');
  await page.reload();
  await page.evaluate(async () => {
    const RefreshRuntime = (await import('/@react-refresh')).default;
    RefreshRuntime.injectIntoGlobalHook(window);
    window.$RefreshReg$ = () => {};
    window.$RefreshSig$ = () => type => type;
    window.__vite_plugin_react_preamble_installed__ = true;
    const React = (await import('/node_modules/.vite/deps/react.js')).default;
    const { createRoot } = (await import('/node_modules/.vite/deps/react-dom_client.js')).default;
    const Install = (await import('/src/components/InstallPWA/InstallPWA.jsx')).default;
    createRoot(document.getElementById('root')).render(React.createElement(Install));
  });
  await offerInstall(page);
  await page.clock.fastForward(3000);
  await expect(page.getByText('Install Pawppy', { exact: true })).toHaveCount(0);
});

test('standalone iOS launch remembers installation without showing instructions', async ({ page }) => {
  await mountInstall(page, { standalone: true, ios: true });
  expect(await page.evaluate(() => localStorage.getItem('pwa-installed'))).toBe('true');
  await expect(page.getByText('Install Pawppy', { exact: true })).toHaveCount(0);
});

test('dismissing the native dialog suppresses repeated install events', async ({ page }) => {
  await mountInstall(page);
  await page.clock.install();
  await offerInstall(page);
  await page.clock.fastForward(2100);
  await page.getByRole('button', { name: 'Install App', exact: true }).click();
  expect(await page.evaluate(() => localStorage.getItem('pwa-install-dismissed'))).toBeTruthy();
  await offerInstall(page);
  await page.clock.fastForward(3000);
  await expect(page.getByText('Install Pawppy', { exact: true })).toHaveCount(0);
});
