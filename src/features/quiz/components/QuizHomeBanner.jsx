import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useCurrentQuiz } from "../hooks/useCurrentQuiz";
import { useQuizStats } from "../hooks/useQuizStats";
import { quizStars, STAR_LABELS } from "../../../utils/xpSystem";
import { FiArrowRight, FiAward } from "react-icons/fi";

// Skeleton
const Skeleton = ({ className }) => (
  <div className={`rounded-2xl bg-gradient-to-r from-slate-100 to-slate-200 animate-pulse ${className}`} />
);

// Stars display
function Stars({ count }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3].map((n) => (
        <span key={n} className={n <= count ? "text-amber-400" : "text-gray-200"}>★</span>
      ))}
    </div>
  );
}

export default function QuizHomeBanner() {
  const navigate = useNavigate();
  const { quiz, userHistory, loading } = useCurrentQuiz();
  const { stats } = useQuizStats();

  if (loading) {
    return (
      <div className="rounded-2xl overflow-hidden mx-0 space-y-3">
        <Skeleton className="h-40" />
        <Skeleton className="h-14" />
      </div>
    );
  }

  // No active quiz
  if (!quiz) {
    return (
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-5 border border-indigo-100 text-center">
        <span className="text-3xl">🧠</span>
        <p className="font-bold text-slate-700 mt-2">Quiz starts on Monday!</p>
        <p className="text-xs text-gray-400 mt-1">A new quiz drops every Monday at 9 AM IST</p>
      </div>
    );
  }

  const stars = userHistory ? quizStars(userHistory.score) : null;
  const label = stars ? STAR_LABELS[stars] : null;
  const alreadyDone = Boolean(userHistory);

  return (
    <div className="rounded-2xl overflow-hidden border border-violet-100 shadow-sm">
      {/* Gradient header */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-700 p-5 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10" />
        <div className="absolute -right-2 -bottom-4 w-16 h-16 rounded-full bg-white/5" />
        <div className="absolute left-1/2 top-0 w-40 h-40 rounded-full bg-white/5 hidden md:block" />

        <div className="relative md:flex md:items-start md:gap-5">
          {/* Icon — desktop only */}
          <div className="hidden md:flex w-14 h-14 rounded-2xl bg-white/15 items-center justify-center text-3xl flex-shrink-0">
            🧠
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest">Weekly Pet Quiz</p>
              {stats?.currentStreak > 0 && (
                <div className="flex items-center gap-1 bg-amber-400/20 px-2 py-0.5 rounded-full">
                  <span className="text-sm">🔥</span>
                  <span className="text-xs font-bold text-amber-300">{stats.currentStreak} week streak</span>
                </div>
              )}
            </div>
            <p className="font-bold text-white text-base">{quiz.title}</p>
            <p className="text-indigo-200 text-xs mt-1">{quiz.topic} · {quiz.difficulty || "medium"} difficulty</p>

            {/* Desktop stat pills */}
            <div className="hidden md:flex items-center gap-3 mt-3">
              {[
                { icon: "❓", text: `${quiz.questions?.length ?? 5} questions` },
                { icon: "⏱", text: "10s per question" },
                { icon: "⭐", text: "Up to 3 stars" },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-full">
                  <span className="text-xs">{icon}</span>
                  <span className="text-indigo-100 text-xs font-medium">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {alreadyDone && (
          <div className="mt-3 bg-white/15 rounded-xl p-3 flex items-center justify-between">
            <div>
              <p className="text-white font-bold text-sm">{userHistory.score}/{quiz.questions?.length ?? 5} correct</p>
              <Stars count={stars} />
            </div>
            <p className="text-indigo-200 text-xs font-semibold">{label}</p>
          </div>
        )}
      </div>

      {/* CTA row */}
      <div className="bg-white px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-700">5 questions · ~60 secs each</p>
          {stats?.totalQuizzes > 0 && (
            <p className="text-xs text-gray-400">{stats.totalQuizzes} quizzes completed · {stats.totalXP ?? 0} XP earned</p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate("/quiz/leaderboard")}
            className="w-9 h-9 rounded-full bg-violet-50 text-violet-500 flex items-center justify-center"
          >
            <FiAward size={15} />
          </button>
          <button
            onClick={() => navigate(alreadyDone ? "/quiz/leaderboard" : "/quiz/play")}
            className="flex items-center gap-1.5 bg-indigo-600 text-white text-sm font-bold px-4 py-2 rounded-full"
          >
            {alreadyDone ? "Leaderboard" : "Start Quiz"}
            <FiArrowRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
