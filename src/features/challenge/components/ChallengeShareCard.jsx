import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { generateShareImage, downloadBlobUrl } from "../../../utils/generateShareImage";
import { FiX, FiDownload, FiCopy, FiCheck } from "react-icons/fi";

const FEED_URL = "https://pawppy.in/challenge/feed";

export default function ChallengeShareCard({ entry, challengeTheme, onClose }) {
  const cardRef = useRef(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState("");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const getBlobUrl = async () => {
    setGenerating(true);
    try {
      return await generateShareImage(cardRef, `${entry.petName}-challenge`);
    } finally {
      setGenerating(false);
    }
  };

  const handleWhatsApp = async () => {
    const text = `Check out ${entry.petName} in the Pawppy Challenge! Vote here: ${FEED_URL}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleInstagram = async () => {
    const url = await getBlobUrl();
    downloadBlobUrl(url, `${entry.petName}-challenge.png`);
    showToast("Image saved! Share it to Instagram Stories 🎉");
  };

  const handleDownload = async () => {
    const url = await getBlobUrl();
    downloadBlobUrl(url, `${entry.petName}-challenge.png`);
  };

  const handleCopy = () => {
    navigator.clipboard?.writeText(FEED_URL).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] flex flex-col items-center justify-end bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 320, damping: 30 }}
        className="bg-white rounded-t-3xl w-full max-w-lg p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800 text-base">Share {entry.petName}'s Entry</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FiX size={20} />
          </button>
        </div>

        {/* Off-screen renderable share card */}
        <div style={{ position: "absolute", left: -9999, top: -9999 }}>
          <div
            ref={cardRef}
            style={{
              width: 600,
              height: 600,
              background: "linear-gradient(160deg, #6d5dbf 0%, #2e2550 100%)",
              borderRadius: 24,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              fontFamily: "sans-serif",
            }}
          >
            {/* Pet photo — top 60% */}
            <div style={{ height: 360, overflow: "hidden", position: "relative", flexShrink: 0 }}>
              <img
                src={entry.petPhotoUrl}
                crossOrigin="anonymous"
                alt={entry.petName}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 50%, rgba(46,37,80,0.7) 100%)" }} />
            </div>
            {/* Bottom info */}
            <div style={{ padding: "20px 28px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <p style={{ color: "#c4b5fd", fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>{challengeTheme}</p>
                <p style={{ color: "#fff", fontSize: 26, fontWeight: 900, lineHeight: 1.1 }}>{entry.petName}</p>
                {entry.caption && <p style={{ color: "#d1d5db", fontSize: 13, marginTop: 6, lineHeight: 1.4 }}>{entry.caption}</p>}
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ background: "rgba(255,255,255,0.15)", padding: "6px 16px", borderRadius: 999, display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: "#f87171", fontSize: 16 }}>❤️</span>
                  <span style={{ color: "#fff", fontSize: 15, fontWeight: 700 }}>{entry.voteCount || 0} votes</span>
                </div>
                <p style={{ color: "#a78bfa", fontSize: 11, fontWeight: 600 }}>Vote for me on Pawppy! 🐾 pawppy.in</p>
              </div>
            </div>
          </div>
        </div>

        {/* Preview thumbnail */}
        <div className="rounded-xl overflow-hidden mb-5 border border-slate-100 aspect-square max-h-48 mx-auto">
          <img src={entry.petPhotoUrl} alt="" className="w-full h-full object-cover" />
        </div>

        {/* Share actions */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { icon: "💬", label: "WhatsApp", action: handleWhatsApp },
            { icon: "📸", label: "Instagram", action: handleInstagram },
            { icon: "⬇️", label: "Download", action: handleDownload },
            { icon: copied ? <FiCheck size={18} /> : <FiCopy size={18} />, label: copied ? "Copied!" : "Copy Link", action: handleCopy },
          ].map(({ icon, label, action }) => (
            <button
              key={label}
              onClick={action}
              disabled={generating}
              className="flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-slate-50 hover:bg-violet-50 transition-colors disabled:opacity-50"
            >
              <span className="text-xl">{icon}</span>
              <span className="text-[10px] font-semibold text-gray-500">{label}</span>
            </button>
          ))}
        </div>

        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-center text-sm text-violet-600 font-semibold mt-3"
            >
              {toast}
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
