const {
  FieldValue,
  Timestamp,
  getServices,
  handleOptions,
  jsonResponse,
  requireAuth,
} = require('./_commerce-utils');

exports.handler = async (event) => {
  const options = handleOptions(event);
  if (options) return options;
  if (event.httpMethod !== 'POST') return jsonResponse(405, event, { error: 'Method not allowed' });

  try {
    const decoded = await requireAuth(event);
    const { auth, db } = getServices();
    const uid = decoded.uid;
    const userRecord = await auth.getUser(uid);
    const userRef = db.doc(`users/${uid}`);
    const existingUser = await userRef.get();
    const existingVendorId = existingUser.data()?.vendorId || decoded.vendorId;

    if (existingVendorId) {
      return jsonResponse(200, event, { vendorId: existingVendorId, status: 'existing' });
    }

    const vendorRef = db.collection('vendors').doc();
    const vendorId = vendorRef.id;
    const historyItem = {
      from: null,
      to: 'pending',
      note: 'Vendor registration started.',
      changedBy: uid,
      changedAt: Timestamp.now(),
    };

    await db.runTransaction(async (transaction) => {
      transaction.set(vendorRef, {
        ownerUid: uid,
        businessName: '',
        legalName: '',
        ownerName: userRecord.displayName || '',
        email: userRecord.email || '',
        phone: userRecord.phoneNumber || '',
        gstin: '',
        pan: '',
        address: {
          line1: '',
          line2: '',
          city: '',
          state: '',
          pincode: '',
          country: 'India',
        },
        categories: [],
        description: '',
        logoUrl: '',
        bannerUrl: '',
        website: '',
        socials: {},
        documents: [],
        status: 'pending',
        statusHistory: [historyItem],
        bankDetails: {
          accountName: '',
          accountNumber: '',
          ifsc: '',
        },
        productCount: 0,
        orderCount: 0,
        rating: 0,
        approvedAt: null,
        approvedBy: null,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      transaction.set(userRef, {
        role: 'vendor',
        displayName: userRecord.displayName || userRecord.email?.split('@')[0] || '',
        email: userRecord.email || '',
        phone: userRecord.phoneNumber || '',
        photoURL: userRecord.photoURL || '',
        vendorId,
        createdAt: existingUser.exists ? existingUser.data().createdAt : FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
    });

    const existingClaims = userRecord.customClaims || {};
    await auth.setCustomUserClaims(uid, {
      ...existingClaims,
      role: 'vendor',
      vendorId,
    });

    return jsonResponse(200, event, { vendorId, status: 'created' });
  } catch (error) {
    console.error('[commerce-request-vendor-role]', error);
    return jsonResponse(error.statusCode || 500, event, { error: error.message });
  }
};
