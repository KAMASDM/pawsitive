import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, RefreshCw, Check } from 'lucide-react';
import { usePWAUpdate } from '../../hooks/usePWAUpdate';

export default function UpdateNotification() {
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
    } catch { /* Private browsers may not allow storage. */ }
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
    setIsUpdating(true); setUpdateError('');
    fallbackTimerRef.current = setTimeout(() => { setIsUpdating(false); setUpdateError('The update is taking longer than expected. Please try again.'); }, 180000);
    try { await updateApp(); }
    catch (error) {
      clearTimeout(fallbackTimerRef.current); setIsUpdating(false);
      setUpdateError(error.message || 'The update could not finish. Check your connection and try again.');
    }
  };
  const handleDismiss = () => { dismissUpdate(); setUpdateError(''); };
  return <AnimatePresence>
    {showUpdatePrompt && needRefresh ? <motion.aside key="update" className="app-update-toast" aria-label="App update" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}>
      <div className="app-update-heading"><span className="app-row-icon"><RefreshCw size={21} className={isUpdating ? 'animate-spin' : ''} aria-hidden="true" /></span><div><h3>{isUpdating ? 'Updating Pawppy…' : 'New version available'}</h3><p>{isUpdating ? 'Keep Pawppy open while we finish.' : 'A few improvements, ready when you are.'}</p></div>{!isUpdating && <button type="button" className="app-icon-button" aria-label="Dismiss update notification" onClick={handleDismiss}><X size={19} /></button>}</div>
      {updateError && <p role="alert" className="app-notice app-notice-error mt-3">{updateError}</p>}
      {!isUpdating && <div className="app-update-actions"><button type="button" className="app-text-button" onClick={handleDismiss}>Later</button><button type="button" className="app-button" onClick={handleUpdate}><Download size={16} aria-hidden="true" />Update Now</button></div>}
    </motion.aside> : showOfflineReady && <motion.aside key="offline" className="app-update-toast app-offline-toast" aria-label="Offline availability" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><Check size={20} aria-hidden="true" /><div><h3>App saved on this device</h3><p>Open it offline. Reconnect to load and save care records.</p></div><button type="button" className="app-icon-button" aria-label="Dismiss offline notification" onClick={() => { setShowOfflineReady(false); setOfflineReady(false); }}><X size={18} /></button></motion.aside>}
  </AnimatePresence>;
}
