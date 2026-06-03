const {
  FieldValue,
  getServices,
  handleOptions,
  jsonResponse,
  parseJsonBody,
  requireAuth,
} = require('./_commerce-utils');

function slugify(value = '') {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
}

function imageUrl(value = '') {
  const url = String(value || '').trim();
  return /^https?:\/\//i.test(url) || /^data:image\//i.test(url) ? url : '';
}

exports.handler = async (event) => {
  const options = handleOptions(event);
  if (options) return options;
  if (event.httpMethod !== 'POST') return jsonResponse(405, event, { error: 'Method not allowed' });

  try {
    const decoded = await requireAuth(event);
    const { db } = getServices();
    const vendorId = decoded.vendorId;
    if (!vendorId) throw Object.assign(new Error('Vendor role is required.'), { statusCode: 403 });

    const vendorRef = db.doc(`vendors/${vendorId}`);
    const vendorSnap = await vendorRef.get();
    if (!vendorSnap.exists) throw Object.assign(new Error('Vendor profile not found.'), { statusCode: 404 });
    const vendor = vendorSnap.data();
    if (vendor.ownerUid !== decoded.uid) throw Object.assign(new Error('You can only edit your own store.'), { statusCode: 403 });
    if (vendor.status !== 'approved') throw Object.assign(new Error('Your vendor profile must be approved before publishing a store.'), { statusCode: 403 });

    const { store = {} } = parseJsonBody(event);
    const requestedSlug = slugify(store.slug || store.storeName || vendor.businessName);
    if (!requestedSlug) throw Object.assign(new Error('Store URL is required.'), { statusCode: 400 });

    const payload = {
      store: {
        slug: requestedSlug,
        storeName: String(store.storeName || vendor.businessName || '').trim(),
        tagline: String(store.tagline || '').trim().slice(0, 120),
        description: String(store.description || vendor.description || '').trim(),
        logoUrl: imageUrl(store.logoUrl),
        bannerUrl: imageUrl(store.bannerUrl),
        supportEmail: String(store.supportEmail || vendor.email || '').trim(),
        supportPhone: String(store.supportPhone || vendor.phone || '').trim(),
        policies: {
          shipping: String(store.policies?.shipping || '').trim(),
          returns: String(store.policies?.returns || '').trim(),
          support: String(store.policies?.support || '').trim(),
        },
        shippingSettings: {
          flatFee: Math.max(0, Number(store.shippingSettings?.flatFee ?? 49)),
          freeShippingOver: Math.max(0, Number(store.shippingSettings?.freeShippingOver ?? 999)),
          deliveryEstimate: String(store.shippingSettings?.deliveryEstimate || '2-5 business days').trim(),
          servicePincodes: Array.isArray(store.shippingSettings?.servicePincodes)
            ? store.shippingSettings.servicePincodes.map((item) => String(item).trim()).filter(Boolean).slice(0, 200)
            : [],
        },
        updatedAt: FieldValue.serverTimestamp(),
      },
      updatedAt: FieldValue.serverTimestamp(),
    };

    await db.runTransaction(async (transaction) => {
      const slugRef = db.doc(`vendorStoreSlugs/${requestedSlug}`);
      const slugSnap = await transaction.get(slugRef);
      if (slugSnap.exists && slugSnap.data()?.vendorId !== vendorId) {
        throw Object.assign(new Error('That store URL is already taken.'), { statusCode: 409 });
      }
      const existingSlug = vendor.store?.slug;
      if (existingSlug && existingSlug !== requestedSlug) {
        transaction.delete(db.doc(`vendorStoreSlugs/${existingSlug}`));
      }
      transaction.set(slugRef, {
        vendorId,
        ownerUid: decoded.uid,
        storeName: payload.store.storeName,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      transaction.set(vendorRef, payload, { merge: true });
    });

    return jsonResponse(200, event, { success: true, vendorId, store: payload.store });
  } catch (error) {
    console.error('[commerce-save-store]', error);
    return jsonResponse(error.statusCode || 500, event, { error: error.message });
  }
};
