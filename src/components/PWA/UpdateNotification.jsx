import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiDownload, FiX, FiRefreshCw, FiAlertCircle } from 'react-icons/fi';
import { useRegisterSW } from 'virtual:pwa-register/react';

const UpdateNotification = () => {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const fallbackTimerRef = useRef(null);

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(registration) {
      if (registration) {
        // Poll for updates every hour
        setInterval(() => registration.update(), 60 * 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.warn('SW registration error', error);
    },
  });

  useEffect(() => {
    if (needRefresh) setShowUpdatePrompt(true);
  }, [needRefresh]);

  // Cleanup fallback timer on unmount
  useEffect(() => () => { if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current); }, []);

  const handleUpdate = () => {
    if (isUpdating) return;
    setIsUpdating(true);

    // Step 1: Listen for controllerchange BEFORE triggering skipWaiting.
    // This event fires only when the new SW has actually activated and taken
    // control of the page — guaranteeing that the reload serves the new version.
    if ('serviceWorker' in navigator) {
      const onControllerChange = () => {
        clearTimeout(fallbackTimerRef.current);
        // Use location.href assignment instead of reload() — more reliable on
        // mobile PWA standalone mode where reload() can serve stale cache.
        window.location.href = window.location.href;
      };

      navigator.serviceWorker.addEventListener('controllerchange', onControllerChange, { once: true });

      // Fallback: if controllerchange hasn't fired within 5 s something went
      // wrong — force reload anyway so the user isn't stuck on a spinner.
      fallbackTimerRef.current = setTimeout(() => {
        navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
        window.location.href = window.location.href;
      }, 5000);
    }

    // Step 2: Send SKIP_WAITING to the waiting SW without reloading.
    // The controllerchange listener above will trigger the reload once the new
    // SW has taken over.
    updateServiceWorker(false);
  };

  const handleDismiss = () => {
    setShowUpdatePrompt(false);
    setNeedRefresh(false);
  };

  return (
    <>
      {/* Update Available Notification */}
      <AnimatePresence>
        {showUpdatePrompt && needRefresh && (
          <motion.div
            className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 z-[9999]"
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className="bg-gradient-to-br from-violet-600 to-purple-600 text-white rounded-2xl shadow-2xl p-5 border-2 border-white/20">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <motion.div
                    className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center"
                    animate={isUpdating ? { rotate: 360 } : {}}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <FiRefreshCw className="text-2xl" />
                  </motion.div>
                  <div>
                    <h3 className="font-bold text-lg">
                      {isUpdating ? 'Updating Pawppy…' : 'New Version Available! 🎉'}
                    </h3>
                    <p className="text-white/80 text-sm">
                      {isUpdating
                        ? 'Installing update, please wait…'
                        : 'A fresh version is ready to install'}
                    </p>
                  </div>
                </div>
                {!isUpdating && (
                  <button
                    onClick={handleDismiss}
                    className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                    aria-label="Dismiss update notification"
                  >
                    <FiX className="text-xl" />
                  </button>
                )}
              </div>

              {!isUpdating && (
                <div className="flex gap-3">
                  <button
                    onClick={handleDismiss}
                    className="flex-1 px-4 py-3 bg-white/20 hover:bg-white/30 rounded-xl font-semibold text-sm transition-colors"
                  >
                    Later
                  </button>
                  <button
                    onClick={handleUpdate}
                    className="flex-1 px-4 py-3 bg-white text-violet-600 hover:bg-white/90 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2 shadow-lg"
                  >
                    <FiDownload />
                    Update Now
                  </button>
                </div>
              )}

              {isUpdating && (
                <div className="w-full bg-white/20 rounded-full h-1.5 overflow-hidden">
                  <motion.div
                    className="h-full bg-white rounded-full"
                    initial={{ width: '0%' }}
                    animate={{ width: '90%' }}
                    transition={{ duration: 4, ease: 'easeOut' }}
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Offline Ready Notification */}
      <AnimatePresence>
        {offlineReady && (
          <motion.div
            className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 z-[9999]"
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-2xl shadow-2xl p-5 border-2 border-white/20">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <FiAlertCircle className="text-2xl" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-1">Ready for Offline Use! 📱</h3>
                    <p className="text-white/90 text-sm">
                      Pawppy is now cached and works without internet
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setOfflineReady(false)}
                  className="p-1 hover:bg-white/20 rounded-lg transition-colors ml-2"
                  aria-label="Dismiss offline notification"
                >
                  <FiX className="text-xl" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default UpdateNotification;
