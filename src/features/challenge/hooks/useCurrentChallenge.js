import { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
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
 * seed-year.js seeds all 52 challenges with isActive: false and relies on a
 * backend activator that never ran, so we ignore isActive and instead pick
 * the most-recently-started challenge whose endTime hasn't passed yet.
 */
export function useCurrentChallenge() {
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const q = query(
      collection(db, "challenges"),
      orderBy("startTime", "desc"),
      limit(20)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const now = new Date();
        const current = snap.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .find((c) => {
            const start = toDate(c.startTime);
            const end = toDate(c.endTime);
            if (!start || start > now) return false;
            if (end && end < now) return false;
            return true;
          });

        setChallenge(current || null);
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
