import { useState, useEffect } from "react";
import {
  doc,
  onSnapshot,
  collection,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from "firebase/firestore";
import { db, auth } from "../../../firebase";
import { getWeekId } from "../../../utils/getWeekId";

/**
 * Returns:
 *  quiz         — the active quiz document (with .id, .questions[], .title, etc.)
 *  userHistory  — this week's user history doc (score, completedAt, streak, etc.) or null
 *  loading      — true until BOTH the quiz AND the user's history have resolved
 *
 * seed-year.js uses its own 1-52 week numbering (not ISO weeks), so weekId
 * stored in Firestore ("2026-W09") won't match getWeekId() ("2026-W24").
 * We find the current quiz by time window instead: startTime <= now, desc, limit 1.
 */
export function useCurrentQuiz() {
  const user = auth.currentUser;
  const weekId = getWeekId();
  const [quiz, setQuiz] = useState(null);
  const [userHistory, setUserHistory] = useState(null);
  const [quizLoading, setQuizLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "weeklyQuiz"),
      where("startTime", "<=", Timestamp.now()),
      orderBy("startTime", "desc"),
      limit(1)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        if (snap.empty) { setQuiz(null); setQuizLoading(false); return; }
        const d = snap.docs[0];
        const data = { id: d.id, ...d.data() };
        const end = data.endTime?.toDate?.() ?? null;
        setQuiz(end && end < new Date() ? null : data);
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

  // Listen for user's history — use the weekId stored on the quiz doc itself,
  // because seed-year.js uses its own numbering ("2026-W09") not ISO weeks.
  const quizWeekId = quiz?.weekId ?? weekId;
  useEffect(() => {
    if (!user) {
      setHistoryLoading(false);
      return;
    }
    const ref = doc(db, "users", user.uid, "quizHistory", quizWeekId);
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
  }, [user, quizWeekId]);

  // Both sources must resolve before the screen decides what to show.
  // This prevents the intro screen flashing before "already completed" is detected.
  const loading = quizLoading || historyLoading;

  return { quiz, userHistory, weekId: quizWeekId, loading };
}
