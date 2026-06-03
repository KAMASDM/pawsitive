import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Boxes, IndianRupee, PackageCheck, Plus, TrendingUp } from "lucide-react";
import SellerShell from "./SellerShell";
import { useCommerceUser } from "../auth/useCommerceUser";
import { formatCurrency, subscribeVendorProducts } from "../services/productService";

const statClass = "rounded-2xl border border-violet-100 bg-white p-4 shadow-sm";

const SellerDashboard = () => {
  const { vendorId, vendor } = useCommerceUser();
  const [products, setProducts] = useState([]);

  useEffect(() => subscribeVendorProducts(vendorId, setProducts), [vendorId]);

  const metrics = useMemo(() => {
    const active = products.filter((product) => product.status === "active").length;
    const drafts = products.filter((product) => product.status === "draft").length;
    const lowStock = products.filter((product) => {
      if (!product.inventory?.trackInventory) return false;
      return Number(product.inventory.quantity || 0) <= Number(product.inventory.lowStockThreshold || 0);
    });
    const catalogValue = products.reduce((sum, product) => {
      if (product.status === "archived") return sum;
      return sum + Number(product.price || 0) * Number(product.inventory?.quantity || 0);
    }, 0);
    return { active, drafts, lowStock, catalogValue };
  }, [products]);

  return (
    <SellerShell
      title="Seller Dashboard"
      action={
        <Link
          to="/vendor/products/new"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#ffcf4a] px-5 py-3 text-sm font-black text-[#20164d] shadow-lg shadow-black/20"
        >
          <Plus className="h-4 w-4" />
          Add product
        </Link>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className={statClass}>
          <Boxes className="mb-3 h-5 w-5 text-violet-600" />
          <p className="text-xs font-bold uppercase text-slate-400">Total products</p>
          <p className="mt-1 text-3xl font-black text-slate-950">{products.length}</p>
        </div>
        <div className={statClass}>
          <PackageCheck className="mb-3 h-5 w-5 text-emerald-600" />
          <p className="text-xs font-bold uppercase text-slate-400">Active listings</p>
          <p className="mt-1 text-3xl font-black text-slate-950">{metrics.active}</p>
        </div>
        <div className={statClass}>
          <AlertTriangle className="mb-3 h-5 w-5 text-amber-600" />
          <p className="text-xs font-bold uppercase text-slate-400">Low stock</p>
          <p className="mt-1 text-3xl font-black text-slate-950">{metrics.lowStock.length}</p>
        </div>
        <div className={statClass}>
          <IndianRupee className="mb-3 h-5 w-5 text-rose-600" />
          <p className="text-xs font-bold uppercase text-slate-400">Catalog value</p>
          <p className="mt-1 text-2xl font-black text-slate-950">{formatCurrency(metrics.catalogValue)}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
        <section className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-slate-950">Launch checklist</h2>
              <p className="text-sm text-slate-500">The essentials for a buyer-ready store.</p>
            </div>
            <TrendingUp className="h-5 w-5 text-violet-500" />
          </div>
          <div className="space-y-3">
            {[
              { label: "Vendor approved", done: vendor?.status === "approved" },
              { label: "At least one active product", done: metrics.active > 0 },
              { label: "No low-stock active products", done: metrics.lowStock.length === 0 },
              { label: "Product SEO metadata ready", done: products.some((product) => product.seo?.metaTitle && product.seo?.metaDescription) },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <span className="text-sm font-bold text-slate-700">{item.label}</span>
                <span className={`rounded-full px-3 py-1 text-xs font-black ${item.done ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                  {item.done ? "Done" : "Needs work"}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-black text-slate-950">Quick actions</h2>
          <div className="mt-4 grid gap-3">
            <Link to="/vendor/products/new" className="rounded-xl bg-[#20164d] px-4 py-3 text-sm font-black text-white">
              Create a product
            </Link>
            <Link to="/vendor/products" className="rounded-xl bg-violet-100 px-4 py-3 text-sm font-black text-violet-900">
              Review catalog
            </Link>
            <Link to="/vendor/status" className="rounded-xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-800">
              Compliance profile
            </Link>
          </div>
        </section>
      </div>
    </SellerShell>
  );
};

export default SellerDashboard;
