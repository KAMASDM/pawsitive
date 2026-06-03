import React, { useEffect, useState } from "react";
import { onAuthStateChanged, sendEmailVerification } from "firebase/auth";
import { motion } from "framer-motion";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiEdit3,
  FiExternalLink,
  FiFileText,
  FiMail,
  FiPackage,
  FiPlus,
  FiShield,
  FiShoppingBag,
  FiUploadCloud,
} from "react-icons/fi";
import { onValue, ref } from "firebase/database";
import { auth, database } from "../../../firebase";
import {
  PRODUCT_CATEGORIES,
  VENDOR_DOCUMENT_TYPES,
  createOrUpdateStore,
  getVendorApplication,
  getVendorStore,
  saveProduct,
  submitVendorApplication,
  uploadVendorDocument,
} from "../services/ecommerceService";

const blankApplication = {
  businessName: "",
  contactName: "",
  businessEmail: "",
  phone: "",
  city: "",
  businessType: "Pet product retailer",
  experience: "",
  catalogSummary: "",
  documentsNote: "",
  documents: {},
};

const blankStore = {
  storeName: "",
  tagline: "",
  description: "",
  city: "",
  supportPhone: "",
  supportEmail: "",
  coverImageUrl: "",
};

const blankProduct = {
  name: "",
  category: "Food",
  description: "",
  price: "",
  inventory: "",
  imageUrl: "",
  status: "active",
};

const formatPrice = (value) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value || 0);

const StatusBanner = ({ application }) => {
  if (!application) return null;
  const meta = {
    pending: {
      Icon: FiClock,
      title: "Application under review",
      copy: "Pawppy will vet your business details before store creation is enabled.",
      style: "bg-amber-50 border-amber-100 text-amber-700",
    },
    approved: {
      Icon: FiCheckCircle,
      title: "Vendor approved",
      copy: "You can create your store, add products, and start receiving order requests.",
      style: "bg-emerald-50 border-emerald-100 text-emerald-700",
    },
    rejected: {
      Icon: FiAlertCircle,
      title: "Application needs updates",
      copy: application.reviewNote || "Please update your details and contact Pawppy support.",
      style: "bg-rose-50 border-rose-100 text-rose-700",
    },
  }[application.status || "pending"];
  const Icon = meta.Icon;
  return (
    <div className={`rounded-[24px] border p-4 flex gap-3 ${meta.style}`}>
      <Icon size={22} className="shrink-0 mt-0.5" />
      <div>
        <p className="font-black">{meta.title}</p>
        <p className="text-sm mt-1 opacity-80">{meta.copy}</p>
      </div>
    </div>
  );
};

