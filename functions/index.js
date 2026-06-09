const { onValueCreated, onValueUpdated } = require('firebase-functions/v2/database');
const { onCall } = require('firebase-functions/v2/https');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { onDocumentWritten } = require('firebase-functions/v2/firestore');
const functionsV1 = require('firebase-functions/v1');
const admin = require('firebase-admin');

admin.initializeApp();

const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const firestore = admin.firestore();
const serverTimestamp = admin.firestore.FieldValue.serverTimestamp;
const arrayUnion = admin.firestore.FieldValue.arrayUnion;
const COMMERCE_ADMIN_EMAIL = 'anantsoftcomputing@gmail.com';
const HttpsError = functionsV1.https.HttpsError;
const BASE_URL = 'https://pawppy.in';

const getCallableAuth = (req) => req.auth || null;
const assertAuthed = (req) => {
  if (!getCallableAuth(req)) throw new HttpsError('unauthenticated', 'Sign in to continue.');
};
const assertAdmin = (req) => {
  assertAuthed(req);
  const auth = getCallableAuth(req);
  if (auth.token.role !== 'admin' && (auth.token.email || '').toLowerCase() !== COMMERCE_ADMIN_EMAIL)
    throw new HttpsError('permission-denied', 'Admin access required.');
};

// ============================================================================
// NOTIFICATION TEMPLATES
// All 30 notification types — emoji-rich, personal, action-oriented.
// Each template is a function that takes a data object and returns { title, body }.
// ============================================================================

const T = {
  // ── Social ─────────────────────────────────────────────────────────────────
  mating_request:    (d) => ({
    title: '💕 New Mating Request',
    body:  `${d.senderName} wants to pair their ${d.petName} with your pet! 🐾 Tap to review.`,
  }),
  mating_accepted:   (d) => ({
    title: '🎉 Mating Request Accepted!',
    body:  `${d.receiverName}'s ${d.receiverPet} said yes to ${d.myPet}! 💕 Start chatting now.`,
  }),
  mating_declined:   (d) => ({
    title: '🐾 Request Update',
    body:  `Not a match for ${d.myPet} this time — keep exploring! 🔍`,
  }),
  message:           (d) => ({
    title: `💬 ${d.senderName}`,
    body:  d.text,
  }),
  adoption_inquiry:  (d) => ({
    title: `❤️ Someone Wants to Adopt ${d.petName}!`,
    body:  `${d.inquirerName} is interested in adopting ${d.petName}. Tap to connect! 🐾`,
  }),

  // ── Health & Care ───────────────────────────────────────────────────────────
  vacc_7d:           (d) => ({
    title: '💉 Vaccination Due in 7 Days',
    body:  `${d.petName}'s ${d.vaccineName} is due on ${d.dueDate}. Book your vet! 🏥`,
  }),
  vacc_1d:           (d) => ({
    title: '⚠️ Vaccination Due Tomorrow!',
    body:  `${d.petName}'s ${d.vaccineName} is due tomorrow — don't miss it! 🐾`,
  }),
  vacc_overdue:      (d) => ({
    title: '🚨 Overdue Vaccination!',
    body:  `${d.petName}'s ${d.vaccineName} was due on ${d.dueDate}. Visit your vet ASAP! 🏥`,
  }),
  birthday_today:    (d) => ({
    title: `🎂 Happy Birthday ${d.petName}!`,
    body:  `${d.petName} turns ${d.age} today! 🎉 Spoil them with extra treats and love! 🐾`,
  }),
  birthday_tomorrow: (d) => ({
    title: `🎉 Birthday Tomorrow — ${d.petName}!`,
    body:  `${d.petName}'s big day is tomorrow! Turning ${d.age} — plan something special! 🎂`,
  }),
  birthday_3d:       (d) => ({
    title: `🎈 Birthday in 3 Days!`,
    body:  `${d.petName} turns ${d.age} in just 3 days! 🐾 Time to plan the celebration! 🎂`,
  }),
  health_checkup:    (d) => ({
    title: '🏥 Vet Visit Overdue',
    body:  `${d.petName} hasn't had a checkup in 6+ months. Book a wellness visit today! 🐾`,
  }),
  deworming:         (d) => ({
    title: '💊 Monthly Deworming Reminder',
    body:  `Time for ${d.petName}'s monthly deworming! Keep your furball parasite-free. 🐾`,
  }),

  // ── Community ───────────────────────────────────────────────────────────────
  new_challenge:     (d) => ({
    title: '🏆 New Tuesday Challenge!',
    body:  `"${d.theme}" — ${d.prompt} Submit your photo to win! 📸`,
  }),
  challenge_ending:  (d) => ({
    title: '⏰ Challenge Closes in 24 Hours!',
    body:  `Cast your vote in "${d.theme}" before it ends! ${d.entryCount} entries competing. 🗳️`,
  }),
  challenge_winner:  (d) => ({
    title: '🏆 You Won the Weekly Challenge!',
    body:  `Your entry in "${d.theme}" was voted #1 by the community! 🎉 Congrats! 🐾`,
  }),
  challenge_vote:    (d) => ({
    title: '❤️ Your Entry Got a Vote!',
    body:  `Someone voted for your photo in "${d.theme}"! You now have ${d.voteCount} vote${d.voteCount !== 1 ? 's' : ''}. 🏅`,
  }),
  new_quiz:          (d) => ({
    title: '🧠 New Weekly Quiz!',
    body:  `"${d.title}" — ${d.topic}. Test your pet knowledge & climb the leaderboard! ✨`,
  }),

  // ── Commerce ────────────────────────────────────────────────────────────────
  order_placed:      (d) => ({
    title: '🛍️ New Order Received!',
    body:  `${d.buyerName} ordered ${d.itemCount} item${d.itemCount !== 1 ? 's' : ''} — ₹${d.total}. Confirm within 24h! 🚀`,
  }),
  order_confirmed:   (d) => ({
    title: '✅ Order Confirmed!',
    body:  `Your order from ${d.storeName} is confirmed. We'll notify you when it ships! 📦`,
  }),
  order_shipped:     (d) => ({
    title: '🚚 Your Order is on the Way!',
    body:  `Great news! Your ${d.storeName} order has shipped! 🐾 📦`,
  }),
  order_delivered:   (d) => ({
    title: '📦 Order Delivered!',
    body:  `Your order from ${d.storeName} has arrived! We hope your pet loves it. 🎉`,
  }),
  order_cancelled:   (d) => ({
    title: '❌ Order Cancelled',
    body:  `Your ${d.storeName} order was cancelled. Any payment will be refunded within 5–7 days. 💸`,
  }),

  // ── Lost & Found ────────────────────────────────────────────────────────────
  lost_pet_nearby:   (d) => ({
    title: `🆘 Lost ${d.petType} Nearby — Help Needed!`,
    body:  `"${d.petName || 'A pet'}" (${d.breed || d.petType}) reported lost ~${d.distKm} km away. Seen them? 🐾`,
  }),
  found_pet_nearby:  (d) => ({
    title: '🐾 Found Pet Near You!',
    body:  `Someone found a ${d.petType} near ${d.area}. Know whose it might be? Help reunite them! 🏠`,
  }),

  // ── Vendor / System ─────────────────────────────────────────────────────────
  vendor_approved:   (d) => ({
    title: '🎉 Your Pawppy Store is Live!',
    body:  `"${d.businessName}" has been approved! Start listing your products now. 🛍️`,
  }),
  vendor_rejected:   (d) => ({
    title: '📝 Store Application Needs Updates',
    body:  d.note || 'Your store application has feedback. Please review and reapply.',
  }),
  vendor_suspended:  (d) => ({
    title: '⚠️ Store Temporarily Suspended',
    body:  `"${d.businessName}" has been suspended. ${d.note || 'Contact Pawppy support for details.'}`,
  }),
};

