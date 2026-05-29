import React from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowRight } from "react-icons/fi";
import { useCurrentChallenge } from "../../features/challenge/hooks/useCurrentChallenge";
import { useCurrentQuiz } from "../../features/quiz/hooks/useCurrentQuiz";

export default function ChallengeQuizCards() {
  const navigate = useNavigate();
  const { challenge } = useCurrentChallenge();
  const { quiz, userHistory } = useCurrentQuiz();

  return (
    <section className="px-4 mt-4 grid grid-cols-2 gap-3">
      <button
        onClick={() => navigate("/challenge")}
        className="rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 p-4 text-left text-white min-h-[128px] shadow-sm"
      >
        <p className="text-[10px] font-bold uppercase tracking-widest text-violet-200">Challenge</p>
        <p className="font-extrabold text-sm leading-snug mt-2 line-clamp-2">
          {challenge?.theme || "New challenge soon"}
        </p>
        <p className="text-xs text-violet-200 mt-1 line-clamp-2">
          {challenge?.prompt || "Weekly pet photo prompt"}
        </p>
        <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold">
          Open <FiArrowRight size={12} />
        </span>
      </button>

      <button
        onClick={() => navigate(userHistory ? "/quiz/leaderboard" : "/quiz/play")}
        className="rounded-2xl bg-white border border-indigo-100 p-4 text-left min-h-[128px] shadow-sm"
      >
        <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">Quiz</p>
        <p className="font-extrabold text-sm leading-snug mt-2 text-slate-800 line-clamp-2">
          {quiz?.title || "Weekly quiz soon"}
        </p>
        <p className="text-xs text-gray-400 mt-1 line-clamp-2">
          {userHistory ? `${userHistory.score} correct this week` : quiz?.topic || "Test your pet knowledge"}
        </p>
        <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-indigo-600">
          {userHistory ? "Leaderboard" : "Play"} <FiArrowRight size={12} />
        </span>
      </button>
    </section>
  );
}
