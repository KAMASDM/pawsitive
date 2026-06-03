import React, { useEffect, useMemo, useState } from "react";
import { PackageSearch, Search } from "lucide-react";
import { ensureCommerceAdminClaim } from "../auth/useCommerceUser";
import { formatCurrency, moderateCommerceProduct, subscribeAdminProducts } from "../services/productService";

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState("");

  useEffect(() => {
    let unsubscribe = () => {};
    ensureCommerceAdminClaim().then(() => {
      unsubscribe = subscribeAdminProducts(setProducts);
    });
    return () => unsubscribe();
  }, []);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return products.filter((product) => !term || [product.title, product.vendorName, product.sku, product.category].join(" ").toLowerCase().includes(term));
  }, [products, query]);

  const moderate = async (productId, status, moderationStatus) => {
    setBusy(productId);
    try {
      await moderateCommerceProduct({ productId, status, moderationStatus, note: `Marked ${moderationStatus} by admin.` });
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      <section className="bg-slate-950 text-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-black"><PackageSearch className="h-4 w-4" /> Commerce Admin</span>
          <h1 className="mt-4 text-4xl font-black">Product moderation</h1>
        </div>
      </section>
      <main className="mx-auto max-w-7xl space-y-4 px-4 py-6 sm:px-6 lg:px-8">
        <label className="flex items-center gap-2 rounded-2xl bg-white px-4 py-3 shadow-sm">
          <Search className="h-4 w-4 text-slate-400" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products" className="w-full bg-transparent text-sm font-semibold outline-none" />
        </label>
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          {filtered.map((product) => (
            <div key={product.id} className="grid gap-3 border-t border-slate-100 p-4 first:border-t-0 md:grid-cols-[72px_1fr_auto] md:items-center">
              <div className="h-[72px] w-[72px] overflow-hidden rounded-xl bg-violet-50">
                {product.images?.[0]?.url && <img src={product.images[0].url} alt={product.title} className="h-full w-full object-cover" />}
              </div>
              <div>
                <p className="font-black text-slate-950">{product.title}</p>
                <p className="text-sm text-slate-500">{product.vendorName} · {product.sku} · {formatCurrency(product.price)}</p>
                <p className="mt-1 text-xs font-bold text-violet-600">{product.status} · {product.moderation?.status || "not reviewed"}</p>
              </div>
              <div className="flex gap-2">
                <button disabled={busy === product.id} onClick={() => moderate(product.id, "active", "approved")} className="rounded-full bg-emerald-100 px-3 py-2 text-xs font-black text-emerald-700">Approve</button>
                <button disabled={busy === product.id} onClick={() => moderate(product.id, "archived", "rejected")} className="rounded-full bg-rose-100 px-3 py-2 text-xs font-black text-rose-700">Hide</button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default AdminProducts;
