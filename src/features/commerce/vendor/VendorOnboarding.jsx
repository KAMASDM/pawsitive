import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowRight, FiCheck, FiFileText, FiSave, FiUploadCloud } from "react-icons/fi";
import { motion } from "framer-motion";
import { useCommerceUser } from "../auth/useCommerceUser";
import {
  VENDOR_DOCUMENT_TYPES,
  autosaveVendorDraft,
  getVendorDocuments,
  saveVendorDocumentToRealtime,
  submitVendorForReview,
} from "../services/vendorService";

const steps = ["Business", "Compliance", "Address", "Documents", "Bank", "Review"];

const blankVendor = {
  businessName: "",
  legalName: "",
  ownerName: "",
  email: "",
  phone: "",
  gstin: "",
  pan: "",
  categories: [],
  description: "",
  website: "",
  address: { line1: "", line2: "", city: "", state: "", pincode: "", country: "India" },
  documents: [],
  bankDetails: { accountName: "", accountNumber: "", ifsc: "" },
};

const categories = ["Food", "Treats", "Toys", "Grooming", "Health", "Accessories", "Training", "Beds"];

export default function VendorOnboarding() {
  const navigate = useNavigate();
  const { user, vendorId, vendor, loading } = useCommerceUser();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(blankVendor);
  const [documents, setDocuments] = useState({});
  const [saving, setSaving] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!vendor) return;
    setForm({
      ...blankVendor,
      ...vendor,
      address: { ...blankVendor.address, ...(vendor.address || {}) },
      bankDetails: { ...blankVendor.bankDetails, ...(vendor.bankDetails || {}) },
    });
  }, [vendor]);

  useEffect(() => {
    if (!vendorId) return;
    getVendorDocuments(vendorId).then(setDocuments).catch(() => {});
  }, [vendorId]);

  const documentSummary = useMemo(() => Object.entries(documents).map(([type, data]) => ({
    type,
    status: data.status || "pending",
    note: data.note || "",
    name: data.name,
    uploadedAt: data.uploadedAt,
    realtimePath: `vendorDocuments/${vendorId}/${type}`,
    url: data.dataUrl,
  })), [documents, vendorId]);

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const updateAddress = (field, value) => setForm((current) => ({ ...current, address: { ...current.address, [field]: value } }));
  const updateBank = (field, value) => setForm((current) => ({ ...current, bankDetails: { ...current.bankDetails, [field]: value } }));

  const toggleCategory = (category) => {
    setForm((current) => ({
      ...current,
      categories: current.categories.includes(category)
        ? current.categories.filter((item) => item !== category)
        : [...current.categories, category],
    }));
  };

  const saveDraft = async () => {
    setSaving("draft");
    setError("");
    setMessage("");
    try {
      await autosaveVendorDraft(vendorId, {
        ...form,
        ownerName: form.ownerName || user?.displayName || "",
        email: form.email || user?.email || "",
        documents: documentSummary,
      });
      setMessage("Draft saved.");
    } catch (saveError) {
      setError(saveError?.message || "Unable to save draft.");
    } finally {
      setSaving("");
    }
  };

  const uploadDocument = async (type, file) => {
    if (!file) return;
    setSaving(type);
    setError("");
    setMessage("");
    try {
      const metadata = await saveVendorDocumentToRealtime({ vendorId, type, file });
      setDocuments((current) => ({ ...current, [type]: { ...metadata, dataUrl: metadata.url } }));
      await autosaveVendorDraft(vendorId, {
        documents: [...documentSummary.filter((item) => item.type !== type), metadata],
      });
      setMessage("Document uploaded.");
    } catch (uploadError) {
      setError(uploadError?.message || "Unable to upload document.");
    } finally {
      setSaving("");
    }
  };

  const submit = async () => {
    setSaving("submit");
    setError("");
    setMessage("");
    try {
      await submitVendorForReview(vendorId, {
        ...form,
        ownerName: form.ownerName || user?.displayName || "",
        email: form.email || user?.email || "",
        documents: documentSummary,
      });
      navigate("/vendor/status");
    } catch (submitError) {
      setError(submitError?.message || "Unable to submit for review.");
    } finally {
      setSaving("");
    }
  };

  if (loading) return <div className="min-h-screen bg-lavender-50 p-4"><div className="max-w-6xl mx-auto h-96 rounded-3xl bg-white animate-pulse" /></div>;
  if (!vendorId) {
    navigate("/vendor/register");
    return null;
  }

  return (
    <div className="min-h-screen bg-lavender-50 pb-28">
      <section className="bg-white border-b border-violet-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <h1 className="text-2xl font-black text-slate-900">Vendor onboarding</h1>
          <div className="mt-4 grid grid-cols-3 sm:grid-cols-6 gap-2">
            {steps.map((item, index) => (
              <button
                key={item}
                onClick={() => setStep(index)}
                className={`rounded-2xl px-3 py-2 text-xs font-black ${step === index ? "bg-violet-600 text-white" : index < step ? "bg-emerald-50 text-emerald-700" : "bg-violet-50 text-violet-500"}`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {(error || message) && (
          <div className={`mb-4 rounded-2xl border p-3 text-sm font-bold ${error ? "bg-rose-50 border-rose-100 text-rose-700" : "bg-emerald-50 border-emerald-100 text-emerald-700"}`}>
            {error || message}
          </div>
        )}

        <motion.section
          key={step}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl bg-white border border-violet-100 p-5 shadow-sm"
        >
          {step === 0 && (
            <div className="grid md:grid-cols-2 gap-3">
              {[
                ["businessName", "Business name"],
                ["legalName", "Legal name"],
                ["ownerName", "Owner name"],
                ["email", "Business email"],
                ["phone", "Phone"],
                ["website", "Website"],
              ].map(([field, label]) => (
                <input key={field} value={form[field] || ""} onChange={(event) => updateField(field, event.target.value)} placeholder={label} className="rounded-2xl border-violet-100 bg-violet-50/40 text-sm focus:ring-violet-200" />
              ))}
              <textarea value={form.description || ""} onChange={(event) => updateField("description", event.target.value)} placeholder="Business description" rows={4} className="md:col-span-2 rounded-2xl border-violet-100 bg-violet-50/40 text-sm focus:ring-violet-200" />
              <div className="md:col-span-2 flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button key={category} type="button" onClick={() => toggleCategory(category)} className={`rounded-full px-4 py-2 text-xs font-black ${form.categories.includes(category) ? "bg-violet-600 text-white" : "bg-violet-50 text-violet-600"}`}>
                    {category}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="grid md:grid-cols-2 gap-3">
              <input value={form.gstin || ""} onChange={(event) => updateField("gstin", event.target.value.toUpperCase())} placeholder="GSTIN" className="rounded-2xl border-violet-100 bg-violet-50/40 text-sm focus:ring-violet-200" />
              <input value={form.pan || ""} onChange={(event) => updateField("pan", event.target.value.toUpperCase())} placeholder="PAN" className="rounded-2xl border-violet-100 bg-violet-50/40 text-sm focus:ring-violet-200" />
              <p className="md:col-span-2 text-sm text-slate-500">GST and PAN are used only for vetting and are visible to your account and Pawppy admins.</p>
            </div>
          )}

          {step === 2 && (
            <div className="grid md:grid-cols-2 gap-3">
              {["line1", "line2", "city", "state", "pincode", "country"].map((field) => (
                <input key={field} value={form.address[field] || ""} onChange={(event) => updateAddress(field, event.target.value)} placeholder={field === "line1" ? "Address line 1" : field === "line2" ? "Address line 2" : field[0].toUpperCase() + field.slice(1)} className="rounded-2xl border-violet-100 bg-violet-50/40 text-sm focus:ring-violet-200" />
              ))}
            </div>
          )}

          {step === 3 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <FiFileText className="text-violet-500" />
                <h2 className="font-black text-slate-900">Compliance documents</h2>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {VENDOR_DOCUMENT_TYPES.map((documentType) => {
                  const uploaded = documents[documentType.id];
                  return (
                    <label key={documentType.id} className="rounded-2xl border border-violet-100 bg-violet-50/30 p-3 cursor-pointer">
                      <input type="file" accept=".pdf,image/png,image/jpeg,image/webp" className="sr-only" onChange={(event) => uploadDocument(documentType.id, event.target.files?.[0])} />
                      <span className="flex items-center justify-between gap-3">
                        <span className="min-w-0">
                          <span className="block text-sm font-black text-slate-800">{documentType.label}</span>
                          <span className={`block text-xs truncate ${uploaded ? "text-emerald-600" : "text-slate-400"}`}>
                            {uploaded ? uploaded.name : "PDF, JPG, PNG, WEBP up to 2MB"}
                          </span>
                        </span>
                        <span className="w-9 h-9 rounded-full bg-white text-violet-600 flex items-center justify-center">
                          {saving === documentType.id ? "..." : <FiUploadCloud />}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="grid md:grid-cols-2 gap-3">
              <input value={form.bankDetails.accountName || ""} onChange={(event) => updateBank("accountName", event.target.value)} placeholder="Account holder name" className="rounded-2xl border-violet-100 bg-violet-50/40 text-sm focus:ring-violet-200" />
              <input value={form.bankDetails.accountNumber || ""} onChange={(event) => updateBank("accountNumber", event.target.value)} placeholder="Account number" className="rounded-2xl border-violet-100 bg-violet-50/40 text-sm focus:ring-violet-200" />
              <input value={form.bankDetails.ifsc || ""} onChange={(event) => updateBank("ifsc", event.target.value.toUpperCase())} placeholder="IFSC" className="rounded-2xl border-violet-100 bg-violet-50/40 text-sm focus:ring-violet-200" />
              <p className="md:col-span-2 text-sm text-slate-500">Payouts are not active yet, but collecting this now helps admin vetting.</p>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-3">
              {[
                ["Business", form.businessName],
                ["Legal name", form.legalName],
                ["Owner", form.ownerName || user?.displayName],
                ["Email", form.email || user?.email],
                ["Phone", form.phone],
                ["GSTIN", form.gstin],
                ["PAN", form.pan],
                ["Documents", `${documentSummary.length} uploaded`],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl bg-violet-50/40 p-3">
                  <p className="text-xs font-black uppercase text-violet-400">{label}</p>
                  <p className="mt-1 font-bold text-slate-800">{value || "Not provided"}</p>
                </div>
              ))}
            </div>
          )}
        </motion.section>

        <div className="mt-5 flex flex-col sm:flex-row gap-3 sm:justify-between">
          <button onClick={saveDraft} disabled={saving !== ""} className="rounded-full bg-white border border-violet-100 text-violet-700 px-5 py-3 text-sm font-black inline-flex items-center justify-center gap-2 disabled:opacity-50">
            <FiSave /> {saving === "draft" ? "Saving..." : "Save draft"}
          </button>
          <div className="flex gap-3">
            {step > 0 && <button onClick={() => setStep((current) => current - 1)} className="rounded-full bg-slate-100 text-slate-700 px-5 py-3 text-sm font-black">Back</button>}
            {step < steps.length - 1 ? (
              <button onClick={() => setStep((current) => current + 1)} className="rounded-full bg-violet-600 text-white px-5 py-3 text-sm font-black inline-flex items-center gap-2">Next <FiArrowRight /></button>
            ) : (
              <button onClick={submit} disabled={saving !== "" || !form.businessName || !form.phone} className="rounded-full bg-emerald-600 text-white px-5 py-3 text-sm font-black inline-flex items-center gap-2 disabled:bg-slate-200 disabled:text-slate-400">
                <FiCheck /> {saving === "submit" ? "Submitting..." : "Submit for review"}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
