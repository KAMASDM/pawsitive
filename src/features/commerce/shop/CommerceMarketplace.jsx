import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Filter, Package, Search, ShieldCheck, ShoppingBag, SlidersHorizontal } from "lucide-react";
import { formatCurrency, PRODUCT_CATEGORIES, PET_TYPES, subscribeMarketplaceProducts } from "../services/productService";

const CommerceMarketplace = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [petType, setPetType] = useState("all");
  const [sort, setSort] = useState("newest");

  useEffect(() => {
    document.title = "Pawppy Shop | Vetted pet products";
    return subscribeMarketplaceProducts((items) => {
      setProducts(items);
      setLoading(false);
    });
  }, []);

  const filteredProducts = useMemo(() => {
    const term = query.trim().toLowerCase();
    const nextProducts = products.filter((product) => {
      const matchesCategory = category === "All" || product.category === category;
      const matchesPetType = petType === "all" || product.petType?.includes("all") || product.petType?.includes(petType);
      const searchable = [product.title, product.description, product.vendorName, product.category, product.sku].join(" ").toLowerCase();
      return matchesCategory && matchesPetType && (!term || searchable.includes(term));
    });

    return nextProducts.sort((a, b) => {
      if (sort === "price_low") return Number(a.price || 0) - Number(b.price || 0);
      if (sort === "price_high") return Number(b.price || 0) - Number(a.price || 0);
      return (b.updatedAt?.toMillis?.() || 0) - (a.updatedAt?.toMillis?.() || 0);
    });
  }, [category, petType, products, query, sort]);

  return (
    <div className="min-h-screen bg-[#f7f4ff] pb-28">
      <section className="bg-[#20164d] text-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid gap-5 lg:grid-cols-[1fr_360px] lg:items-end">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-black text-violet-100">
                <ShieldCheck className="h-4 w-4" />
                Pawppy approved sellers
              </span>
              <h1 className="mt-4 text-4xl font-black leading-tight sm:text-5xl">Shop pet products with more confidence.</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-violet-100">
                Browse food, treats, toys, grooming, health, and essentials from vendors reviewed by Pawppy.
              </p>
            </div>
            <Link to="/vendor/register" className="rounded-2xl bg-[#ffcf4a] p-4 text-[#20164d] shadow-xl shadow-black/20">
              <ShoppingBag className="mb-3 h-6 w-6" />
              <span className="block text-lg font-black">Sell on Pawppy</span>
              <span className="mt-1 block text-sm font-bold opacity-80">Register, get vetted, and launch your catalog.</span>
            </Link>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <div className="sticky top-2 z-20 rounded-2xl border border-violet-100 bg-white/95 p-3 shadow-lg shadow-violet-100/70 backdrop-blur">
          <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto]">
            <label className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search products, categories, sellers..."
                className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
              />
            </label>
            <select value={sort} onChange={(event) => setSort(event.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700">
              <option value="newest">Newest</option>
              <option value="price_low">Price: low to high</option>
              <option value="price_high">Price: high to low</option>
            </select>
            <span className="hidden items-center gap-2 rounded-xl bg-violet-50 px-3 py-2 text-sm font-black text-violet-700 lg:inline-flex">
              <SlidersHorizontal className="h-4 w-4" />
              {filteredProducts.length} items
            </span>
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto">
            {["All", ...PRODUCT_CATEGORIES].map((item) => (
              <button key={item} type="button" onClick={() => setCategory(item)} className={`shrink-0 rounded-full px-4 py-2 text-xs font-black ${category === item ? "bg-[#20164d] text-white" : "bg-slate-100 text-slate-600"}`}>
                {item === "All" && <Filter className="mr-1 inline h-3 w-3" />}
                {item}
              </button>
            ))}
          </div>
          <div className="mt-2 flex gap-2 overflow-x-auto">
            {PET_TYPES.map((item) => (
              <button key={item.id} type="button" onClick={() => setPetType(item.id)} className={`shrink-0 rounded-full px-4 py-2 text-xs font-black ${petType === item.id ? "bg-[#ffcf4a] text-[#20164d]" : "bg-violet-50 text-violet-700"}`}>
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="overflow-hidden rounded-2xl border border-violet-100 bg-white">
                <div className="aspect-square animate-pulse bg-violet-100" />
                <div className="space-y-3 p-3">
                  <div className="h-3 animate-pulse rounded bg-violet-100" />
                  <div className="h-3 w-2/3 animate-pulse rounded bg-violet-50" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-violet-100 bg-white p-10 text-center">
            <Package className="mx-auto h-10 w-10 text-violet-300" />
            <p className="mt-3 font-black text-slate-900">No products found</p>
            <p className="mt-1 text-sm text-slate-500">Try changing the filters or search term.</p>
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => navigate(`/products/${product.slug}`)}
                className="group overflow-hidden rounded-2xl border border-violet-100 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl"
              >
                <div className="aspect-square bg-violet-50">
                  {product.images?.[0]?.url ? (
                    <img src={product.images[0].url} alt={product.images[0].alt || product.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-violet-300"><Package className="h-10 w-10" /></div>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-[11px] font-black uppercase text-violet-500">{product.vendorName}</p>
                  <h2 className="mt-1 min-h-[40px] text-sm font-black leading-5 text-slate-950 line-clamp-2">{product.title}</h2>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="font-black text-[#20164d]">{formatCurrency(product.price)}</span>
                    <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-black text-emerald-700">Active</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default CommerceMarketplace;
