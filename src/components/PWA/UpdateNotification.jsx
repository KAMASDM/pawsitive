import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiDownload, FiX, FiRefreshCw, FiAlertCircle } from 'react-icons/fi';
import { useRegisterSW } from 'virtual:pwa-register/react';

const UpdateNotification = () => {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(registration) {
      console.log('SW Registered:', registration);
      
      // Check for updates every hour
      if (registration) {
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000); // Check every hour
      }
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  useEffect(() => {
    if (needRefresh) {
      setShowUpdatePrompt(true);
    }
  }, [needRefresh]);

  const handleUpdate = async () => {
    setIsUpdating(true);
    
    // Show updating state for at least 1 second for better UX
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Update and reload
    updateServiceWorker(true);
  };

  const handleDismiss = () => {
    setShowUpdatePrompt(false);
    setNeedRefresh(false);
  };

  const handleOfflineDismiss = () => {
    setOfflineReady(false);
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
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  >
                    <FiRefreshCw className="text-2xl" />
                  </motion.div>
                  <div>
                    <h3 className="font-bold text-lg">New Version Available! 🎉</h3>
                    <p className="text-white/90 text-sm">Update now for the latest features</p>
                  </div>
                </div>
                <button
                  onClick={handleDismiss}
                  className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                  aria-label="Dismiss update notification"
                >
                  <FiX className="text-xl" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="bg-white/10 rounded-xl p-3 text-sm">
                  <ul className="space-y-1">
                    <li className="flex items-center gap-2">
                      <span className="text-green-300">✓</span>
                      <span>Performance improvements</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-300">✓</span>
                      <span>Bug fixes and stability</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-300">✓</span>
                      <span>New features and enhancements</span>
                    </li>
                  </ul>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleDismiss}
                    className="flex-1 px-4 py-3 bg-white/20 hover:bg-white/30 rounded-xl font-semibold text-sm transition-colors"
                    disabled={isUpdating}
                  >
                    Later
                  </button>
                  <button
                    onClick={handleUpdate}
                    className="flex-1 px-4 py-3 bg-white text-violet-600 hover:bg-white/90 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2 shadow-lg"
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        >
                          <FiRefreshCw />
                        </motion.div>
                        <span>Updating...</span>
                      </>
                    ) : (
                      <>
                        <FiDownload />
                        <span>Update Now</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <p className="text-white/70 text-xs mt-3 text-center">
                Update takes only a few seconds
              </p>
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
                    <h3 className="font-bold text-lg mb-1">App Ready for Offline Use! 📱</h3>
                    <p className="text-white/90 text-sm">
                      Pawppy is now cached and works without internet
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleOfflineDismiss}
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
