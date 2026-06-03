import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Eye, ImagePlus, Save, Sparkles } from "lucide-react";
import SellerShell from "./SellerShell";
import {
  PET_TYPES,
  PRODUCT_CATEGORIES,
  emptyProduct,
  getProductById,
  saveCommerceProduct,
  slugifyProduct,
  suggestSku,
} from "../services/productService";
import { readImageFileForDatabase } from "../services/vendorService";

const Field = ({ label, children }) => (
  <label className="block">
    <span className="mb-1.5 block text-xs font-black uppercase text-slate-500">{label}</span>
    {children}
  </label>
);

const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100";

const ProductEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id;
  const [product, setProduct] = useState(emptyProduct);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    if (isNew) return undefined;

    setLoading(true);
    getProductById(id)
      .then((existing) => {
        if (!mounted) return;
        if (!existing) {
          setError("Product not found.");
          return;
        }
        setProduct({
          ...emptyProduct,
          ...existing,
          price: existing.price ?? "",
          compareAtPrice: existing.compareAtPrice ?? "",
          taxRatePct: existing.taxRatePct ?? "0",
          inventory: { ...emptyProduct.inventory, ...(existing.inventory || {}) },
          seo: { ...emptyProduct.seo, ...(existing.seo || {}) },
          shipping: {
            ...emptyProduct.shipping,
            ...(existing.shipping || {}),
            dimensionsCm: {
              ...emptyProduct.shipping.dimensionsCm,
              ...(existing.shipping?.dimensionsCm || {}),
            },
          },
          images: existing.images?.length ? existing.images : emptyProduct.images,
        });
      })
      .catch((loadError) => setError(loadError.message))
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, [id, isNew]);

  const productUrl = useMemo(() => {
    const slug = product.slug || slugifyProduct(product.title);
    return slug ? `https://pawppy.in/products/${slug}` : "https://pawppy.in/products/your-product";
  }, [product.slug, product.title]);

  const setValue = (key, value) => setProduct((current) => ({ ...current, [key]: value }));
  const setNested = (section, key, value) => setProduct((current) => ({
    ...current,
    [section]: { ...current[section], [key]: value },
  }));
  const setInventory = (key, value) => setNested("inventory", key, value);

  const handleTitleChange = (title) => {
    setProduct((current) => ({
      ...current,
      title,
      slug: current.slug || slugifyProduct(title),
      sku: current.sku || suggestSku(title),
      seo: {
        ...current.seo,
        metaTitle: current.seo.metaTitle || title.slice(0, 70),
      },
    }));
  };

  const handleDescriptionChange = (description) => {
    setProduct((current) => ({
      ...current,
      description,
      seo: {
        ...current.seo,
        metaDescription: current.seo.metaDescription || description.replace(/\s+/g, " ").slice(0, 160),
      },
    }));
  };

  const handlePetTypeToggle = (petType) => {
    setProduct((current) => {
      const currentTypes = current.petType || [];
      const nextTypes = currentTypes.includes(petType)
        ? currentTypes.filter((type) => type !== petType)
        : [...currentTypes.filter((type) => type !== "all"), petType];
      return { ...current, petType: nextTypes.length ? nextTypes : ["all"] };
    });
  };

  const addVariant = () => {
    setProduct((current) => ({
      ...current,
      variants: [
        ...(current.variants || []),
        {
          id: `variant-${Date.now()}`,
          name: "",
          options: [],
          sku: current.sku ? `${current.sku}-${(current.variants || []).length + 1}` : "",
          price: current.price || "",
          quantity: "0",
          image: "",
        },
      ],
    }));
  };

  const updateVariant = (index, key, value) => {
    setProduct((current) => ({
      ...current,
      variants: (current.variants || []).map((variant, variantIndex) => (
        variantIndex === index ? { ...variant, [key]: value } : variant
      )),
    }));
  };

  const removeVariant = (index) => {
    setProduct((current) => ({
      ...current,
      variants: (current.variants || []).filter((_, variantIndex) => variantIndex !== index),
    }));
  };

  const handleSave = async (status) => {
    setError("");
    setSaving(true);
    try {
      const payload = {
        ...product,
        status,
        tags: typeof product.tags === "string" ? product.tags.split(",").map((tag) => tag.trim()).filter(Boolean) : product.tags,
        seo: {
          ...product.seo,
          keywords: typeof product.seo.keywords === "string"
            ? product.seo.keywords.split(",").map((tag) => tag.trim()).filter(Boolean)
            : product.seo.keywords,
        },
        images: product.images.filter((image) => image.url?.trim()),
      };
      const savedProduct = await saveCommerceProduct({ productId: id, product: payload });
      navigate(`/vendor/products/${savedProduct.id}/edit`, { replace: true });
      setProduct((current) => ({ ...current, ...savedProduct }));
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  };

  const uploadProductImage = async (file) => {
    if (!file) return;
    setError("");
    try {
      const image = await readImageFileForDatabase(file);
      setValue("images", [{ url: image.url, alt: product.title, position: 0 }]);
    } catch (uploadError) {
      setError(uploadError.message);
    }
  };

  return (
    <SellerShell title={isNew ? "Create Product" : "Edit Product"}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <Link to="/vendor/products" className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-slate-700 shadow-sm">
          <ArrowLeft className="h-4 w-4" />
          Products
        </Link>
      </div>

      {loading ? (
        <div className="rounded-2xl bg-white p-8 text-center text-sm font-bold text-slate-500">Loading product...</div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            <section className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm">
              <h2 className="mb-4 text-lg font-black text-slate-950">Product details</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Title">
                  <input className={inputClass} value={product.title} onChange={(event) => handleTitleChange(event.target.value)} placeholder="Organic chicken treats" />
                </Field>
                <Field label="SKU">
                  <input className={inputClass} value={product.sku} onChange={(event) => setValue("sku", event.target.value)} placeholder="TREATS-001" />
                </Field>
                <Field label="Category">
                  <select className={inputClass} value={product.category} onChange={(event) => setValue("category", event.target.value)}>
                    {PRODUCT_CATEGORIES.map((category) => <option key={category}>{category}</option>)}
                  </select>
                </Field>
                <Field label="Subcategory">
                  <input className={inputClass} value={product.subcategory} onChange={(event) => setValue("subcategory", event.target.value)} placeholder="Dental care" />
                </Field>
              </div>
              <div className="mt-4">
                <Field label="Description">
                  <textarea className={`${inputClass} min-h-32`} value={product.description} onChange={(event) => handleDescriptionChange(event.target.value)} placeholder="Describe ingredients, benefits, sizing, and care details." />
                </Field>
              </div>
              <div className="mt-4">
                <Field label="Pet type">
                  <div className="flex flex-wrap gap-2">
                    {PET_TYPES.map((type) => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => handlePetTypeToggle(type.id)}
                        className={`rounded-full px-4 py-2 text-xs font-black ${product.petType?.includes(type.id) ? "bg-[#20164d] text-white" : "bg-slate-100 text-slate-600"}`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </Field>
              </div>
            </section>

            <section className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm">
              <h2 className="mb-4 text-lg font-black text-slate-950">Pricing and inventory</h2>
              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Price">
                  <input className={inputClass} type="number" min="0" value={product.price} onChange={(event) => setValue("price", event.target.value)} />
                </Field>
                <Field label="Compare at">
                  <input className={inputClass} type="number" min="0" value={product.compareAtPrice} onChange={(event) => setValue("compareAtPrice", event.target.value)} />
                </Field>
                <Field label="Tax % (GST)">
                  <select className={inputClass} value={product.taxRatePct} onChange={(event) => setValue("taxRatePct", event.target.value)}>
                    {[0, 5, 12, 18, 28].map((rate) => <option key={rate} value={rate}>{rate}% GST</option>)}
                  </select>
                </Field>
                <Field label="HSN code">
                  <input className={inputClass} value={product.hsnCode || ""} onChange={(event) => setValue("hsnCode", event.target.value)} placeholder="e.g. 23091000" maxLength={8} />
                </Field>
                <Field label="Quantity">
                  <input className={inputClass} type="number" min="0" value={product.inventory.quantity} onChange={(event) => setInventory("quantity", event.target.value)} />
                </Field>
                <Field label="Low stock alert">
                  <input className={inputClass} type="number" min="0" value={product.inventory.lowStockThreshold} onChange={(event) => setInventory("lowStockThreshold", event.target.value)} />
                </Field>
                <div className="flex items-end gap-3">
                  <label className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-3 text-sm font-bold text-slate-700">
                    <input type="checkbox" checked={product.inventory.trackInventory} onChange={(event) => setInventory("trackInventory", event.target.checked)} />
                    Track stock
                  </label>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black text-slate-950">Variants</h2>
                  <p className="text-sm text-slate-500">Use variants for size, flavor, pack count, color, or weight options.</p>
                </div>
                <button type="button" onClick={addVariant} className="rounded-full bg-violet-100 px-4 py-2 text-xs font-black text-violet-900">
                  Add variant
                </button>
              </div>
              <div className="space-y-3">
                {(product.variants || []).length === 0 ? (
                  <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-500">No variants added.</p>
                ) : product.variants.map((variant, index) => (
                  <div key={variant.id || index} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                    <div className="grid gap-3 md:grid-cols-5">
                      <input className={inputClass} value={variant.name || ""} onChange={(event) => updateVariant(index, "name", event.target.value)} placeholder="Variant name" />
                      <input className={inputClass} value={Array.isArray(variant.options) ? variant.options.join(", ") : variant.options || ""} onChange={(event) => updateVariant(index, "options", event.target.value.split(",").map((item) => item.trim()).filter(Boolean))} placeholder="Options" />
                      <input className={inputClass} value={variant.sku || ""} onChange={(event) => updateVariant(index, "sku", event.target.value)} placeholder="SKU" />
                      <input className={inputClass} type="number" min="0" value={variant.price || ""} onChange={(event) => updateVariant(index, "price", event.target.value)} placeholder="Price" />
                      <input className={inputClass} type="number" min="0" value={variant.quantity || ""} onChange={(event) => updateVariant(index, "quantity", event.target.value)} placeholder="Qty" />
                    </div>
                    <button type="button" onClick={() => removeVariant(index)} className="mt-2 rounded-full bg-rose-50 px-3 py-1.5 text-xs font-black text-rose-700">
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm">
              <h2 className="mb-4 text-lg font-black text-slate-950">Media and SEO</h2>
              <div className="grid gap-4">
                <Field label="Product image">
                  <label className="flex cursor-pointer items-center justify-center rounded-2xl border border-dashed border-violet-200 bg-violet-50/40 p-4">
                    <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(event) => uploadProductImage(event.target.files?.[0])} />
                    {product.images?.[0]?.url ? (
                      <img src={product.images[0].url} alt={product.title} className="h-48 w-full rounded-xl object-cover" />
                    ) : (
                      <span className="flex h-32 items-center gap-2 text-sm font-black text-violet-500"><ImagePlus className="h-5 w-5" /> Upload image</span>
                    )}
                  </label>
                </Field>
                <Field label="Product URL slug">
                  <input className={inputClass} value={product.slug} onChange={(event) => setValue("slug", slugifyProduct(event.target.value))} />
                </Field>
                <Field label="SEO title">
                  <input className={inputClass} value={product.seo.metaTitle} onChange={(event) => setNested("seo", "metaTitle", event.target.value)} />
                </Field>
                <Field label="SEO description">
                  <textarea className={`${inputClass} min-h-24`} value={product.seo.metaDescription} onChange={(event) => setNested("seo", "metaDescription", event.target.value)} />
                </Field>
              </div>
            </section>
          </div>

          <aside className="space-y-4">
            <section className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm">
              <h2 className="text-lg font-black text-slate-950">Publish controls</h2>
              {error && <div className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700">{error}</div>}
              <div className="mt-4 grid gap-2">
                <button disabled={saving} onClick={() => handleSave("active")} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#20164d] px-4 py-3 text-sm font-black text-white disabled:opacity-60">
                  <Sparkles className="h-4 w-4" />
                  {saving ? "Saving..." : "Publish active"}
                </button>
                <button disabled={saving} onClick={() => handleSave("draft")} className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-100 px-4 py-3 text-sm font-black text-violet-900 disabled:opacity-60">
                  <Save className="h-4 w-4" />
                  Save draft
                </button>
              </div>
            </section>

            <section className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2 text-sm font-black text-slate-950">
                <Eye className="h-4 w-4 text-violet-500" />
                Search preview
              </div>
              <p className="text-sm text-blue-700">{productUrl}</p>
              <h3 className="mt-1 text-lg font-semibold text-[#1a0dab]">{product.seo.metaTitle || product.title || "Product title"}</h3>
              <p className="mt-1 text-sm leading-5 text-slate-600">
                {product.seo.metaDescription || product.description || "Add a useful product description so buyers understand why this is right for their pet."}
              </p>
            </section>
          </aside>
        </div>
      )}
    </SellerShell>
  );
};

export default ProductEditor;
