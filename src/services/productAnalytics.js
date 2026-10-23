import { readUserSnapshot } from "./profileData";
import { get, push, ref, serverTimestamp, set, update } from 'firebase/database';
import { auth, database } from '../firebase';

export const EVENT_NAMES = new Set(['session_started', 'signup_completed', 'pet_created', 'health_record_saved', 'medication_saved', 'notification_setup_succeeded', 'notification_setup_failed', 'notification_opened', 'preferences_saved', 'routine_created', 'routine_completed', 'routine_corrected', 'record_import_started', 'record_import_saved', 'safety_card_enabled', 'safety_card_shared', 'care_invitation_shared', 'care_invitation_accepted', 'handover_saved', 'care_update_saved', 'weekly_card_created', 'weekly_card_shared', 'starter_plan_saved', 'safety_link_signup', 'week_link_signup', 'family_link_signup']);
const SCREENS = new Set(['login', 'home', 'pets', 'care', 'notifications', 'settings', 'discover', 'shop', 'activity', 'other']);
let currentUserId = null;
let enabled = false;

export function analyticsScreen(pathname = window.location.pathname) {
  if (pathname === '/' || pathname === '/login') return 'login';
  if (pathname === '/today') return 'home';
  if (pathname === '/care' || pathname.startsWith('/care/')) return 'care';
  if (pathname === '/discover') return 'discover';
  if (pathname.startsWith('/my-pets')) return 'pets';
  if (pathname.startsWith('/pet-details')) return 'care';
  if (pathname.startsWith('/notifications')) return 'notifications';
  if (pathname.startsWith('/settings')) return 'settings';
  if (/^\/(shop|store|products|cart|checkout|orders)/.test(pathname)) return 'shop';
  if (/^\/(quiz|challenge|activity)/.test(pathname)) return 'activity';
  if (/^\/(resource|nearby-mates|lost-and-found|place-tagging|adopt)/.test(pathname)) return 'discover';
  return 'other';
}

export function setProductMeasurementEnabled(value) { enabled = Boolean(value); }

function sessionFor(userId) {
  const key = `pawppy_session_${userId}`;
  const now = Date.now();
  let session;
  try { session = JSON.parse(sessionStorage.getItem(key)); } catch { /* start a fresh session */ }
  const isNew = !session?.id || now - session.lastAt > 30 * 60 * 1000;
  if (isNew) session = { id: crypto.randomUUID() };
  session.lastAt = now;
  sessionStorage.setItem(key, JSON.stringify(session));
  return { ...session, isNew };
}

// First-party only. Never accept notes, pet names, emails, URLs, or arbitrary properties.
export async function trackProductEvent(name, screen = analyticsScreen()) {
  if (!enabled || !currentUserId || auth.currentUser?.uid !== currentUserId || !EVENT_NAMES.has(name) || !SCREENS.has(screen)) return;
  if (navigator.doNotTrack === '1' || navigator.globalPrivacyControl === true) return;
  try {
    const session = sessionFor(currentUserId);
    const event = { screen, sessionId: session.id, timestamp: serverTimestamp(), platform: window.matchMedia('(display-mode: standalone)').matches || navigator.standalone ? 'installed' : 'browser' };
    const events = ref(database, `productEvents/${currentUserId}`);
    if (session.isNew) await set(push(events), { ...event, name: 'session_started' });
    if (name !== 'session_started') await set(name === 'signup_completed' ? ref(database, `productEvents/${currentUserId}/signup`) : push(events), { ...event, name });
    return true;
  } catch { /* Measurement failure must never block pet care. */ }
}


let signupInFlight = null;
export function trackSignupCompletion(uid) {
  if (signupInFlight) return signupInFlight;
  signupInFlight = (async () => {
    if (auth.currentUser?.uid !== uid || sessionStorage.getItem('pawppy_signup_pending') !== uid) return;
    const recorded = await trackProductEvent('signup_completed', 'login');
    if (auth.currentUser?.uid !== uid) return;
    let touch; try { touch = JSON.parse(sessionStorage.getItem('pawppy_share_source')); } catch { /* No valid share attribution. */ }
    // A reload can happen after the fixed signup event was written but before
    // its source was recorded. Duplicate signup writes are intentionally denied;
    // the independent allowlisted attribution must still be allowed to retry.
    let attributed = false;
    if (['safety', 'week', 'family'].includes(touch?.source) && Number.isFinite(touch.at) && Date.now() >= touch.at && Date.now() - touch.at <= 86400000) attributed = await trackProductEvent(`${touch.source}_link_signup`, 'login');
    if (!recorded && !attributed) return;
    if (sessionStorage.getItem('pawppy_signup_pending') === uid) sessionStorage.removeItem('pawppy_signup_pending');
    sessionStorage.removeItem('pawppy_share_source');
  })().catch(() => {}).finally(() => { signupInFlight = null; });
  return signupInFlight;
}

export function initializeProductAnalytics() {
  const unsubscribe = auth.onAuthStateChanged(async (user) => {
    currentUserId = user?.uid || null;
    enabled = false;
    if (!user || (!user.emailVerified && user.providerData.some(provider => provider.providerId === 'password'))) return;
    try {
      const snapshot = await readUserSnapshot(user.uid);
      if (auth.currentUser?.uid !== user.uid) return;
      enabled = snapshot.val()?.productMeasurementEnabled !== false;
      if (snapshot.exists() && !snapshot.val()?.timeZone) await update(ref(database, `users/${user.uid}`), { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata' });
      await trackProductEvent('session_started');
      if (sessionStorage.getItem('pawppy_notification_open_pending')) {
        await trackProductEvent('notification_opened');
        sessionStorage.removeItem('pawppy_notification_open_pending');
      }
      await trackSignupCompletion(user.uid);
    } catch { enabled = false; }
  });
  const resume = () => { if (!document.hidden) trackProductEvent('session_started'); };
  document.addEventListener('visibilitychange', resume);
  return () => { unsubscribe(); document.removeEventListener('visibilitychange', resume); };
}
