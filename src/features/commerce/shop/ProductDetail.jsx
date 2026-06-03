import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Package, ShieldCheck, ShoppingCart, Star, Store, Truck } from "lucide-react";
import { formatCurrency, getProductBySlug } from "../services/productService";
import { addProductToCart, subscribeProductReviews } from "../services/cartService";

const StarRow = ({ value, count }) => (
  <span className="inline-flex items-center gap-1 text-sm font-black text-amber-500">
    {"★".repeat(Math.round(value || 0))}{"☆".repeat(5 - Math.round(value || 0))}
    <span className="ml-1 text-xs font-bold text-slate-400">({count || 0})</span>
  </span>
);

const ReviewsSection = ({ productId }) => {
  const [reviews, setReviews] = useState([]);
  useEffect(() => subscribeProductReviews(productId, setReviews), [productId]);

  if (reviews.length === 0) return (
    <div className="mt-8 rounded-2xl border border-violet-100 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-black text-slate-950">Reviews</h2>
      <p className="mt-3 text-sm text-slate-400">No reviews yet. Purchase this product to leave the first review.</p>
    </div>
  );

  return (
    <div className="mt-8 rounded-2xl border border-violet-100 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-black text-slate-950">Reviews ({reviews.length})</h2>
      <div className="mt-4 space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="border-t border-slate-50 pt-4 first:border-t-0 first:pt-0">
            <div className="flex items-start gap-3">
              {review.userPhoto ? (
                <img src={review.userPhoto} alt={review.userName} className="h-8 w-8 rounded-full object-cover" />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-xs font-black text-violet-600">
                  {(review.userName || "?")[0].toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-black text-slate-950">{review.userName}</span>
                  <span className="text-sm text-amber-500">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</span>
                  <span className="text-xs text-slate-400">
                    {review.createdAt?.toDate ? review.createdAt.toDate().toLocaleDateString("en-IN") : ""}
                  </span>
                </div>
                {review.title && <p className="mt-1 text-sm font-bold text-slate-800">{review.title}</p>}
                {review.body && <p className="mt-1 text-sm leading-relaxed text-slate-600">{review.body}</p>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ProductDetail = () => {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [added, setAdded] = useState(false);
  const [cartError, setCartError] = useState("");

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getProductBySlug(slug)
      .then((nextProduct) => {
        if (!mounted) return;
        setProduct(nextProduct);
        document.title = nextProduct?.seo?.metaTitle || nextProduct?.title || "Pawppy Product";
        const description = nextProduct?.seo?.metaDescription || nextProduct?.description || "";
        let meta = document.querySelector('meta[name="description"]');
        if (!meta) {
          meta = document.createElement("meta");
          meta.setAttribute("name", "description");
          document.head.appendChild(meta);
        }
        meta.setAttribute("content", description);
      })
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [slug]);

  const jsonLd = useMemo(() => {
    if (!product) return null;
    return {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.title,
      description: product.seo?.metaDescription || product.description,
      image: product.images?.map((image) => image.url).filter(Boolean) || [],
      sku: product.sku,
      brand: { "@type": "Brand", name: product.vendorName },
      aggregateRating: product.reviewCount > 0 ? {
        "@type": "AggregateRating",
        ratingValue: product.avgRating,
        reviewCount: product.reviewCount,
      } : undefined,
      offers: {
        "@type": "Offer",
        url: `https://pawppy.in/products/${product.slug}`,
        priceCurrency: "INR",
        price: product.price,
        availability: product.inventory?.quantity > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      },
    };
  }, [product]);

  const addToCart = async () => {
    setCartError("");
    try {
      const variant = product.variants?.find((item) => item.id === selectedVariantId);
      await addProductToCart({ product: variant ? { ...product, selectedVariant: variant } : product, quantity });
      setAdded(true);
    } catch (error) {
      setCartError(error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f4ff] p-4">
        <div className="mx-auto max-w-6xl animate-pulse space-y-4">
          <div className="h-10 w-32 rounded-full bg-violet-100" />
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="aspect-square rounded-3xl bg-violet-100" />
            <div className="rounded-3xl bg-white p-8" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f4ff] p-4">
        <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
          <Package className="mx-auto h-12 w-12 text-violet-300" />
          <h1 className="mt-3 text-xl font-black text-slate-950">Product not found</h1>
          <Link to="/shop" className="mt-5 inline-flex rounded-full bg-[#20164d] px-5 py-3 text-sm font-black text-white">Browse shop</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f4ff] pb-28">
      {jsonLd && <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>}
      <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <Link to="/shop" className="mb-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-slate-700 shadow-sm">
          <ArrowLeft className="h-4 w-4" />
          Shop
        </Link>

        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="overflow-hidden rounded-3xl border border-violet-100 bg-white shadow-sm">
            <div className="aspect-square bg-violet-50">
              {product.images?.[0]?.url ? (
                <img src={product.images[0].url} alt={product.images[0].alt || product.title} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-violet-300"><Package className="h-16 w-16" /></div>
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-violet-100 bg-white p-5 shadow-sm lg:p-7">
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                <ShieldCheck className="h-3.5 w-3.5" />
                Approved seller
              </span>
              <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-black text-violet-700">{product.category}</span>
            </div>
            <h1 className="mt-4 text-3xl font-black leading-tight text-slate-950 sm:text-5xl">{product.title}</h1>
            <p className="mt-3 flex items-center gap-2 text-sm font-bold text-slate-500">
              <Store className="h-4 w-4" />
              {product.vendorStoreSlug
                ? <Link to={`/store/${product.vendorStoreSlug}`} className="text-violet-700">{product.vendorName}</Link>
                : product.vendorName}
            </p>
            {product.reviewCount > 0 && (
              <div className="mt-2">
                <StarRow value={product.avgRating} count={product.reviewCount} />
              </div>
            )}
            <p className="mt-5 text-4xl font-black text-[#20164d]">{formatCurrency(product.price)}</p>
            {product.compareAtPrice > product.price && (
              <p className="mt-1 text-sm font-bold text-slate-400 line-through">{formatCurrency(product.compareAtPrice)}</p>
            )}
            <p className="mt-5 whitespace-pre-line text-sm leading-6 text-slate-600">{product.description}</p>

            {product.variants?.length > 0 && (
              <div className="mt-6">
                <p className="mb-2 text-xs font-black uppercase text-slate-500">Variant</p>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((variant) => (
                    <button
                      key={variant.id}
                      type="button"
                      onClick={() => setSelectedVariantId(variant.id)}
                      className={`rounded-full px-4 py-2 text-sm font-black ${
                        selectedVariantId === variant.id ? "bg-[#20164d] text-white" : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {variant.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 grid gap-3 sm:grid-cols-[140px_1fr]">
              <label className="block">
                <span className="mb-1 block text-xs font-black uppercase text-slate-500">Quantity</span>
                <input
                  type="number"
                  min="1"
                  max={Math.max(1, Number(product.inventory?.quantity || 1))}
                  value={quantity}
                  onChange={(event) => setQuantity(Math.max(1, Number(event.target.value || 1)))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm font-black outline-none focus:border-violet-400"
                />
              </label>
              <button
                type="button"
                onClick={addToCart}
                className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-[#20164d] px-5 py-3 text-sm font-black text-white sm:mt-0 sm:self-end"
              >
                <ShoppingCart className="h-4 w-4" />
                {added ? "Added to cart" : "Add to cart"}
              </button>
            </div>
            {cartError && <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700">{cartError}</p>}

            <div className="mt-5 rounded-2xl bg-slate-50 p-4">
              <p className="flex items-center gap-2 text-sm font-black text-slate-800"><Truck className="h-4 w-4 text-violet-600" /> Pay on delivery available</p>
              <p className="mt-1 text-sm text-slate-500">Checkout recomputes totals securely on the server before the order is confirmed.</p>
              {added && <Link to="/cart" className="mt-3 inline-flex rounded-full bg-violet-100 px-4 py-2 text-sm font-black text-violet-900">Go to cart</Link>}
            </div>
          </section>
        </div>

        <ReviewsSection productId={product.id} />
      </main>
    </div>
  );
};

export default ProductDetail;
