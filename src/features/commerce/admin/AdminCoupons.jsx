import React, { useEffect, useState } from "react";
import { Tag, Plus, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import { formatCurrency } from "../services/productService";
import { manageCoupon, subscribeCoupons } from "../services/adminOrderService";

const inputClass = "w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100";

const empty = {
  code: "",
  type: "percent",
  value: "",
  minOrderAmount: "",
  maxDiscountAmount: "",
  maxUses: "",
  description: "",
  expiresAt: "",
};

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [form, setForm] = useState(empty);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => subscribeCoupons(setCoupons), []);

  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const handleCreate = async () => {
    setError("");
    setSuccess("");
    setCreating(true);
    try {
      await manageCoupon("create", form);
      setSuccess(`Coupon ${form.code.toUpperCase()} created.`);
      setForm(empty);
      setShowForm(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (coupon) => {
    try {
      await manageCoupon(coupon.active ? "deactivate" : "activate", { code: coupon.code });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (code) => {
    if (!window.confirm(`Delete coupon ${code}? This cannot be undone.`)) return;
    try {
      await manageCoupon("delete", { code });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      <section className="bg-slate-950 text-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-black">
            <Tag className="h-4 w-4" /> Commerce Admin
          </span>
          <h1 className="mt-4 text-4xl font-black">Coupon codes</h1>
          <p className="mt-2 text-sm text-slate-300">Create and manage discount codes for the marketplace.</p>
        </div>
      </section>

      <main className="mx-auto max-w-4xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
        {(error || success) && (
          <div className={`rounded-2xl p-3 text-sm font-bold ${error ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>
            {error || success}
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={() => setShowForm((v) => !v)}
            className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-2.5 text-sm font-black text-white"
          >
            <Plus className="h-4 w-4" /> New coupon
          </button>
        </div>

        {showForm && (
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-black text-slate-950">Create coupon</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <label>
                <span className="mb-1 block text-xs font-black uppercase text-slate-500">Code</span>
                <input className={inputClass} value={form.code} onChange={(e) => set("code", e.target.value.toUpperCase())} placeholder="SAVE20" />
              </label>
              <label>
                <span className="mb-1 block text-xs font-black uppercase text-slate-500">Type</span>
                <select className={inputClass} value={form.type} onChange={(e) => set("type", e.target.value)}>
                  <option value="percent">Percentage off</option>
                  <option value="fixed">Fixed amount off</option>
                </select>
              </label>
              <label>
                <span className="mb-1 block text-xs font-black uppercase text-slate-500">
                  Value {form.type === "percent" ? "(%)" : "(₹)"}
                </span>
                <input type="number" className={inputClass} value={form.value} onChange={(e) => set("value", e.target.value)} placeholder="20" />
              </label>
              <label>
                <span className="mb-1 block text-xs font-black uppercase text-slate-500">Min order (₹)</span>
                <input type="number" className={inputClass} value={form.minOrderAmount} onChange={(e) => set("minOrderAmount", e.target.value)} placeholder="0" />
              </label>
              {form.type === "percent" && (
                <label>
                  <span className="mb-1 block text-xs font-black uppercase text-slate-500">Max discount (₹)</span>
                  <input type="number" className={inputClass} value={form.maxDiscountAmount} onChange={(e) => set("maxDiscountAmount", e.target.value)} placeholder="Unlimited" />
                </label>
              )}
              <label>
                <span className="mb-1 block text-xs font-black uppercase text-slate-500">Max uses (0 = unlimited)</span>
                <input type="number" className={inputClass} value={form.maxUses} onChange={(e) => set("maxUses", e.target.value)} placeholder="0" />
              </label>
              <label>
                <span className="mb-1 block text-xs font-black uppercase text-slate-500">Expires at</span>
                <input type="datetime-local" className={inputClass} value={form.expiresAt} onChange={(e) => set("expiresAt", e.target.value)} />
              </label>
              <label className="sm:col-span-2">
                <span className="mb-1 block text-xs font-black uppercase text-slate-500">Description (internal)</span>
                <input className={inputClass} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Summer sale 20% off" />
              </label>
            </div>
            <div className="mt-4 flex gap-3">
              <button
                disabled={creating || !form.code || !form.value}
                onClick={handleCreate}
                className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-black text-white disabled:opacity-60"
              >
                {creating ? "Creating..." : "Create coupon"}
              </button>
              <button onClick={() => setShowForm(false)} className="rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-black text-slate-700">
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          {coupons.length === 0 ? (
            <div className="p-10 text-center">
              <Tag className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-3 font-black text-slate-500">No coupons yet</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 bg-slate-50">
                <tr>
                  {["Code", "Type / Value", "Min order", "Uses", "Expires", "Status", ""].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-black uppercase text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {coupons.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-black text-slate-950">{c.code}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {c.type === "percent" ? `${c.value}% off` : `${formatCurrency(c.value)} off`}
                      {c.maxDiscountAmount > 0 && <span className="ml-1 text-xs text-slate-400">(max {formatCurrency(c.maxDiscountAmount)})</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{c.minOrderAmount > 0 ? formatCurrency(c.minOrderAmount) : "—"}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {c.usedCount || 0}{c.maxUses > 0 ? ` / ${c.maxUses}` : ""}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {c.expiresAt ? new Date(c.expiresAt.toMillis?.() || c.expiresAt).toLocaleDateString("en-IN") : "Never"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-black ${c.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                        {c.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggle(c)}
                          title={c.active ? "Deactivate" : "Activate"}
                          className="text-slate-400 hover:text-violet-600"
                        >
                          {c.active ? <ToggleRight className="h-5 w-5 text-emerald-500" /> : <ToggleLeft className="h-5 w-5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(c.code)}
                          title="Delete"
                          className="text-slate-300 hover:text-rose-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminCoupons;
