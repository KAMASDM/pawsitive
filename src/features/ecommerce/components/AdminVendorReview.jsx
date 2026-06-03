import React, { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiExternalLink,
  FiFileText,
  FiShield,
  FiXCircle,
} from "react-icons/fi";
import { auth } from "../../../firebase";
import {
  ECOMMERCE_ADMIN_EMAIL,
  VENDOR_DOCUMENT_TYPES,
  reviewVendorApplication,
  subscribeVendorApplicationsForAdmin,
} from "../services/ecommerceService";

const formatDate = (timestamp) => {
  if (!timestamp) return "Not available";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(timestamp);
};

const statusStyles = {
  pending: "bg-amber-50 text-amber-700 border-amber-100",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-100",
  rejected: "bg-rose-50 text-rose-700 border-rose-100",
};

export default function AdminVendorReview() {
  const [user, setUser] = useState(auth.currentUser);
  const [applications, setApplications] = useState([]);
  const [selectedUid, setSelectedUid] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState("");
  const [error, setError] = useState("");

  useEffect(() => onAuthStateChanged(auth, (nextUser) => setUser(nextUser)), []);

  const isAdmin = user?.email?.toLowerCase() === ECOMMERCE_ADMIN_EMAIL;

  useEffect(() => {
    if (!isAdmin) return undefined;
    return subscribeVendorApplicationsForAdmin((nextApplications) => {
      setApplications(nextApplications);
      setSelectedUid((current) => current || nextApplications[0]?.uid || nextApplications[0]?.id || "");
    });
  }, [isAdmin]);

  const selected = useMemo(
    () => applications.find((application) => (application.uid || application.id) === selectedUid) || null,
    [applications, selectedUid]
  );

  const stats = useMemo(() => ({
    pending: applications.filter((item) => (item.status || "pending") === "pending").length,
    approved: applications.filter((item) => item.status === "approved").length,
    rejected: applications.filter((item) => item.status === "rejected").length,
  }), [applications]);

  const review = async (decision) => {
    if (!selected) return;
    setSaving(decision);
    setError("");
    try {
      await reviewVendorApplication({ uid: selected.uid || selected.id, decision, note });
      setNote("");
    } catch (reviewError) {
      setError(reviewError?.message || "Unable to review vendor.");
    } finally {
      setSaving("");
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
        <div className="max-w-md rounded-[28px] bg-white border border-slate-200 p-6 text-center shadow-sm">
          <FiShield className="mx-auto text-violet-500" size={34} />
          <h1 className="mt-3 text-2xl font-black text-slate-900">Admin sign-in required</h1>
          <p className="mt-2 text-sm text-slate-500">Sign in with the Pawppy commerce admin account to review vendors.</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
        <div className="max-w-md rounded-[28px] bg-white border border-rose-100 p-6 text-center shadow-sm">
          <FiAlertCircle className="mx-auto text-rose-500" size={34} />
          <h1 className="mt-3 text-2xl font-black text-slate-900">Restricted admin area</h1>
          <p className="mt-2 text-sm text-slate-500">This page is available only to {ECOMMERCE_ADMIN_EMAIL}.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f7fb] pb-28">
      <section className="bg-slate-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-3 py-1 text-xs font-bold">
            <FiShield /> Pawppy Admin
          </span>
          <h1 className="mt-4 text-4xl lg:text-5xl font-black">Vendor vetting desk</h1>
          <p className="mt-2 text-slate-300 max-w-2xl">Review seller profiles, verify documents, and approve access to Pawppy commerce.</p>
          <div className="mt-5 grid grid-cols-3 gap-3 max-w-lg">
            {[
              ["Pending", stats.pending],
              ["Approved", stats.approved],
              ["Rejected", stats.rejected],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-white/10 border border-white/10 p-3">
                <p className="text-2xl font-black">{value}</p>
                <p className="text-xs text-slate-300">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid lg:grid-cols-[360px_1fr] gap-5">
        <aside className="rounded-[28px] bg-white border border-slate-200 p-3 shadow-sm h-fit">
          {applications.length === 0 ? (
            <p className="p-4 text-sm text-slate-500">No vendor applications yet.</p>
          ) : applications.map((application) => {
            const uid = application.uid || application.id;
            return (
              <button
                key={uid}
                onClick={() => setSelectedUid(uid)}
                className={`w-full text-left rounded-2xl p-4 transition-colors ${selectedUid === uid ? "bg-violet-50" : "hover:bg-slate-50"}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-black text-slate-800 truncate">{application.businessName || "Unnamed vendor"}</p>
                  <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-black ${statusStyles[application.status || "pending"]}`}>
                    {application.status || "pending"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500 truncate">{application.email || application.businessEmail}</p>
                <p className="mt-2 text-[11px] text-slate-400">{formatDate(application.submittedAt)}</p>
              </button>
            );
          })}
        </aside>

        <section className="rounded-[28px] bg-white border border-slate-200 p-5 shadow-sm">
          {!selected ? (
            <p className="text-sm text-slate-500">Select a vendor application to review.</p>
          ) : (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">{selected.businessName}</h2>
                  <p className="text-sm text-slate-500">{selected.businessType} · {selected.city}</p>
                </div>
                <span className={`w-fit rounded-full border px-3 py-1 text-xs font-black ${statusStyles[selected.status || "pending"]}`}>
                  {selected.status || "pending"}
                </span>
              </div>

              {error && <div className="rounded-2xl border border-rose-100 bg-rose-50 p-3 text-sm font-bold text-rose-700">{error}</div>}

              <div className="grid md:grid-cols-2 gap-3">
                {[
                  ["Contact person", selected.contactName],
                  ["Account email", selected.email],
                  ["Business email", selected.businessEmail],
                  ["Phone", selected.phone],
                  ["Submitted", formatDate(selected.submittedAt)],
                  ["Reviewed", formatDate(selected.reviewedAt)],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-black uppercase text-slate-400">{label}</p>
                    <p className="mt-1 font-bold text-slate-800 break-words">{value || "Not provided"}</p>
                  </div>
                ))}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-slate-100 p-4">
                  <h3 className="font-black text-slate-800">Business experience</h3>
                  <p className="mt-2 text-sm text-slate-600 whitespace-pre-wrap">{selected.experience || "Not provided"}</p>
                </div>
                <div className="rounded-2xl border border-slate-100 p-4">
                  <h3 className="font-black text-slate-800">Catalog plan</h3>
                  <p className="mt-2 text-sm text-slate-600 whitespace-pre-wrap">{selected.catalogSummary || "Not provided"}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <FiFileText className="text-violet-500" />
                  <h3 className="font-black text-slate-800">Submitted documents</h3>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  {VENDOR_DOCUMENT_TYPES.map((documentType) => {
                    const document = selected.documents?.[documentType.id];
                    return (
                      <div key={documentType.id} className="rounded-2xl bg-slate-50 p-3">
                        <p className="text-sm font-black text-slate-700">{documentType.label}</p>
                        {document ? (
                          <a href={document.url} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs font-black text-violet-600">
                            Open document <FiExternalLink />
                          </a>
                        ) : (
                          <p className="mt-1 text-xs text-slate-400">Not uploaded</p>
                        )}
                      </div>
                    );
                  })}
                </div>
                {selected.documentsNote && <p className="mt-3 text-sm text-slate-600 whitespace-pre-wrap">{selected.documentsNote}</p>}
              </div>

              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Internal review note or vendor feedback"
                rows={4}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-violet-200"
              />

              <div className="flex flex-col sm:flex-row gap-3">
                <button onClick={() => review("approved")} disabled={saving !== ""} className="rounded-full bg-emerald-600 text-white px-5 py-3 text-sm font-black inline-flex items-center justify-center gap-2 disabled:bg-slate-200 disabled:text-slate-400">
                  <FiCheckCircle /> {saving === "approved" ? "Approving..." : "Approve vendor"}
                </button>
                <button onClick={() => review("rejected")} disabled={saving !== ""} className="rounded-full bg-rose-600 text-white px-5 py-3 text-sm font-black inline-flex items-center justify-center gap-2 disabled:bg-slate-200 disabled:text-slate-400">
                  <FiXCircle /> {saving === "rejected" ? "Rejecting..." : "Reject / request updates"}
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
