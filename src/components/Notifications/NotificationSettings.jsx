import { readUserSnapshot } from "../../services/profileData";
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { get, ref, update } from 'firebase/database';
import { auth, database } from '../../firebase';
import { requestNotificationPermission, disableNotificationDevice } from '../../services/notificationService';
import { setProductMeasurementEnabled, trackProductEvent } from '../../services/productAnalytics';

const CATEGORIES = [
  ['routines', 'Daily routine briefing'],
  ['vaccinations', 'Vaccination dates'], ['medications', 'Saved medication dates'],
  ['checkups', 'Saved checkup dates'], ['birthdays', 'Birthdays'],
  ['weeklyDigest', 'Weekly care digest'], ['messages', 'Messages'],
  ['matingRequests', 'Mating requests'], ['adoptionInquiries', 'Adoption inquiries'],
];

export default function NotificationSettings() {
  const [prefs, setPrefs] = useState(null);
  const [measurement, setMeasurement] = useState(true);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState('');
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

  return <div className="min-h-screen bg-slate-50 px-4 py-8 pb-28">
    <div className="max-w-2xl mx-auto space-y-6">
      <Link to="/notifications" className="text-violet-700 text-sm font-semibold">← Notifications</Link>
      <div><h1 className="text-3xl font-bold text-slate-900">Reminders & preferences</h1><p className="text-slate-600 mt-2">Choose the updates that help you care for your pet.</p></div>
      <div className="rounded-2xl bg-white border border-slate-200 p-5">
        <h2 className="font-bold text-slate-900">This device</h2>
        <p className="text-sm text-slate-600 mt-2">On iPhone, add Pawppy to your Home Screen and open it there before enabling reminders. Scheduled dates are checked after 9 AM in your chosen time zone.</p>
        <div className="flex flex-wrap gap-3 mt-4">
          <button type="button" disabled={busy} onClick={enable} className="rounded-xl bg-violet-600 text-white px-4 py-3 font-semibold disabled:opacity-50">Enable reminders</button>
          <button type="button" disabled={busy} onClick={disable} className="rounded-xl border border-slate-200 px-4 py-3 font-semibold disabled:opacity-50">Disable this device</button>
        </div>
      </div>
      {loadError ? <p role="alert">{loadError}</p> : !prefs ? <p role="status">Loading preferences…</p> : <form onSubmit={save} className="space-y-6">
        <div className="rounded-2xl bg-white border border-slate-200 p-5"><label className="block font-semibold">Daily care reminder time<input type="time" required className="block mt-2 rounded-xl border p-3" value={prefs.routineReminderTime || '08:00'} onChange={event => setPrefs({ ...prefs, routineReminderTime: event.target.value })} /></label><p className="text-sm text-slate-600 mt-3">Opt in to Daily routine briefing below for one reminder when routines remain open. Checked every 15 minutes after your chosen time, outside quiet hours. This does not send an alert for each activity.</p></div>
        <div className="rounded-2xl bg-white border border-slate-200 p-5 space-y-4">
          <div className="grid grid-cols-[1fr_64px_64px] gap-2 text-sm font-bold"><span>Updates</span><span>Email</span><span>Push</span></div>
          {[['enabled', 'Allow this channel'], ...CATEGORIES].map(([key, label]) => <div key={key} className="grid grid-cols-[1fr_64px_64px] gap-2 items-center text-sm"><span>{label}</span>{['email', 'push'].map((channel) => <input key={channel} aria-label={`${label}: ${channel}`} type="checkbox" className="w-5 h-5 accent-violet-600" checked={key === 'routines' ? prefs[channel]?.[key] === true : prefs[channel]?.[key] !== false} onChange={(event) => toggle(channel, key, event.target.checked)} />)}</div>)}
          <p className="text-xs text-slate-500">These controls apply to personal updates and scheduled care emails. Community broadcasts are managed separately.</p>
        </div>
        <div className="rounded-2xl bg-white border border-slate-200 p-5 space-y-4">
          <label className="block text-sm font-semibold">Time zone<input required value={prefs.timeZone} onChange={(event) => setPrefs({ ...prefs, timeZone: event.target.value })} placeholder="Asia/Kolkata" className="block w-full mt-2 rounded-xl border border-slate-300 p-3" /></label>
          <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={prefs.quietHours?.enabled === true} onChange={(event) => setPrefs({ ...prefs, quietHours: { start: '22:00', end: '07:00', ...prefs.quietHours, enabled: event.target.checked } })} />Quiet hours for personal reminders</label>
          {prefs.quietHours?.enabled && <div className="flex gap-4">{['start', 'end'].map((key) => <label key={key} className="text-sm capitalize">{key}<input type="time" required value={prefs.quietHours[key] || ''} onChange={(event) => setPrefs({ ...prefs, quietHours: { ...prefs.quietHours, [key]: event.target.value } })} className="block mt-1 border rounded-lg p-2" /></label>)}</div>}
        </div>
        <div className="rounded-2xl bg-white border border-slate-200 p-5">
          <label className="flex items-start gap-3"><input type="checkbox" checked={measurement} onChange={(event) => setMeasurement(event.target.checked)} className="mt-1" /><span><span className="font-bold block">Help improve Pawppy</span><span className="text-sm text-slate-600">Record basic actions, such as returning to the app or saving a record. Activity is linked to your account for up to 90 days. We do not include pet names, medical notes, document text, or message contents in these events. Browser privacy signals are respected.</span></span></label>
        </div>
        <button disabled={busy} className="rounded-xl bg-violet-600 text-white px-6 py-3 font-bold disabled:opacity-50">{busy ? 'Working…' : 'Save preferences'}</button>
      </form>}
      {status && <p role="status" className="rounded-xl bg-violet-50 p-4 text-sm text-violet-900">{status}</p>}
    </div>
  </div>;
}
