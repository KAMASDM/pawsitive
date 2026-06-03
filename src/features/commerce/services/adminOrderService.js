import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "../../../firebase";
import { callCommerceFunction } from "./netlifyCommerceApi";

const sortByUpdated = (items) =>
  items.sort((a, b) => {
    const aTime = a.updatedAt?.toMillis?.() || a.createdAt?.toMillis?.() || 0;
    const bTime = b.updatedAt?.toMillis?.() || b.createdAt?.toMillis?.() || 0;
    return bTime - aTime;
  });

export const subscribeAdminOrders = (callback, onError) => {
  const ordersQuery = query(collection(db, "orders"));
  return onSnapshot(ordersQuery, (snapshot) => {
    callback(sortByUpdated(snapshot.docs.map((orderDoc) => ({ id: orderDoc.id, ...orderDoc.data() }))));
  }, onError);
};

export const subscribeAdminCarts = (callback, onError) => {
  const cartsQuery = query(collection(db, "carts"));
  return onSnapshot(cartsQuery, (snapshot) => {
    callback(sortByUpdated(snapshot.docs.map((cartDoc) => ({ id: cartDoc.id, ...cartDoc.data() }))));
  }, onError);
};

export const subscribeCoupons = (callback, onError) => {
  return onSnapshot(collection(db, "coupons"), (snapshot) => {
    callback(sortByUpdated(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))));
  }, onError);
};

export const updateOrderFulfillmentStatus = ({ orderId, vendorId, fulfillmentStatus, note }) =>
  callCommerceFunction("commerce-update-order-status", { orderId, vendorId, fulfillmentStatus, note });

export const manageCoupon = (action, coupon) =>
  callCommerceFunction("commerce-manage-coupon", { action, coupon });
