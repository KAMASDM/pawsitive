import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Boxes, ClipboardList, LayoutDashboard, ShoppingCart, Store, Tag, TrendingUp, Users } from "lucide-react";
import { ensureCommerceAdminClaim } from "../auth/useCommerceUser";
import { formatCurrency, subscribeAdminProducts } from "../services/productService";
import { subscribeAdminCarts, subscribeAdminOrders } from "../services/adminOrderService";
import { subscribeAdminVendors } from "../services/adminVendorService";

const cardClass = "rounded-2xl bg-white p-4 shadow-sm border border-slate-100";

const MiniBar = ({ value, max, color = "bg-violet-500" }) => (
  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
    <div className={`h-full rounded-full ${color} transition-all`} style={{ width: max > 0 ? `${Math.min(100, (value / max) * 100)}%` : "0%" }} />
  </div>
);

const FULFILLMENT_COLORS = {
  unfulfilled: "bg-amber-400",
  processing: "bg-blue-400",
  shipped: "bg-violet-400",
  delivered: "bg-emerald-500",
  cancelled: "bg-rose-400",
  return_requested: "bg-orange-400",
  return_approved: "bg-teal-400",
  return_completed: "bg-slate-400",
};

const STATUS_LABELS = {
  unfulfilled: "Unfulfilled",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  return_requested: "Return req.",
  return_approved: "Return appr.",
  return_completed: "Return done",
};

function dayKey(ts) {
  const d = ts?.toDate ? ts.toDate() : ts instanceof Date ? ts : null;
  if (!d) return null;
  return d.toISOString().slice(0, 10);
}

const AdminCommerceDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [carts, setCarts] = useState([]);
  const [products, setProducts] = useState([]);
  const [vendors, setVendors] = useState([]);

  useEffect(() => {
    let cleanups = [];
    ensureCommerceAdminClaim().then(() => {
      cleanups = [
        subscribeAdminOrders(setOrders),
        subscribeAdminCarts(setCarts),
        subscribeAdminProducts(setProducts),
        subscribeAdminVendors(setVendors),
      ];
    });
    return () => cleanups.forEach((cleanup) => cleanup?.());
  }, []);

  const metrics = useMemo(() => {
    const activeCarts = carts.filter((c) => c.status === "active");
    const deliveredOrders = orders.filter((o) => o.fulfillmentStatus === "delivered");
    const revenue = orders.reduce((sum, o) => sum + Number(o.amounts?.total || 0), 0);
    const avgOrderValue = orders.length > 0 ? revenue / orders.length : 0;
    const conversionRate = (carts.length > 0)
      ? ((orders.length / carts.length) * 100).toFixed(1)
      : "0.0";
    return {
      revenue,
      avgOrderValue,
      deliveredOrders: deliveredOrders.length,
      activeCarts: activeCarts.length,
      abandoned: carts.filter((c) => c.status === "abandoned").length,
      activeProducts: products.filter((p) => p.status === "active").length,
      approvedVendors: vendors.filter((v) => v.status === "approved").length,
      conversionRate,
    };
  }, [carts, orders, products, vendors]);

  // Revenue by day (last 14 days)
  const revenueByDay = useMemo(() => {
    const map = {};
    const today = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      map[d.toISOString().slice(0, 10)] = 0;
    }
    orders.forEach((o) => {
      const key = dayKey(o.createdAt);
      if (key && key in map) map[key] += Number(o.amounts?.total || 0);
    });
    const entries = Object.entries(map);
    const maxVal = Math.max(...entries.map(([, v]) => v), 1);
    return entries.map(([date, value]) => ({
      label: new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      value,
      maxVal,
    }));
  }, [orders]);

  // Order status distribution
  const statusDist = useMemo(() => {
    const counts = {};
    orders.forEach((o) => {
      const s = o.fulfillmentStatus || "unfulfilled";
      counts[s] = (counts[s] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([status, count]) => ({ status, count, pct: orders.length > 0 ? Math.round((count / orders.length) * 100) : 0 }));
  }, [orders]);

  // Top products by revenue
  const topProducts = useMemo(() => {
    const map = {};
    orders.forEach((o) => {
      (o.items || []).forEach((item) => {
        if (!map[item.productId]) map[item.productId] = { title: item.title, revenue: 0, units: 0 };
        map[item.productId].revenue += item.lineTotal || 0;
        map[item.productId].units += item.quantity || 0;
      });
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 8);
  }, [orders]);

  // Top vendors by revenue
  const topVendors = useMemo(() => {
    const map = {};
    orders.forEach((o) => {
      (o.items || []).forEach((item) => {
        if (!map[item.vendorId]) map[item.vendorId] = { name: item.vendorName || item.vendorId, revenue: 0, orders: new Set() };
        map[item.vendorId].revenue += item.lineTotal || 0;
        map[item.vendorId].orders.add(o.id);
      });
    });
    return Object.entries(map)
      .map(([id, v]) => ({ id, name: v.name, revenue: v.revenue, orderCount: v.orders.size }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);
  }, [orders]);

  const maxProductRevenue = topProducts[0]?.revenue || 1;
  const maxVendorRevenue = topVendors[0]?.revenue || 1;
  const maxDayRevenue = Math.max(...revenueByDay.map((d) => d.value), 1);

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      <section className="bg-slate-950 text-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-black">
            <LayoutDashboard className="h-4 w-4" />
            Commerce Admin
          </span>
          <h1 className="mt-4 text-4xl font-black">Marketplace dashboard</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-300">Orders, vendors, carts, and product moderation in one operating view.</p>
        </div>
      </section>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* KPI row */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className={cardClass}>
            <p className="text-xs font-black uppercase text-slate-400">Total COD value</p>
            <p className="mt-2 text-2xl font-black text-slate-950">{formatCurrency(metrics.revenue)}</p>
            <p className="mt-1 text-xs text-slate-400">Avg {formatCurrency(metrics.avgOrderValue)} / order</p>
          </div>
          <div className={cardClass}>
            <p className="text-xs font-black uppercase text-slate-400">Orders</p>
            <p className="mt-2 text-2xl font-black text-slate-950">{orders.length}</p>
            <p className="mt-1 text-xs text-slate-400">{metrics.deliveredOrders} delivered</p>
          </div>
          <div className={cardClass}>
            <p className="text-xs font-black uppercase text-slate-400">Cart conversion</p>
            <p className="mt-2 text-2xl font-black text-slate-950">{metrics.conversionRate}%</p>
            <p className="mt-1 text-xs text-slate-400">{metrics.activeCarts} active · {metrics.abandoned} abandoned</p>
          </div>
          <div className={cardClass}>
            <p className="text-xs font-black uppercase text-slate-400">Catalogue</p>
            <p className="mt-2 text-2xl font-black text-slate-950">{metrics.activeProducts} products</p>
            <p className="mt-1 text-xs text-slate-400">{metrics.approvedVendors} vendors</p>
          </div>
        </div>

        {/* Revenue chart */}
        <div className={`${cardClass}`}>
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-violet-500" />
            <h2 className="font-black text-slate-950">Revenue — last 14 days</h2>
          </div>
          <div className="flex items-end gap-1 overflow-x-auto pb-2">
            {revenueByDay.map(({ label, value }) => (
              <div key={label} className="flex min-w-[40px] flex-1 flex-col items-center gap-1">
                <span className="text-xs font-bold text-slate-500">{value > 0 ? formatCurrency(value).replace("₹", "") : ""}</span>
                <div
                  className="w-full rounded-t-lg bg-violet-500 transition-all"
                  style={{ height: `${Math.max(4, (value / maxDayRevenue) * 120)}px` }}
                />
                <span className="text-[10px] text-slate-400 whitespace-nowrap">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* Order status distribution */}
          <div className={cardClass}>
            <h2 className="mb-4 font-black text-slate-950">Order status breakdown</h2>
            {statusDist.length === 0 ? (
              <p className="text-sm text-slate-400">No orders yet.</p>
            ) : (
              <div className="space-y-3">
                {statusDist.map(({ status, count, pct }) => (
                  <div key={status}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-bold text-slate-700">{STATUS_LABELS[status] || status}</span>
                      <span className="font-black text-slate-950">{count} <span className="font-normal text-slate-400">({pct}%)</span></span>
                    </div>
                    <MiniBar value={count} max={orders.length} color={FULFILLMENT_COLORS[status] || "bg-slate-400"} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top vendors */}
          <div className={cardClass}>
            <h2 className="mb-4 font-black text-slate-950">Top vendors by revenue</h2>
            {topVendors.length === 0 ? (
              <p className="text-sm text-slate-400">No vendor sales yet.</p>
            ) : (
              <div className="space-y-3">
                {topVendors.map((v) => (
                  <div key={v.id}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-bold text-slate-700 truncate max-w-[180px]">{v.name}</span>
                      <span className="ml-2 shrink-0 font-black text-slate-950">{formatCurrency(v.revenue)}</span>
                    </div>
                    <MiniBar value={v.revenue} max={maxVendorRevenue} color="bg-emerald-500" />
                    <p className="mt-0.5 text-xs text-slate-400">{v.orderCount} order{v.orderCount !== 1 ? "s" : ""}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Top products */}
        <div className={cardClass}>
          <h2 className="mb-4 font-black text-slate-950">Top products by revenue</h2>
          {topProducts.length === 0 ? (
            <p className="text-sm text-slate-400">No product sales yet.</p>
          ) : (
            <div className="space-y-3">
              {topProducts.map((p, i) => (
                <div key={p.title + i} className="grid grid-cols-[1fr_auto] items-center gap-4">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-bold text-slate-700 truncate">{p.title}</span>
                      <span className="ml-3 shrink-0 font-black">{formatCurrency(p.revenue)}</span>
                    </div>
                    <MiniBar value={p.revenue} max={maxProductRevenue} color="bg-violet-500" />
                    <p className="mt-0.5 text-xs text-slate-400">{p.units} unit{p.units !== 1 ? "s" : ""} sold</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick links */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          {[
            ["/admin/vendors", Users, "Vendors", "Review applications."],
            ["/admin/products", Boxes, "Products", "Moderate listings."],
            ["/admin/orders", ClipboardList, "Orders", "Track transactions."],
            ["/admin/carts", ShoppingCart, "Carts", "Inspect abandoned carts."],
            ["/admin/coupons", Tag, "Coupons", "Manage discount codes."],
            ["/shop", Store, "Shop", "Open buyer marketplace."],
          ].map(([to, Icon, title, copy]) => (
            <Link
              key={to}
              to={to}
              className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <Icon className="h-6 w-6 text-violet-600" />
              <p className="mt-3 font-black text-slate-950">{title}</p>
              <p className="mt-1 text-xs text-slate-500">{copy}</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
};

export default AdminCommerceDashboard;
