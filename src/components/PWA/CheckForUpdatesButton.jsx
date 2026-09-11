import React, { useState } from 'react';
import { FiRefreshCw } from 'react-icons/fi';
import { usePWAUpdate } from '../../hooks/usePWAUpdate';

export default function CheckForUpdatesButton({ compact = false }) {
  const { checkForUpdates, updateApp, needRefresh } = usePWAUpdate();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [failed, setFailed] = useState(false);
  const check = async () => {
    if (busy) return;
    setBusy(true); setMessage(''); setFailed(false);
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
    <button type="button" onClick={check} disabled={busy} className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors disabled:opacity-60 ${compact ? 'px-3 py-2 text-xs bg-white/90 text-violet-800 border border-violet-200 hover:bg-violet-50' : 'w-full px-4 py-3 text-sm bg-violet-700 text-white hover:bg-violet-800'}`}>
      <FiRefreshCw className={busy ? 'animate-spin' : ''} aria-hidden="true" />
      {busy ? needRefresh ? 'Updating…' : 'Checking…' : needRefresh ? 'Update app' : 'Check for updates'}
    </button>
    {message && <p role={failed ? 'alert' : 'status'} className={`mt-2 text-xs ${failed ? 'text-red-700' : 'text-slate-600'}`}>{message}</p>}
  </div>;
}
