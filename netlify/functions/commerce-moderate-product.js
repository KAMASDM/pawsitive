const {
  FieldValue,
  getServices,
  handleOptions,
  jsonResponse,
  parseJsonBody,
  requireAdmin,
  requireAuth,
} = require('./_commerce-utils');

exports.handler = async (event) => {
  const options = handleOptions(event);
  if (options) return options;
  if (event.httpMethod !== 'POST') return jsonResponse(405, event, { error: 'Method not allowed' });

  try {
    const decoded = await requireAuth(event);
    requireAdmin(decoded);
    const { productId, status, moderationStatus = 'approved', note = '' } = parseJsonBody(event);
    if (!productId || !['active', 'archived', 'draft', 'out_of_stock'].includes(status)) {
      return jsonResponse(400, event, { error: 'Valid productId and status are required.' });
    }
    const { db } = getServices();
    await db.doc(`products/${productId}`).update({
      status,
      moderation: {
        status: moderationStatus,
        note,
        reviewedBy: decoded.uid,
        reviewedAt: FieldValue.serverTimestamp(),
      },
      updatedAt: FieldValue.serverTimestamp(),
    });
    return jsonResponse(200, event, { success: true, productId, status });
  } catch (error) {
    console.error('[commerce-moderate-product]', error);
    return jsonResponse(error.statusCode || 500, event, { error: error.message });
  }
};
