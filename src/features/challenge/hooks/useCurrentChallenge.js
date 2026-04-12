import { useState, useEffect } from "react";
import { collection, query, where, limit, onSnapshot } from "firebase/firestore";
import { db } from "../../../firebase";

/**
 * Returns the currently active challenge (isActive === true).
 * Falls back to the most recent past challenge if none is active.
 */
export function useCurrentChallenge() {
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const q = query(
      collection(db, "challenges"),
      where("isActive", "==", true),
      limit(1)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        if (!snap.empty) {
          const doc = snap.docs[0];
          setChallenge({ id: doc.id, ...doc.data() });
        } else {
          setChallenge(null);
        }
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
