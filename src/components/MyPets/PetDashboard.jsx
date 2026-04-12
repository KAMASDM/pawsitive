import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { auth, database } from "../../firebase";
import { ref, get, set, update, onValue, off } from "firebase/database";
import {
  FiArrowLeft,
  FiEdit2,
  FiShare2,
  FiChevronDown,
  FiChevronUp,
  FiChevronRight,
  FiMessageSquare,
  FiMapPin,
  FiAlertCircle,
  FiHeart,
  FiBook,
  FiActivity,
  FiGrid,
  FiX,
} from "react-icons/fi";
import {
  FaPaw,
  FaSyringe,
  FaExclamationTriangle,
  FaHeart,
  FaCheck,
  FaTimes,
  FaPlus,
  FaQrcode,
} from "react-icons/fa";
import { QRCodeSVG } from "qrcode.react";
import { usePetOperations } from "../../hooks/usePetOperations";
import {
  PetDialog,
  VaccinationDialog,
  MessageDialog,
} from "../Profile/components";
import ConversationsList from "../Profile/components/ConversationsList";
import PetPostsFeed from "../PetProfile/PetPostsFeed";
import { sendMatingRequestAcceptedNotification } from "../../services/notificationService";
import useResponsive from "../../hooks/useResponsive";

// ---- Helpers ----

const PET_EMOJI = { dog: "🐕", cat: "🐈", bird: "🦜", fish: "🐠", rabbit: "🐇", hamster: "🐹", turtle: "🐢" };
const getPetEmoji = (type) => PET_EMOJI[type?.toLowerCase()] ?? "🐾";

