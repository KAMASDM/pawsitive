import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { signOut } from "firebase/auth";
import { auth, database } from "../../firebase";
import { ref, get } from "firebase/database";
import { FaPlus, FaPaw } from "react-icons/fa";
import useResponsive from "../../hooks/useResponsive";
import Home from "../Home/Home";
import {
  FiArrowRight,
  FiUser,
  FiLogOut,
  FiPlus,
  FiMapPin,
  FiSearch,
  FiBook,
  FiHeart,
  FiChevronRight,
  FiAlertTriangle,
  FiHome,
} from "react-icons/fi";
import { MdPets } from "react-icons/md";
import { usePetOperations } from "../../hooks/usePetOperations";
import {
  PetDialog,
  VaccinationDialog,
} from "../Profile/components";

// ---- helpers ----

const PET_EMOJI = { dog: "🐕", cat: "🐈", bird: "🦜", fish: "🐠", rabbit: "🐇", hamster: "🐹", turtle: "🐢" };
const getPetEmoji = (type) => PET_EMOJI[type?.toLowerCase()] ?? "🐾";

const getPetAge = (dateOfBirth) => {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  const now = new Date();
  const months = (now.getFullYear() - dob.getFullYear()) * 12 + (now.getMonth() - dob.getMonth());
  if (months < 1) return "< 1 mo";
  if (months < 12) return `${months} mo`;
  return `${Math.floor(months / 12)} yr`;
};

const getHealthStatus = (vaccinations) => {
  if (!vaccinations?.length) return "no-data";
  const now = new Date();
  const soon = new Date(); soon.setMonth(now.getMonth() + 1);
  let dueSoon = false;
  for (const v of vaccinations) {
    if (!v.nextDue) continue;
    const due = new Date(v.nextDue);
    if (due < now) return "overdue";
    if (due <= soon) dueSoon = true;
  }
  return dueSoon ? "due-soon" : "healthy";
};

const HEALTH_DOT = { healthy: "#34d399", "due-soon": "#fbbf24", overdue: "#f87171", "no-data": "#d1d5db" };
const HEALTH_LABEL = { healthy: "All good", "due-soon": "Due soon", overdue: "Overdue", "no-data": "No data" };

// ---- Decorative Paw SVG ----
const PawPrint = ({ size = 24, color = "currentColor", opacity = 1, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill={color} opacity={opacity} className={className}>
    <ellipse cx="16" cy="14" rx="7" ry="9" />
    <ellipse cx="32" cy="10" rx="7" ry="9" />
    <ellipse cx="48" cy="14" rx="7" ry="9" />
    <ellipse cx="8"  cy="28" rx="6" ry="8" />
    <path d="M32 56 C14 56 10 38 14 30 C18 22 46 22 50 30 C54 38 50 56 32 56Z" />
  </svg>
);

// ---- Feature card data ----
const FEATURES = [
  {
    id: "map",
    label: "Explore Map",
    sub: "Find pets near you",
    path: "/nearby-mates",
    icon: FiMapPin,
    bg: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    paw: true,
  },
  {
    id: "tag",
    label: "Tag a Place",
    sub: "Pet-friendly spots",
    path: "/place-tagging",
    icon: FiSearch,
    bg: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
    paw: true,
  },
  {
    id: "lost",
    label: "Lost & Found",
    sub: "Report or search",
    path: "/lost-and-found",
    icon: FiAlertTriangle,
    bg: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    paw: false,
  },
  {
    id: "adopt",
    label: "Adopt a Pet",
    sub: "Give a home",
    path: "/adopt-pets",
    icon: FiHeart,
    bg: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    paw: false,
  },
  {
    id: "resources",
    label: "Resources",
    sub: "Vets, groomers & more",
    path: "/resource",
    icon: FiBook,
    bg: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
    paw: true,
  },
  {
    id: "nearby",
    label: "NearbyMates",
    sub: "Connect & socialise",
    path: "/nearby-mates",
    icon: MdPets,
    bg: "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
    paw: false,
  },
];

// ---- Pet card ----
const PetCard = ({ pet, index, onClick }) => {
  const health = getHealthStatus(pet.vaccinations);
  const age = getPetAge(pet.dateOfBirth);
  return (
    <motion.button
      onClick={onClick}
      className="text-left overflow-hidden w-full group"
      style={{ borderRadius: 20, background: "#fff", boxShadow: "0 2px 16px rgba(109,93,183,0.10)" }}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, type: "spring", stiffness: 280, damping: 22 }}
      whileTap={{ scale: 0.97 }}
    >
      {/* Photo */}
      <div className="relative h-36 overflow-hidden" style={{ background: "linear-gradient(135deg, #ede9f6 0%, #dde8ff 100%)" }}>
        {pet.image ? (
          <img src={pet.image} alt={pet.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-5xl select-none">{getPetEmoji(pet.type)}</span>
          </div>
        )}
        {/* Health badge */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full backdrop-blur-sm" style={{ background: "rgba(255,255,255,0.82)" }}>
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: HEALTH_DOT[health] }} />
          <span className="text-[9px] font-semibold text-slate-600">{HEALTH_LABEL[health]}</span>
        </div>
        {/* Availability */}
        <div className="absolute bottom-2 left-2.5 flex gap-1">
          {pet.availableForMating && (
            <span className="text-[9px] font-bold rounded-full px-2 py-0.5 backdrop-blur-sm" style={{ background: "rgba(236,72,153,0.85)", color: "#fff" }}>Mating</span>
          )}
          {pet.availableForAdoption && (
            <span className="text-[9px] font-bold rounded-full px-2 py-0.5 backdrop-blur-sm" style={{ background: "rgba(20,184,166,0.85)", color: "#fff" }}>Adoption</span>
          )}
        </div>
      </div>
      {/* Info */}
      <div className="px-3.5 py-3 flex items-center justify-between">
        <div className="min-w-0">
          <h3 className="font-bold text-slate-800 text-sm leading-tight truncate">{pet.name}</h3>
          <p className="text-[11px] text-gray-400 truncate mt-0.5">{[pet.breed || pet.type, age].filter(Boolean).join(" · ")}</p>
        </div>
        <div className="flex-shrink-0 ml-2 w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "#ede9f6" }}>
          <FiArrowRight size={13} color="#7c3aed" />
        </div>
      </div>
    </motion.button>
  );
};

