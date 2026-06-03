import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import { auth, db } from "../../../firebase";
import { callCommerceFunction } from "./netlifyCommerceApi";

const cartRefForUser = (uid) => doc(db, "carts", uid);

export const subscribeActiveCart = (callback) => {
  const user = auth.currentUser;
  if (!user) return () => callback(null);
  return onSnapshot(cartRefForUser(user.uid), (snapshot) => {
    callback(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null);
  });
};

export const addProductToCart = async ({ product, quantity = 1 }) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Sign in to add products to cart.");
  if (!product?.id) throw new Error("Product not found.");

  const cartRef = cartRefForUser(user.uid);
  const snapshot = await getDoc(cartRef);
  const current = snapshot.exists() && snapshot.data().status === "active" ? snapshot.data() : { items: [] };
  const qty = Math.max(1, Math.floor(Number(quantity || 1)));
  const variant = product.selectedVariant || null;
  const variantId = variant?.id || null;
  const unitPrice = Number(variant?.price ?? product.price ?? 0);
  const sku = variant?.sku || product.sku;
  const title = variant ? `${product.title} - ${variant.name}` : product.title;
  const existing = current.items.find((item) => item.productId === product.id && (item.variantId || null) === variantId);
  const items = existing
    ? current.items.map((item) => item.productId === product.id && (item.variantId || null) === variantId ? { ...item, quantity: item.quantity + qty } : item)
    : [
        ...current.items,
        {
          productId: product.id,
          vendorId: product.vendorId,
          variantId,
          sku,
          title,
          image: variant?.image || product.images?.[0]?.url || "",
          unitPrice,
          quantity: qty,
          addedAt: Date.now(),
        },
      ];
  const subtotal = items.reduce((sum, item) => sum + Number(item.unitPrice || 0) * Number(item.quantity || 0), 0);
  await setDoc(cartRef, {
    userId: user.uid,
    status: "active",
    items,
    subtotal,
    updatedAt: new Date(),
  }, { merge: true });
};

export const updateCartItemQuantity = async (productId, quantity) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Sign in to update cart.");
  const cartRef = cartRefForUser(user.uid);
  const snapshot = await getDoc(cartRef);
  if (!snapshot.exists()) return;
  const items = snapshot.data().items
    .map((item) => item.productId === productId ? { ...item, quantity: Math.max(0, Number(quantity || 0)) } : item)
    .filter((item) => item.quantity > 0);
  const subtotal = items.reduce((sum, item) => sum + Number(item.unitPrice || 0) * Number(item.quantity || 0), 0);
  await updateDoc(cartRef, { items, subtotal, updatedAt: new Date() });
};

export const placeCodOrder = async ({ shippingAddress, couponCode }) =>
  callCommerceFunction("commerce-place-cod-order", { shippingAddress, couponCode });

export const validateCoupon = async ({ code, cartSubtotal }) =>
  callCommerceFunction("commerce-validate-coupon", { code, cartSubtotal });

export const requestCustomerOrderAction = async ({ orderId, action, reason }) =>
  callCommerceFunction("commerce-customer-order-action", { orderId, action, reason });

export const submitReview = async ({ productId, orderId, rating, title, body }) =>
  callCommerceFunction("commerce-save-review", { productId, orderId, rating, title, body });

export const subscribeSavedAddresses = (callback) => {
  const user = auth.currentUser;
  if (!user) return () => callback([]);
  return onSnapshot(collection(db, "users", user.uid, "addresses"), (snapshot) => {
    callback(snapshot.docs.map((addressDoc) => ({ id: addressDoc.id, ...addressDoc.data() })));
  });
};

export const saveAddress = async (address) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Sign in to save addresses.");
  const addressId = address.id || `${Date.now()}`;
  await setDoc(doc(db, "users", user.uid, "addresses", addressId), {
    ...address,
    id: addressId,
    updatedAt: new Date(),
  }, { merge: true });
  return { ...address, id: addressId };
};

export const subscribeCustomerOrders = (userId, callback) => {
  if (!userId) return () => {};
  const ordersQuery = query(collection(db, "orders"), where("userId", "==", userId));
  return onSnapshot(ordersQuery, (snapshot) => {
    const orders = snapshot.docs
      .map((orderDoc) => ({ id: orderDoc.id, ...orderDoc.data() }))
      .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
    callback(orders);
  });
};

export const subscribeOrder = (orderId, callback) => {
  if (!orderId) return () => {};
  return onSnapshot(doc(db, "orders", orderId), (snapshot) => {
    callback(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null);
  });
};

export const subscribeProductReviews = (productId, callback) => {
  if (!productId) return () => {};
  const q = query(
    collection(db, "reviews"),
    where("productId", "==", productId),
    where("status", "==", "published"),
    orderBy("createdAt", "desc"),
    limit(50)
  );
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
};

export const subscribeVendorOrders = (vendorId, callback) => {
  if (!vendorId) return () => {};
  const ordersQuery = query(collection(db, "orders"), where("vendorIds", "array-contains", vendorId));
  return onSnapshot(ordersQuery, (snapshot) => {
    const orders = snapshot.docs
      .map((orderDoc) => ({ id: orderDoc.id, ...orderDoc.data() }))
      .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
    callback(orders);
  });
};
