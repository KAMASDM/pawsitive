const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');

admin.initializeApp();

const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const firestore = admin.firestore();
const serverTimestamp = admin.firestore.FieldValue.serverTimestamp;
const arrayUnion = admin.firestore.FieldValue.arrayUnion;
const COMMERCE_ADMIN_EMAIL = 'anantsoftcomputing@gmail.com';
const BASE_URL = 'https://pawppy.in';

const assertAuthed = (context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Sign in to continue.');
};
const assertAdmin = (context) => {
  assertAuthed(context);
  if (context.auth.token.role !== 'admin' && (context.auth.token.email || '').toLowerCase() !== COMMERCE_ADMIN_EMAIL)
    throw new functions.https.HttpsError('permission-denied', 'Admin access required.');
};

// ============================================================================
// NOTIFICATION TEMPLATES — 30 types, emoji-rich, personalised
// ============================================================================

const T = {
  // Social
  mating_request:    (d) => ({ title: '💕 New Mating Request',               body: `${d.senderName} wants to pair their ${d.petName} with your pet! 🐾 Tap to review.` }),
  mating_accepted:   (d) => ({ title: '🎉 Mating Request Accepted!',         body: `${d.receiverName}'s ${d.receiverPet} said yes to ${d.myPet}! 💕 Start chatting now.` }),
  mating_declined:   (d) => ({ title: '🐾 Request Update',                   body: `Not a match for ${d.myPet} this time — keep exploring! 🔍` }),
  message:           (d) => ({ title: `💬 ${d.senderName}`,                  body: d.text }),
  adoption_inquiry:  (d) => ({ title: `❤️ Someone Wants to Adopt ${d.petName}!`, body: `${d.inquirerName} is interested in adopting ${d.petName}. Tap to connect! 🐾` }),

  // Health & Care
  vacc_7d:           (d) => ({ title: '💉 Vaccination Due in 7 Days',        body: `${d.petName}'s ${d.vaccineName} is due on ${d.dueDate}. Book your vet! 🏥` }),
  vacc_1d:           (d) => ({ title: '⚠️ Vaccination Due Tomorrow!',        body: `${d.petName}'s ${d.vaccineName} is due tomorrow — don't miss it! 🐾` }),
  vacc_overdue:      (d) => ({ title: '🚨 Overdue Vaccination!',             body: `${d.petName}'s ${d.vaccineName} was due on ${d.dueDate}. Visit your vet ASAP! 🏥` }),
  birthday_today:    (d) => ({ title: `🎂 Happy Birthday ${d.petName}!`,     body: `${d.petName} turns ${d.age} today! 🎉 Spoil them with extra treats and love! 🐾` }),
  birthday_tomorrow: (d) => ({ title: `🎉 Birthday Tomorrow — ${d.petName}!`, body: `${d.petName}'s big day is tomorrow! Turning ${d.age} — plan something special! 🎂` }),
  birthday_3d:       (d) => ({ title: `🎈 Birthday in 3 Days!`,              body: `${d.petName} turns ${d.age} in just 3 days! 🐾 Time to plan the celebration! 🎂` }),
  health_checkup:    (d) => ({ title: '🏥 Vet Visit Overdue',                body: `${d.petName} hasn't had a checkup in 6+ months. Book a wellness visit today! 🐾` }),
  deworming:         (d) => ({ title: '💊 Monthly Deworming Reminder',       body: `Time for ${d.petName}'s monthly deworming! Keep your furball parasite-free. 🐾` }),

  // Community
  new_challenge:     (d) => ({ title: '🏆 New Tuesday Challenge!',           body: `"${d.theme}" — ${d.prompt} Submit your photo to win! 📸` }),
  challenge_ending:  (d) => ({ title: '⏰ Challenge Closes in 24 Hours!',    body: `Cast your vote in "${d.theme}" before it ends! ${d.entryCount} entries competing. 🗳️` }),
  challenge_winner:  (d) => ({ title: '🏆 You Won the Weekly Challenge!',    body: `Your entry in "${d.theme}" was voted #1 by the community! 🎉 Congrats! 🐾` }),
  challenge_vote:    (d) => ({ title: '❤️ Your Entry Got a Vote!',           body: `Someone voted for your photo in "${d.theme}"! You now have ${d.voteCount} vote${d.voteCount !== 1 ? 's' : ''}. 🏅` }),
  new_quiz:          (d) => ({ title: '🧠 New Weekly Quiz!',                 body: `"${d.title}" — ${d.topic}. Test your pet knowledge & climb the leaderboard! ✨` }),

  // Commerce
  order_placed:      (d) => ({ title: '🛍️ New Order Received!',              body: `${d.buyerName} ordered ${d.itemCount} item${d.itemCount !== 1 ? 's' : ''} — ₹${d.total}. Confirm within 24h! 🚀` }),
  order_confirmed:   (d) => ({ title: '✅ Order Confirmed!',                 body: `Your order from ${d.storeName} is confirmed. We'll notify you when it ships! 📦` }),
  order_shipped:     (d) => ({ title: '🚚 Your Order is on the Way!',        body: `Great news! Your ${d.storeName} order has shipped! 🐾 📦` }),
  order_delivered:   (d) => ({ title: '📦 Order Delivered!',                 body: `Your order from ${d.storeName} has arrived! We hope your pet loves it. 🎉` }),
  order_cancelled:   (d) => ({ title: '❌ Order Cancelled',                  body: `Your ${d.storeName} order was cancelled. Any payment will be refunded within 5–7 days. 💸` }),

  // Lost & Found
  lost_pet_nearby:   (d) => ({ title: `🆘 Lost ${d.petType} Nearby — Help Needed!`, body: `"${d.petName || 'A pet'}" (${d.breed || d.petType}) reported lost ~${d.distKm} km away. Seen them? 🐾` }),
  found_pet_nearby:  (d) => ({ title: '🐾 Found Pet Near You!',              body: `Someone found a ${d.petType} near ${d.area}. Know whose it might be? Help reunite them! 🏠` }),

  // Vendor / System
  vendor_approved:   (d) => ({ title: '🎉 Your Pawppy Store is Live!',       body: `"${d.businessName}" has been approved! Start listing your products now. 🛍️` }),
  vendor_rejected:   (d) => ({ title: '📝 Store Application Needs Updates',  body: d.note || 'Your store application has feedback. Please review and reapply.' }),
  vendor_suspended:  (d) => ({ title: '⚠️ Store Temporarily Suspended',      body: `"${d.businessName}" has been suspended. ${d.note || 'Contact Pawppy support for details.'}` }),
};

// ============================================================================
// NOTIFICATION HELPERS
// ============================================================================

async function writeUserNotification(userId, { type, title, body, data = {} }) {
  if (!userId) return;
  const ref = admin.database().ref(`notifications/${userId}`).push();
  await ref.set({ id: ref.key, type, title, body, data, timestamp: admin.database.ServerValue.TIMESTAMP, read: false });
}

async function writeBroadcastNotification(id, { type, title, body, data = {} }) {
  if (!id) return;
  await admin.database().ref(`broadcastNotifications/${id}`).set({
    type, title, body, data, timestamp: admin.database.ServerValue.TIMESTAMP, active: true,
  });
}

