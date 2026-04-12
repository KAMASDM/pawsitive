import { useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db, auth } from "../../../firebase";

/**
 * Returns the quizStats for the current user:
 * { currentStreak, longestStreak, totalXP, totalQuizzes, lastCompletedWeek }
 */
export function useQuizStats() {
  const user = auth.currentUser;
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const ref = doc(db, "users", user.uid, "quizStats", "stats");
    const unsub = onSnapshot(ref, (snap) => {
      setStats(snap.exists() ? snap.data() : {
        currentStreak: 0,
        longestStreak: 0,
        totalXP: 0,
        totalQuizzes: 0,
        lastCompletedWeek: null,
      });
      setLoading(false);
    });
    return unsub;
  }, [user]);

  return { stats, loading };
}
