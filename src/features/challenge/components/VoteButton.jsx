import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  doc,
  writeBatch,
  increment,
  serverTimestamp,
} from "firebase/firestore";
import { db, auth } from "../../../firebase";
import { FiHeart, FiShare2 } from "react-icons/fi";
import { FaHeart } from "react-icons/fa";

export default function VoteButton({ challengeId, entry, votedEntryId, onShareClick }) {
  const user = auth.currentUser;
  const isVoted = votedEntryId === entry.id;
  const hasVotedElsewhere = votedEntryId !== null && !isVoted;
  const isOwnEntry = user?.uid === entry.uid;
  const [optimisticCount, setOptimisticCount] = useState(entry.voteCount || 0);
  const [optimisticVoted, setOptimisticVoted] = useState(isVoted);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setOptimisticCount(entry.voteCount || 0);
    setOptimisticVoted(isVoted);
  }, [entry.voteCount, isVoted]);

  const handleVote = async () => {
    if (!user || loading || hasVotedElsewhere || optimisticVoted || isOwnEntry) return;
    setLoading(true);
    setError("");

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
      await batch.commit();
    } catch (err) {
      console.error("Vote failed:", err);
      // Roll back
      setOptimisticCount((v) => v - 1);
      setOptimisticVoted(false);
      setError("Vote failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <motion.button
        whileTap={{ scale: 0.88 }}
        onClick={handleVote}
        disabled={loading || hasVotedElsewhere || optimisticVoted || isOwnEntry}
        aria-label={`Vote for ${entry.petName}, currently ${optimisticCount} votes`}
        title={isOwnEntry ? "You cannot vote for your own entry" : error || undefined}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${
          optimisticVoted
            ? "bg-red-50 text-red-500"
            : hasVotedElsewhere || isOwnEntry
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
