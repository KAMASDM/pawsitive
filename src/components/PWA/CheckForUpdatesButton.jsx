import React, { useState } from 'react';
import { FiRefreshCw } from 'react-icons/fi';
import { usePWAUpdate } from '../../hooks/usePWAUpdate';

export default function CheckForUpdatesButton({ compact = false }) {
  const { checkForUpdates, updateApp, needRefresh, isDownloading } = usePWAUpdate();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [failed, setFailed] = useState(false);
  const check = async () => {
    if (busy) return;
    setBusy(needRefresh ? 'update' : 'check'); setMessage(''); setFailed(false);
    try {
      if (needRefresh) await updateApp();
      else {
        const available = await checkForUpdates();
        setMessage(available ? 'A new version is ready. Tap Update app.' : 'You’re using the latest version.');
      }
    } catch (error) { setMessage(error.message || 'Couldn’t update. Please try again.'); setFailed(true); }
    finally { setBusy(false); }
  };
  return <div className={compact ? 'app-update-control' : ''}>
    <button type="button" onClick={check} disabled={!!busy || isDownloading} className={`app-button app-button-secondary ${compact ? "" : "w-full"}`}>
      <FiRefreshCw className={busy || isDownloading ? 'animate-spin' : ''} aria-hidden="true" />
      {isDownloading ? 'Downloading update…' : busy ? busy === 'update' ? 'Opening latest version…' : 'Checking…' : needRefresh ? 'Update app' : 'Check for updates'}
    </button>
    {message && <p role={failed ? 'alert' : 'status'} className={`mt-2 text-xs ${failed ? 'text-red-700' : 'text-slate-600'}`}>{message}</p>}
  </div>;
}
