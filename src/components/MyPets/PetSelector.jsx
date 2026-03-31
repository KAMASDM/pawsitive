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
} from "react-icons/fi";
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
  const months =
    (now.getFullYear() - dob.getFullYear()) * 12 +
    (now.getMonth() - dob.getMonth());
  if (months < 1) return "< 1 mo";
  if (months < 12) return `${months} mo`;
  const years = Math.floor(months / 12);
  return `${years} yr`;
};

const getHealthStatus = (vaccinations) => {
  if (!vaccinations?.length) return "no-data";
  const now = new Date();
  const soon = new Date();
  soon.setMonth(now.getMonth() + 1);
  let dueSoon = false;
  for (const v of vaccinations) {
    if (!v.nextDue) continue;
    const due = new Date(v.nextDue);
    if (due < now) return "overdue";
    if (due <= soon) dueSoon = true;
  }
  return dueSoon ? "due-soon" : "healthy";
};

const HEALTH_DOT = {
  healthy: "bg-emerald-400",
  "due-soon": "bg-amber-400",
  overdue: "bg-red-500",
  "no-data": "bg-gray-300",
};

const HEALTH_LABEL = {
  healthy: "Vaccinations up-to-date",
  "due-soon": "Vaccination due soon",
  overdue: "Vaccination overdue",
  "no-data": "No vaccination data",
};

// ---- PetCard ----

const PetCard = ({ pet, index, onClick }) => {
  const health = getHealthStatus(pet.vaccinations);
  const age = getPetAge(pet.dateOfBirth);

  return (
    <motion.button
      onClick={onClick}
      className="text-left bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all group w-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35 }}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Photo area */}
      <div className="relative h-36 bg-gradient-to-br from-violet-50 to-indigo-50 flex items-center justify-center overflow-hidden">
        {pet.image ? (
          <img
            src={pet.image}
            alt={pet.name}
            className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
          />
        ) : (
          <span className="text-4xl select-none opacity-70">{getPetEmoji(pet.type)}</span>
        )}

        {/* Health dot — minimal */}
        <div
          className={`absolute top-2.5 right-2.5`}
          title={HEALTH_LABEL[health]}
        >
          <div className={`w-2 h-2 rounded-full ${HEALTH_DOT[health]} ring-2 ring-white`} />
        </div>

        {/* Availability badges */}
        <div className="absolute bottom-2 left-2.5 flex gap-1">
          {pet.availableForMating && (
            <span className="text-[9px] font-semibold bg-pink-500/90 text-white rounded-full px-1.5 py-0.5 backdrop-blur-sm">
              Mating
            </span>
          )}
          {pet.availableForAdoption && (
            <span className="text-[9px] font-semibold bg-teal-500/90 text-white rounded-full px-1.5 py-0.5 backdrop-blur-sm">
              Adoption
            </span>
          )}
        </div>
      </div>

      {/* Info row */}
      <div className="px-3.5 py-3 flex items-center justify-between">
        <div className="min-w-0">
          <h3 className="font-semibold text-slate-800 text-sm leading-tight truncate">
            {pet.name}
          </h3>
          <p className="text-xs text-gray-400 truncate mt-0.5">
            {[pet.breed || pet.type, age].filter(Boolean).join(" · ")}
          </p>
        </div>
        <FiArrowRight
          className="flex-shrink-0 ml-2 text-gray-300 group-hover:text-violet-400 group-hover:translate-x-0.5 transition-all"
          size={15}
        />
      </div>
    </motion.button>
  );
};

