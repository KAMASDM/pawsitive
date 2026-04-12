import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useCurrentQuiz } from "../hooks/useCurrentQuiz";
import { useQuizLeaderboard } from "../hooks/useQuizLeaderboard";
import { auth } from "../../../firebase";
import { FiArrowLeft } from "react-icons/fi";

const RANK_BADGE = { 1: "🥇", 2: "🥈", 3: "🥉" };

const SkeletonRow = () => (
  <div className="flex items-center gap-3 px-4 py-3 animate-pulse">
    <div className="w-8 h-8 rounded-full bg-slate-100" />
    <div className="w-10 h-10 rounded-xl bg-slate-100" />
    <div className="flex-1 space-y-1.5">
      <div className="h-3 w-24 bg-slate-100 rounded" />
      <div className="h-2.5 w-16 bg-slate-100 rounded" />
    </div>
    <div className="h-5 w-12 bg-slate-100 rounded-full" />
  </div>
);

export default function QuizLeaderboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = auth.currentUser;
  const { quiz, loading: quizLoading } = useCurrentQuiz();
  const targetId = location.state?.quizId || quiz?.id;
  const { entries, loading } = useQuizLeaderboard(targetId);

  const starLabel = (score) => {
    if (score >= 5) return "★★★";
    if (score >= 3) return "★★";
    return "★";
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-sm border-b border-indigo-100 h-14 flex items-center px-4 gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-indigo-600">
          <FiArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <p className="font-bold text-slate-800 text-sm">Quiz Leaderboard</p>
          {quiz && <p className="text-xs text-indigo-500">{quiz.title}</p>}
        </div>
      </div>

      <div className="max-w-2xl mx-auto w-full px-4">
        {/* Desktop hero */}
        <div className="hidden md:flex items-center gap-4 bg-gradient-to-r from-indigo-600 to-violet-700 rounded-2xl p-6 mt-4 text-white">
          <div className="text-5xl">🧠</div>
          <div>
            <p className="font-black text-xl">Weekly Quiz Leaderboard</p>
            <p className="text-indigo-200 text-sm mt-0.5">
              {quiz ? `${quiz.title} · ${entries.length} participants` : "See how you rank!"}
            </p>
          </div>
        </div>

        {/* My rank (if on list) */}
        {user && !loading && (() => {
          const me = entries.find((e) => e.uid === user.uid);
          if (!me) return null;
          return (
            <div className="mt-4 bg-indigo-50 border border-indigo-200 rounded-2xl px-4 py-3 flex items-center gap-3">
              <span className="text-xl">{RANK_BADGE[me.rank] || `#${me.rank}`}</span>
              <div className="flex-1">
                <p className="font-bold text-indigo-800 text-sm">Your rank this week</p>
                <p className="text-xs text-indigo-500">{me.score}/{quiz?.questions?.length ?? 5} correct · {me.timeTaken}s</p>
              </div>
              <span className="text-amber-500 font-bold text-sm">{starLabel(me.score)}</span>
            </div>
          );
        })()}

        {/* List */}
        <div className="bg-white rounded-2xl mt-4 overflow-hidden border border-slate-100 shadow-sm">
          {loading || quizLoading ? (
            Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
          ) : entries.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-gray-400 text-sm">No scores yet. Be first!</p>
              <button
                onClick={() => navigate("/quiz/play")}
                className="mt-4 bg-indigo-600 text-white text-sm font-semibold px-5 py-2 rounded-full"
              >
                Take the Quiz
              </button>
            </div>
          ) : (
            entries.map((entry, i) => (
              <motion.div
                key={entry.uid}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`flex items-center gap-3 px-4 py-3 border-b border-slate-50 last:border-0 ${
                  entry.uid === user?.uid ? "bg-indigo-50" : i === 0 ? "bg-amber-50" : ""
                }`}
              >
                <div className="w-8 h-8 flex items-center justify-center text-lg flex-shrink-0">
                  {RANK_BADGE[entry.rank] || (
                    <span className="text-sm font-bold text-gray-400">#{entry.rank}</span>
                  )}
                </div>
                {entry.petPhotoUrl ? (
                  <img
                    src={entry.petPhotoUrl}
                    alt={entry.petName}
                    className="w-11 h-11 rounded-xl object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-xl bg-indigo-100 flex-shrink-0 flex items-center justify-center text-xl">🐾</div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 text-sm truncate">{entry.petName || entry.displayName}</p>
                  <p className="text-[11px] text-gray-400 truncate">{entry.displayName} · {entry.timeTaken}s</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-indigo-600 text-sm">{entry.score}/{quiz?.questions?.length ?? 5}</p>
                  <p className="text-amber-500 text-xs">{starLabel(entry.score)}</p>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
