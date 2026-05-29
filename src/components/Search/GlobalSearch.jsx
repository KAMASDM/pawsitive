import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { onValue, ref } from "firebase/database";
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
    });
    const unsubscribeReads = onValue(readsRef, (snapshot) => {
      reads = snapshot.val() || {};
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
      <div className="fixed right-4 bottom-20 md:bottom-5 z-40 flex flex-col gap-2">
        <button
          onClick={() => navigate("/notifications")}
          className="relative w-11 h-11 rounded-full bg-white border border-violet-100 text-violet-600 shadow-lg flex items-center justify-center"
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
          className="w-11 h-11 rounded-full bg-violet-600 text-white shadow-lg flex items-center justify-center"
          aria-label="Search"
        >
          <FiSearch size={18} />
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-[220] bg-black/40 backdrop-blur-sm p-4 flex items-start justify-center pt-20" onClick={() => setOpen(false)}>
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl overflow-hidden" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center gap-3 px-4 py-3 border-b border-violet-100">
              <FiSearch className="text-violet-500" size={18} />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search pets, resources, challenges..."
                className="flex-1 outline-none text-sm text-slate-800"
              />
              <span className="hidden sm:flex items-center gap-1 text-[10px] text-gray-400 bg-gray-50 rounded px-2 py-1">
                <FiCommand size={11} /> K
              </span>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
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
                    className="w-full rounded-xl px-3 py-3 text-left hover:bg-violet-50 transition-colors"
                  >
                    <span className="block text-sm font-bold text-slate-800">{item.label}</span>
                    <span className="block text-xs text-gray-400 mt-0.5">{item.detail}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
