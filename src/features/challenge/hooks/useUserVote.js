import { useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db, auth } from "../../../firebase";

/**
 * Returns { votedEntryId, loading } for the current user in a given challenge.
 * votedEntryId is null if the user has not yet voted.
 */
export function useUserVote(challengeId) {
  const [votedEntryId, setVotedEntryId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!challengeId || !uid) {
      setVotedEntryId(null);
      setLoading(false);
      setError(null);
      return;
    }

    const voteRef = doc(db, "challenges", challengeId, "votes", uid);
    setLoading(true);
    const unsub = onSnapshot(
      voteRef,
      (snap) => {
        setVotedEntryId(snap.exists() ? snap.data().entryId : null);
        setError(null);
        setLoading(false);
      },
      (err) => {
        console.error("useUserVote:", err);
        setVotedEntryId(null);
        setError(err);
        setLoading(false);
      }
    );

    return unsub;
  }, [challengeId]);

  return { votedEntryId, loading, error };
}
