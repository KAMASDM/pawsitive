import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import VoteButton from "./VoteButton";
import ChallengeShareCard from "./ChallengeShareCard";

export default function EntryCard({ entry, challengeId, votedEntryId, challengeTheme }) {
  const [showShare, setShowShare] = useState(false);

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100"
      >
        {/* Photo */}
        <div className="relative">
          <img
            src={entry.petPhotoUrl}
            alt={entry.petName}
            crossOrigin="anonymous"
            className="w-full object-cover"
            style={{ maxHeight: 240, minHeight: 160 }}
            loading="lazy"
          />
          {/* Rank badge if top 3 */}
          {entry.rank && entry.rank <= 3 && (
            <div className="absolute top-2 left-2 w-8 h-8 rounded-full bg-white shadow flex items-center justify-center text-base">
              {entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : "🥉"}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="px-3 pt-3 pb-3">
          <div className="flex items-center justify-between mb-1.5">
            <div>
              <p className="font-bold text-slate-800 text-sm">{entry.petName}</p>
              <p className="text-[11px] text-gray-400">{entry.ownerDisplayName}</p>
            </div>
            <VoteButton
              challengeId={challengeId}
              entry={entry}
              votedEntryId={votedEntryId}
              onShareClick={() => setShowShare(true)}
            />
          </div>
          {entry.caption && (
            <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">{entry.caption}</p>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {showShare && (
          <ChallengeShareCard
            entry={entry}
            challengeTheme={challengeTheme}
            onClose={() => setShowShare(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
