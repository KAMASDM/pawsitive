const { createHash, randomBytes } = require('node:crypto');
const DAY = 86400000;
const idPattern = /^[a-zA-Z0-9_-]{1,128}$/;
const hash = token => createHash('sha256').update(token).digest('hex');

module.exports = ({ functions, admin }) => {
  const fail = (code, message) => { throw new functions.https.HttpsError(code, message); };
  const signedIn = context => context.auth?.uid || fail('unauthenticated', 'Sign in to manage shared care.');
  const callable = handler => functions.runWith({ memory: '256MB', timeoutSeconds: 30, maxInstances: 10 }).https.onCall(handler);
  const active = member => member && member.expiresAt > Date.now() && ['caregiver', 'viewer', 'sitter'].includes(member.role);
  return {
    createCareInvitation: callable(async (data, context) => {
      const uid = signedIn(context);
      if (!['caregiver', 'viewer', 'sitter'].includes(data?.role)) fail('invalid-argument', 'Choose a caregiver role.');
      const days = data.role === 'sitter' ? Number(data.days) : 365;
      if (!Number.isInteger(days) || days < 1 || days > 365 || (data.role === 'sitter' && days > 30)) fail('invalid-argument', 'Sitter access must last between 1 and 30 days.');
      const db = admin.database();
      const token = randomBytes(32).toString('base64url');
      const key = hash(token);
      const now = Date.now();
      const invitation = { role: data.role, accessDays: days, createdAt: now, expiresAt: now + 7 * DAY, status: 'pending' };
      const result = await db.ref(`careFamilies/${uid}/invitations`).transaction(current => {
        const invitations = Object.fromEntries(Object.entries(current || {}).filter(([, item]) => item.expiresAt > now));
        if (Object.values(invitations).filter(item => item.status === 'pending').length >= 10) return;
        return { ...invitations, [key]: invitation };
      });
      if (!result.committed) fail('resource-exhausted', 'You already have 10 active invitations. Revoke an invitation first.');
      return { token, ownerId: uid, invitationId: key, expiresAt: invitation.expiresAt };
    }),
    acceptCareInvitation: callable(async (data, context) => {
      const uid = signedIn(context);
      if (!idPattern.test(data?.ownerId || '') || !/^[a-zA-Z0-9_-]{43}$/.test(data?.token || '')) fail('invalid-argument', 'This invitation link is invalid.');
      if (data.ownerId === uid) fail('invalid-argument', 'This is your own invitation. Share it with your caregiver.');
      const db = admin.database();
      const user = (await db.ref(`users/${uid}`).once('value')).val();
      const key = hash(data.token);
      const now = Date.now();
      const familyRef = db.ref(`careFamilies/${data.ownerId}`);
      const result = await familyRef.transaction(current => {
        // An empty local cache is not proof the invitation is absent. A null
        // proposal forces a server version check, then retries with current data.
        // If the family really is absent this is a no-op, rejected below.
        if (current === null) return null;
        const invitation = current?.invitations?.[key];
        if (!invitation || invitation.expiresAt <= now) return;
        // Allow a retry after membership was committed but the discovery index failed.
        if (invitation.status === 'accepted' && invitation.acceptedBy === uid && active(current.members?.[uid])) return current;
        if (invitation.status !== 'pending') return;
        if (Object.values(current.members || {}).filter(active).length >= 20) return;
        current.members ||= {};
        current.members[uid] = { role: invitation.role, displayName: String(user?.displayName || 'Caregiver').slice(0, 80), expiresAt: now + invitation.accessDays * DAY, joinedAt: now };
        current.invitations[key] = { ...invitation, status: 'accepted', acceptedBy: uid };
        return current;
      });
      if (!result.committed || result.snapshot.val()?.invitations?.[key]?.acceptedBy !== uid || !active(result.snapshot.val()?.members?.[uid])) fail('failed-precondition', 'This invitation has expired, was revoked, or has already been used. Ask the owner for a new link.');
      const owner = (await db.ref(`users/${data.ownerId}`).once('value')).val();
      const member = result.snapshot.val().members[uid];
      await db.ref(`careAccess/${uid}/${data.ownerId}`).set({ displayName: String(owner?.displayName || 'Pet parent').slice(0, 80), role: member.role, expiresAt: member.expiresAt });
      return { ownerId: data.ownerId };
    }),
    listCareFamily: callable(async (_, context) => {
      const uid = signedIn(context);
      const family = (await admin.database().ref(`careFamilies/${uid}`).once('value')).val() || {};
      return { members: family.members || {}, invitations: Object.fromEntries(Object.entries(family.invitations || {}).filter(([, invitation]) => invitation.status === 'pending' && invitation.expiresAt > Date.now()).map(([id, invitation]) => [id, { role: invitation.role, expiresAt: invitation.expiresAt }])) };
    }),
    revokeCareAccess: callable(async (data, context) => {
      const uid = signedIn(context);
      const db = admin.database();
      if (data?.memberId && idPattern.test(data.memberId)) {
        await db.ref().update({ [`careFamilies/${uid}/members/${data.memberId}`]: null, [`careAccess/${data.memberId}/${uid}`]: null });
      } else if (/^[a-f0-9]{64}$/.test(data?.invitationId || '')) {
        await db.ref(`careFamilies/${uid}/invitations/${data.invitationId}`).remove();
      } else fail('invalid-argument', 'Choose an invitation or caregiver.');
      return { success: true };
    }),
    leaveCareFamily: callable(async (data, context) => {
      const uid = signedIn(context);
      if (!idPattern.test(data?.ownerId || '')) fail('invalid-argument', 'Choose a care family.');
      await admin.database().ref().update({ [`careFamilies/${data.ownerId}/members/${uid}`]: null, [`careAccess/${uid}/${data.ownerId}`]: null });
      return { success: true };
    }),
    getSharedCarePets: callable(async (data, context) => {
      const uid = signedIn(context);
      if (!idPattern.test(data?.ownerId || '')) fail('invalid-argument', 'Choose a care family.');
      const db = admin.database();
      const family = (await db.ref(`careFamilies/${data.ownerId}`).once('value')).val();
      if (data.ownerId !== uid && !active(family?.members?.[uid])) fail('permission-denied', 'Shared care access has ended.');
      const [pets, owner] = await Promise.all([db.ref(`userPets/${data.ownerId}`).once('value'), db.ref(`users/${data.ownerId}`).once('value')]);
      const safe = Object.fromEntries(Object.entries(pets.val() || {}).map(([id, pet]) => [id, { name: pet.name || 'Pet', type: pet.type || '', image: pet.image || '' }]));
      return { pets: safe, timeZone: owner.val()?.notificationPreferences?.timeZone || owner.val()?.timeZone || 'Asia/Kolkata', members: Object.fromEntries(Object.entries(family?.members || {}).filter(([, member]) => active(member)).map(([id, member]) => [id, member.displayName])), ownerName: owner.val()?.displayName || 'Pet parent' };
    }),
  };
};
