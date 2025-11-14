import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiDownload, FiShare } from 'react-icons/fi';
import { FaApple, FaAndroid, FaChrome } from 'react-icons/fa';

const InstallPWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    console.log('InstallPWA component mounted');
    
    // Check if app is already installed (standalone mode)
    const isInStandaloneMode = () => {
      return (
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone ||
        document.referrer.includes('android-app://')
      );
    };

    const standalone = isInStandaloneMode();
    setIsStandalone(standalone);
    console.log('Is standalone mode:', standalone);

    // Detect iOS
    const isIOSDevice = () => {
      return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    };

    const iOS = isIOSDevice();
    setIsIOS(iOS);
    console.log('Is iOS device:', iOS);

    // Handle beforeinstallprompt event for Android/Desktop
    const handleBeforeInstallPrompt = (e) => {
      console.log('beforeinstallprompt event fired');
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Check if user has dismissed the prompt before
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      const dismissedDate = dismissed ? new Date(dismissed) : null;
      const daysSinceDismissed = dismissedDate 
        ? (new Date() - dismissedDate) / (1000 * 60 * 60 * 24)
        : 999;

      console.log('Days since dismissed:', daysSinceDismissed);
      
      // Show prompt if not dismissed or dismissed more than 7 days ago
      if (!dismissed || daysSinceDismissed > 7) {
        console.log('Showing install prompt in 2 seconds...');
        setTimeout(() => {
          console.log('Setting showInstallPrompt to true');
          setShowInstallPrompt(true);
        }, 2000);
      } else {
        console.log('Prompt was dismissed recently, not showing');
      }
    };

    // Handle iOS - show prompt if not installed
    if (iOS && !standalone) {
      const dismissed = localStorage.getItem('pwa-install-dismissed-ios');
      const dismissedDate = dismissed ? new Date(dismissed) : null;
      const daysSinceDismissed = dismissedDate 
        ? (new Date() - dismissedDate) / (1000 * 60 * 60 * 24)
        : 999;

      console.log('iOS prompt - Days since dismissed:', daysSinceDismissed);

      if (!dismissed || daysSinceDismissed > 7) {
        console.log('Showing iOS install prompt in 2 seconds...');
        setTimeout(() => {
          console.log('Setting iOS showInstallPrompt to true');
          setShowInstallPrompt(true);
        }, 2000);
      }
    }

    // For development/testing - show prompt after delay if not standalone
    // Remove this in production or make it conditional on environment
    if (!standalone && !iOS) {
      console.log('Dev mode: Showing install prompt for testing');
      setTimeout(() => {
        console.log('Dev: Setting showInstallPrompt to true');
        setShowInstallPrompt(true);
      }, 2000);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Handle successful installation
    window.addEventListener('appinstalled', () => {
      console.log('PWA installed successfully');
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }

    // Clear the deferredPrompt
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    if (isIOS) {
      localStorage.setItem('pwa-install-dismissed-ios', new Date().toISOString());
    } else {
      localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
    }
  };

  // Don't show if already installed
  if (isStandalone) {
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