export default function SellerDashboard() {
  const [application, setApplication] = useState(null);
  const [store, setStore] = useState(null);
  const [storeForm, setStoreForm] = useState(blankStore);
  const [applicationForm, setApplicationForm] = useState(blankApplication);
  const [productForm, setProductForm] = useState(blankProduct);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [user, setUser] = useState(auth.currentUser);
  const [loadError, setLoadError] = useState("");
  const [uploadingDocument, setUploadingDocument] = useState("");
  const [emailMessage, setEmailMessage] = useState("");

  useEffect(() => {
    return onAuthStateChanged(auth, (nextUser) => setUser(nextUser));
  }, []);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    let unsubscribeProducts = () => {};
    let unsubscribeOrders = () => {};
    let isMounted = true;
    setLoading(true);
    setLoadError("");

    getVendorApplication(user.uid).then(async (nextApplication) => {
      const nextStore = await getVendorStore(user.uid, nextApplication);
      if (!isMounted) return;
      setApplication(nextApplication);
      setStore(nextStore);
      setApplicationForm({ ...blankApplication, ...(nextApplication || {}) });
      setStoreForm({ ...blankStore, ...(nextStore || {}) });
      setLoading(false);
      if (nextStore?.id) {
        unsubscribeProducts = onValue(ref(database, `vendorProducts/${nextStore.id}`), (snapshot) => {
          setProducts(snapshot.exists() ? Object.entries(snapshot.val()).map(([id, data]) => ({ id, ...data })) : []);
        });
        unsubscribeOrders = onValue(ref(database, `vendorOrders/${nextStore.id}`), (snapshot) => {
          const list = snapshot.exists() ? Object.entries(snapshot.val()).map(([id, data]) => ({ id, ...data })) : [];
          setOrders(list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
        });
      }
    }).catch((error) => {
      if (!isMounted) return;
      console.error("Unable to load seller dashboard.", error);
      setLoadError(error?.message || "Unable to load seller dashboard.");
      setLoading(false);
    });
    return () => {
      isMounted = false;
      unsubscribeProducts();
      unsubscribeOrders();
    };
  }, [user]);

  const apply = async () => {
    setSaving("application");
    setLoadError("");
    try {
      await auth.currentUser?.reload();
      setUser(auth.currentUser);
      const nextApplication = await submitVendorApplication(applicationForm);
      setApplication(nextApplication);
    } catch (error) {
      setLoadError(error?.message || "Unable to submit vendor application.");
    } finally {
      setSaving("");
    }
  };

  const refreshEmailVerification = async () => {
    await auth.currentUser?.reload();
    setUser(auth.currentUser);
    setEmailMessage(auth.currentUser?.emailVerified ? "Email verified." : "Email is not verified yet.");
  };

  const resendVerification = async () => {
    if (!auth.currentUser) return;
    setSaving("email");
    setEmailMessage("");
    setLoadError("");
    try {
      await sendEmailVerification(auth.currentUser);
      setEmailMessage("Verification link sent. Please check your inbox.");
    } catch (error) {
      setLoadError(error?.message || "Unable to send verification link.");
    } finally {
      setSaving("");
    }
  };

  const handleDocumentUpload = async (type, file) => {
    if (!file) return;
    setUploadingDocument(type);
    setLoadError("");
    try {
      const document = await uploadVendorDocument({ type, file });
      setApplicationForm((current) => ({
        ...current,
        documents: {
          ...(current.documents || {}),
          [type]: document,
        },
      }));
    } catch (error) {
      setLoadError(error?.message || "Unable to upload document.");
    } finally {
      setUploadingDocument("");
    }
  };

  const saveStore = async () => {
    setSaving("store");
    setLoadError("");
    try {
      const nextStore = await createOrUpdateStore(storeForm);
      setStore(nextStore);
      setStoreForm(nextStore);
    } catch (error) {
      setLoadError(error?.message || "Unable to save store.");
    } finally {
      setSaving("");
    }
  };

  const saveCurrentProduct = async () => {
    setSaving("product");
    setLoadError("");
    try {
      await saveProduct(store.id, productForm);
      setProductForm(blankProduct);
    } catch (error) {
      setLoadError(error?.message || "Unable to save product.");
    } finally {
      setSaving("");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f3fb] p-4">
        <div className="max-w-6xl mx-auto h-96 rounded-[32px] bg-white animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f3fb] pb-28">
      <section className="bg-gradient-to-br from-slate-950 via-indigo-800 to-violet-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-3 py-1 text-xs font-bold">
            <FiShield /> Seller Studio
          </span>
          <h1 className="mt-4 text-4xl lg:text-6xl font-black">Build your Pawppy store.</h1>
          <p className="mt-3 max-w-2xl text-violet-100">
            Apply for vendor approval, create your branded storefront, publish pet products, and receive order requests.
          </p>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        <StatusBanner application={application} />

        {loadError && (
          <div className="rounded-[24px] border border-rose-100 bg-rose-50 p-4 text-sm font-bold text-rose-700">
            {loadError}
          </div>
        )}

        <section className="rounded-[28px] bg-white border border-violet-100 p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className={`w-11 h-11 rounded-2xl flex items-center justify-center ${user?.emailVerified ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
                <FiMail />
              </span>
              <div>
                <h2 className="text-lg font-black text-slate-800">Verified contact email</h2>
                <p className="text-sm text-slate-500">{user?.email || "Sign in to continue"}</p>
                <p className={`text-xs font-bold mt-1 ${user?.emailVerified ? "text-emerald-600" : "text-amber-600"}`}>
                  {user?.emailVerified ? "Verified and ready for vendor submission." : "Verification is required before submitting your vendor profile."}
                </p>
                {emailMessage && <p className="text-xs text-violet-600 font-bold mt-2">{emailMessage}</p>}
              </div>
            </div>
            {!user?.emailVerified && (
              <div className="flex gap-2">
                <button onClick={resendVerification} disabled={saving === "email"} className="rounded-full bg-violet-600 text-white px-4 py-2 text-xs font-black disabled:bg-slate-200 disabled:text-slate-400">
                  {saving === "email" ? "Sending..." : "Send link"}
                </button>
                <button onClick={refreshEmailVerification} className="rounded-full bg-slate-100 text-slate-700 px-4 py-2 text-xs font-black">
                  I verified
                </button>
              </div>
            )}
          </div>
        </section>

        {!application || application.status === "rejected" ? (
          <section className="rounded-[28px] bg-white border border-violet-100 p-5 lg:p-7 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <span className="w-11 h-11 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center"><FiShoppingBag /></span>
              <div>
                <h2 className="text-xl font-black text-slate-800">Vendor application</h2>
                <p className="text-sm text-slate-400">Tell us who you are and what you sell.</p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              {[
                ["businessName", "Business name"],
                ["contactName", "Contact person"],
                ["businessEmail", "Business email"],
                ["phone", "Phone"],
                ["city", "City"],
                ["businessType", "Business type"],
              ].map(([field, label]) => (
                <input
                  key={field}
                  value={applicationForm[field]}
                  onChange={(event) => setApplicationForm((current) => ({ ...current, [field]: event.target.value }))}
                  placeholder={label}
                  className="rounded-2xl border border-violet-100 bg-violet-50/40 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-violet-200"
                />
              ))}
              <textarea
                value={applicationForm.experience}
                onChange={(event) => setApplicationForm((current) => ({ ...current, experience: event.target.value }))}
                placeholder="Business experience"
                rows={4}
                className="md:col-span-2 rounded-2xl border border-violet-100 bg-violet-50/40 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-violet-200"
              />
              <textarea
                value={applicationForm.catalogSummary}
                onChange={(event) => setApplicationForm((current) => ({ ...current, catalogSummary: event.target.value }))}
                placeholder="Products you plan to sell"
                rows={4}
                className="md:col-span-2 rounded-2xl border border-violet-100 bg-violet-50/40 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-violet-200"
              />
              <div className="md:col-span-2 rounded-[24px] border border-violet-100 bg-violet-50/30 p-4">
                <div className="flex items-center gap-2 mb-4">
                  <FiFileText className="text-violet-500" />
                  <h3 className="font-black text-slate-800">Compliance documents</h3>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  {VENDOR_DOCUMENT_TYPES.map((documentType) => {
                    const uploaded = applicationForm.documents?.[documentType.id];
                    return (
                      <label key={documentType.id} className="rounded-2xl border border-violet-100 bg-white p-3 cursor-pointer hover:border-violet-300 transition-colors">
                        <input
                          type="file"
                          accept=".pdf,image/png,image/jpeg,image/webp"
                          className="sr-only"
                          onChange={(event) => handleDocumentUpload(documentType.id, event.target.files?.[0])}
                        />
                        <span className="flex items-center justify-between gap-3">
                          <span className="min-w-0">
                            <span className="block text-sm font-black text-slate-700">{documentType.label}</span>
                            <span className={`block text-xs truncate ${uploaded ? "text-emerald-600" : "text-slate-400"}`}>
                              {uploaded ? uploaded.name : "PDF, JPG, PNG, WEBP up to 2MB"}
                            </span>
                          </span>
                          <span className={`w-9 h-9 rounded-full flex items-center justify-center ${uploaded ? "bg-emerald-50 text-emerald-600" : "bg-violet-50 text-violet-600"}`}>
                            {uploadingDocument === documentType.id ? "..." : <FiUploadCloud />}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
              <textarea
                value={applicationForm.documentsNote}
                onChange={(event) => setApplicationForm((current) => ({ ...current, documentsNote: event.target.value }))}
                placeholder="Licenses, GST, address proof, or notes for vetting"
                rows={3}
                className="md:col-span-2 rounded-2xl border border-violet-100 bg-violet-50/40 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-violet-200"
              />
            </div>
            <button
              onClick={apply}
              disabled={saving === "application" || !user?.emailVerified || !applicationForm.businessName || !applicationForm.phone}
              className="mt-5 rounded-full bg-violet-600 disabled:bg-slate-200 disabled:text-slate-400 text-white px-6 py-3 text-sm font-black"
            >
              {saving === "application" ? "Submitting..." : "Submit for vetting"}
            </button>
          </section>
        ) : null}

        {application?.status === "approved" && (
          <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-5">
            <section className="rounded-[28px] bg-white border border-violet-100 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-xl font-black text-slate-800">Store profile</h2>
                  {store?.slug && (
                    <a href={`/shop/store/${store.slug}`} className="text-xs text-violet-600 font-bold inline-flex items-center gap-1 mt-1">
                      {store.slug}.pawppy.in <FiExternalLink />
                    </a>
                  )}
                </div>
                <FiShoppingBag className="text-violet-300" size={28} />
              </div>
              <div className="space-y-3">
                {[
                  ["storeName", "Store name"],
                  ["tagline", "Short tagline"],
                  ["city", "City"],
                  ["supportPhone", "Support phone"],
                  ["supportEmail", "Support email"],
                  ["coverImageUrl", "Cover image URL"],
                ].map(([field, label]) => (
                  <input
                    key={field}
                    value={storeForm[field] || ""}
                    onChange={(event) => setStoreForm((current) => ({ ...current, [field]: event.target.value }))}
                    placeholder={label}
                    className="w-full rounded-2xl border border-violet-100 bg-violet-50/40 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-violet-200"
                  />
                ))}
                <textarea
                  value={storeForm.description || ""}
                  onChange={(event) => setStoreForm((current) => ({ ...current, description: event.target.value }))}
                  placeholder="Store description"
                  rows={4}
                  className="w-full rounded-2xl border border-violet-100 bg-violet-50/40 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-violet-200"
                />
              </div>
              <button
                onClick={saveStore}
                disabled={saving === "store" || !storeForm.storeName}
                className="mt-5 w-full rounded-full bg-violet-600 disabled:bg-slate-200 disabled:text-slate-400 text-white py-3 text-sm font-black"
              >
                {saving === "store" ? "Saving..." : store ? "Update store" : "Create store"}
              </button>
            </section>

            <section className="rounded-[28px] bg-white border border-violet-100 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-xl font-black text-slate-800">Products</h2>
                  <p className="text-sm text-slate-400">{products.length} listed</p>
                </div>
                <FiShoppingBag className="text-violet-300" size={28} />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <input value={productForm.name} onChange={(event) => setProductForm((current) => ({ ...current, name: event.target.value }))} placeholder="Product name" className="rounded-2xl border border-violet-100 bg-violet-50/40 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-violet-200" />
                <select value={productForm.category} onChange={(event) => setProductForm((current) => ({ ...current, category: event.target.value }))} className="rounded-2xl border border-violet-100 bg-violet-50/40 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-violet-200">
                  {PRODUCT_CATEGORIES.map((item) => <option key={item}>{item}</option>)}
                </select>
                <input type="number" min="0" value={productForm.price} onChange={(event) => setProductForm((current) => ({ ...current, price: event.target.value }))} placeholder="Price" className="rounded-2xl border border-violet-100 bg-violet-50/40 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-violet-200" />
                <input type="number" min="0" value={productForm.inventory} onChange={(event) => setProductForm((current) => ({ ...current, inventory: event.target.value }))} placeholder="Inventory" className="rounded-2xl border border-violet-100 bg-violet-50/40 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-violet-200" />
                <input value={productForm.imageUrl} onChange={(event) => setProductForm((current) => ({ ...current, imageUrl: event.target.value }))} placeholder="Image URL" className="sm:col-span-2 rounded-2xl border border-violet-100 bg-violet-50/40 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-violet-200" />
                <textarea value={productForm.description} onChange={(event) => setProductForm((current) => ({ ...current, description: event.target.value }))} placeholder="Description" rows={3} className="sm:col-span-2 rounded-2xl border border-violet-100 bg-violet-50/40 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-violet-200" />
              </div>
              <button onClick={saveCurrentProduct} disabled={saving === "product" || !store || !productForm.name || !productForm.price} className="mt-4 rounded-full bg-slate-950 disabled:bg-slate-200 disabled:text-slate-400 text-white px-5 py-3 text-sm font-black flex items-center gap-2">
                <FiPlus /> {saving === "product" ? "Saving..." : productForm.id ? "Update product" : "Add product"}
              </button>

              <div className="mt-5 space-y-3">
                {products.map((product) => (
                  <motion.div key={product.id} layout className="rounded-2xl border border-violet-100 p-3 flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-violet-100 overflow-hidden flex items-center justify-center text-violet-300">
                      {product.imageUrl ? <img src={product.imageUrl} alt="" className="w-full h-full object-cover" /> : <FiPackage />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 truncate">{product.name}</p>
                      <p className="text-xs text-slate-400">{product.category} · {formatPrice(product.price)} · {product.inventory} in stock</p>
                    </div>
                    <button onClick={() => setProductForm(product)} className="w-9 h-9 rounded-full bg-violet-50 text-violet-600 flex items-center justify-center"><FiEdit3 /></button>
                  </motion.div>
                ))}
              </div>
            </section>
          </div>
        )}

        {store && (
          <section className="rounded-[28px] bg-white border border-violet-100 p-5 shadow-sm">
            <h2 className="text-xl font-black text-slate-800">Order requests</h2>
            <div className="mt-4 grid gap-3">
              {orders.length === 0 ? (
                <p className="text-sm text-slate-400">No order requests yet.</p>
              ) : orders.map((order) => (
                <div key={order.id} className="rounded-2xl border border-violet-100 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-black text-slate-800">{order.buyerName}</p>
                      <p className="text-xs text-slate-400">{order.buyerPhone} · {order.address?.city}</p>
                    </div>
                    <span className="rounded-full bg-amber-50 text-amber-700 text-xs font-bold px-3 py-1">{order.status}</span>
                  </div>
                  <p className="mt-3 text-sm font-bold text-violet-700">{formatPrice(order.subtotal)}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
