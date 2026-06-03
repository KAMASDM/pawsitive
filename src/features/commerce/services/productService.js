import {
  collection,
  doc,
  getDocs,
  getDoc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { db } from "../../../firebase";
import { callCommerceFunction } from "./netlifyCommerceApi";

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

export const PET_TYPES = [
  { id: "all", label: "All pets" },
  { id: "dog", label: "Dogs" },
  { id: "cat", label: "Cats" },
  { id: "bird", label: "Birds" },
  { id: "fish", label: "Fish" },
  { id: "small_pet", label: "Small pets" },
];

export const PRODUCT_STATUSES = {
  draft: "Draft",
  active: "Active",
  out_of_stock: "Out of stock",
  archived: "Archived",
};

export const emptyProduct = {
  title: "",
  slug: "",
  description: "",
  sku: "",
  category: "Accessories",
  subcategory: "",
  tags: [],
  petType: ["all"],
  price: "",
  compareAtPrice: "",
  taxRatePct: "18",
  hsnCode: "",
  inventory: {
    quantity: "0",
    trackInventory: true,
    allowBackorder: false,
    lowStockThreshold: "5",
  },
  variants: [],
  images: [{ url: "", alt: "", position: 0 }],
  status: "draft",
  seo: {
    metaTitle: "",
    metaDescription: "",
    keywords: [],
    ogImage: "",
    canonicalUrl: "",
  },
  shipping: {
    weightGrams: "",
    dimensionsCm: { l: "", w: "", h: "" },
  },
};

export const slugifyProduct = (value = "") =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 72);

export const suggestSku = (title = "") => {
  const base = title
    .toUpperCase()
    .replace(/[^A-Z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 28);
  return base || "PAWPPY-SKU";
};

export const subscribeVendorProducts = (vendorId, callback) => {
  if (!vendorId) return () => {};
  const productsQuery = query(collection(db, "products"), where("vendorId", "==", vendorId));
  return onSnapshot(productsQuery, (snapshot) => {
    const products = snapshot.docs
      .map((productDoc) => ({ id: productDoc.id, ...productDoc.data() }))
      .sort((a, b) => {
        const aTime = a.updatedAt?.toMillis?.() || a.createdAt?.toMillis?.() || 0;
        const bTime = b.updatedAt?.toMillis?.() || b.createdAt?.toMillis?.() || 0;
        return bTime - aTime;
      });
    callback(products);
  });
};

export const subscribeMarketplaceProducts = (callback) => {
  const productsQuery = query(collection(db, "products"), where("status", "==", "active"));
  return onSnapshot(productsQuery, (snapshot) => {
    const products = snapshot.docs
      .map((productDoc) => ({ id: productDoc.id, ...productDoc.data() }))
      .sort((a, b) => {
        const aTime = a.updatedAt?.toMillis?.() || a.createdAt?.toMillis?.() || 0;
        const bTime = b.updatedAt?.toMillis?.() || b.createdAt?.toMillis?.() || 0;
        return bTime - aTime;
      });
    callback(products);
  });
};

export const subscribeAdminProducts = (callback) => {
  return onSnapshot(collection(db, "products"), (snapshot) => {
    const products = snapshot.docs
      .map((productDoc) => ({ id: productDoc.id, ...productDoc.data() }))
      .sort((a, b) => (b.updatedAt?.toMillis?.() || 0) - (a.updatedAt?.toMillis?.() || 0));
    callback(products);
  });
};

export const getProductById = async (productId) => {
  if (!productId) return null;
  const snapshot = await getDoc(doc(db, "products", productId));
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
};

export const getProductBySlug = async (slug) => {
  if (!slug) return null;
  const productsQuery = query(collection(db, "products"), where("slug", "==", slug));
  const snapshot = await getDocs(productsQuery);
  if (snapshot.empty) return null;
  const productDoc = snapshot.docs[0];
  const product = { id: productDoc.id, ...productDoc.data() };
  return product.status === "active" ? product : null;
};

export const getVendorByStoreSlug = async (slug) => {
  if (!slug) return null;
  const slugSnapshot = await getDoc(doc(db, "vendorStoreSlugs", slug));
  if (!slugSnapshot.exists()) return null;
  const vendorId = slugSnapshot.data().vendorId;
  const vendorSnapshot = await getDoc(doc(db, "vendors", vendorId));
  return vendorSnapshot.exists() ? { id: vendorSnapshot.id, ...vendorSnapshot.data() } : null;
};

export const subscribeStoreProductsByVendor = (vendorId, callback) => {
  if (!vendorId) return () => {};
  const productsQuery = query(collection(db, "products"), where("vendorId", "==", vendorId), where("status", "==", "active"));
  return onSnapshot(productsQuery, (snapshot) => {
    callback(snapshot.docs.map((productDoc) => ({ id: productDoc.id, ...productDoc.data() })));
  });
};

export const saveCommerceProduct = async ({ productId, product }) => {
  const result = await callCommerceFunction("commerce-save-product", { productId, product });
  return result.product;
};

export const archiveCommerceProduct = async (product) => saveCommerceProduct({
  productId: product.id,
  product: { ...product, status: "archived" },
});

export const moderateCommerceProduct = ({ productId, status, moderationStatus, note }) =>
  callCommerceFunction("commerce-moderate-product", { productId, status, moderationStatus, note });

export const formatCurrency = (value = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
