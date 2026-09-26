import { readUserSnapshot } from "../../services/profileData";
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { onValue, ref, update } from 'firebase/database';
import { httpsCallable } from 'firebase/functions';
import { auth, database, functions } from '../../firebase';
import { requestNotificationPermission, disableNotificationDevice } from '../../services/notificationService';
import { setProductMeasurementEnabled, trackProductEvent } from '../../services/productAnalytics';
import CheckForUpdatesButton from '../PWA/CheckForUpdatesButton';
import { PageHeader, PageLoading, Sheet } from '../UI/AppUI';
import { Bell, LogOut, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { signOutWithNotifications } from '../../services/notificationService';

const CATEGORIES = [
  ['routines', 'Daily routine briefing'],
  ['vaccinations', 'Vaccination dates'], ['medications', 'Saved medication dates'],
  ['checkups', 'Saved checkup dates'], ['birthdays', 'Birthdays'],
  ['weeklyDigest', 'Weekly care digest'], ['messages', 'Messages'],
  ['matingRequests', 'Mating requests'], ['adoptionInquiries', 'Adoption inquiries'],
];

export default function NotificationSettings() {
  const navigate = useNavigate();
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [prefs, setPrefs] = useState(null);
  const [measurement, setMeasurement] = useState(true);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [registered, setRegistered] = useState(false);
  useEffect(() => onValue(ref(database, `notificationDevices/${auth.currentUser.uid}`), snapshot => {
    const deviceId = localStorage.getItem('pawppy_notification_device');
    setRegistered(Boolean(deviceId && snapshot.val()?.[deviceId]?.token));
  }), []);
  useEffect(() => {
    let live = true;
    readUserSnapshot(auth.currentUser.uid).then((snapshot) => {
      if (!live) return;
      const user = snapshot.val() || {};
      setPrefs({ ...user.notificationPreferences, timeZone: user.notificationPreferences?.timeZone || user.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata' });
      setMeasurement(user.productMeasurementEnabled !== false);
    }).catch(() => { if (live) setLoadError('Could not load your settings. Please reload and try again.'); });
    return () => { live = false; };
  }, []);

  const toggle = (channel, key, value) => setPrefs((current) => ({ ...current, [channel]: { ...current[channel], [key]: value } }));
  const enable = async () => {
    setBusy(true); setStatus('');
    const result = await requestNotificationPermission(auth.currentUser.uid);
    trackProductEvent(result.success ? 'notification_setup_succeeded' : 'notification_setup_failed', 'settings');
    setStatus(result.success ? 'Reminders are enabled on this device.' : result.error);
    setBusy(false);
  };
  const disable = async () => {
    setBusy(true); setStatus('');
    try { await disableNotificationDevice(); setStatus('Push reminders are disabled on this device. Your in-app inbox remains available.'); }
    catch { setStatus('Could not disable this device. Please try again.'); }
    finally { setBusy(false); }
  };
  const testDevice = async () => {
    setBusy(true); setStatus('');
    try {
      await httpsCallable(functions, 'testNotificationDevice')({ deviceId: localStorage.getItem('pawppy_notification_device') });
      setStatus('Firebase accepted the test. Look for “Pawppy test notification” on this device. Acceptance does not guarantee display; check browser permission and Focus / Do Not Disturb settings if nothing appears.');
    } catch (error) { setStatus(error.message || 'Could not send the test. Please try again.'); }
    finally { setBusy(false); }
  };
  const save = async (event) => {
    event.preventDefault(); setBusy(true); setStatus('');
    try {
      new Intl.DateTimeFormat('en', { timeZone: prefs.timeZone }).format();
      await update(ref(database, `users/${auth.currentUser.uid}`), { notificationPreferences: prefs, productMeasurementEnabled: measurement });
      setProductMeasurementEnabled(measurement);
      trackProductEvent('preferences_saved', 'settings');
      setStatus('Your preferences have been saved.');
    } catch { setStatus('Could not save. Check the time zone and your connection, then try again.'); }
    finally { setBusy(false); }
  };

  return <div className="app-page app-page-narrow settings-page">
    <PageHeader eyebrow="Make yourself at home" title="Settings" description="A few thoughtful choices for your everyday." />
    <section className="app-panel settings-device"><div className="app-section-top"><h2 className="app-section-title">Notifications on this device</h2><Bell size={21} aria-hidden="true" /></div>
      <p className="settings-connection"><span className={registered && typeof Notification !== 'undefined' && Notification.permission === 'granted' ? 'is-connected' : ''} />{registered && typeof Notification !== 'undefined' && Notification.permission === 'granted' ? 'Connected and ready' : 'Not connected yet'}</p>
      {prefs?.push?.enabled === false && <p className="app-caption mt-3">Push is turned off for your account. Enable “Allow this channel” in the Push column and save.</p>}
      <p className="app-caption mt-3">On iPhone, open Pawppy from your Home Screen to enable reminders.</p>
      <div className="settings-device-actions"><button type="button" disabled={busy} onClick={enable} className="app-button">Enable reminders</button><button type="button" disabled={busy || !registered} onClick={testDevice} className="app-button app-button-secondary">Send test notification</button></div>
      <details className="settings-details"><summary>More about device notifications</summary><p>Scheduled dates are checked after 9 AM in your chosen time zone. A test sends one push to this device, even during quiet hours. Send a test, switch apps, then check your notification centre. Delivery may take a minute.</p><button type="button" disabled={busy} onClick={disable} className="app-text-button">Disable this device</button></details>
    </section>
    <h2 className="app-section-label">Reminders & preferences</h2>
    {loadError ? <p role="alert" className="app-notice app-notice-error">{loadError}</p> : !prefs ? <PageLoading label="Loading preferences…" /> : <form onSubmit={save} className="settings-form">
      <section className="app-panel"><label className="app-field">Daily care reminder time<input type="time" required className="app-input" value={prefs.routineReminderTime || '08:00'} onChange={event => setPrefs({ ...prefs, routineReminderTime: event.target.value })} /></label><p className="app-caption mt-3">One briefing when routines remain open. Turn on Daily routine briefing below. We check every 15 minutes after your chosen time, outside quiet hours.</p></section>
      <section className="app-panel settings-channels"><div className="settings-channel-row settings-channel-heading"><span>Updates you want</span><span>Email</span><span>Push</span></div>
        {[['enabled', 'Allow this channel'], ...CATEGORIES].map(([key, label]) => <div key={key} className="settings-channel-row"><span>{label}</span>{['email', 'push'].map(channel => <label key={channel} className="app-switch"><input aria-label={`${label}: ${channel}`} type="checkbox" checked={key === 'routines' ? prefs[channel]?.[key] === true : prefs[channel]?.[key] !== false} onChange={event => toggle(channel, key, event.target.checked)} /><span aria-hidden="true" /></label>)}</div>)}
        <p className="app-caption mt-4">These choices apply to personal updates and scheduled care emails. Community broadcasts are managed separately.</p>
      </section>
      <section className="app-panel"><label className="app-field">Time zone<input required value={prefs.timeZone} onChange={event => setPrefs({ ...prefs, timeZone: event.target.value })} placeholder="Asia/Kolkata" className="app-input" /></label><label className="settings-toggle-row"><span><strong>Quiet hours for personal reminders</strong><small>A little time to switch off.</small></span><span className="app-switch"><input type="checkbox" checked={prefs.quietHours?.enabled === true} onChange={event => setPrefs({ ...prefs, quietHours: { start: '22:00', end: '07:00', ...prefs.quietHours, enabled: event.target.checked } })} /><span aria-hidden="true" /></span></label>
        {prefs.quietHours?.enabled && <div className="app-form-grid mt-4">{['start', 'end'].map(key => <label key={key} className="app-field capitalize">{key}<input type="time" required value={prefs.quietHours[key] || ''} onChange={event => setPrefs({ ...prefs, quietHours: { ...prefs.quietHours, [key]: event.target.value } })} className="app-input" /></label>)}</div>}
      </section>
      <section className="app-panel"><label className="settings-toggle-row"><span><strong>Help improve Pawppy</strong><small>Share basic app activity.</small></span><span className="app-switch"><input type="checkbox" checked={measurement} onChange={event => setMeasurement(event.target.checked)} /><span aria-hidden="true" /></span></label><details className="settings-details"><summary>What is shared?</summary><p>Basic actions, such as returning to the app or saving a record, are linked to your account for up to 90 days. Pet names, medical notes, document text and message contents are excluded. Browser privacy signals are respected.</p></details></section>
      <div className="settings-save"><button disabled={busy} className="app-button">{busy ? 'Saving…' : 'Save preferences'}</button><span className="app-caption">Changes apply when you save.</span></div>
    </form>}
    {status && <p role="status" className="app-notice mt-5">{status}</p>}
    <p className="app-section-label">Your app</p><section className="app-panel"><div className="app-section-top"><h2 className="app-section-title">App updates</h2><RefreshCw size={19} className="text-stone-400" aria-hidden="true" /></div><p className="app-caption mb-4">The latest improvements, without reinstalling. Your account and saved records stay in place.</p><CheckForUpdatesButton /></section>
    <div className="settings-account"><Link to="/privacy-policy" className="app-text-button">Privacy policy</Link><button type="button" className="app-text-button" onClick={() => setConfirmLogout(true)}><LogOut size={16} />Sign out</button></div>
    <Sheet open={confirmLogout} onClose={() => setConfirmLogout(false)} busy={busy} title="Sign out of Pawppy?" description="Your saved care records will be here when you sign back in."><div className="app-form-actions"><button type="button" className="app-text-button" disabled={busy} onClick={() => setConfirmLogout(false)}>Stay signed in</button><button type="button" className="app-button" disabled={busy} onClick={async () => { setBusy(true); try { await signOutWithNotifications(); navigate('/'); } catch { setStatus('Could not sign out. Please try again.'); setConfirmLogout(false); } finally { setBusy(false); } }}>Sign out</button></div></Sheet>
  </div>;
}