// ---- Feature card ----
const FeatureCard = ({ feat, navigate, index }) => {
  const { icon: Icon, label, sub, path, bg, paw } = feat;
  return (
    <motion.button
      onClick={() => navigate(path)}
      className="relative text-left overflow-hidden w-full"
      style={{ borderRadius: 20, background: bg, minHeight: 96 }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.15 + index * 0.06, type: "spring", stiffness: 280, damping: 22 }}
      whileTap={{ scale: 0.96 }}
    >
      {/* Decorative paw watermark */}
      {paw && (
        <div className="absolute -bottom-3 -right-3 opacity-[0.13] pointer-events-none">
          <PawPrint size={72} color="#fff" />
        </div>
      )}
      <div className="relative z-10 p-4 h-full flex flex-col justify-between">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: "rgba(255,255,255,0.22)" }}>
          <Icon size={18} color="#fff" />
        </div>
        <div>
          <p className="font-bold text-white text-sm leading-tight">{label}</p>
          <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.78)" }}>{sub}</p>
        </div>
      </div>
    </motion.button>
  );
};

// ---- Main Component (wrapper) ----
export default function PetSelector() {
  const { isDesktop } = useResponsive();
  if (isDesktop) return <Home />;
  return <PetSelectorMobile />;
}

// ---- Mobile Component ----
function PetSelectorMobile() {
  const navigate = useNavigate();
  const user = auth.currentUser;
  const [pets, setPets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [discoveryPets, setDiscoveryPets] = useState([]);
  const petOps = usePetOperations(pets, setPets);
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();
  const firstName = user?.displayName?.split(" ")[0] || "there";

  useEffect(() => {
    if (!user) return;
    get(ref(database, `userPets/${user.uid}`))
      .then((snap) => {
        if (snap.exists()) {
          const data = snap.val();
          setPets(Object.keys(data).map((id) => ({ id, ...data[id] })));
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, [user]);

  useEffect(() => {
    if (!user) return;
    get(ref(database, "userPets")).then((snap) => {
      if (!snap.exists()) return;
      const found = [];
      for (const uid of Object.keys(snap.val())) {
        if (uid === user.uid) continue;
        for (const pid of Object.keys(snap.val()[uid])) {
          const p = snap.val()[uid][pid];
          if (p.slug && !p.privacy?.isPrivate) { found.push({ id: pid, ownerId: uid, ...p }); }
          if (found.length >= 12) break;
        }
        if (found.length >= 12) break;
      }
      setDiscoveryPets(found);
    }).catch(() => {});
  }, [user]);

  const handleLogout = async () => { await signOut(auth); navigate("/"); };
  const hasPets = !isLoading && pets.length > 0;

  return (
    <div className="min-h-screen" style={{ background: "#f4f1fb" }}>

      {/* ── Hero header ── */}
      <div
        className="relative overflow-hidden pb-8 pt-safe"
        style={{ background: "linear-gradient(160deg, #6d5dbf 0%, #4a3d7d 60%, #2e2550 100%)" }}
      >
        {/* Scattered paw prints */}
        {[
          { top: "8%",  left: "6%",   size: 28, opacity: 0.12, rotate: -20 },
          { top: "18%", right: "8%",  size: 22, opacity: 0.10, rotate: 15  },
          { top: "55%", left: "14%",  size: 18, opacity: 0.08, rotate: 35  },
          { top: "40%", right: "18%", size: 32, opacity: 0.10, rotate: -10 },
          { top: "70%", left: "40%",  size: 20, opacity: 0.07, rotate: 5   },
        ].map((p, i) => (
          <div key={i} className="absolute pointer-events-none" style={{ top: p.top, left: p.left, right: p.right, transform: `rotate(${p.rotate}deg)` }}>
            <PawPrint size={p.size} color="#fff" opacity={p.opacity} />
          </div>
        ))}

        {/* Top navigation strip */}
        <div className="relative z-10 flex items-center justify-between px-5 pt-4 pb-1">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.15)" }}>
              <PawPrint size={16} color="#fff" opacity={1} />
            </div>
            <span className="font-bold text-white text-base tracking-wide">Pawppy</span>
          </div>
          <div className="flex items-center gap-1.5">
            {hasPets && (
              <button onClick={petOps.handleAddPet} className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: "rgba(255,255,255,0.18)", color: "#fff" }}>
                <FiPlus size={13} /> Add Pet
              </button>
            )}
            <button onClick={() => navigate("/profile")} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.15)" }}>
              <FiUser size={15} color="#fff" />
            </button>
          </div>
        </div>

        {/* Greeting */}
        <div className="relative z-10 px-5 mt-5">
          <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>{greeting},</p>
          <h1 className="text-[26px] font-extrabold text-white leading-tight mt-0.5">{firstName} 👋</h1>
          <p className="text-sm mt-1.5" style={{ color: "rgba(255,255,255,0.65)" }}>
            {hasPets
              ? `You have ${pets.length} pet${pets.length > 1 ? "s" : ""} in your family`
              : "Let's get your pets set up!"}
          </p>
        </div>

        {/* Stats strip */}
        {hasPets && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="relative z-10 flex gap-3 px-5 mt-5"
          >
            {[
              { value: pets.length, label: "My Pets" },
              { value: pets.filter(p => getHealthStatus(p.vaccinations) === "healthy").length, label: "Healthy" },
              { value: pets.filter(p => p.availableForMating || p.availableForAdoption).length, label: "Available" },
            ].map((stat, i) => (
              <div key={i} className="flex-1 rounded-2xl px-3 py-2.5 text-center" style={{ background: "rgba(255,255,255,0.13)" }}>
                <p className="text-xl font-extrabold text-white leading-none">{stat.value}</p>
                <p className="text-[10px] mt-0.5 font-medium" style={{ color: "rgba(255,255,255,0.65)" }}>{stat.label}</p>
              </div>
            ))}
          </motion.div>
        )}

        {/* Curved bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-7 bg-[#f4f1fb]" style={{ borderRadius: "40px 40px 0 0" }} />
      </div>

      {/* ── Scrollable body ── */}
      <div className="px-4 pb-28 space-y-7" style={{ marginTop: -4 }}>

        {/* Loading skeleton */}
        {isLoading && (
          <div className="grid grid-cols-2 gap-3 pt-4">
            {[1,2,3,4].map(n => (
              <div key={n} className="rounded-2xl overflow-hidden animate-pulse" style={{ background: "#fff" }}>
                <div className="h-32" style={{ background: "#ede9f6" }} />
                <div className="p-3 space-y-2">
                  <div className="h-3 rounded-full w-2/3" style={{ background: "#e8e4f3" }} />
                  <div className="h-2.5 rounded-full w-1/2" style={{ background: "#f3f1f9" }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && pets.length === 0 && (
          <motion.div className="flex flex-col items-center text-center pt-8" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.45 }}>
            <div className="w-28 h-28 rounded-full flex items-center justify-center mb-5" style={{ background: "linear-gradient(135deg, #ede9f6, #dde8ff)" }}>
              <PawPrint size={56} color="#7c3aed" opacity={0.5} />
            </div>
            <h2 className="text-xl font-extrabold text-slate-800 mb-2">No pets yet</h2>
            <p className="text-sm text-gray-400 mb-6 max-w-xs leading-relaxed">Add your first pet to unlock health tracking, find mates, adoption, lost & found, and all the good stuff.</p>
            <motion.button
              onClick={petOps.handleAddPet}
              className="flex items-center gap-2 px-7 py-3.5 rounded-2xl text-white font-bold text-sm shadow-lg"
              style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
              whileTap={{ scale: 0.97 }}
            >
              <FiPlus size={16} /> Add Your First Pet
            </motion.button>
          </motion.div>
        )}

        {/* ── My Pets ── */}
        {hasPets && (
          <section>
            <div className="flex items-center justify-between mb-3 pt-2">
              <h2 className="font-extrabold text-slate-800 text-base">My Pets</h2>
              <button onClick={petOps.handleAddPet} className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: "#ede9f6", color: "#7c3aed" }}>
                <FiPlus size={12} /> Add
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <AnimatePresence>
                {pets.map((pet, i) => (
                  <PetCard key={pet.id} pet={pet} index={i} onClick={() => navigate(`/my-pets/${pet.id}`)} />
                ))}
              </AnimatePresence>
            </div>
          </section>
        )}

        {/* ── Explore Features ── */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <PawPrint size={16} color="#7c3aed" opacity={0.6} />
            <h2 className="font-extrabold text-slate-800 text-base">Explore</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {FEATURES.map((feat, i) => (
              <FeatureCard key={feat.id} feat={feat} navigate={navigate} index={i} />
            ))}
          </div>
        </section>

        {/* ── Discover Nearby ── */}
        {discoveryPets.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <PawPrint size={16} color="#7c3aed" opacity={0.6} />
                <h2 className="font-extrabold text-slate-800 text-base">Discover Nearby</h2>
              </div>
              <button onClick={() => navigate("/nearby-mates")} className="flex items-center gap-0.5 text-xs font-semibold" style={{ color: "#7c3aed" }}>
                See all <FiChevronRight size={13} />
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
              {discoveryPets.map((pet, i) => (
                <motion.button
                  key={`${pet.ownerId}-${pet.id}`}
                  onClick={() => navigate(`/pet/${pet.slug}`)}
                  className="flex-shrink-0 overflow-hidden text-left"
                  style={{ width: 112, borderRadius: 18, background: "#fff", boxShadow: "0 2px 12px rgba(109,93,183,0.08)" }}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <div className="h-24 flex items-center justify-center overflow-hidden" style={{ background: "linear-gradient(135deg, #ede9f6, #dde8ff)" }}>
                    {pet.image
                      ? <img src={pet.image} alt={pet.name} className="w-full h-full object-cover" />
                      : <span className="text-3xl">{getPetEmoji(pet.type)}</span>
                    }
                  </div>
                  <div className="px-2.5 py-2">
                    <p className="font-bold text-slate-700 text-xs truncate">{pet.name}</p>
                    <p className="text-[10px] text-gray-400 truncate capitalize">{pet.breed || pet.type}</p>
                  </div>
                </motion.button>
              ))}
            </div>
          </section>
        )}

        {/* ── App features banner ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-3xl p-5 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #4a3d7d 0%, #6d5dbf 100%)" }}
        >
          <div className="absolute -top-4 -right-4 opacity-10 pointer-events-none">
            <PawPrint size={100} color="#fff" />
          </div>
          <p className="font-extrabold text-white text-base mb-1">All-in-one pet care 🐾</p>
          <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.7)" }}>Health records · Maps · Mates · Adoption · Lost & Found</p>
          <button
            onClick={() => navigate("/about-us")}
            className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-full"
            style={{ background: "rgba(255,255,255,0.2)", color: "#fff" }}
          >
            Learn more <FiChevronRight size={13} />
          </button>
        </motion.div>

      </div>

      {/* Dialogs */}
      {petOps.openPetDialog && (
        <PetDialog
          open={petOps.openPetDialog}
          onClose={() => petOps.setOpenPetDialog(false)}
          pet={petOps.currentPet}
          onPetChange={petOps.setCurrentPet}
          onSave={petOps.handleSavePet}
          isEditMode={petOps.isEditMode}
          onAddVaccination={petOps.handleAddVaccination}
          onEditVaccination={petOps.handleEditVaccination}
          onDeleteVaccination={petOps.handleDeleteVaccination}
          tabValue={petOps.tabValue}
          setTabValue={petOps.setTabValue}
        />
      )}
      {petOps.openVaccinationDialog && (
        <VaccinationDialog
          open={petOps.openVaccinationDialog}
          onClose={() => petOps.setOpenVaccinationDialog(false)}
          vaccination={petOps.currentVaccination}
          onVaccinationChange={petOps.setCurrentVaccination}
          onSave={petOps.handleSaveVaccination}
          isSaving={petOps.isSavingVaccination}
        />
      )}
    </div>
  );
}

