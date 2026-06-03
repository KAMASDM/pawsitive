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

function money(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function cleanAddress(address = {}) {
  const required = ['name', 'phone', 'line1', 'city', 'state', 'pincode'];
  for (const key of required) {
    if (!String(address[key] || '').trim()) {
      throw Object.assign(new Error(`Shipping ${key} is required.`), { statusCode: 400 });
    }
  }
  return {
    name: String(address.name || '').trim(),
    phone: String(address.phone || '').trim(),
    line1: String(address.line1 || '').trim(),
    line2: String(address.line2 || '').trim(),
    city: String(address.city || '').trim(),
    state: String(address.state || '').trim(),
    pincode: String(address.pincode || '').trim(),
    country: 'India',
  };
}

async function nextOrderNumber(transaction, db) {
  const year = new Date().getFullYear();
  const counterRef = db.doc(`commerceCounters/orders-${year}`);
  const counterSnap = await transaction.get(counterRef);
  const next = (counterSnap.exists ? Number(counterSnap.data().last || 0) : 0) + 1;
  transaction.set(counterRef, { last: next, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  return `PW-${year}-${String(next).padStart(6, '0')}`;
}

function resolveShippingFee(shippingSettings, vendorSubtotal, customerState) {
  const zones = Array.isArray(shippingSettings?.shippingZones) ? shippingSettings.shippingZones : [];
  const normalizedState = (customerState || '').toLowerCase().trim();
  const matchedZone = zones.find((z) =>
    Array.isArray(z.states) && z.states.some((s) => s.toLowerCase().trim() === normalizedState)
  );
  const settings = matchedZone || shippingSettings || {};
  const freeOver = Number(settings.freeShippingOver ?? 999);
  const flatFee = Number(settings.flatFee ?? 49);
  return vendorSubtotal >= freeOver ? 0 : flatFee;
}

function calcGstBreakdown(lineTotal, taxRatePct, vendorState, customerState) {
  const rate = Number(taxRatePct || 0);
  const taxAmount = money(lineTotal * (rate / 100));
  const isIntraState =
    vendorState && customerState &&
    vendorState.toLowerCase().trim() === customerState.toLowerCase().trim();

  if (isIntraState) {
    const half = money(taxAmount / 2);
    return { cgst: half, sgst: half, igst: 0, total: money(half + half) };
  }
  return { cgst: 0, sgst: 0, igst: taxAmount, total: taxAmount };
}

exports.handler = async (event) => {
  const options = handleOptions(event);
  if (options) return options;
  if (event.httpMethod !== 'POST') return jsonResponse(405, event, { error: 'Method not allowed' });

  try {
    const decoded = await requireAuth(event);
    const { db } = getServices();
    const body = parseJsonBody(event);
    const shippingAddress = cleanAddress(body.shippingAddress);
    const couponCode = body.couponCode ? String(body.couponCode).trim().toUpperCase() : null;
    const cartId = decoded.uid;
    const cartRef = db.doc(`carts/${cartId}`);
    const orderRef = db.collection('orders').doc();
    let createdOrder = null;

    await db.runTransaction(async (transaction) => {
      const cartSnap = await transaction.get(cartRef);
      if (!cartSnap.exists || cartSnap.data().status !== 'active') {
        throw Object.assign(new Error('Your cart is empty.'), { statusCode: 400 });
      }

      const cart = cartSnap.data();
      const cartItems = Array.isArray(cart.items) ? cart.items.filter((item) => Number(item.quantity) > 0) : [];
      if (cartItems.length === 0) throw Object.assign(new Error('Your cart is empty.'), { statusCode: 400 });

      const productRefs = cartItems.map((item) => db.doc(`products/${item.productId}`));
      const productSnaps = await Promise.all(productRefs.map((ref) => transaction.get(ref)));
      const items = [];
      const vendorIds = new Set();
      let subtotal = 0;
      let totalCgst = 0;
      let totalSgst = 0;
      let totalIgst = 0;

      // Load vendor states for GST calc (deferred until we know vendor IDs)
      const vendorStateCache = {};

      productSnaps.forEach((productSnap, index) => {
        if (!productSnap.exists) throw Object.assign(new Error('One product in your cart is no longer available.'), { statusCode: 400 });
        const product = productSnap.data();
        const requested = cartItems[index];
        if (product.status !== 'active') throw Object.assign(new Error(`${product.title} is not available.`), { statusCode: 400 });

        const variant = requested.variantId
          ? (product.variants || []).find((item) => item.id === requested.variantId)
          : null;
        const quantity = Math.max(1, Math.floor(Number(requested.quantity || 1)));
        const stock = Number(product.inventory?.quantity || 0);
        const variantStock = variant ? Number(variant.quantity || 0) : stock;
        const tracksStock = product.inventory?.trackInventory !== false;
        if (tracksStock && !product.inventory?.allowBackorder && variantStock < quantity) {
          throw Object.assign(new Error(`${product.title} has only ${variantStock} in stock.`), { statusCode: 409 });
        }

        const unitPrice = money(variant?.price ?? product.price);
        const lineTotal = money(unitPrice * quantity);
        subtotal = money(subtotal + lineTotal);
        vendorIds.add(product.vendorId);
        items.push({
          productId: productSnap.id,
          variantId: variant?.id || null,
          vendorId: product.vendorId,
          vendorName: product.vendorName || '',
          sku: variant?.sku || product.sku,
          title: variant ? `${product.title} - ${variant.name}` : product.title,
          image: variant?.image || product.images?.[0]?.url || '',
          unitPrice,
          quantity,
          lineTotal,
          taxRatePct: Number(product.taxRatePct || 0),
          hsnCode: product.hsnCode || '',
          vendorState: product.vendorState || '',
        });

        if (tracksStock) {
          if (variant) {
            const variants = (product.variants || []).map((item) => (
              item.id === variant.id ? { ...item, quantity: Math.max(0, Number(item.quantity || 0) - quantity) } : item
            ));
            transaction.update(productRefs[index], { variants, updatedAt: FieldValue.serverTimestamp() });
          } else {
            transaction.update(productRefs[index], {
              'inventory.quantity': FieldValue.increment(-quantity),
              updatedAt: FieldValue.serverTimestamp(),
            });
          }
        }
      });

      // Load vendor docs for shipping + vendor state (GST)
      const vendorIdArr = Array.from(vendorIds);
      const vendorSnaps = await Promise.all(vendorIdArr.map((vid) => transaction.get(db.doc(`vendors/${vid}`))));
      vendorSnaps.forEach((vendorSnap) => {
        if (vendorSnap.exists) {
          vendorStateCache[vendorSnap.id] = vendorSnap.data()?.address?.state || '';
        }
      });

      // Apply vendor state to items + compute GST breakdown
      const itemsWithGst = items.map((item) => {
        const vendorState = vendorStateCache[item.vendorId] || item.vendorState || '';
        const gst = calcGstBreakdown(item.lineTotal, item.taxRatePct, vendorState, shippingAddress.state);
        totalCgst = money(totalCgst + gst.cgst);
        totalSgst = money(totalSgst + gst.sgst);
        totalIgst = money(totalIgst + gst.igst);
        return { ...item, vendorState, gstBreakdown: gst };
      });
      const tax = money(totalCgst + totalSgst + totalIgst);

      // Shipping: zone-aware per vendor
      const shipping = money(vendorSnaps.reduce((sum, vendorSnap) => {
        if (!vendorSnap.exists) return sum;
        const settings = vendorSnap.data()?.store?.shippingSettings || {};
        const vendorSubtotal = itemsWithGst
          .filter((item) => item.vendorId === vendorSnap.id)
          .reduce((vendorSum, item) => vendorSum + item.lineTotal, 0);
        return sum + resolveShippingFee(settings, vendorSubtotal, shippingAddress.state);
      }, 0));

      // Coupon validation + discount
      let discount = 0;
      let appliedCoupon = null;
      if (couponCode) {
        const couponSnap = await transaction.get(db.doc(`coupons/${couponCode}`));
        if (couponSnap.exists) {
          const c = couponSnap.data();
          const isExpired = c.expiresAt && c.expiresAt.toMillis() < Date.now();
          const isExhausted = c.maxUses > 0 && c.usedCount >= c.maxUses;
          if (c.active && !isExpired && !isExhausted && subtotal >= Number(c.minOrderAmount || 0)) {
            if (c.type === 'percent') {
              discount = money(subtotal * (Number(c.value) / 100));
              if (c.maxDiscountAmount > 0) discount = Math.min(discount, Number(c.maxDiscountAmount));
            } else {
              discount = Math.min(money(c.value), subtotal);
            }
            transaction.update(db.doc(`coupons/${couponCode}`), {
              usedCount: FieldValue.increment(1),
              updatedAt: FieldValue.serverTimestamp(),
            });
            appliedCoupon = { code: couponCode, type: c.type, value: c.value, discount };
          }
        }
      }

      const total = money(subtotal + tax + shipping - discount);
      const orderNumber = await nextOrderNumber(transaction, db);
      const now = Timestamp.now();

      const order = {
        orderNumber,
        userId: decoded.uid,
        customer: {
          name: shippingAddress.name,
          email: decoded.email || '',
          phone: shippingAddress.phone,
        },
        items: itemsWithGst,
        vendorIds: vendorIdArr,
        shippingAddress,
        billingAddress: shippingAddress,
        amounts: {
          subtotal,
          shipping,
          tax,
          taxBreakdown: { cgst: totalCgst, sgst: totalSgst, igst: totalIgst },
          discount,
          total,
        },
        coupon: appliedCoupon,
        paymentStatus: 'pending',
        paymentProvider: 'cod',
        paymentMethod: 'pay_on_delivery',
        paymentMeta: { label: 'Pay on delivery' },
        fulfillmentStatus: 'unfulfilled',
        statusHistory: [{
          from: null,
          to: 'unfulfilled',
          note: 'Pay on delivery order placed.',
          changedBy: decoded.uid,
          changedAt: now,
        }],
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      transaction.set(orderRef, order);

      const byVendor = itemsWithGst.reduce((acc, item) => {
        acc[item.vendorId] = acc[item.vendorId] || [];
        acc[item.vendorId].push(item);
        return acc;
      }, {});
      Object.entries(byVendor).forEach(([vid, vendorItems]) => {
        const vendorSubtotal = money(vendorItems.reduce((sum, item) => sum + item.lineTotal, 0));
        transaction.set(orderRef.collection('subOrders').doc(vid), {
          vendorId: vid,
          orderId: orderRef.id,
          orderNumber,
          userId: decoded.uid,
          customer: order.customer,
          items: vendorItems,
          amounts: { subtotal: vendorSubtotal },
          paymentStatus: 'pending',
          paymentProvider: 'cod',
          fulfillmentStatus: 'unfulfilled',
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
        transaction.update(db.doc(`vendors/${vid}`), {
          orderCount: FieldValue.increment(1),
          updatedAt: FieldValue.serverTimestamp(),
        });
      });

      transaction.update(cartRef, {
        status: 'converted',
        convertedOrderId: orderRef.id,
        updatedAt: FieldValue.serverTimestamp(),
      });

      createdOrder = { id: orderRef.id, ...order, createdAt: now, updatedAt: now };
    });

    await writeUserNotification(decoded.uid, {
      type: 'commerce_order',
      title: 'Order placed',
      body: `${createdOrder.orderNumber} is confirmed for pay on delivery.`,
      data: { type: 'commerce_order', orderId: createdOrder.id, click_action: `/orders/${createdOrder.id}` },
    });

    return jsonResponse(200, event, { orderId: createdOrder.id, order: createdOrder });
  } catch (error) {
    console.error('[commerce-place-cod-order]', error);
    return jsonResponse(error.statusCode || 500, event, { error: error.message });
  }
};
