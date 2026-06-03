const {
  FieldValue,
  Timestamp,
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
    const { db } = getServices();
    const { action, coupon } = parseJsonBody(event);

    if (!action) return jsonResponse(400, event, { error: 'action is required.' });

    if (action === 'create') {
      const code = String(coupon?.code || '').trim().toUpperCase();
      if (!code) return jsonResponse(400, event, { error: 'Coupon code is required.' });
      if (!['percent', 'fixed'].includes(coupon?.type)) return jsonResponse(400, event, { error: 'type must be percent or fixed.' });
      if (!Number(coupon?.value) || Number(coupon?.value) <= 0) return jsonResponse(400, event, { error: 'value must be positive.' });

      const couponRef = db.doc(`coupons/${code}`);
      const existing = await couponRef.get();
      if (existing.exists) return jsonResponse(409, event, { error: 'A coupon with this code already exists.' });

      const doc = {
        code,
        type: coupon.type,
        value: Number(coupon.value),
        minOrderAmount: Number(coupon.minOrderAmount || 0),
        maxDiscountAmount: Number(coupon.maxDiscountAmount || 0),
        maxUses: Number(coupon.maxUses || 0),
        usedCount: 0,
        description: String(coupon.description || '').trim(),
        vendorId: coupon.vendorId || null,
        active: true,
        expiresAt: coupon.expiresAt ? Timestamp.fromDate(new Date(coupon.expiresAt)) : null,
        createdBy: decoded.uid,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };
      await couponRef.set(doc);
      return jsonResponse(200, event, { code, coupon: doc });
    }

    if (action === 'deactivate') {
      const code = String(coupon?.code || '').trim().toUpperCase();
      if (!code) return jsonResponse(400, event, { error: 'code is required.' });
      await db.doc(`coupons/${code}`).update({ active: false, updatedAt: FieldValue.serverTimestamp() });
      return jsonResponse(200, event, { code, active: false });
    }

    if (action === 'activate') {
      const code = String(coupon?.code || '').trim().toUpperCase();
      if (!code) return jsonResponse(400, event, { error: 'code is required.' });
      await db.doc(`coupons/${code}`).update({ active: true, updatedAt: FieldValue.serverTimestamp() });
      return jsonResponse(200, event, { code, active: true });
    }

    if (action === 'delete') {
      const code = String(coupon?.code || '').trim().toUpperCase();
      if (!code) return jsonResponse(400, event, { error: 'code is required.' });
      await db.doc(`coupons/${code}`).delete();
      return jsonResponse(200, event, { code, deleted: true });
    }

    return jsonResponse(400, event, { error: `Unknown action: ${action}` });
  } catch (error) {
    console.error('[commerce-manage-coupon]', error);
    return jsonResponse(error.statusCode || 500, event, { error: error.message });
  }
};
