import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { auth, database } from "../../firebase";
import { ref, get, set, update, onValue, off } from "firebase/database";
import {
  FiArrowLeft,
  FiEdit2,
  FiShare2,
  FiHeart,
  FiMapPin,
  FiAlertCircle,
  FiCheckCircle,
} from "react-icons/fi";
import {
  FaPaw,
  FaSyringe,
  FaHeart,
  FaSearch,
  FaMapMarkerAlt,
  FaBook,
  FaQrcode,
  FaHome,
  FaComments,
  FaCheck,
  FaTimes,
  FaPlus,
} from "react-icons/fa";
import { usePetOperations } from "../../hooks/usePetOperations";
import {
  PetDialog,
  VaccinationDialog,
  MessageDialog,
} from "../Profile/components";
import ConversationsList from "../Profile/components/ConversationsList";
import PetPostsFeed from "../PetProfile/PetPostsFeed";
import { sendMatingRequestAcceptedNotification } from "../../services/notificationService";

// ---- Helpers ----

const PET_EMOJI = {
  dog: "🐕",
  cat: "🐈",
  bird: "🦜",
  fish: "🐠",
  rabbit: "🐇",
  hamster: "🐹",
  turtle: "🐢",
};
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
  const rem = months % 12;
  return rem > 0 ? `${years} yr ${rem} mo` : `${years} yr`;
};

const getVaccinationStatus = (nextDue) => {
  if (!nextDue) return "unknown";
  const due = new Date(nextDue);
  const now = new Date();
  const soon = new Date();
  soon.setMonth(now.getMonth() + 1);
  if (due < now) return "overdue";
  if (due <= soon) return "due-soon";
  return "up-to-date";
};

const VAC_COLORS = {
  "up-to-date": "bg-emerald-100 text-emerald-700 border-emerald-200",
  "due-soon": "bg-amber-100 text-amber-700 border-amber-200",
  overdue: "bg-red-100 text-red-700 border-red-200",
  unknown: "bg-gray-100 text-gray-500 border-gray-200",
};

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

// ---- Feature Tile ----

const FeatureTile = ({ icon: Icon, emoji, label, description, color, onClick, badge }) => (
  <motion.button
    onClick={onClick}
    className={`relative flex flex-col items-start p-5 rounded-2xl border text-left w-full transition-shadow hover:shadow-lg ${color}`}
    whileHover={{ y: -3 }}
    whileTap={{ scale: 0.97 }}
  >
    {badge != null && badge > 0 && (
      <div className="absolute top-3 right-3 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
        <span className="text-[10px] text-white font-bold">{badge}</span>
      </div>
    )}
    <div className="text-3xl mb-3">{emoji}</div>
    <p className="font-bold text-sm text-slate-800">{label}</p>
    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{description}</p>
  </motion.button>
);

// ---- Health Tab ----