// ============================================================================
// NOTIFICATION HELPERS
// ============================================================================

/**
 * Write a notification to a user's in-app inbox.
 */
async function writeUserNotification(userId, { type, title, body, data = {} }) {
  if (!userId) return;
  const notifRef = admin.database().ref(`notifications/${userId}`).push();
  await notifRef.set({
    id: notifRef.key,
    type, title, body, data,
    timestamp: admin.database.ServerValue.TIMESTAMP,
    read: false,
  });
}

/**
 * Write a broadcast notification (system-wide inbox).
 */
async function writeBroadcastNotification(id, { type, title, body, data = {} }) {
  if (!id) return;
  await admin.database().ref(`broadcastNotifications/${id}`).set({
    type, title, body, data,
    timestamp: admin.database.ServerValue.TIMESTAMP,
    active: true,
  });
}

/**
 * Central notification dispatcher:
 *   1. Writes to notifications/{userId} in-app inbox
 *   2. Increments unreadNotifications badge counter
 *   3. Sends FCM push notification (silently skips if no token; clears stale tokens)
 */
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

/**
 * Haversine distance in km between two lat/lon pairs.
 */
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = (x) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Returns users who have at least one pet within radiusKm of [lat, lon].
 * Excludes the reporter (excludeUserId).
 */
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

/** Format a date value as "Jun 17" */
function fmtDate(val) {
  const d = val instanceof Date ? val : new Date(val);
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}

// ============================================================================
// AUTH — USER CREATION
// ============================================================================

