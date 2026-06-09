import { useState, useEffect } from "react";
import {
  doc,
  onSnapshot,
  collection,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import { db, auth } from "../../../firebase";
import { getWeekId } from "../../../utils/getWeekId";

function toDate(value) {
  if (!value) return null;
  if (typeof value.toDate === "function") return value.toDate();
  if (value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

/**
 * Returns:
 *  quiz         — the active quiz document (with .id, .questions[], .title, etc.)
 *  userHistory  — this week's user history doc (score, completedAt, streak, etc.) or null
 *  loading      — true until BOTH the quiz AND the user's history have resolved
 *                 (prevents the intro screen flashing before we know they already completed it)
 *
 * seed-year.js seeds all 52 quizzes with isActive: false, so we find the current
 * quiz by matching weekId first, falling back to time-window if weekId doesn't match.
 */
export function useCurrentQuiz() {
  const user = auth.currentUser;
  const weekId = getWeekId();
  const [quiz, setQuiz] = useState(null);
  const [userHistory, setUserHistory] = useState(null);
  const [quizLoading, setQuizLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);

  // Listen for current quiz by weekId (direct match on seed-year's stored weekId field)
  useEffect(() => {
    const q = query(
      collection(db, "weeklyQuiz"),
      where("weekId", "==", weekId),
      limit(1)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        if (!snap.empty) {
          setQuiz({ id: snap.docs[0].id, ...snap.docs[0].data() });
          setQuizLoading(false);
          return;
        }
        // Fallback: find by time window (for quizzes seeded without a weekId field)
        const fallback = query(
          collection(db, "weeklyQuiz"),
          orderBy("startTime", "desc"),
          limit(10)
        );
        onSnapshot(
          fallback,
          (fSnap) => {
            const now = new Date();
            const current = fSnap.docs
              .map((d) => ({ id: d.id, ...d.data() }))
              .find((c) => {
                const start = toDate(c.startTime);
                const end = toDate(c.endTime);
                if (!start || start > now) return false;
                if (end && end < now) return false;
                return true;
              });
            setQuiz(current || null);
            setQuizLoading(false);
          },
          (err) => {
            console.warn("[useCurrentQuiz] fallback error:", err.code);
            setQuiz(null);
            setQuizLoading(false);
          }
        );
      },
      (err) => {
        console.warn("[useCurrentQuiz] snapshot error:", err.code);
        setQuiz(null);
        setQuizLoading(false);
      }
    );
    return unsub;
  }, [weekId]);

  // Listen for user's history for this week
  useEffect(() => {
    if (!user) {
      // Not logged in — no history to wait for
      setHistoryLoading(false);
      return;
    }
    const ref = doc(db, "users", user.uid, "quizHistory", weekId);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        setUserHistory(snap.exists() ? snap.data() : null);
        setHistoryLoading(false);
      },
      () => {
        setUserHistory(null);
        setHistoryLoading(false);
      }
    );
    return unsub;
  }, [user, weekId]);

  // Both sources must resolve before the screen decides what to show.
  // This prevents the intro screen flashing before "already completed" is detected.
  const loading = quizLoading || historyLoading;

  return { quiz, userHistory, weekId, loading };
}
