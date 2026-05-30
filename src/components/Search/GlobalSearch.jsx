import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { onValue, ref } from "firebase/database";
import { motion, AnimatePresence } from "framer-motion";
import { FiBell, FiCommand, FiSearch, FiX } from "react-icons/fi";
import { auth, database } from "../../firebase";

const QUICK_LINKS = [
  { label: "My pets", detail: "Open your pet dashboard", path: "/my-pets", keywords: "home pets dashboard" },
  { label: "Resources", detail: "Find vets, stores and services", path: "/resource", keywords: "vet resource groomer store" },
  { label: "Nearby mates", detail: "Find matching pets", path: "/nearby-mates", keywords: "mate mating nearby" },
  { label: "Adoption", detail: "Browse pets for adoption", path: "/adopt-pets", keywords: "adopt adoption" },
  { label: "Lost & found", detail: "Report or browse lost pets", path: "/lost-and-found", keywords: "lost found report" },
  { label: "Challenge", detail: "Weekly pet photo challenge", path: "/challenge", keywords: "challenge photo contest" },
  { label: "Quiz", detail: "Weekly pet quiz", path: "/quiz", keywords: "quiz trivia" },
  { label: "Notifications", detail: "Review reminders and alerts", path: "/notifications", keywords: "notifications reminders alerts inbox" },
];

export default function GlobalSearch() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [pets, setPets] = useState([]);
  const [user, setUser] = useState(auth.currentUser);
  const [unreadCount, setUnreadCount] = useState(0);
  const [broadcastUnreadCount, setBroadcastUnreadCount] = useState(0);

  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  useEffect(() => {
    if (!user) {
      setPets([]);
      setUnreadCount(0);
      setBroadcastUnreadCount(0);
      return undefined;
    }

    const petsRef = ref(database, `userPets/${user.uid}`);
    const unreadRef = ref(database, `users/${user.uid}/unreadNotifications`);
    const broadcastsRef = ref(database, "broadcastNotifications");
    const readsRef = ref(database, `notificationReads/${user.uid}`);
    let broadcasts = {};
    let reads = {};
    const updateBroadcastUnread = () => {
      const count = Object.entries(broadcasts).filter(([id, item]) => (
        item?.active !== false && reads?.[id]?.read !== true
      )).length;
      setBroadcastUnreadCount(count);
    };

    const unsubscribePets = onValue(petsRef, (snapshot) => {
      const value = snapshot.val() || {};
      setPets(Object.entries(value).map(([id, pet]) => ({
        label: pet.name || "Pet",
        detail: [pet.breed, pet.type].filter(Boolean).join(" · ") || "Pet profile",
        path: `/my-pets/${id}`,
        keywords: `${pet.name || ""} ${pet.breed || ""} ${pet.type || ""}`,
      })));
    });

    const unsubscribeUnread = onValue(unreadRef, (snapshot) => {
      setUnreadCount(snapshot.val() || 0);
    });
    const unsubscribeBroadcasts = onValue(broadcastsRef, (snapshot) => {
      broadcasts = snapshot.val() || {};
      updateBroadcastUnread();
    }, () => {
      broadcasts = {};
      updateBroadcastUnread();
    });
    const unsubscribeReads = onValue(readsRef, (snapshot) => {
      reads = snapshot.val() || {};
      updateBroadcastUnread();
    }, () => {
      reads = {};
      updateBroadcastUnread();
    });

    return () => {
      unsubscribePets();
      unsubscribeUnread();
      unsubscribeBroadcasts();
      unsubscribeReads();
    };
  }, [user]);

  const results = useMemo(() => {
    const all = [...pets, ...QUICK_LINKS];
    const normalized = query.trim().toLowerCase();
    if (!normalized) return all.slice(0, 8);
    return all
      .filter((item) => `${item.label} ${item.detail} ${item.keywords}`.toLowerCase().includes(normalized))
      .slice(0, 10);
  }, [pets, query]);

  const go = (path) => {
    setOpen(false);
    setQuery("");
    navigate(path);
  };
  const totalUnreadCount = unreadCount + broadcastUnreadCount;

  return (
    <>
      <div className="fixed right-4 bottom-[118px] md:bottom-5 z-40 flex items-center gap-2 rounded-full border border-white/70 bg-white/90 p-1.5 shadow-[0_16px_36px_rgba(51,38,92,0.18)] backdrop-blur-xl">
        <button
          onClick={() => navigate("/notifications")}
          className="relative w-11 h-11 rounded-full bg-violet-50 text-slate-600 flex items-center justify-center active:scale-95 transition-transform"
          aria-label="Notifications"
        >
          <FiBell size={18} />
          {totalUnreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
              {totalUnreadCount > 9 ? "9+" : totalUnreadCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setOpen(true)}
          className="w-11 h-11 rounded-full bg-gradient-to-br from-violet-600 to-indigo-700 text-white shadow-[0_10px_24px_rgba(91,67,170,0.28)] flex items-center justify-center active:scale-95 transition-transform"
          aria-label="Search"
        >
          <FiSearch size={18} />
        </button>
      </div>

      <AnimatePresence>
        {open && (
        <motion.div
          className="fixed inset-0 z-[220] bg-slate-950/45 backdrop-blur-sm p-4 flex items-start justify-center pt-20"
          onClick={() => setOpen(false)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full max-w-xl rounded-[28px] bg-white/95 border border-white/70 shadow-[0_24px_70px_rgba(30,24,55,0.28)] overflow-hidden"
            onClick={(event) => event.stopPropagation()}
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 360, damping: 30 }}
          >
            <div className="flex items-center gap-3 px-4 py-3 border-b border-violet-100 bg-gradient-to-r from-violet-50 to-white">
              <FiSearch className="text-violet-500" size={18} />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search pets, resources, challenges..."
                className="flex-1 outline-none text-sm text-slate-800"
              />
              <span className="hidden sm:flex items-center gap-1 text-[10px] text-slate-400 bg-white border border-violet-100 rounded-full px-2 py-1">
                <FiCommand size={11} /> K
              </span>
              <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-full bg-white text-slate-400 hover:text-slate-600 flex items-center justify-center">
                <FiX size={18} />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-2">
              {results.length === 0 ? (
                <div className="py-10 text-center text-sm text-gray-400">No matches found</div>
              ) : (
                results.map((item) => (
                  <button
                    key={`${item.path}-${item.label}`}
                    onClick={() => go(item.path)}
                    className="w-full rounded-2xl px-3 py-3 text-left hover:bg-violet-50 transition-colors"
                  >
                    <span className="block text-sm font-bold text-slate-800">{item.label}</span>
                    <span className="block text-xs text-gray-400 mt-0.5">{item.detail}</span>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