exports.onUserCreate = functionsV1.auth.user().onCreate(async (user) => {
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

exports.requestVendorRole = functionsV1.https.onCall(async (data, context) => {
  assertAuthed(context);
  const uid = context.auth.uid;
  const userRecord = await admin.auth().getUser(uid);
  const existingUser = await firestore.doc(`users/${uid}`).get();
  const existingVendorId = existingUser.data()?.vendorId || context.auth.token.vendorId;

  if (existingVendorId) return { vendorId: existingVendorId, status: 'existing' };

  const vendorRef = firestore.collection('vendors').doc();
  const vendorId = vendorRef.id;
  const nowHistory = {
    from: null,
    to: 'pending',
    note: 'Vendor registration started.',
    changedBy: uid,
    changedAt: admin.firestore.Timestamp.now(),
  };

  await firestore.runTransaction(async (transaction) => {
    transaction.set(vendorRef, {
      ownerUid: uid,
      businessName: '', legalName: '', ownerName: userRecord.displayName || '',
      email: userRecord.email || '', phone: userRecord.phoneNumber || '',
      gstin: '', pan: '',
      address: { line1: '', line2: '', city: '', state: '', pincode: '', country: 'India' },
      categories: [], description: '', logoUrl: '', bannerUrl: '', website: '', socials: {},
      documents: [], status: 'pending', statusHistory: [nowHistory],
      bankDetails: { accountName: '', accountNumber: '', ifsc: '' },
      productCount: 0, orderCount: 0, rating: 0,
      approvedAt: null, approvedBy: null,
      createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
    });
    transaction.set(firestore.doc(`users/${uid}`), {
      role: 'vendor',
      displayName: userRecord.displayName || userRecord.email?.split('@')[0] || '',
      email: userRecord.email || '',
      phone: userRecord.phoneNumber || '',
      photoURL: userRecord.photoURL || '',
      vendorId,
      createdAt: existingUser.exists ? existingUser.data().createdAt : serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });
  });

  await admin.auth().setCustomUserClaims(uid, {
    ...(context.auth.token || {}),
    role: 'vendor',
    vendorId,
  });

  return { vendorId, status: 'created' };
});

exports.provisionCommerceAdmin = functionsV1.https.onCall(async (data, context) => {
  assertAuthed(context);
  if ((context.auth.token.email || '').toLowerCase() !== COMMERCE_ADMIN_EMAIL)
    throw new HttpsError('permission-denied', 'Only the configured Pawppy admin can provision admin access.');

  const uid = context.auth.uid;
  const userRecord = await admin.auth().getUser(uid);
  await admin.auth().setCustomUserClaims(uid, {
    ...(context.auth.token || {}), role: 'admin', admin: true,
  });
  await firestore.doc(`users/${uid}`).set({
    role: 'admin',
    displayName: userRecord.displayName || userRecord.email?.split('@')[0] || '',
    email: userRecord.email || '', phone: userRecord.phoneNumber || '',
    photoURL: userRecord.photoURL || '',
    updatedAt: serverTimestamp(), createdAt: serverTimestamp(),
  }, { merge: true });
  return { success: true, role: 'admin' };
});

/** Admin changes vendor status → notify vendor owner with template */
exports.setVendorStatus = functionsV1.https.onCall(async (data, context) => {
  assertAdmin(context);
  const { vendorId, status, note = '' } = data || {};
  const allowed = ['pending', 'documentation_required', 'under_review', 'approved', 'rejected', 'suspended'];
  if (!vendorId || !allowed.includes(status))
    throw new HttpsError('invalid-argument', 'Valid vendorId and status required.');

  const vendorRef = firestore.doc(`vendors/${vendorId}`);
  const vendorSnap = await vendorRef.get();
  if (!vendorSnap.exists) throw new HttpsError('not-found', 'Vendor not found.');

  const vendor = vendorSnap.data();
  await vendorRef.update({
    status, reviewNote: note,
    statusHistory: arrayUnion({
      from: vendor.status || null, to: status, note,
      changedBy: context.auth.uid, changedAt: admin.firestore.Timestamp.now(),
    }),
    ...(status === 'approved' ? { approvedAt: serverTimestamp(), approvedBy: context.auth.uid } : {}),
    updatedAt: serverTimestamp(),
  });

  if (vendor.ownerUid) {
    const templateKey = status === 'approved' ? 'vendor_approved'
      : status === 'rejected' ? 'vendor_rejected'
      : status === 'suspended' ? 'vendor_suspended'
      : null;

    if (templateKey) {
      const { title, body } = T[templateKey]({ businessName: vendor.businessName || 'Your store', note });
      await notifyUser(vendor.ownerUid, {
        type: 'vendor_status',
        title, body,
        data: { type: 'vendor_status', vendorId, status, click_action: '/vendor/status' },
      });
    }
  }

  return { success: true, vendorId, status };
});

// ============================================================================
// MATING REQUESTS
// ============================================================================

/** New mating request → notify receiver */
exports.sendMatingRequestNotification = onValueCreated(
  '/matingRequests/{requestId}',
  async (event) => {
    try {
      const req = event.data.val();
      const { receiverId, senderId, senderPetId } = req;
      const requestId = event.params.requestId;

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

      await notifyUser(receiverId, {
        type: 'mating_request', title, body,
        data: { type: 'mating_request', requestId, senderId, click_action: '/profile?tab=requests' },
      });
    } catch (err) {
      console.error('[sendMatingRequestNotification]', err);
    }
  }
);

/** Mating request accepted or declined → notify sender */
exports.onMatingRequestStatusChange = onValueUpdated(
  '/matingRequests/received/{receiverId}/{requestId}',
  async (event) => {
    try {
      const before = event.data.before.val();
      const after = event.data.after.val();
      if (!after || before?.status === after?.status) return;
      if (!['accepted', 'declined'].includes(after.status)) return;

      const { senderId, senderPetId, receiverPetId } = after;
      const receiverId = event.params.receiverId;

      const [senderPetSnap, receiverSnap, receiverPetSnap] = await Promise.all([
        admin.database().ref(`users/${receiverId}/pets/${receiverPetId}`).once('value'),
        admin.database().ref(`users/${receiverId}`).once('value'),
        senderPetId ? admin.database().ref(`users/${senderId}/pets/${senderPetId}`).once('value') : Promise.resolve(null),
      ]);

      const receiverPet = senderPetSnap.val() || {};
      const receiver = receiverSnap.val() || {};
      const myPet = receiverPetSnap?.val() || {};

      if (after.status === 'accepted') {
        const { title, body } = T.mating_accepted({
          receiverName: receiver.displayName || 'Someone',
          receiverPet: receiverPet.name || 'their pet',
          myPet: myPet.name || 'your pet',
        });
        await notifyUser(senderId, {
          type: 'mating_accepted', title, body,
          data: { type: 'mating_accepted', receiverId, click_action: '/profile?tab=messages' },
        });
      } else {
        const { title, body } = T.mating_declined({ myPet: myPet.name || 'your pet' });
        await notifyUser(senderId, {
          type: 'mating_declined', title, body,
          data: { type: 'mating_declined', receiverId, click_action: '/nearby-mates' },
        });
      }
    } catch (err) {
      console.error('[onMatingRequestStatusChange]', err);
    }
  }
);

// ============================================================================
// MESSAGES
// ============================================================================

/** New message in a conversation → notify receiver */
exports.sendMessageNotification = onValueCreated(
  '/conversations/{conversationId}/messages/{messageId}',
  async (event) => {
    try {
      const msg = event.data.val();
      const { senderId, text } = msg;
      const { conversationId } = event.params;

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

      await notifyUser(receiverId, {
        type: 'message', title, body,
        data: { type: 'message', conversationId, senderId, click_action: '/profile?tab=messages' },
      });
    } catch (err) {
      console.error('[sendMessageNotification]', err);
    }
  }
);

// ============================================================================
// ADOPTION INQUIRIES
// Triggered when a new adoption conversation is created (isAdoption: true).
// ============================================================================

exports.onAdoptionConversationCreated = onValueCreated(
  '/conversations/{conversationId}',
  async (event) => {
    try {
      const convo = event.data.val();
      if (!convo?.isAdoption) return;

      const participants = Array.isArray(convo.participants)
        ? convo.participants
        : Object.keys(convo.participants || {});
      if (participants.length < 2) return;

      // The pet owner is the user who owns the petId in the conversation
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

      const [ownerPetSnap, inquirerSnap] = await Promise.all([
        petId ? admin.database().ref(`users/${ownerId}/pets/${petId}`).once('value') : Promise.resolve(null),
        admin.database().ref(`users/${inquirerId}`).once('value'),
      ]);

      const pet = ownerPetSnap?.val() || {};
      const inquirer = inquirerSnap.val() || {};

      const { title, body } = T.adoption_inquiry({
        petName: pet.name || 'your pet',
        inquirerName: inquirer.displayName || 'Someone',
      });

      await notifyUser(ownerId, {
        type: 'adoption_inquiry', title, body,
        data: { type: 'adoption_inquiry', conversationId: event.params.conversationId, inquirerId, click_action: '/profile?tab=messages' },
      });
    } catch (err) {
      console.error('[onAdoptionConversationCreated]', err);
    }
  }
);

// ============================================================================
// COMMERCE — ORDERS
// ============================================================================

/** New order in vendorOrders → notify the vendor */
exports.onVendorOrderCreated = onValueCreated(
  '/vendorOrders/{storeId}/{orderId}',
  async (event) => {
    try {
      const order = event.data.val();
      const { storeId, orderId } = event.params;

      const vendorDoc = await firestore.doc(`vendors/${storeId}`).get();
      const ownerUid = vendorDoc.data()?.ownerUid;
      if (!ownerUid) return;

      const itemCount = (order.items || []).length;
      const total = (order.items || []).reduce((sum, i) => sum + (i.price * (i.quantity || 1)), 0);

      const { title, body } = T.order_placed({
        buyerName: order.buyerName || 'A customer',
        itemCount,
        total: total.toFixed(0),
      });

      await notifyUser(ownerUid, {
        type: 'order_placed', title, body,
        data: { type: 'order_placed', orderId, storeId, click_action: '/vendor/orders' },
      });
    } catch (err) {
      console.error('[onVendorOrderCreated]', err);
    }
  }
);

/**
 * Callable: vendor / admin updates order status → notify buyer.
 * Updates both buyerOrders and vendorOrders to keep them in sync.
 */
exports.updateOrderStatus = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in to continue.');

  const { orderId, buyerId, storeId, status, note = '' } = request.data || {};
  const allowedStatuses = ['confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!orderId || !buyerId || !storeId || !allowedStatuses.includes(status))
    throw new HttpsError('invalid-argument', 'orderId, buyerId, storeId, and a valid status are required.');

  const db = admin.database();
  const updatedAt = Date.now();

  await Promise.all([
    db.ref(`buyerOrders/${buyerId}/${orderId}`).update({ status, note, updatedAt }),
    db.ref(`vendorOrders/${storeId}/${orderId}`).update({ status, note, updatedAt }),
  ]);

  const orderSnap = await db.ref(`buyerOrders/${buyerId}/${orderId}`).once('value');
  const order = orderSnap.val() || {};
  const storeName = order.storeName || 'Pawppy Store';

  const templateKey = `order_${status}`;
  if (T[templateKey]) {
    const { title, body } = T[templateKey]({ storeName });
    await notifyUser(buyerId, {
      type: `order_${status}`, title, body,
      data: { type: `order_${status}`, orderId, storeId, click_action: '/orders' },
    });
  }

  return { success: true, orderId, status };
});

// ============================================================================
// LOST & FOUND — NEARBY ALERTS
// ============================================================================

/** New lost pet report → notify users within 10 km */
exports.onLostPetReported = onValueCreated(
  '/lostPets/{reportId}',
  async (event) => {
    try {
      const report = event.data.val();
      const { userId, petType = 'pet', petName, breed, lastSeenLocation } = report;
      const lat = lastSeenLocation?.latitude;
      const lon = lastSeenLocation?.longitude;
      if (!lat || !lon) return;

      const nearby = await getUsersNearby(lat, lon, 10, userId);
      const area = lastSeenLocation.address
        ? lastSeenLocation.address.split(',').slice(0, 2).join(',').trim()
        : `${lat.toFixed(3)}, ${lon.toFixed(3)}`;

      await Promise.all(nearby.map(({ userId: uid, distKm }) => {
        const { title, body } = T.lost_pet_nearby({ petType, petName, breed, distKm });
        return notifyUser(uid, {
          type: 'lost_pet_nearby', title, body,
          data: { type: 'lost_pet_nearby', reportId: event.params.reportId, lat: String(lat), lon: String(lon), click_action: '/lost-and-found' },
        });
      }));

      console.log(`[onLostPetReported] Notified ${nearby.length} nearby users`);
    } catch (err) {
      console.error('[onLostPetReported]', err);
    }
  }
);

/** New found pet report → notify users within 10 km */
exports.onFoundPetReported = onValueCreated(
  '/foundPets/{reportId}',
  async (event) => {
    try {
      const report = event.data.val();
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
          data: { type: 'found_pet_nearby', reportId: event.params.reportId, lat: String(lat), lon: String(lon), click_action: '/lost-and-found' },
        });
      }));

      console.log(`[onFoundPetReported] Notified ${nearby.length} nearby users`);
    } catch (err) {
      console.error('[onFoundPetReported]', err);
    }
  }
);

