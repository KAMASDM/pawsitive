import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiRefreshCw, FiCheckCircle } from 'react-icons/fi';
import { usePWAUpdate } from '../../hooks/usePWAUpdate';

const CheckForUpdatesButton = () => {
  const { checkForUpdates, needRefresh } = usePWAUpdate();
  const [isChecking, setIsChecking] = useState(false);
  const [justChecked, setJustChecked] = useState(false);
  const [checkError, setCheckError] = useState(false);

  const handleCheckForUpdates = async () => {
    setIsChecking(true);
    setJustChecked(false);
    setCheckError(false);

    try {
      await checkForUpdates();
      
      setJustChecked(true);
      
      // Reset after 3 seconds
      setTimeout(() => {
        setJustChecked(false);
      }, 3000);
    } catch (error) {
      setCheckError(true);
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <motion.button
      onClick={handleCheckForUpdates}
      disabled={isChecking}
      className={`w-full px-4 py-3 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${
        justChecked && !needRefresh
          ? 'bg-green-500 text-white'
          : 'bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-700 hover:to-purple-700'
      }`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {isChecking ? (
        <>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <FiRefreshCw className="text-lg" />
          </motion.div>
          <span>Checking for updates...</span>
        </>
      ) : justChecked && !needRefresh ? (
        <>
          <FiCheckCircle className="text-lg" />
          <span>You're up to date!</span>
        </>
      ) : checkError ? (
        <span>Couldn’t check for updates. Tap to retry.</span>
      ) : needRefresh ? (
        <>
          <FiRefreshCw className="text-lg" />
          <span>Update Available - Check notification</span>
        </>
      ) : (
        <>
          <FiRefreshCw className="text-lg" />
          <span>Check for Updates</span>
        </>
      )}
    </motion.button>
  );
};

export default CheckForUpdatesButton;
