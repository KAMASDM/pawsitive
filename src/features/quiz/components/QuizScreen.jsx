import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  doc,
  setDoc,
  writeBatch,
  serverTimestamp,
  increment,
  getDoc,
} from "firebase/firestore";
import { db, auth } from "../../../firebase";
import { useCurrentQuiz } from "../hooks/useCurrentQuiz";
import { quizXP, quizStars, STAR_LABELS } from "../../../utils/xpSystem";
import { getWeekId } from "../../../utils/getWeekId";
import QuizQuestion from "./QuizQuestion";
import QuizTimer from "./QuizTimer";
import { FiArrowRight } from "react-icons/fi";

const SECONDS_PER_QUESTION = 10;

// Screen state machine: idle | playing | finished
export default function QuizScreen() {
  const navigate = useNavigate();
  const { quiz, userHistory, weekId, loading } = useCurrentQuiz();
  const user = auth.currentUser;

  const [screen, setScreen] = useState("intro"); // intro | playing | finished
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState([]); // array of chosen indices (or -1 for timeout)
  const [timeLeft, setTimeLeft] = useState(SECONDS_PER_QUESTION);
  const [answered, setAnswered] = useState(null); // current Q answered index
  const [saving, setSaving] = useState(false);
  const startTimeRef = useRef(null);
  const timerRef = useRef(null);

  const questions = quiz?.questions ?? [];
  const total = questions.length;

  // Clear timer on unmount
  useEffect(() => () => clearInterval(timerRef.current), []);

  const nextQuestion = useCallback((chosenIndex) => {
    clearInterval(timerRef.current);
    const choice = chosenIndex ?? -1; // -1 = timed out
    setAnswers((prev) => [...prev, choice]);

    if (currentQ + 1 < total) {
      setCurrentQ((q) => q + 1);
      setAnswered(null);
      setTimeLeft(SECONDS_PER_QUESTION);
    } else {
      setScreen("finished");
    }
  }, [currentQ, total]);

  // Start timer when on playing screen
  useEffect(() => {
    if (screen !== "playing") return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          nextQuestion(null); // timed out
          return SECONDS_PER_QUESTION;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [screen, currentQ, nextQuestion]);

  const handleAnswer = (i) => {
    if (answered !== null) return;
    clearInterval(timerRef.current);
    setAnswered(i);
    // Auto-advance after showing feedback
    setTimeout(() => nextQuestion(i), 1200);
  };

  const score = answers.filter((a, i) => a === questions[i]?.correct).length;
  const timeTaken = startTimeRef.current ? Math.round((Date.now() - startTimeRef.current) / 1000) : 0;

  // Save results to Firestore once we reach "finished"
  useEffect(() => {
    if (screen !== "finished" || !user || !quiz) return;
    setSaving(true);
    const xpEarned = quizXP(score);
    const weekId = getWeekId();
    const saveData = async () => {
      const batch = writeBatch(db);

      // Save history for this week
      batch.set(doc(db, "users", user.uid, "quizHistory", weekId), {
        score,
        timeTaken,
        answers,
        completedAt: serverTimestamp(),
        xpEarned,
        quizId: quiz.id,
        quizTitle: quiz.title,
      });

      // Update streak + stats
      const statsRef = doc(db, "users", user.uid, "quizStats", "stats");
      const statsSnap = await getDoc(statsRef);
      const current = statsSnap.data() ?? {};
      const lastWeek = current.lastCompletedWeek;
      let newStreak = 1;
      if (lastWeek) {
        // Check if lastWeek is exactly the previous week
        const [ly, lw] = lastWeek.split("-W").map(Number);
        const [cy, cw] = weekId.split("-W").map(Number);
        const expectedPrev = cw === 1 ? `${cy - 1}-W52` : `${cy}-W${String(cw - 1).padStart(2, "0")}`;
        if (lastWeek === expectedPrev) {
          newStreak = (current.currentStreak ?? 0) + 1;
        }
      }

      batch.set(statsRef, {
        currentStreak: newStreak,
        longestStreak: Math.max(newStreak, current.longestStreak ?? 0),
        totalXP: increment(xpEarned),
        totalQuizzes: increment(1),
        lastCompletedWeek: weekId,
      }, { merge: true });

      // Write to leaderboard sub-collection
      let petName = user.displayName || "Pawppy User";
      let petPhotoUrl = user.photoURL || "";
      try {
        const { getDatabase, ref, get } = await import("firebase/database");
        const rtdb = getDatabase();
        const pSnap = await get(ref(rtdb, `userPets/${user.uid}`));
        if (pSnap.exists()) {
          const first = Object.values(pSnap.val())[0];
          petName = first.name || petName;
          petPhotoUrl = first.photos?.[0] || petPhotoUrl;
        }
      } catch { /* non-fatal */ }

      batch.set(doc(db, "weeklyQuiz", quiz.id, "leaderboard", user.uid), {
        displayName: user.displayName || "Pawppy User",
        petName,
        petPhotoUrl,
        score,
        timeTaken,
        xpEarned,
        completedAt: serverTimestamp(),
      });

      await batch.commit();
    };

    saveData().finally(() => {
      setSaving(false);
      navigate("/quiz/results", {
        state: { score, total, timeTaken, quizId: quiz.id, quizTitle: quiz.title, answers },
      });
    });
  }, [screen]);

  // ---- SCREENS ----

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 rounded-full border-4 border-indigo-200 border-t-indigo-500 animate-spin" />
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-6 text-center">
        <span className="text-5xl mb-4">🧠</span>
        <h2 className="text-lg font-bold text-slate-800">No active quiz</h2>
        <p className="text-sm text-gray-500 mt-1">The quiz drops every Monday at 9 AM IST. Come back soon!</p>
        <button onClick={() => navigate(-1)} className="mt-6 text-indigo-600 font-semibold text-sm">← Go back</button>
      </div>
    );
  }

  if (userHistory && screen !== "finished") {
    const s = quizStars(userHistory.score);
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-6 text-center">
        <span className="text-5xl mb-4">✅</span>
        <h2 className="text-xl font-bold text-slate-800">You've completed this week's quiz!</h2>
        <p className="text-sm text-gray-500 mt-1">{userHistory.score}/{total} correct · {STAR_LABELS[s]}</p>
        <div className="flex gap-0.5 justify-center mt-2">{[1,2,3].map(n => <span key={n} className={n <= s ? "text-amber-400 text-2xl" : "text-gray-200 text-2xl"}>★</span>)}</div>
        <button
          onClick={() => navigate("/quiz/leaderboard")}
          className="mt-6 bg-indigo-600 text-white font-semibold text-sm px-6 py-3 rounded-full"
        >
          View Leaderboard
        </button>
      </div>
    );
  }

  // INTRO
  if (screen === "intro") {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-sm border border-slate-100 p-8 text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-4xl mb-5 shadow-lg shadow-indigo-200 mx-auto"
            >
              🧠
            </motion.div>
            <h1 className="text-2xl font-black text-slate-800">{quiz.title}</h1>
            <p className="text-gray-500 text-sm mt-1">{quiz.topic} · {quiz.difficulty || "medium"} difficulty</p>
            <div className="mt-6 grid grid-cols-3 gap-3 w-full max-w-xs mx-auto">
              {[
                { icon: "❓", label: `${total} Questions` },
                { icon: "⏱", label: `${SECONDS_PER_QUESTION}s each` },
                { icon: "⭐", label: "Up to 3 stars" },
              ].map(({ icon, label }) => (
                <div key={label} className="bg-slate-50 rounded-2xl p-3 border border-slate-100 text-center">
                  <p className="text-2xl mb-1">{icon}</p>
                  <p className="text-xs font-semibold text-gray-500">{label}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 text-left bg-indigo-50 rounded-2xl p-4">
              <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-2">Tips</p>
              {[
                "Read each question carefully — you have 10 seconds",
                "All 5 questions are about pet care & animal facts",
                "Score 4+ to earn 3 stars ⭐⭐⭐",
              ].map((tip) => (
                <p key={tip} className="text-xs text-indigo-700 mb-1.5 last:mb-0">• {tip}</p>
              ))}
            </div>
            <button
              onClick={() => {
                startTimeRef.current = Date.now();
                setScreen("playing");
              }}
              className="mt-6 w-full bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
            >
              Start Quiz <FiArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // PLAYING
  if (screen === "playing") {
    const q = questions[currentQ];
    return (
      <div className="min-h-screen bg-slate-50 pb-10">
        {/* Progress bar */}
        <div className="h-1.5 bg-indigo-100">
          <motion.div
            className="h-1.5 bg-indigo-500 rounded-r-full"
            animate={{ width: `${((currentQ) / total) * 100}%` }}
          />
        </div>

        <div className="max-w-lg mx-auto">
          {/* Header */}
          <div className="px-4 pt-4 pb-2 flex items-center gap-3">
            <div className="flex-1">
              <p className="text-xs text-gray-400 font-semibold">Question {currentQ + 1} of {total}</p>
              <p className="text-sm font-bold text-slate-700 truncate">{quiz.title}</p>
            </div>
            <QuizTimer remaining={timeLeft} total={SECONDS_PER_QUESTION} />
          </div>

          {/* Question */}
          <div className="px-4 pt-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQ}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.22 }}
              >
                <QuizQuestion
                  question={q}
                  answered={answered}
                  onAnswer={handleAnswer}
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    );
  }

  // FINISHED — navigate in effect, not during render
  if (screen === "finished") {
    return null; // useEffect above will navigate
  }

  return null;
}
