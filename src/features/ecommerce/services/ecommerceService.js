import { get, onValue, push, ref, set, update } from "firebase/database";
import { auth, database } from "../../../firebase";

export const ECOMMERCE_ADMIN_EMAIL = "anantsoftcomputing@gmail.com";

export const PRODUCT_CATEGORIES = [
  "Food",
  "Treats",
  "Toys",
  "Grooming",
  "Health",
  "Accessories",
  "Beds",
  "Training",
];

export const ORDER_STATUSES = {
  draft: "Draft",
  paymentPending: "Payment pending",
  accepted: "Accepted",
  packed: "Packed",
  shipped: "Shipped",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const VENDOR_DOCUMENT_TYPES = [
  { id: "gstCertificate", label: "GST certificate" },
  { id: "panCard", label: "PAN card" },
  { id: "businessLicense", label: "Business license" },
  { id: "msmeLicense", label: "MSME license" },
  { id: "addressProof", label: "Business address proof" },
  { id: "bankProof", label: "Cancelled cheque / bank proof" },
  { id: "brandAuthorization", label: "Brand authorization" },
  { id: "other", label: "Other compliance document" },
];

export const slugifyStoreName = (value = "") =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);

export const getStoreSlugFromHost = () => {
  if (typeof window === "undefined") return "";
  const host = window.location.hostname.toLowerCase();
  const parts = host.split(".");
  const isPawppyHost = host === "pawppy.in" || host.endsWith(".pawppy.in");
  if (!isPawppyHost || parts.length < 3) return "";
  const subdomain = parts[0];
  if (["www", "app", "admin"].includes(subdomain)) return "";
  return subdomain;
};

const snapshotToList = (snapshot) => {
  if (!snapshot.exists()) return [];
  return Object.entries(snapshot.val()).map(([id, data]) => ({ id, ...data }));
};

const readOptionalValue = async (path) => {
  try {
    const snapshot = await get(ref(database, path));
    return snapshot.exists() ? snapshot.val() : null;
  } catch (error) {
    if (error?.code === "PERMISSION_DENIED" || error?.message?.toLowerCase().includes("permission")) {
      console.warn(`Unable to read optional ecommerce data at ${path}.`, error);
      return null;
    }
    throw error;
  }
};

export const subscribeApprovedStores = (callback) => {
  const storesRef = ref(database, "vendorStores");
  return onValue(storesRef, (snapshot) => {
    callback(snapshotToList(snapshot).filter((store) => store.status === "approved"));
  });
};

export const subscribeStoreProducts = (storeId, callback) => {
  if (!storeId) return () => {};
  const productsRef = ref(database, `vendorProducts/${storeId}`);
  return onValue(productsRef, (snapshot) => {
    callback(snapshotToList(snapshot).filter((product) => product.status !== "archived"));
  });
};

export const subscribeAllMarketplaceProducts = (callback) => {
  const productsRef = ref(database, "vendorProducts");
  return onValue(productsRef, async (snapshot) => {
    const productsByStore = snapshot.val() || {};
    const storesSnapshot = await get(ref(database, "vendorStores"));
    const stores = storesSnapshot.val() || {};
    const products = [];

    Object.entries(productsByStore).forEach(([storeId, storeProducts]) => {
      const store = stores[storeId];
      if (!store || store.status !== "approved") return;
      Object.entries(storeProducts || {}).forEach(([productId, product]) => {
        if (product.status === "active") {
          products.push({ id: productId, storeId, store, ...product });
        }
      });
    });

    callback(products.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
  });
};

export const getStoreBySlug = async (slug) => {
  const slugSnapshot = await get(ref(database, `vendorStoreSlugs/${slug}`));
  if (!slugSnapshot.exists()) return null;
  const storeId = slugSnapshot.val().storeId;
  const storeSnapshot = await get(ref(database, `vendorStores/${storeId}`));
  if (!storeSnapshot.exists()) return null;
  return { id: storeId, ...storeSnapshot.val() };
};

export const getProduct = async (storeId, productId) => {
  const productSnapshot = await get(ref(database, `vendorProducts/${storeId}/${productId}`));
  if (!productSnapshot.exists()) return null;
  return { id: productId, storeId, ...productSnapshot.val() };
};

export const getVendorApplication = async (userId) => {
  const [applicationSnapshot, approval] = await Promise.all([
    get(ref(database, `vendorApplications/${userId}`)),
    readOptionalValue(`vendorApprovals/${userId}`),
  ]);
  const application = applicationSnapshot.exists() ? applicationSnapshot.val() : null;
  if (!application) return approval ? { uid: userId, status: "approved", approval } : null;
  return {
    ...application,
    status: approval?.approved ? "approved" : application.status,
    approval,
  };
};

export const subscribeVendorApplicationsForAdmin = (callback) => {
  const applicationsRef = ref(database, "vendorApplications");
  const approvalsRef = ref(database, "vendorApprovals");
  let applications = [];
  let approvals = {};

  const emit = () => {
    callback(
      applications
        .map((application) => ({
          ...application,
          approval: approvals[application.uid || application.id] || null,
          status: approvals[application.uid || application.id]?.approved ? "approved" : application.status,
        }))
        .sort((a, b) => (b.submittedAt || 0) - (a.submittedAt || 0))
    );
  };

  const unsubscribeApplications = onValue(applicationsRef, (snapshot) => {
    applications = snapshotToList(snapshot);
    emit();
  });
  const unsubscribeApprovals = onValue(approvalsRef, (snapshot) => {
    approvals = snapshot.val() || {};
    emit();
  });

  return () => {
    unsubscribeApplications();
    unsubscribeApprovals();
  };
};

export const getVendorStore = async (userId, existingApplication = null) => {
  const application = existingApplication || await getVendorApplication(userId);
  const storeId = application?.storeId;
  if (!storeId) return null;
  const snapshot = await get(ref(database, `vendorStores/${storeId}`));
  return snapshot.exists() ? { id: storeId, ...snapshot.val() } : null;
};

export const submitVendorApplication = async (form) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Sign in to apply as a vendor.");
  await user.reload();
  if (!auth.currentUser?.emailVerified) {
    throw new Error("Verify your account email before submitting your vendor profile.");
  }

  const now = Date.now();
  const application = {
    ...form,
    uid: user.uid,
    applicantName: user.displayName || form.contactName,
    email: user.email,
    businessEmail: form.businessEmail || user.email,
    contactEmailVerified: true,
    documents: form.documents || {},
    status: "pending",
    submittedAt: now,
    updatedAt: now,
  };

  await set(ref(database, `vendorApplications/${user.uid}`), application);
  return application;
};

