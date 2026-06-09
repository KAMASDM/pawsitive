import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../../firebase";

function toDate(value) {
  if (!value) return null;
  if (typeof value.toDate === "function") return value.toDate();
  if (value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
}

/**
 * Returns the current challenge by time window.
 * seed-year.js seeds all 52 challenges with isActive: false so we ignore that
 * flag and instead query: startTime <= now, ordered desc, limit 1.
 * The single result is the most-recently-started challenge; we then check
 * client-side that its endTime hasn't passed.
 */
export function useCurrentChallenge() {
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const q = query(
      collection(db, "challenges"),
      where("startTime", "<=", Timestamp.now()),
      orderBy("startTime", "desc"),
      limit(1)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        if (snap.empty) {
          setChallenge(null);
          setLoading(false);
          return;
        }
        const doc = snap.docs[0];
        const data = { id: doc.id, ...doc.data() };
        const end = toDate(data.endTime);
        // Discard if the window has already closed
        setChallenge(end && end < new Date() ? null : data);
        setLoading(false);
      },
      (err) => {
        console.error("useCurrentChallenge:", err);
        setError(err);
        setLoading(false);
      }
    );

    return unsub;
  }, []);

  return { challenge, loading, error };
}
