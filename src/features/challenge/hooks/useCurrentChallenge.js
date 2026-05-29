import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
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

function isCurrentChallenge(challenge, now) {
  const start = toDate(challenge.startTime);
  const end = toDate(challenge.endTime);

  if (end) return end >= now;
  if (!start) return false;

  const maxAgeMs = 8 * 24 * 60 * 60 * 1000;
  return now.getTime() - start.getTime() <= maxAgeMs;
}

/**
 * Returns the currently active challenge (isActive === true).
 * Ignores stale docs that were accidentally left with isActive === true.
 */
export function useCurrentChallenge() {
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const q = query(
      collection(db, "challenges"),
      where("isActive", "==", true)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const now = new Date();
        const current = snap.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((candidate) => isCurrentChallenge(candidate, now))
          .sort((a, b) => {
            const aStart = toDate(a.startTime)?.getTime() || 0;
            const bStart = toDate(b.startTime)?.getTime() || 0;
            return bStart - aStart;
          })[0];

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