/** Push + in-app inbox + badge counter in one call. Cleans stale FCM tokens. */
async function notifyUser(userId, { type, title, body, data = {} }) {
  if (!userId) return;
  const db = admin.database();
  const clickAction = data.click_action || '/';

  await Promise.all([
    writeUserNotification(userId, { type, title, body, data }),
    db.ref(`users/${userId}/unreadNotifications`).transaction((n) => (n || 0) + 1),
  ]);

  const tokenSnap = await db.ref(`users/${userId}/fcmToken`).once('value');
  const fcmToken = tokenSnap.val();
  if (!fcmToken) return;

  try {
    const stringData = Object.fromEntries(
      Object.entries({ type, click_action: clickAction, ...data }).map(([k, v]) => [k, String(v)])
    );
    await admin.messaging().send({
      token: fcmToken,
      notification: { title, body, icon: '/favicon.png', badge: '/favicon.png' },
      data: stringData,
      webpush: { fcm_options: { link: `${BASE_URL}${clickAction}` } },
    });
  } catch (err) {
    if (err.code === 'messaging/registration-token-not-registered') {
      await db.ref(`users/${userId}/fcmToken`).remove();
    }
    console.warn(`[notifyUser] Push failed for ${userId}:`, err.code || err.message);
  }
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = (x) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function getUsersNearby(lat, lon, radiusKm, excludeUserId) {
  const snap = await admin.database().ref('users').once('value');
  const users = snap.val() || {};
  const nearby = [];
  for (const [uid, userData] of Object.entries(users)) {
    if (uid === excludeUserId) continue;
    for (const petData of Object.values(userData.pets || {})) {
      const loc = petData.location;
      if (loc?.latitude && loc?.longitude) {
        const dist = haversineKm(lat, lon, loc.latitude, loc.longitude);
        if (dist <= radiusKm) {
          nearby.push({ userId: uid, distKm: Math.round(dist * 10) / 10 });
          break;
        }
      }
    }
  }
  return nearby;
}

function fmtDate(val) {
  const d = val instanceof Date ? val : new Date(val);
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}

function getISOWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

function getWeekId(date = new Date()) {
  return `${date.getFullYear()}-W${String(getISOWeekNumber(date)).padStart(2, '0')}`;
}

// ============================================================================
// AUTH
// ============================================================================

exports.onUserCreate = functions.auth.user().onCreate(async (user) => {
  if (!user?.uid) return null;
  const role = user.email?.toLowerCase() === COMMERCE_ADMIN_EMAIL ? 'admin' : 'customer';
  const claims = { role };
  if (role === 'admin') claims.admin = true;
  await admin.auth().setCustomUserClaims(user.uid, claims);
  await firestore.doc(`users/${user.uid}`).set({
    role,
    displayName: user.displayName || user.email?.split('@')[0] || '',
    email: user.email || '',
    phone: user.phoneNumber || '',
    photoURL: user.photoURL || '',
    vendorId: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true });
  return null;
});

// ============================================================================
// VENDOR MANAGEMENT
// ============================================================================

exports.requestVendorRole = functions.https.onCall(async (data, context) => {
  assertAuthed(context);
  const uid = context.auth.uid;
  const userRecord = await admin.auth().getUser(uid);
  const existingUser = await firestore.doc(`users/${uid}`).get();
  const existingVendorId = existingUser.data()?.vendorId || context.auth.token.vendorId;
  if (existingVendorId) return { vendorId: existingVendorId, status: 'existing' };

  const vendorRef = firestore.collection('vendors').doc();
  const vendorId = vendorRef.id;

  await firestore.runTransaction(async (tx) => {
    tx.set(vendorRef, {
      ownerUid: uid,
      businessName: '', legalName: '', ownerName: userRecord.displayName || '',
      email: userRecord.email || '', phone: userRecord.phoneNumber || '',
      gstin: '', pan: '',
      address: { line1: '', line2: '', city: '', state: '', pincode: '', country: 'India' },
      categories: [], description: '', logoUrl: '', bannerUrl: '', website: '', socials: {},
      documents: [], status: 'pending',
      statusHistory: [{ from: null, to: 'pending', note: 'Vendor registration started.', changedBy: uid, changedAt: admin.firestore.Timestamp.now() }],
      bankDetails: { accountName: '', accountNumber: '', ifsc: '' },
      productCount: 0, orderCount: 0, rating: 0, approvedAt: null, approvedBy: null,
      createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
    });
    tx.set(firestore.doc(`users/${uid}`), {
      role: 'vendor',
      displayName: userRecord.displayName || userRecord.email?.split('@')[0] || '',
      email: userRecord.email || '', phone: userRecord.phoneNumber || '',
      photoURL: userRecord.photoURL || '', vendorId,
      createdAt: existingUser.exists ? existingUser.data().createdAt : serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });
  });

  await admin.auth().setCustomUserClaims(uid, { ...(context.auth.token || {}), role: 'vendor', vendorId });
  return { vendorId, status: 'created' };
});

exports.provisionCommerceAdmin = functions.https.onCall(async (data, context) => {
  assertAuthed(context);
  if ((context.auth.token.email || '').toLowerCase() !== COMMERCE_ADMIN_EMAIL)
    throw new functions.https.HttpsError('permission-denied', 'Only the configured Pawppy admin can provision admin access.');
  const uid = context.auth.uid;
  const userRecord = await admin.auth().getUser(uid);
  await admin.auth().setCustomUserClaims(uid, { ...(context.auth.token || {}), role: 'admin', admin: true });
  await firestore.doc(`users/${uid}`).set({
    role: 'admin',
    displayName: userRecord.displayName || userRecord.email?.split('@')[0] || '',
    email: userRecord.email || '', phone: userRecord.phoneNumber || '',
    photoURL: userRecord.photoURL || '',
    updatedAt: serverTimestamp(), createdAt: serverTimestamp(),
  }, { merge: true });
  return { success: true, role: 'admin' };
});

exports.setVendorStatus = functions.https.onCall(async (data, context) => {
  assertAdmin(context);
  const { vendorId, status, note = '' } = data || {};
  const allowed = ['pending', 'documentation_required', 'under_review', 'approved', 'rejected', 'suspended'];
  if (!vendorId || !allowed.includes(status))
    throw new functions.https.HttpsError('invalid-argument', 'Valid vendorId and status required.');

  const vendorRef = firestore.doc(`vendors/${vendorId}`);
  const vendorSnap = await vendorRef.get();
  if (!vendorSnap.exists) throw new functions.https.HttpsError('not-found', 'Vendor not found.');

  const vendor = vendorSnap.data();
  await vendorRef.update({
    status, reviewNote: note,
    statusHistory: arrayUnion({ from: vendor.status || null, to: status, note, changedBy: context.auth.uid, changedAt: admin.firestore.Timestamp.now() }),
    ...(status === 'approved' ? { approvedAt: serverTimestamp(), approvedBy: context.auth.uid } : {}),
    updatedAt: serverTimestamp(),
  });

  if (vendor.ownerUid) {
    const tKey = status === 'approved' ? 'vendor_approved' : status === 'rejected' ? 'vendor_rejected' : status === 'suspended' ? 'vendor_suspended' : null;
    if (tKey) {
      const { title, body } = T[tKey]({ businessName: vendor.businessName || 'Your store', note });
      await notifyUser(vendor.ownerUid, { type: 'vendor_status', title, body, data: { type: 'vendor_status', vendorId, status, click_action: '/vendor/status' } });
    }
  }
  return { success: true, vendorId, status };
});

// ============================================================================
// MATING REQUESTS
// ============================================================================

exports.sendMatingRequestNotification = functions.database
  .ref('/matingRequests/{requestId}')
  .onCreate(async (snapshot, context) => {
    try {
      const req = snapshot.val();
      const { receiverId, senderId, senderPetId } = req;
      const { requestId } = context.params;

      const [senderSnap, petSnap] = await Promise.all([
        admin.database().ref(`users/${senderId}`).once('value'),
        admin.database().ref(`pets/${senderPetId}`).once('value'),
      ]);
      const sender = senderSnap.val() || {};
      const pet = petSnap.val() || {};

      const { title, body } = T.mating_request({
        senderName: sender.displayName || 'Someone',
        petName: pet.name || (pet.breed ? `their ${pet.breed}` : 'their pet'),
      });
      await notifyUser(receiverId, { type: 'mating_request', title, body, data: { type: 'mating_request', requestId, senderId, click_action: '/profile?tab=requests' } });
    } catch (err) {
      console.error('[sendMatingRequestNotification]', err);
    }
  });

exports.onMatingRequestStatusChange = functions.database
  .ref('/matingRequests/received/{receiverId}/{requestId}')
  .onUpdate(async (change, context) => {
    try {
      const before = change.before.val();
      const after = change.after.val();
      if (!after || before?.status === after?.status) return;
      if (!['accepted', 'declined'].includes(after.status)) return;

      const { receiverId } = context.params;
      const { senderId, senderPetId, receiverPetId } = after;

      const [receiverSnap, receiverPetSnap, myPetSnap] = await Promise.all([
        admin.database().ref(`users/${receiverId}`).once('value'),
        receiverPetId ? admin.database().ref(`users/${receiverId}/pets/${receiverPetId}`).once('value') : Promise.resolve(null),
        senderPetId ? admin.database().ref(`users/${senderId}/pets/${senderPetId}`).once('value') : Promise.resolve(null),
      ]);

      const receiver = receiverSnap.val() || {};
      const receiverPet = receiverPetSnap?.val() || {};
      const myPet = myPetSnap?.val() || {};

      if (after.status === 'accepted') {
        const { title, body } = T.mating_accepted({
          receiverName: receiver.displayName || 'Someone',
          receiverPet: receiverPet.name || 'their pet',
          myPet: myPet.name || 'your pet',
        });
        await notifyUser(senderId, { type: 'mating_accepted', title, body, data: { type: 'mating_accepted', receiverId, click_action: '/profile?tab=messages' } });
      } else {
        const { title, body } = T.mating_declined({ myPet: myPet.name || 'your pet' });
        await notifyUser(senderId, { type: 'mating_declined', title, body, data: { type: 'mating_declined', receiverId, click_action: '/nearby-mates' } });
      }
    } catch (err) {
      console.error('[onMatingRequestStatusChange]', err);
    }
  });

// ============================================================================
// MESSAGES
// ============================================================================

exports.sendMessageNotification = functions.database
  .ref('/conversations/{conversationId}/messages/{messageId}')
  .onCreate(async (snapshot, context) => {
    try {
      const msg = snapshot.val();
      const { senderId, text } = msg;
      const { conversationId } = context.params;

      const convoSnap = await admin.database().ref(`conversations/${conversationId}`).once('value');
      const convo = convoSnap.val() || {};
      const participants = Array.isArray(convo.participants)
        ? convo.participants
        : Object.keys(convo.participants || {});
      const receiverId = participants.find((id) => id !== senderId);
      if (!receiverId) return;

      const senderSnap = await admin.database().ref(`users/${senderId}`).once('value');
      const sender = senderSnap.val() || {};
      const preview = String(text || '').substring(0, 100) + (String(text || '').length > 100 ? '…' : '');

      const { title, body } = T.message({ senderName: sender.displayName || 'New message', text: preview });
      await notifyUser(receiverId, { type: 'message', title, body, data: { type: 'message', conversationId, senderId, click_action: '/profile?tab=messages' } });
    } catch (err) {
      console.error('[sendMessageNotification]', err);
    }
  });

// ============================================================================
// ADOPTION INQUIRIES
// ============================================================================

exports.onAdoptionConversationCreated = functions.database
  .ref('/conversations/{conversationId}')
  .onCreate(async (snapshot, context) => {
    try {
      const convo = snapshot.val();
      if (!convo?.isAdoption) return;

      const participants = Array.isArray(convo.participants)
        ? convo.participants
        : Object.keys(convo.participants || {});
      if (participants.length < 2) return;

      const petId = convo.petId;
      let ownerId = null;
      let inquirerId = null;

      if (petId) {
        for (const uid of participants) {
          const petSnap = await admin.database().ref(`users/${uid}/pets/${petId}`).once('value');
          if (petSnap.exists()) { ownerId = uid; break; }
        }
      }
      if (!ownerId) ownerId = participants[1];
      inquirerId = participants.find((id) => id !== ownerId);

      const [petSnap, inquirerSnap] = await Promise.all([
        petId ? admin.database().ref(`users/${ownerId}/pets/${petId}`).once('value') : Promise.resolve(null),
        admin.database().ref(`users/${inquirerId}`).once('value'),
      ]);

      const pet = petSnap?.val() || {};
      const inquirer = inquirerSnap.val() || {};

      const { title, body } = T.adoption_inquiry({ petName: pet.name || 'your pet', inquirerName: inquirer.displayName || 'Someone' });
      await notifyUser(ownerId, {
        type: 'adoption_inquiry', title, body,
        data: { type: 'adoption_inquiry', conversationId: context.params.conversationId, inquirerId, click_action: '/profile?tab=messages' },
      });
    } catch (err) {
      console.error('[onAdoptionConversationCreated]', err);
    }
  });

// ============================================================================
// COMMERCE — ORDERS
// ============================================================================

exports.onVendorOrderCreated = functions.database
  .ref('/vendorOrders/{storeId}/{orderId}')
  .onCreate(async (snapshot, context) => {
    try {
      const order = snapshot.val();
      const { storeId, orderId } = context.params;

      const vendorDoc = await firestore.doc(`vendors/${storeId}`).get();
      const ownerUid = vendorDoc.data()?.ownerUid;
      if (!ownerUid) return;

      const itemCount = (order.items || []).length;
      const total = (order.items || []).reduce((sum, i) => sum + (i.price || 0) * (i.quantity || 1), 0);

      const { title, body } = T.order_placed({ buyerName: order.buyerName || 'A customer', itemCount, total: total.toFixed(0) });
      await notifyUser(ownerUid, { type: 'order_placed', title, body, data: { type: 'order_placed', orderId, storeId, click_action: '/vendor/orders' } });
    } catch (err) {
      console.error('[onVendorOrderCreated]', err);
    }
  });

exports.updateOrderStatus = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Sign in to continue.');
  const { orderId, buyerId, storeId, status, note = '' } = data || {};
  const allowed = ['confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!orderId || !buyerId || !storeId || !allowed.includes(status))
    throw new functions.https.HttpsError('invalid-argument', 'orderId, buyerId, storeId, and a valid status are required.');

  const db = admin.database();
  const updatedAt = Date.now();
  await Promise.all([
    db.ref(`buyerOrders/${buyerId}/${orderId}`).update({ status, note, updatedAt }),
    db.ref(`vendorOrders/${storeId}/${orderId}`).update({ status, note, updatedAt }),
  ]);

  const orderSnap = await db.ref(`buyerOrders/${buyerId}/${orderId}`).once('value');
  const order = orderSnap.val() || {};
  const tKey = `order_${status}`;
  if (T[tKey]) {
    const { title, body } = T[tKey]({ storeName: order.storeName || 'Pawppy Store' });
    await notifyUser(buyerId, { type: tKey, title, body, data: { type: tKey, orderId, storeId, click_action: '/orders' } });
  }
  return { success: true, orderId, status };
});