export const uploadVendorDocument = async ({ type, file }) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Sign in to upload documents.");
  if (!type || !file) throw new Error("Choose a document type and file.");
  if (file.size > 2 * 1024 * 1024) throw new Error("Document must be 2MB or smaller for database upload.");

  const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    throw new Error("Upload a PDF, JPG, PNG, or WEBP document.");
  }

  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(event.target.result);
    reader.onerror = () => reject(new Error("Failed to read document. Please try again."));
    reader.readAsDataURL(file);
  });

  return {
    type,
    name: file.name,
    size: file.size,
    contentType: file.type,
    dataUrl,
    url: dataUrl,
    storageMode: "realtime-database",
    uploadedAt: Date.now(),
  };
};

export const reviewVendorApplication = async ({ uid, decision, note = "" }) => {
  const user = auth.currentUser;
  await user?.reload();
  await user?.getIdToken(true);

  const adminEmail = auth.currentUser?.email?.trim().toLowerCase();
  if (!auth.currentUser || adminEmail !== ECOMMERCE_ADMIN_EMAIL) {
    throw new Error("Only the Pawppy commerce admin can review vendors.");
  }
  if (!uid) throw new Error("Vendor user id is required.");

  const approved = decision === "approved";
  const now = Date.now();
  const reviewPayload = {
    approved,
    status: decision,
    reviewNote: note,
    reviewedAt: now,
    reviewedBy: adminEmail,
  };

  await set(ref(database, `vendorApprovals/${uid}`), reviewPayload);
  try {
    await update(ref(database, `vendorApplications/${uid}`), {
      status: decision,
      reviewNote: note,
      reviewedAt: now,
      reviewedBy: adminEmail,
    });
  } catch (error) {
    console.warn("Vendor approval saved, but application review metadata could not be updated.", error);
  }
};

export const createOrUpdateStore = async (store) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Sign in to manage your store.");

  const [application, approvalSnapshot] = await Promise.all([
    getVendorApplication(user.uid),
    get(ref(database, `vendorApprovals/${user.uid}`)),
  ]);
  const approval = approvalSnapshot.exists() ? approvalSnapshot.val() : null;
  if (!approval?.approved) {
    throw new Error("Your vendor profile must be approved before creating a store.");
  }

  const slug = slugifyStoreName(store.storeName);
  if (!slug) throw new Error("Store name is required.");

  const existingSlug = await get(ref(database, `vendorStoreSlugs/${slug}`));
  if (existingSlug.exists() && existingSlug.val().ownerId !== user.uid) {
    throw new Error("That store URL is already taken.");
  }

  const storeId = application.storeId || push(ref(database, "vendorStores")).key;
  const payload = {
    ...store,
    id: storeId,
    ownerId: user.uid,
    slug,
    status: "approved",
    updatedAt: Date.now(),
    createdAt: store.createdAt || Date.now(),
  };

  await update(ref(database), {
    [`vendorStores/${storeId}`]: payload,
    [`vendorStoreSlugs/${slug}`]: { storeId, ownerId: user.uid },
    [`vendorApplications/${user.uid}/storeId`]: storeId,
    [`vendorApplications/${user.uid}/updatedAt`]: Date.now(),
  });

  return payload;
};

export const saveProduct = async (storeId, product) => {
  if (!storeId) throw new Error("Create your store before adding products.");
  const productId = product.id || push(ref(database, `vendorProducts/${storeId}`)).key;
  const now = Date.now();
  const payload = {
    ...product,
    id: productId,
    storeId,
    price: Number(product.price || 0),
    inventory: Number(product.inventory || 0),
    status: product.status || "active",
    updatedAt: now,
    createdAt: product.createdAt || now,
  };
  await set(ref(database, `vendorProducts/${storeId}/${productId}`), payload);
  return payload;
};

export const submitOrderDraft = async ({ store, items, buyer, address, notes }) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Sign in to place an order request.");
  if (!store?.id) throw new Error("Store not found.");
  if (!items.length) throw new Error("Your cart is empty.");

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const orderId = push(ref(database, `buyerOrders/${user.uid}`)).key;
  const order = {
    id: orderId,
    storeId: store.id,
    storeName: store.storeName,
    buyerId: user.uid,
    buyerName: buyer.name || user.displayName || "",
    buyerEmail: buyer.email || user.email || "",
    buyerPhone: buyer.phone || "",
    address,
    notes: notes || "",
    items,
    subtotal,
    paymentStatus: "not_configured",
    status: "payment_pending",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await update(ref(database), {
    [`buyerOrders/${user.uid}/${orderId}`]: order,
    [`vendorOrders/${store.id}/${orderId}`]: order,
  });

  return order;
};