// ============================================================================
// CALLABLE UTILITIES
// ============================================================================

exports.clearUnreadNotifications = onCall(async (request) => {
  if (!request.auth) throw new Error('Must be authenticated');
  await admin.database().ref(`users/${request.auth.uid}/unreadNotifications`).set(0);
  return { success: true };
});

exports.subscribeToNotifications = onCall(async (request) => {
  if (!request.auth) throw new Error('Must be authenticated');
  const { token } = request.data;
  if (!token || typeof token !== 'string') throw new Error('Missing FCM token');
  await Promise.all([
    admin.messaging().subscribeToTopic([token], 'new-challenges'),
    admin.messaging().subscribeToTopic([token], 'new-quizzes'),
  ]);
  return { success: true };
});

// ============================================================================
// WEEKLY CHALLENGE — activates every Tuesday 09:00 IST
// ============================================================================

function getISOWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

exports.activateTuesdayChallenge = onSchedule(
  { schedule: '0 3 * * 2', timeZone: 'Asia/Kolkata', region: 'asia-south1' },
  async () => {
    const fs = getFirestore();
    const now = new Date();
    const weekNumber = getISOWeekNumber(now);
    const year = now.getFullYear();

    try {
      const activeSnap = await fs.collection('challenges').where('isActive', '==', true).get();
      const batch = fs.batch();

      for (const d of activeSnap.docs) {
        const entriesSnap = await fs
          .collection('challenges').doc(d.id)
          .collection('entries').orderBy('voteCount', 'desc').limit(1).get();

        const winnerId = entriesSnap.empty ? null : entriesSnap.docs[0].id;

        // Notify winner
        if (winnerId) {
          const winnerEntry = entriesSnap.docs[0].data();
          if (winnerEntry.userId) {
            const { title, body } = T.challenge_winner({
              theme: d.data().theme || 'this week\'s challenge',
              petName: 'Your pet',
            });
            notifyUser(winnerEntry.userId, {
              type: 'challenge_winner', title, body,
              data: { type: 'challenge_winner', challengeId: d.id, click_action: '/challenge/leaderboard' },
            }).catch((e) => console.warn('[winner notify]', e.message));
          }
        }

        batch.update(d.ref, { isActive: false, winnerId, endedAt: FieldValue.serverTimestamp() });
      }

      const templateSnap = await fs.collection('challengeTemplates').get();
      const templates = templateSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      if (templates.length === 0) { console.error('[Challenge] No templates'); return; }

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
  }
);

/** When a challenge isActive flips false→true, broadcast push to all subscribers */
exports.notifyNewChallenge = onDocumentWritten('challenges/{challengeId}', async (event) => {
  try {
    const before = event.data?.before?.data();
    const after = event.data?.after?.data();
    if (!after?.isActive || before?.isActive === true) return null;

    const { title, body } = T.new_challenge({
      theme: after.theme || 'New Challenge',
      prompt: after.prompt || 'Show us your pet!',
    });

    await writeBroadcastNotification(`challenge_${event.params.challengeId}`, {
      type: 'new_challenge', title, body,
      data: { type: 'new_challenge', challengeId: event.params.challengeId, click_action: '/challenge' },
    });

    await admin.messaging().send({
      topic: 'new-challenges',
      notification: { title, body },
      webpush: {
        notification: { icon: '/favicon.png', badge: '/favicon.png', requireInteraction: false },
        fcm_options: { link: `${BASE_URL}/challenge` },
      },
      data: { type: 'new_challenge', challengeId: event.params.challengeId, click_action: '/challenge' },
    });
  } catch (err) {
    console.error('[notifyNewChallenge]', err);
  }
});

/** Challenge entry voteCount increases → notify the entry owner */
exports.onChallengeEntryVoted = onDocumentWritten(
  'challenges/{challengeId}/entries/{entryId}',
  async (event) => {
    try {
      const before = event.data?.before?.data();
      const after = event.data?.after?.data();
      if (!after || !before) return;
      if ((after.voteCount || 0) <= (before.voteCount || 0)) return;

      const challengeDoc = await getFirestore().doc(`challenges/${event.params.challengeId}`).get();
      const theme = challengeDoc.data()?.theme || 'the challenge';

      const { title, body } = T.challenge_vote({ theme, voteCount: after.voteCount || 1 });
      await notifyUser(after.userId, {
        type: 'challenge_vote', title, body,
        data: { type: 'challenge_vote', challengeId: event.params.challengeId, click_action: '/challenge/feed' },
      });
    } catch (err) {
      console.error('[onChallengeEntryVoted]', err);
    }
  }
);

/**
 * Daily: if any challenge ends within the next 24 hours, push a voting reminder.
 * Runs every day at 09:00 IST (03:30 UTC).
 */
exports.challengeEndingReminder = onSchedule(
  { schedule: '30 3 * * *', timeZone: 'UTC', memory: '256MB' },
  async () => {
    try {
      const fs = getFirestore();
      const now = new Date();
      const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const snap = await fs.collection('challenges').where('isActive', '==', true).get();
      for (const doc of snap.docs) {
        const data = doc.data();
        const endTime = data.endTime ? new Date(data.endTime) : null;
        if (!endTime || endTime < now || endTime > in24h) continue;

        const entriesSnap = await fs
          .collection('challenges').doc(doc.id)
          .collection('entries').count().get();
        const entryCount = entriesSnap.data().count || 0;

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
  }
);

// ============================================================================
// WEEKLY QUIZ — activates every Monday 09:00 IST
// ============================================================================

function getWeekId(date = new Date()) {
  const w = getISOWeekNumber(date);
  return `${date.getFullYear()}-W${String(w).padStart(2, '0')}`;
}

exports.activateWeeklyQuiz = onSchedule(
  { schedule: '0 3 * * 1', timeZone: 'Asia/Kolkata', region: 'asia-south1' },
  async () => {
    const fs = getFirestore();
    const now = new Date();
    const weekId = getWeekId(now);

    try {
      const activeSnap = await fs.collection('weeklyQuiz').where('isActive', '==', true).get();
      const batch = fs.batch();
      for (const d of activeSnap.docs) batch.update(d.ref, { isActive: false });

      const existing = await fs.collection('weeklyQuiz').doc(weekId).get();
      if (existing.exists && existing.data().isActive) {
        await batch.commit();
        return;
      }

      const weekNum = getISOWeekNumber(now);
      const bankKey = `W${String(((weekNum - 1) % 8) + 1).padStart(2, '0')}`;
      const bankSnap = await fs.collection('quizBank').doc(bankKey).get();
      if (!bankSnap.exists) { await batch.commit(); return; }

      const bankData = bankSnap.data();
      const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      batch.set(fs.collection('weeklyQuiz').doc(weekId), {
        ...bankData, weekId, isActive: true,
        publishedAt: FieldValue.serverTimestamp(),
        expiresAt: expiresAt.toISOString(),
      });

      await batch.commit();
      console.log(`[Quiz] Activated "${bankData.title}" for ${weekId}`);
    } catch (err) {
      console.error('[Quiz]', err);
    }
  }
);

/** When weeklyQuiz isActive flips false→true, broadcast push to all quiz subscribers */
exports.notifyNewQuiz = onDocumentWritten('weeklyQuiz/{quizId}', async (event) => {
  try {
    const before = event.data?.before?.data();
    const after = event.data?.after?.data();
    if (!after?.isActive || before?.isActive === true) return null;

    const { title, body } = T.new_quiz({
      title: after.title || 'New Quiz',
      topic: after.topic || 'Pet Knowledge',
    });

    await writeBroadcastNotification(`quiz_${event.params.quizId}`, {
      type: 'new_quiz', title, body,
      data: { type: 'new_quiz', quizId: event.params.quizId, click_action: '/quiz' },
    });

    await admin.messaging().send({
      topic: 'new-quizzes',
      notification: { title, body },
      webpush: {
        notification: { icon: '/favicon.png', badge: '/favicon.png' },
        fcm_options: { link: `${BASE_URL}/quiz` },
      },
      data: { type: 'new_quiz', quizId: event.params.quizId, click_action: '/quiz' },
    });
  } catch (err) {
    console.error('[notifyNewQuiz]', err);
  }
});

// ============================================================================
// DAILY SCHEDULER — health reminders (push + email)
// Runs every day at 09:00 IST (03:30 UTC)
// Checks: vaccination (7d / 1d / overdue), birthday (today / tomorrow / 3d), health checkup
// ============================================================================

const EMAILJS_SERVICE_ID = 'service_zdt4u0q';
const EMAILJS_TEMPLATE_ID = 'template_pe8gs6o';
const EMAILJS_USER_ID = '9Ic6G_vwTk3Wl8Szu';
const EMAILJS_API_URL = 'https://api.emailjs.com/api/v1.0/email/send';

const EMAIL_STYLES = {
  container: 'font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb;',
  header:    'background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%); color: white; padding: 30px; text-align: center;',
  content:   'background: white; padding: 30px; border-radius: 10px; margin: 20px;',
  button:    'display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0;',
  footer:    'text-align: center; padding: 20px; color: #6b7280; font-size: 12px;',
  highlight: 'background-color: #f3e8ff; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #7c3aed;',
  petInfo:   'background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #f59e0b;',
};

async function sendEmailViaEmailJS(to_email, to_name, subject, htmlMessage) {
  try {
    const fetch = (await import('node-fetch')).default;
    const res = await fetch(EMAILJS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: EMAILJS_SERVICE_ID,
        template_id: EMAILJS_TEMPLATE_ID,
        user_id: EMAILJS_USER_ID,
        template_params: { to_email, to_name, from_name: 'Pawppy', subject, message: htmlMessage },
      }),
    });
    if (!res.ok) console.error(`[Email] Failed to ${to_email}:`, await res.text());
    return { success: res.ok };
  } catch (err) {
    console.error('[Email] Error:', err);
    return { success: false };
  }
}