// ============================================================================
// LOST & FOUND
// ============================================================================

exports.onLostPetReported = functions.database
  .ref('/lostPets/{reportId}')
  .onCreate(async (snapshot, context) => {
    try {
      const report = snapshot.val();
      const { userId, petType = 'pet', petName, breed, lastSeenLocation } = report;
      const lat = lastSeenLocation?.latitude;
      const lon = lastSeenLocation?.longitude;
      if (!lat || !lon) return;

      const nearby = await getUsersNearby(lat, lon, 10, userId);
      await Promise.all(nearby.map(({ userId: uid, distKm }) => {
        const { title, body } = T.lost_pet_nearby({ petType, petName, breed, distKm });
        return notifyUser(uid, {
          type: 'lost_pet_nearby', title, body,
          data: { type: 'lost_pet_nearby', reportId: context.params.reportId, lat: String(lat), lon: String(lon), click_action: '/lost-and-found' },
        });
      }));
      console.log(`[onLostPetReported] Notified ${nearby.length} users`);
    } catch (err) {
      console.error('[onLostPetReported]', err);
    }
  });

exports.onFoundPetReported = functions.database
  .ref('/foundPets/{reportId}')
  .onCreate(async (snapshot, context) => {
    try {
      const report = snapshot.val();
      const { userId, petType = 'pet', foundLocation } = report;
      const lat = foundLocation?.latitude;
      const lon = foundLocation?.longitude;
      if (!lat || !lon) return;

      const nearby = await getUsersNearby(lat, lon, 10, userId);
      const area = foundLocation.address
        ? foundLocation.address.split(',').slice(0, 2).join(',').trim()
        : `${lat.toFixed(2)}, ${lon.toFixed(2)}`;

      await Promise.all(nearby.map(({ userId: uid }) => {
        const { title, body } = T.found_pet_nearby({ petType, area });
        return notifyUser(uid, {
          type: 'found_pet_nearby', title, body,
          data: { type: 'found_pet_nearby', reportId: context.params.reportId, lat: String(lat), lon: String(lon), click_action: '/lost-and-found' },
        });
      }));
      console.log(`[onFoundPetReported] Notified ${nearby.length} users`);
    } catch (err) {
      console.error('[onFoundPetReported]', err);
    }
  });

// ============================================================================
// CALLABLE UTILITIES
// ============================================================================

exports.clearUnreadNotifications = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  await admin.database().ref(`users/${context.auth.uid}/unreadNotifications`).set(0);
  return { success: true };
});

exports.subscribeToNotifications = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  const { token } = data;
  if (!token) throw new functions.https.HttpsError('invalid-argument', 'Missing FCM token');
  await Promise.all([
    admin.messaging().subscribeToTopic([token], 'new-challenges'),
    admin.messaging().subscribeToTopic([token], 'new-quizzes'),
  ]);
  return { success: true };
});

// ============================================================================
// WEEKLY CHALLENGE — every Tuesday 09:00 IST
// ============================================================================

exports.activateTuesdayChallenge = functions
  .runWith({ memory: '512MB' })
  .pubsub.schedule('0 3 * * 2')
  .timeZone('Asia/Kolkata')
  .onRun(async () => {
    const fs = getFirestore();
    const now = new Date();
    const weekNumber = getISOWeekNumber(now);
    const year = now.getFullYear();

    try {
      const activeSnap = await fs.collection('challenges').where('isActive', '==', true).get();
      const batch = fs.batch();

      for (const doc of activeSnap.docs) {
        const entriesSnap = await fs.collection('challenges').doc(doc.id)
          .collection('entries').orderBy('voteCount', 'desc').limit(1).get();
        const winnerId = entriesSnap.empty ? null : entriesSnap.docs[0].id;

        if (winnerId) {
          const winnerEntry = entriesSnap.docs[0].data();
          if (winnerEntry.userId) {
            const { title, body } = T.challenge_winner({ theme: doc.data().theme || 'this week\'s challenge' });
            notifyUser(winnerEntry.userId, {
              type: 'challenge_winner', title, body,
              data: { type: 'challenge_winner', challengeId: doc.id, click_action: '/challenge/leaderboard' },
            }).catch((e) => console.warn('[winner notify]', e.message));
          }
        }
        batch.update(doc.ref, { isActive: false, winnerId, endedAt: FieldValue.serverTimestamp() });
      }

      const templateSnap = await fs.collection('challengeTemplates').get();
      const templates = templateSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      if (!templates.length) { console.error('[Challenge] No templates'); return; }

      const template = templates[(weekNumber - 1) % templates.length];
      const endTime = new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000);
      const newRef = fs.collection('challenges').doc();

      batch.set(newRef, {
        isActive: true,
        prompt: template.prompt, theme: template.theme, emoji: template.emoji || '🐾',
        weekNumber, year, entryCount: 0, winnerId: null,
        startTime: FieldValue.serverTimestamp(),
        endTime: endTime.toISOString(),
        createdAt: FieldValue.serverTimestamp(),
      });

      await batch.commit();
      console.log(`[Challenge] Activated week ${year}-W${weekNumber}: "${template.theme}"`);
    } catch (err) {
      console.error('[Challenge]', err);
    }
  });

exports.notifyNewChallenge = functions.firestore
  .document('challenges/{challengeId}')
  .onWrite(async (change, context) => {
    try {
      const before = change.before.exists ? change.before.data() : null;
      const after = change.after.exists ? change.after.data() : null;
      if (!after?.isActive || before?.isActive === true) return null;

      const { title, body } = T.new_challenge({ theme: after.theme || 'New Challenge', prompt: after.prompt || 'Show us your pet!' });

      await writeBroadcastNotification(`challenge_${context.params.challengeId}`, {
        type: 'new_challenge', title, body,
        data: { type: 'new_challenge', challengeId: context.params.challengeId, click_action: '/challenge' },
      });

      await admin.messaging().send({
        topic: 'new-challenges',
        notification: { title, body },
        webpush: {
          notification: { icon: '/favicon.png', badge: '/favicon.png', requireInteraction: false },
          fcm_options: { link: `${BASE_URL}/challenge` },
        },
        data: { type: 'new_challenge', challengeId: context.params.challengeId, click_action: '/challenge' },
      });
    } catch (err) {
      console.error('[notifyNewChallenge]', err);
    }
  });

exports.onChallengeEntryVoted = functions.firestore
  .document('challenges/{challengeId}/entries/{entryId}')
  .onWrite(async (change, context) => {
    try {
      const before = change.before.exists ? change.before.data() : null;
      const after = change.after.exists ? change.after.data() : null;
      if (!after || !before) return;
      if ((after.voteCount || 0) <= (before.voteCount || 0)) return;

      const challengeDoc = await getFirestore().doc(`challenges/${context.params.challengeId}`).get();
      const theme = challengeDoc.data()?.theme || 'the challenge';

      const { title, body } = T.challenge_vote({ theme, voteCount: after.voteCount || 1 });
      await notifyUser(after.userId, {
        type: 'challenge_vote', title, body,
        data: { type: 'challenge_vote', challengeId: context.params.challengeId, click_action: '/challenge/feed' },
      });
    } catch (err) {
      console.error('[onChallengeEntryVoted]', err);
    }
  });

exports.challengeEndingReminder = functions
  .runWith({ memory: '256MB' })
  .pubsub.schedule('30 3 * * *')
  .timeZone('UTC')
  .onRun(async () => {
    try {
      const fs = getFirestore();
      const now = new Date();
      const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const snap = await fs.collection('challenges').where('isActive', '==', true).get();
      for (const doc of snap.docs) {
        const data = doc.data();
        const endTime = data.endTime ? new Date(data.endTime) : null;
        if (!endTime || endTime < now || endTime > in24h) continue;

        const countSnap = await fs.collection('challenges').doc(doc.id).collection('entries').get();
        const entryCount = countSnap.size;

        const { title, body } = T.challenge_ending({ theme: data.theme || 'this week\'s challenge', entryCount });
        await admin.messaging().send({
          topic: 'new-challenges',
          notification: { title, body },
          webpush: {
            notification: { icon: '/favicon.png', badge: '/favicon.png' },
            fcm_options: { link: `${BASE_URL}/challenge/feed` },
          },
          data: { type: 'challenge_ending', challengeId: doc.id, click_action: '/challenge/feed' },
        });
        console.log(`[challengeEndingReminder] Sent for "${data.theme}"`);
      }
    } catch (err) {
      console.error('[challengeEndingReminder]', err);
    }
  });

// ============================================================================
// WEEKLY QUIZ — every Monday 09:00 IST
// ============================================================================

exports.activateWeeklyQuiz = functions
  .runWith({ memory: '256MB' })
  .pubsub.schedule('0 3 * * 1')
  .timeZone('Asia/Kolkata')
  .onRun(async () => {
    const fs = getFirestore();
    const now = new Date();
    const weekId = getWeekId(now);

    try {
      const activeSnap = await fs.collection('weeklyQuiz').where('isActive', '==', true).get();
      const batch = fs.batch();
      for (const d of activeSnap.docs) batch.update(d.ref, { isActive: false });

      const existing = await fs.collection('weeklyQuiz').doc(weekId).get();
      if (existing.exists && existing.data().isActive) { await batch.commit(); return; }

      const bankKey = `W${String(((getISOWeekNumber(now) - 1) % 8) + 1).padStart(2, '0')}`;
      const bankSnap = await fs.collection('quizBank').doc(bankKey).get();
      if (!bankSnap.exists) { await batch.commit(); return; }

      const bankData = bankSnap.data();
      batch.set(fs.collection('weeklyQuiz').doc(weekId), {
        ...bankData, weekId, isActive: true,
        publishedAt: FieldValue.serverTimestamp(),
        expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });

      await batch.commit();
      console.log(`[Quiz] Activated "${bankData.title}" for ${weekId}`);
    } catch (err) {
      console.error('[Quiz]', err);
    }
  });

exports.notifyNewQuiz = functions.firestore
  .document('weeklyQuiz/{quizId}')
  .onWrite(async (change, context) => {
    try {
      const before = change.before.exists ? change.before.data() : null;
      const after = change.after.exists ? change.after.data() : null;
      if (!after?.isActive || before?.isActive === true) return null;

      const { title, body } = T.new_quiz({ title: after.title || 'New Quiz', topic: after.topic || 'Pet Knowledge' });

      await writeBroadcastNotification(`quiz_${context.params.quizId}`, {
        type: 'new_quiz', title, body,
        data: { type: 'new_quiz', quizId: context.params.quizId, click_action: '/quiz' },
      });

      await admin.messaging().send({
        topic: 'new-quizzes',
        notification: { title, body },
        webpush: {
          notification: { icon: '/favicon.png', badge: '/favicon.png' },
          fcm_options: { link: `${BASE_URL}/quiz` },
        },
        data: { type: 'new_quiz', quizId: context.params.quizId, click_action: '/quiz' },
      });
    } catch (err) {
      console.error('[notifyNewQuiz]', err);
    }
  });

// ============================================================================
// DAILY HEALTH REMINDERS — push + email, 09:00 IST daily
// ============================================================================