const getPetAge = (dateOfBirth) => {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  const now = new Date();
  const months = (now.getFullYear() - dob.getFullYear()) * 12 + (now.getMonth() - dob.getMonth());
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

const VAC_DOT = { "up-to-date": "#34d399", "due-soon": "#fbbf24", overdue: "#f87171", unknown: "#d1d5db" };

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

// Decorative paw SVG watermark
const PawPrint = ({ size = 24, color = "#fff", opacity = 0.1, rotate = 0 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill={color}
    opacity={opacity}
    style={{ transform: `rotate(${rotate}deg)` }}
  >
    <ellipse cx="16" cy="14" rx="7" ry="9" />
    <ellipse cx="32" cy="10" rx="7" ry="9" />
    <ellipse cx="48" cy="14" rx="7" ry="9" />
    <ellipse cx="8"  cy="28" rx="6" ry="8" />
    <path d="M32 56 C14 56 10 38 14 30 C18 22 46 22 50 30 C54 38 50 56 32 56Z" />
  </svg>
);

// ---- QR Modal ----
const QRModal = ({ url, petName, onClose }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center p-4"
    style={{ background: "rgba(0,0,0,0.55)" }}
    onClick={onClose}
  >
    <motion.div
      className="bg-white rounded-3xl p-7 flex flex-col items-center gap-4 max-w-xs w-full"
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between w-full">
        <h3 className="font-bold text-slate-800 text-base">Share {petName}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
          <FiX size={18} />
        </button>
      </div>
      <QRCodeSVG value={url} size={180} fgColor="#4c1d95" />
      <p className="text-xs text-gray-400 text-center break-all">{url}</p>
      <button
        onClick={() => { navigator.clipboard?.writeText(url); onClose(); }}
        className="w-full py-2.5 rounded-xl bg-violet-500 text-white text-sm font-semibold hover:bg-violet-600 transition-colors"
      >
        Copy Link
      </button>
    </motion.div>
  </div>
);

// ---- Feature action button (vertical: icon + label) ----
const ActionPill = ({ emoji, icon: Icon, label, badge, onClick, accent }) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center gap-1.5 flex-shrink-0 group"
  >
    <div
      className={`relative w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-active:scale-95 ${accent}`}
    >
      {emoji && <span className="text-2xl leading-none">{emoji}</span>}
      {Icon && <Icon size={22} className="text-white" />}
      {badge > 0 && (
        <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center px-1">
          <span className="text-[9px] text-white font-bold">{badge}</span>
        </div>
      )}
    </div>
    <span className="text-[10px] font-semibold text-gray-600 text-center leading-tight max-w-[60px]">
      {label}
    </span>
  </button>
);

// ---- Health Widget ----
const HealthWidget = ({ pet, onAdd, onEdit, onDelete, onViewAll }) => {
  const [expanded, setExpanded] = useState(false);
  const vaccinations = pet?.vaccinations || [];

  const worstStatus = vaccinations.reduce((worst, vac) => {
    const s = getVaccinationStatus(vac.nextDue);
    if (s === "overdue") return "overdue";
    if (s === "due-soon" && worst !== "overdue") return "due-soon";
    if (s === "up-to-date" && worst === "unknown") return "up-to-date";
    return worst;
  }, "unknown");

  const statusLabel = { "up-to-date": "All vaccinations up to date", "due-soon": "Vaccination due soon", overdue: "Vaccination overdue!", unknown: "No vaccinations recorded" };
  const statusColor = { "up-to-date": "text-emerald-600", "due-soon": "text-amber-600", overdue: "text-red-600", unknown: "text-gray-400" };
  const statusBg = { "up-to-date": "bg-emerald-50 border-emerald-100", "due-soon": "bg-amber-50 border-amber-100", overdue: "bg-red-50 border-red-100", unknown: "bg-gray-50 border-gray-100" };

  return (
    <div className={`rounded-2xl border overflow-hidden ${statusBg[worstStatus]}`}>
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
      >
        <FaSyringe className={`flex-shrink-0 ${statusColor[worstStatus]}`} size={14} />
        <span className={`text-sm font-semibold flex-1 ${statusColor[worstStatus]}`}>
          {statusLabel[worstStatus]}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onAdd(); }}
            className="text-xs font-semibold text-violet-600 hover:text-violet-800 bg-white/70 px-2 py-0.5 rounded-full"
          >
            + Add
          </button>
          {expanded ? (
            <FiChevronUp size={14} className="text-gray-400" />
          ) : (
            <FiChevronDown size={14} className="text-gray-400" />
          )}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 space-y-2">
              {vaccinations.length === 0 ? (
                <p className="text-sm text-gray-400 py-2 text-center">
                  No vaccinations recorded.
                </p>
              ) : (
                vaccinations.map((vac, idx) => {
                  const st = getVaccinationStatus(vac.nextDue);
                  return (
                    <div
                      key={vac.id || idx}
                      className="flex items-center justify-between bg-white rounded-xl px-3 py-2.5 shadow-sm"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">{vac.name}</p>
                        <p className="text-[10px] text-gray-400">
                          {vac.nextDue ? `Due: ${formatDate(vac.nextDue)}` : "No due date"}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${VAC_COLORS[st]}`}
                        >
                          {st === "up-to-date" ? "✓ OK" : st === "due-soon" ? "Due soon" : st === "overdue" ? "Overdue" : "—"}
                        </span>
                        <button onClick={() => onEdit(vac, idx)} className="text-gray-300 hover:text-violet-500 p-0.5">
                          <FiEdit2 size={11} />
                        </button>
                        <button onClick={() => onDelete(idx)} className="text-gray-300 hover:text-red-500 p-0.5">
                          <FaTimes size={10} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
              {vaccinations.length > 0 && (
                <button
                  onClick={onViewAll}
                  className="w-full text-xs text-violet-500 hover:text-violet-700 font-semibold py-1"
                >
                  View full health record →
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ---- Inline Requests section ----
const RequestsInline = ({ requests, onAccept, onDecline }) => {
  const pending = requests.filter((r) => r.direction === "incoming" && r.status === "pending");
  const [open, setOpen] = useState(true);

  if (pending.length === 0) return null;

  return (
    <div className="rounded-2xl border border-pink-200 bg-pink-50 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-4 py-3 text-left"
      >
        <FaHeart className="text-pink-500 flex-shrink-0" size={13} />
        <span className="text-sm font-semibold text-pink-700 flex-1">
          {pending.length} mating request{pending.length > 1 ? "s" : ""} waiting
        </span>
        {open ? <FiChevronUp size={14} className="text-pink-400" /> : <FiChevronDown size={14} className="text-pink-400" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 space-y-2.5">
              {pending.map((req) => (
                <div
                  key={req.id}
                  className="bg-white rounded-xl p-3.5 flex items-center gap-3 shadow-sm"
                >
                  <div className="flex -space-x-2 flex-shrink-0">
                    {[req.senderPetImage, req.receiverPetImage].map((img, i) => (
                      <div
                        key={i}
                        className="w-9 h-9 rounded-full border-2 border-white bg-violet-100 overflow-hidden flex items-center justify-center"
                      >
                        {img ? <img src={img} alt="" className="w-full h-full object-cover" /> : <span className="text-base">🐾</span>}
                      </div>
                    ))}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-700 truncate">{req.senderPetName}</p>
                    <p className="text-[10px] text-gray-400">from {req.senderName}</p>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => onAccept(req)}
                      className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 transition-colors"
                    >
                      <FaCheck size={11} />
                    </button>
                    <button
                      onClick={() => onDecline(req)}
                      className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-red-100 hover:text-red-500 transition-colors"
                    >
                      <FaTimes size={11} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ---- Main Component ----

export default function PetDashboard() {
  const navigate = useNavigate();
  const { petId } = useParams();
  const { isDesktop } = useResponsive();
  const user = auth.currentUser;

  const [pet, setPet] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [matingRequests, setMatingRequests] = useState([]);
  const [posts, setPosts] = useState([]);
  const [events, setEvents] = useState([]);
  const [showQR, setShowQR] = useState(false);
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
    const next = typeof updater === "function" ? updater(petsArr) : updater;
    setPetsArr(next);
    const updated = next.find((p) => p.id === petId);
    if (updated) setPet(updated);
  });

  const openEditPet = useCallback(
    (p, section) => { petOps.handleEditPet(p || pet, section); },
    [pet, petOps]
  );

  // Save last viewed pet id for auto-redirect
  useEffect(() => {
    if (petId) localStorage.setItem("pawppy_last_pet_id", petId);
  }, [petId]);

  // Load pet data
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
          navigate("/my-pets?picker=true", { replace: true });
        }
      } catch (err) {
        console.error("Error fetching pet:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user, petId, navigate]);

  // Posts + Events listeners
  useEffect(() => {
    if (!petId) return;
    const postsRef = ref(database, `petPosts/${petId}`);
    const eventsRef = ref(database, `petEvents/${petId}`);
    onValue(postsRef, (snap) => {
      if (snap.exists()) {
        const arr = [];
        snap.forEach((c) => { arr.push({ id: c.key, ...c.val() }); });
        arr.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        setPosts(arr);
      } else setPosts([]);
    });
    onValue(eventsRef, (snap) => {
      if (snap.exists()) {
        const arr = [];
        snap.forEach((c) => { arr.push({ id: c.key, ...c.val() }); });
        arr.sort((a, b) => new Date(a.date) - new Date(b.date));
        setEvents(arr);
      } else setEvents([]);
    });
    return () => { off(postsRef); off(eventsRef); };
  }, [petId]);

  // Mating requests
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
            .filter((r) => r.receiverPetId === petId || r.senderPetId === petId);
          return Promise.all(
            filtered.map(async (req) => {
              const otherId = direction === "incoming" ? req.senderId : req.receiverId;
              const otherPetId = direction === "incoming" ? req.senderPetId : req.receiverPetId;
              const [userSnap, petSnap] = await Promise.all([
                get(ref(database, `users/${otherId}`)),
                get(ref(database, `userPets/${otherId}/${otherPetId}`)),
              ]);
              const ud = userSnap.exists() ? userSnap.val() : {};
              const pd = petSnap.exists() ? petSnap.val() : {};
              return {
                ...req,
                direction,
                senderName: direction === "incoming" ? ud.displayName : user.displayName,
                senderPetName: direction === "incoming" ? pd.name : pet?.name,
                senderPetImage: direction === "incoming" ? pd.image : pet?.image,
                receiverPetImage: direction === "outgoing" ? pd.image : pet?.image,
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
          const senderSnap = await get(ref(database, `users/${request.senderId}`));
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

  const publicUrl = pet?.slug ? `${window.location.origin}/pet/${pet.slug}` : "";

  const shareProfile = () => {
    if (navigator.share && publicUrl) {
      navigator.share({ title: pet.name, url: publicUrl }).catch(() => {});
    } else if (publicUrl) {
      navigator.clipboard?.writeText(publicUrl).catch(() => {});
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-violet-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-violet-100 animate-pulse" />
          <div className="w-36 h-4 bg-violet-100 rounded animate-pulse" />
          <div className="w-24 h-3 bg-violet-50 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (!pet) return null;

  const petType = pet.type?.toLowerCase() ?? "";

  const navToMates = () => navigate("/nearby-mates", { state: { selectedPetId: petId } });
  const navToLostFound = () => navigate("/lost-and-found");
  const navToReportLost = () => navigate("/lost-and-found", { state: { openTab: "report-lost", petId } });
  const navToAdopt = () => navigate("/adopt-pets", { state: { petType } });
  const navToResources = () => navigate("/resource", { state: { category: petType === "dog" ? "dog" : petType === "cat" ? "cat" : "all" } });
  const navToPlaces = () => navigate("/place-tagging");
  const navToMessages = () => navigate("/profile", { state: { tab: "messages" } });

  // ---- Shared pill/chip ----
  const InfoChip = ({ label }) => (
    <span className="text-xs bg-white/20 text-white rounded-full px-3 py-0.5 backdrop-blur-sm">{label}</span>
  );

  // ---- MOBILE LAYOUT ----
  const mobileLayout = (
    <div className="min-h-screen bg-slate-50 pb-10">
      {/* Sticky top bar */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-violet-100 sticky top-0 z-30 h-14 flex items-center px-4 gap-3">
        <button
          onClick={() => navigate("/my-pets?picker=true")}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-violet-600 font-medium transition-colors"
        >
          <FiArrowLeft size={16} />
          <span>My Pets</span>
        </button>
        <span className="font-bold text-slate-800 truncate flex-1 text-center">{pet.name}</span>
        <button
          onClick={() => openEditPet(pet, "basic")}
          className="flex items-center gap-1.5 text-xs font-semibold text-violet-600 bg-violet-50 hover:bg-violet-100 px-3 py-1.5 rounded-full transition-colors"
        >
          <FiEdit2 size={13} /> Edit
        </button>
      </div>

      {/* Social Profile Hero */}
      <div
        className="relative pt-8 pb-0 overflow-hidden"
        style={{ background: "linear-gradient(160deg, #6d5dbf 0%, #4a3d7d 60%, #2e2550 100%)" }}
      >
        {/* Decorative paw watermarks */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <PawPrint size={80} opacity={0.07} rotate={-20} />
          <div className="absolute bottom-10 right-4"><PawPrint size={60} opacity={0.06} rotate={15} /></div>
          <div className="absolute top-5 right-8"><PawPrint size={45} opacity={0.05} rotate={0} /></div>
        </div>

        {/* Avatar */}
        <div className="relative z-10 flex flex-col items-center px-6">
          <div className="w-24 h-24 rounded-full border-4 border-white/40 overflow-hidden bg-violet-300 shadow-2xl mb-3 flex items-center justify-center">
            {pet.image ? (
              <img src={pet.image} alt={pet.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-5xl select-none">{PET_EMOJI[petType] || "🐾"}</span>
            )}
          </div>

          {/* Name & breed */}
          <h1 className="text-2xl font-bold text-white leading-tight">{pet.name}</h1>
          <p className="text-violet-200 text-sm mt-0.5 capitalize">
            {[pet.breed || pet.type, pet.gender].filter(Boolean).join(" · ")}
          </p>

          {/* Stats row */}
          <div className="flex gap-4 mt-3 text-white text-center">
            <div>
              <p className="text-lg font-bold leading-none">{posts.length}</p>
              <p className="text-[11px] text-violet-300">Posts</p>
            </div>
            <div className="w-px bg-white/20" />
            <div>
              <p className="text-lg font-bold leading-none">{events.length}</p>
              <p className="text-[11px] text-violet-300">Events</p>
            </div>
            {(pet.vaccinations?.length ?? 0) > 0 && (
              <>
                <div className="w-px bg-white/20" />
                <div>
                  <p className="text-lg font-bold leading-none">{pet.vaccinations.length}</p>
                  <p className="text-[11px] text-violet-300">Vaccines</p>
                </div>
              </>
            )}
          </div>

          {/* Info chips */}
          <div className="flex flex-wrap justify-center gap-1.5 mt-3">
            {getPetAge(pet.dateOfBirth) && <InfoChip label={`🎂 ${getPetAge(pet.dateOfBirth)}`} />}
            {pet.weight && <InfoChip label={`⚖️ ${pet.weight} kg`} />}
            {pet.color && <InfoChip label={`🎨 ${pet.color}`} />}
          </div>

          {/* Availability toggle pills */}
          <div className="flex gap-2 mt-3 flex-wrap justify-center">
            <button
              onClick={() => petOps.handleToggleAvailability(pet, "availableForMating")}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                pet.availableForMating
                  ? "bg-pink-500 text-white border-pink-500"
                  : "bg-white/10 text-violet-200 border-white/20 hover:bg-white/20"
              }`}
            >
              💕 {pet.availableForMating ? "Available for Mating" : "Not for Mating"}
            </button>
            <button
              onClick={() => petOps.handleToggleAvailability(pet, "availableForAdoption")}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                pet.availableForAdoption
                  ? "bg-teal-500 text-white border-teal-500"
                  : "bg-white/10 text-violet-200 border-white/20 hover:bg-white/20"
              }`}
            >
              🏠 {pet.availableForAdoption ? "Up for Adoption" : "Not for Adoption"}
            </button>
          </div>

          {/* Action row: Share + QR + Profile */}
          <div className="flex gap-2 mt-4 mb-0">
            <button
              onClick={shareProfile}
              className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white text-xs font-semibold px-4 py-2 rounded-full transition-colors backdrop-blur-sm"
            >
              <FiShare2 size={13} /> Share
            </button>
            <button
              onClick={() => setShowQR(true)}
              className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white text-xs font-semibold px-4 py-2 rounded-full transition-colors backdrop-blur-sm"
            >
              <FaQrcode size={13} /> QR Code
            </button>
            {pet.slug && (
              <button
                onClick={() => window.open(publicUrl, "_blank")}
                className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white text-xs font-semibold px-4 py-2 rounded-full transition-colors backdrop-blur-sm"
              >
                🔗 Profile
              </button>
            )}
          </div>
        </div>

        {/* Curved white bottom */}
        <div className="mt-6 h-8 bg-slate-50" style={{ borderRadius: "60% 60% 0 0 / 100% 100% 0 0" }} />
      </div>

      {/* Feature Actions Grid — 4-across with colourful gradients */}
      <div className="px-4 mt-2">
        <div className="grid grid-cols-4 gap-3">
          {[
            { emoji: "💕", label: "Find Mates",   onClick: navToMates                                           },
            { emoji: "🚨", label: "Lost & Found", onClick: navToReportLost                                      },
            { emoji: "🏠", label: "Adoption",     onClick: navToAdopt                                           },
            { emoji: "📚", label: "Resources",    onClick: navToResources                                       },
            { emoji: "📍", label: "Tag Place",    onClick: navToPlaces                                          },
            { emoji: "💬", label: "Messages",     onClick: navToMessages,  badge: 0                             },
            { emoji: "🏥", label: "Health",       onClick: () => openEditPet(pet, "vaccinations")               },
            { emoji: "❤️", label: "Requests",     onClick: () => {},       badge: pendingCount                   },
          ].map(({ emoji, label, onClick, badge, grad }) => (
            <button
              key={label}
              onClick={onClick}
              className="flex flex-col items-center gap-1.5 group"
            >
              <div className="relative w-full aspect-square max-w-[56px] mx-auto rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center shadow-sm group-active:scale-95 transition-transform">
                <span className="text-2xl leading-none">{emoji}</span>
                {badge > 0 && (
                  <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center px-1">
                    <span className="text-[9px] text-white font-bold">{badge}</span>
                  </div>
                )}
              </div>
              <span className="text-[10px] font-semibold text-gray-500 text-center leading-tight">
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Health Widget */}
      {(pet.vaccinations?.length ?? 0) > 0 && (
        <div className="px-4 mt-4">
          <HealthWidget
            pet={pet}
            onAdd={petOps.handleAddVaccination}
            onEdit={petOps.handleEditVaccination}
            onDelete={petOps.handleDeleteVaccination}
            onViewAll={() => openEditPet(pet, "vaccinations")}
          />
        </div>
      )}

      {/* Inline Mating Requests Banner */}
      {pendingCount > 0 && (
        <div className="px-4 mt-4">
          <RequestsInline
            requests={matingRequests}
            onAccept={(r) => handleUpdateRequest(r, "accepted")}
            onDecline={(r) => handleUpdateRequest(r, "declined")}
          />
        </div>
      )}

      {/* Feed Section: Posts + Events */}
      <div className="mt-6">
        <PetPostsFeed
          embedded
          posts={posts}
          events={events}
          pet={pet}
          isOwner={true}
          currentUser={{ uid: user?.uid, name: user?.displayName, email: user?.email }}
        />
      </div>
    </div>
  );

  // ---- DESKTOP LAYOUT ----
  const desktopLayout = (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop top bar */}
      <div className="bg-white/95 backdrop-blur-sm border-b border-violet-100 sticky top-0 z-30 h-14 flex items-center px-8 gap-4" style={{ boxShadow: "0 1px 0 0 rgba(109,93,191,0.08)" }}>
        <button
          onClick={() => navigate("/my-pets?picker=true")}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-violet-600 font-medium transition-colors"
        >
          <FiArrowLeft size={16} /> My Pets
        </button>
        <div className="w-px h-4 bg-gray-200" />
        <span className="font-bold text-slate-800 truncate">{pet.name}</span>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={shareProfile} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-violet-600 px-3 py-1.5 rounded-full hover:bg-violet-50 transition-colors">
            <FiShare2 size={14} /> Share
          </button>
          <button
            onClick={() => openEditPet(pet, "basic")}
            className="flex items-center gap-1.5 text-sm font-semibold text-white bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 px-4 py-1.5 rounded-full transition-all shadow-sm"
          >
            <FiEdit2 size={13} /> Edit Profile
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8 flex gap-8">
        {/* Left sidebar */}
        <aside className="w-72 flex-shrink-0 space-y-5 sticky top-20 self-start">
          {/* Profile card */}
          <div
            className="rounded-3xl overflow-hidden shadow-lg"
            style={{ background: "linear-gradient(160deg, #6d5dbf 0%, #4a3d7d 60%, #2e2550 100%)" }}
          >
            <div className="relative p-6 flex flex-col items-center text-center">
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <PawPrint size={70} opacity={0.07} rotate={-10} />
              </div>
              <div className="w-20 h-20 rounded-full border-4 border-white/40 overflow-hidden bg-violet-300 shadow-xl mb-3 flex items-center justify-center">
                {pet.image ? (
                  <img src={pet.image} alt={pet.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl select-none">{PET_EMOJI[petType] || "🐾"}</span>
                )}
              </div>
              <h2 className="text-xl font-bold text-white">{pet.name}</h2>
              <p className="text-violet-200 text-xs mt-0.5 capitalize mb-3">
                {[pet.breed || pet.type, pet.gender].filter(Boolean).join(" · ")}
              </p>
              <div className="flex gap-4 text-white text-center mb-4 w-full justify-center">
                <div><p className="text-base font-bold">{posts.length}</p><p className="text-[10px] text-violet-300">Posts</p></div>
                <div className="w-px bg-white/20" />
                <div><p className="text-base font-bold">{events.length}</p><p className="text-[10px] text-violet-300">Events</p></div>
              </div>
              <div className="flex flex-wrap gap-1.5 justify-center mb-4">
                {getPetAge(pet.dateOfBirth) && <InfoChip label={`🎂 ${getPetAge(pet.dateOfBirth)}`} />}
                {pet.weight && <InfoChip label={`⚖️ ${pet.weight} kg`} />}
              </div>
              <div className="flex gap-2 justify-center">
                <button onClick={shareProfile} className="flex items-center gap-1 bg-white/15 hover:bg-white/25 text-white text-xs font-semibold px-3 py-1.5 rounded-full transition-colors">
                  <FiShare2 size={12} /> Share
                </button>
                <button onClick={() => setShowQR(true)} className="flex items-center gap-1 bg-white/15 hover:bg-white/25 text-white text-xs font-semibold px-3 py-1.5 rounded-full transition-colors">
                  <FaQrcode size={12} /> QR
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 justify-center mt-3">
                <button
                  onClick={() => petOps.handleToggleAvailability(pet, "availableForMating")}
                  className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${pet.availableForMating ? "bg-pink-500 text-white border-pink-500" : "bg-white/10 text-violet-200 border-white/20"}`}
                >
                  💕 {pet.availableForMating ? "For Mating" : "Not for Mating"}
                </button>
                <button
                  onClick={() => petOps.handleToggleAvailability(pet, "availableForAdoption")}
                  className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${pet.availableForAdoption ? "bg-teal-500 text-white border-teal-500" : "bg-white/10 text-violet-200 border-white/20"}`}
                >
                  🏠 {pet.availableForAdoption ? "For Adoption" : "Not for Adoption"}
                </button>
              </div>
            </div>
          </div>

          {/* Health widget */}
          {(pet.vaccinations?.length ?? 0) > 0 && (
            <HealthWidget
              pet={pet}
              onAdd={petOps.handleAddVaccination}
              onEdit={petOps.handleEditVaccination}
              onDelete={petOps.handleDeleteVaccination}
              onViewAll={() => openEditPet(pet, "vaccinations")}
            />
          )}

          {/* Pending requests */}
          {pendingCount > 0 && (
            <RequestsInline
              requests={matingRequests}
              onAccept={(r) => handleUpdateRequest(r, "accepted")}
              onDecline={(r) => handleUpdateRequest(r, "declined")}
            />
          )}

          {/* Feature nav */}
          <div className="bg-white rounded-2xl border border-violet-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-violet-50">
              <p className="text-[11px] font-bold text-violet-400 uppercase tracking-widest">Quick Actions</p>
            </div>
            <div className="p-2 space-y-0.5">
              {[
                { emoji: "💕", label: "Find Mates",   onClick: navToMates                                      },
                { emoji: "🚨", label: "Report Lost",  onClick: navToReportLost                                 },
                { emoji: "🏠", label: "Adopt a Pet",  onClick: navToAdopt                                      },
                { emoji: "📚", label: "Resources",    onClick: navToResources                                  },
                { emoji: "📍", label: "Tag a Place",  onClick: navToPlaces                                     },
                { emoji: "💬", label: "Messages",     onClick: navToMessages                                   },
                { emoji: "🏥", label: "Health Log",   onClick: () => openEditPet(pet, "vaccinations")          },
              ].map(({ emoji, label, onClick, grad }) => (
                <button
                  key={label}
                  onClick={onClick}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-violet-50 hover:text-violet-700 transition-colors text-left group"
                >
                  <div className="w-8 h-8 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center flex-shrink-0 group-hover:bg-violet-100 group-hover:scale-105 transition-all">
                    <span className="text-base leading-none">{emoji}</span>
                  </div>
                  <span className="flex-1">{label}</span>
                  <FiChevronRight size={13} className="text-gray-300 group-hover:text-violet-400 transition-colors" />
                </button>
              ))}
              {/* Provision slot for future features */}
              <div className="mt-2 px-3 py-2.5 rounded-xl border border-dashed border-violet-100 flex items-center gap-3 text-gray-300">
                <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
                  <span className="text-base leading-none">✨</span>
                </div>
                <span className="text-xs font-medium">More coming soon</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main feed column */}
        <main className="flex-1 min-w-0">
          <PetPostsFeed
            embedded
            posts={posts}
            events={events}
            pet={pet}
            isOwner={true}
            currentUser={{ uid: user?.uid, name: user?.displayName, email: user?.email }}
          />
        </main>
      </div>
    </div>
  );

  return (
    <>
      {isDesktop ? desktopLayout : mobileLayout}

      {/* QR modal */}
      {showQR && publicUrl && (
        <QRModal url={publicUrl} petName={pet.name} onClose={() => setShowQR(false)} />
      )}

      {/* Pet dialogs */}
      {petOps.openPetDialog && (
        <PetDialog
          open={petOps.openPetDialog}
          onClose={() => petOps.setOpenPetDialog(false)}
          pet={petOps.currentPet}
          setPet={petOps.setCurrentPet}
          onSave={petOps.handleSavePet}
          isEditMode={petOps.isEditMode}
          onAddVaccination={petOps.handleAddVaccination}
          onEditVaccination={petOps.handleEditVaccination}
          onDeleteVaccination={petOps.handleDeleteVaccination}
          tabValue={petOps.tabValue}
          onTabChange={(_, val) => petOps.setTabValue(val)}
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
    </>
  );
}
