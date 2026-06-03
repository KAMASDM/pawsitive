import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiArrowLeft,
  FiCheckCircle,
  FiMinus,
  FiPackage,
  FiPlus,
  FiShoppingCart,
  FiShoppingBag,
  FiTruck,
  FiX,
} from "react-icons/fi";
import {
  getProduct,
  getStoreBySlug,
  getStoreSlugFromHost,
  submitOrderDraft,
  subscribeStoreProducts,
} from "../services/ecommerceService";
import { auth } from "../../../firebase";

const formatPrice = (value) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value || 0);

const emptyCheckout = {
  name: "",
  email: "",
  phone: "",
  addressLine: "",
  city: "",
  pincode: "",
  notes: "",
};

export default function Storefront({ subdomainSlug = "" }) {
  const params = useParams();
  const navigate = useNavigate();
  const storeSlug = subdomainSlug || params.storeSlug || getStoreSlugFromHost();
  const productId = params.productId;
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkout, setCheckout] = useState(emptyCheckout);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let unsubscribe = () => {};
    setLoading(true);
    getStoreBySlug(storeSlug).then(async (nextStore) => {
      setStore(nextStore);
      if (!nextStore) {
        setLoading(false);
        return;
      }
      unsubscribe = subscribeStoreProducts(nextStore.id, (items) => {
        setProducts(items.filter((product) => product.status === "active"));
        setLoading(false);
      });
      if (productId) {
        const product = await getProduct(nextStore.id, productId);
        setSelectedProduct(product);
      } else {
        setSelectedProduct(null);
      }
    });
    return () => unsubscribe();
  }, [productId, storeSlug]);

  useEffect(() => {
    const user = auth.currentUser;
    setCheckout((current) => ({
      ...current,
      name: current.name || user?.displayName || "",
      email: current.email || user?.email || "",
    }));
  }, []);

  const visibleProducts = useMemo(
    () => products.filter((product) => !selectedProduct || product.id !== selectedProduct.id),
    [products, selectedProduct]
  );

  const addToCart = (product) => {
    setCart((current) => {
      const existing = current.find((item) => item.id === product.id);
      if (existing) {
        return current.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...current, {
        id: product.id,
        storeId: product.storeId,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl || "",
        quantity: 1,
      }];
    });
  };

  const updateQuantity = (productId, delta) => {
    setCart((current) =>
      current
        .map((item) => item.id === productId ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item)
        .filter((item) => item.quantity > 0)
    );
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const submitOrder = async () => {
    setSubmitting(true);
    try {
      const order = await submitOrderDraft({
        store,
        items: cart,
        buyer: checkout,
        address: {
          addressLine: checkout.addressLine,
          city: checkout.city,
          pincode: checkout.pincode,
        },
        notes: checkout.notes,
      });
      setOrderSuccess(order);
      setCart([]);
      setCheckoutOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f3fb] p-4">
        <div className="max-w-6xl mx-auto space-y-4 animate-pulse">
          <div className="h-56 rounded-[32px] bg-violet-100" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((item) => <div key={item} className="h-64 rounded-[24px] bg-white" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-[#f5f3fb] flex items-center justify-center p-4">
        <div className="bg-white rounded-[28px] border border-violet-100 p-8 text-center max-w-sm">
          <FiShoppingBag className="mx-auto text-violet-200" size={44} />
          <p className="font-black text-slate-800 mt-3">Store not found</p>
          <button onClick={() => navigate("/shop")} className="mt-5 rounded-full bg-violet-600 text-white px-5 py-2 text-sm font-bold">
            Browse Pawppy Market
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f3fb] pb-32">
      <section className="bg-gradient-to-br from-violet-700 via-indigo-700 to-slate-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          <button onClick={() => navigate("/shop")} className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-violet-100">
            <FiArrowLeft /> Marketplace
          </button>
          <div className="grid lg:grid-cols-[1fr_auto] gap-6 items-end">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-3 py-1 text-xs font-bold">
                <FiCheckCircle /> Pawppy approved seller
              </span>
              <h1 className="mt-4 text-4xl lg:text-6xl font-black">{store.storeName}</h1>
              <p className="mt-3 text-violet-100 max-w-2xl">{store.tagline || store.description}</p>
              <p className="mt-3 text-sm text-violet-200">{store.slug}.pawppy.in</p>
            </div>
            <div className="rounded-[26px] bg-white/10 border border-white/15 p-4 backdrop-blur-xl min-w-[220px]">
              <p className="text-xs text-violet-200 font-bold uppercase">Fulfilment</p>
              <p className="mt-2 flex items-center gap-2 font-extrabold"><FiTruck /> {store.city || "India"} delivery</p>
              <p className="text-sm text-violet-100 mt-1">{store.supportPhone || store.supportEmail || "Seller will confirm order details."}</p>
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {selectedProduct && (
          <section className="grid lg:grid-cols-[0.9fr_1.1fr] gap-5 mb-8">
            <div className="rounded-[28px] overflow-hidden bg-white border border-violet-100">
              <div className="aspect-square bg-violet-100">
                {selectedProduct.imageUrl ? (
                  <img src={selectedProduct.imageUrl} alt={selectedProduct.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-violet-300"><FiPackage size={70} /></div>
                )}
              </div>
            </div>
            <div className="rounded-[28px] bg-white border border-violet-100 p-5 lg:p-7">
              <p className="text-xs font-bold uppercase text-violet-500">{selectedProduct.category}</p>
              <h2 className="mt-2 text-3xl lg:text-5xl font-black text-slate-900">{selectedProduct.name}</h2>
              <p className="mt-3 text-slate-500">{selectedProduct.description}</p>
              <p className="mt-5 text-3xl font-black text-violet-700">{formatPrice(selectedProduct.price)}</p>
              <button
                onClick={() => addToCart(selectedProduct)}
                className="mt-6 w-full sm:w-auto rounded-full bg-gradient-to-br from-violet-600 to-indigo-700 text-white px-7 py-3 text-sm font-extrabold shadow-xl flex items-center justify-center gap-2"
              >
                <FiShoppingCart /> Add to cart
              </button>
            </div>
          </section>
        )}

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black text-slate-800">{selectedProduct ? "More from this store" : "Products"}</h2>
          <span className="text-sm text-slate-400">{products.length} active</span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {visibleProducts.map((product) => (
            <button
              key={product.id}
              onClick={() => navigate(`/shop/${store.slug}/${product.id}`)}
              className="rounded-[24px] overflow-hidden bg-white border border-violet-100 text-left shadow-sm"
            >
              <div className="aspect-square bg-violet-100">
                {product.imageUrl ? <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-violet-300"><FiPackage size={38} /></div>}
              </div>
              <div className="p-3">
                <p className="text-sm font-extrabold text-slate-800 line-clamp-2 min-h-[40px]">{product.name}</p>
                <p className="mt-2 text-sm font-black text-violet-700">{formatPrice(product.price)}</p>
              </div>
            </button>
          ))}
        </div>
      </main>

      {cart.length > 0 && (
        <div className="fixed left-4 right-4 bottom-[118px] md:bottom-5 z-40">
          <div className="max-w-2xl mx-auto rounded-full bg-slate-950 text-white shadow-2xl px-4 py-3 flex items-center justify-between">
            <span className="text-sm font-bold">{cart.reduce((sum, item) => sum + item.quantity, 0)} items · {formatPrice(subtotal)}</span>
            <button onClick={() => setCheckoutOpen(true)} className="rounded-full bg-white text-violet-700 px-4 py-2 text-sm font-extrabold">Checkout</button>
          </div>
        </div>
      )}

      <AnimatePresence>
        {checkoutOpen && (
          <motion.div className="fixed inset-0 z-[230] bg-slate-950/50 backdrop-blur-sm p-4 flex items-end sm:items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="w-full max-w-lg rounded-[28px] bg-white shadow-2xl overflow-hidden" initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }}>
              <div className="p-4 border-b border-violet-100 flex items-center justify-between">
                <div>
                  <p className="font-black text-slate-800">Order request</p>
                  <p className="text-xs text-slate-400">Payment gateway will be added later.</p>
                </div>
                <button onClick={() => setCheckoutOpen(false)} className="w-9 h-9 rounded-full bg-violet-50 flex items-center justify-center"><FiX /></button>
              </div>
              <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-violet-100 overflow-hidden">{item.imageUrl && <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{item.name}</p>
                      <p className="text-xs text-violet-600 font-bold">{formatPrice(item.price)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 rounded-full bg-violet-50 flex items-center justify-center"><FiMinus /></button>
                      <span className="text-sm font-bold">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 rounded-full bg-violet-50 flex items-center justify-center"><FiPlus /></button>
                    </div>
                  </div>
                ))}
                {["name", "email", "phone", "addressLine", "city", "pincode"].map((field) => (
                  <input
                    key={field}
                    value={checkout[field]}
                    onChange={(event) => setCheckout((current) => ({ ...current, [field]: event.target.value }))}
                    placeholder={{
                      name: "Full name",
                      email: "Email",
                      phone: "Phone",
                      addressLine: "Address",
                      city: "City",
                      pincode: "Pincode",
                    }[field]}
                    className="w-full rounded-2xl border border-violet-100 bg-violet-50/40 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-violet-200"
                  />
                ))}
                <textarea
                  value={checkout.notes}
                  onChange={(event) => setCheckout((current) => ({ ...current, notes: event.target.value }))}
                  placeholder="Notes for seller"
                  rows={3}
                  className="w-full rounded-2xl border border-violet-100 bg-violet-50/40 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-violet-200"
                />
                <button
                  onClick={submitOrder}
                  disabled={submitting || !checkout.name || !checkout.phone || !checkout.addressLine}
                  className="w-full rounded-full bg-violet-600 disabled:bg-slate-200 disabled:text-slate-400 text-white py-3 text-sm font-black"
                >
                  {submitting ? "Submitting..." : `Submit order request · ${formatPrice(subtotal)}`}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {orderSuccess && (
          <motion.div className="fixed inset-0 z-[240] bg-slate-950/50 backdrop-blur-sm p-4 flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="bg-white rounded-[28px] p-7 max-w-sm text-center">
              <FiCheckCircle className="mx-auto text-emerald-500" size={46} />
              <p className="mt-3 font-black text-slate-800">Order request sent</p>
              <p className="mt-1 text-sm text-slate-400">The seller can confirm fulfilment and payment details.</p>
              <button onClick={() => setOrderSuccess(null)} className="mt-5 rounded-full bg-violet-600 text-white px-6 py-2 text-sm font-bold">Done</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
