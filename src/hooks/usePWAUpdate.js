import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

const PWAUpdateContext = createContext(null);

function waitForInstall(worker) {
  if (!worker) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const finish = error => { clearTimeout(timer); worker.removeEventListener('statechange', changed); error ? reject(error) : resolve(); };
    const changed = () => {
      if (['installed', 'activated'].includes(worker.state)) finish();
      if (worker.state === 'redundant') finish(new Error('The update could not be downloaded. Please retry.'));
    };
    const timer = setTimeout(() => finish(new Error('The update download timed out. Please retry.')), 120000);
    worker.addEventListener('statechange', changed);
    changed();
  });
}

// One native registration for the app. Push uses its own /firebase-push/ scope.
// Read actual worker state instead of Workbox's time-based update heuristics.
export function PWAUpdateProvider({ children }) {
  const registrationRef = useRef(null);
  const registrationPromise = useRef(null);
  const checkingRef = useRef(null);
  const updatingRef = useRef(null);
  const reloadRequested = useRef(false);
  const activatedUpdate = useRef(false);
  const remoteUpdate = useRef(false);
  const [registration, setRegistration] = useState(null);
  const [offlineReady, setOfflineReady] = useState(false);
  const [needRefresh, setNeedRefresh] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const register = useCallback(() => {
    if (!('serviceWorker' in navigator)) return Promise.reject(new Error('App updates are unavailable in this browser.'));
    if (!registrationPromise.current) {
      registrationPromise.current = navigator.serviceWorker.register(import.meta.env.PROD ? '/sw.js' : '/dev-sw.js?dev-sw', { scope: '/', updateViaCache: 'none' }).then(value => {
        registrationRef.current = value;
        setRegistration(value);
        return value;
      }).catch(error => { registrationPromise.current = null; throw error; });
    }
    return registrationPromise.current;
  }, []);

  const checkForUpdates = useCallback(() => {
    if (!navigator.onLine) return Promise.reject(new Error('Reconnect to check for updates.'));
    if (checkingRef.current) return checkingRef.current;
    checkingRef.current = (async () => {
      const current = await register();
      // This file is deliberately outside the worker's precache. It also detects
      // an old open page after another tab has already activated the new worker.
      const checkVersion = async () => {
        if (!import.meta.env.PROD) return;
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 10000);
        try {
          const response = await fetch('/version.json', { cache: 'no-store', signal: controller.signal });
          if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) throw new Error('Could not check the latest release. Please retry.');
          const version = await response.json();
          if (typeof version.buildId !== 'string' || !version.buildId) throw new Error('Invalid release information.');
          remoteUpdate.current = version.buildId !== __APP_BUILD__;
          if (remoteUpdate.current) setNeedRefresh(true);
        } finally { clearTimeout(timer); }
      };
      const [versionResult, workerResult] = await Promise.allSettled([checkVersion(), current.update()]);
      if (workerResult.status === 'rejected') throw workerResult.reason;
      await waitForInstall(current.installing);
      // The registration's waiting slot can be assigned just after statechange.
      await new Promise(resolve => setTimeout(resolve, 0));
      const available = Boolean(current.waiting || activatedUpdate.current || remoteUpdate.current);
      setNeedRefresh(available);
      if (!available && versionResult.status === 'rejected') throw versionResult.reason;
      return available;
    })().finally(() => { checkingRef.current = null; });
    return checkingRef.current;
  }, [register]);

  useEffect(() => { register().catch(error => console.warn('PWA registration failed:', error.message)); }, [register]);

  useEffect(() => {
    if (!registration) return;
    let previousController = navigator.serviceWorker.controller;
    let observedWorker;
    let disposed = false;
    const watched = new Set();
    const sync = () => {
      if (disposed) return;
      const worker = registration.waiting;
      setNeedRefresh(Boolean(worker || activatedUpdate.current || remoteUpdate.current));
      if (worker && worker !== observedWorker) setDismissed(false);
      observedWorker = worker;
    };
    const changed = () => { sync(); setTimeout(sync, 0); };
    const watch = () => {
      const worker = registration.installing;
      if (worker && !watched.has(worker)) {
        watched.add(worker);
        worker.addEventListener('statechange', changed);
      }
      sync();
    };
    const controlled = () => {
      const controller = navigator.serviceWorker.controller;
      if (controller && reloadRequested.current) {
        reloadRequested.current = false;
        window.location.reload();
        return;
      }
      if (previousController && controller !== previousController) {
        activatedUpdate.current = true;
        setDismissed(false);
      } else if (!previousController && controller) setOfflineReady(true);
      previousController = controller;
      sync();
    };
    const check = () => {
      if (!document.hidden && navigator.onLine) checkForUpdates().catch(() => {});
    };
    registration.addEventListener('updatefound', watch);
    navigator.serviceWorker.addEventListener('controllerchange', controlled);
    document.addEventListener('visibilitychange', check);
    for (const event of ['focus', 'pageshow', 'online']) window.addEventListener(event, check);
    const timer = setInterval(check, 5 * 60 * 1000);
    watch();
    check();
    return () => {
      disposed = true;
      clearInterval(timer);
      registration.removeEventListener('updatefound', watch);
      watched.forEach(worker => worker.removeEventListener('statechange', changed));
      navigator.serviceWorker.removeEventListener('controllerchange', controlled);
      document.removeEventListener('visibilitychange', check);
      for (const event of ['focus', 'pageshow', 'online']) window.removeEventListener(event, check);
    };
  }, [registration, checkForUpdates]);

  const updateApp = () => {
    if (updatingRef.current) return updatingRef.current;
    updatingRef.current = (async () => {
      if (!navigator.onLine) throw new Error('Reconnect to update Pawppy.');
      const available = await checkForUpdates();
      if (!available) return;
      const worker = registrationRef.current?.waiting;
      if (worker) {
        // Reload only after the accepted worker controls this page. Never delete
        // registrations, app data, or caches to force an update.
        await new Promise((resolve, reject) => {
          const finish = error => { clearTimeout(timer); navigator.serviceWorker.removeEventListener('controllerchange', changed); error ? reject(error) : resolve(); };
          const changed = () => { if (navigator.serviceWorker.controller === worker) finish(); };
          const timer = setTimeout(() => { reloadRequested.current = false; finish(new Error('Update activation timed out. Please retry.')); }, 15000);
          navigator.serviceWorker.addEventListener('controllerchange', changed);
          reloadRequested.current = true;
          worker.postMessage({ type: 'SKIP_WAITING' });
        });
      } else if (activatedUpdate.current || remoteUpdate.current) {
        // The new worker may already be active, e.g. accepted in another tab.
        window.location.reload();
      }
    })().finally(() => { updatingRef.current = null; });
    return updatingRef.current;
  };

  const reloadApp = async () => {
    if (!navigator.onLine) throw new Error('Reconnect before reloading');
    if (registrationRef.current && await checkForUpdates()) await updateApp();
    else window.location.reload();
  };

  return <PWAUpdateContext.Provider value={{ offlineReady, setOfflineReady, needRefresh, showUpdatePrompt: needRefresh && !dismissed, dismissUpdate: () => setDismissed(true), updateApp, checkForUpdates, reloadApp }}>{children}</PWAUpdateContext.Provider>;
}

export const usePWAUpdate = () => {
  const value = useContext(PWAUpdateContext);
  if (!value) throw new Error('usePWAUpdate must be used within PWAUpdateProvider');
  return value;
};
