import { clientsClaim } from 'workbox-core';
import { cleanupOutdatedCaches, matchPrecache, precacheAndRoute } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') event.waitUntil(self.skipWaiting());
  if (event.data?.type === 'GET_BUILD_ID') event.ports[0]?.postMessage({ buildId: __APP_BUILD__ });
});
clientsClaim();

// Register before precaching so /, /index.html and deep links all fetch fresh
// HTML online. A reload must not serve an obsolete cached entry point forever.
registerRoute(new NavigationRoute(async ({ request }) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(new Request(request, { cache: 'no-store', signal: controller.signal }));
    if (response.ok && response.headers.get('content-type')?.includes('text/html')) return response;
    return await matchPrecache('/index.html') || response;
  } catch (error) {
    const fallback = await matchPrecache('/index.html');
    if (fallback) return fallback;
    throw error;
  } finally {
    clearTimeout(timer);
  }
}, { denylist: [/^\/assets\//, /^\/\.netlify\//, /^\/firebase-push\//] }));

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

for (const [urlPattern, cacheName, maxEntries, maxAgeSeconds] of [
  [/^https:\/\/fonts\.googleapis\.com\//i, 'google-fonts-cache', 10, 60 * 60 * 24 * 365],
  [/^https:\/\/fonts\.gstatic\.com\//i, 'gstatic-fonts-cache', 10, 60 * 60 * 24 * 365],
  [/^https:\/\/firebasestorage\.googleapis\.com\//i, 'firebase-storage-cache', 50, 60 * 60 * 24 * 7],
]) {
  registerRoute(urlPattern, new CacheFirst({
    cacheName,
    plugins: [new ExpirationPlugin({ maxEntries, maxAgeSeconds }), new CacheableResponsePlugin({ statuses: [0, 200] })],
  }));
}
