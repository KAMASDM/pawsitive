import { get, onValue, ref } from 'firebase/database';
import { httpsCallable } from 'firebase/functions';
import { auth, database, functions } from '../firebase';

export function dataSnapshot(value, key = null) {
  return { key, exists: () => value !== null && value !== undefined && (typeof value !== 'object' || Object.keys(value).length > 0), val: () => value, forEach: (callback) => Object.entries(value || {}).some(([id, item]) => callback(dataSnapshot(item, id)) === true) };
}

export const publicProfile = async (ownerId, petId) => (await httpsCallable(functions, 'getPublicPetProfile')({ ownerId, petId })).data;

export function subscribeMyConversations(callback, onError) {
  let active = true;
  const refresh = async () => {
    try { const { data } = await httpsCallable(functions, 'getMyConversations')(); if (active) callback(dataSnapshot(data)); }
    catch (error) { if (active) onError(error); }
  };
  refresh();
  const timer = setInterval(refresh, 15000);
  window.addEventListener('focus', refresh);
  return () => { active = false; clearInterval(timer); window.removeEventListener('focus', refresh); };
}

export async function readPetSnapshot(ownerId, petId) {
  if (ownerId === auth.currentUser?.uid) return get(ref(database, `userPets/${ownerId}/${petId}`));
  return dataSnapshot((await publicProfile(ownerId, petId)).pet, petId);
}

export async function readUserSnapshot(userId) {
  if (userId === auth.currentUser?.uid) return get(ref(database, `users/${userId}`));
  return dataSnapshot((await httpsCallable(functions, 'getPublicIdentity')({ userId })).data, userId);
}

export async function readPetDirectorySnapshot() {
  const all = {};
  let cursor = null;
  do {
    const { data } = await httpsCallable(functions, 'listPublicPets')({ cursor });
    for (const [ownerId, pets] of Object.entries(data.pets)) all[ownerId] = { ...all[ownerId], ...pets };
    cursor = data.nextCursor;
  } while (cursor);
  // An owner's own private pets remain available when following old detail links.
  if (auth.currentUser) all[auth.currentUser.uid] = (await get(ref(database, `userPets/${auth.currentUser.uid}`))).val() || {};
  return dataSnapshot(all);
}

export function subscribePetContent(kind, pet, callback, onError = () => {}) {
  const ownerId = pet.userId;
  if (ownerId === auth.currentUser?.uid) return onValue(ref(database, `${kind}/${pet.id}`), callback, onError);
  let active = true;
  const refresh = async () => {
    try {
      const bundle = await publicProfile(ownerId, pet.id);
      if (active) callback(dataSnapshot(kind === 'petPosts' ? bundle.posts : bundle.events));
    } catch (error) { if (active) onError(error); }
  };
  const changed = (event) => { if (event.detail?.petId === pet.id) refresh(); };
  refresh();
  const timer = setInterval(refresh, 30000);
  window.addEventListener('pawppy:post-updated', changed);
  return () => { active = false; clearInterval(timer); window.removeEventListener('pawppy:post-updated', changed); };
}

export async function interactWithPost(pet, postId, action, extra = {}) {
  const { data } = await httpsCallable(functions, 'interactWithPetPost')({ ownerId: pet.userId, petId: pet.id, postId, action, ...extra });
  window.dispatchEvent(new CustomEvent('pawppy:post-updated', { detail: { petId: pet.id } }));
  return data;
}
