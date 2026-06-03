import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FiArrowLeft, FiCheckCircle, FiExternalLink, FiFileText, FiShield, FiXCircle } from "react-icons/fi";
import { ensureCommerceAdminClaim } from "../auth/useCommerceUser";
import {
  ADMIN_VENDOR_STATUSES,
  getAdminVendorDocuments,
  reviewVendorDocument,
  setVendorStatus,
  subscribeAdminVendor,
} from "../services/adminVendorService";
import { VENDOR_DOCUMENT_TYPES } from "../services/vendorService";

const statusLabels = {
  pending: "Pending",
  documentation_required: "Documentation required",
  under_review: "Under review",
  approved: "Approved",
  rejected: "Rejected",
  suspended: "Suspended",
};

const formatDateTime = (value) => {
  const date = value?.toDate ? value.toDate() : value ? new Date(value) : null;
  if (!date) return "Not available";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

export default function AdminVendorDetail() {
  const { id } = useParams();
  const [vendor, setVendor] = useState(null);
  const [documents, setDocuments] = useState({});
  const [status, setStatus] = useState("under_review");
  const [note, setNote] = useState("");
  const [documentNotes, setDocumentNotes] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let unsubscribe = () => {};
    let cancelled = false;

    const start = async () => {
      try {
        await ensureCommerceAdminClaim();
        if (cancelled) return;
        unsubscribe = subscribeAdminVendor(id, (nextVendor) => {
          setVendor(nextVendor);
          setStatus(nextVendor?.status || "under_review");
          setLoading(false);
        }, (subscriptionError) => {
          setError(subscriptionError?.message || "Unable to load vendor.");
          setLoading(false);
        });
        const nextDocuments = await getAdminVendorDocuments(id);
        if (!cancelled) setDocuments(nextDocuments);
      } catch (startError) {
        setError(startError?.message || "Unable to prepare admin access.");
        setLoading(false);
      }
    };

    start();
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [id]);

  const documentRows = useMemo(() => VENDOR_DOCUMENT_TYPES.map((documentType) => ({
    ...documentType,
    document: documents[documentType.id] || null,
  })), [documents]);

  const transitionStatus = async () => {
    setSaving("status");
    setError("");
    setMessage("");
    try {
      await setVendorStatus({ vendorId: id, status, note });
      setNote("");
      setMessage("Vendor status updated.");
    } catch (statusError) {
      setError(statusError?.message || "Unable to update vendor status.");
    } finally {
      setSaving("");
    }
  };

  const reviewDocument = async (documentType, nextStatus) => {
    setSaving(`${documentType}-${nextStatus}`);
    setError("");
    setMessage("");
    try {
      await reviewVendorDocument({
        vendorId: id,
        documentType,
        status: nextStatus,
        note: documentNotes[documentType] || "",
      });
      const nextDocuments = await getAdminVendorDocuments(id);
      setDocuments(nextDocuments);
      setMessage("Document review saved.");
    } catch (documentError) {
      setError(documentError?.message || "Unable to review document.");
    } finally {
      setSaving("");
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-50 p-4"><div className="max-w-6xl mx-auto h-96 rounded-3xl bg-white animate-pulse" /></div>;
  }

  if (!vendor) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <Link to="/admin/vendors" className="text-sm font-black text-violet-600 inline-flex items-center gap-2"><FiArrowLeft /> Back to vendors</Link>
        <p className="mt-6 text-slate-600">Vendor not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      <section className="bg-slate-950 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-7">
          <Link to="/admin/vendors" className="text-sm font-black text-slate-300 inline-flex items-center gap-2"><FiArrowLeft /> Vendors</Link>
          <div className="mt-5 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-3 py-1 text-xs font-black">
                <FiShield /> Vendor profile
              </span>
              <h1 className="mt-3 text-4xl font-black">{vendor.businessName || "Unnamed vendor"}</h1>
              <p className="mt-1 text-slate-300">{vendor.legalName || "Legal name pending"} · {vendor.email}</p>
            </div>
            <span className="w-fit rounded-full bg-white/10 border border-white/15 px-4 py-2 text-sm font-black">
              {statusLabels[vendor.status || "pending"]}
            </span>
          </div>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        {(error || message) && (
          <div className={`rounded-2xl border p-4 text-sm font-bold ${error ? "bg-rose-50 border-rose-100 text-rose-700" : "bg-emerald-50 border-emerald-100 text-emerald-700"}`}>
            {error || message}
          </div>
        )}

        <div className="grid lg:grid-cols-[1fr_360px] gap-5">
          <section className="rounded-3xl bg-white border border-slate-200 p-5 shadow-sm space-y-5">
            <div className="grid md:grid-cols-2 gap-3">
              {[
                ["Owner", vendor.ownerName],
                ["Phone", vendor.phone],
                ["GSTIN", vendor.gstin],
                ["PAN", vendor.pan],
                ["Categories", vendor.categories?.join(", ")],
                ["Website", vendor.website],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-black uppercase text-slate-400">{label}</p>
                  <p className="mt-1 font-bold text-slate-800 break-words">{value || "Not provided"}</p>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-slate-100 p-4">
              <h2 className="font-black text-slate-900">Business description</h2>
              <p className="mt-2 text-sm text-slate-600 whitespace-pre-wrap">{vendor.description || "Not provided"}</p>
            </div>

            <div className="rounded-2xl border border-slate-100 p-4">
              <h2 className="font-black text-slate-900">Business address</h2>
              <p className="mt-2 text-sm text-slate-600">
                {[vendor.address?.line1, vendor.address?.line2, vendor.address?.city, vendor.address?.state, vendor.address?.pincode, vendor.address?.country].filter(Boolean).join(", ") || "Not provided"}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 p-4">
              <h2 className="font-black text-slate-900">Bank details</h2>
              <div className="mt-3 grid md:grid-cols-3 gap-3 text-sm">
                <p><span className="font-black text-slate-400 block text-xs uppercase">Account name</span>{vendor.bankDetails?.accountName || "Not provided"}</p>
                <p><span className="font-black text-slate-400 block text-xs uppercase">Account number</span>{vendor.bankDetails?.accountNumber || "Not provided"}</p>
                <p><span className="font-black text-slate-400 block text-xs uppercase">IFSC</span>{vendor.bankDetails?.ifsc || "Not provided"}</p>
              </div>
            </div>
          </section>

          <aside className="rounded-3xl bg-white border border-slate-200 p-5 shadow-sm h-fit">
            <h2 className="text-xl font-black text-slate-900">Status transition</h2>
            <select value={status} onChange={(event) => setStatus(event.target.value)} className="mt-4 w-full rounded-2xl border-slate-200 bg-slate-50 text-sm focus:ring-violet-200">
              {ADMIN_VENDOR_STATUSES.map((item) => <option key={item} value={item}>{statusLabels[item]}</option>)}
            </select>
            <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Admin note for vendor" rows={4} className="mt-3 w-full rounded-2xl border-slate-200 bg-slate-50 text-sm focus:ring-violet-200" />
            <button onClick={transitionStatus} disabled={saving !== ""} className="mt-3 w-full rounded-full bg-violet-600 text-white px-5 py-3 text-sm font-black disabled:bg-slate-200 disabled:text-slate-400">
              {saving === "status" ? "Saving..." : "Update status"}
            </button>
          </aside>
        </div>

        <section className="rounded-3xl bg-white border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <FiFileText className="text-violet-500" />
            <h2 className="text-xl font-black text-slate-900">Documents</h2>
          </div>
          <div className="mt-4 grid md:grid-cols-2 gap-3">
            {documentRows.map(({ id: documentType, label, document }) => (
              <div key={documentType} className="rounded-2xl border border-slate-100 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-black text-slate-800">{label}</h3>
                    <p className="mt-1 text-xs text-slate-500">{document?.name || "Not uploaded"}</p>
                    {document?.status && <p className="mt-1 text-xs font-black text-violet-600">{document.status}</p>}
                  </div>
                  {document?.dataUrl && (
                    <a href={document.dataUrl} target="_blank" rel="noreferrer" className="rounded-full bg-violet-50 text-violet-600 px-3 py-2 text-xs font-black inline-flex items-center gap-1">
                      Open <FiExternalLink />
                    </a>
                  )}
                </div>
                {document && (
                  <>
                    <textarea
                      value={documentNotes[documentType] ?? document.note ?? ""}
                      onChange={(event) => setDocumentNotes((current) => ({ ...current, [documentType]: event.target.value }))}
                      placeholder="Document note"
                      rows={2}
                      className="mt-3 w-full rounded-2xl border-slate-200 bg-slate-50 text-sm focus:ring-violet-200"
                    />
                    <div className="mt-3 flex gap-2">
                      <button onClick={() => reviewDocument(documentType, "approved")} disabled={saving !== ""} className="rounded-full bg-emerald-50 text-emerald-700 px-4 py-2 text-xs font-black inline-flex items-center gap-1 disabled:opacity-50">
                        <FiCheckCircle /> Approve
                      </button>
                      <button onClick={() => reviewDocument(documentType, "rejected")} disabled={saving !== ""} className="rounded-full bg-rose-50 text-rose-700 px-4 py-2 text-xs font-black inline-flex items-center gap-1 disabled:opacity-50">
                        <FiXCircle /> Reject
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl bg-white border border-slate-200 p-5 shadow-sm">
          <h2 className="text-xl font-black text-slate-900">Status history</h2>
          <div className="mt-4 space-y-3">
            {(vendor.statusHistory || []).length === 0 ? (
              <p className="text-sm text-slate-500">No status history yet.</p>
            ) : vendor.statusHistory.map((item, index) => (
              <div key={`${item.to}-${index}`} className="rounded-2xl bg-slate-50 p-4">
                <p className="font-black text-slate-800">{item.from || "new"} to {item.to}</p>
                <p className="text-xs text-slate-400 mt-1">{formatDateTime(item.changedAt)}</p>
                {item.note && <p className="mt-2 text-sm text-slate-600">{item.note}</p>}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
