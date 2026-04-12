import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useCurrentChallenge } from "../hooks/useCurrentChallenge";
import { useChallengeEntries } from "../hooks/useChallengeEntries";
import { useUserVote } from "../hooks/useUserVote";
import { auth } from "../../../firebase";
import EntryCard from "./EntryCard";
import { FiArrowLeft, FiAward, FiTrendingUp } from "react-icons/fi";

// Masonry layout — split entries into 2 columns
function masonryColumns(arr) {
  const left = [], right = [];
  arr.forEach((item, i) => (i % 2 === 0 ? left : right).push(item));
  return [left, right];
}

// Skeleton card
const SkeletonCard = () => (
  <div className="rounded-2xl bg-gradient-to-b from-slate-100 to-slate-200 animate-pulse" style={{ height: 220 }} />
);

export default function ChallengeFeed() {
  const navigate = useNavigate();
  const { challenge, loading: challengeLoading } = useCurrentChallenge();
  const { entries, loading: entriesLoading } = useChallengeEntries(challenge?.id);
  const { votedEntryId } = useUserVote(challenge?.id);

  const loading = challengeLoading || entriesLoading;
  const [left, right] = masonryColumns(entries);

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-sm border-b border-violet-100 h-14 flex items-center px-4 gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-violet-600">
          <FiArrowLeft size={20} />
        </button>
        <div className="flex-1 max-w-6xl mx-auto flex items-center gap-3">
          <div className="flex-1">
            <p className="font-bold text-slate-800 text-sm">
              {challenge?.theme || "Challenge Feed"}
            </p>
            {challenge && (
              <p className="text-xs text-violet-500">{entries.length} entries</p>
            )}
          </div>
          <button
            onClick={() => navigate("/challenge/leaderboard")}
            className="flex items-center gap-1 text-xs font-semibold text-violet-600 bg-violet-50 px-3 py-1.5 rounded-full"
          >
            <FiAward size={13} /> Leaderboard
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto w-full px-4">
        {/* Challenge prompt header */}
        {challenge && (
          <div className="pt-4 pb-2">
            <div className="bg-gradient-to-r from-violet-600 to-purple-700 rounded-2xl p-4 lg:p-6 text-white">
              <p className="text-[10px] font-bold text-violet-200 uppercase tracking-widest mb-1">This Week's Prompt</p>
              <p className="font-semibold text-sm lg:text-base">"{challenge.prompt}"</p>
              <div className="hidden lg:flex items-center gap-4 mt-3">
                <span className="text-violet-200 text-xs">{entries.length} entries submitted</span>
                <span className="w-1 h-1 rounded-full bg-violet-400" />
                <span className="text-violet-200 text-xs">Vote for your favourite!</span>
              </div>
            </div>
          </div>
        )}

        {/* Offline banner */}
        {!navigator.onLine && (
          <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 text-sm text-amber-700 font-medium">
            You're offline — showing cached content
          </div>
        )}

        {/* Feed */}
        <div className="pt-3">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <span className="text-5xl mb-3">📸</span>
              <p className="font-bold text-slate-700">No entries yet</p>
              <p className="text-sm text-gray-400 mt-1">Be the first to submit!</p>
              <button
                onClick={() => navigate("/challenge/submit")}
                className="mt-5 bg-violet-600 text-white text-sm font-semibold px-5 py-2.5 rounded-full"
              >
                Join Challenge
              </button>
            </div>
          ) : (
            /* Desktop: CSS columns for masonry; Mobile: 2-col grid */
            <div className="hidden md:block">
              <div className="columns-3 xl:columns-4 gap-3 space-y-3">
                {entries.map((entry) => (
                  <div key={entry.id} className="break-inside-avoid mb-3">
                    <EntryCard
                      entry={entry}
                      challengeId={challenge.id}
                      votedEntryId={votedEntryId}
                      challengeTheme={challenge.theme}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mobile: 2-col masonry (original) */}
          {!loading && entries.length > 0 && (
            <div className="md:hidden grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-3">
                {left.map((entry) => (
                  <EntryCard key={entry.id} entry={entry} challengeId={challenge.id} votedEntryId={votedEntryId} challengeTheme={challenge.theme} />
                ))}
              </div>
              <div className="flex flex-col gap-3">
                {right.map((entry) => (
                  <EntryCard key={entry.id} entry={entry} challengeId={challenge.id} votedEntryId={votedEntryId} challengeTheme={challenge.theme} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Join CTA (if user hasn't entered) */}
      {!loading && challenge && votedEntryId === null && entries.length > 0 && (
        <div className="fixed bottom-20 left-0 right-0 flex justify-center px-4">
          <button
            onClick={() => navigate("/challenge/submit")}
            className="bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold text-sm px-8 py-3.5 rounded-full shadow-lg shadow-violet-200"
          >
            📸 Submit Your Entry
          </button>
        </div>
      )}
    </div>
  );
}
