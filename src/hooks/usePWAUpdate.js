import { useRegisterSW } from 'virtual:pwa-register/react';

/**
 * Custom hook to manage PWA updates
 * @returns {Object} - PWA update utilities
 */
export const usePWAUpdate = () => {
  const {
    offlineReady: [offlineReady],
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(registration) {
      console.log('PWA: Service Worker registered');
      
      if (registration) {
        // Check for updates every 30 minutes
        setInterval(() => {
          console.log('PWA: Checking for updates...');
          registration.update();
        }, 30 * 60 * 1000);
        
        // Also check on visibility change (when user returns to tab)
        document.addEventListener('visibilitychange', () => {
          if (!document.hidden) {
            console.log('PWA: User returned, checking for updates...');
            registration.update();
          }
        });
      }
    },
    onRegisterError(error) {
      console.error('PWA: Service Worker registration error', error);
    },
    immediate: true, // Register SW immediately
  });

  /**
   * Manually trigger an update
   */
  const checkForUpdates = async () => {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        console.log('PWA: Manually checking for updates...');
        await registration.update();
      }
    }
  };

  /**
   * Update the app immediately
   */
  const updateApp = async () => {
    await updateServiceWorker(true);
  };

  return {
    offlineReady,
    needRefresh,
    updateApp,
    checkForUpdates,
  };
};
