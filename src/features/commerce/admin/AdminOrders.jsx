import React, { useEffect, useMemo, useState } from "react";
import { ClipboardList, IndianRupee, Search } from "lucide-react";
import { ensureCommerceAdminClaim } from "../auth/useCommerceUser";
import { formatCurrency } from "../services/productService";
import { subscribeAdminOrders, updateOrderFulfillmentStatus } from "../services/adminOrderService";

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");

  useEffect(() => {
    let unsubscribe = () => {};
    ensureCommerceAdminClaim().then(() => {
      unsubscribe = subscribeAdminOrders(setOrders);
    });
    return () => unsubscribe();
  }, []);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesStatus = status === "all" || order.fulfillmentStatus === status || order.paymentStatus === status;
      const haystack = [order.orderNumber, order.customer?.name, order.customer?.email, order.customer?.phone].join(" ").toLowerCase();
      return matchesStatus && (!term || haystack.includes(term));
    });
  }, [orders, query, status]);

  const revenue = orders.reduce((sum, order) => sum + Number(order.amounts?.total || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      <section className="bg-slate-950 text-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-black"><ClipboardList className="h-4 w-4" /> Commerce Admin</span>
          <h1 className="mt-4 text-4xl font-black">Orders and transactions</h1>
        </div>
      </section>
      <main className="mx-auto max-w-7xl space-y-4 px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-white p-4 shadow-sm"><p className="text-xs font-black uppercase text-slate-400">Orders</p><p className="mt-1 text-3xl font-black">{orders.length}</p></div>
          <div className="rounded-2xl bg-white p-4 shadow-sm"><p className="text-xs font-black uppercase text-slate-400">COD value</p><p className="mt-1 text-3xl font-black">{formatCurrency(revenue)}</p></div>
          <div className="rounded-2xl bg-white p-4 shadow-sm"><IndianRupee className="mb-2 h-5 w-5 text-violet-600" /><p className="text-sm font-bold text-slate-500">Online payment gateway pending</p></div>
        </div>
        <div className="rounded-2xl bg-white p-3 shadow-sm">
          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <label className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
              <Search className="h-4 w-4 text-slate-400" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search orders" className="w-full bg-transparent text-sm font-semibold outline-none" />
            </label>
            <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold">
              <option value="all">All statuses</option>
              <option value="pending">Payment pending</option>
              <option value="unfulfilled">Unfulfilled</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          {filtered.map((order) => (
            <div key={order.id} className="border-t border-slate-100 p-4 first:border-t-0">
              <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto] lg:items-center">
                <div>
                  <p className="font-black text-slate-950">{order.orderNumber}</p>
                  <p className="text-sm text-slate-500">{order.customer?.name} · {order.customer?.phone}</p>
                  <p className="mt-1 text-xs font-bold text-violet-600">{order.paymentProvider === "cod" ? "Pay on delivery" : order.paymentProvider} · {order.fulfillmentStatus}</p>
                </div>
                <p className="font-black text-[#20164d]">{formatCurrency(order.amounts?.total)}</p>
                <select
                  value={order.fulfillmentStatus}
                  onChange={(event) => updateOrderFulfillmentStatus({ orderId: order.id, fulfillmentStatus: event.target.value, note: "Updated by admin." })}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold"
                >
                  {["unfulfilled", "processing", "shipped", "delivered", "cancelled"].map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default AdminOrders;
