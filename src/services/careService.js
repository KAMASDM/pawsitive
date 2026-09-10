import { get, push, ref, runTransaction, serverTimestamp, set, update } from 'firebase/database';
import { auth, database } from '../firebase';
import { nextCareRecord, ROUTINE_KINDS } from '../domain/care.mjs';
import { trackProductEvent } from './productAnalytics';

export async function createRoutine({ petId, title, kind, time, startDate }) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Sign in to save a routine.');
  if (!title.trim() || title.trim().length > 80 || !ROUTINE_KINDS[kind] || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new Error('Choose a care activity and a valid time.');
  await set(push(ref(database, `careRoutines/${uid}`)), { petId, title: title.trim(), kind, time, startDate, active: true, createdAt: serverTimestamp() });
  trackProductEvent('routine_created', 'care');
}

export async function setRoutineActive(id, active) {
  await update(ref(database, `careRoutines/${auth.currentUser.uid}/${id}`), { active });
}

export async function recordCare(day, task, status, ownerId = auth.currentUser.uid) {
  const uid = auth.currentUser.uid;
  const occurrence = ref(database, `careDays/${ownerId}/${day}/${task.id}`);
  await get(occurrence);
  const result = await runTransaction(occurrence, current => nextCareRecord(current, {
    routine: task, uid, status, expectedRevision: task.record?.revision || 0, timestamp: serverTimestamp(),
  }), { applyLocally: false });
  if (result.committed) trackProductEvent(status === 'done' ? 'routine_completed' : 'routine_corrected', 'care');
  return result.committed;
}

export async function createFirstPet(name, type) {
  const uid = auth.currentUser.uid;
  const id = crypto.randomUUID();
  if (!name.trim() || name.trim().length > 60 || !['Dog', 'Cat', 'Other'].includes(type)) throw new Error('Enter your pet’s name and type.');
  await update(ref(database), { [`petOwners/${id}`]: uid, [`userPets/${uid}/${id}`]: { id, userId: uid, name: name.trim(), type, privacy: { isPrivate: true, commentsDisabled: false }, createdAt: serverTimestamp() } });
  trackProductEvent('pet_created', 'pets');
  return id;
}
