const {
  COMMERCE_ADMIN_EMAIL,
  FieldValue,
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
    const email = (decoded.email || '').toLowerCase();
    if (email !== COMMERCE_ADMIN_EMAIL) {
      return jsonResponse(403, event, { error: 'Only the configured Pawppy admin can provision admin access.' });
    }

    const { auth, db } = getServices();
    const userRecord = await auth.getUser(decoded.uid);

    const existingClaims = userRecord.customClaims || {};
    await auth.setCustomUserClaims(decoded.uid, {
      ...existingClaims,
      role: 'admin',
      admin: true,
    });
    await db.doc(`users/${decoded.uid}`).set({
      role: 'admin',
      displayName: userRecord.displayName || userRecord.email?.split('@')[0] || '',
      email: userRecord.email || '',
      phone: userRecord.phoneNumber || '',
      photoURL: userRecord.photoURL || '',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    return jsonResponse(200, event, { success: true, role: 'admin' });
  } catch (error) {
    console.error('[commerce-provision-admin]', error);
    return jsonResponse(error.statusCode || 500, event, { error: error.message });
  }
};
