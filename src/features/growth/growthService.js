import { httpsCallable } from 'firebase/functions';
import { get, ref, runTransaction, serverTimestamp, update } from 'firebase/database';
import { auth, database, functions } from '../../firebase';
import { trackProductEvent } from '../../services/productAnalytics';
import { careDate } from '../../domain/care.mjs';
import { validRecordDate } from './recordParser.mjs';

export const callGrowth = async (name, data = {}) => (await httpsCallable(functions, name)(data)).data;
export function shareToken() { return btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
export async function shareLink({ title, text, url, files }) {
  try {
    if (navigator.share && (!files || navigator.canShare?.({ files }))) {
      await navigator.share({ title, text, ...(url ? { url } : {}), ...(files ? { files } : {}) });
      return 'Shared.';
    }
    if (files?.length) {
      const href = URL.createObjectURL(files[0]); const link = document.createElement('a'); link.href = href; link.download = files[0].name || 'pawppy-week.png'; link.click(); setTimeout(() => URL.revokeObjectURL(href), 1000);
      return 'Image downloaded. Share it from your photos or files app.';
    }
    if (url && navigator.clipboard?.writeText) { await navigator.clipboard.writeText(url); return 'Link copied. Paste it into a message.'; }
    return 'Select and copy the link below to share it.';
  } catch (error) { if (error.name === 'AbortError') return ''; return 'Select and copy the link below to share it.'; }
}
export function joinLink(source, next = '/today') { return `/login?signup=1&source=${encodeURIComponent(source)}&next=${encodeURIComponent(next)}`; }
export async function saveImportedVaccinations(petId, records) {
  if (!records.length || records.length > 30) throw new Error('Choose between 1 and 30 reviewed records.');
  const clean = records.map(record => {
    const name = record.name?.trim();
    if (!name || name.length > 100 || !validRecordDate(record.date) || record.date > careDate(new Date(), Intl.DateTimeFormat().resolvedOptions().timeZone) || (record.nextDue && (!validRecordDate(record.nextDue) || record.nextDue < record.date))) throw new Error('Review the vaccine names, given dates and next dates before saving.');
    return { id: record.id, name, date: record.date, nextDue: record.nextDue || '', notes: 'Imported from a card and reviewed by the pet parent.' };
  });
  const uid = auth.currentUser.uid;
  const target = ref(database, `userPets/${uid}/${petId}`);
  // Load first: RTDB transactions can otherwise begin with an empty local cache.
  const snapshot = await get(target);
  if (!snapshot.exists()) throw new Error('This pet is no longer available.');
  const result = await runTransaction(target, pet => {
    if (!pet) return;
    const existing = Array.isArray(pet.vaccinations) ? pet.vaccinations.filter(Boolean) : Object.values(pet.vaccinations || {});
    const known = new Set(existing.map(item => `${String(item.name).trim().toLowerCase()}|${item.date}`));
    const fresh = clean.filter(item => { const key = `${item.name.toLowerCase()}|${item.date}`; if (known.has(key)) return false; known.add(key); return true; });
    return { ...pet, vaccinations: [...existing, ...fresh] };
  }, { applyLocally: false });
  if (!result.committed) throw new Error('The records changed. Please try again.');
  trackProductEvent('record_import_saved', 'care');
  trackProductEvent('health_record_saved', 'care');
  return clean.length;
}
export async function saveHandover(petId, draft) {
  const fields = ['feeding', 'routineNotes', 'emergencyName', 'emergencyPhone', 'extraNotes'];
  const clean = Object.fromEntries(fields.map(key => [key, String(draft[key] || '').trim()]));
  if (Object.values(clean).some(value => value.length > 1500) || clean.emergencyName.length > 100 || clean.emergencyPhone.length > 40) throw new Error('Shorten the instructions or contact details before saving.');
  await update(ref(database, `careHandovers/${auth.currentUser.uid}/${petId}`), { ...clean, updatedAt: serverTimestamp() });
  trackProductEvent('handover_saved', 'care');
}
