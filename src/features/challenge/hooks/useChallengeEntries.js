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

  useEffect(() => {
    if (!challengeId) { setLoading(false); return; }

    const q = query(
      collection(db, "challenges", challengeId, "entries"),
      orderBy("voteCount", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      setEntries(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    return unsub;
  }, [challengeId]);

  return { entries, loading };
}
