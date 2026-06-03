import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FiAlertCircle, FiArrowRight, FiSearch, FiShield } from "react-icons/fi";
import { ensureCommerceAdminClaim } from "../auth/useCommerceUser";
import { ADMIN_VENDOR_STATUSES, subscribeAdminVendors } from "../services/adminVendorService";

const statusLabels = {
  pending: "Pending",
  documentation_required: "Docs required",
  under_review: "Under review",
  approved: "Approved",
  rejected: "Rejected",
  suspended: "Suspended",
};

const statusClasses = {
  pending: "bg-amber-50 text-amber-700 border-amber-100",
  documentation_required: "bg-orange-50 text-orange-700 border-orange-100",
  under_review: "bg-blue-50 text-blue-700 border-blue-100",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-100",
  rejected: "bg-rose-50 text-rose-700 border-rose-100",
  suspended: "bg-slate-100 text-slate-700 border-slate-200",
};

const formatDate = (value) => {
  const date = value?.toDate ? value.toDate() : value ? new Date(value) : null;
  if (!date) return "Not available";
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(date);
};

export default function AdminVendors() {
  const [vendors, setVendors] = useState([]);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let unsubscribe = () => {};
    let cancelled = false;

    const start = async () => {
      try {
        await ensureCommerceAdminClaim();
        if (cancelled) return;
        unsubscribe = subscribeAdminVendors((nextVendors) => {
          setVendors(nextVendors);
          setLoading(false);
        }, (subscriptionError) => {
          setError(subscriptionError?.message || "Unable to load vendors.");
          setLoading(false);
        });
      } catch (claimError) {
        setError(claimError?.message || "Unable to prepare admin access.");
        setLoading(false);
      }
    };

    start();
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const counts = useMemo(() => ADMIN_VENDOR_STATUSES.reduce((acc, item) => ({
    ...acc,
    [item]: vendors.filter((vendor) => vendor.status === item).length,
  }), {}), [vendors]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return vendors.filter((vendor) => {
      const matchesStatus = status === "all" || vendor.status === status;
      const haystack = [vendor.businessName, vendor.legalName, vendor.email, vendor.phone, vendor.gstin, vendor.pan]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return matchesStatus && (!needle || haystack.includes(needle));
    });
  }, [vendors, status, search]);

  if (loading) {
    return <div className="min-h-screen bg-slate-50 p-4"><div className="max-w-7xl mx-auto h-96 rounded-3xl bg-white animate-pulse" /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      <section className="bg-slate-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-3 py-1 text-xs font-black">
            <FiShield /> Commerce Admin
          </span>
          <h1 className="mt-4 text-4xl font-black">Vendor management</h1>
          <p className="mt-2 text-slate-300 max-w-2xl">Review applications, documents, notes, and approval workflow status.</p>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        {error && (
          <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm font-bold text-rose-700 flex gap-2">
            <FiAlertCircle className="shrink-0 mt-0.5" /> {error}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {ADMIN_VENDOR_STATUSES.map((item) => (
            <button
              key={item}
              onClick={() => setStatus(item)}
              className={`rounded-2xl border p-3 text-left ${status === item ? statusClasses[item] : "bg-white border-slate-200 text-slate-600"}`}
            >
              <p className="text-2xl font-black">{counts[item] || 0}</p>
              <p className="text-xs font-bold">{statusLabels[item]}</p>
            </button>
          ))}
        </div>

        <div className="rounded-3xl bg-white border border-slate-200 p-4 shadow-sm">
          <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <div className="relative flex-1">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search vendors by business, email, GSTIN, PAN"
                className="w-full rounded-2xl border-slate-200 bg-slate-50 pl-11 text-sm focus:ring-violet-200"
              />
            </div>
            <button onClick={() => setStatus("all")} className="rounded-full bg-slate-100 text-slate-700 px-4 py-2 text-sm font-black">
              Show all
            </button>
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100">
            <div className="hidden md:grid grid-cols-[1.4fr_1fr_1fr_0.7fr_0.4fr] gap-3 bg-slate-50 px-4 py-3 text-xs font-black uppercase text-slate-400">
              <span>Vendor</span>
              <span>Contact</span>
              <span>Compliance</span>
              <span>Status</span>
              <span></span>
            </div>
            {filtered.length === 0 ? (
              <p className="p-5 text-sm text-slate-500">No vendors match this view.</p>
            ) : filtered.map((vendor) => (
              <Link
                key={vendor.id}
                to={`/admin/vendors/${vendor.id}`}
                className="grid md:grid-cols-[1.4fr_1fr_1fr_0.7fr_0.4fr] gap-3 px-4 py-4 border-t border-slate-100 hover:bg-violet-50/40 transition-colors"
              >
                <div>
                  <p className="font-black text-slate-900">{vendor.businessName || "Unnamed vendor"}</p>
                  <p className="text-xs text-slate-500">{vendor.legalName || "Legal name pending"}</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700">{vendor.email || "No email"}</p>
                  <p className="text-xs text-slate-500">{vendor.phone || "No phone"}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-700">GST: {vendor.gstin || "Pending"}</p>
                  <p className="text-xs text-slate-500">Updated {formatDate(vendor.updatedAt)}</p>
                </div>
                <div>
                  <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${statusClasses[vendor.status || "pending"]}`}>
                    {statusLabels[vendor.status || "pending"]}
                  </span>
                </div>
                <div className="flex md:justify-end">
                  <FiArrowRight className="text-violet-500" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
