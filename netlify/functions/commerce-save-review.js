const {
  FieldValue,
  Timestamp,
  getServices,
  handleOptions,
  jsonResponse,
  parseJsonBody,
  requireAuth,
} = require('./_commerce-utils');

exports.handler = async (event) => {
  const options = handleOptions(event);
  if (options) return options;
  if (event.httpMethod !== 'POST') return jsonResponse(405, event, { error: 'Method not allowed' });

  try {
    const decoded = await requireAuth(event);
    const { db, auth } = getServices();
    const { productId, orderId, rating, title = '', body: reviewBody = '' } = parseJsonBody(event);

    if (!productId) return jsonResponse(400, event, { error: 'productId is required.' });
    if (!orderId) return jsonResponse(400, event, { error: 'orderId is required.' });
    const ratingNum = Math.round(Number(rating));
    if (!ratingNum || ratingNum < 1 || ratingNum > 5) {
      return jsonResponse(400, event, { error: 'Rating must be between 1 and 5.' });
    }

    // Verify the order belongs to this user, contains this product, and is delivered
    const orderSnap = await db.doc(`orders/${orderId}`).get();
    if (!orderSnap.exists) return jsonResponse(404, event, { error: 'Order not found.' });
    const order = orderSnap.data();
    if (order.userId !== decoded.uid) return jsonResponse(403, event, { error: 'You can only review products from your own orders.' });
    if (order.fulfillmentStatus !== 'delivered') return jsonResponse(409, event, { error: 'You can only review products from delivered orders.' });
    const hasProduct = (order.items || []).some((item) => item.productId === productId);
    if (!hasProduct) return jsonResponse(409, event, { error: 'This product is not in the specified order.' });

    // Check for duplicate review
    const existingSnap = await db.collection('reviews')
      .where('productId', '==', productId)
      .where('userId', '==', decoded.uid)
      .limit(1)
      .get();
    if (!existingSnap.empty) return jsonResponse(409, event, { error: 'You have already reviewed this product.' });

    // Get user display info
    let userRecord = null;
    try { userRecord = await auth.getUser(decoded.uid); } catch (_) {}
    const userName = userRecord?.displayName || decoded.name || 'Pawppy user';
    const userPhoto = userRecord?.photoURL || '';

    // Create review + update product rating in transaction
    const reviewRef = db.collection('reviews').doc();
    const productRef = db.doc(`products/${productId}`);

    await db.runTransaction(async (transaction) => {
      const productSnap = await transaction.get(productRef);
      if (!productSnap.exists) throw Object.assign(new Error('Product not found.'), { statusCode: 404 });
      const product = productSnap.data();

      const currentCount = Number(product.reviewCount || 0);
      const currentAvg = Number(product.avgRating || 0);
      const newCount = currentCount + 1;
      const newAvg = Math.round(((currentAvg * currentCount + ratingNum) / newCount) * 10) / 10;

      transaction.set(reviewRef, {
        productId,
        orderId,
        userId: decoded.uid,
        userName,
        userPhoto,
        rating: ratingNum,
        title: String(title).trim().slice(0, 120),
        body: String(reviewBody).trim().slice(0, 1000),
        status: 'published',
        createdAt: FieldValue.serverTimestamp(),
      });

      transaction.update(productRef, {
        reviewCount: newCount,
        avgRating: newAvg,
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    return jsonResponse(200, event, { reviewId: reviewRef.id, success: true });
  } catch (error) {
    console.error('[commerce-save-review]', error);
    return jsonResponse(error.statusCode || 500, event, { error: error.message });
  }
};
