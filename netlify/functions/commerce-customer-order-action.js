const {
  FieldValue,
  Timestamp,
  getServices,
  handleOptions,
  jsonResponse,
  parseJsonBody,
  requireAuth,
  writeUserNotification,
} = require('./_commerce-utils');

async function restockOrderItems(transaction, db, order) {
  for (const item of (order.items || [])) {
    const productRef = db.doc(`products/${item.productId}`);
    const productSnap = await transaction.get(productRef);
    if (!productSnap.exists) continue;
    const product = productSnap.data();
    if (!product.inventory?.trackInventory) continue;

    if (item.variantId) {
      const variants = (product.variants || []).map((v) =>
        v.id === item.variantId
          ? { ...v, quantity: Math.max(0, (Number(v.quantity) || 0) + item.quantity) }
          : v
      );
      transaction.update(productRef, { variants, updatedAt: FieldValue.serverTimestamp() });
    } else {
      transaction.update(productRef, {
        'inventory.quantity': FieldValue.increment(item.quantity),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
  }
}

exports.handler = async (event) => {
  const options = handleOptions(event);
  if (options) return options;
  if (event.httpMethod !== 'POST') return jsonResponse(405, event, { error: 'Method not allowed' });

  try {
    const decoded = await requireAuth(event);
    const { db } = getServices();
    const { orderId, action, reason = '' } = parseJsonBody(event);
    if (!orderId || !['cancel', 'return'].includes(action)) {
      return jsonResponse(400, event, { error: 'Valid orderId and action are required.' });
    }

    const orderRef = db.doc(`orders/${orderId}`);

    if (action === 'cancel') {
      await db.runTransaction(async (transaction) => {
        const orderSnap = await transaction.get(orderRef);
        if (!orderSnap.exists) throw Object.assign(new Error('Order not found.'), { statusCode: 404 });
        const order = orderSnap.data();
        if (order.userId !== decoded.uid) throw Object.assign(new Error('You can only update your own order.'), { statusCode: 403 });
        if (!['unfulfilled', 'processing'].includes(order.fulfillmentStatus)) {
          throw Object.assign(new Error('This order can no longer be cancelled from the app.'), { statusCode: 409 });
        }

        await restockOrderItems(transaction, db, order);

        transaction.update(orderRef, {
          fulfillmentStatus: 'cancelled',
          cancellation: { reason, requestedBy: decoded.uid, requestedAt: Timestamp.now() },
          statusHistory: FieldValue.arrayUnion({
            from: order.fulfillmentStatus || null,
            to: 'cancelled',
            note: reason,
            changedBy: decoded.uid,
            changedAt: Timestamp.now(),
          }),
          updatedAt: FieldValue.serverTimestamp(),
        });
      });
    } else {
      const orderSnap = await orderRef.get();
      if (!orderSnap.exists) return jsonResponse(404, event, { error: 'Order not found.' });
      const order = orderSnap.data();
      if (order.userId !== decoded.uid) return jsonResponse(403, event, { error: 'You can only update your own order.' });
      if (order.fulfillmentStatus !== 'delivered') {
        return jsonResponse(409, event, { error: 'Returns can be requested after delivery.' });
      }
      await orderRef.update({
        returnRequests: FieldValue.arrayUnion({
          reason,
          status: 'requested',
          requestedBy: decoded.uid,
          requestedAt: Timestamp.now(),
        }),
        statusHistory: FieldValue.arrayUnion({
          from: order.fulfillmentStatus || null,
          to: 'return_requested',
          note: reason,
          changedBy: decoded.uid,
          changedAt: Timestamp.now(),
        }),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    await writeUserNotification(decoded.uid, {
      type: 'commerce_order',
      title: action === 'cancel' ? 'Order cancelled' : 'Return requested',
      body: action === 'cancel'
        ? 'Your order has been cancelled and inventory released.'
        : 'Your return request has been submitted.',
      data: { type: 'commerce_order', orderId, click_action: `/orders/${orderId}` },
    });

    return jsonResponse(200, event, { success: true });
  } catch (error) {
    console.error('[commerce-customer-order-action]', error);
    return jsonResponse(error.statusCode || 500, event, { error: error.message });
  }
};
