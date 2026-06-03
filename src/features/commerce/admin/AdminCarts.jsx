import React, { useEffect, useMemo, useState } from "react";
import { ShoppingCart } from "lucide-react";
import { ensureCommerceAdminClaim } from "../auth/useCommerceUser";
import { formatCurrency } from "../services/productService";
import { subscribeAdminCarts } from "../services/adminOrderService";

const AdminCarts = () => {
  const [carts, setCarts] = useState([]);

  useEffect(() => {
    let unsubscribe = () => {};
    ensureCommerceAdminClaim().then(() => {
      unsubscribe = subscribeAdminCarts(setCarts);
    });
    return () => unsubscribe();
  }, []);

  const metrics = useMemo(() => {
    const active = carts.filter((cart) => cart.status === "active");
    const abandoned = active.filter((cart) => {
      const updated = cart.updatedAt?.toDate?.() || new Date(cart.updatedAt || 0);
      return Date.now() - updated.getTime() > 24 * 60 * 60 * 1000;
    });
    return {
      active: active.length,
      abandoned: abandoned.length,
      value: active.reduce((sum, cart) => sum + Number(cart.subtotal || 0), 0),
    };
  }, [carts]);

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      <section className="bg-slate-950 text-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-black"><ShoppingCart className="h-4 w-4" /> Commerce Admin</span>
          <h1 className="mt-4 text-4xl font-black">Carts</h1>
        </div>
      </section>
      <main className="mx-auto max-w-7xl space-y-4 px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-white p-4 shadow-sm"><p className="text-xs font-black uppercase text-slate-400">Active carts</p><p className="mt-1 text-3xl font-black">{metrics.active}</p></div>
          <div className="rounded-2xl bg-white p-4 shadow-sm"><p className="text-xs font-black uppercase text-slate-400">Abandoned 24h</p><p className="mt-1 text-3xl font-black">{metrics.abandoned}</p></div>
          <div className="rounded-2xl bg-white p-4 shadow-sm"><p className="text-xs font-black uppercase text-slate-400">Cart value</p><p className="mt-1 text-3xl font-black">{formatCurrency(metrics.value)}</p></div>
        </div>
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          {carts.map((cart) => (
            <div key={cart.id} className="border-t border-slate-100 p-4 first:border-t-0">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-black text-slate-950">User {cart.userId}</p>
                  <p className="text-sm text-slate-500">{cart.items?.length || 0} items · {cart.status}</p>
                </div>
                <p className="font-black text-[#20164d]">{formatCurrency(cart.subtotal)}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default AdminCarts;
