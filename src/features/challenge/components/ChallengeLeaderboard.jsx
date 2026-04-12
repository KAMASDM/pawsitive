import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../../../firebase";
import { useCurrentChallenge } from "../hooks/useCurrentChallenge";
import { FiArrowLeft } from "react-icons/fi";

const RANK_BADGE = { 1: "🥇", 2: "🥈", 3: "🥉" };

// Skeleton row
const SkeletonRow = () => (
  <div className="flex items-center gap-3 px-4 py-3 animate-pulse">
    <div className="w-8 h-8 rounded-full bg-slate-100" />
    <div className="w-10 h-10 rounded-xl bg-slate-100" />
    <div className="flex-1 space-y-1.5">
      <div className="h-3 w-28 bg-slate-100 rounded" />
      <div className="h-2.5 w-16 bg-slate-100 rounded" />
    </div>
    <div className="h-5 w-10 bg-slate-100 rounded-full" />
  </div>
);

export default function ChallengeLeaderboard() {
  const navigate = useNavigate();
  const { challenge, loading: challengeLoading } = useCurrentChallenge();
  const [tab, setTab] = useState("thisWeek");
  const [entries, setEntries] = useState([]);
  const [champions, setChampions] = useState([]);
  const [loading, setLoading] = useState(true);

  // This week — real-time
  useEffect(() => {
    if (!challenge?.id) return;
    const q = query(
      collection(db, "challenges", challenge.id, "entries"),
      orderBy("voteCount", "desc"),
      limit(10)
    );
    const unsub = onSnapshot(q, (snap) => {
      setEntries(snap.docs.map((d, i) => ({ ...d.data(), id: d.id, rank: i + 1 })));
      setLoading(false);
    });
    return unsub;
  }, [challenge?.id]);

  // All-time champions
  useEffect(() => {
    if (tab !== "allTime") return;
    setLoading(true);
    getDocs(
      query(
        collection(db, "challenges"),
        where("winnerId", "!=", null),
        orderBy("winnerId"),
        orderBy("startTime", "desc"),
        limit(10)
      )
    ).then(async (snap) => {
      const results = [];
      for (const d of snap.docs) {
        const data = d.data();
        if (!data.winnerId) continue;
        const eSnap = await getDocs(
          query(
            collection(db, "challenges", d.id, "entries"),
            where("id", "==", data.winnerId),
            limit(1)
          )
        );
        if (!eSnap.empty) {
          results.push({
            ...eSnap.docs[0].data(),
            id: eSnap.docs[0].id,
            challengeTheme: data.theme,
            weekNumber: data.weekNumber,
          });
        }
      }
      setChampions(results);
      setLoading(false);
    });
  }, [tab]);

  const displayList = tab === "thisWeek" ? entries : champions;

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-sm border-b border-violet-100 h-14 flex items-center px-4 gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-violet-600">
          <FiArrowLeft size={20} />
        </button>
        <p className="font-bold text-slate-800 flex-1">Challenge Leaderboard</p>
      </div>

      <div className="max-w-2xl mx-auto w-full px-4">
        {/* Desktop hero banner */}
        <div className="hidden md:flex items-center gap-4 bg-gradient-to-r from-violet-600 to-purple-700 rounded-2xl p-6 mt-4 text-white">
          <div className="text-5xl">🏆</div>
          <div>
            <p className="font-black text-xl">Challenge Leaderboard</p>
            <p className="text-violet-200 text-sm mt-0.5">
              {tab === "thisWeek"
                ? `${entries.length} entries competing this week — vote for your favourite!`
                : "All-time challenge champions"}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 pt-4 pb-2">
          {[
            { id: "thisWeek", label: "This Week 📅" },
            { id: "allTime",  label: "All-Time Champions 🏆" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setLoading(true); }}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${
                tab === t.id
                  ? "bg-violet-600 text-white"
                  : "bg-white text-gray-500 border border-slate-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
          {(loading || challengeLoading) ? (
            Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
          ) : displayList.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-gray-400 text-sm">No entries yet this week.</p>
            </div>
          ) : (
            displayList.map((entry, i) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`flex items-center gap-3 px-4 py-3 border-b border-slate-50 last:border-0 ${
                  i === 0 ? "bg-amber-50" : ""
                }`}
              >
                {/* Rank */}
                <div className="w-8 h-8 flex items-center justify-center text-lg flex-shrink-0">
                  {RANK_BADGE[entry.rank || i + 1] || (
                    <span className="text-sm font-bold text-gray-400">#{entry.rank || i + 1}</span>
                  )}
                </div>
                {/* Photo */}
                <img
                  src={entry.petPhotoUrl}
                  alt={entry.petName}
                  className="w-11 h-11 rounded-xl object-cover flex-shrink-0"
                />
                {/* Name */}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 text-sm truncate">{entry.petName}</p>
                  <p className="text-[11px] text-gray-400 truncate">
                    {tab === "allTime"
                      ? `${entry.challengeTheme} · Week #${entry.weekNumber}`
                      : entry.ownerDisplayName}
                  </p>
                </div>
                {/* Votes / Champion badge */}
                <div className="flex-shrink-0">
                  {tab === "allTime" ? (
                    <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">Champion</span>
                  ) : (
                    <span className="text-sm font-bold text-violet-600">{entry.voteCount || 0} ❤️</span>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