const EMAILJS_SERVICE_ID = 'service_zdt4u0q';
const EMAILJS_TEMPLATE_ID = 'template_pe8gs6o';
const EMAILJS_USER_ID = '9Ic6G_vwTk3Wl8Szu';
const EMAILJS_API_URL = 'https://api.emailjs.com/api/v1.0/email/send';

const ES = {
  container: 'font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9fafb;',
  header:    'background:linear-gradient(135deg,#7c3aed,#5b21b6);color:white;padding:30px;text-align:center;',
  content:   'background:white;padding:30px;border-radius:10px;margin:20px;',
  button:    'display:inline-block;background:linear-gradient(135deg,#7c3aed,#5b21b6);color:white;padding:12px 30px;text-decoration:none;border-radius:8px;font-weight:bold;margin:20px 0;',
  footer:    'text-align:center;padding:20px;color:#6b7280;font-size:12px;',
  highlight: 'background:#f3e8ff;padding:15px;border-radius:8px;margin:15px 0;border-left:4px solid #7c3aed;',
  petInfo:   'background:#fef3c7;padding:15px;border-radius:8px;margin:15px 0;border-left:4px solid #f59e0b;',
};

async function sendEmail(to_email, to_name, subject, html) {
  try {
    const fetch = (await import('node-fetch')).default;
    const res = await fetch(EMAILJS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ service_id: EMAILJS_SERVICE_ID, template_id: EMAILJS_TEMPLATE_ID, user_id: EMAILJS_USER_ID, template_params: { to_email, to_name, from_name: 'Pawppy', subject, message: html } }),
    });
    if (!res.ok) console.error('[Email] Failed:', await res.text());
    return { success: res.ok };
  } catch (err) {
    console.error('[Email]', err); return { success: false };
  }
}

exports.dailyHealthNotifications = functions
  .runWith({ memory: '512MB', timeoutSeconds: 540 })
  .pubsub.schedule('30 3 * * *')
  .timeZone('UTC')
  .onRun(async () => {
    const db = admin.database();
    const usersSnap = await db.ref('users').once('value');
    if (!usersSnap.exists()) return null;

    const users = usersSnap.val();
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const d1 = new Date(today); d1.setDate(d1.getDate() + 1);
    const d3 = new Date(today); d3.setDate(d3.getDate() + 3);
    const d7 = new Date(today); d7.setDate(d7.getDate() + 7);
    const sameDay = (a, b) => a.toISOString().slice(0, 10) === b.toISOString().slice(0, 10);

    let sent = 0;

    for (const [userId, userData] of Object.entries(users)) {
      if (!userData.pets) continue;

      for (const [petId, petData] of Object.entries(userData.pets)) {
        const petName = petData.name || 'your pet';

        // Vaccinations
        for (const vac of Object.values(petData.vaccinations || {})) {
          if (!vac.nextDue) continue;
          const due = new Date(vac.nextDue);
          const dueStr = fmtDate(due);

          if (sameDay(due, d7)) {
            const { title, body } = T.vacc_7d({ petName, vaccineName: vac.name, dueDate: dueStr });
            await notifyUser(userId, { type: 'vacc_7d', title, body, data: { petId, click_action: '/profile?tab=pets' } });
            if (userData.email) {
              await sendEmail(userData.email, userData.displayName || 'Pet Parent',
                `💉 Vaccination Reminder: ${vac.name} due for ${petName}`,
                `<div style="${ES.container}"><div style="${ES.header}"><h1 style="margin:0">💉 Vaccination Reminder</h1></div><div style="${ES.content}"><h2 style="color:#7c3aed">Hi ${userData.displayName || 'there'}! 👋</h2><p><strong>${petName}</strong>'s ${vac.name} is due on ${dueStr}.</p><div style="${ES.petInfo}"><strong>Pet:</strong> ${petName} (${petData.breed || 'Mixed'})</div><div style="${ES.highlight}"><strong>Due Date:</strong> ${dueStr}</div><div style="text-align:center"><a href="${BASE_URL}/profile?tab=pets" style="${ES.button}">View Pet Profile →</a></div></div><div style="${ES.footer}">Pawppy — Never miss important pet care dates</div></div>`);
              sent++;
            }
          } else if (sameDay(due, d1)) {
            const { title, body } = T.vacc_1d({ petName, vaccineName: vac.name, dueDate: dueStr });
            await notifyUser(userId, { type: 'vacc_1d', title, body, data: { petId, click_action: '/profile?tab=pets' } });
          } else if (due < today) {
            const key = `vacc_overdue_${petId}_${(vac.name || '').replace(/\s/g, '_')}_${today.toISOString().slice(0, 10)}`;
            const already = await db.ref(`notificationsSent/${userId}/${key}`).once('value');
            if (!already.exists()) {
              const { title, body } = T.vacc_overdue({ petName, vaccineName: vac.name, dueDate: dueStr });
              await notifyUser(userId, { type: 'vacc_overdue', title, body, data: { petId, click_action: '/profile?tab=pets' } });
              await db.ref(`notificationsSent/${userId}/${key}`).set({ sentAt: Date.now(), type: 'vacc_overdue', petId });
            }
          }
        }

        // Birthdays
        if (petData.dateOfBirth) {
          const birth = new Date(petData.dateOfBirth);
          const bday = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
          const age = today.getFullYear() - birth.getFullYear();

          if (sameDay(bday, today)) {
            const { title, body } = T.birthday_today({ petName, age });
            await notifyUser(userId, { type: 'birthday_today', title, body, data: { petId, click_action: '/profile?tab=pets' } });
          } else if (sameDay(bday, d1)) {
            const { title, body } = T.birthday_tomorrow({ petName, age });
            await notifyUser(userId, { type: 'birthday_tomorrow', title, body, data: { petId, click_action: '/profile?tab=pets' } });
          } else if (sameDay(bday, d3)) {
            const { title, body } = T.birthday_3d({ petName, age });
            await notifyUser(userId, { type: 'birthday_3d', title, body, data: { petId, click_action: '/profile?tab=pets' } });
            if (userData.email) {
              await sendEmail(userData.email, userData.displayName || 'Pet Parent',
                `🎂 Birthday Reminder: ${petName} turns ${age} in 3 days!`,
                `<div style="${ES.container}"><div style="${ES.header}"><h1 style="margin:0">🎂 Birthday in 3 Days!</h1></div><div style="${ES.content}"><h2 style="color:#7c3aed">Hi ${userData.displayName || 'there'}! 👋</h2><div style="${ES.petInfo}"><strong>${petName}</strong> is turning ${age}! 🎉</div><p>Plan something special — extra treats, a new toy, or a birthday photoshoot!</p><div style="text-align:center"><a href="${BASE_URL}/profile?tab=pets" style="${ES.button}">View ${petName}'s Profile →</a></div></div><div style="${ES.footer}">Pawppy — Your pet's lifelong companion app</div></div>`);
              sent++;
            }
          }
        }

        // Health checkup
        const sixMonthsAgo = new Date(today); sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const lastCheckup = petData.lastCheckup ? new Date(petData.lastCheckup) : null;
        if (!lastCheckup || lastCheckup < sixMonthsAgo) {
          const key = `healthCheckup_${petId}_${today.toISOString().slice(0, 10)}`;
          const already = await db.ref(`notificationsSent/${userId}/${key}`).once('value');
          if (!already.exists()) {
            const { title, body } = T.health_checkup({ petName });
            await notifyUser(userId, { type: 'health_checkup', title, body, data: { petId, click_action: '/profile?tab=pets' } });
            if (userData.email) {
              await sendEmail(userData.email, userData.displayName || 'Pet Parent',
                `🏥 Health Checkup Overdue for ${petName}`,
                `<div style="${ES.container}"><div style="${ES.header}"><h1 style="margin:0">🏥 Vet Visit Overdue</h1></div><div style="${ES.content}"><h2 style="color:#7c3aed">Hi ${userData.displayName || 'there'}! 👋</h2><div style="${ES.highlight}"><strong>${petName}</strong> hasn't had a checkup in 6+ months. Regular visits catch problems early! 🐾</div><div style="text-align:center"><a href="${BASE_URL}/profile?tab=pets" style="${ES.button}">Update Health Records →</a></div></div><div style="${ES.footer}">Pawppy — Your pet's health companion</div></div>`);
              sent++;
            }
            await db.ref(`notificationsSent/${userId}/${key}`).set({ sentAt: Date.now(), type: 'healthCheckup', petId });
          }
        }
      }
    }

    console.log(`[dailyHealthNotifications] Done. Emails sent: ${sent}`);
    return { success: true, sent };
  });

// ============================================================================
// WEEKLY DIGEST — every Monday 09:00 IST
// ============================================================================

exports.weeklyDigestNotifications = functions
  .runWith({ memory: '512MB', timeoutSeconds: 540 })
  .pubsub.schedule('30 3 * * 1')
  .timeZone('UTC')
  .onRun(async () => {
    const db = admin.database();
    const usersSnap = await db.ref('users').once('value');
    if (!usersSnap.exists()) return null;

    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    let sent = 0;

    for (const [userId, userData] of Object.entries(usersSnap.val())) {
      if (!userData.email) continue;
      try {
        const [reqSnap, petsSnap] = await Promise.all([
          db.ref(`matingRequests/received/${userId}`).orderByChild('timestamp').startAt(oneWeekAgo).once('value'),
          db.ref(`users/${userId}/pets`).once('value'),
        ]);

        const newRequests = reqSnap.exists() ? Object.keys(reqSnap.val() || {}).length : 0;

        const reminders = [];
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const in7d = new Date(today); in7d.setDate(in7d.getDate() + 7);

        for (const petData of Object.values(petsSnap.val() || {})) {
          for (const vac of Object.values(petData.vaccinations || {})) {
            if (!vac.nextDue) continue;
            const due = new Date(vac.nextDue);
            if (due >= today && due <= in7d)
              reminders.push(`💉 <strong>${petData.name}</strong> — ${vac.name} due ${fmtDate(due)}`);
          }
          if (petData.dateOfBirth) {
            const birth = new Date(petData.dateOfBirth);
            const bday = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
            if (bday >= today && bday <= in7d)
              reminders.push(`🎂 <strong>${petData.name}</strong> — Birthday on ${fmtDate(bday)}`);
          }
        }

        if (newRequests === 0 && reminders.length === 0) continue;

        const remindersHtml = reminders.map((r) => `<li style="margin:5px 0">${r}</li>`).join('');
        await sendEmail(userData.email, userData.displayName || 'Pet Parent', '🐾 Your Weekly Pawppy Digest',
          `<div style="${ES.container}"><div style="${ES.header}"><h1 style="margin:0">🐾 Weekly Digest</h1></div><div style="${ES.content}"><h2 style="color:#7c3aed">Hi ${userData.displayName || 'there'}! 👋</h2>${newRequests > 0 ? `<div style="${ES.petInfo}">💕 <strong>${newRequests} new mating request${newRequests > 1 ? 's' : ''}</strong> this week</div>` : ''}${remindersHtml ? `<div style="${ES.highlight}"><h3 style="margin-top:0;color:#7c3aed">📅 This Week's Reminders</h3><ul style="padding-left:20px">${remindersHtml}</ul></div>` : ''}<div style="text-align:center"><a href="${BASE_URL}" style="${ES.button}">Open Pawppy →</a></div></div><div style="${ES.footer}">Pawppy — India's #1 Pet Community App</div></div>`);
        sent++;
      } catch (err) {
        console.warn(`[weeklyDigest] Failed for ${userId}:`, err.message);
      }
    }

    console.log(`[weeklyDigestNotifications] Sent ${sent} digests`);
    return { success: true, sent };
  });

// ============================================================================
// COMMERCE — shared helpers
// ============================================================================

const { Timestamp: FSTimestamp } = require('firebase-admin/firestore');

function money(value) { return Math.round(Number(value || 0) * 100) / 100; }

function slugify(value = '') {
  return value.toLowerCase().trim()
    .replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 72);
}

