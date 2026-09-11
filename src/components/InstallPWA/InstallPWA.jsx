import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiDownload, FiShare } from 'react-icons/fi';
import { FaApple, FaAndroid, FaChrome } from 'react-icons/fa';

const InstallPWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const timerRef = useRef(null);
  const installedRef = useRef(false);
  const dismissedRef = useRef(false);
  const read = key => { try { return localStorage.getItem(key); } catch { return null; } };
  const save = (key, value) => { try { localStorage.setItem(key, value); } catch { /* Optional persistence. */ } };
  const installedMode = () => ['standalone', 'fullscreen', 'minimal-ui', 'window-controls-overlay'].some(mode => window.matchMedia(`(display-mode: ${mode})`).matches) || navigator.standalone === true || document.referrer.startsWith('android-app://');

  useEffect(() => {
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(iOS);
    const markInstalled = () => {
      clearTimeout(timerRef.current);
      installedRef.current = true;
      save('pwa-installed', 'true');
      setIsStandalone(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    };
    const syncInstalled = () => {
      if (installedMode() || read('pwa-installed') === 'true') markInstalled();
    };
    const schedule = () => {
      clearTimeout(timerRef.current);
      const dismissedAt = Date.parse(read(iOS ? 'pwa-install-dismissed-ios' : 'pwa-install-dismissed') || '');
      if (dismissedRef.current || Date.now() - dismissedAt < 7 * 86400000) return;
      timerRef.current = setTimeout(() => {
        if (!installedRef.current && !installedMode() && read('pwa-installed') !== 'true' && !dismissedRef.current) setShowInstallPrompt(true);
      }, 2000);
    };
    const beforeInstall = event => {
      event.preventDefault();
      syncInstalled();
      if (installedRef.current) return;
      setDeferredPrompt(event);
      schedule();
    };
    const modes = ['standalone', 'fullscreen', 'minimal-ui', 'window-controls-overlay'].map(mode => window.matchMedia(`(display-mode: ${mode})`));
    modes.forEach(mode => mode.addEventListener?.('change', syncInstalled));
    window.addEventListener('beforeinstallprompt', beforeInstall);
    window.addEventListener('appinstalled', markInstalled);
    window.addEventListener('storage', syncInstalled);
    syncInstalled();
    if (iOS && !installedRef.current) schedule();
    return () => {
      clearTimeout(timerRef.current);
      modes.forEach(mode => mode.removeEventListener?.('change', syncInstalled));
      window.removeEventListener('beforeinstallprompt', beforeInstall);
      window.removeEventListener('appinstalled', markInstalled);
      window.removeEventListener('storage', syncInstalled);
    };
  }, []);

  const handleDismiss = () => {
    clearTimeout(timerRef.current);
    dismissedRef.current = true;
    setShowInstallPrompt(false);
    save(isIOS ? 'pwa-install-dismissed-ios' : 'pwa-install-dismissed', new Date().toISOString());
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt || installedRef.current) return;
    clearTimeout(timerRef.current);
    setShowInstallPrompt(false);
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        installedRef.current = true;
        save('pwa-installed', 'true');
      } else handleDismiss();
    } catch { handleDismiss(); }
    finally { setDeferredPrompt(null); }
  };

  // Remove a dismissed card immediately, including its interactive controls.
  if (isStandalone || !showInstallPrompt) {
    return null;
  }

  return (
    <AnimatePresence>
      {showInstallPrompt && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6 overflow-hidden"
        >
          <div className="bg-white rounded-2xl shadow-lg border border-violet-100 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-violet-500 to-purple-600 p-4 relative">
              <button
                onClick={handleDismiss}
                aria-label="Dismiss install prompt"
                className="absolute top-3 right-3 text-white/80 hover:text-white transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-3">
                <div className="bg-white rounded-xl p-2">
                  <img src="/favicon.png" alt="Pawppy" className="w-12 h-12" />
                </div>
                <div className="text-white">
                  <h3 className="font-bold text-lg">Install Pawppy</h3>
                  <p className="text-sm text-white/90">Quick access from your home screen</p>
                </div>
              </div>
            </div>

            <button onClick={() => { installedRef.current = true; save('pwa-installed', 'true'); setIsStandalone(true); clearTimeout(timerRef.current); setShowInstallPrompt(false); }} className="mx-4 mt-3 text-sm text-violet-700 underline">Already installed? Hide this reminder</button>

            {/* Content */}
            <div className="p-4">
              {isIOS ? (
                // iOS Instructions
                <div className="space-y-3">
                  <div className="flex items-start gap-3 text-sm text-gray-600">
                    <FaApple className="w-5 h-5 text-violet-600 flex-shrink-0 mt-0.5" />
                    <p>To install this app on your iOS device:</p>
                  </div>
                  
                  <ol className="space-y-2 text-sm text-gray-700 ml-8 list-decimal">
                    <li className="flex items-center gap-2">
                      Tap the <FiShare className="inline w-4 h-4 text-blue-500" /> Share button below
                    </li>
                    <li>Scroll down and tap "Add to Home Screen"</li>
                    <li>Tap "Add" in the top right corner</li>
                  </ol>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500 text-center">
                      Works with Safari on iPhone and iPad
                    </p>
                  </div>
                </div>
              ) : (
                // Android/Desktop Install Button
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    {navigator.userAgent.includes('Android') ? (
                      <FaAndroid className="w-5 h-5 text-green-600" />
                    ) : (
                      <FaChrome className="w-5 h-5 text-blue-600" />
                    )}
                    <p>Get faster access and work offline</p>
                  </div>

                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-violet-500 rounded-full"></span>
                      Works offline
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-violet-500 rounded-full"></span>
                      Faster loading
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-violet-500 rounded-full"></span>
                      Push notifications
                    </li>
                  </ul>

                  <button
                    onClick={handleInstallClick}
                    className="w-full bg-gradient-to-r from-violet-500 to-purple-600 text-white font-semibold py-3 rounded-xl hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <FiDownload className="w-5 h-5" />
                    Install App
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InstallPWA;
