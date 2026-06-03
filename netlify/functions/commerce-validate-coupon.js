const {
  getServices,
  handleOptions,
  jsonResponse,
  parseJsonBody,
  requireAuth,
} = require('./_commerce-utils');

function money(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

exports.handler = async (event) => {
  const options = handleOptions(event);
  if (options) return options;
  if (event.httpMethod !== 'POST') return jsonResponse(405, event, { error: 'Method not allowed' });

  try {
    await requireAuth(event);
    const { db } = getServices();
    const { code, cartSubtotal = 0 } = parseJsonBody(event);
    if (!code || !String(code).trim()) {
      return jsonResponse(400, event, { error: 'Coupon code is required.' });
    }

    const normalizedCode = String(code).trim().toUpperCase();
    const couponSnap = await db.doc(`coupons/${normalizedCode}`).get();

    if (!couponSnap.exists) return jsonResponse(404, event, { error: 'Coupon code not found.' });

    const coupon = couponSnap.data();

    if (!coupon.active) return jsonResponse(409, event, { error: 'This coupon is no longer active.' });

    if (coupon.expiresAt && coupon.expiresAt.toMillis() < Date.now()) {
      return jsonResponse(409, event, { error: 'This coupon has expired.' });
    }

    if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
      return jsonResponse(409, event, { error: 'This coupon has reached its usage limit.' });
    }

    const minOrder = Number(coupon.minOrderAmount || 0);
    if (cartSubtotal < minOrder) {
      return jsonResponse(409, event, { error: `Minimum order of ₹${minOrder} required for this coupon.` });
    }

    let discount = 0;
    if (coupon.type === 'percent') {
      discount = money(cartSubtotal * (Number(coupon.value) / 100));
      if (coupon.maxDiscountAmount > 0) discount = Math.min(discount, Number(coupon.maxDiscountAmount));
    } else {
      discount = Math.min(money(coupon.value), cartSubtotal);
    }

    return jsonResponse(200, event, {
      valid: true,
      code: normalizedCode,
      discount,
      type: coupon.type,
      value: coupon.value,
      description: coupon.description || '',
    });
  } catch (error) {
    console.error('[commerce-validate-coupon]', error);
    return jsonResponse(error.statusCode || 500, event, { error: error.message });
  }
};