exports.dailyEmailNotifications = onSchedule(
  { schedule: '30 3 * * *', timeZone: 'UTC', memory: '512MB' },
  async () => {
    const db = admin.database();
    const usersSnap = await db.ref('users').once('value');
    if (!usersSnap.exists()) return null;

    const users = usersSnap.val();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const d1 = new Date(today); d1.setDate(d1.getDate() + 1);   // tomorrow
    const d3 = new Date(today); d3.setDate(d3.getDate() + 3);   // 3 days
    const d7 = new Date(today); d7.setDate(d7.getDate() + 7);   // 7 days

    const sameDay = (a, b) => a.toISOString().slice(0, 10) === b.toISOString().slice(0, 10);
    const dedupeKey = (type, petId, suffix = '') =>
      `${type}_${petId}${suffix}_${today.toISOString().slice(0, 10)}`;

    let sent = 0;

    for (const [userId, userData] of Object.entries(users)) {
      if (!userData.pets) continue;
      const userName = userData.displayName || 'there';

      for (const [petId, petData] of Object.entries(userData.pets)) {
        const petName = petData.name || 'your pet';

        // ── Vaccinations ──────────────────────────────────────────────────────
        for (const vac of Object.values(petData.vaccinations || {})) {
          if (!vac.nextDue) continue;
          const due = new Date(vac.nextDue);
          const dueStr = fmtDate(due);

          if (sameDay(due, d7)) {
            // Push
            const { title, body } = T.vacc_7d({ petName, vaccineName: vac.name, dueDate: dueStr });
            await notifyUser(userId, { type: 'vacc_7d', title, body, data: { petId, click_action: '/profile?tab=pets' } });
            // Email
            if (userData.email) { await sendVaccinationEmail(userData, petData, vac); sent++; }

          } else if (sameDay(due, d1)) {
            const { title, body } = T.vacc_1d({ petName, vaccineName: vac.name, dueDate: dueStr });
            await notifyUser(userId, { type: 'vacc_1d', title, body, data: { petId, click_action: '/profile?tab=pets' } });

          } else if (due < today) {
            const key = dedupeKey('vacc_overdue', petId, vac.name?.replace(/\s/g, '_'));
            const already = await db.ref(`notificationsSent/${userId}/${key}`).once('value');
            if (!already.exists()) {
              const { title, body } = T.vacc_overdue({ petName, vaccineName: vac.name, dueDate: dueStr });
              await notifyUser(userId, { type: 'vacc_overdue', title, body, data: { petId, click_action: '/profile?tab=pets' } });
              await db.ref(`notificationsSent/${userId}/${key}`).set({ sentAt: Date.now(), type: 'vacc_overdue', petId });
            }
          }
        }

        // ── Birthday ─────────────────────────────────────────────────────────
        if (petData.dateOfBirth) {
          const birth = new Date(petData.dateOfBirth);
          const thisYear = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
          const age = today.getFullYear() - birth.getFullYear();

          if (sameDay(thisYear, today)) {
            const { title, body } = T.birthday_today({ petName, age });
            await notifyUser(userId, { type: 'birthday_today', title, body, data: { petId, click_action: '/profile?tab=pets' } });
            sent++;
          } else if (sameDay(thisYear, d1)) {
            const { title, body } = T.birthday_tomorrow({ petName, age });
            await notifyUser(userId, { type: 'birthday_tomorrow', title, body, data: { petId, click_action: '/profile?tab=pets' } });
          } else if (sameDay(thisYear, d3)) {
            const { title, body } = T.birthday_3d({ petName, age });
            await notifyUser(userId, { type: 'birthday_3d', title, body, data: { petId, click_action: '/profile?tab=pets' } });
            if (userData.email) { await sendBirthdayEmail(userData, petData); sent++; }
          }
        }

        // ── Health Checkup ───────────────────────────────────────────────────
        const sixMonthsAgo = new Date(today); sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const lastCheckup = petData.lastCheckup ? new Date(petData.lastCheckup) : null;
        if (!lastCheckup || lastCheckup < sixMonthsAgo) {
          const key = dedupeKey('healthCheckup', petId);
          const already = await db.ref(`notificationsSent/${userId}/${key}`).once('value');
          if (!already.exists()) {
            const { title, body } = T.health_checkup({ petName });
            await notifyUser(userId, { type: 'health_checkup', title, body, data: { petId, click_action: '/profile?tab=pets' } });
            if (userData.email) { await sendHealthCheckupEmail(userData, petData); sent++; }
            await db.ref(`notificationsSent/${userId}/${key}`).set({ sentAt: Date.now(), type: 'healthCheckup', petId });
          }
        }
      }
    }

    console.log(`[dailyNotifications] Done. Emails sent: ${sent}`);
    return { success: true, sent };
  }
);

