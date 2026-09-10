const PUBLIC_PET_FIELDS = ['name', 'type', 'breed', 'gender', 'dateOfBirth', 'color', 'description', 'image', 'slug', 'availableForMating', 'availableForAdoption'];
const PUBLIC_EVENT_TYPES = new Set(['birthday', 'adoption', 'achievement', 'milestone', 'grooming', 'training']);

function publicPet(pet, ownerId, petId) {
  if (!pet || pet.privacy?.isPrivate === true) return null;
  const safe = { id: petId, userId: ownerId, privacy: { isPrivate: false, commentsDisabled: pet.privacy?.commentsDisabled === true } };
  for (const field of PUBLIC_PET_FIELDS) {
    if (['string', 'number', 'boolean'].includes(typeof pet[field])) safe[field] = pet[field];
  }
  // Location sharing is separate from having a public profile. Rounded coordinates
  // support approximate discovery without disclosing the precise saved location.
  if (pet.privacy?.shareLocation === true && Number.isFinite(pet.location?.latitude) && Number.isFinite(pet.location?.longitude) && Math.abs(pet.location.latitude) <= 90 && Math.abs(pet.location.longitude) <= 180) {
    safe.location = { latitude: Math.round(pet.location.latitude * 100) / 100, longitude: Math.round(pet.location.longitude * 100) / 100 };
  }
  return safe;
}

function publicUser(user) {
  const safe = {};
  for (const key of ['displayName', 'photoURL', 'city', 'country']) if (typeof user?.[key] === 'string') safe[key] = user[key];
  return safe;
}

function publicEvents(events) {
  return Object.fromEntries(Object.entries(events || {}).filter(([, event]) => event?.visibility === 'public' && PUBLIC_EVENT_TYPES.has(event.type)).map(([id, event]) => [id, {
    title: event.title || '', description: event.description || '', date: event.date || '', type: event.type, timestamp: event.timestamp || 0, visibility: 'public',
  }]));
}

function publicPosts(posts) {
  return Object.fromEntries(Object.entries(posts || {}).map(([id, post]) => [id, {
    mediaUrl: post.mediaUrl || '', mediaType: post.mediaType || 'image', caption: post.caption || '', timestamp: post.timestamp || 0,
    likes: Array.isArray(post.likes) ? post.likes.filter((value) => typeof value === 'string') : [],
    comments: Object.fromEntries(Object.entries(post.comments || {}).map(([commentId, comment]) => [commentId, {
      userId: comment.userId || '', userName: comment.userName || 'Pet parent', text: comment.text || '', timestamp: comment.timestamp || 0,
    }])),
  }]));
}

function ownershipIndex(pets) {
  const owners = {};
  for (const [ownerId, records] of Object.entries(pets || {})) for (const petId of Object.keys(records || {})) {
    if (owners[petId] && owners[petId] !== ownerId) throw new Error('Duplicate pet IDs found. Resolve ownership before migrating; no data was written.');
    owners[petId] = ownerId;
  }
  return owners;
}

module.exports = { publicPet, publicUser, publicEvents, publicPosts, ownershipIndex, PUBLIC_EVENT_TYPES };
