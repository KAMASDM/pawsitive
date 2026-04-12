import React, { useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { quizStars, STAR_LABELS, quizXP } from "../../../utils/xpSystem";
import { generateShareImage, downloadBlobUrl } from "../../../utils/generateShareImage";
import { auth } from "../../../firebase";
import { FiShare2, FiAward } from "react-icons/fi";

function Stars({ count, size = "text-3xl" }) {
  return (
    <div className="flex gap-1 justify-center">
      {[1, 2, 3].map((n) => (
        <motion.span
          key={n}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.6 + n * 0.12, type: "spring", stiffness: 400, damping: 16 }}
          className={`${size} ${n <= count ? "text-amber-400" : "text-gray-200"}`}
        >
          ★
        </motion.span>
      ))}
    </div>
  );
}

const SHARE_URL = "https://pawppy.in/quiz/play";

export default function QuizResults() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const cardRef = useRef(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const user = auth.currentUser;

  if (!state) { navigate("/quiz"); return null; }

  const { score, total, timeTaken, quizTitle, quizId } = state;
  const stars = quizStars(score);
  const label = STAR_LABELS[stars];
  const xp = quizXP(score);

  const pct = Math.round((score / total) * 100);

  const shareText = `I scored ${score}/${total} on the Pawppy Weekly Pet Quiz! Can you beat me? 🐾 ${SHARE_URL}`;

  const handleWhatsApp = () => window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank");

  const handleDownload = async () => {
    setGenerating(true);
    try {
      const url = await generateShareImage(cardRef, `quiz-score-${score}-${total}`);
      downloadBlobUrl(url, "pawppy-quiz-score.png");
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard?.writeText(shareText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-14">
      {/* Confetti-ish background blob */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-indigo-100 opacity-60" />
        <div className="absolute top-32 -left-16 w-36 h-36 rounded-full bg-violet-100 opacity-40" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center relative z-10 pt-10">
        {/* Score circle */}
        <motion.div
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="w-32 h-32 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex flex-col items-center justify-center shadow-2xl shadow-indigo-300 mb-4"
        >
          <p className="text-4xl font-black text-white">{score}</p>
          <p className="text-indigo-200 text-xs font-semibold">out of {total}</p>
        </motion.div>

        <Stars count={stars} />
        <h2 className="text-xl font-black text-slate-800 mt-3">{label}</h2>

        {/* Stats row */}
        <div className="mt-5 grid grid-cols-3 gap-3 w-full max-w-xs">
          {[
            { icon: "✅", label: `${pct}%`, sub: "Accuracy" },
            { icon: "⏱", label: `${timeTaken}s`, sub: "Taken" },
            { icon: "⭐", label: `+${xp} XP`, sub: "Earned" },
          ].map(({ icon, label: l, sub }) => (
            <div key={sub} className="bg-white rounded-2xl p-3 border border-slate-100">
              <p className="text-xl mb-0.5">{icon}</p>
              <p className="font-bold text-slate-800 text-sm">{l}</p>
              <p className="text-[10px] text-gray-400">{sub}</p>
            </div>
          ))}
        </div>

        {/* Share actions */}
        <div className="mt-6 grid grid-cols-3 gap-3 w-full max-w-xs">
          {[
            { icon: "💬", label: "WhatsApp", action: handleWhatsApp },
            { icon: "⬇️", label: "Download", action: handleDownload },
            { icon: copied ? "✅" : "🔗", label: copied ? "Copied!" : "Copy Link", action: handleCopy },
          ].map(({ icon, label: l, action }) => (
            <button
              key={l}
              onClick={action}
              disabled={generating}
              className="flex flex-col items-center gap-1 py-3 rounded-2xl bg-white border border-slate-100 hover:bg-indigo-50 transition-colors disabled:opacity-50"
            >
              <span className="text-xl">{icon}</span>
              <span className="text-[10px] font-semibold text-gray-500">{l}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Off-screen share card (for html2canvas) */}
      <div style={{ position: "absolute", left: -9999, top: -9999 }}>
        <div
          ref={cardRef}
          style={{
            width: 600,
            height: 600,
            background: "linear-gradient(135deg, #4338ca 0%, #7c3aed 100%)",
            borderRadius: 24,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "sans-serif",
            padding: "40px 48px",
            textAlign: "center",
            gap: 20,
          }}
        >
          <p style={{ fontSize: 52, margin: 0 }}>🧠</p>
          <p style={{ color: "#c4b5fd", fontSize: 13, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>Pawppy Weekly Pet Quiz</p>
          <p style={{ color: "#fff", fontSize: 44, fontWeight: 900, margin: "-4px 0" }}>{score}/{total}</p>
          <p style={{ color: "#e0e7ff", fontSize: 18, fontWeight: 700 }}>{label}</p>
          <div style={{ display: "flex", gap: 6 }}>
            {[1,2,3].map(n => (
              <span key={n} style={{ fontSize: 32, color: n <= stars ? "#fbbf24" : "#312e81" }}>★</span>
            ))}
          </div>
          <p style={{ color: "#a5b4fc", fontSize: 13, marginTop: 8 }}>Can you beat me? 🐾 pawppy.in</p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="px-6 pb-6 flex gap-3 relative z-10">
        <button
          onClick={() => navigate("/quiz/leaderboard", { state: { quizId } })}
          className="flex-1 border border-indigo-200 text-indigo-600 font-semibold py-3.5 rounded-2xl text-sm flex items-center justify-center gap-2"
        >
          <FiAward size={16} /> Leaderboard
        </button>
        <button
          onClick={() => navigate("/")}
          className="flex-1 bg-indigo-600 text-white font-bold py-3.5 rounded-2xl text-sm"
        >
          Done
        </button>
      </div>
    </div>
  );
}
