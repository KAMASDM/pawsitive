import React from "react";
import { Link } from "react-router-dom";
import { FiAlertCircle, FiCheckCircle, FiClock, FiEdit3, FiShoppingBag } from "react-icons/fi";
import { useCommerceUser } from "../auth/useCommerceUser";

const statusCopy = {
  pending: {
    Icon: FiClock,
    title: "Vendor profile started",
    copy: "Complete onboarding and submit your profile for Pawppy review.",
    tone: "bg-amber-50 border-amber-100 text-amber-700",
  },
  documentation_required: {
    Icon: FiAlertCircle,
    title: "Documentation required",
    copy: "Pawppy needs updated documents or clarification before continuing.",
    tone: "bg-rose-50 border-rose-100 text-rose-700",
  },
  under_review: {
    Icon: FiClock,
    title: "Application under review",
    copy: "Your vendor profile is with Pawppy admin for compliance and quality checks.",
    tone: "bg-blue-50 border-blue-100 text-blue-700",
  },
  approved: {
    Icon: FiCheckCircle,
    title: "Vendor approved",
    copy: "You can now create products and prepare your Pawppy storefront.",
    tone: "bg-emerald-50 border-emerald-100 text-emerald-700",
  },
  rejected: {
    Icon: FiAlertCircle,
    title: "Application rejected",
    copy: "Review the admin note and update your vendor details before resubmitting.",
    tone: "bg-rose-50 border-rose-100 text-rose-700",
  },
  suspended: {
    Icon: FiAlertCircle,
    title: "Vendor suspended",
    copy: "Your selling access is paused. Contact Pawppy support for next steps.",
    tone: "bg-slate-100 border-slate-200 text-slate-700",
  },
};

export default function VendorStatus() {
  const { vendor, loading } = useCommerceUser();

  if (loading) return <div className="min-h-screen bg-lavender-50 p-4"><div className="max-w-4xl mx-auto h-96 rounded-3xl bg-white animate-pulse" /></div>;

  const status = vendor?.status || "pending";
  const meta = statusCopy[status] || statusCopy.pending;
  const Icon = meta.Icon;
  const history = vendor?.statusHistory || [];

  return (
    <div className="min-h-screen bg-lavender-50 pb-28">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-5">
        <section className={`rounded-3xl border p-5 ${meta.tone}`}>
          <div className="flex items-start gap-4">
            <span className="w-12 h-12 rounded-2xl bg-white/70 flex items-center justify-center shrink-0">
              <Icon size={24} />
            </span>
            <div>
              <h1 className="text-2xl font-black">{meta.title}</h1>
              <p className="mt-2 text-sm opacity-80">{meta.copy}</p>
              {vendor?.reviewNote && <p className="mt-3 text-sm font-bold">Admin note: {vendor.reviewNote}</p>}
            </div>
          </div>
        </section>

        <div className="grid sm:grid-cols-2 gap-3">
          <Link to="/vendor/onboarding" className="rounded-3xl bg-white border border-violet-100 p-5 shadow-sm flex items-center gap-3">
            <span className="w-11 h-11 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center"><FiEdit3 /></span>
            <span>
              <span className="block font-black text-slate-900">Edit onboarding</span>
              <span className="block text-sm text-slate-500">Update profile and documents</span>
            </span>
          </Link>
          <Link to={status === "approved" ? "/vendor/dashboard" : "/shop"} className="rounded-3xl bg-white border border-violet-100 p-5 shadow-sm flex items-center gap-3">
            <span className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><FiShoppingBag /></span>
            <span>
              <span className="block font-black text-slate-900">{status === "approved" ? "Go to dashboard" : "Browse Pawppy Market"}</span>
              <span className="block text-sm text-slate-500">{status === "approved" ? "Manage products and orders" : "Selling unlocks after approval"}</span>
            </span>
          </Link>
        </div>

        <section className="rounded-3xl bg-white border border-violet-100 p-5 shadow-sm">
          <h2 className="text-xl font-black text-slate-900">Status history</h2>
          <div className="mt-4 space-y-3">
            {history.length === 0 ? (
              <p className="text-sm text-slate-500">No admin status changes yet.</p>
            ) : history.map((item, index) => (
              <div key={`${item.to}-${index}`} className="rounded-2xl bg-violet-50/40 p-3">
                <p className="font-black text-slate-800">{item.from || "new"} to {item.to}</p>
                {item.note && <p className="text-sm text-slate-500 mt-1">{item.note}</p>}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