const HealthTab = ({ pet, onEditPet, onAddVaccination, onEditVaccination, onDeleteVaccination }) => {
  const vaccinations = pet.vaccinations || [];
  const medications = pet.medical?.medications || "";
  const allergies = pet.medical?.allergies || [];
  const conditions = pet.medical?.conditions || [];

  return (
    <div className="space-y-6">
      {/* Vaccinations */}
      <div className="bg-white rounded-2xl border border-violet-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-violet-50">
          <div className="flex items-center gap-2">
            <FaSyringe className="text-violet-500" size={15} />
            <h3 className="font-bold text-slate-700">Vaccinations</h3>
            <span className="text-xs text-gray-400">({vaccinations.length})</span>
          </div>
          <button
            onClick={onAddVaccination}
            className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-800 font-semibold"
          >
            <FaPlus size={10} /> Add
          </button>
        </div>
        {vaccinations.length === 0 ? (
          <div className="px-5 py-8 text-center text-gray-400 text-sm">
            No vaccinations recorded yet.{" "}
            <button
              className="text-violet-500 underline"
              onClick={onAddVaccination}
            >
              Add one
            </button>
          </div>
        ) : (
          <div className="divide-y divide-violet-50">
            {vaccinations.map((vac, idx) => {
              const status = getVaccinationStatus(vac.nextDue);
              return (
                <div
                  key={vac.id || idx}
                  className="px-5 py-3.5 flex items-center justify-between hover:bg-violet-50/30 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-slate-700 text-sm truncate">
                      {vac.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      Given: {formatDate(vac.date)}
                      {vac.nextDue ? ` · Due: ${formatDate(vac.nextDue)}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${VAC_COLORS[status]}`}
                    >
                      {status === "up-to-date" ? "✓ OK" : status === "due-soon" ? "Due soon" : status === "overdue" ? "Overdue" : "—"}
                    </span>
                    <button
                      onClick={() => onEditVaccination(vac, idx)}
                      className="text-gray-400 hover:text-violet-600 transition-colors p-1"
                    >
                      <FiEdit2 size={12} />
                    </button>
                    <button
                      onClick={() => onDeleteVaccination(idx)}
                      className="text-gray-400 hover:text-red-500 transition-colors p-1"
                    >
                      <FaTimes size={11} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Medical info summary */}
      {(conditions.length > 0 || allergies.length > 0 || medications) && (
        <div className="bg-white rounded-2xl border border-violet-100 shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🏥</span>
            <h3 className="font-bold text-slate-700">Medical Info</h3>
          </div>
          {conditions.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Conditions
              </p>
              <div className="flex flex-wrap gap-1.5">
                {conditions.map((c, i) => (
                  <span
                    key={i}
                    className="text-xs bg-violet-100 text-violet-700 rounded-full px-2.5 py-0.5"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}
          {allergies.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Allergies
              </p>
              <div className="flex flex-wrap gap-1.5">
                {allergies.map((a, i) => (
                  <span
                    key={i}
                    className="text-xs bg-amber-100 text-amber-700 rounded-full px-2.5 py-0.5"
                  >
                    {a}
                  </span>
                ))}
              </div>
            </div>
          )}
          {medications && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Medications
              </p>
              <p className="text-sm text-gray-600">{medications}</p>
            </div>
          )}
        </div>
      )}

      {/* Edit full health record */}
      <button
        onClick={() => onEditPet(null, "vaccinations")}
        className="w-full py-3 text-sm text-violet-600 font-semibold border border-violet-200 rounded-xl hover:bg-violet-50 transition-colors"
      >
        Edit Full Health Record
      </button>
    </div>
  );
};

// ---- Requests Tab ----

const RequestsTab = ({ requests, onAccept, onDecline }) => {
  if (requests.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <FaHeart className="mx-auto mb-3 text-3xl text-violet-200" />
        <p className="text-sm">No mating requests yet for this pet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((req) => (
        <div
          key={req.id}
          className="bg-white rounded-2xl border border-violet-100 shadow-sm p-4"
        >
          {/* Pet images */}
          <div className="flex items-center gap-3 mb-3">
            <div className="flex -space-x-3">
              {[req.senderPetImage, req.receiverPetImage].map((img, i) => (
                <div
                  key={i}
                  className="w-10 h-10 rounded-full border-2 border-white bg-violet-100 overflow-hidden flex items-center justify-center"
                >
                  {img ? (
                    <img
                      src={img}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-lg">🐾</span>
                  )}
                </div>
              ))}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-700 truncate">
                {req.senderName} →{" "}
                <span className="text-violet-600">{req.senderPetName}</span>
              </p>
              <p className="text-xs text-gray-400">
                {req.direction === "incoming" ? "Incoming request" : "Sent request"}
              </p>
            </div>
            <span
              className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                req.status === "accepted"
                  ? "bg-emerald-100 text-emerald-700"
                  : req.status === "declined"
                  ? "bg-red-100 text-red-600"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {req.status}
            </span>
          </div>

          {req.direction === "incoming" && req.status === "pending" && (
            <div className="flex gap-2">
              <button
                onClick={() => onAccept(req)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                <FaCheck size={11} /> Accept
              </button>
              <button
                onClick={() => onDecline(req)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-gray-100 hover:bg-red-100 text-gray-600 hover:text-red-600 text-sm font-semibold rounded-xl transition-colors"
              >
                <FaTimes size={11} /> Decline
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// ---- Main Component ----

export default function PetDashboard() {
  const navigate = useNavigate();
  const { petId } = useParams();
  const user = auth.currentUser;

  const [pet, setPet] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("features");
  const [matingRequests, setMatingRequests] = useState([]);
  const [posts, setPosts] = useState([]);
  const [events, setEvents] = useState([]);
  const [openMessageDialog, setOpenMessageDialog] = useState(false);
  const [currentMessage, setCurrentMessage] = useState({
    conversationId: null,
    recipientId: null,
    recipientName: null,
    senderPet: null,
    receiverPet: null,
  });

  // Wrap single-pet state for usePetOperations
  const [petsArr, setPetsArr] = useState([]);

  const petOps = usePetOperations(petsArr, (updater) => {
    const next =
      typeof updater === "function" ? updater(petsArr) : updater;
    setPetsArr(next);
    const updated = next.find((p) => p.id === petId);
    if (updated) setPet(updated);
  });

  // Pre-populate open/edit with current pet
  const openEditPet = useCallback(
    (p, section) => {
      petOps.handleEditPet(p || pet, section);
    },
    [pet, petOps]
  );

  // ---- Fetch pet data ----
  useEffect(() => {
    if (!user || !petId) return;
    const fetchData = async () => {
      try {
        const snap = await get(ref(database, `userPets/${user.uid}/${petId}`));
        if (snap.exists()) {
          const petData = { id: petId, ...snap.val() };
          setPet(petData);
          setPetsArr([petData]);
        } else {
          navigate("/my-pets", { replace: true });
        }
      } catch (err) {
        console.error("Error fetching pet:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user, petId, navigate]);

  // ---- Fetch posts & events for social tab ----
  useEffect(() => {
    if (!petId) return;
    const postsRef = ref(database, `petPosts/${petId}`);
    const eventsRef = ref(database, `petEvents/${petId}`);
    const unsubPosts = onValue(postsRef, (snap) => {
      if (snap.exists()) {
        const arr = [];
        snap.forEach((c) => arr.push({ id: c.key, ...c.val() }));
        arr.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        setPosts(arr);
      } else {
        setPosts([]);
      }
    });
    const unsubEvents = onValue(eventsRef, (snap) => {
      if (snap.exists()) {
        const arr = [];
        snap.forEach((c) => arr.push({ id: c.key, ...c.val() }));
        arr.sort((a, b) => new Date(a.date) - new Date(b.date));
        setEvents(arr);
      } else {
        setEvents([]);
      }
    });
    return () => {
      off(postsRef);
      off(eventsRef);
    };
  }, [petId]);

  // ---- Fetch mating requests for this pet ----
  useEffect(() => {
    if (!user || !petId) return;
    const fetchRequests = async () => {
      try {
        const [inSnap, outSnap] = await Promise.all([
          get(ref(database, `matingRequests/received/${user.uid}`)),
          get(ref(database, `matingRequests/sent/${user.uid}`)),
        ]);

        const processSnap = async (snapshot, direction) => {
          if (!snapshot.exists()) return [];
          const data = snapshot.val();
          const filtered = Object.keys(data)
            .map((id) => ({ id, ...data[id] }))
            .filter(
              (r) =>
                r.receiverPetId === petId ||
                r.senderPetId === petId
            );

          return Promise.all(
            filtered.map(async (req) => {
              const otherId =
                direction === "incoming" ? req.senderId : req.receiverId;
              const otherPetId =
                direction === "incoming" ? req.senderPetId : req.receiverPetId;
              const [userSnap, petSnap] = await Promise.all([
                get(ref(database, `users/${otherId}`)),
                get(ref(database, `userPets/${otherId}/${otherPetId}`)),
              ]);
              const ud = userSnap.exists() ? userSnap.val() : {};
              const pd = petSnap.exists() ? petSnap.val() : {};
              return {
                ...req,
                direction,
                senderName:
                  direction === "incoming" ? ud.displayName : user.displayName,
                senderPetName:
                  direction === "incoming" ? pd.name : pet?.name,
                senderPetImage:
                  direction === "incoming" ? pd.image : pet?.image,
                receiverPetImage:
                  direction === "outgoing" ? pd.image : pet?.image,
              };
            })
          );
        };

        const [incoming, outgoing] = await Promise.all([
          processSnap(inSnap, "incoming"),
          processSnap(outSnap, "outgoing"),
        ]);

        setMatingRequests([...incoming, ...outgoing].sort((a, b) => b.createdAt - a.createdAt));
      } catch (err) {
        console.error("Error fetching requests:", err);
      }
    };
    fetchRequests();
  }, [user, petId, pet?.name, pet?.image]);

  const pendingCount = matingRequests.filter(
    (r) => r.direction === "incoming" && r.status === "pending"
  ).length;

  // ---- Accept / Decline requests ----

  const handleUpdateRequest = useCallback(
    async (request, status) => {
      try {
        const ts = Date.now();
        await update(ref(database), {
          [`matingRequests/received/${user.uid}/${request.id}/status`]: status,
          [`matingRequests/received/${user.uid}/${request.id}/updatedAt`]: ts,
          [`matingRequests/sent/${request.senderId}/${request.id}/status`]: status,
          [`matingRequests/sent/${request.senderId}/${request.id}/updatedAt`]: ts,
        });
        setMatingRequests((prev) =>
          prev.map((r) => (r.id === request.id ? { ...r, status } : r))
        );
        if (status === "accepted") {
          const senderSnap = await get(
            ref(database, `users/${request.senderId}`)
          );
          if (senderSnap.exists()) {
            sendMatingRequestAcceptedNotification(
              senderSnap.val(),
              { uid: user.uid, displayName: user.displayName, email: user.email },
              request
            ).catch(() => {});
          }
        }
      } catch (err) {
        console.error("Error updating request:", err);
      }
    },
    [user]
  );

  const handleOpenConversation = useCallback((msg) => {
    setCurrentMessage(msg);
    setOpenMessageDialog(true);
  }, []);

  // ---- Navigation helpers ----

  const navToMates = () =>
    navigate("/nearby-mates", { state: { selectedPetId: petId } });

  const navToLostFound = () =>
    navigate("/lost-and-found");

  const navToReportLost = () =>
    navigate("/lost-and-found", { state: { openTab: "report-lost", petId } });

  const navToAdopt = () =>
    navigate("/adopt-pets", {
      state: { petType: pet?.type?.toLowerCase() },
    });

  const navToResources = () =>
    navigate("/resource", {
      state: {
        category:
          pet?.type?.toLowerCase() === "dog"
            ? "dog"
            : pet?.type?.toLowerCase() === "cat"
            ? "cat"
            : "all",
      },
    });

  const navToPlaces = () => navigate("/place-tagging");

  const copyPublicLink = () => {
    if (!pet?.slug) return;
    const url = `${window.location.origin}/pet/${pet.slug}`;
    navigator.clipboard.writeText(url).catch(() => {});
    window.open(url, "_blank");
  };

  // ---- Render ----

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-violet-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-violet-100 animate-pulse" />
          <div className="w-32 h-4 bg-violet-100 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (!pet) return null;

  const getNextBirthday = (dateOfBirth) => {
    if (!dateOfBirth) return null;
    const birth = new Date(dateOfBirth);
    const now = new Date();
    const next = new Date(now.getFullYear(), birth.getMonth(), birth.getDate());
    if (next < now) next.setFullYear(now.getFullYear() + 1);
    const daysUntil = Math.ceil((next - now) / (1000 * 60 * 60 * 24));
    return { date: next, daysUntil, isToday: daysUntil === 0 || daysUntil === 365 };
  };

  const birthday = getNextBirthday(pet?.dateOfBirth);

  const TABS = [
    { id: "features", label: "Dashboard", icon: "🏠" },
    { id: "health", label: "Health", icon: "🏥" },
    { id: "social", label: "Social", icon: "✨" },
    { id: "requests", label: "Requests", icon: "💕", badge: pendingCount },
    { id: "messages", label: "Messages", icon: "💬" },
  ];

  const petType = pet.type?.toLowerCase() ?? "";
  const resourceCategory =
    petType === "dog" ? "dog" : petType === "cat" ? "cat" : "all";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-violet-50">
      {/* ---- Header ---- */}
      <div className="bg-white/90 backdrop-blur-md border-b border-violet-100 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-8 h-14 flex items-center gap-3">
          <button
            onClick={() => navigate("/my-pets")}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-violet-600 font-medium transition-colors"
          >
            <FiArrowLeft size={16} />
            <span className="hidden sm:inline">My Pets</span>
          </button>
          <div className="w-px h-4 bg-gray-200" />
          <span className="font-bold text-slate-800 truncate">{pet.name}</span>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={copyPublicLink}
              className="p-2 rounded-lg text-gray-500 hover:text-violet-600 hover:bg-violet-50 transition-colors"
              title="Share public profile"
            >
              <FiShare2 size={16} />
            </button>
            <button
              onClick={() => openEditPet(pet, "basic")}
              className="flex items-center gap-1.5 text-sm text-violet-600 hover:text-violet-800 px-3 py-1.5 rounded-lg hover:bg-violet-50 transition-colors font-medium"
            >
              <FiEdit2 size={14} /> Edit
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-6">
        {/* ---- Pet Hero ---- */}
        <motion.div
          className="bg-white rounded-3xl shadow-md border border-violet-100 overflow-hidden mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex flex-col sm:flex-row">
            {/* Photo */}
            <div className="sm:w-48 h-48 bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center flex-shrink-0 relative overflow-hidden">
              {pet.image ? (
                <img
                  src={pet.image}
                  alt={pet.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-8xl select-none">{getPetEmoji(pet.type)}</span>
              )}
            </div>

            {/* Info */}
            <div className="p-5 flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h1 className="text-2xl font-bold text-slate-800 leading-tight">
                    {pet.name}
                  </h1>
                  <p className="text-gray-500 capitalize">
                    {[pet.breed || pet.type, pet.gender].filter(Boolean).join(" · ")}
                  </p>
                </div>
              </div>

              {/* Meta pills */}
              <div className="flex flex-wrap gap-2 mb-4">
                {getPetAge(pet.dateOfBirth) && (
                  <span className="text-xs bg-violet-100 text-violet-700 rounded-full px-3 py-1 font-medium">
                    🎂 {getPetAge(pet.dateOfBirth)}
                  </span>
                )}
                {pet.weight && (
                  <span className="text-xs bg-indigo-100 text-indigo-700 rounded-full px-3 py-1 font-medium">
                    ⚖️ {pet.weight} kg
                  </span>
                )}
                {pet.color && (
                  <span className="text-xs bg-pink-100 text-pink-700 rounded-full px-3 py-1 font-medium">
                    🎨 {pet.color}
                  </span>
                )}
              </div>

              {/* Availability toggles */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() =>
                    petOps.handleToggleAvailability(pet, "availableForMating")
                  }
                  className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                    pet.availableForMating
                      ? "bg-pink-500 text-white border-pink-500"
                      : "bg-white text-gray-500 border-gray-200 hover:border-pink-300"
                  }`}
                >
                  💕 {pet.availableForMating ? "Available for Mating" : "Not for Mating"}
                </button>
                <button
                  onClick={() =>
                    petOps.handleToggleAvailability(pet, "availableForAdoption")
                  }
                  className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                    pet.availableForAdoption
                      ? "bg-teal-500 text-white border-teal-500"
                      : "bg-white text-gray-500 border-gray-200 hover:border-teal-300"
                  }`}
                >
                  🏠 {pet.availableForAdoption ? "Up for Adoption" : "Not for Adoption"}
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ---- Tab bar ---- */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className="bg-white rounded-2xl border border-violet-100 shadow-sm p-1.5 flex gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-violet-500 to-indigo-500 text-white shadow-md"
                    : "text-gray-500 hover:bg-violet-50"
                }`}
              >
                {tab.badge != null && tab.badge > 0 && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-[9px] text-white font-bold">
                      {tab.badge}
                    </span>
                  </div>
                )}
                <span>{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* ---- Tab Content ---- */}
        <AnimatePresence mode="wait">
          {activeTab === "features" && (
            <motion.div
              key="features"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <FeatureTile
                  emoji="💕"
                  label="Find Mates"
                  description={`Find ${petType || "pet"} mates nearby`}
                  color="bg-pink-50 border-pink-100 hover:bg-pink-100"
                  onClick={navToMates}
                />
                <FeatureTile
                  emoji="🔍"
                  label="Lost & Found"
                  description="Report or browse lost pets"
                  color="bg-violet-50 border-violet-100 hover:bg-violet-100"
                  onClick={navToLostFound}
                />
                <FeatureTile
                  emoji="🚨"
                  label="Report as Lost"
                  description={`Alert community about ${pet.name}`}
                  color="bg-red-50 border-red-100 hover:bg-red-100"
                  onClick={navToReportLost}
                />
                <FeatureTile
                  emoji="🏠"
                  label="Adopt a Pet"
                  description={`Browse ${petType || "pet"}s for adoption`}
                  color="bg-teal-50 border-teal-100 hover:bg-teal-100"
                  onClick={navToAdopt}
                />
                <FeatureTile
                  emoji="📚"
                  label="Resources"
                  description={`Vets, groomers & more for ${pet.type || "your pet"}`}
                  color="bg-indigo-50 border-indigo-100 hover:bg-indigo-100"
                  onClick={navToResources}
                />
                <FeatureTile
                  emoji="�"
                  label="Tag a Place"
                  description="Mark pet-friendly spots"
                  color="bg-green-50 border-green-100 hover:bg-green-100"
                  onClick={navToPlaces}
                />
                <FeatureTile
                  emoji="�🔗"
                  label="Public Profile"
                  description="Share & view public profile"
                  color="bg-amber-50 border-amber-100 hover:bg-amber-100"
                  onClick={copyPublicLink}
                />
              </div>

              {/* Quick health summary on features tab */}
              {(pet.vaccinations?.length ?? 0) > 0 && (
                <div className="mt-6">
                  <div className="bg-white rounded-2xl border border-violet-100 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2">
                        <span className="text-lg">🏥</span> Health Snapshot
                      </h3>
                      <button
                        className="text-xs text-violet-500 hover:text-violet-700 font-semibold"
                        onClick={() => setActiveTab("health")}
                      >
                        View all →
                      </button>
                    </div>
                    <div className="space-y-2">
                      {pet.vaccinations.slice(0, 3).map((vac, idx) => {
                        const st = getVaccinationStatus(vac.nextDue);
                        return (
                          <div
                            key={idx}
                            className="flex items-center justify-between text-sm"
                          >
                            <span className="text-gray-600 truncate mr-3">
                              {vac.name}
                            </span>
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 ${VAC_COLORS[st]}`}
                            >
                              {st === "up-to-date" ? "✓ OK" : st === "due-soon" ? "Due soon" : st === "overdue" ? "Overdue" : "—"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "health" && (
            <motion.div
              key="health"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
            >
              <HealthTab
                pet={pet}
                onEditPet={openEditPet}
                onAddVaccination={petOps.handleAddVaccination}
                onEditVaccination={petOps.handleEditVaccination}
                onDeleteVaccination={petOps.handleDeleteVaccination}
              />
            </motion.div>
          )}

          {activeTab === "social" && (
            <motion.div
              key="social"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
            >
              <PetPostsFeed
                posts={posts}
                events={events}
                pet={pet}
                owner={{ displayName: user?.displayName, email: user?.email }}
                isOwner={true}
                currentUser={{ uid: user?.uid, name: user?.displayName, email: user?.email }}
                birthday={birthday}
                onShare={copyPublicLink}
              />
            </motion.div>
          )}

          {activeTab === "requests" && (
            <motion.div
              key="requests"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
            >
              <RequestsTab
                requests={matingRequests}
                onAccept={(r) => handleUpdateRequest(r, "accepted")}
                onDecline={(r) => handleUpdateRequest(r, "declined")}
              />
            </motion.div>
          )}

          {activeTab === "messages" && (
            <motion.div
              key="messages"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
            >
              <ConversationsList onOpenConversation={handleOpenConversation} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ---- Dialogs ---- */}
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
      {openMessageDialog && (
        <MessageDialog
          open={openMessageDialog}
          onClose={() => setOpenMessageDialog(false)}
          conversationId={currentMessage.conversationId}
          recipientId={currentMessage.recipientId}
          recipientName={currentMessage.recipientName}
          senderPet={currentMessage.senderPet}
          receiverPet={currentMessage.receiverPet}
        />
      )}
    </div>
  );
}