// ============================================================================
// WEEKLY SCHEDULER — activity digest (email)
// ============================================================================

exports.weeklyEmailNotifications = onSchedule(
  { schedule: '30 3 * * 1', timeZone: 'UTC', memory: '512MB' },
  async () => {
    const db = admin.database();
    const usersSnap = await db.ref('users').once('value');
    if (!usersSnap.exists()) return null;

    const users = usersSnap.val();
    let sent = 0;
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    for (const [userId, userData] of Object.entries(users)) {
      if (!userData.email) continue;
      const digestData = await getUserWeeklyActivity(db, userId, oneWeekAgo);
      if (digestData.newRequests > 0 || digestData.newMessages > 0 || digestData.upcomingReminders.length > 0) {
        await sendWeeklyDigestEmail(userData, digestData);
        sent++;
      }
    }

    console.log(`[weeklyNotifications] Sent ${sent} digests`);
    return { success: true, sent };
  }
);

// ============================================================================
// EMAIL HELPER FUNCTIONS
// ============================================================================

async function sendVaccinationEmail(userData, petData, vaccination) {
  const dueDate = new Date(vaccination.nextDue).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const html = `
    <div style="${EMAIL_STYLES.container}">
      <div style="${EMAIL_STYLES.header}"><h1 style="margin:0;font-size:28px;">💉 Vaccination Reminder</h1></div>
      <div style="${EMAIL_STYLES.content}">
        <h2 style="color:#7c3aed;">Hi ${userData.displayName}! 👋</h2>
        <p style="font-size:16px;line-height:1.6;color:#374151;">
          <strong>${petData.name}</strong> has an upcoming vaccination due soon!
        </p>
        <div style="${EMAIL_STYLES.petInfo}">
          <h3 style="margin-top:0;color:#f59e0b;">🐕 Pet Information</h3>
          <p style="margin:5px 0;"><strong>Name:</strong> ${petData.name}</p>
          <p style="margin:5px 0;"><strong>Breed:</strong> ${petData.breed || 'Not specified'}</p>
        </div>
        <div style="${EMAIL_STYLES.highlight}">
          <h3 style="margin-top:0;color:#dc2626;">⚠️ Vaccination Details</h3>
          <p style="margin:5px 0;font-size:16px;"><strong>Vaccine:</strong> ${vaccination.name}</p>
          <p style="margin:5px 0;font-size:16px;"><strong>Due Date:</strong> ${dueDate}</p>
        </div>
        <div style="text-align:center;">
          <a href="${BASE_URL}/profile?tab=pets" style="${EMAIL_STYLES.button}">View Pet Profile →</a>
        </div>
      </div>
      <div style="${EMAIL_STYLES.footer}"><p>Pawppy — Never miss important pet care dates</p><p>© 2025 Pawppy. All rights reserved.</p></div>
    </div>`;
  return sendEmailViaEmailJS(
    userData.email, userData.displayName,
    `💉 Vaccination Reminder: ${vaccination.name} due for ${petData.name}`, html,
  );
}