// ---- Main Component (wrapper — routes desktop to Home, mobile to PetSelectorMobile) ----

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

  useEffect(() => {
    if (!user) return;
    const fetchPets = async () => {
      try {
        const snap = await get(ref(database, `userPets/${user.uid}`));
        if (snap.exists()) {
          const data = snap.val();
          setPets(
            Object.keys(data).map((id) => ({ id, ...data[id] }))
          );
        }
      } catch (err) {
        console.error("Error fetching pets:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPets();
  }, [user]);

  // Fetch discovery pets (other users' public pets)
  useEffect(() => {
    if (!user) return;
    const fetchDiscovery = async () => {
      try {
        const snap = await get(ref(database, "userPets"));
        if (!snap.exists()) return;
        const allUsersData = snap.val();
        const found = [];
        for (const uid of Object.keys(allUsersData)) {
          if (uid === user.uid) continue;
          const userPetMap = allUsersData[uid];
          for (const pid of Object.keys(userPetMap)) {
            const p = userPetMap[pid];
            if (p.slug && !p.privacy?.isPrivate) {
              found.push({ id: pid, ownerId: uid, ...p });
              if (found.length >= 10) break;
            }
          }
          if (found.length >= 10) break;
        }
        setDiscoveryPets(found);
      } catch (err) {
        console.error("Discovery fetch error:", err);
      }
    };
    fetchDiscovery();
  }, [user]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  const hasPets = !isLoading && pets.length > 0;

  const QUICK_LINKS = [
    { emoji: "🗺️", label: "Explore Map", sub: "Find pets near you", onClick: () => navigate("/nearby-mates"), color: "from-indigo-50 to-blue-50 border-indigo-100" },
    { emoji: "�", label: "Tag a Place", sub: "Pet-friendly spots", onClick: () => navigate("/place-tagging"), color: "from-green-50 to-emerald-50 border-green-100" },
    { emoji: "�🔍", label: "Lost & Found", sub: "Report or browse", onClick: () => navigate("/lost-and-found"), color: "from-amber-50 to-orange-50 border-amber-100" },
    { emoji: "🏠", label: "Adopt", sub: "Find a new friend", onClick: () => navigate("/adopt-pets"), color: "from-teal-50 to-emerald-50 border-teal-100" },
    { emoji: "📚", label: "Resources", sub: "Vets, groomers & more", onClick: () => navigate("/resource"), color: "from-violet-50 to-purple-50 border-violet-100" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-violet-50">
      {/* Top bar */}
      <div className="bg-white/80 backdrop-blur-md border-b border-violet-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FaPaw className="text-violet-500" size={18} />
            <span className="font-bold text-slate-800">Pawsitive</span>
          </div>
          <div className="flex items-center gap-1">
            {hasPets && (
              <button
                onClick={petOps.handleAddPet}
                title="Add a pet"
                className="p-2 rounded-lg text-violet-500 hover:bg-violet-50 hover:text-violet-700 transition-colors"
              >
                <FiPlus size={18} />
              </button>
            )}
            <button
              onClick={() => navigate("/profile")}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-violet-600 px-2.5 py-1.5 rounded-lg hover:bg-violet-50 transition-colors"
            >
              <FiUser size={15} />
              <span className="hidden sm:inline text-xs">Account</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-red-600 px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
            >
              <FiLogOut size={15} />
              <span className="hidden sm:inline text-xs">Logout</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8">
        {/* Loading */}
        {isLoading ? (
          <>
            <div className="mb-5 h-6 w-24 bg-gray-100 rounded animate-pulse" />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse"
                >
                  <div className="h-36 bg-gray-50" />
                  <div className="px-3.5 py-3 space-y-1.5">
                    <div className="h-3.5 bg-gray-100 rounded w-2/3" />
                    <div className="h-3 bg-gray-50 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : pets.length === 0 ? (
          /* ---- Empty state ---- */
          <motion.div
            className="text-center py-20"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-8xl mb-6 select-none">🐾</div>
            <h2 className="text-2xl font-bold text-slate-700 mb-3">
              No pets added yet
            </h2>
            <p className="text-gray-500 mb-8 max-w-sm mx-auto leading-relaxed text-sm">
              Add your first pet to unlock health tracking, find mates,
              adoption, lost & found, and more — all tailored just for them.
            </p>
            <motion.button
              onClick={petOps.handleAddPet}
              className="inline-flex items-center gap-2.5 px-8 py-4 bg-gradient-to-r from-violet-500 to-indigo-500 text-white font-bold rounded-2xl shadow-lg text-base hover:shadow-xl"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
            >
              <FaPlus size={15} />
              Add Your First Pet
            </motion.button>

            {/* Discovery below empty state */}
            {discoveryPets.length > 0 && (
              <DiscoverySection pets={discoveryPets} navigate={navigate} />
            )}
          </motion.div>
        ) : (
          /* ---- Pet grid + feature sections ---- */
          <div className="space-y-10">
            {/* Section header */}
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
            >
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">My Pets</h1>
              <p className="text-gray-400 text-xs mt-0.5">Tap a pet to manage their world</p>
            </motion.div>

            {/* Pet grid — no AddPetCard inline */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              <AnimatePresence>
                {pets.map((pet, i) => (
                  <PetCard
                    key={pet.id}
                    pet={pet}
                    index={i}
                    onClick={() => navigate(`/my-pets/${pet.id}`)}
                  />
                ))}
              </AnimatePresence>
            </div>

            {/* Quick feature links */}
            <div>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                Explore
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {QUICK_LINKS.map((link) => (
                  <motion.button
                    key={link.label}
                    onClick={link.onClick}
                    className={`flex items-center gap-3 p-4 rounded-2xl border bg-gradient-to-br text-left hover:shadow-sm transition-all ${link.color}`}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <span className="text-2xl">{link.emoji}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-700 leading-tight">{link.label}</p>
                      <p className="text-[11px] text-gray-400 truncate">{link.sub}</p>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Discover nearby pets */}
            {discoveryPets.length > 0 && (
              <DiscoverySection pets={discoveryPets} navigate={navigate} />
            )}
          </div>
        )}
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

// ---- Discovery Section ----

const PET_EMOJI_MAP = { dog: "🐕", cat: "🐈", bird: "🦜", fish: "🐠", rabbit: "🐇", hamster: "🐹", turtle: "🐢" };

function DiscoverySection({ pets, navigate }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.1 }}
      className="mt-10"
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
          Discover Nearby Pets
        </h2>
        <button
          onClick={() => navigate("/nearby-mates")}
          className="flex items-center gap-1 text-xs text-violet-500 hover:text-violet-700 font-medium"
        >
          See all <FiChevronRight size={13} />
        </button>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
        {pets.map((pet, i) => (
          <motion.button
            key={`${pet.ownerId}-${pet.id}`}
            onClick={() => navigate(`/pet/${pet.slug}`)}
            className="flex-shrink-0 w-28 bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow text-left"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
          >
            <div className="h-24 bg-gradient-to-br from-violet-50 to-indigo-50 flex items-center justify-center overflow-hidden">
              {pet.image ? (
                <img src={pet.image} alt={pet.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl opacity-70">
                  {PET_EMOJI_MAP[pet.type?.toLowerCase()] ?? "🐾"}
                </span>
              )}
            </div>
            <div className="px-2.5 py-2">
              <p className="font-semibold text-slate-700 text-xs truncate">{pet.name}</p>
              <p className="text-[10px] text-gray-400 truncate capitalize">{pet.breed || pet.type}</p>
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
