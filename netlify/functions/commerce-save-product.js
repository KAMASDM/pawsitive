const {
  FieldValue,
  getServices,
  handleOptions,
  jsonResponse,
  parseJsonBody,
  requireAuth,
} = require('./_commerce-utils');

const PRODUCT_STATUSES = ['draft', 'active', 'out_of_stock', 'archived'];
const PET_TYPES = ['dog', 'cat', 'bird', 'fish', 'small_pet', 'all'];

function slugify(value = '') {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 72);
}

function normalizeSku(value = '') {
  return value.trim().toUpperCase().replace(/\s+/g, '-').slice(0, 64);
}

function skuClaimId(vendorId, sku) {
  return Buffer.from(`${vendorId}:${normalizeSku(sku)}`).toString('base64url');
}

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function tokenize(...values) {
  const tokens = new Set();
  values
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 2)
    .forEach((token) => tokens.add(token));
  return Array.from(tokens).slice(0, 80);
}

function sanitizeProduct(input, vendor, productId) {
  const title = String(input.title || '').trim();
  if (title.length < 3) throw Object.assign(new Error('Product title is required.'), { statusCode: 400 });

  const sku = normalizeSku(input.sku || title);
  if (!sku) throw Object.assign(new Error('SKU is required.'), { statusCode: 400 });

  const price = toNumber(input.price);
  if (price < 0) throw Object.assign(new Error('Price cannot be negative.'), { statusCode: 400 });

  const status = PRODUCT_STATUSES.includes(input.status) ? input.status : 'draft';
  const category = String(input.category || 'Accessories').trim();
  const subcategory = String(input.subcategory || '').trim();
  const description = String(input.description || '').trim();
  const tags = Array.isArray(input.tags) ? input.tags.map((tag) => String(tag).trim()).filter(Boolean).slice(0, 20) : [];
  const petType = Array.isArray(input.petType)
    ? input.petType.filter((type) => PET_TYPES.includes(type)).slice(0, 8)
    : ['all'];
  const baseSlug = slugify(input.slug || title);

  if (!baseSlug) throw Object.assign(new Error('Product URL slug could not be generated.'), { statusCode: 400 });

  const images = Array.isArray(input.images)
    ? input.images
        .map((image, index) => ({
          url: String(image.url || '').trim(),
          alt: String(image.alt || title).trim(),
          position: toNumber(image.position, index),
        }))
        .filter((image) => /^https?:\/\//i.test(image.url) || /^data:image\//i.test(image.url))
        .slice(0, 8)
    : [];

  const quantity = Math.max(0, Math.floor(toNumber(input.inventory?.quantity, input.quantity || 0)));
  const trackInventory = input.inventory?.trackInventory !== false;
  const effectiveStatus = status === 'active' && trackInventory && quantity <= 0 ? 'out_of_stock' : status;

  return {
    vendorId: vendor.id,
    vendorName: vendor.businessName || vendor.legalName || 'Pawppy Vendor',
    vendorStoreSlug: vendor.store?.slug || '',
    title,
    slug: baseSlug,
    description,
    sku,
    category,
    subcategory,
    tags,
    petType: petType.length ? petType : ['all'],
    price,
    compareAtPrice: toNumber(input.compareAtPrice),
    currency: 'INR',
    taxRatePct: toNumber(input.taxRatePct, 0),
    hsnCode: String(input.hsnCode || '').trim().slice(0, 8),
    inventory: {
      quantity,
      trackInventory,
      allowBackorder: Boolean(input.inventory?.allowBackorder),
      lowStockThreshold: Math.max(0, Math.floor(toNumber(input.inventory?.lowStockThreshold, 5))),
    },
    variants: Array.isArray(input.variants)
      ? input.variants
          .map((variant, index) => ({
            id: String(variant.id || `variant-${index + 1}`).trim(),
            name: String(variant.name || '').trim(),
            options: Array.isArray(variant.options) ? variant.options.map((option) => String(option).trim()).filter(Boolean).slice(0, 20) : [],
            sku: normalizeSku(variant.sku || `${sku}-${index + 1}`),
            price: toNumber(variant.price, price),
            quantity: Math.max(0, Math.floor(toNumber(variant.quantity, quantity))),
            image: String(variant.image || '').trim(),
          }))
          .filter((variant) => variant.name)
          .slice(0, 30)
      : [],
    images,
    status: effectiveStatus,
    seo: {
      metaTitle: String(input.seo?.metaTitle || title).trim().slice(0, 70),
      metaDescription: String(input.seo?.metaDescription || description).trim().slice(0, 160),
      keywords: Array.isArray(input.seo?.keywords) ? input.seo.keywords.map((item) => String(item).trim()).filter(Boolean).slice(0, 12) : tags,
      ogImage: String(input.seo?.ogImage || images[0]?.url || '').trim(),
      canonicalUrl: String(input.seo?.canonicalUrl || `https://pawppy.in/products/${baseSlug}`).trim(),
    },
    shipping: {
      weightGrams: Math.max(0, Math.floor(toNumber(input.shipping?.weightGrams))),
      dimensionsCm: {
        l: Math.max(0, toNumber(input.shipping?.dimensionsCm?.l)),
        w: Math.max(0, toNumber(input.shipping?.dimensionsCm?.w)),
        h: Math.max(0, toNumber(input.shipping?.dimensionsCm?.h)),
      },
    },
    searchKeywords: tokenize(title, description, category, subcategory, tags.join(' '), sku, vendor.businessName),
    updatedAt: FieldValue.serverTimestamp(),
    ...(productId ? {} : { createdAt: FieldValue.serverTimestamp() }),
  };
}

async function reserveUniqueSlug(transaction, db, requestedSlug, productId, existingSlug) {
  if (existingSlug === requestedSlug) return requestedSlug;

  for (let suffix = 0; suffix < 50; suffix += 1) {
    const candidate = suffix === 0 ? requestedSlug : `${requestedSlug}-${suffix + 1}`;
    const slugRef = db.doc(`productSlugs/${candidate}`);
    const slugSnap = await transaction.get(slugRef);
    if (!slugSnap.exists || slugSnap.data()?.productId === productId) {
      transaction.set(slugRef, { productId, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      if (existingSlug && existingSlug !== candidate) {
        transaction.delete(db.doc(`productSlugs/${existingSlug}`));
      }
      return candidate;
    }
  }

  throw Object.assign(new Error('Could not create a unique product URL. Try a more specific title.'), { statusCode: 409 });
}

exports.handler = async (event) => {
  const options = handleOptions(event);
  if (options) return options;
  if (event.httpMethod !== 'POST') return jsonResponse(405, event, { error: 'Method not allowed' });

  try {
    const decoded = await requireAuth(event);
    const { db } = getServices();
    const body = parseJsonBody(event);
    const requestedProductId = String(body.productId || '').trim();
    const vendorId = decoded.vendorId;

    if (!vendorId) throw Object.assign(new Error('Vendor role is required.'), { statusCode: 403 });

    const vendorRef = db.doc(`vendors/${vendorId}`);
    const vendorSnap = await vendorRef.get();
    const vendor = vendorSnap.exists ? { id: vendorSnap.id, ...vendorSnap.data() } : null;
    if (!vendor || vendor.ownerUid !== decoded.uid) throw Object.assign(new Error('Vendor profile not found.'), { statusCode: 404 });
    if (vendor.status !== 'approved') throw Object.assign(new Error('Your vendor profile must be approved before managing products.'), { statusCode: 403 });

    const productRef = requestedProductId ? db.doc(`products/${requestedProductId}`) : db.collection('products').doc();
    const productId = productRef.id;
    const productInput = sanitizeProduct(body.product || {}, vendor, requestedProductId);

    await db.runTransaction(async (transaction) => {
      const existingSnap = await transaction.get(productRef);
      const existing = existingSnap.exists ? existingSnap.data() : null;
      if (existing && existing.vendorId !== vendorId) {
        throw Object.assign(new Error('You can only edit your own products.'), { statusCode: 403 });
      }

      const skuRef = db.doc(`productSkuClaims/${skuClaimId(vendorId, productInput.sku)}`);
      const skuSnap = await transaction.get(skuRef);
      if (skuSnap.exists && skuSnap.data()?.productId !== productId) {
        throw Object.assign(new Error('That SKU is already used by another product.'), { statusCode: 409 });
      }

      if (existing?.sku && normalizeSku(existing.sku) !== productInput.sku) {
        transaction.delete(db.doc(`productSkuClaims/${skuClaimId(vendorId, existing.sku)}`));
      }

      const finalSlug = await reserveUniqueSlug(transaction, db, productInput.slug, productId, existing?.slug);
      transaction.set(skuRef, { vendorId, sku: productInput.sku, productId, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      transaction.set(productRef, {
        ...productInput,
        slug: finalSlug,
        seo: {
          ...productInput.seo,
          canonicalUrl: `https://pawppy.in/products/${finalSlug}`,
        },
      }, { merge: true });

      if (!existingSnap.exists) {
        transaction.update(vendorRef, {
          productCount: FieldValue.increment(1),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    });

    const saved = await productRef.get();
    return jsonResponse(200, event, { productId, product: { id: productId, ...saved.data() } });
  } catch (error) {
    console.error('[commerce-save-product]', error);
    return jsonResponse(error.statusCode || 500, event, { error: error.message });
  }
};
