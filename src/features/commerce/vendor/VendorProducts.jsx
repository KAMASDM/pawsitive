import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Edit3, PackagePlus, Search } from "lucide-react";
import SellerShell from "./SellerShell";
import { useCommerceUser } from "../auth/useCommerceUser";
import { formatCurrency, PRODUCT_STATUSES, subscribeVendorProducts } from "../services/productService";

const VendorProducts = () => {
  const { vendorId } = useCommerceUser();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  useEffect(() => subscribeVendorProducts(vendorId, setProducts), [vendorId]);

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter((product) => {
      const matchesStatus = status === "all" || product.status === status;
      const matchesSearch = !term || [product.title, product.sku, product.category].join(" ").toLowerCase().includes(term);
      return matchesStatus && matchesSearch;
    });
  }, [products, search, status]);

  return (
    <SellerShell
      title="Products"
      action={
        <Link to="/vendor/products/new" className="inline-flex items-center gap-2 rounded-full bg-[#ffcf4a] px-5 py-3 text-sm font-black text-[#20164d]">
          <PackagePlus className="h-4 w-4" />
          New product
        </Link>
      }
    >
      <div className="mb-4 grid gap-3 rounded-2xl border border-violet-100 bg-white p-3 shadow-sm md:grid-cols-[1fr_auto]">
        <label className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search products or SKU"
            className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
          />
        </label>
        <div className="flex gap-2 overflow-x-auto">
          {["all", ...Object.keys(PRODUCT_STATUSES)].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setStatus(item)}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-black ${
                status === item ? "bg-[#20164d] text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              {item === "all" ? "All" : PRODUCT_STATUSES[item]}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-sm">
        {filteredProducts.length === 0 ? (
          <div className="p-8 text-center">
            <PackagePlus className="mx-auto h-10 w-10 text-violet-300" />
            <h2 className="mt-3 text-lg font-black text-slate-950">No products found</h2>
            <p className="mt-1 text-sm text-slate-500">Create your first listing or adjust the current filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredProducts.map((product) => (
              <div key={product.id} className="grid gap-3 p-4 sm:grid-cols-[72px_1fr_auto] sm:items-center">
                <div className="h-[72px] w-[72px] overflow-hidden rounded-2xl bg-violet-50">
                  {product.images?.[0]?.url ? (
                    <img src={product.images[0].url} alt={product.images[0].alt || product.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full min-h-[72px] items-center justify-center text-xs font-black text-violet-300">IMG</div>
                  )}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-black text-slate-950">{product.title}</h2>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-600">
                      {PRODUCT_STATUSES[product.status] || product.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    SKU {product.sku} · {product.category} · Qty {product.inventory?.quantity ?? 0}
                  </p>
                  <p className="mt-1 text-sm font-black text-slate-950">{formatCurrency(product.price)}</p>
                </div>
                <Link
                  to={`/vendor/products/${product.id}/edit`}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-100 px-4 py-2 text-sm font-black text-violet-900"
                >
                  <Edit3 className="h-4 w-4" />
                  Edit
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </SellerShell>
  );
};

export default VendorProducts;
