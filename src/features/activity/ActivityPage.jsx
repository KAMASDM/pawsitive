import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db, auth } from "../../firebase";
import { useQuizStats } from "../quiz/hooks/useQuizStats";
import { FiArrowLeft, FiAward, FiZap, FiTrendingUp, FiCalendar } from "react-icons/fi";
import { HiOutlineLightBulb } from "react-icons/hi";

// ── Star rating helper ──────────────────────────────────────────────────────
function stars(score, total) {
  const pct = score / total;
  if (pct >= 0.8) return 3;
  if (pct >= 0.5) return 2;
  return 1;
}

function StarRow({ count }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3].map((i) => (
        <span key={i} className={`text-sm ${i <= count ? "text-amber-400" : "text-gray-200"}`}>★</span>
      ))}
    </div>
  );
}

// ── Format date ──────────────────────────────────────────────────────────────
function fmtDate(val) {
  if (!val) return "";
  const d = val.toDate ? val.toDate() : new Date(val);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

// ── Stat tile ────────────────────────────────────────────────────────────────
function StatTile({ icon, value, label, color }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-3 px-2 gap-1"
      style={{ minWidth: 0 }}>
      <span className={`text-xl ${color}`}>{icon}</span>
      <span className="text-slate-800 font-black text-lg leading-none">{value}</span>
      <span className="text-gray-500 text-[10px] tracking-wide uppercase text-center">{label}</span>
    </div>
  );
}

const TABS = ["All", "Challenges", "Quizzes"];

