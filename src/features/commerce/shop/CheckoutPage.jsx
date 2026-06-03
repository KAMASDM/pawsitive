import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, PackageCheck, Tag, Truck, X } from "lucide-react";
import { auth } from "../../../firebase";
import { formatCurrency } from "../services/productService";
import {
  placeCodOrder,
  saveAddress,
  subscribeActiveCart,
  subscribeSavedAddresses,
  validateCoupon,
} from "../services/cartService";

const emptyAddress = {
  name: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: "",
};

const CheckoutPage = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [address, setAddress] = useState(emptyAddress);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [saveForLater, setSaveForLater] = useState(true);
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const items = cart?.status === "active" ? cart.items || [] : [];

  useEffect(() => {
    const user = auth.currentUser;
    setAddress((current) => ({ ...current, name: user?.displayName || "", phone: user?.phoneNumber || "" }));
    const unsubscribeCart = subscribeActiveCart(setCart);
    const unsubscribeAddresses = subscribeSavedAddresses(setSavedAddresses);
    return () => {
      unsubscribeCart();
      unsubscribeAddresses();
    };
  }, []);

  const estimate = useMemo(() => {
    const subtotal = Number(cart?.subtotal || 0);
    const shipping = subtotal >= 999 || subtotal === 0 ? 0 : 49;
    const tax = Math.round(subtotal * 0.18 * 100) / 100;
    const discount = coupon ? coupon.discount : 0;
    return { subtotal, shipping, tax, discount, total: subtotal + shipping + tax - discount };
  }, [cart?.subtotal, coupon]);

  const applyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponError("");
    setValidatingCoupon(true);
    try {
      const result = await validateCoupon({ code: couponInput.trim(), cartSubtotal: estimate.subtotal });
      setCoupon(result);
      setCouponInput("");
    } catch (err) {
      setCouponError(err.message);
      setCoupon(null);
    } finally {
      setValidatingCoupon(false);
    }
  };

  const submitOrder = async () => {
    setError("");
    setPlacing(true);
    try {
      if (saveForLater) await saveAddress(address);
      const result = await placeCodOrder({ shippingAddress: address, couponCode: coupon?.code || null });
      navigate(`/orders/${result.orderId}`, { replace: true });
    } catch (placeError) {
      setError(placeError.message);
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f4ff] px-4 py-5 pb-28 sm:px-6 lg:px-8">
      <main className="mx-auto max-w-5xl">
        <div className="mb-5 rounded-3xl bg-[#20164d] p-5 text-white shadow-xl shadow-violet-200/70">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-black">
            <Truck className="h-4 w-4" />
            Pay on delivery
          </span>
          <h1 className="mt-4 text-3xl font-black">Checkout</h1>
          <p className="mt-2 text-sm text-violet-100">No online payment yet. Your order is confirmed for payment on delivery.</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
          <section className="rounded-3xl border border-violet-100 bg-white p-4 shadow-sm">
            <h2 className="flex items-center gap-2 text-lg font-black text-slate-950">
              <MapPin className="h-5 w-5 text-violet-600" /> Shipping address
            </h2>
            {savedAddresses.length > 0 && (
              <div className="mt-4 flex gap-2 overflow-x-auto">
                {savedAddresses.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setAddress({ ...emptyAddress, ...item })}
                    className="shrink-0 rounded-xl bg-violet-50 px-3 py-2 text-left text-xs font-bold text-violet-800"
                  >
                    {item.name}<br />{item.city}, {item.pincode}
                  </button>
                ))}
              </div>
            )}
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                ["name", "Full name"],
                ["phone", "Phone"],
                ["line1", "Address line 1"],
                ["line2", "Address line 2"],
                ["city", "City"],
                ["state", "State"],
                ["pincode", "Pincode"],
              ].map(([key, label]) => (
                <label key={key} className={key === "line1" || key === "line2" ? "sm:col-span-2" : ""}>
                  <span className="mb-1 block text-xs font-black uppercase text-slate-500">{label}</span>
                  <input
                    value={address[key]}
                    onChange={(event) => setAddress((current) => ({ ...current, [key]: event.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm font-semibold outline-none focus:border-violet-400"
                  />
                </label>
              ))}
            </div>
            <label className="mt-4 flex items-center gap-2 text-sm font-bold text-slate-700">
              <input type="checkbox" checked={saveForLater} onChange={(event) => setSaveForLater(event.target.checked)} />
              Save this address for next time
            </label>
          </section>

          <aside className="h-fit space-y-3">
            {/* Coupon */}
            <div className="rounded-3xl border border-violet-100 bg-white p-4 shadow-sm">
              <h2 className="flex items-center gap-2 text-sm font-black text-slate-950">
                <Tag className="h-4 w-4 text-violet-600" /> Coupon code
              </h2>
              {coupon ? (
                <div className="mt-3 flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2">
                  <span className="text-sm font-black text-emerald-700">
                    {coupon.code} — {formatCurrency(coupon.discount)} off
                  </span>
                  <button type="button" onClick={() => setCoupon(null)} className="text-slate-400 hover:text-slate-600">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="mt-3 flex gap-2">
                  <input
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === "Enter" && applyCoupon()}
                    placeholder="Enter code"
                    className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold uppercase outline-none focus:border-violet-400"
                  />
                  <button
                    type="button"
                    disabled={validatingCoupon || !couponInput.trim()}
                    onClick={applyCoupon}
                    className="rounded-xl bg-violet-100 px-4 py-2 text-sm font-black text-violet-800 disabled:opacity-60"
                  >
                    {validatingCoupon ? "..." : "Apply"}
                  </button>
                </div>
              )}
              {couponError && <p className="mt-2 text-xs font-bold text-rose-600">{couponError}</p>}
            </div>

            {/* Order summary */}
            <div className="rounded-3xl border border-violet-100 bg-white p-4 shadow-sm">
              <h2 className="flex items-center gap-2 text-lg font-black text-slate-950">
                <PackageCheck className="h-5 w-5 text-violet-600" /> Order summary
              </h2>
              <div className="mt-4 space-y-3">
                {items.map((item) => (
                  <div key={item.productId} className="flex justify-between gap-3 text-sm">
                    <span className="font-bold text-slate-600">{item.title} × {item.quantity}</span>
                    <span className="font-black">{formatCurrency(item.unitPrice * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="font-black">{formatCurrency(estimate.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Shipping</span>
                  <span className="font-black">{formatCurrency(estimate.shipping)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">GST (est.)</span>
                  <span className="font-black">{formatCurrency(estimate.tax)}</span>
                </div>
                {estimate.discount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Coupon discount</span>
                    <span className="font-black">− {formatCurrency(estimate.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-slate-100 pt-2 text-base">
                  <span className="font-black">Total (est.)</span>
                  <span className="font-black text-[#20164d]">{formatCurrency(estimate.total)}</span>
                </div>
                <p className="text-xs text-slate-400">Final totals are confirmed by the server at checkout.</p>
              </div>
              {error && <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700">{error}</p>}
              <button
                disabled={placing || items.length === 0}
                onClick={submitOrder}
                className="mt-5 w-full rounded-xl bg-[#20164d] px-4 py-3 text-sm font-black text-white disabled:opacity-60"
              >
                {placing ? "Placing order..." : "Place pay-on-delivery order"}
              </button>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default CheckoutPage;
