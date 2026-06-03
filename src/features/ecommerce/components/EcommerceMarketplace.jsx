import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiArrowRight,
  FiCheckCircle,
  FiFilter,
  FiPackage,
  FiSearch,
  FiShoppingBag,
  FiShield,
  FiStar,
  FiTruck,
} from "react-icons/fi";
import { PRODUCT_CATEGORIES, subscribeAllMarketplaceProducts } from "../services/ecommerceService";

const trustItems = [
  { Icon: FiShield, label: "Vetted sellers", copy: "Every vendor goes through approval before selling." },
  { Icon: FiTruck, label: "Local-ready", copy: "Built for city-level fulfilment and pet parent support." },
  { Icon: FiCheckCircle, label: "Payment-ready", copy: "Order flow works now, gateway plugs in later." },
];

const formatPrice = (value) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value || 0);

export default function EcommerceMarketplace() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");

  useEffect(() => {
    const unsubscribe = subscribeAllMarketplaceProducts((items) => {
      setProducts(items);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return products.filter((product) => {
      const matchesCategory = category === "All" || product.category === category;
      const matchesQuery = !normalized || `${product.name} ${product.description} ${product.store?.storeName}`.toLowerCase().includes(normalized);
      return matchesCategory && matchesQuery;
    });
  }, [category, products, query]);

  return (
    <div className="min-h-screen bg-[#f5f3fb] pb-28">
      <section className="relative overflow-hidden bg-gradient-to-br from-violet-700 via-indigo-700 to-slate-950 text-white">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_25%_20%,white,transparent_22%),radial-gradient(circle_at_80%_0%,#c4b5fd,transparent_28%)]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8 items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/12 border border-white/20 px-3 py-1 text-xs font-bold text-violet-100">
                <FiShoppingBag /> Pawppy Market
              </span>
              <h1 className="mt-4 text-4xl lg:text-6xl font-black leading-tight">
                Pet products from stores Pawppy approves.
              </h1>
              <p className="mt-4 text-sm lg:text-lg text-violet-100 max-w-2xl">
                Discover food, treats, grooming essentials, toys, and care products from vetted pet businesses.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={() => navigate("/shop/seller")}
                  className="rounded-full bg-white text-violet-700 px-5 py-3 text-sm font-extrabold shadow-xl flex items-center gap-2"
                >
                  Become a seller <FiArrowRight />
                </button>
                <button
                  onClick={() => document.getElementById("market-products")?.scrollIntoView({ behavior: "smooth" })}
                  className="rounded-full bg-white/10 border border-white/20 text-white px-5 py-3 text-sm font-bold"
                >
                  Browse products
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {trustItems.map(({ Icon, label, copy }) => (
                <div key={label} className="rounded-[26px] bg-white/10 border border-white/15 backdrop-blur-xl p-4 flex gap-3">
                  <span className="w-11 h-11 rounded-2xl bg-white text-violet-700 flex items-center justify-center shrink-0">
                    <Icon size={19} />
                  </span>
                  <span>
                    <span className="block font-extrabold">{label}</span>
                    <span className="block text-sm text-violet-100 mt-1">{copy}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="market-products" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="rounded-[28px] bg-white border border-violet-100 shadow-sm p-3 sm:p-4">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-violet-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search food, toys, grooming, stores..."
                className="w-full h-12 rounded-2xl bg-violet-50/70 border border-violet-100 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-violet-200"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0">
              {["All", ...PRODUCT_CATEGORIES].map((item) => (
                <button
                  key={item}
                  onClick={() => setCategory(item)}
                  className={`h-12 px-4 rounded-2xl text-sm font-bold whitespace-nowrap border flex items-center gap-2 ${
                    category === item
                      ? "bg-violet-600 text-white border-violet-600"
                      : "bg-white text-slate-600 border-violet-100"
                  }`}
                >
                  {item === "All" && <FiFilter size={15} />}
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
              <div key={item} className="rounded-[24px] bg-white border border-violet-100 overflow-hidden animate-pulse">
                <div className="aspect-square bg-violet-100" />
                <div className="p-4 space-y-3">
                  <div className="h-3 rounded-full bg-violet-100" />
                  <div className="h-3 rounded-full bg-violet-50 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-6 rounded-[28px] bg-white border border-violet-100 py-16 text-center">
            <FiPackage className="mx-auto text-violet-200" size={42} />
            <p className="mt-3 font-extrabold text-slate-800">No products found</p>
            <p className="text-sm text-slate-400 mt-1">Try another search or category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            {filtered.map((product, index) => (
              <motion.button
                key={`${product.storeId}-${product.id}`}
                onClick={() => navigate(`/shop/${product.store.slug}/${product.id}`)}
                className="group rounded-[24px] bg-white border border-violet-100 overflow-hidden text-left shadow-sm hover:shadow-xl transition-shadow"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.03, 0.24) }}
              >
                <div className="aspect-square bg-gradient-to-br from-violet-100 to-indigo-100 overflow-hidden">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-violet-300">
                      <FiPackage size={42} />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <div className="flex items-center gap-1 text-[10px] font-bold text-violet-500 uppercase">
                    <FiShoppingBag size={11} /> <span className="truncate">{product.store?.storeName}</span>
                  </div>
                  <p className="mt-1 text-sm font-extrabold text-slate-800 line-clamp-2 min-h-[40px]">{product.name}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm font-black text-violet-700">{formatPrice(product.price)}</span>
                    <span className="flex items-center gap-1 text-[10px] text-amber-500 font-bold">
                      <FiStar /> {product.rating || "New"}
                    </span>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
