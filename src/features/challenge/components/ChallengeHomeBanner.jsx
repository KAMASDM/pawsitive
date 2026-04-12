import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  collection, query, where, getDocs, orderBy, limit, doc, getDoc,
} from "firebase/firestore";
import { db, auth } from "../../../firebase";
import { useCurrentChallenge } from "../hooks/useCurrentChallenge";
import { FiCamera, FiAward, FiUsers, FiShare2, FiArrowLeft, FiExternalLink } from "react-icons/fi";
import { HiOutlineLightningBolt } from "react-icons/hi";

// ── Countdown tiles ──────────────────────────────────────────────────────────
function useCountdownParts(endTime) {
  const [parts, setParts] = useState({ d: 0, h: 0, m: 0, s: 0, ended: false });
  useEffect(() => {
    if (!endTime) return;
    const end = endTime.toDate ? endTime.toDate() : new Date(endTime);
    const tick = () => {
      const diff = end - Date.now();
      if (diff <= 0) { setParts({ d: 0, h: 0, m: 0, s: 0, ended: true }); return; }
      setParts({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
        ended: false,
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endTime]);
  return parts;
}

const TimeTile = ({ value, label }) => (
  <div className="flex flex-col items-center">
    <div
      className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black text-white"
      style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}
    >
      {String(value).padStart(2, "0")}
    </div>
    <span className="text-[10px] text-violet-300 mt-1 uppercase tracking-widest font-semibold">{label}</span>
  </div>
);

// ── Share helper ─────────────────────────────────────────────────────────────
async function shareChallenge(challenge, setToast) {
  const url = `${window.location.origin}/challenge`;
  const text = `🐾 This week's Pawppy Pet Challenge:\n"${challenge.prompt}"\n\nJoin now and show off your pet! 📸`;
  try {
    if (navigator.share) {
      await navigator.share({ title: `Pawppy: ${challenge.theme}`, text, url });
    } else {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setToast("Link copied!");
      setTimeout(() => setToast(null), 2500);
    }
  } catch {}
}

const THEME_EMOJIS = {
  "Silly Face": "😜", "Toy Time": "🧸", "Snooze": "😴", "Zoomies": "💨",
  "Adventure": "🌿", "Monsoon": "🌧️", "Snack Attack": "🍖", "Twinning": "👯",
  "Photobomb": "📷", "Talent Show": "🎭", "Wake-Up": "☀️", "Festive": "🎉",
};
function themeEmoji(theme = "") {
  const key = Object.keys(THEME_EMOJIS).find((k) => theme.includes(k));
  return key ? THEME_EMOJIS[key] : "🏆";
}

export default function ChallengeHomeBanner() {
  const navigate = useNavigate();
  const { challenge, loading } = useCurrentChallenge();
  const countdown = useCountdownParts(challenge?.endTime);
  const [userEntry, setUserEntry] = useState(null);
  const [entryCount, setEntryCount] = useState(0);
  const [winner, setWinner] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!challenge?.id || !uid) return;
    const q = query(
      collection(db, "challenges", challenge.id, "entries"),
      where("uid", "==", uid),
      limit(1)
    );
    getDocs(q).then((snap) => {
      if (!snap.empty) setUserEntry({ id: snap.docs[0].id, ...snap.docs[0].data() });
    });
    getDocs(collection(db, "challenges", challenge.id, "entries")).then((s) =>
      setEntryCount(s.size)
    );
  }, [challenge?.id]);

  useEffect(() => {
    if (challenge || loading) return;
    const q = query(
      collection(db, "challenges"),
      where("winnerId", "!=", null),
      orderBy("winnerId"),
      orderBy("startTime", "desc"),
      limit(1)
    );
    getDocs(q).then(async (snap) => {
      if (snap.empty) return;
      const past = { id: snap.docs[0].id, ...snap.docs[0].data() };
      if (past.winnerId) {
        const eRef = doc(db, "challenges", past.id, "entries", past.winnerId);
        const eSnap = await getDoc(eRef);
        if (eSnap.exists()) setWinner({ ...eSnap.data(), challengeTheme: past.theme });
      }
    }).catch(() => {});
  }, [challenge, loading]);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: "linear-gradient(135deg, #1e1040 0%, #2d1b69 50%, #1e1040 100%)" }}>
        <div className="w-12 h-12 rounded-full border-4 border-violet-400/30 border-t-violet-400 animate-spin" />
      </div>
    );
  }

  // ── No active challenge ──────────────────────────────────────────────────
  if (!challenge) {
    return (
      <div className="min-h-screen flex flex-col pb-24"
        style={{ background: "linear-gradient(160deg, #1e1040 0%, #2d1b69 60%, #13082a 100%)" }}>
        {/* header */}
        <div className="flex items-center px-4 py-4 gap-3">
          <button onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full flex items-center justify-center text-white/70 hover:text-white"
            style={{ background: "rgba(255,255,255,0.1)" }}>
            <FiArrowLeft size={18} />
          </button>
          <span className="text-white font-bold text-base flex-1">Weekly Challenge</span>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-6">
          <div className="text-7xl">😴</div>
          <div>
            <p className="text-white font-black text-xl">No challenge this week… yet!</p>
            <p className="text-violet-300 text-sm mt-2">New challenges go live every Tuesday 9AM IST.</p>
          </div>
          {winner && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-sm rounded-3xl overflow-hidden"
              style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(16px)" }}>
              <div className="p-4">
                <p className="text-amber-400 font-bold text-xs uppercase tracking-widest mb-3">🏆 Last Week's Champion</p>
                <div className="flex items-center gap-4">
                  <img src={winner.petPhotoUrl} alt={winner.petName}
                    className="w-16 h-16 rounded-2xl object-cover flex-shrink-0 border-2 border-amber-400/50" />
                  <div className="text-left">
                    <p className="text-white font-bold">{winner.petName}</p>
                    <p className="text-violet-300 text-xs">{winner.ownerDisplayName}</p>
                    <p className="text-amber-400 text-xs mt-1">{winner.voteCount || 0} votes</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          <button onClick={() => navigate("/challenge/leaderboard")}
            className="flex items-center gap-2 text-sm font-semibold text-violet-300 border border-violet-500/40 px-5 py-2.5 rounded-full">
            <FiAward size={15} /> View Leaderboard
          </button>
        </div>
      </div>
    );
  }

  // ── Active challenge ─────────────────────────────────────────────────────
  const emoji = themeEmoji(challenge.theme);

  return (
    <div className="relative min-h-screen flex flex-col pb-24 overflow-hidden"
      style={{ background: "linear-gradient(160deg, #1e1040 0%, #2d1b69 60%, #13082a 100%)" }}>

      {/* Decorative blobs — contained within this div via relative+overflow-hidden */}
      <div className="absolute top-0 left-0 w-72 h-72 rounded-full opacity-20 pointer-events-none"
        style={{ background: "radial-gradient(circle, #9966ff 0%, transparent 70%)", transform: "translate(-30%, -30%)" }} />
      <div className="absolute top-40 right-0 w-56 h-56 rounded-full opacity-15 pointer-events-none"
        style={{ background: "radial-gradient(circle, #ff6eb4 0%, transparent 70%)", transform: "translate(30%, 0)" }} />
      {/* Extra desktop blobs */}
      <div className="hidden lg:block absolute bottom-20 left-1/4 w-96 h-96 rounded-full opacity-10 pointer-events-none"
        style={{ background: "radial-gradient(circle, #38bdf8 0%, transparent 70%)" }} />

      {/* Header */}
      <div className="relative flex items-center px-6 py-4 gap-3 max-w-6xl mx-auto w-full">
        <button onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full flex items-center justify-center text-white/70"
          style={{ background: "rgba(255,255,255,0.1)" }}>
          <FiArrowLeft size={18} />
        </button>
        <span className="text-white font-bold text-base flex-1">Weekly Challenge</span>
        <button
          onClick={() => shareChallenge(challenge, setToast)}
          className="w-9 h-9 rounded-full flex items-center justify-center text-white/70"
          style={{ background: "rgba(255,255,255,0.1)" }}>
          <FiShare2 size={17} />
        </button>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="absolute top-16 left-1/2 -translate-x-1/2 bg-violet-700 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg z-50">
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── DESKTOP two-column / MOBILE single column ── */}
      <div className="relative flex-1 w-full max-w-6xl mx-auto px-5 lg:px-10">

        {/* Desktop: side-by-side grid */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:gap-16 gap-5 py-4 lg:py-10">

          {/* ── LEFT COLUMN ── */}
          <div className="flex flex-col items-center lg:items-start gap-5 lg:flex-1">

            {/* Emoji + live badge */}
            <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="flex flex-col items-center lg:items-start gap-2">
              <div className="text-7xl lg:text-8xl drop-shadow-xl">{emoji}</div>
              <div className="flex items-center gap-1.5 bg-green-500/20 border border-green-400/40 px-3 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-green-300 text-[11px] font-bold uppercase tracking-widest">Live Now</span>
              </div>
            </motion.div>

            {/* Desktop-only label above prompt */}
            <div className="hidden lg:block">
              <p className="text-violet-300 text-xs font-bold uppercase tracking-widest mb-1">{challenge.theme}</p>
              <h1 className="text-white font-black text-3xl leading-snug max-w-lg">"{challenge.prompt}"</h1>
              <p className="text-violet-400 text-sm mt-3">
                📅 Challenge ends {challenge.endTime
                  ? new Date(challenge.endTime?.toDate ? challenge.endTime.toDate() : challenge.endTime)
                      .toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })
                  : "this week"}
              </p>
            </div>

            {/* Challenge card (mobile only, desktop shows inline above) */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="lg:hidden w-full max-w-sm rounded-3xl p-6 text-center"
              style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.12)" }}>
              <p className="text-violet-300 text-xs font-bold uppercase tracking-widest">{challenge.theme}</p>
              <p className="text-white font-black text-xl leading-snug mt-2">"{challenge.prompt}"</p>
              <div className="flex items-center justify-center gap-6 mt-4">
                <div className="flex flex-col items-center">
                  <span className="text-white font-black text-lg">{entryCount}</span>
                  <span className="text-violet-400 text-[10px] uppercase tracking-widest">Entries</span>
                </div>
                <div className="w-px h-8 bg-violet-500/30" />
                <div className="flex flex-col items-center">
                  <span className="text-white font-black text-lg">🏆</span>
                  <span className="text-violet-400 text-[10px] uppercase tracking-widest">Featured</span>
                </div>
                <div className="w-px h-8 bg-violet-500/30" />
                <div className="flex flex-col items-center">
                  <span className="text-white font-black text-lg">20</span>
                  <span className="text-violet-400 text-[10px] uppercase tracking-widest">XP</span>
                </div>
              </div>
            </motion.div>

            {/* Desktop stats strip */}
            <div className="hidden lg:flex items-center gap-8 mt-2">
              {[
                { value: entryCount, label: "Entries", icon: "📸" },
                { value: "20 XP", label: "Reward", icon: "⚡" },
                { value: "🏆", label: "Featured winner", icon: null },
              ].map(({ value, label, icon }) => (
                <div key={label} className="flex flex-col items-center gap-1 px-4 py-3 rounded-2xl"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <span className="text-white font-black text-xl">{icon ?? value}</span>
                  {icon && <span className="text-white font-bold text-sm">{value}</span>}
                  <span className="text-violet-400 text-[10px] uppercase tracking-widest">{label}</span>
                </div>
              ))}
            </div>

            {/* Countdown */}
            {!countdown.ended && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="flex flex-col items-center lg:items-start gap-3">
                <p className="text-violet-400 text-xs uppercase tracking-widest font-semibold">Time remaining</p>
                <div className="flex items-end gap-3">
                  {countdown.d > 0 && <TimeTile value={countdown.d} label="Days" />}
                  <TimeTile value={countdown.h} label="Hrs" />
                  <TimeTile value={countdown.m} label="Min" />
                  <TimeTile value={countdown.s} label="Sec" />
                </div>
              </motion.div>
            )}
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="flex flex-col items-center lg:items-stretch gap-4 lg:w-80 xl:w-96">

            {/* User entry OR join CTA */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="w-full max-w-sm lg:max-w-none">
              {userEntry ? (
                <div className="rounded-2xl overflow-hidden"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}>
                  <div className="flex items-center gap-4 p-4">
                    <img src={userEntry.petPhotoUrl} alt={userEntry.petName}
                      className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-violet-300 text-xs font-semibold mb-0.5">Your entry is live!</p>
                      <p className="text-white font-black text-lg">{userEntry.voteCount || 0} <span className="text-violet-300 font-normal text-sm">votes</span></p>
                    </div>
                    <button
                      onClick={() => shareChallenge(challenge, setToast)}
                      className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(139,92,246,0.3)" }}>
                      <FiShare2 size={16} className="text-violet-300" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 border-t border-white/10">
                    <button onClick={() => navigate("/challenge/feed")}
                      className="py-3 text-sm font-semibold text-violet-300 flex items-center justify-center gap-1.5 border-r border-white/10">
                      <FiExternalLink size={14} /> View Feed
                    </button>
                    <button onClick={() => navigate("/challenge/leaderboard")}
                      className="py-3 text-sm font-semibold text-amber-400 flex items-center justify-center gap-1.5">
                      <FiAward size={14} /> Leaderboard
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => navigate("/challenge/submit")}
                    className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl font-black text-base text-violet-900"
                    style={{ background: "linear-gradient(135deg, #ffffff 0%, #ede9fe 100%)" }}>
                    <FiCamera size={18} /> Join Challenge 📸
                  </motion.button>
                  <button onClick={() => navigate("/challenge/feed")}
                    className="w-full text-center text-violet-400 text-sm font-semibold py-2">
                    Or browse all entries →
                  </button>
                </div>
              )}
            </motion.div>

            {/* Desktop How it works info card */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="hidden lg:block rounded-2xl p-5"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <p className="text-violet-300 text-xs font-bold uppercase tracking-widest mb-3">How it works</p>
              {[
                { step: "1", text: "Submit a photo matching the theme" },
                { step: "2", text: "Share your entry to get community votes" },
                { step: "3", text: "Top-voted pet wins 🏆 + gets featured" },
              ].map(({ step, text }) => (
                <div key={step} className="flex items-start gap-3 mb-3 last:mb-0">
                  <div className="w-6 h-6 rounded-full bg-violet-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-violet-300 text-xs font-black">{step}</span>
                  </div>
                  <p className="text-white/70 text-sm leading-snug">{text}</p>
                </div>
              ))}
            </motion.div>

            {/* Share nudge */}
            {!userEntry && (
              <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                onClick={() => shareChallenge(challenge, setToast)}
                className="flex items-center justify-center gap-2 text-violet-400 text-xs font-semibold py-2">
                <FiShare2 size={13} /> Share challenge with friends
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
