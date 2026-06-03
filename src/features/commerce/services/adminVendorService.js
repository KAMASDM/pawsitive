import { collection, doc, onSnapshot, orderBy, query, updateDoc } from "firebase/firestore";
import { get, ref, update } from "firebase/database";
import { database, db } from "../../../firebase";
import { callCommerceFunction } from "./netlifyCommerceApi";

export const ADMIN_VENDOR_STATUSES = [
  "pending",
  "documentation_required",
  "under_review",
  "approved",
  "rejected",
  "suspended",
];

export const subscribeAdminVendors = (callback, onError) => {
  const vendorsQuery = query(collection(db, "vendors"), orderBy("updatedAt", "desc"));
  return onSnapshot(vendorsQuery, (snapshot) => {
    callback(snapshot.docs.map((vendorDoc) => ({ id: vendorDoc.id, ...vendorDoc.data() })));
  }, onError);
};

export const subscribeAdminVendor = (vendorId, callback, onError) => {
  if (!vendorId) return () => {};
  return onSnapshot(doc(db, "vendors", vendorId), (snapshot) => {
    callback(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null);
  }, onError);
};

export const getAdminVendorDocuments = async (vendorId) => {
  if (!vendorId) return {};
  const snapshot = await get(ref(database, `vendorDocuments/${vendorId}`));
  return snapshot.exists() ? snapshot.val() : {};
};

export const reviewVendorDocument = async ({ vendorId, documentType, status, note }) => {
  if (!vendorId || !documentType) throw new Error("Vendor and document type are required.");
  const reviewedAt = Date.now();
  await update(ref(database, `vendorDocuments/${vendorId}/${documentType}`), {
    status,
    note: note || "",
    reviewedAt,
  });

  const documents = await getAdminVendorDocuments(vendorId);
  const documentList = Object.entries(documents).map(([type, data]) => ({
    type,
    status: data.status || "pending",
    note: data.note || "",
    name: data.name || "",
    size: data.size || 0,
    contentType: data.contentType || "",
    uploadedAt: data.uploadedAt || null,
    reviewedAt: data.reviewedAt || null,
    realtimePath: `vendorDocuments/${vendorId}/${type}`,
  }));

  await updateDoc(doc(db, "vendors", vendorId), {
    documents: documentList,
  });
};

export const setVendorStatus = async ({ vendorId, status, note }) => {
  return callCommerceFunction("commerce-set-vendor-status", { vendorId, status, note });
};
