import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Package, ShieldCheck, Store, Truck } from "lucide-react";
import { formatCurrency, getVendorByStoreSlug, subscribeStoreProductsByVendor } from "../services/productService";

const StorePage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe = () => {};
    setLoading(true);
    getVendorByStoreSlug(slug).then((nextVendor) => {
      setVendor(nextVendor);
      if (!nextVendor) {
        setLoading(false);
        return;
      }
      document.title = `${nextVendor.store?.storeName || nextVendor.businessName} | Pawppy Store`;
      unsubscribe = subscribeStoreProductsByVendor(nextVendor.id, (items) => {
        setProducts(items);
        setLoading(false);
      });
    });
    return () => unsubscribe();
  }, [slug]);

  if (loading) return <div className="min-h-screen bg-[#f7f4ff] p-4"><div className="mx-auto h-96 max-w-7xl animate-pulse rounded-3xl bg-white" /></div>;
  if (!vendor) return <div className="flex min-h-screen items-center justify-center bg-[#f7f4ff] p-4"><div className="rounded-3xl bg-white p-8 text-center"><Store className="mx-auto h-12 w-12 text-violet-300" /><p className="mt-3 font-black">Store not found</p><Link to="/shop" className="mt-5 inline-flex rounded-full bg-[#20164d] px-5 py-3 text-sm font-black text-white">Browse shop</Link></div></div>;

  const store = vendor.store || {};

  return (
    <div className="min-h-screen bg-[#f7f4ff] pb-28">
      <section className="relative bg-[#20164d] text-white">
        {store.bannerUrl && <img src={store.bannerUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />}
        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
            <div className="h-24 w-24 overflow-hidden rounded-3xl border-4 border-white bg-white">
              {store.logoUrl ? <img src={store.logoUrl} alt={store.storeName} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-[#20164d]"><Store className="h-10 w-10" /></div>}
            </div>
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-black"><ShieldCheck className="h-4 w-4" /> Pawppy approved seller</span>
              <h1 className="mt-3 text-4xl font-black">{store.storeName || vendor.businessName}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-violet-100">{store.tagline || store.description || vendor.description}</p>
              <p className="mt-3 flex items-center gap-2 text-sm font-bold text-violet-100"><Truck className="h-4 w-4" /> {store.shippingSettings?.deliveryEstimate || "2-5 business days"}</p>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {products.map((product) => (
            <button key={product.id} onClick={() => navigate(`/products/${product.slug}`)} className="overflow-hidden rounded-2xl border border-violet-100 bg-white text-left shadow-sm">
              <div className="aspect-square bg-violet-50">
                {product.images?.[0]?.url ? <img src={product.images[0].url} alt={product.title} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-violet-300"><Package className="h-10 w-10" /></div>}
              </div>
              <div className="p-3">
                <h2 className="min-h-[40px] text-sm font-black leading-5 text-slate-950 line-clamp-2">{product.title}</h2>
                <p className="mt-2 font-black text-[#20164d]">{formatCurrency(product.price)}</p>
              </div>
            </button>
          ))}
        </div>
        {products.length === 0 && <div className="rounded-3xl bg-white p-10 text-center font-black text-slate-600">No active products yet.</div>}
      </main>
    </div>
  );
};

export default StorePage;
