const policy = require('./domain/growth');
module.exports = ({ functions, admin, now = Date.now }) => {
  const fail = (code, message) => { throw new functions.https.HttpsError(code, message); };
  const signedIn = context => context.auth?.uid || fail('unauthenticated', 'Sign in to manage your pet’s sharing.');
  const callable = handler => functions.runWith({ memory: '256MB', timeoutSeconds: 30, maxInstances: 10 }).https.onCall(handler);
  const db = () => admin.database();
  const ownPet = async (uid, petId) => {
    if (!policy.ID.test(petId || '')) fail('invalid-argument', 'Choose your pet.');
    const [pet, owner] = await Promise.all([db().ref(`userPets/${uid}/${petId}`).once('value'), db().ref(`petOwners/${petId}`).once('value')]);
    if (!pet.exists() || owner.val() !== uid) fail('permission-denied', 'Only the pet’s owner can change these sharing settings.');
    return pet.val();
  };
  return {
    getMySafetyCard: callable(async (data, context) => {
      const uid = signedIn(context); await ownPet(uid, data?.petId);
      return (await db().ref(`petSafetyCards/${uid}/${data.petId}`).once('value')).val();
    }),
    saveSafetyCard: callable(async (data, context) => {
      const uid = signedIn(context), pet = await ownPet(uid, data?.petId);
      // Serialize edits so concurrent first saves produce one stable token.
      const target = db().ref(`petSafetyCards/${uid}/${data.petId}`);
      const result = await target.transaction(previous => {
        try { return policy.safetyCard(data, pet, previous || {}).config; }
        catch { return; }
      });
      if (!result.committed) { try { policy.safetyCard(data, pet); } catch (error) { fail('invalid-argument', error.message); } fail('aborted', 'The safety card changed. Please try again.'); }
      const config = result.snapshot.val();
      // Public reads resolve the live owner configuration; revocation does not
      // depend on copying stale public contact data into a second database node.
      await db().ref(`safetyCardLinks/${config.token}`).set({ ownerId: uid, petId: data.petId });
      return config;
    }),
    getSafetyCard: callable(async data => {
      if (!policy.TOKEN.test(data?.token || '')) return null;
      const link = (await db().ref(`safetyCardLinks/${data.token}`).once('value')).val();
      if (!link || !policy.ID.test(link.ownerId || '') || !policy.ID.test(link.petId || '')) return null;
      const [config, pet, owner] = await Promise.all([db().ref(`petSafetyCards/${link.ownerId}/${link.petId}`).once('value'), db().ref(`userPets/${link.ownerId}/${link.petId}`).once('value'), db().ref(`petOwners/${link.petId}`).once('value')]);
      if (!config.val()?.enabled || config.val().token !== data.token || !pet.exists() || owner.val() !== link.ownerId) return null;
      return policy.safetyCard(config.val(), pet.val(), config.val()).card;
    }),
    publishWeeklyCard: callable(async (data, context) => {
      const uid = signedIn(context), pet = await ownPet(uid, data?.petId);
      if (!policy.TOKEN.test(data?.requestId || '')) fail('invalid-argument', 'Start a fresh weekly card.');
      const user = (await db().ref(`users/${uid}`).once('value')).val();
      let endDate;
      try { endDate = new Intl.DateTimeFormat('en-CA', { timeZone: user?.notificationPreferences?.timeZone || user?.timeZone || 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(now())); } catch { fail('failed-precondition', 'Correct your time zone in Settings first.'); }
      const startDate = new Date(Date.parse(`${endDate}T12:00:00Z`) - 6 * 86400000).toISOString().slice(0, 10);
      const [events, days] = await Promise.all([db().ref(`petEvents/${data.petId}`).orderByChild('timestamp').limitToLast(100).once('value'), db().ref(`careDays/${uid}`).orderByKey().startAt(startDate).endAt(endDate).once('value')]);
      let card; try { card = policy.publicWeek(data, pet, events.val(), days.val(), endDate); } catch (error) { fail('invalid-argument', error.message); }
      const target = db().ref(`weeklyCardLinks/${data.requestId}`);
      const result = await target.transaction(current => !current ? { ownerId: uid, petId: data.petId, card, createdAt: now(), active: true } : current.ownerId === uid && current.petId === data.petId && current.active ? current : undefined);
      if (!result.committed) fail('failed-precondition', 'This card was revoked. Create a fresh card.');
      await db().ref(`weeklyCardIndex/${uid}/${data.petId}/${data.requestId}`).set(result.snapshot.val().createdAt);
      return { token: data.requestId, card: result.snapshot.val().card };
    }),
    getWeeklyCard: callable(async data => {
      if (!policy.TOKEN.test(data?.token || '')) return null;
      const link = (await db().ref(`weeklyCardLinks/${data.token}`).once('value')).val();
      if (!link?.active) return null;
      const owner = (await db().ref(`petOwners/${link.petId}`).once('value')).val();
      if (owner !== link.ownerId || !(await db().ref(`userPets/${owner}/${link.petId}`).once('value')).exists()) return null;
      return link.card;
    }),
    listMyWeeklyCards: callable(async (data, context) => {
      const uid = signedIn(context); await ownPet(uid, data?.petId);
      // The per-owner index exposes neither contact details nor public tokens to
      // other clients. The bounded owner list is maintained by the publishing UI.
      const index = (await db().ref(`weeklyCardIndex/${uid}/${data.petId}`).orderByValue().limitToLast(30).once('value')).val() || {};
      const rows = await Promise.all(Object.keys(index).filter(key => policy.TOKEN.test(key)).slice(-30).map(async token => {
        const entry = (await db().ref(`weeklyCardLinks/${token}`).once('value')).val();
        return entry?.active && entry.ownerId === uid ? { token, createdAt: entry.createdAt, endDate: entry.card.endDate } : null;
      }));
      return rows.filter(Boolean).sort((a, b) => b.createdAt - a.createdAt);
    }),
    revokeWeeklyCard: callable(async (data, context) => {
      const uid = signedIn(context);
      if (!policy.TOKEN.test(data?.token || '')) fail('invalid-argument', 'Choose a shared card.');
      const target = db().ref(`weeklyCardLinks/${data.token}`);
      const result = await target.transaction(current => current === null ? null : current.ownerId === uid ? { ...current, active: false, card: null } : undefined);
      if (!result.committed || result.snapshot.val()?.ownerId !== uid) fail('permission-denied', 'You can only revoke your own shared cards.');
      return { success: true };
    }),
  };
};
