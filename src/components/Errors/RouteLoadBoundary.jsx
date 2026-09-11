import React, { useEffect, useRef, useState } from 'react';
import { usePWAUpdate } from '../../hooks/usePWAUpdate';

function RecoveryScreen({ error }) {
  const { reloadApp } = usePWAUpdate();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  const moduleFailure = /dynamically imported module|module script|loading chunk|importing a module script|preload/i.test(error?.message || '');
  const recover = async () => {
    if (busy) return;
    setBusy(true);
    setMessage('');
    timer.current = setTimeout(() => { setBusy(false); setMessage('The update is taking longer than expected. Please try again.'); }, 180000);
    try {
      await reloadApp();
    } catch {
      clearTimeout(timer.current);
      setBusy(false);
      setMessage('Check your connection, then try again.');
    }
  };
  return (
    <main className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
      <section role="alert" className="max-w-md rounded-2xl bg-white p-8 shadow-sm border border-stone-200">
        <p className="text-sm font-semibold text-violet-700 mb-3">Pawppy</p>
        <h1 className="text-2xl font-semibold text-stone-900 mb-3">{moduleFailure ? 'Let’s get you back to Pawppy' : 'This screen couldn’t load'}</h1>
        <p className="text-stone-600 leading-relaxed">{navigator.onLine ? 'Reload the app to get the latest version. Your saved care records are safe.' : 'You’re offline. Reconnect to load this screen. Your saved care records are safe.'}</p>
        <button onClick={recover} disabled={busy} className="mt-6 rounded-full bg-violet-700 px-6 py-3 font-semibold text-white disabled:opacity-60">{busy ? 'Opening latest version…' : 'Reload app'}</button>
        {message && <p className="mt-4 text-sm text-stone-600">{message}</p>}
      </section>
    </main>
  );
}

export default class RouteLoadBoundary extends React.Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  render() { return this.state.error ? <RecoveryScreen error={this.state.error} /> : this.props.children; }
}
