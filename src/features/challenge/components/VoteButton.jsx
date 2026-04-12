import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  doc,
  writeBatch,
  increment,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import { db, auth } from "../../../firebase";
import { FiHeart, FiShare2 } from "react-icons/fi";
import { FaHeart } from "react-icons/fa";
import { XP } from "../../../utils/xpSystem";

export default function VoteButton({ challengeId, entry, votedEntryId, onShareClick }) {
  const user = auth.currentUser;
  const isVoted = votedEntryId === entry.id;
  const hasVotedElsewhere = votedEntryId !== null && !isVoted;
  const [optimisticCount, setOptimisticCount] = useState(entry.voteCount || 0);
  const [optimisticVoted, setOptimisticVoted] = useState(isVoted);
  const [loading, setLoading] = useState(false);

  const handleVote = async () => {
    if (!user || loading || hasVotedElsewhere || optimisticVoted) return;
    setLoading(true);

    // Optimistic update
    setOptimisticCount((v) => v + 1);
    setOptimisticVoted(true);

    try {
      const batch = writeBatch(db);
      // Record vote
      batch.set(doc(db, "challenges", challengeId, "votes", user.uid), {
        entryId: entry.id,
        votedAt: serverTimestamp(),
      });
      // Increment voteCount on entry
      batch.update(doc(db, "challenges", challengeId, "entries", entry.id), {
        voteCount: increment(1),
      });
      // Award XP to entry owner (best-effort — don't block)
      batch.set(
        doc(db, "users", entry.uid, "quizStats", "stats"),
        { totalXP: increment(XP.CHALLENGE_VOTE_RECEIVED) },
        { merge: true }
      );
      await batch.commit();
    } catch (err) {
      console.error("Vote failed:", err);
      // Roll back
      setOptimisticCount((v) => v - 1);
      setOptimisticVoted(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <motion.button
        whileTap={{ scale: 0.88 }}
        onClick={handleVote}
        disabled={loading || hasVotedElsewhere || optimisticVoted}
        aria-label={`Vote for ${entry.petName}, currently ${optimisticCount} votes`}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${
          optimisticVoted
            ? "bg-red-50 text-red-500"
            : hasVotedElsewhere
            ? "bg-gray-50 text-gray-300 cursor-not-allowed"
            : "bg-violet-50 text-violet-600 hover:bg-violet-100"
        }`}
      >
        {optimisticVoted ? <FaHeart size={14} /> : <FiHeart size={14} />}
        {optimisticCount}
      </motion.button>
      <button
        onClick={onShareClick}
        aria-label={`Share ${entry.petName}'s entry`}
        className="w-8 h-8 rounded-full bg-slate-50 text-gray-400 hover:text-violet-600 hover:bg-violet-50 transition-colors flex items-center justify-center"
      >
        <FiShare2 size={14} />
      </button>
    </div>
  );
}
