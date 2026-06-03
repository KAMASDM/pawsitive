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

const FULFILLMENT_STATUSES = [
  'unfulfilled', 'processing', 'shipped', 'delivered',
  'cancelled', 'return_approved', 'return_completed',
];

const STATUS_LABELS = {
  unfulfilled: 'Order placed',
  processing: 'Order processing',
  shipped: 'Order shipped',
  delivered: 'Order delivered',
  cancelled: 'Order cancelled',
  return_approved: 'Return approved',
  return_completed: 'Return completed',
};

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
    const { orderId, vendorId, fulfillmentStatus, note = '' } = parseJsonBody(event);
    if (!orderId || !FULFILLMENT_STATUSES.includes(fulfillmentStatus)) {
      return jsonResponse(400, event, { error: 'Valid orderId and fulfillmentStatus are required.' });
    }

    const orderRef = db.doc(`orders/${orderId}`);
    const orderSnap = await orderRef.get();
    if (!orderSnap.exists) return jsonResponse(404, event, { error: 'Order not found.' });
    const order = orderSnap.data();
    const isAdmin = decoded.role === 'admin' || decoded.email === 'anantsoftcomputing@gmail.com';
    const actorVendorId = decoded.vendorId;
    const targetVendorId = vendorId || actorVendorId;

    if (!isAdmin && (!targetVendorId || !order.vendorIds?.includes(targetVendorId))) {
      return jsonResponse(403, event, { error: 'You can only update orders for your vendor account.' });
    }

    const historyItem = {
      from: order.fulfillmentStatus || null,
      to: fulfillmentStatus,
      note,
      changedBy: decoded.uid,
      changedAt: Timestamp.now(),
    };

    await db.runTransaction(async (transaction) => {
      if (fulfillmentStatus === 'return_completed') {
        const freshSnap = await transaction.get(orderRef);
        await restockOrderItems(transaction, db, freshSnap.data());
      }

      if (targetVendorId && !isAdmin) {
        transaction.update(orderRef.collection('subOrders').doc(targetVendorId), {
          fulfillmentStatus,
          statusHistory: FieldValue.arrayUnion(historyItem),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }

      transaction.update(orderRef, {
        fulfillmentStatus,
        statusHistory: FieldValue.arrayUnion(historyItem),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    const notifBody = note || `${order.orderNumber} is now ${(STATUS_LABELS[fulfillmentStatus] || fulfillmentStatus).toLowerCase()}.`;
    await writeUserNotification(order.userId, {
      type: 'commerce_order',
      title: STATUS_LABELS[fulfillmentStatus] || fulfillmentStatus,
      body: notifBody,
      data: { type: 'commerce_order', orderId, click_action: `/orders/${orderId}` },
    });

    return jsonResponse(200, event, { success: true, orderId, fulfillmentStatus });
  } catch (error) {
    console.error('[commerce-update-order-status]', error);
    return jsonResponse(error.statusCode || 500, event, { error: error.message });
  }
};