function storeSlugify(value = '') {
  return value.toLowerCase().trim()
    .replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 48);
}

function normalizeSku(value = '') { return value.trim().toUpperCase().replace(/\s+/g, '-').slice(0, 64); }
function skuClaimId(vendorId, sku) { return Buffer.from(`${vendorId}:${normalizeSku(sku)}`).toString('base64url'); }
function toNumber(value, fallback = 0) { const n = Number(value); return Number.isFinite(n) ? n : fallback; }

function tokenize(...values) {
  const tokens = new Set();
  values.filter(Boolean).join(' ').toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length >= 2).forEach((t) => tokens.add(t));
  return Array.from(tokens).slice(0, 80);
}

function imageUrl(value = '') {
  const url = String(value || '').trim();
  return /^https?:\/\//i.test(url) || /^data:image\//i.test(url) ? url : '';
}

function cleanAddress(address = {}) {
  const required = ['name', 'phone', 'line1', 'city', 'state', 'pincode'];
  for (const key of required) {
    if (!String(address[key] || '').trim())
      throw new functions.https.HttpsError('invalid-argument', `Shipping ${key} is required.`);
  }
  return {
    name: String(address.name || '').trim(), phone: String(address.phone || '').trim(),
    line1: String(address.line1 || '').trim(), line2: String(address.line2 || '').trim(),
    city: String(address.city || '').trim(), state: String(address.state || '').trim(),
    pincode: String(address.pincode || '').trim(), country: 'India',
  };
}

function toFirestoreError(statusCode, message) {
  const codeMap = { 400: 'invalid-argument', 401: 'unauthenticated', 403: 'permission-denied', 404: 'not-found', 409: 'already-exists' };
  return new functions.https.HttpsError(codeMap[statusCode] || 'internal', message);
}