export default function ActivityPage() {
  const navigate = useNavigate();
  const { stats } = useQuizStats();
  const [tab, setTab] = useState("All");
  const [quizHistory, setQuizHistory] = useState([]);
  const [challengeHistory, setChallengeHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const uid = auth.currentUser?.uid;

  useEffect(() => {
    if (!uid) { setLoading(false); return; }

    Promise.all([
      // Quiz history
      getDocs(collection(db, "users", uid, "quizHistory")).then((snap) =>
        snap.docs.map((d) => ({ id: d.id, type: "quiz", ...d.data() }))
      ).catch(() => []),

      // Challenge history
      getDocs(collection(db, "users", uid, "challengeHistory")).then((snap) =>
        snap.docs.map((d) => ({ id: d.id, type: "challenge", ...d.data() }))
      ).catch(() => []),
    ]).then(([quiz, challenge]) => {
      setQuizHistory(quiz);
      setChallengeHistory(challenge);
      setLoading(false);
    });
  }, [uid]);

  // Merge + sort by date descending
  const allItems = [
    ...quizHistory.map((q) => ({ ...q, sortDate: q.completedAt || q.id })),
    ...challengeHistory.map((c) => ({ ...c, sortDate: c.joinedAt })),
  ].sort((a, b) => (a.sortDate < b.sortDate ? 1 : -1));

  const displayed = tab === "All" ? allItems
    : tab === "Challenges" ? allItems.filter((i) => i.type === "challenge")
    : allItems.filter((i) => i.type === "quiz");

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-violet-100 h-14 flex items-center px-4 gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-violet-600">
          <FiArrowLeft size={20} />
        </button>
        <span className="flex-1 font-bold text-slate-800 text-base">My Activity</span>
      </div>

      {/* Stats bar */}
      <div className="bg-white mx-4 mt-4 rounded-2xl shadow-sm border border-violet-50 overflow-hidden">
        <div className="flex divide-x divide-gray-100">
          <StatTile icon="🏆" value={challengeHistory.length} label="Challenges" color="text-violet-500" />
          <StatTile icon="🧠" value={quizHistory.length} label="Quizzes" color="text-indigo-500" />
          <StatTile icon="⚡" value={stats?.totalXP ?? 0} label="Total XP" color="text-amber-500" />
          <StatTile icon="🔥" value={stats?.currentStreak ?? 0} label="Streak" color="text-orange-500" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-4 mt-4">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
              tab === t
                ? "bg-violet-600 text-white shadow-sm"
                : "bg-white text-gray-500 border border-gray-200"
            }`}>
            {t}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="px-4 mt-4 flex flex-col gap-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-gray-100 animate-pulse" />
          ))
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
            <span className="text-5xl">🐾</span>
            <p className="text-slate-700 font-bold text-base">Nothing here yet</p>
            <p className="text-gray-500 text-sm">Join a challenge or take a quiz to see your activity!</p>
            <div className="flex gap-3 mt-2">
              <button onClick={() => navigate("/challenge")}
                className="text-sm font-semibold text-violet-600 bg-violet-50 px-4 py-2 rounded-full">
                🏆 Challenge
              </button>
              <button onClick={() => navigate("/quiz")}
                className="text-sm font-semibold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-full">
                💡 Quiz
              </button>
            </div>
          </div>
        ) : (
          <AnimatePresence>
            {displayed.map((item, idx) => (
              item.type === "quiz"
                ? <QuizCard key={item.id} item={item} delay={idx * 0.04} navigate={navigate} />
                : <ChallengeCard key={item.id} item={item} delay={idx * 0.04} navigate={navigate} />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

// ── Quiz history card ────────────────────────────────────────────────────────
function QuizCard({ item, delay, navigate }) {
  const total = item.totalQuestions || 5;
  const correct = item.correctAnswers ?? item.score ?? 0;
  const pct = Math.round((correct / total) * 100);
  const s = stars(correct, total);
  const xp = item.xpEarned ?? 0;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white rounded-2xl border border-indigo-50 shadow-sm overflow-hidden"
      onClick={() => navigate("/quiz/leaderboard")}>
      <div className="flex items-center gap-4 p-4">
        {/* Left: icon */}
        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)" }}>
          <HiOutlineLightBulb size={22} className="text-white" />
        </div>

        {/* Middle: info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-bold text-slate-800 text-sm truncate">{item.title || `Week ${item.id}`}</p>
            <StarRow count={s} />
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-xs text-gray-500">{correct}/{total} correct</span>
            <span className="text-xs text-gray-400">·</span>
            <span className="text-xs text-gray-500">{fmtDate(item.completedAt)}</span>
          </div>
        </div>

        {/* Right: score + xp */}
        <div className="flex flex-col items-end flex-shrink-0">
          <span className={`text-lg font-black ${pct >= 80 ? "text-emerald-500" : pct >= 50 ? "text-amber-500" : "text-red-400"}`}>
            {pct}%
          </span>
          {xp > 0 && (
            <span className="text-[11px] font-semibold text-amber-500 flex items-center gap-0.5">
              +{xp} <FiZap size={10} />
            </span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-gray-100">
        <div className={`h-full rounded-full transition-all ${pct >= 80 ? "bg-emerald-400" : pct >= 50 ? "bg-amber-400" : "bg-red-400"}`}
          style={{ width: `${pct}%` }} />
      </div>
    </motion.div>
  );
}

// ── Challenge history card ───────────────────────────────────────────────────
function ChallengeCard({ item, delay, navigate }) {
  const votes = item.voteCount || 0;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white rounded-2xl border border-violet-50 shadow-sm overflow-hidden"
      onClick={() => navigate("/challenge/feed")}>
      <div className="flex items-center gap-4 p-4">
        {/* Photo */}
        {item.petPhotoUrl ? (
          <img src={item.petPhotoUrl} alt={item.petName}
            className="w-12 h-12 rounded-xl object-cover flex-shrink-0 border border-violet-100" />
        ) : (
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)" }}>
            <FiAward size={22} className="text-white" />
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-800 text-sm truncate">{item.theme || "Challenge"}</p>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-xs text-violet-500 font-semibold">{votes} votes</span>
            <span className="text-xs text-gray-400">·</span>
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <FiCalendar size={10} /> {fmtDate(item.joinedAt)}
            </span>
          </div>
          {item.petName && (
            <p className="text-xs text-gray-400 truncate mt-0.5">🐾 {item.petName}</p>
          )}
        </div>

        {/* Badge */}
        <div className="flex-shrink-0">
          {item.isWinner ? (
            <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full">🏆 Winner</span>
          ) : (
            <span className="bg-violet-50 text-violet-600 text-xs font-semibold px-2.5 py-1 rounded-full">Entered</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
