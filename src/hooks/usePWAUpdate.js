import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

const PWAUpdateContext = createContext(null);

function workerBuildId(worker) {
  if (!worker) return Promise.resolve(null);
  return new Promise(resolve => {
    const channel = new MessageChannel();
    const finish = value => { clearTimeout(timer); channel.port1.close(); channel.port2.close(); resolve(value); };
    const timer = setTimeout(() => finish(null), 2000);
    channel.port1.onmessage = event => finish(event.data?.buildId);
    try { worker.postMessage({ type: 'GET_BUILD_ID' }, [channel.port2]); }
    catch { finish(null); }
  });
}

function activateWorker(worker) {
  return new Promise((resolve, reject) => {
    const finish = error => {
      clearTimeout(timer);
      clearInterval(poll);
      navigator.serviceWorker.removeEventListener('controllerchange', changed);
      worker.removeEventListener('statechange', changed);
      error ? reject(error) : resolve();
    };
    const changed = () => {
      if (navigator.serviceWorker.controller === worker && worker.state === 'activated') finish();
      else if (worker.state === 'redundant') finish(new Error('A newer update replaced this one. Please try again.'));
    };
    const timer = setTimeout(() => finish(new Error('Update activation timed out. Please retry.')), 20000);
    // Mobile browsers can suspend the page between lifecycle events.
    const poll = setInterval(changed, 250);
    navigator.serviceWorker.addEventListener('controllerchange', changed);
    worker.addEventListener('statechange', changed);
    try { worker.postMessage({ type: 'SKIP_WAITING' }); changed(); }
    catch (error) { finish(error); }
  });
}

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
  const activatedUpdate = useRef(false);
  const remoteUpdate = useRef(false);
  const remoteBuild = useRef(null);
  const [registration, setRegistration] = useState(null);
  const [offlineReady, setOfflineReady] = useState(false);
  const [needRefresh, setNeedRefresh] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const register = useCallback(() => {
    if (!('serviceWorker' in navigator)) return Promise.reject(new Error('App updates are unavailable in this browser.'));
    if (!registrationPromise.current) {
      registrationPromise.current = navigator.serviceWorker.register(import.meta.env.PROD ? '/sw.js' : '/dev-sw.js?dev-sw', { scope: '/', updateViaCache: 'none', type: import.meta.env.PROD ? 'classic' : 'module' }).then(value => {
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
          remoteBuild.current = version.buildId;
          // A release announcement is not an installed update. Download it in
          // the background before offering an action that promises to reload.
          if (remoteUpdate.current && !current.waiting && !activatedUpdate.current) setIsDownloading(true);
        } finally { clearTimeout(timer); }
      };
      const [versionResult, workerResult] = await Promise.allSettled([checkVersion(), current.update()]);
      if (workerResult.status === 'rejected' && !current.waiting) throw workerResult.reason;
      if (current.installing && navigator.serviceWorker.controller && !current.waiting) setIsDownloading(true);
      try { await waitForInstall(current.installing); }
      catch (error) { setIsDownloading(false); throw error; }
      // The registration's waiting slot can be assigned just after statechange.
      await new Promise(resolve => setTimeout(resolve, 0));
      // Another tab may have updated the worker before this page subscribed.
      if (!current.waiting && remoteUpdate.current && !activatedUpdate.current) {
        const activeBuild = await workerBuildId(navigator.serviceWorker.controller);
        activatedUpdate.current = Boolean(activeBuild && activeBuild !== __APP_BUILD__ && activeBuild === remoteBuild.current);
      }
      const available = Boolean(current.waiting || activatedUpdate.current);
      setNeedRefresh(available);
      setIsDownloading(!available && remoteUpdate.current);
      if (!available && versionResult.status === 'rejected') throw versionResult.reason;
      if (!available && remoteUpdate.current) throw new Error('The new release is not ready on this device yet. Pawppy will check again automatically.');
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
      const ready = Boolean(worker || activatedUpdate.current);
      setNeedRefresh(ready);
      setIsDownloading(!ready && Boolean((registration.installing && navigator.serviceWorker.controller) || remoteUpdate.current));
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
    let lastCheck = Date.now();
    const timer = setInterval(() => {
      // Retry a release still propagating without making normal checks noisier.
      const pendingRelease = remoteUpdate.current && !registration.waiting && !activatedUpdate.current;
      if (pendingRelease || Date.now() - lastCheck >= 5 * 60 * 1000) { lastCheck = Date.now(); check(); }
    }, 30000);
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
      // A downloaded or already activated worker needs no further network check.
      // Accept it immediately even when mobile connectivity is intermittent.
      if (!registrationRef.current?.waiting && !activatedUpdate.current && !await checkForUpdates()) return;
      const worker = registrationRef.current?.waiting;
      if (worker) {
        await activateWorker(worker);
      } else if (!activatedUpdate.current) {
        // A changed version.json is not proof that the controlling worker has
        // updated. Reloading here used to reopen the same cached release.
        const activeBuild = await workerBuildId(navigator.serviceWorker.controller);
        if (!activeBuild || activeBuild !== remoteBuild.current) {
          throw new Error('The new version is still downloading. Keep Pawppy open and try again shortly.');
        }
      }
      window.location.reload();
    })().finally(() => { updatingRef.current = null; });
    return updatingRef.current;
  };

  const reloadApp = async () => {
    if (!navigator.onLine) throw new Error('Reconnect before reloading');
    if (registrationRef.current && await checkForUpdates()) await updateApp();
    else window.location.reload();
  };

  return <PWAUpdateContext.Provider value={{ offlineReady, setOfflineReady, needRefresh, isDownloading, showUpdatePrompt: (needRefresh || isDownloading) && !dismissed, dismissUpdate: () => setDismissed(true), updateApp, checkForUpdates, reloadApp }}>{children}</PWAUpdateContext.Provider>;
}

export const usePWAUpdate = () => {
  const value = useContext(PWAUpdateContext);
  if (!value) throw new Error('usePWAUpdate must be used within PWAUpdateProvider');
  return value;
};
