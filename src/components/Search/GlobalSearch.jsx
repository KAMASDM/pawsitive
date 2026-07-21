import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { get, onValue, ref } from "firebase/database";
import { motion, AnimatePresence } from "framer-motion";
import { FiArrowRight, FiCommand, FiMapPin, FiSearch, FiX } from "react-icons/fi";
import { auth, database } from "../../firebase";
import { APP_DESTINATIONS, matchesDestination } from "../../config/appNavigation";

// Module-level singleton so Header can open the search without prop drilling
let _openSearch = null;
export const triggerSearch = (initialQuery = "") => _openSearch?.(initialQuery);

export default function GlobalSearch() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [pets, setPets] = useState([]);
  const [publicPets, setPublicPets] = useState([]);
  const [loadingPublicPets, setLoadingPublicPets] = useState(false);
  const [user, setUser] = useState(auth.currentUser);

  // Register the module-level trigger so Header can open the modal
  useEffect(() => {
    _openSearch = (initialQuery = "") => {
      setQuery(initialQuery);
      setOpen(true);
    };
    return () => { _openSearch = null; };
  }, []);

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
    if (!user) { setPets([]); return undefined; }
    const petsRef = ref(database, `userPets/${user.uid}`);
    return onValue(petsRef, (snapshot) => {
      const value = snapshot.val() || {};
      setPets(Object.entries(value).map(([id, pet]) => ({
        label: pet.name || "Pet",
        detail: [pet.breed, pet.type].filter(Boolean).join(" · ") || "Pet profile",
        path: `/my-pets/${id}`,
        keywords: `${pet.name || ""} ${pet.breed || ""} ${pet.type || ""}`,
        group: "My pets",
        image: pet.image,
      })));
    });
  }, [user]);

  useEffect(() => {
    if (!open || !user || publicPets.length > 0) return;
    let active = true;
    setLoadingPublicPets(true);
    get(ref(database, "userPets"))
      .then((snapshot) => {
        if (!active || !snapshot.exists()) return;
        const found = [];
        Object.entries(snapshot.val()).forEach(([ownerId, ownerPets]) => {
          if (ownerId === user.uid) return;
          Object.entries(ownerPets || {}).forEach(([petId, pet]) => {
            if (!pet?.slug || pet.privacy?.isPrivate) return;
            found.push({
              label: pet.name || "Pet",
              detail: [pet.breed, pet.type].filter(Boolean).join(" · ") || "Public pet profile",
              path: `/pet/${pet.slug}`,
              keywords: `${pet.name || ""} ${pet.breed || ""} ${pet.type || ""} pet profile`,
              group: "Community pets",
              image: pet.image,
              id: `${ownerId}-${petId}`,
            });
          });
        });
        setPublicPets(found.slice(0, 80));
      })
      .catch(() => setPublicPets([]))
      .finally(() => active && setLoadingPublicPets(false));
    return () => { active = false; };
  }, [open, publicPets.length, user]);

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const destinations = APP_DESTINATIONS.filter((item) => matchesDestination(item, query));
    const petResults = [...pets, ...publicPets].filter((item) =>
      !normalized || `${item.label} ${item.detail} ${item.keywords}`.toLowerCase().includes(normalized));
    const careSearch = normalized ? [{
      label: `Search nearby care for “${query.trim()}”`,
      detail: "Open care results near your current location",
      path: "/resource",
      state: { searchTerm: query.trim(), category: "all", subCategory: "all" },
      group: "Care search",
      isCareSearch: true,
    }] : [];
    return [...petResults.slice(0, normalized ? 6 : 3), ...careSearch, ...destinations]
      .slice(0, normalized ? 14 : 10);
  }, [pets, publicPets, query]);

  const go = (item) => {
    setOpen(false);
    setQuery("");
    navigate(item.path, { state: item.state });
  };
  return (
    <>
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
                placeholder="Search pets, vets, groomers, features..."
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
                <div className="py-10 text-center text-sm text-gray-400">
                  {loadingPublicPets ? "Searching Pawppy…" : "No matches found"}
                </div>
              ) : (
                results.map((item) => (
                  <button
                    key={`${item.path}-${item.id || item.label}`}
                    onClick={() => go(item)}
                    className="group flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left hover:bg-violet-50 transition-colors"
                  >
                    {item.image ? (
                      <img src={item.image} alt="" className="h-10 w-10 flex-none rounded-xl object-cover bg-violet-100" />
                    ) : (
                      <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-violet-50 text-violet-600">
                        {item.isCareSearch ? <FiMapPin /> : <FiSearch />}
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-slate-800">{item.label}</span>
                      <span className="block truncate text-xs text-gray-400 mt-0.5">{item.detail}</span>
                    </span>
                    <span className="hidden flex-none text-[9px] font-bold uppercase tracking-wide text-violet-400 sm:block">{item.group}</span>
                    <FiArrowRight className="flex-none text-slate-300 transition group-hover:translate-x-0.5" />
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
