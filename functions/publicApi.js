const { publicPet, publicUser, publicEvents, publicPosts } = require('./domain/publicProfiles');

module.exports = ({ functions, admin }) => {
  const validId = (value) => typeof value === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(value);
  const requireIds = (...values) => { if (!values.every(validId)) throw new functions.https.HttpsError('invalid-argument', 'Invalid profile identifier.'); };
  const callable = (handler) => functions.runWith({ memory: '256MB', timeoutSeconds: 60, maxInstances: 10 }).https.onCall(handler);

  return {
    getMyConversations: callable(async (_, context) => {
      if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Sign in to view messages.');
      const all = (await admin.database().ref('conversations').once('value')).val() || {};
      return Object.fromEntries(Object.entries(all).filter(([, conversation]) => conversation.participants?.[context.auth.uid] === true).sort(([, a], [, b]) => (b.lastMessageTimestamp || 0) - (a.lastMessageTimestamp || 0)).map(([id, conversation]) => {
        const safe = {};
        for (const key of ['participants', 'lastMessageText', 'lastMessageTimestamp', 'createdAt', 'matingRequestId', 'petId', 'isAdoption']) if (conversation[key] !== undefined) safe[key] = conversation[key];
        return [id, safe];
      }));
    }),
    getPublicPetProfile: callable(async (data) => {
      requireIds(data?.ownerId, data?.petId);
      const db = admin.database();
      const pet = (await db.ref(`userPets/${data.ownerId}/${data.petId}`).once('value')).val();
      const registeredOwner = (await db.ref(`petOwners/${data.petId}`).once('value')).val();
      if (registeredOwner !== data.ownerId) return { pet: null, posts: {}, events: {} };
      const safe = publicPet(pet, data.ownerId, data.petId);
      if (!safe) return { pet: null, posts: {}, events: {} };
      const [owner, posts, events] = await Promise.all([
        db.ref(`users/${data.ownerId}`).once('value'),
        db.ref(`petPosts/${data.petId}`).orderByChild('timestamp').limitToLast(50).once('value'),
        db.ref(`petEvents/${data.petId}`).orderByChild('timestamp').limitToLast(100).once('value'),
      ]);
      return { pet: safe, owner: publicUser(owner.val()), posts: publicPosts(posts.val()), events: publicEvents(events.val()) };
    }),

    getPublicIdentity: callable(async (data) => {
      requireIds(data?.userId);
      return publicUser((await admin.database().ref(`users/${data.userId}`).once('value')).val());
    }),

    listPublicPets: callable(async (data, context) => {
      if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Sign in to discover pets.');
      const cursor = typeof data?.cursor === 'string' ? data.cursor : '';
      if (cursor.length > 260) throw new functions.https.HttpsError('invalid-argument', 'Invalid cursor.');
      const all = (await admin.database().ref('userPets').once('value')).val() || {};
      const rows = [];
      for (const ownerId of Object.keys(all).sort()) for (const petId of Object.keys(all[ownerId] || {}).sort()) {
        const key = `${ownerId}:${petId}`;
        if (key <= cursor) continue;
        const pet = publicPet(all[ownerId][petId], ownerId, petId);
        if (pet) rows.push({ key, ownerId, petId, pet });
      }
      const page = rows.slice(0, 100);
      const pets = {};
      for (const row of page) (pets[row.ownerId] ||= {})[row.petId] = row.pet;
      return { pets, nextCursor: rows.length > 100 ? page[page.length - 1].key : null };
    }),

    interactWithPetPost: callable(async (data, context) => {
      if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Sign in to interact.');
      requireIds(data?.ownerId, data?.petId, data?.postId);
      const db = admin.database();
      const uid = context.auth.uid;
      const pet = (await db.ref(`userPets/${data.ownerId}/${data.petId}`).once('value')).val();
      const owner = (await db.ref(`petOwners/${data.petId}`).once('value')).val();
      if (!pet || owner !== data.ownerId || (uid !== owner && pet.privacy?.isPrivate === true)) throw new functions.https.HttpsError('permission-denied', 'This profile is not available.');
      const postRef = db.ref(`petPosts/${data.petId}/${data.postId}`);
      if (!(await postRef.once('value')).exists()) throw new functions.https.HttpsError('not-found', 'This post is no longer available.');
      if (data.action === 'like') {
        if (typeof data.liked !== 'boolean') throw new functions.https.HttpsError('invalid-argument', 'Choose a like state.');
        await postRef.child('likes').transaction((current) => {
          const others = (Array.isArray(current) ? current : []).filter((id) => id !== uid);
          return data.liked ? [...others, uid] : others;
        });
      } else if (data.action === 'comment') {
        if (uid !== owner && pet.privacy?.commentsDisabled) throw new functions.https.HttpsError('permission-denied', 'Comments are disabled.');
        if (typeof data.text !== 'string' || !data.text.trim() || data.text.length > 2000) throw new functions.https.HttpsError('invalid-argument', 'Write a comment of up to 2,000 characters.');
        const user = (await db.ref(`users/${uid}`).once('value')).val();
        await postRef.child('comments').push({ userId: uid, userName: user?.displayName || 'Pet parent', text: data.text.trim(), timestamp: Date.now() });
      } else if (data.action === 'deleteComment') {
        requireIds(data.commentId);
        const comment = postRef.child(`comments/${data.commentId}`);
        if (uid !== owner && (await comment.once('value')).val()?.userId !== uid) throw new functions.https.HttpsError('permission-denied', 'You cannot remove this comment.');
        await comment.remove();
      } else throw new functions.https.HttpsError('invalid-argument', 'Unknown action.');
      return publicPosts({ [data.postId]: (await postRef.once('value')).val() })[data.postId];
    }),
  };
};
