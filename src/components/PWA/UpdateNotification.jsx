import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiDownload, FiX, FiRefreshCw, FiAlertCircle } from 'react-icons/fi';
import { usePWAUpdate } from '../../hooks/usePWAUpdate';

const UpdateNotification = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const [showOfflineReady, setShowOfflineReady] = useState(false);
  const fallbackTimerRef = useRef(null);
  const { offlineReady, setOfflineReady, needRefresh, showUpdatePrompt, dismissUpdate, updateApp } = usePWAUpdate();

  useEffect(() => {
    if (!offlineReady) return;
    let alreadyShown = false;
    try {
      alreadyShown = localStorage.getItem('pwa-offline-ready-shown') === 'true';
      localStorage.setItem('pwa-offline-ready-shown', 'true');
    } catch { /* Storage may be unavailable in a private browser. */ }
    setShowOfflineReady(!alreadyShown);
    const timer = setTimeout(() => { setShowOfflineReady(false); setOfflineReady(false); }, 5000);
    return () => clearTimeout(timer);
  }, [offlineReady, setOfflineReady]);

  useEffect(() => () => clearTimeout(fallbackTimerRef.current), []);
  useEffect(() => {
    if (!needRefresh) { clearTimeout(fallbackTimerRef.current); setIsUpdating(false); }
  }, [needRefresh]);

  const handleUpdate = async () => {
    if (isUpdating) return;
    setIsUpdating(true);
    setUpdateError('');
    fallbackTimerRef.current = setTimeout(() => {
      setIsUpdating(false);
      setUpdateError('The update is taking longer than expected. Please try again.');
    }, 60000);
    try { await updateApp(); }
    catch {
      clearTimeout(fallbackTimerRef.current);
      setIsUpdating(false);
      setUpdateError('The update could not finish. Check your connection and try again.');
    }
  };

  const handleDismiss = () => { dismissUpdate(); setUpdateError(''); };

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
                        ? 'Downloading and applying the update…'
                        : 'Get the latest improvements without reinstalling'}
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

              {updateError && <p role="alert" className="mb-3 text-sm text-white">{updateError}</p>}
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
        {showOfflineReady && (
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
                    <h3 className="font-bold text-lg mb-1">App saved on this device</h3>
                    <p className="text-white/90 text-sm">
                      The app can open offline. A connection is needed to load and save your care records.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => { setShowOfflineReady(false); setOfflineReady(false); }}
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
