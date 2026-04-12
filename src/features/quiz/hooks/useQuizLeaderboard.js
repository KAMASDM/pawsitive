import { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../../../firebase";

/**
 * Returns top-10 leaderboard for the given quizId in real-time.
 * Each entry: { uid, displayName, petName, petPhotoUrl, score, timeTaken, rank }
 */
export function useQuizLeaderboard(quizId) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!quizId) return;
    const q = query(
      collection(db, "weeklyQuiz", quizId, "leaderboard"),
      orderBy("score", "desc"),
      orderBy("timeTaken", "asc"),
      limit(10)
    );
    const unsub = onSnapshot(q, (snap) => {
      setEntries(
        snap.docs.map((d, i) => ({ ...d.data(), uid: d.id, rank: i + 1 }))
      );
      setLoading(false);
    });
    return unsub;
  }, [quizId]);

  return { entries, loading };
}
