import { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../../../firebase";

/**
 * Real-time list of entries for a challenge, ordered by voteCount DESC.
 */
export function useChallengeEntries(challengeId) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!challengeId) {
      setEntries([]);
      setLoading(false);
      setError(null);
      return;
    }

    const q = query(
      collection(db, "challenges", challengeId, "entries"),
      orderBy("voteCount", "desc")
    );

    setLoading(true);
    const unsub = onSnapshot(
      q,
      (snap) => {
        setEntries(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setError(null);
        setLoading(false);
      },
      (err) => {
        console.error("useChallengeEntries:", err);
        setEntries([]);
        setError(err);
        setLoading(false);
      }
    );

    return unsub;
  }, [challengeId]);

  return { entries, loading, error };
}
