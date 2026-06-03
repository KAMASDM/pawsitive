import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ClipboardList, PackageCheck, Star } from "lucide-react";
import { auth } from "../../../firebase";
import { formatCurrency } from "../services/productService";
import {
  requestCustomerOrderAction,
  subscribeCustomerOrders,
  subscribeOrder,
  submitReview,
} from "../services/cartService";

const statusClass = "rounded-full bg-violet-50 px-3 py-1 text-xs font-black text-violet-700";

const STATUS_LABELS = {
  unfulfilled: "Unfulfilled",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  return_requested: "Return requested",
  return_approved: "Return approved",
  return_completed: "Return completed",
};

const StarPicker = ({ value, onChange }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((n) => (
      <button
        key={n}
        type="button"
        onClick={() => onChange(n)}
        className={`text-xl ${n <= value ? "text-amber-400" : "text-slate-200"}`}
      >
        ★
      </button>
    ))}
  </div>
);

const ReviewForm = ({ order }) => {
  const [productId, setProductId] = useState(order.items?.[0]?.productId || "");
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  const handleSubmit = async () => {
    if (!rating || !productId) return;
    setSubmitting(true);
    setErr("");
    try {
      await submitReview({ productId, orderId: order.id, rating, title, body });
      setDone(true);
    } catch (e) {
      setErr(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="mt-5 rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
        Thanks for your review!
      </div>
    );
  }

  return (
    <div className="mt-5 rounded-2xl bg-slate-50 p-4">
      <p className="flex items-center gap-2 text-sm font-black text-slate-800">
        <Star className="h-4 w-4 text-amber-400" /> Leave a review
      </p>
      {order.items?.length > 1 && (
        <select
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold"
        >
          {order.items.map((item) => (
            <option key={item.productId} value={item.productId}>{item.title}</option>
          ))}
        </select>
      )}
      <div className="mt-3">
        <StarPicker value={rating} onChange={setRating} />
      </div>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Review headline"
        className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Your experience with this product..."
        rows={3}
        className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
      />
      {err && <p className="mt-2 text-xs font-bold text-rose-600">{err}</p>}
      <button
        disabled={submitting || !rating}
        onClick={handleSubmit}
        className="mt-3 rounded-full bg-[#20164d] px-5 py-2 text-sm font-black text-white disabled:opacity-60"
      >
        {submitting ? "Submitting..." : "Submit review"}
      </button>
    </div>
  );
};

export const OrderDetail = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState("");
  useEffect(() => subscribeOrder(id, setOrder), [id]);

  const submitAction = async (action) => {
    setBusy(action);
    try {
      await requestCustomerOrderAction({ orderId: id, action, reason });
      setReason("");
    } finally {
      setBusy("");
    }
  };

  if (!order) return <div className="min-h-screen bg-[#f7f4ff] p-5"><div className="mx-auto h-80 max-w-4xl animate-pulse rounded-3xl bg-white" /></div>;

  const tb = order.amounts?.taxBreakdown;
  const hasGstBreakdown = tb && (tb.cgst > 0 || tb.sgst > 0 || tb.igst > 0);

  return (
    <div className="min-h-screen bg-[#f7f4ff] px-4 py-5 pb-28 sm:px-6 lg:px-8">
      <main className="mx-auto max-w-4xl">
        <section className="rounded-3xl bg-[#20164d] p-5 text-white">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-black">
            <PackageCheck className="h-4 w-4" /> Order confirmed
          </span>
          <h1 className="mt-4 text-3xl font-black">{order.orderNumber}</h1>
          <p className="mt-2 text-sm text-violet-100">Payment method: Pay on delivery</p>
        </section>

        <section className="mt-4 rounded-3xl border border-violet-100 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap gap-2">
            <span className={statusClass}>{order.paymentStatus}</span>
            <span className={statusClass}>{STATUS_LABELS[order.fulfillmentStatus] || order.fulfillmentStatus}</span>
            {order.returnRequests?.length > 0 && (
              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">
                Return: {order.returnRequests[order.returnRequests.length - 1]?.status}
              </span>
            )}
          </div>

          <div className="mt-4 divide-y divide-slate-100">
            {order.items?.map((item) => (
              <div key={item.productId} className="flex justify-between gap-3 py-3 text-sm">
                <span className="font-bold text-slate-700">{item.title} × {item.quantity}</span>
                <span className="font-black">{formatCurrency(item.lineTotal)}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Subtotal</span>
              <span className="font-black">{formatCurrency(order.amounts?.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Shipping</span>
              <span className="font-black">{formatCurrency(order.amounts?.shipping)}</span>
            </div>
            {hasGstBreakdown ? (
              <>
                {tb.cgst > 0 && <div className="flex justify-between"><span className="text-slate-400">CGST</span><span className="font-semibold">{formatCurrency(tb.cgst)}</span></div>}
                {tb.sgst > 0 && <div className="flex justify-between"><span className="text-slate-400">SGST</span><span className="font-semibold">{formatCurrency(tb.sgst)}</span></div>}
                {tb.igst > 0 && <div className="flex justify-between"><span className="text-slate-400">IGST</span><span className="font-semibold">{formatCurrency(tb.igst)}</span></div>}
              </>
            ) : (
              <div className="flex justify-between">
                <span className="text-slate-500">Tax</span>
                <span className="font-black">{formatCurrency(order.amounts?.tax)}</span>
              </div>
            )}
            {order.amounts?.discount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Coupon{order.coupon?.code ? ` (${order.coupon.code})` : ""}</span>
                <span className="font-black">− {formatCurrency(order.amounts.discount)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-slate-100 pt-2 text-base">
              <span className="font-black">Total</span>
              <span className="font-black text-[#20164d]">{formatCurrency(order.amounts?.total)}</span>
            </div>
          </div>

          {/* Customer actions */}
          <div className="mt-5 rounded-2xl bg-slate-50 p-4">
            <p className="text-sm font-black text-slate-800">Need help with this order?</p>
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Reason or note"
              className="mt-3 w-full rounded-xl border-slate-200 text-sm"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              {["unfulfilled", "processing"].includes(order.fulfillmentStatus) && (
                <button
                  disabled={busy === "cancel"}
                  onClick={() => submitAction("cancel")}
                  className="rounded-full bg-rose-100 px-4 py-2 text-sm font-black text-rose-700"
                >
                  {busy === "cancel" ? "Submitting..." : "Cancel order"}
                </button>
              )}
              {order.fulfillmentStatus === "delivered" && !order.returnRequests?.length && (
                <button
                  disabled={busy === "return"}
                  onClick={() => submitAction("return")}
                  className="rounded-full bg-amber-100 px-4 py-2 text-sm font-black text-amber-700"
                >
                  {busy === "return" ? "Submitting..." : "Request return"}
                </button>
              )}
            </div>
          </div>

          {order.fulfillmentStatus === "delivered" && <ReviewForm order={order} />}
        </section>
      </main>
    </div>
  );
};

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  useEffect(() => subscribeCustomerOrders(auth.currentUser?.uid, setOrders), []);

  return (
    <div className="min-h-screen bg-[#f7f4ff] px-4 py-5 pb-28 sm:px-6 lg:px-8">
      <main className="mx-auto max-w-5xl">
        <section className="mb-5 rounded-3xl bg-[#20164d] p-5 text-white">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-black">
            <ClipboardList className="h-4 w-4" /> Pawppy orders
          </span>
          <h1 className="mt-4 text-3xl font-black">My Orders</h1>
        </section>
        <div className="overflow-hidden rounded-3xl border border-violet-100 bg-white shadow-sm">
          {orders.length === 0 ? (
            <div className="p-10 text-center">
              <ClipboardList className="mx-auto h-12 w-12 text-violet-300" />
              <p className="mt-3 font-black text-slate-950">No orders yet</p>
              <Link to="/shop" className="mt-5 inline-flex rounded-full bg-[#20164d] px-5 py-3 text-sm font-black text-white">
                Shop now
              </Link>
            </div>
          ) : orders.map((order) => (
            <Link
              key={order.id}
              to={`/orders/${order.id}`}
              className="grid gap-2 border-t border-slate-100 p-4 first:border-t-0 sm:grid-cols-[1fr_auto] sm:items-center"
            >
              <div>
                <p className="font-black text-slate-950">{order.orderNumber}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {order.items?.length || 0} items · {STATUS_LABELS[order.fulfillmentStatus] || order.fulfillmentStatus}
                </p>
              </div>
              <p className="font-black text-[#20164d]">{formatCurrency(order.amounts?.total)}</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
};

export default OrdersPage;
