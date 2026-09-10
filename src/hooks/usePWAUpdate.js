import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

const PWAUpdateContext = createContext(null);

// One registration and one update state for the banner and the settings button.
export function PWAUpdateProvider({ children }) {
  const registrationRef = useRef(null);
  const [registration, setRegistration] = useState(null);
  const [waiting, setWaiting] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [reportedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: true,
    onRegisteredSW(_url, value) {
      registrationRef.current = value;
      setRegistration(value);
    },
    onRegisterError(error) { console.warn('PWA registration failed:', error); },
  });

  useEffect(() => {
    if (!registration) return;
    let observedWorker;
    const watchedWorkers = new Set();
    const sync = () => {
      // Workbox can also report an external/first installation. Only an actual
      // waiting worker is an update the user can apply.
      const worker = registration.waiting;
      setWaiting(Boolean(worker && worker.state === 'installed'));
      if (worker && worker !== observedWorker) setDismissed(false);
      observedWorker = worker;
    };
    const watch = () => {
      const worker = registration.installing;
      if (worker && !watchedWorkers.has(worker)) {
        watchedWorkers.add(worker);
        worker.addEventListener('statechange', sync);
      }
      sync();
    };
    const check = () => { if (!document.hidden && navigator.onLine) registration.update().catch(() => {}); };
    registration.addEventListener('updatefound', watch);
    navigator.serviceWorker.addEventListener('controllerchange', sync);
    document.addEventListener('visibilitychange', check);
    const timer = window.setInterval(check, 60 * 60 * 1000);
    watch();
    return () => {
      clearInterval(timer);
      registration.removeEventListener('updatefound', watch);
      watchedWorkers.forEach(worker => worker.removeEventListener('statechange', sync));
      navigator.serviceWorker.removeEventListener('controllerchange', sync);
      document.removeEventListener('visibilitychange', check);
    };
  }, [registration]);

  useEffect(() => {
    if (reportedRefresh) setWaiting(Boolean(registrationRef.current?.waiting));
  }, [reportedRefresh]);

  const checkForUpdates = async () => {
    const current = registrationRef.current;
    if (!current) throw new Error('Update checks are not available yet.');
    await current.update();
    const installing = current.installing;
    if (installing) await new Promise((resolve, reject) => {
      const timer = setTimeout(() => finish(new Error('The update check timed out. Try again.')), 20000);
      const finish = error => { clearTimeout(timer); installing.removeEventListener('statechange', changed); error ? reject(error) : resolve(); };
      const changed = () => {
        if (['installed', 'activated'].includes(installing.state)) finish();
        if (installing.state === 'redundant') finish(new Error('The update could not be downloaded.'));
      };
      installing.addEventListener('statechange', changed);
      changed();
    });
    setWaiting(Boolean(current.waiting));
    setDismissed(false);
  };

  const updateApp = async () => {
    if (!registrationRef.current?.waiting) { setWaiting(false); return; }
    // Workbox reloads once the new worker takes control. Never force a timed
    // reload: that can load the old worker again and repeat the same prompt.
    await updateServiceWorker(true);
  };

  const reloadApp = async () => {
    if (!navigator.onLine) throw new Error('Reconnect before reloading');
    if (registrationRef.current) await checkForUpdates();
    if (registrationRef.current?.waiting) await updateApp();
    else window.location.reload();
  };

  return <PWAUpdateContext.Provider value={{ offlineReady, setOfflineReady, needRefresh: waiting, showUpdatePrompt: waiting && !dismissed, dismissUpdate: () => setDismissed(true), updateApp, checkForUpdates, reloadApp }}>{children}</PWAUpdateContext.Provider>;
}

export const usePWAUpdate = () => {
  const value = useContext(PWAUpdateContext);
  if (!value) throw new Error('usePWAUpdate must be used within PWAUpdateProvider');
  return value;
};
