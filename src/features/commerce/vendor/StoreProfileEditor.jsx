import React, { useEffect, useMemo, useState } from "react";
import { ExternalLink, ImagePlus, Plus, Save, Trash2 } from "lucide-react";
import SellerShell from "./SellerShell";
import { useCommerceUser } from "../auth/useCommerceUser";
import { readImageFileForDatabase, saveStoreProfile, slugifyStore } from "../services/vendorService";

const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-950 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100";

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Jammu & Kashmir", "Ladakh", "Chandigarh", "Puducherry",
];

const emptyZone = { name: "", states: [], flatFee: 49, freeShippingOver: 999, deliveryEstimate: "3-7 business days" };

const ShippingZoneEditor = ({ zones, onChange }) => {
  const addZone = () => onChange([...zones, { ...emptyZone }]);
  const removeZone = (index) => onChange(zones.filter((_, i) => i !== index));
  const updateZone = (index, key, value) =>
    onChange(zones.map((z, i) => (i === index ? { ...z, [key]: value } : z)));
  const toggleState = (index, state) => {
    const current = zones[index].states || [];
    updateZone(index, "states", current.includes(state) ? current.filter((s) => s !== state) : [...current, state]);
  };

  return (
    <div className="space-y-4">
      {zones.map((zone, index) => (
        <div key={index} className="rounded-2xl border border-violet-100 bg-violet-50/30 p-4">
          <div className="flex items-center justify-between gap-2">
            <input
              className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-black outline-none focus:border-violet-400"
              value={zone.name}
              onChange={(e) => updateZone(index, "name", e.target.value)}
              placeholder="Zone name (e.g. Metro)"
            />
            <button type="button" onClick={() => removeZone(index)} className="text-slate-300 hover:text-rose-500">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <label>
              <span className="mb-1 block text-xs font-black uppercase text-slate-500">Flat fee (₹)</span>
              <input type="number" className={inputClass} value={zone.flatFee} onChange={(e) => updateZone(index, "flatFee", e.target.value)} />
            </label>
            <label>
              <span className="mb-1 block text-xs font-black uppercase text-slate-500">Free over (₹)</span>
              <input type="number" className={inputClass} value={zone.freeShippingOver} onChange={(e) => updateZone(index, "freeShippingOver", e.target.value)} />
            </label>
            <label>
              <span className="mb-1 block text-xs font-black uppercase text-slate-500">Estimate</span>
              <input className={inputClass} value={zone.deliveryEstimate} onChange={(e) => updateZone(index, "deliveryEstimate", e.target.value)} placeholder="3-7 business days" />
            </label>
          </div>
          <div className="mt-3">
            <p className="mb-2 text-xs font-black uppercase text-slate-500">States covered</p>
            <div className="flex flex-wrap gap-1.5">
              {INDIAN_STATES.map((state) => (
                <button
                  key={state}
                  type="button"
                  onClick={() => toggleState(index, state)}
                  className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                    zone.states?.includes(state)
                      ? "bg-violet-600 text-white"
                      : "bg-white text-slate-500 border border-slate-200"
                  }`}
                >
                  {state}
                </button>
              ))}
            </div>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={addZone}
        className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-black text-violet-700"
      >
        <Plus className="h-4 w-4" /> Add shipping zone
      </button>
    </div>
  );
};

const StoreProfileEditor = () => {
  const { vendor } = useCommerceUser();
  const [store, setStore] = useState({
    slug: "",
    storeName: "",
    tagline: "",
    description: "",
    logoUrl: "",
    bannerUrl: "",
    supportEmail: "",
    supportPhone: "",
    policies: { shipping: "", returns: "", support: "" },
    shippingSettings: {
      flatFee: 49,
      freeShippingOver: 999,
      deliveryEstimate: "2-5 business days",
      servicePincodes: [],
      shippingZones: [],
    },
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!vendor) return;
    setStore((current) => ({
      ...current,
      ...(vendor.store || {}),
      storeName: vendor.store?.storeName || vendor.businessName || "",
      description: vendor.store?.description || vendor.description || "",
      supportEmail: vendor.store?.supportEmail || vendor.email || "",
      supportPhone: vendor.store?.supportPhone || vendor.phone || "",
      policies: { ...current.policies, ...(vendor.store?.policies || {}) },
      shippingSettings: {
        ...current.shippingSettings,
        ...(vendor.store?.shippingSettings || {}),
        shippingZones: vendor.store?.shippingSettings?.shippingZones || [],
      },
    }));
  }, [vendor]);

  const storeUrl = useMemo(
    () => `https://pawppy.in/store/${store.slug || slugifyStore(store.storeName) || "your-store"}`,
    [store.slug, store.storeName]
  );
  const update = (key, value) => setStore((current) => ({ ...current, [key]: value }));
  const updatePolicy = (key, value) => setStore((current) => ({ ...current, policies: { ...current.policies, [key]: value } }));
  const updateShipping = (key, value) => setStore((current) => ({
    ...current,
    shippingSettings: { ...current.shippingSettings, [key]: value },
  }));

  const uploadImage = async (key, file) => {
    if (!file) return;
    setError("");
    try {
      const image = await readImageFileForDatabase(file);
      update(key, image.url);
    } catch (uploadError) {
      setError(uploadError.message);
    }
  };

  const save = async () => {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await saveStoreProfile({ ...store, slug: slugifyStore(store.slug || store.storeName) });
      setMessage("Store profile saved.");
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SellerShell title="Store Profile">
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <section className="space-y-4">
          {(error || message) && (
            <div className={`rounded-2xl p-3 text-sm font-bold ${error ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>
              {error || message}
            </div>
          )}

          <div className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm">
            <h2 className="mb-4 text-lg font-black text-slate-950">Public store details</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <label><span className="mb-1 block text-xs font-black uppercase text-slate-500">Store name</span><input className={inputClass} value={store.storeName} onChange={(event) => update("storeName", event.target.value)} /></label>
              <label><span className="mb-1 block text-xs font-black uppercase text-slate-500">URL slug</span><input className={inputClass} value={store.slug} onChange={(event) => update("slug", slugifyStore(event.target.value))} /></label>
              <label className="md:col-span-2"><span className="mb-1 block text-xs font-black uppercase text-slate-500">Tagline</span><input className={inputClass} value={store.tagline} onChange={(event) => update("tagline", event.target.value)} /></label>
              <label className="md:col-span-2"><span className="mb-1 block text-xs font-black uppercase text-slate-500">Description</span><textarea className={`${inputClass} min-h-28`} value={store.description} onChange={(event) => update("description", event.target.value)} /></label>
            </div>
          </div>

          <div className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm">
            <h2 className="mb-4 text-lg font-black text-slate-950">Images</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {[["logoUrl", "Logo"], ["bannerUrl", "Banner"]].map(([key, label]) => (
                <label key={key} className="rounded-2xl border border-dashed border-violet-200 bg-violet-50/40 p-4">
                  <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(event) => uploadImage(key, event.target.files?.[0])} />
                  {store[key]
                    ? <img src={store[key]} alt={label} className="h-32 w-full rounded-xl object-cover" />
                    : <span className="flex h-32 items-center justify-center gap-2 text-sm font-black text-violet-500"><ImagePlus className="h-5 w-5" /> Upload {label}</span>}
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm">
            <h2 className="mb-4 text-lg font-black text-slate-950">Default shipping settings</h2>
            <p className="mb-4 text-sm text-slate-500">These apply when no shipping zone matches the customer's state.</p>
            <div className="grid gap-4 md:grid-cols-3">
              <label><span className="mb-1 block text-xs font-black uppercase text-slate-500">Flat shipping fee (₹)</span><input className={inputClass} type="number" value={store.shippingSettings.flatFee} onChange={(event) => updateShipping("flatFee", event.target.value)} /></label>
              <label><span className="mb-1 block text-xs font-black uppercase text-slate-500">Free shipping over (₹)</span><input className={inputClass} type="number" value={store.shippingSettings.freeShippingOver} onChange={(event) => updateShipping("freeShippingOver", event.target.value)} /></label>
              <label><span className="mb-1 block text-xs font-black uppercase text-slate-500">Delivery estimate</span><input className={inputClass} value={store.shippingSettings.deliveryEstimate} onChange={(event) => updateShipping("deliveryEstimate", event.target.value)} /></label>
            </div>
          </div>

          <div className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm">
            <h2 className="mb-4 text-lg font-black text-slate-950">Shipping zones</h2>
            <p className="mb-4 text-sm text-slate-500">Configure different rates for specific states. Takes priority over the default settings above.</p>
            <ShippingZoneEditor
              zones={store.shippingSettings.shippingZones || []}
              onChange={(zones) => updateShipping("shippingZones", zones)}
            />
          </div>

          <div className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm">
            <h2 className="mb-4 text-lg font-black text-slate-950">Store policies</h2>
            {["shipping", "returns", "support"].map((key) => (
              <label key={key} className="mb-4 block"><span className="mb-1 block text-xs font-black uppercase text-slate-500">{key} policy</span><textarea className={`${inputClass} min-h-20`} value={store.policies[key]} onChange={(event) => updatePolicy(key, event.target.value)} /></label>
            ))}
          </div>
        </section>

        <aside className="h-fit rounded-2xl border border-violet-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-black uppercase text-slate-400">Store URL</p>
          <a href={storeUrl} target="_blank" rel="noreferrer" className="mt-2 flex items-center gap-2 break-all text-sm font-black text-violet-700">
            <ExternalLink className="h-4 w-4" /> {storeUrl}
          </a>
          <button
            onClick={save}
            disabled={saving}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#20164d] px-4 py-3 text-sm font-black text-white disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save store"}
          </button>
        </aside>
      </div>
    </SellerShell>
  );
};

export default StoreProfileEditor;