async function sendBirthdayEmail(userData, petData) {
  const birthDate = new Date(petData.dateOfBirth);
  const age = new Date().getFullYear() - birthDate.getFullYear();
  const html = `
    <div style="${EMAIL_STYLES.container}">
      <div style="${EMAIL_STYLES.header}"><h1 style="margin:0;font-size:28px;">🎂 Birthday Reminder!</h1></div>
      <div style="${EMAIL_STYLES.content}">
        <h2 style="color:#7c3aed;">Hi ${userData.displayName}! 👋</h2>
        <p style="font-size:16px;line-height:1.6;color:#374151;">
          <strong>${petData.name}</strong>'s birthday is coming up in 3 days!
        </p>
        <div style="${EMAIL_STYLES.petInfo}">
          <h3 style="margin-top:0;color:#f59e0b;">🐕 ${petData.name} is turning ${age}!</h3>
          <p>Birthday: ${birthDate.toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</p>
        </div>
        <div style="${EMAIL_STYLES.highlight}">
          <p>🎉 Plan something special — extra treats, a new toy, or a birthday photoshoot!</p>
        </div>
        <div style="text-align:center;">
          <a href="${BASE_URL}/profile?tab=pets" style="${EMAIL_STYLES.button}">View ${petData.name}'s Profile →</a>
        </div>
      </div>
      <div style="${EMAIL_STYLES.footer}"><p>Pawppy — Your pet's lifelong companion app</p></div>
    </div>`;
  return sendEmailViaEmailJS(
    userData.email, userData.displayName,
    `🎂 Birthday Reminder: ${petData.name} turns ${age} in 3 days!`, html,
  );
}

