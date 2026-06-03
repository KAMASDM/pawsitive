import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiArrowRight, FiCheckCircle, FiShield, FiShoppingBag } from "react-icons/fi";
import { motion } from "framer-motion";
import { requestVendorRole } from "../services/vendorService";
import { useCommerceUser } from "../auth/useCommerceUser";

export default function VendorRegister() {
  const navigate = useNavigate();
  const { user, profile, vendorId, loading } = useCommerceUser();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const start = async () => {
    if (!user) {
      navigate("/", { state: { from: "/vendor/register" } });
      return;
    }
    setSaving(true);
    setError("");
    try {
      await requestVendorRole();
      navigate("/vendor/onboarding");
    } catch (startError) {
      setError(startError?.message || "Unable to start vendor registration.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-lavender-50 p-4"><div className="max-w-5xl mx-auto h-96 rounded-3xl bg-white animate-pulse" /></div>;
  }

  return (
    <div className="min-h-screen bg-lavender-50 pb-28">
      <section className="bg-gradient-to-br from-slate-950 via-violet-800 to-indigo-700 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-3 py-1 text-xs font-black">
            <FiShoppingBag /> Pawppy Commerce
          </span>
          <h1 className="mt-5 text-4xl sm:text-5xl font-black leading-tight">Sell trusted pet products on Pawppy.</h1>
          <p className="mt-4 max-w-2xl text-violet-100">
            Apply as a vendor, complete compliance checks, and launch your store after approval.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button
              onClick={start}
              disabled={saving}
              className="rounded-full bg-white text-violet-700 px-6 py-3 text-sm font-black inline-flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {vendorId ? "Continue onboarding" : saving ? "Starting..." : "Register as a vendor"} <FiArrowRight />
            </button>
            {!user && (
              <Link to="/" className="rounded-full bg-white/10 border border-white/15 text-white px-6 py-3 text-sm font-black inline-flex items-center justify-center">
                Sign in first
              </Link>
            )}
          </div>
          {error && <p className="mt-4 text-sm font-bold text-rose-100">{error}</p>}
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid md:grid-cols-3 gap-4">
        {[
          ["Apply", "Share your business, GST/PAN, and contact details."],
          ["Get vetted", "Pawppy admin reviews documents and business fit."],
          ["Launch", "Approved vendors can create products and receive orders."],
        ].map(([title, copy], index) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            className="rounded-3xl bg-white border border-violet-100 p-5 shadow-sm"
          >
            <div className="w-11 h-11 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center">
              {index === 1 ? <FiShield /> : <FiCheckCircle />}
            </div>
            <h2 className="mt-4 text-xl font-black text-slate-900">{title}</h2>
            <p className="mt-2 text-sm text-slate-500">{copy}</p>
          </motion.div>
        ))}
      </main>

      {profile?.role === "vendor" && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/vendor/status" className="text-sm font-black text-violet-600">View current vendor status</Link>
        </div>
      )}
    </div>
  );
}