function sanitizeProduct(input, vendor, productId) {
  const title = String(input.title || '').trim();
  if (title.length < 3) throw toFirestoreError(400, 'Product title is required (min 3 chars).');
  const sku = normalizeSku(input.sku || title);
  if (!sku) throw toFirestoreError(400, 'SKU is required.');
  const price = toNumber(input.price);
  if (price < 0) throw toFirestoreError(400, 'Price cannot be negative.');
  const PRODUCT_STATUSES = ['draft', 'active', 'out_of_stock', 'archived'];
  const PET_TYPES = ['dog', 'cat', 'bird', 'fish', 'small_pet', 'all'];
  const status = PRODUCT_STATUSES.includes(input.status) ? input.status : 'draft';
  const category = String(input.category || 'Accessories').trim();
  const subcategory = String(input.subcategory || '').trim();
  const description = String(input.description || '').trim();
  const tags = Array.isArray(input.tags) ? input.tags.map((t) => String(t).trim()).filter(Boolean).slice(0, 20) : [];
  const petType = Array.isArray(input.petType) ? input.petType.filter((t) => PET_TYPES.includes(t)).slice(0, 8) : ['all'];
  const baseSlug = slugify(input.slug || title);
  if (!baseSlug) throw toFirestoreError(400, 'Product URL slug could not be generated.');
  const images = Array.isArray(input.images)
    ? input.images.map((img, i) => ({ url: String(img.url || '').trim(), alt: String(img.alt || title).trim(), position: toNumber(img.position, i) }))
        .filter((img) => /^https?:\/\//i.test(img.url) || /^data:image\//i.test(img.url)).slice(0, 8)
    : [];
  const quantity = Math.max(0, Math.floor(toNumber(input.inventory?.quantity, input.quantity || 0)));
  const trackInventory = input.inventory?.trackInventory !== false;
  const effectiveStatus = status === 'active' && trackInventory && quantity <= 0 ? 'out_of_stock' : status;
  return {
    vendorId: vendor.id, vendorName: vendor.businessName || vendor.legalName || 'Pawppy Vendor',
    vendorStoreSlug: vendor.store?.slug || '', title, slug: baseSlug, description, sku,
    category, subcategory, tags, petType: petType.length ? petType : ['all'],
    price, compareAtPrice: toNumber(input.compareAtPrice), currency: 'INR',
    taxRatePct: toNumber(input.taxRatePct, 0), hsnCode: String(input.hsnCode || '').trim().slice(0, 8),
    inventory: { quantity, trackInventory, allowBackorder: Boolean(input.inventory?.allowBackorder), lowStockThreshold: Math.max(0, Math.floor(toNumber(input.inventory?.lowStockThreshold, 5))) },
    variants: Array.isArray(input.variants)
      ? input.variants.map((v, i) => ({ id: String(v.id || `variant-${i + 1}`).trim(), name: String(v.name || '').trim(), options: Array.isArray(v.options) ? v.options.map((o) => String(o).trim()).filter(Boolean).slice(0, 20) : [], sku: normalizeSku(v.sku || `${sku}-${i + 1}`), price: toNumber(v.price, price), quantity: Math.max(0, Math.floor(toNumber(v.quantity, quantity))), image: String(v.image || '').trim() })).filter((v) => v.name).slice(0, 30)
      : [],
    images, status: effectiveStatus,
    seo: { metaTitle: String(input.seo?.metaTitle || title).trim().slice(0, 70), metaDescription: String(input.seo?.metaDescription || description).trim().slice(0, 160), keywords: Array.isArray(input.seo?.keywords) ? input.seo.keywords.map((k) => String(k).trim()).filter(Boolean).slice(0, 12) : tags, ogImage: String(input.seo?.ogImage || images[0]?.url || '').trim(), canonicalUrl: String(input.seo?.canonicalUrl || `${BASE_URL}/products/${baseSlug}`).trim() },
    shipping: { weightGrams: Math.max(0, Math.floor(toNumber(input.shipping?.weightGrams))), dimensionsCm: { l: Math.max(0, toNumber(input.shipping?.dimensionsCm?.l)), w: Math.max(0, toNumber(input.shipping?.dimensionsCm?.w)), h: Math.max(0, toNumber(input.shipping?.dimensionsCm?.h)) } },
    searchKeywords: tokenize(title, description, category, subcategory, tags.join(' '), sku, vendor.businessName),
    updatedAt: FieldValue.serverTimestamp(),
    ...(productId ? {} : { createdAt: FieldValue.serverTimestamp() }),
  };
}

async function reserveUniqueSlug(transaction, db, requestedSlug, productId, existingSlug) {
  if (existingSlug === requestedSlug) return requestedSlug;
  for (let suffix = 0; suffix < 50; suffix += 1) {
    const candidate = suffix === 0 ? requestedSlug : `${requestedSlug}-${suffix + 1}`;
    const slugRef = db.doc(`productSlugs/${candidate}`);
    const slugSnap = await transaction.get(slugRef);
    if (!slugSnap.exists || slugSnap.data()?.productId === productId) {
      transaction.set(slugRef, { productId, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      if (existingSlug && existingSlug !== candidate) transaction.delete(db.doc(`productSlugs/${existingSlug}`));
      return candidate;
    }
  }
  throw toFirestoreError(409, 'Could not create a unique product URL. Try a more specific title.');
}

async function restockOrderItems(transaction, db, order) {
  for (const item of (order.items || [])) {
    const productRef = db.doc(`products/${item.productId}`);
    const productSnap = await transaction.get(productRef);
    if (!productSnap.exists) continue;
    const product = productSnap.data();
    if (!product.inventory?.trackInventory) continue;
    if (item.variantId) {
      const variants = (product.variants || []).map((v) =>
        v.id === item.variantId ? { ...v, quantity: Math.max(0, (Number(v.quantity) || 0) + item.quantity) } : v);
      transaction.update(productRef, { variants, updatedAt: FieldValue.serverTimestamp() });
    } else {
      transaction.update(productRef, { 'inventory.quantity': FieldValue.increment(item.quantity), updatedAt: FieldValue.serverTimestamp() });
    }
  }
}

function resolveShippingFee(shippingSettings, vendorSubtotal, customerState) {
  const zones = Array.isArray(shippingSettings?.shippingZones) ? shippingSettings.shippingZones : [];
  const normalizedState = (customerState || '').toLowerCase().trim();
  const matchedZone = zones.find((z) => Array.isArray(z.states) && z.states.some((s) => s.toLowerCase().trim() === normalizedState));
  const settings = matchedZone || shippingSettings || {};
  const freeOver = Number(settings.freeShippingOver ?? 999);
  const flatFee = Number(settings.flatFee ?? 49);
  return vendorSubtotal >= freeOver ? 0 : flatFee;
}

function calcGstBreakdown(lineTotal, taxRatePct, vendorState, customerState) {
  const rate = Number(taxRatePct || 0);
  const taxAmount = money(lineTotal * (rate / 100));
  const isIntraState = vendorState && customerState && vendorState.toLowerCase().trim() === customerState.toLowerCase().trim();
  if (isIntraState) { const half = money(taxAmount / 2); return { cgst: half, sgst: half, igst: 0, total: money(half + half) }; }
  return { cgst: 0, sgst: 0, igst: taxAmount, total: taxAmount };
}

async function nextOrderNumber(transaction, db) {
  const year = new Date().getFullYear();
  const counterRef = db.doc(`commerceCounters/orders-${year}`);
  const counterSnap = await transaction.get(counterRef);
  const next = (counterSnap.exists ? Number(counterSnap.data().last || 0) : 0) + 1;
  transaction.set(counterRef, { last: next, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  return `PW-${year}-${String(next).padStart(6, '0')}`;
}

function assertVendor(context) {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Sign in to continue.');
  if (!context.auth.token.vendorId) throw new functions.https.HttpsError('permission-denied', 'Vendor role is required.');
  return context.auth;
}

// ============================================================================
// COMMERCE — onCall functions (replaces all netlify/functions/commerce-*.js)
// ============================================================================

exports.commerceRequestVendorRole = functions.https.onCall(async (data, context) => {
  assertAuthed(context);
  const uid = context.auth.uid;
  const userRecord = await admin.auth().getUser(uid);
  const db = getFirestore();
  const userRef = db.doc(`users/${uid}`);
  const existingUser = await userRef.get();
  const existingVendorId = existingUser.data()?.vendorId || context.auth.token.vendorId;
  if (existingVendorId) return { vendorId: existingVendorId, status: 'existing' };

  const vendorRef = db.collection('vendors').doc();
  const vendorId = vendorRef.id;

  await db.runTransaction(async (tx) => {
    tx.set(vendorRef, {
      ownerUid: uid, businessName: '', legalName: '', ownerName: userRecord.displayName || '',
      email: userRecord.email || '', phone: userRecord.phoneNumber || '', gstin: '', pan: '',
      address: { line1: '', line2: '', city: '', state: '', pincode: '', country: 'India' },
      categories: [], description: '', logoUrl: '', bannerUrl: '', website: '', socials: {},
      documents: [], status: 'pending',
      statusHistory: [{ from: null, to: 'pending', note: 'Vendor registration started.', changedBy: uid, changedAt: FSTimestamp.now() }],
      bankDetails: { accountName: '', accountNumber: '', ifsc: '' },
      productCount: 0, orderCount: 0, rating: 0, approvedAt: null, approvedBy: null,
      createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
    });
    tx.set(userRef, {
      role: 'vendor', displayName: userRecord.displayName || userRecord.email?.split('@')[0] || '',
      email: userRecord.email || '', phone: userRecord.phoneNumber || '', photoURL: userRecord.photoURL || '',
      vendorId, createdAt: existingUser.exists ? existingUser.data().createdAt : FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
  });

  await admin.auth().setCustomUserClaims(uid, { ...(userRecord.customClaims || {}), role: 'vendor', vendorId });
  return { vendorId, status: 'created' };
});

exports.commerceProvisionAdmin = functions.https.onCall(async (data, context) => {
  assertAuthed(context);
  const email = (context.auth.token.email || '').toLowerCase();
  if (email !== COMMERCE_ADMIN_EMAIL) throw new functions.https.HttpsError('permission-denied', 'Only the configured Pawppy admin can provision admin access.');
  const uid = context.auth.uid;
  const userRecord = await admin.auth().getUser(uid);
  const db = getFirestore();
  await admin.auth().setCustomUserClaims(uid, { ...(userRecord.customClaims || {}), role: 'admin', admin: true });
  await db.doc(`users/${uid}`).set({
    role: 'admin', displayName: userRecord.displayName || userRecord.email?.split('@')[0] || '',
    email: userRecord.email || '', phone: userRecord.phoneNumber || '', photoURL: userRecord.photoURL || '',
    createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
  return { success: true, role: 'admin' };
});

exports.commerceSetVendorStatus = functions.https.onCall(async (data, context) => {
  assertAdmin(context);
  const { vendorId, status, note = '' } = data || {};
  const ALLOWED = ['pending', 'documentation_required', 'under_review', 'approved', 'rejected', 'suspended'];
  if (!vendorId || !ALLOWED.includes(status)) throw new functions.https.HttpsError('invalid-argument', 'Valid vendorId and status required.');
  const db = getFirestore();
  const vendorRef = db.doc(`vendors/${vendorId}`);
  const vendorSnap = await vendorRef.get();
  if (!vendorSnap.exists) throw new functions.https.HttpsError('not-found', 'Vendor not found.');
  const vendor = vendorSnap.data();
  const historyItem = { from: vendor.status || null, to: status, note, changedBy: context.auth.uid, changedAt: FSTimestamp.now() };
  await vendorRef.update({
    status, reviewNote: note, statusHistory: FieldValue.arrayUnion(historyItem),
    ...(status === 'approved' ? { approvedAt: FieldValue.serverTimestamp(), approvedBy: context.auth.uid } : {}),
    updatedAt: FieldValue.serverTimestamp(),
  });
  if (vendor.ownerUid) {
    await writeUserNotification(vendor.ownerUid, {
      type: 'vendor_status', title: `Vendor ${status.replace(/_/g, ' ')}`,
      body: note || `Your Pawppy vendor status is now ${status.replace(/_/g, ' ')}.`,
      data: { type: 'vendor_status', vendorId, status, click_action: '/vendor/status' },
    });
  }
  return { success: true, vendorId, status };
});

exports.commerceSaveProduct = functions.runWith({ memory: '256MB' }).https.onCall(async (data, context) => {
  const auth = assertVendor(context);
  const db = getFirestore();
  const { productId: requestedProductId = '', product: productInput = {} } = data || {};
  const vendorId = auth.token.vendorId;
  const vendorRef = db.doc(`vendors/${vendorId}`);
  const vendorSnap = await vendorRef.get();
  const vendor = vendorSnap.exists ? { id: vendorSnap.id, ...vendorSnap.data() } : null;
  if (!vendor || vendor.ownerUid !== auth.uid) throw new functions.https.HttpsError('not-found', 'Vendor profile not found.');
  if (vendor.status !== 'approved') throw new functions.https.HttpsError('permission-denied', 'Your vendor profile must be approved before managing products.');

  const productRef = requestedProductId ? db.doc(`products/${requestedProductId}`) : db.collection('products').doc();
  const productId = productRef.id;
  const sanitized = sanitizeProduct(productInput, vendor, requestedProductId);

  await db.runTransaction(async (tx) => {
    const existingSnap = await tx.get(productRef);
    const existing = existingSnap.exists ? existingSnap.data() : null;
    if (existing && existing.vendorId !== vendorId) throw new functions.https.HttpsError('permission-denied', 'You can only edit your own products.');
    const skuRef = db.doc(`productSkuClaims/${skuClaimId(vendorId, sanitized.sku)}`);
    const skuSnap = await tx.get(skuRef);
    if (skuSnap.exists && skuSnap.data()?.productId !== productId) throw new functions.https.HttpsError('already-exists', 'That SKU is already used by another product.');
    if (existing?.sku && normalizeSku(existing.sku) !== sanitized.sku) tx.delete(db.doc(`productSkuClaims/${skuClaimId(vendorId, existing.sku)}`));
    const finalSlug = await reserveUniqueSlug(tx, db, sanitized.slug, productId, existing?.slug);
    tx.set(skuRef, { vendorId, sku: sanitized.sku, productId, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    tx.set(productRef, { ...sanitized, slug: finalSlug, seo: { ...sanitized.seo, canonicalUrl: `${BASE_URL}/products/${finalSlug}` } }, { merge: true });
    if (!existingSnap.exists) tx.update(vendorRef, { productCount: FieldValue.increment(1), updatedAt: FieldValue.serverTimestamp() });
  });

  const saved = await productRef.get();
  return { productId, product: { id: productId, ...saved.data() } };
});

exports.commerceSaveStore = functions.https.onCall(async (data, context) => {
  const auth = assertVendor(context);
  const db = getFirestore();
  const vendorId = auth.token.vendorId;
  const vendorRef = db.doc(`vendors/${vendorId}`);
  const vendorSnap = await vendorRef.get();
  if (!vendorSnap.exists) throw new functions.https.HttpsError('not-found', 'Vendor profile not found.');
  const vendor = vendorSnap.data();
  if (vendor.ownerUid !== auth.uid) throw new functions.https.HttpsError('permission-denied', 'You can only edit your own store.');
  if (vendor.status !== 'approved') throw new functions.https.HttpsError('permission-denied', 'Your vendor profile must be approved before publishing a store.');

  const { store = {} } = data || {};
  const requestedSlug = storeSlugify(store.slug || store.storeName || vendor.businessName);
  if (!requestedSlug) throw new functions.https.HttpsError('invalid-argument', 'Store URL is required.');

  const payload = {
    store: {
      slug: requestedSlug, storeName: String(store.storeName || vendor.businessName || '').trim(),
      tagline: String(store.tagline || '').trim().slice(0, 120), description: String(store.description || vendor.description || '').trim(),
      logoUrl: imageUrl(store.logoUrl), bannerUrl: imageUrl(store.bannerUrl),
      supportEmail: String(store.supportEmail || vendor.email || '').trim(), supportPhone: String(store.supportPhone || vendor.phone || '').trim(),
      policies: { shipping: String(store.policies?.shipping || '').trim(), returns: String(store.policies?.returns || '').trim(), support: String(store.policies?.support || '').trim() },
      shippingSettings: {
        flatFee: Math.max(0, Number(store.shippingSettings?.flatFee ?? 49)), freeShippingOver: Math.max(0, Number(store.shippingSettings?.freeShippingOver ?? 999)),
        deliveryEstimate: String(store.shippingSettings?.deliveryEstimate || '2-5 business days').trim(),
        servicePincodes: Array.isArray(store.shippingSettings?.servicePincodes) ? store.shippingSettings.servicePincodes.map((p) => String(p).trim()).filter(Boolean).slice(0, 200) : [],
      },
      updatedAt: FieldValue.serverTimestamp(),
    },
    updatedAt: FieldValue.serverTimestamp(),
  };

  await db.runTransaction(async (tx) => {
    const slugRef = db.doc(`vendorStoreSlugs/${requestedSlug}`);
    const slugSnap = await tx.get(slugRef);
    if (slugSnap.exists && slugSnap.data()?.vendorId !== vendorId) throw new functions.https.HttpsError('already-exists', 'That store URL is already taken.');
    const existingSlug = vendor.store?.slug;
    if (existingSlug && existingSlug !== requestedSlug) tx.delete(db.doc(`vendorStoreSlugs/${existingSlug}`));
    tx.set(slugRef, { vendorId, ownerUid: auth.uid, storeName: payload.store.storeName, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    tx.set(vendorRef, payload, { merge: true });
  });

  return { success: true, vendorId, store: payload.store };
});

exports.commerceSaveReview = functions.https.onCall(async (data, context) => {
  assertAuthed(context);
  const { productId, orderId, rating, title = '', body: reviewBody = '' } = data || {};
  if (!productId) throw new functions.https.HttpsError('invalid-argument', 'productId is required.');
  if (!orderId) throw new functions.https.HttpsError('invalid-argument', 'orderId is required.');
  const ratingNum = Math.round(Number(rating));
  if (!ratingNum || ratingNum < 1 || ratingNum > 5) throw new functions.https.HttpsError('invalid-argument', 'Rating must be between 1 and 5.');

  const db = getFirestore();
  const orderSnap = await db.doc(`orders/${orderId}`).get();
  if (!orderSnap.exists) throw new functions.https.HttpsError('not-found', 'Order not found.');
  const order = orderSnap.data();
  if (order.userId !== context.auth.uid) throw new functions.https.HttpsError('permission-denied', 'You can only review products from your own orders.');
  if (order.fulfillmentStatus !== 'delivered') throw new functions.https.HttpsError('failed-precondition', 'You can only review products from delivered orders.');
  if (!(order.items || []).some((item) => item.productId === productId)) throw new functions.https.HttpsError('failed-precondition', 'This product is not in the specified order.');

  const existingSnap = await db.collection('reviews').where('productId', '==', productId).where('userId', '==', context.auth.uid).limit(1).get();
  if (!existingSnap.empty) throw new functions.https.HttpsError('already-exists', 'You have already reviewed this product.');

  let userRecord = null;
  try { userRecord = await admin.auth().getUser(context.auth.uid); } catch (_) {}
  const reviewRef = db.collection('reviews').doc();
  const productRef = db.doc(`products/${productId}`);

  await db.runTransaction(async (tx) => {
    const productSnap = await tx.get(productRef);
    if (!productSnap.exists) throw new functions.https.HttpsError('not-found', 'Product not found.');
    const product = productSnap.data();
    const currentCount = Number(product.reviewCount || 0);
    const newCount = currentCount + 1;
    const newAvg = Math.round(((Number(product.avgRating || 0) * currentCount + ratingNum) / newCount) * 10) / 10;
    tx.set(reviewRef, {
      productId, orderId, userId: context.auth.uid, userName: userRecord?.displayName || context.auth.token.name || 'Pawppy user',
      userPhoto: userRecord?.photoURL || '', rating: ratingNum, title: String(title).trim().slice(0, 120),
      body: String(reviewBody).trim().slice(0, 1000), status: 'published', createdAt: FieldValue.serverTimestamp(),
    });
    tx.update(productRef, { reviewCount: newCount, avgRating: newAvg, updatedAt: FieldValue.serverTimestamp() });
  });

  return { reviewId: reviewRef.id, success: true };
});

exports.commerceManageCoupon = functions.https.onCall(async (data, context) => {
  assertAdmin(context);
  const { action, coupon } = data || {};
  if (!action) throw new functions.https.HttpsError('invalid-argument', 'action is required.');
  const db = getFirestore();

  if (action === 'create') {
    const code = String(coupon?.code || '').trim().toUpperCase();
    if (!code) throw new functions.https.HttpsError('invalid-argument', 'Coupon code is required.');
    if (!['percent', 'fixed'].includes(coupon?.type)) throw new functions.https.HttpsError('invalid-argument', 'type must be percent or fixed.');
    if (!Number(coupon?.value) || Number(coupon?.value) <= 0) throw new functions.https.HttpsError('invalid-argument', 'value must be positive.');
    const couponRef = db.doc(`coupons/${code}`);
    if ((await couponRef.get()).exists) throw new functions.https.HttpsError('already-exists', 'A coupon with this code already exists.');
    const doc = {
      code, type: coupon.type, value: Number(coupon.value), minOrderAmount: Number(coupon.minOrderAmount || 0),
      maxDiscountAmount: Number(coupon.maxDiscountAmount || 0), maxUses: Number(coupon.maxUses || 0), usedCount: 0,
      description: String(coupon.description || '').trim(), vendorId: coupon.vendorId || null, active: true,
      expiresAt: coupon.expiresAt ? FSTimestamp.fromDate(new Date(coupon.expiresAt)) : null,
      createdBy: context.auth.uid, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
    };
    await couponRef.set(doc);
    return { code, coupon: doc };
  }
  if (['deactivate', 'activate', 'delete'].includes(action)) {
    const code = String(coupon?.code || '').trim().toUpperCase();
    if (!code) throw new functions.https.HttpsError('invalid-argument', 'code is required.');
    if (action === 'delete') { await db.doc(`coupons/${code}`).delete(); return { code, deleted: true }; }
    await db.doc(`coupons/${code}`).update({ active: action === 'activate', updatedAt: FieldValue.serverTimestamp() });
    return { code, active: action === 'activate' };
  }
  throw new functions.https.HttpsError('invalid-argument', `Unknown action: ${action}`);
});

exports.commerceValidateCoupon = functions.https.onCall(async (data, context) => {
  assertAuthed(context);
  const { code, cartSubtotal = 0 } = data || {};
  if (!code || !String(code).trim()) throw new functions.https.HttpsError('invalid-argument', 'Coupon code is required.');
  const db = getFirestore();
  const normalizedCode = String(code).trim().toUpperCase();
  const couponSnap = await db.doc(`coupons/${normalizedCode}`).get();
  if (!couponSnap.exists) throw new functions.https.HttpsError('not-found', 'Coupon code not found.');
  const coupon = couponSnap.data();
  if (!coupon.active) throw new functions.https.HttpsError('failed-precondition', 'This coupon is no longer active.');
  if (coupon.expiresAt && coupon.expiresAt.toMillis() < Date.now()) throw new functions.https.HttpsError('failed-precondition', 'This coupon has expired.');
  if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) throw new functions.https.HttpsError('failed-precondition', 'This coupon has reached its usage limit.');
  const minOrder = Number(coupon.minOrderAmount || 0);
  if (cartSubtotal < minOrder) throw new functions.https.HttpsError('failed-precondition', `Minimum order of ₹${minOrder} required for this coupon.`);
  let discount = 0;
  if (coupon.type === 'percent') {
    discount = money(cartSubtotal * (Number(coupon.value) / 100));
    if (coupon.maxDiscountAmount > 0) discount = Math.min(discount, Number(coupon.maxDiscountAmount));
  } else {
    discount = Math.min(money(coupon.value), cartSubtotal);
  }
  return { valid: true, code: normalizedCode, discount, type: coupon.type, value: coupon.value, description: coupon.description || '' };
});

exports.commercePlaceCodOrder = functions.runWith({ memory: '512MB', timeoutSeconds: 120 }).https.onCall(async (data, context) => {
  assertAuthed(context);
  const db = getFirestore();
  const shippingAddress = cleanAddress(data?.shippingAddress || {});
  const couponCode = data?.couponCode ? String(data.couponCode).trim().toUpperCase() : null;
  const cartRef = db.doc(`carts/${context.auth.uid}`);
  const orderRef = db.collection('orders').doc();
  let createdOrder = null;

  await db.runTransaction(async (tx) => {
    const cartSnap = await tx.get(cartRef);
    if (!cartSnap.exists || cartSnap.data().status !== 'active') throw new functions.https.HttpsError('failed-precondition', 'Your cart is empty.');
    const cart = cartSnap.data();
    const cartItems = (Array.isArray(cart.items) ? cart.items : []).filter((item) => Number(item.quantity) > 0);
    if (!cartItems.length) throw new functions.https.HttpsError('failed-precondition', 'Your cart is empty.');

    const productSnaps = await Promise.all(cartItems.map((item) => tx.get(db.doc(`products/${item.productId}`))));
    const items = [];
    const vendorIds = new Set();
    let subtotal = 0, totalCgst = 0, totalSgst = 0, totalIgst = 0;

    productSnaps.forEach((productSnap, index) => {
      if (!productSnap.exists) throw new functions.https.HttpsError('failed-precondition', 'One product in your cart is no longer available.');
      const product = productSnap.data();
      const requested = cartItems[index];
      if (product.status !== 'active') throw new functions.https.HttpsError('failed-precondition', `${product.title} is not available.`);
      const variant = requested.variantId ? (product.variants || []).find((v) => v.id === requested.variantId) : null;
      const quantity = Math.max(1, Math.floor(Number(requested.quantity || 1)));
      const tracksStock = product.inventory?.trackInventory !== false;
      const variantStock = variant ? Number(variant.quantity || 0) : Number(product.inventory?.quantity || 0);
      if (tracksStock && !product.inventory?.allowBackorder && variantStock < quantity) throw new functions.https.HttpsError('failed-precondition', `${product.title} has only ${variantStock} in stock.`);
      const unitPrice = money(variant?.price ?? product.price);
      const lineTotal = money(unitPrice * quantity);
      subtotal = money(subtotal + lineTotal);
      vendorIds.add(product.vendorId);
      items.push({ productId: productSnap.id, variantId: variant?.id || null, vendorId: product.vendorId, vendorName: product.vendorName || '', sku: variant?.sku || product.sku, title: variant ? `${product.title} - ${variant.name}` : product.title, image: variant?.image || product.images?.[0]?.url || '', unitPrice, quantity, lineTotal, taxRatePct: Number(product.taxRatePct || 0), hsnCode: product.hsnCode || '', vendorState: product.vendorState || '' });
      if (tracksStock) {
        if (variant) { tx.update(db.doc(`products/${productSnap.id}`), { variants: (product.variants || []).map((v) => v.id === variant.id ? { ...v, quantity: Math.max(0, Number(v.quantity || 0) - quantity) } : v), updatedAt: FieldValue.serverTimestamp() }); }
        else tx.update(db.doc(`products/${productSnap.id}`), { 'inventory.quantity': FieldValue.increment(-quantity), updatedAt: FieldValue.serverTimestamp() });
      }
    });

    const vendorIdArr = Array.from(vendorIds);
    const vendorSnaps = await Promise.all(vendorIdArr.map((vid) => tx.get(db.doc(`vendors/${vid}`))));
    const vendorStateCache = {};
    vendorSnaps.forEach((vs) => { if (vs.exists) vendorStateCache[vs.id] = vs.data()?.address?.state || ''; });

    const itemsWithGst = items.map((item) => {
      const vendorState = vendorStateCache[item.vendorId] || item.vendorState || '';
      const gst = calcGstBreakdown(item.lineTotal, item.taxRatePct, vendorState, shippingAddress.state);
      totalCgst = money(totalCgst + gst.cgst); totalSgst = money(totalSgst + gst.sgst); totalIgst = money(totalIgst + gst.igst);
      return { ...item, vendorState, gstBreakdown: gst };
    });
    const tax = money(totalCgst + totalSgst + totalIgst);

    const shipping = money(vendorSnaps.reduce((sum, vs) => {
      if (!vs.exists) return sum;
      const settings = vs.data()?.store?.shippingSettings || {};
      const vendorSubtotal = itemsWithGst.filter((i) => i.vendorId === vs.id).reduce((s, i) => s + i.lineTotal, 0);
      return sum + resolveShippingFee(settings, vendorSubtotal, shippingAddress.state);
    }, 0));

    let discount = 0, appliedCoupon = null;
    if (couponCode) {
      const couponSnap = await tx.get(db.doc(`coupons/${couponCode}`));
      if (couponSnap.exists) {
        const c = couponSnap.data();
        const isExpired = c.expiresAt && c.expiresAt.toMillis() < Date.now();
        const isExhausted = c.maxUses > 0 && c.usedCount >= c.maxUses;
        if (c.active && !isExpired && !isExhausted && subtotal >= Number(c.minOrderAmount || 0)) {
          if (c.type === 'percent') { discount = money(subtotal * (Number(c.value) / 100)); if (c.maxDiscountAmount > 0) discount = Math.min(discount, Number(c.maxDiscountAmount)); }
          else discount = Math.min(money(c.value), subtotal);
          tx.update(db.doc(`coupons/${couponCode}`), { usedCount: FieldValue.increment(1), updatedAt: FieldValue.serverTimestamp() });
          appliedCoupon = { code: couponCode, type: c.type, value: c.value, discount };
        }
      }
    }

    const total = money(subtotal + tax + shipping - discount);
    const orderNumber = await nextOrderNumber(tx, db);
    const now = FSTimestamp.now();
    const order = {
      orderNumber, userId: context.auth.uid, customer: { name: shippingAddress.name, email: context.auth.token.email || '', phone: shippingAddress.phone },
      items: itemsWithGst, vendorIds: vendorIdArr, shippingAddress, billingAddress: shippingAddress,
      amounts: { subtotal, shipping, tax, taxBreakdown: { cgst: totalCgst, sgst: totalSgst, igst: totalIgst }, discount, total },
      coupon: appliedCoupon, paymentStatus: 'pending', paymentProvider: 'cod', paymentMethod: 'pay_on_delivery',
      paymentMeta: { label: 'Pay on delivery' }, fulfillmentStatus: 'unfulfilled',
      statusHistory: [{ from: null, to: 'unfulfilled', note: 'Pay on delivery order placed.', changedBy: context.auth.uid, changedAt: now }],
      createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
    };
    tx.set(orderRef, order);

    const byVendor = itemsWithGst.reduce((acc, item) => { (acc[item.vendorId] = acc[item.vendorId] || []).push(item); return acc; }, {});
    Object.entries(byVendor).forEach(([vid, vitems]) => {
      const vendorSubtotal = money(vitems.reduce((s, i) => s + i.lineTotal, 0));
      tx.set(orderRef.collection('subOrders').doc(vid), { vendorId: vid, orderId: orderRef.id, orderNumber, userId: context.auth.uid, customer: order.customer, items: vitems, amounts: { subtotal: vendorSubtotal }, paymentStatus: 'pending', paymentProvider: 'cod', fulfillmentStatus: 'unfulfilled', createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
      tx.update(db.doc(`vendors/${vid}`), { orderCount: FieldValue.increment(1), updatedAt: FieldValue.serverTimestamp() });
    });
    tx.update(cartRef, { status: 'converted', convertedOrderId: orderRef.id, updatedAt: FieldValue.serverTimestamp() });
    createdOrder = { id: orderRef.id, ...order, createdAt: now, updatedAt: now };
  });

  await writeUserNotification(context.auth.uid, { type: 'commerce_order', title: 'Order placed', body: `${createdOrder.orderNumber} is confirmed for pay on delivery.`, data: { type: 'commerce_order', orderId: createdOrder.id, click_action: `/orders/${createdOrder.id}` } });
  return { orderId: createdOrder.id, order: createdOrder };
});

exports.commerceCustomerOrderAction = functions.https.onCall(async (data, context) => {
  assertAuthed(context);
  const { orderId, action, reason = '' } = data || {};
  if (!orderId || !['cancel', 'return'].includes(action)) throw new functions.https.HttpsError('invalid-argument', 'Valid orderId and action (cancel|return) are required.');
  const db = getFirestore();
  const orderRef = db.doc(`orders/${orderId}`);

  if (action === 'cancel') {
    await db.runTransaction(async (tx) => {
      const orderSnap = await tx.get(orderRef);
      if (!orderSnap.exists) throw new functions.https.HttpsError('not-found', 'Order not found.');
      const order = orderSnap.data();
      if (order.userId !== context.auth.uid) throw new functions.https.HttpsError('permission-denied', 'You can only update your own order.');
      if (!['unfulfilled', 'processing'].includes(order.fulfillmentStatus)) throw new functions.https.HttpsError('failed-precondition', 'This order can no longer be cancelled.');
      await restockOrderItems(tx, db, order);
      tx.update(orderRef, {
        fulfillmentStatus: 'cancelled', cancellation: { reason, requestedBy: context.auth.uid, requestedAt: FSTimestamp.now() },
        statusHistory: FieldValue.arrayUnion({ from: order.fulfillmentStatus || null, to: 'cancelled', note: reason, changedBy: context.auth.uid, changedAt: FSTimestamp.now() }),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });
  } else {
    const orderSnap = await orderRef.get();
    if (!orderSnap.exists) throw new functions.https.HttpsError('not-found', 'Order not found.');
    const order = orderSnap.data();
    if (order.userId !== context.auth.uid) throw new functions.https.HttpsError('permission-denied', 'You can only update your own order.');
    if (order.fulfillmentStatus !== 'delivered') throw new functions.https.HttpsError('failed-precondition', 'Returns can be requested after delivery.');
    await orderRef.update({
      returnRequests: FieldValue.arrayUnion({ reason, status: 'requested', requestedBy: context.auth.uid, requestedAt: FSTimestamp.now() }),
      statusHistory: FieldValue.arrayUnion({ from: order.fulfillmentStatus || null, to: 'return_requested', note: reason, changedBy: context.auth.uid, changedAt: FSTimestamp.now() }),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
  await writeUserNotification(context.auth.uid, { type: 'commerce_order', title: action === 'cancel' ? 'Order cancelled' : 'Return requested', body: action === 'cancel' ? 'Your order has been cancelled and inventory released.' : 'Your return request has been submitted.', data: { type: 'commerce_order', orderId, click_action: `/orders/${orderId}` } });
  return { success: true };
});

exports.commerceUpdateOrderStatus = functions.https.onCall(async (data, context) => {
  assertAuthed(context);
  const FULFILLMENT_STATUSES = ['unfulfilled', 'processing', 'shipped', 'delivered', 'cancelled', 'return_approved', 'return_completed'];
  const STATUS_LABELS = { unfulfilled: 'Order placed', processing: 'Order processing', shipped: 'Order shipped', delivered: 'Order delivered', cancelled: 'Order cancelled', return_approved: 'Return approved', return_completed: 'Return completed' };
  const { orderId, vendorId, fulfillmentStatus, note = '' } = data || {};
  if (!orderId || !FULFILLMENT_STATUSES.includes(fulfillmentStatus)) throw new functions.https.HttpsError('invalid-argument', 'Valid orderId and fulfillmentStatus are required.');
  const db = getFirestore();
  const orderRef = db.doc(`orders/${orderId}`);
  const orderSnap = await orderRef.get();
  if (!orderSnap.exists) throw new functions.https.HttpsError('not-found', 'Order not found.');
  const order = orderSnap.data();
  const isAdmin = context.auth.token.role === 'admin' || (context.auth.token.email || '') === COMMERCE_ADMIN_EMAIL;
  const actorVendorId = context.auth.token.vendorId;
  const targetVendorId = vendorId || actorVendorId;
  if (!isAdmin && (!targetVendorId || !order.vendorIds?.includes(targetVendorId))) throw new functions.https.HttpsError('permission-denied', 'You can only update orders for your vendor account.');
  const historyItem = { from: order.fulfillmentStatus || null, to: fulfillmentStatus, note, changedBy: context.auth.uid, changedAt: FSTimestamp.now() };

  await db.runTransaction(async (tx) => {
    if (fulfillmentStatus === 'return_completed') { const freshSnap = await tx.get(orderRef); await restockOrderItems(tx, db, freshSnap.data()); }
    if (targetVendorId && !isAdmin) tx.update(orderRef.collection('subOrders').doc(targetVendorId), { fulfillmentStatus, statusHistory: FieldValue.arrayUnion(historyItem), updatedAt: FieldValue.serverTimestamp() });
    tx.update(orderRef, { fulfillmentStatus, statusHistory: FieldValue.arrayUnion(historyItem), updatedAt: FieldValue.serverTimestamp() });
  });

  await writeUserNotification(order.userId, { type: 'commerce_order', title: STATUS_LABELS[fulfillmentStatus] || fulfillmentStatus, body: note || `${order.orderNumber} is now ${(STATUS_LABELS[fulfillmentStatus] || fulfillmentStatus).toLowerCase()}.`, data: { type: 'commerce_order', orderId, click_action: `/orders/${orderId}` } });
  return { success: true, orderId, fulfillmentStatus };
});

exports.commerceModerateProduct = functions.https.onCall(async (data, context) => {
  assertAdmin(context);
  const { productId, status, moderationStatus = 'approved', note = '' } = data || {};
  if (!productId || !['active', 'archived', 'draft', 'out_of_stock'].includes(status)) throw new functions.https.HttpsError('invalid-argument', 'Valid productId and status are required.');
  await getFirestore().doc(`products/${productId}`).update({
    status, moderation: { status: moderationStatus, note, reviewedBy: context.auth.uid, reviewedAt: FieldValue.serverTimestamp() },
    updatedAt: FieldValue.serverTimestamp(),
  });
  return { success: true, productId, status };
});

// ============================================================================
// COMMERCE — scheduled functions (replaces Netlify scheduled)
// ============================================================================

exports.flagAbandonedCarts = functions
  .runWith({ memory: '256MB' })
  .pubsub.schedule('0 * * * *')
  .timeZone('UTC')
  .onRun(async () => {
    try {
      const db = getFirestore();
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const snapshot = await db.collection('carts').where('status', '==', 'active').where('updatedAt', '<=', cutoff).limit(100).get();
      if (snapshot.empty) { console.log('[flagAbandonedCarts] Nothing to flag'); return; }
      const batch = db.batch();
      const now = new Date();
      snapshot.docs.forEach((doc) => batch.update(doc.ref, { status: 'abandoned', abandonedAt: now, updatedAt: now }));
      await batch.commit();
      console.log(`[flagAbandonedCarts] Flagged ${snapshot.size} carts`);
    } catch (err) {
      console.error('[flagAbandonedCarts]', err);
    }
  });

exports.checkAndNotify = functions
  .runWith({ memory: '512MB' })
  .pubsub.schedule('0 * * * *')
  .timeZone('UTC')
  .onRun(async () => {
    const db = getFirestore();
    const messaging = admin.messaging();
    const now = FSTimestamp.now();
    const nowDate = now.toDate();
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

    function toDate(value) {
      if (!value) return null;
      if (typeof value.toDate === 'function') return value.toDate();
      if (value instanceof Date) return value;
      const d = new Date(value); return isNaN(d.getTime()) ? null : d;
    }

    async function syncCollection(collectionName) {
      const batch = db.batch();
      const justActivated = [];
      const inactiveSnap = await db.collection(collectionName).where('isActive', '==', false).get();
      for (const doc of inactiveSnap.docs) {
        const data = doc.data();
        if (data.notificationSent) continue;
        const start = toDate(data.startTime), end = toDate(data.endTime);
        if (start && start <= nowDate && (!end || end >= nowDate)) {
          batch.update(doc.ref, { isActive: true, notificationSent: true });
          justActivated.push({ id: doc.id, ...data });
        }
      }
      const activeSnap = await db.collection(collectionName).where('isActive', '==', true).get();
      for (const doc of activeSnap.docs) {
        const data = doc.data();
        const end = toDate(data.endTime);
        if (end && end < nowDate) batch.update(doc.ref, { isActive: false });
        else if (!end && toDate(data.startTime) && nowDate.getTime() - toDate(data.startTime).getTime() > 8 * 24 * 60 * 60 * 1000) batch.update(doc.ref, { isActive: false });
      }
      await batch.commit();
      return justActivated;
    }

    try {
      const [newChallenges, newQuizzes] = await Promise.all([
        syncCollection('challenges'),
        syncCollection('weeklyQuiz'),
      ]);

      await Promise.all([
        ...newChallenges.map((data) => messaging.send({ topic: 'new-challenges', notification: { title: '🏆 New Pawppy Challenge!', body: `${data.theme || 'New Challenge'}: "${data.prompt || 'Show us your pet!'}"` }, webpush: { notification: { icon: '/favicon.png', badge: '/favicon.png' }, fcm_options: { link: `${BASE_URL}/challenge` } }, data: { type: 'new_challenge', challengeId: data.id, click_action: '/challenge' } }).catch((e) => console.warn('[checkAndNotify] challenge push:', e.message))),
        ...newQuizzes.map((data) => messaging.send({ topic: 'new-quizzes', notification: { title: '🧠 New Weekly Quiz!', body: `${data.title || 'New Quiz'} — ${data.topic || 'Pet Knowledge'}` }, webpush: { notification: { icon: '/favicon.png', badge: '/favicon.png' }, fcm_options: { link: `${BASE_URL}/quiz` } }, data: { type: 'new_quiz', quizId: data.id, click_action: '/quiz' } }).catch((e) => console.warn('[checkAndNotify] quiz push:', e.message))),
      ]);

      console.log(`[checkAndNotify] Activated ${newChallenges.length} challenge(s), ${newQuizzes.length} quiz(zes)`);
    } catch (err) {
      console.error('[checkAndNotify]', err);
    }
  });