async function sendHealthCheckupEmail(userData, petData) {
  const html = `
    <div style="${EMAIL_STYLES.container}">
      <div style="${EMAIL_STYLES.header}"><h1 style="margin:0;font-size:28px;">🏥 Vet Visit Reminder</h1></div>
      <div style="${EMAIL_STYLES.content}">
        <h2 style="color:#7c3aed;">Hi ${userData.displayName}! 👋</h2>
        <p style="font-size:16px;line-height:1.6;color:#374151;">
          <strong>${petData.name}</strong> is due for a health checkup!
        </p>
        <div style="${EMAIL_STYLES.highlight}">
          <h3 style="margin-top:0;color:#dc2626;">⚠️ It's been 6+ months since the last vet visit</h3>
          <p>Regular checkups catch health issues early and keep your pet thriving.</p>
        </div>
        <div style="text-align:center;">
          <a href="${BASE_URL}/profile?tab=pets" style="${EMAIL_STYLES.button}">Update Health Records →</a>
        </div>
      </div>
      <div style="${EMAIL_STYLES.footer}"><p>Pawppy — Your pet's health companion</p></div>
    </div>`;
  return sendEmailViaEmailJS(
    userData.email, userData.displayName,
    `🏥 Health Checkup Overdue for ${petData.name}`, html,
  );
}

async function sendWeeklyDigestEmail(userData, digestData) {
  const remindersHtml = digestData.upcomingReminders
    .map((r) => `<li style="margin:5px 0;">${r.emoji} <strong>${r.petName}</strong> — ${r.text}</li>`)
    .join('');
  const html = `
    <div style="${EMAIL_STYLES.container}">
      <div style="${EMAIL_STYLES.header}"><h1 style="margin:0;font-size:28px;">🐾 Your Weekly Pawppy Digest</h1></div>
      <div style="${EMAIL_STYLES.content}">
        <h2 style="color:#7c3aed;">Hi ${userData.displayName}! 👋</h2>
        <p>Here's what happened on Pawppy this week:</p>
        ${digestData.newRequests > 0 ? `
        <div style="${EMAIL_STYLES.petInfo}">
          <h3 style="margin-top:0;color:#f59e0b;">💕 Mating Requests</h3>
          <p>${digestData.newRequests} new request${digestData.newRequests !== 1 ? 's' : ''} this week</p>
        </div>` : ''}
        ${digestData.newMessages > 0 ? `
        <div style="${EMAIL_STYLES.highlight}">
          <h3 style="margin-top:0;color:#7c3aed;">💬 Messages</h3>
          <p>${digestData.newMessages} new message${digestData.newMessages !== 1 ? 's' : ''} this week</p>
        </div>` : ''}
        ${remindersHtml ? `
        <div style="background:#f0fdf4;padding:15px;border-radius:8px;border-left:4px solid #22c55e;margin:15px 0;">
          <h3 style="margin-top:0;color:#16a34a;">📅 Upcoming Reminders</h3>
          <ul style="padding-left:20px;">${remindersHtml}</ul>
        </div>` : ''}
        <div style="text-align:center;">
          <a href="${BASE_URL}" style="${EMAIL_STYLES.button}">Open Pawppy →</a>
        </div>
      </div>
      <div style="${EMAIL_STYLES.footer}"><p>Pawppy — India's #1 Pet Community App</p></div>
    </div>`;
  return sendEmailViaEmailJS(
    userData.email, userData.displayName, '🐾 Your Weekly Pawppy Digest', html,
  );
}

async function getUserWeeklyActivity(db, userId, sinceTimestamp) {
  const [requestsSnap, conversationsSnap, petsSnap] = await Promise.all([
    db.ref(`matingRequests/received/${userId}`).orderByChild('timestamp').startAt(sinceTimestamp).once('value'),
    db.ref('conversations').orderByChild(`participants/${userId}`).equalTo(true).once('value'),
    db.ref(`users/${userId}/pets`).once('value'),
  ]);

  const newRequests = requestsSnap.exists() ? Object.keys(requestsSnap.val() || {}).length : 0;

  let newMessages = 0;
  if (conversationsSnap.exists()) {
    for (const [convoId] of Object.entries(conversationsSnap.val() || {})) {
      const msgSnap = await db.ref(`conversations/${convoId}/messages`)
        .orderByChild('timestamp').startAt(sinceTimestamp).once('value');
      if (msgSnap.exists()) newMessages += Object.keys(msgSnap.val() || {}).length;
    }
  }

  const upcomingReminders = [];
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const in7d = new Date(today); in7d.setDate(in7d.getDate() + 7);

  if (petsSnap.exists()) {
    for (const petData of Object.values(petsSnap.val() || {})) {
      for (const vac of Object.values(petData.vaccinations || {})) {
        if (!vac.nextDue) continue;
        const due = new Date(vac.nextDue);
        if (due >= today && due <= in7d) {
          upcomingReminders.push({ petName: petData.name, emoji: '💉', text: `${vac.name} due ${fmtDate(due)}` });
        }
      }
      if (petData.dateOfBirth) {
        const birth = new Date(petData.dateOfBirth);
        const bday = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
        if (bday >= today && bday <= in7d) {
          upcomingReminders.push({ petName: petData.name, emoji: '🎂', text: `Birthday on ${fmtDate(bday)}` });
        }
      }
    }
  }

  return { newRequests, newMessages, upcomingReminders };
}
