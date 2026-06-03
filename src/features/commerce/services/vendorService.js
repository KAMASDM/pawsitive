import { doc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { get, ref, set } from "firebase/database";
import { auth, database, db } from "../../../firebase";
import { callCommerceFunction } from "./netlifyCommerceApi";

export const VENDOR_STATUSES = [
  "pending",
  "documentation_required",
  "under_review",
  "approved",
  "rejected",
  "suspended",
];

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

export const requestVendorRole = async () => {
  const result = await callCommerceFunction("commerce-request-vendor-role");
  await auth.currentUser?.getIdToken(true);
  return result;
};

export const readDocumentFile = (file) => new Promise((resolve, reject) => {
  if (!file) {
    reject(new Error("Choose a document to upload."));
    return;
  }
  if (file.size > 2 * 1024 * 1024) {
    reject(new Error("Document must be 2MB or smaller for Realtime Database upload."));
    return;
  }
  const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    reject(new Error("Upload a PDF, JPG, PNG, or WEBP document."));
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => resolve({
    name: file.name,
    size: file.size,
    contentType: file.type,
    dataUrl: event.target.result,
    uploadedAt: Date.now(),
    storageMode: "realtime-database",
  });
  reader.onerror = () => reject(new Error("Failed to read document. Please try again."));
  reader.readAsDataURL(file);
});

export const saveVendorDocumentToRealtime = async ({ vendorId, type, file }) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Sign in to upload vendor documents.");
  if (!vendorId) throw new Error("Start vendor registration before uploading documents.");

  const documentData = await readDocumentFile(file);
  const payload = {
    ...documentData,
    type,
    status: "pending",
    note: "",
    ownerUid: user.uid,
  };

  await set(ref(database, `vendorDocuments/${vendorId}/${type}`), payload);
  return {
    type,
    status: "pending",
    note: "",
    name: payload.name,
    size: payload.size,
    contentType: payload.contentType,
    uploadedAt: payload.uploadedAt,
    realtimePath: `vendorDocuments/${vendorId}/${type}`,
    url: payload.dataUrl,
  };
};

export const getVendorDocuments = async (vendorId) => {
  if (!vendorId) return {};
  const snapshot = await get(ref(database, `vendorDocuments/${vendorId}`));
  return snapshot.exists() ? snapshot.val() : {};
};

export const autosaveVendorDraft = async (vendorId, data) => {
  if (!vendorId) throw new Error("Vendor profile not found.");
  await setDoc(doc(db, "vendors", vendorId), {
    ...data,
    updatedAt: serverTimestamp(),
  }, { merge: true });
};

export const submitVendorForReview = async (vendorId, data) => {
  if (!vendorId) throw new Error("Vendor profile not found.");
  await updateDoc(doc(db, "vendors", vendorId), {
    ...data,
    status: "under_review",
    updatedAt: serverTimestamp(),
  });
};

export const slugifyStore = (value = "") =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);

const canvasToDataUrl = (file, maxSize = 1200, quality = 0.78) => new Promise((resolve, reject) => {
  const img = new Image();
  const objectUrl = URL.createObjectURL(file);
  img.onload = () => {
    const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(objectUrl);
    resolve(canvas.toDataURL("image/webp", quality));
  };
  img.onerror = () => {
    URL.revokeObjectURL(objectUrl);
    reject(new Error("Failed to process image."));
  };
  img.src = objectUrl;
});

export const readImageFileForDatabase = (file) => new Promise((resolve, reject) => {
  if (!file) {
    reject(new Error("Choose an image."));
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    reject(new Error("Image must be 5MB or smaller before compression."));
    return;
  }
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    reject(new Error("Upload a JPG, PNG, or WEBP image."));
    return;
  }
  canvasToDataUrl(file)
    .then((dataUrl) => {
      if (dataUrl.length > 350 * 1024) {
        reject(new Error("Image is still too large after compression. Try a simpler or smaller image."));
        return;
      }
      resolve({
        url: dataUrl,
        name: file.name,
        size: dataUrl.length,
        contentType: "image/webp",
        storageMode: "database-data-url",
      });
    })
    .catch(reject);
});

export const saveStoreProfile = async (store) => callCommerceFunction("commerce-save-store", { store });
