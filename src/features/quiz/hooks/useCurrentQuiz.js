import { useState, useEffect } from "react";
import { doc, onSnapshot, collection, query, where, limit } from "firebase/firestore";
import { db, auth } from "../../../firebase";
import { getWeekId } from "../../../utils/getWeekId";

/**
 * Returns:
 *  quiz         — the active quiz document (with .id, .questions[], .title, etc.)
 *  userHistory  — this week's user history doc (score, completedAt, streak, etc.) or null
 *  loading      — true until BOTH the quiz AND the user's history have resolved
 *                 (prevents the intro screen flashing before we know they already completed it)
 */
export function useCurrentQuiz() {
  const user = auth.currentUser;
  const weekId = getWeekId();
  const [quiz, setQuiz] = useState(null);
  const [userHistory, setUserHistory] = useState(null);
  const [quizLoading, setQuizLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);

  // Listen for active quiz
  useEffect(() => {
    const q = query(
      collection(db, "weeklyQuiz"),
      where("isActive", "==", true),
      limit(1)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setQuiz(snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() });
        setQuizLoading(false);
      },
      (err) => {
        console.warn("[useCurrentQuiz] snapshot error:", err.code);
        setQuiz(null);
        setQuizLoading(false);
      }
    );
    return unsub;
  }, []);

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
