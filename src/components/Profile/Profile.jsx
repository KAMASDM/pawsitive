import { readPetSnapshot, readUserSnapshot } from "../../services/profileData";
import { trackProductEvent } from "../../services/productAnalytics";
import React, { useEffect, useState, useCallback, memo, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { auth, database } from "../../firebase";
import { ref, set, get, update, remove } from "firebase/database";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FiArrowRight,
  FiEdit3,
  FiHeart,
  FiHome,
  FiMail,
  FiMapPin,
  FiPlus,
  FiUsers,
} from "react-icons/fi";
import useResponsive from "../../hooks/useResponsive";
import { FaPaw, FaHeart, FaCommentDots, FaBalanceScale } from "react-icons/fa";
import MultiPetCompare from "../PetProfile/MultiPetCompare";
import { sendMatingRequestAcceptedNotification } from "../../services/notificationService";
import { clearUnreadNotifications } from "../../services/badgeService";
import {
  PetDialog,
  VaccinationDialog,
  MessageDialog,
  UserProfileDialog,
  PetsSection as PetsSectionComponent,
  DesktopPetsSection as DesktopPetsSectionComponent,
  RequestsSection as RequestsSectionComponent,
  DesktopRequestsSection as DesktopRequestsSectionComponent,
} from "./components";
import ConversationsList from "./components/ConversationsList";

// Memoize components to prevent unnecessary re-renders
const PetsSection = memo(PetsSectionComponent);
const DesktopPetsSection = memo(DesktopPetsSectionComponent);
const RequestsSection = memo(RequestsSectionComponent);
const DesktopRequestsSection = memo(DesktopRequestsSectionComponent);
const ConversationsListSection = memo(ConversationsList);

// --- Responsive Profile Experience ---

const ProfileExperience = ({
  isDesktop,
  user,
  pets,
  matingRequests,
  activeTab,
  setActiveTab,
  tabs,
  handleAddPet,
  handleEditPet,
  handleDeletePet,
  handleToggleAvailability,
  handleAcceptRequest,
  handleDeclineRequest,
  handleOpenMessageDialog,
  handleEditProfile,
  navigate,
  isLoading,
}) => {
  const pendingCount = matingRequests.filter(
    (request) => request.direction === "incoming" && request.status === "pending"
  ).length;
  const publicProfiles = pets.filter((pet) => Boolean(pet.slug)).length;
  const initials = user.displayName
    ?.split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "P";
  const locationLabel = [user.city, user.country].filter(Boolean).join(", ");
  const activeTabDetails = tabs.find((tab) => tab.id === activeTab) || tabs[0];

  const quickActions = [
    {
      label: "Add a pet",
      detail: "Create a care profile",
      icon: FiPlus,
      onClick: handleAddPet,
      accent: "bg-violet-600 text-white",
    },
    {
      label: "Find matches",
      detail: "Discover nearby pets",
      icon: FiHeart,
      onClick: () => navigate("/nearby-mates"),
      accent: "bg-rose-50 text-rose-600",
    },
    {
      label: "Adopt a pet",
      detail: "Browse pets needing homes",
      icon: FiHome,
      onClick: () => navigate("/adopt-pets"),
      accent: "bg-emerald-50 text-emerald-600",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f7f5fb] pb-28 lg:pb-14">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8 lg:py-9">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="grid gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.55fr)] lg:gap-6"
        >
          <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#6d5dbf] via-[#51428e] to-[#30264f] p-5 text-white shadow-[0_20px_55px_rgba(64,48,112,0.2)] sm:p-7 lg:min-h-[292px] lg:p-9">
            <div className="pointer-events-none absolute -right-14 -top-20 h-56 w-56 rounded-full border border-white/10 bg-white/[0.04]" />
            <div className="pointer-events-none absolute -bottom-28 right-24 h-64 w-64 rounded-full border border-white/10" />
            <FaPaw className="pointer-events-none absolute right-8 top-16 rotate-12 text-6xl text-white/[0.06] lg:right-14 lg:text-8xl" />

            <div className="relative z-10 flex items-start justify-between gap-4">
              <div>
                <div className="mb-1 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-violet-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-300" />
                  Your Pawppy account
                </div>
                <p className="text-sm text-white/60">Everything about you and your pet family, together.</p>
              </div>
              <button
                type="button"
                onClick={handleEditProfile}
                className="flex shrink-0 items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-bold text-white backdrop-blur transition hover:bg-white/20"
              >
                <FiEdit3 size={14} />
                <span className="hidden sm:inline">Edit account</span>
                <span className="sm:hidden">Edit</span>
              </button>
            </div>

            <div className="relative z-10 mt-7 flex items-center gap-4 sm:gap-5">
              <div className="flex h-[74px] w-[74px] shrink-0 items-center justify-center rounded-[24px] border border-white/20 bg-white/15 text-2xl font-black shadow-inner backdrop-blur sm:h-24 sm:w-24 sm:text-3xl">
                {initials}
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-2xl font-black tracking-tight sm:text-3xl">
                  {user.displayName || "Pet Parent"}
                </h1>
                <div className="mt-2 flex min-w-0 items-center gap-2 text-xs text-white/70 sm:text-sm">
                  <FiMail className="shrink-0" />
                  <span className="truncate">{user.email}</span>
                </div>
                {locationLabel && (
                  <div className="mt-1.5 flex items-center gap-2 text-xs text-white/60 sm:text-sm">
                    <FiMapPin className="shrink-0" />
                    <span className="truncate">{locationLabel}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="relative z-10 mt-7 grid grid-cols-3 gap-2 sm:max-w-xl sm:gap-3">
              {[
                { value: isLoading ? "—" : pets.length, label: pets.length === 1 ? "Pet" : "Pets" },
                { value: isLoading ? "—" : publicProfiles, label: "Social profiles" },
                { value: isLoading ? "—" : pendingCount, label: "Pending" },
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/[0.09] px-2 py-3 text-center backdrop-blur-sm sm:px-4">
                  <p className="text-xl font-black leading-none sm:text-2xl">{stat.value}</p>
                  <p className="mt-1.5 truncate text-[10px] font-semibold text-white/60 sm:text-xs">{stat.label}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[28px] border border-violet-100 bg-white p-4 shadow-[0_14px_40px_rgba(74,61,125,0.08)] sm:p-5">
            <div className="mb-4 flex items-center justify-between px-1">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">Quick actions</h2>
                <p className="mt-0.5 text-xs text-slate-500">Your most useful next steps</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <FaPaw size={16} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 lg:grid-cols-1 lg:gap-2.5">
              {quickActions.map(({ label, detail, icon: Icon, onClick, accent }) => (
                <button
                  type="button"
                  key={label}
                  onClick={onClick}
                  className="group flex min-w-0 flex-col items-center rounded-2xl border border-slate-100 bg-slate-50/70 p-3 text-center transition hover:border-violet-200 hover:bg-violet-50/60 lg:flex-row lg:p-3.5 lg:text-left"
                >
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${accent}`}>
                    <Icon size={18} />
                  </span>
                  <span className="mt-2 min-w-0 lg:ml-3 lg:mt-0 lg:flex-1">
                    <span className="block truncate text-[11px] font-extrabold text-slate-800 sm:text-xs lg:text-sm">{label}</span>
                    <span className="mt-0.5 hidden text-xs text-slate-500 lg:block">{detail}</span>
                  </span>
                  <FiArrowRight className="hidden text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-violet-500 lg:block" />
                </button>
              ))}
            </div>
          </section>
        </motion.div>

        <motion.nav
          aria-label="Profile sections"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.3 }}
          className="mt-5 grid grid-cols-4 gap-1 rounded-[22px] border border-violet-100 bg-white p-1.5 shadow-[0_8px_28px_rgba(74,61,125,0.07)] sm:gap-2 sm:p-2"
        >
          {tabs.map((tab) => (
            <button
              type="button"
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              aria-current={activeTab === tab.id ? "page" : undefined}
              className={`relative flex min-w-0 items-center justify-center gap-2 rounded-2xl px-1.5 py-3 text-[11px] font-bold transition sm:px-4 sm:text-sm ${
                activeTab === tab.id
                  ? "bg-[#4e417f] text-white shadow-[0_8px_18px_rgba(78,65,127,0.22)]"
                  : "text-slate-500 hover:bg-violet-50 hover:text-violet-700"
              }`}
            >
              <span className="text-sm sm:text-base">{tab.icon}</span>
              <span className="truncate">{tab.shortLabel || tab.label}</span>
              {tab.badge > 0 && (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-black text-white sm:static sm:h-5 sm:min-w-5 sm:text-[10px]">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </motion.nav>

        <div className="mb-4 mt-6 flex items-end justify-between gap-4 px-1 sm:mb-5 sm:mt-8">
          <div>
            <div className="mb-1 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-violet-500">
              <FiUsers /> Account workspace
            </div>
            <h2 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl">{activeTabDetails.label}</h2>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500 sm:text-sm">{activeTabDetails.description}</p>
          </div>
          {activeTab === "pets" && (
            <button
              type="button"
              onClick={handleAddPet}
              className="hidden shrink-0 items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-violet-700 sm:flex"
            >
              <FiPlus /> Add pet
            </button>
          )}
        </div>

        <motion.main
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14, duration: 0.3 }}
        >
          {isLoading ? (
            <div className={`grid gap-3 ${isDesktop ? "md:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"}`} aria-label="Loading pet information">
              {[0, 1, 2].map((item) => (
                <div key={item} className={`animate-pulse rounded-[22px] border border-violet-100 bg-white p-3 ${!isDesktop && item > 0 ? "hidden" : ""}`}>
                  <div className="flex gap-3">
                    <div className="h-[92px] w-[92px] shrink-0 rounded-[18px] bg-violet-100" />
                    <div className="flex-1 py-1">
                      <div className="h-4 w-2/3 rounded bg-slate-100" />
                      <div className="mt-2 h-3 w-1/2 rounded bg-slate-100" />
                      <div className="mt-3 h-6 w-24 rounded-full bg-violet-50" />
                      <div className="mt-2 h-7 rounded-lg bg-slate-100" />
                    </div>
                  </div>
                  <div className="mt-3 h-8 rounded-xl bg-slate-100" />
                </div>
              ))}
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {activeTab === "pets" && (isDesktop
                ? <DesktopPetsSection key="pets" pets={pets} onAddPet={handleAddPet} onEditPet={handleEditPet} onDeletePet={handleDeletePet} onToggleAvailability={handleToggleAvailability} />
                : <PetsSection key="pets" pets={pets} onAddPet={handleAddPet} onEditPet={handleEditPet} onDeletePet={handleDeletePet} onToggleAvailability={handleToggleAvailability} />)}
              {activeTab === "requests" && (isDesktop
                ? <DesktopRequestsSection key="requests" requests={matingRequests} onAccept={handleAcceptRequest} onDecline={handleDeclineRequest} />
                : <RequestsSection key="requests" requests={matingRequests} onAccept={handleAcceptRequest} onDecline={handleDeclineRequest} />)}
              {activeTab === "messages" && <ConversationsListSection key="messages" onOpenConversation={handleOpenMessageDialog} />}
              {activeTab === "compare" && <MultiPetCompare key="compare" pets={pets} />}
            </AnimatePresence>
          )}
        </motion.main>
      </div>
    </div>
  );
};


// --- Main Profile Component ---

const Profile = () => {
  const { isDesktop } = useResponsive();
  const user = auth.currentUser;
  const navigate = useNavigate();
  const location = useLocation();
  const [pets, setPets] = useState([]);
  const [activeTab, setActiveTab] = useState("pets");
  const [matingRequests, setMatingRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openPetDialog, setOpenPetDialog] = useState(false);
  const [openVaccinationDialog, setOpenVaccinationDialog] = useState(false);
  const [openUserProfileDialog, setOpenUserProfileDialog] = useState(false);
  const [isSavingVaccination, setIsSavingVaccination] = useState(false);
  const [openMessageDialog, setOpenMessageDialog] = useState(false);
  const [currentPet, setCurrentPet] = useState(null);
  const [currentVaccination, setCurrentVaccination] = useState({ name: "", date: null, nextDue: null, notes: "" });
  const [currentMessage, setCurrentMessage] = useState({ conversationId: null, recipientId: null, recipientName: null, senderPet: null, receiverPet: null });
  const [isEditMode, setIsEditMode] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [vaccinationEditIndex, setVaccinationEditIndex] = useState(-1);
  const [userData, setUserData] = useState({
    displayName: user?.displayName || '',
    email: user?.email || '',
    phoneNumber: '',
    city: '',
    country: '',
    dateOfBirth: '',
  });

  const pendingRequestsCount = matingRequests.filter(
    (req) => req.direction === "incoming" && req.status === "pending"
  ).length;

  // --- Data Fetching Functions ---

  const fetchMatingRequests = useCallback(async (currentPets) => {
    if (!user) return;
    try {
      const fetchWithDetails = async (requestPath, direction) => {
        const requestsRef = ref(database, requestPath);
        const snapshot = await get(requestsRef);
        if (!snapshot.exists()) return [];

        const requestsData = snapshot.val();
        
        // Batch all requests in parallel instead of sequential
        const detailedRequests = await Promise.all(
          Object.keys(requestsData).map(async (requestId) => {
            const request = requestsData[requestId];
            const otherUserId = direction === "incoming" ? request.senderId : request.receiverId;
            const otherPetId = direction === "incoming" ? request.senderPetId : request.receiverPetId;

            // Fetch user and pet data in parallel
            const [otherUserSnap, otherPetSnap] = await Promise.all([
              readUserSnapshot(otherUserId),
              readPetSnapshot(otherUserId, otherPetId)
            ]);

            const otherUserData = otherUserSnap.exists() ? otherUserSnap.val() : {};
            const otherPetData = otherPetSnap.exists() ? otherPetSnap.val() : {};

            return {
              id: requestId, 
              ...request, 
              direction,
              senderName: direction === "incoming" ? otherUserData.displayName : user.displayName,
              receiverName: direction === "outgoing" ? otherUserData.displayName : user.displayName,
              senderPetName: direction === "incoming" ? otherPetData.name : currentPets.find(p => p.id === request.senderPetId)?.name,
              receiverPetName: direction === "outgoing" ? otherPetData.name : currentPets.find(p => p.id === request.receiverPetId)?.name,
              senderPetImage: direction === "incoming" ? otherPetData.image : currentPets.find(p => p.id === request.senderPetId)?.image,
              receiverPetImage: direction === "outgoing" ? otherPetData.image : currentPets.find(p => p.id === request.receiverPetId)?.image,
            };
          })
        );
        
        return detailedRequests.filter(Boolean);
      };

      // Fetch incoming and sent requests in parallel
      const [incoming, sent] = await Promise.all([
        fetchWithDetails(`matingRequests/received/${user.uid}`, "incoming"),
        fetchWithDetails(`matingRequests/sent/${user.uid}`, "outgoing")
      ]);

      const allRequests = [...incoming, ...sent].sort((a, b) => b.createdAt - a.createdAt);
      setMatingRequests(allRequests);

    } catch (error) {
      console.error("Error fetching mating requests:", error);
    }
  }, [user]);


  // --- Action Handlers ---

  const handleEditProfile = useCallback(() => {
    setOpenUserProfileDialog(true);
  }, []);

  const handleUpdateProfile = useCallback((updatedData) => {
    setUserData(updatedData);
  }, []);

  const handleAddPet = useCallback(() => {
    setCurrentPet({
      id: crypto.randomUUID(), name: "", type: "", breed: "", gender: "", age: "",
      weight: "", color: "", description: "", image: "", availableForMating: false,
      availableForAdoption: false, medical: { conditions: [], allergies: [], medications: "" },
      vaccinations: [], petOwner: user.displayName,
    });
    setIsEditMode(false);
    setOpenPetDialog(true);
  }, [user]);

  const handleEditPet = useCallback((pet, section) => {
    setCurrentPet({ ...pet });
    setIsEditMode(true);
    setOpenPetDialog(true);
    if (section === "vaccinations") setTabValue(2);
  }, []);

  const handleSavePet = useCallback(async () => {
    if (!user || !currentPet.name) return;
    try {
      console.log('Saving pet:', currentPet);
      
      // Generate slug from pet name and pet ID for uniqueness
      const baseSlug = currentPet.name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      
      // Use pet ID suffix to ensure uniqueness (e.g., harry-abc123)
      const petIdSuffix = currentPet.id.slice(-6);
      // Always regenerate slug to ensure it has the correct format
      const slug = `${baseSlug}-${petIdSuffix}`;
      console.log('Generated slug:', slug);
      
      // Add slug and privacy settings to pet data
      const petDataWithSlug = {
        ...currentPet,
        slug,
        userId: user.uid,
        privacy: currentPet.privacy || {
          isPrivate: false,
          commentsDisabled: false
        }
      };
      
      console.log('Saving pet data:', petDataWithSlug);
      const petRef = ref(database, `userPets/${user.uid}/${currentPet.id}`);
      await update(ref(database), {
        [`petOwners/${currentPet.id}`]: user.uid,
        [`userPets/${user.uid}/${currentPet.id}`]: petDataWithSlug,
      });
      if (!isEditMode) trackProductEvent("pet_created", "pets");
      console.log('Pet saved successfully to database');
      
      // Delete old slug index if it exists and is different
      if (isEditMode && currentPet.slug && currentPet.slug !== slug) {
        const oldSlugRef = ref(database, `petSlugs/${currentPet.slug}`);
        await remove(oldSlugRef);
        console.log('Removed old slug index:', currentPet.slug);
      }
      
      // Save new slug index for public access
      const slugIndexRef = ref(database, `petSlugs/${slug}`);
      await set(slugIndexRef, {
        userId: user.uid,
        petId: currentPet.id,
        isPrivate: petDataWithSlug.privacy.isPrivate
      });
      console.log('Slug index saved:', slug);
      
      setPets(prev => isEditMode ? prev.map(p => p.id === currentPet.id ? petDataWithSlug : p) : [...prev, petDataWithSlug]);
      setOpenPetDialog(false);
    } catch (error) {
      console.error("Error saving pet:", error);
      alert(`Failed to save pet: ${error.message}`);
    }
  }, [user, currentPet, isEditMode]);

  const handleDeletePet = useCallback(async (petId) => {
    if (!user || !window.confirm("Are you sure you want to delete this pet? This action cannot be undone.")) return;
    try {
      // Find the pet to get its slug
      const pet = pets.find(p => p.id === petId);
      
      // Delete the pet
      const petRef = ref(database, `userPets/${user.uid}/${petId}`);
      await remove(petRef);
      
      // Delete the slug index if it exists
      if (pet?.slug) {
        const slugRef = ref(database, `petSlugs/${pet.slug}`);
        await remove(slugRef);
      }
      
      setPets(prev => prev.filter(p => p.id !== petId));
    } catch (error) {
      console.error("Error deleting pet:", error);
    }
  }, [user, pets]);

  const handleToggleAvailability = useCallback(async (pet, type) => {
    if (!user) return;
    try {
      const updatedPet = {
        ...pet,
        [type]: !pet[type]
      };
      const petRef = ref(database, `userPets/${user.uid}/${pet.id}`);
      await set(petRef, updatedPet);
      setPets(prev => prev.map(p => p.id === pet.id ? updatedPet : p));
    } catch (error) {
      console.error("Error toggling availability:", error);
    }
  }, [user]);

  const handleAddVaccination = useCallback(() => {
    setCurrentVaccination({ name: "", date: null, nextDue: null, notes: "" });
    setVaccinationEditIndex(-1);
    setOpenVaccinationDialog(true);
  }, []);

  const handleEditVaccination = useCallback((vaccination, index) => {
    setCurrentVaccination({ ...vaccination });
    setVaccinationEditIndex(index);
    setOpenVaccinationDialog(true);
  }, []);

  const handleSaveVaccination = useCallback(async () => {
    if (!currentVaccination.name || !currentVaccination.date) return;
    setIsSavingVaccination(true);
    try {
      const updatedPet = { ...currentPet };
      updatedPet.vaccinations = updatedPet.vaccinations || [];
      if (vaccinationEditIndex >= 0) {
        updatedPet.vaccinations[vaccinationEditIndex] = currentVaccination;
      } else {
        // Add unique ID to new vaccination
        const vaccinationWithId = {
          ...currentVaccination,
          id: Date.now().toString()
        };
        updatedPet.vaccinations.push(vaccinationWithId);
      }
      setCurrentPet(updatedPet);
      setOpenVaccinationDialog(false);
    } catch (error) {
      console.error("Error saving vaccination:", error);
    } finally {
      setIsSavingVaccination(false);
    }
  }, [currentPet, currentVaccination, vaccinationEditIndex]);

  const handleDeleteVaccination = useCallback((index) => {
    setCurrentPet(prevPet => {
      const updatedPet = { ...prevPet };
      updatedPet.vaccinations.splice(index, 1);
      return updatedPet;
    });
  }, []);

  const handleUpdateRequestStatus = useCallback(async (request, status) => {
    try {
      const updates = {};
      const timestamp = Date.now();
      updates[`matingRequests/received/${user.uid}/${request.id}/status`] = status;
      updates[`matingRequests/received/${user.uid}/${request.id}/updatedAt`] = timestamp;
      updates[`matingRequests/sent/${request.senderId}/${request.id}/status`] = status;
      updates[`matingRequests/sent/${request.senderId}/${request.id}/updatedAt`] = timestamp;

      await update(ref(database), updates);

      setMatingRequests(prev => prev.map(req => req.id === request.id ? { ...req, status } : req));
      
      // Send notification if request is accepted
      if (status === "accepted") {
        const senderRef = ref(database, `users/${request.senderId}`);
        const senderSnapshot = await readUserSnapshot(request.senderId);
        
        if (senderSnapshot.exists()) {
          const senderData = senderSnapshot.val();
          const receiverData = {
            uid: user.uid,
            displayName: user.displayName,
            email: user.email,
          };
          
          sendMatingRequestAcceptedNotification(senderData, receiverData, request)
            .catch(err => console.error('Failed to send acceptance notification:', err));
        }
      }
    } catch (error) {
      console.error(`Error updating request to ${status}:`, error);
    }
  }, [user]);

  const handleAcceptRequest = useCallback((request) => handleUpdateRequestStatus(request, "accepted"), [handleUpdateRequestStatus]);
  const handleDeclineRequest = useCallback((request) => handleUpdateRequestStatus(request, "declined"), [handleUpdateRequestStatus]);

  const handleOpenMessageDialog = useCallback((chat) => {
    console.log("chat:--  ", chat);
    if (!chat) return;
    setCurrentMessage({
      conversationId: chat.id,
      recipientId: chat.otherParticipantId,
      recipientName: chat.otherParticipantName,
      senderPet: chat.senderPet,
      receiverPet: chat.receiverPet
    });
    setOpenMessageDialog(true);
  }, []);

  useEffect(() => {
    if (user) {
      setIsLoading(true);
      const loadData = async () => {
        try {
          // Fetch user profile and pets data in parallel
          const [userSnapshot, petsSnapshot] = await Promise.all([
            readUserSnapshot(user.uid),
            get(ref(database, `userPets/${user.uid}`))
          ]);

          // Process user profile data
          if (userSnapshot.exists()) {
            const userProfileData = userSnapshot.val();
            setUserData({
              displayName: userProfileData.displayName || user.displayName || '',
              email: userProfileData.email || user.email || '',
              phoneNumber: userProfileData.phoneNumber || '',
              city: userProfileData.city || '',
              country: userProfileData.country || '',
              dateOfBirth: userProfileData.dateOfBirth || '',
              uid: user.uid,
            });
          }

          // Process pets data
          const fetchedPets = petsSnapshot.exists()
            ? Object.keys(petsSnapshot.val()).map(id => ({ id, ...petsSnapshot.val()[id] }))
            : [];
          setPets(fetchedPets);

          // Fetch mating requests (runs in parallel after initial data load)
          fetchMatingRequests(fetchedPets);

        } catch (error) {
          console.error("Error loading profile data:", error);
        } finally {
          setIsLoading(false);
        }
      };

      loadData();
    } else {
      setIsLoading(false);
    }
  }, [user, fetchMatingRequests]);

  // Handle navigation state — activate tab directly (e.g. messages from PetDashboard)
  useEffect(() => {
    if (location.state?.tab) {
      setActiveTab(location.state.tab);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state?.tab, navigate, location.pathname]);

  // Handle navigation state from PetProfile (open edit dialog)
  useEffect(() => {
    if (location.state?.editPetId && location.state?.openEditDialog && pets.length > 0) {
      const petToEdit = pets.find(p => p.id === location.state.editPetId);
      if (petToEdit) {
        handleEditPet(petToEdit);
        
        // If focusTab is specified, set the tab
        if (location.state.focusTab === 'vaccinations') {
          setTabValue(2); // Vaccinations tab
        } else if (location.state.focusTab === 'medical') {
          setTabValue(1); // Medical tab
        }
        
        // Clear the state to prevent reopening on refresh
        navigate(location.pathname, { replace: true, state: {} });
      }
    }
  }, [location.state, pets, handleEditPet, navigate, location.pathname]);

  // Clear notifications when viewing requests or messages tabs
  useEffect(() => {
    if (user && (activeTab === 'requests' || activeTab === 'messages')) {
      console.log('Clearing unread notifications for tab:', activeTab);
      clearUnreadNotifications(user.uid);
    }
  }, [activeTab, user]);

  // --- Tab Configuration ---
  const tabs = useMemo(() => [
    {
      id: "pets",
      label: "My pets",
      shortLabel: "Pets",
      description: "Manage care details, visibility, and each pet's shareable social profile.",
      icon: <FaPaw />,
      count: pets.length,
    },
    {
      id: "requests",
      label: "Pet requests",
      shortLabel: "Requests",
      description: "Review incoming and outgoing connections involving your pets.",
      icon: <FaHeart />,
      count: matingRequests.length,
      badge: pendingRequestsCount,
    },
    {
      id: "messages",
      label: "Messages",
      shortLabel: "Inbox",
      description: "Continue conversations with other pet parents in one place.",
      icon: <FaCommentDots />,
    },
    {
      id: "compare",
      label: "Compare pets",
      shortLabel: "Compare",
      description: "See care and profile information across pets in your family.",
      icon: <FaBalanceScale />,
      count: pets.length >= 2 ? pets.length : 0,
    },
  ], [pets.length, matingRequests.length, pendingRequestsCount]);

  return (
    <>
      <ProfileExperience
        isDesktop={isDesktop}
        user={userData}
        pets={pets}
        navigate={navigate}
        matingRequests={matingRequests}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tabs={tabs}
        handleAddPet={handleAddPet}
        handleEditPet={handleEditPet}
        handleDeletePet={handleDeletePet}
        handleToggleAvailability={handleToggleAvailability}
        handleAcceptRequest={handleAcceptRequest}
        handleDeclineRequest={handleDeclineRequest}
        handleOpenMessageDialog={handleOpenMessageDialog}
        handleEditProfile={handleEditProfile}
        isLoading={isLoading}
      />

      {openPetDialog && (<PetDialog open={openPetDialog} onClose={() => setOpenPetDialog(false)} pet={currentPet} setPet={setCurrentPet} onSave={handleSavePet} isEditMode={isEditMode} tabValue={tabValue} onTabChange={(e, val) => setTabValue(val)} onAddVaccination={handleAddVaccination} onEditVaccination={handleEditVaccination} onDeleteVaccination={handleDeleteVaccination} isMobile={!isDesktop} />)}
      {openVaccinationDialog && (<VaccinationDialog open={openVaccinationDialog} onClose={() => setOpenVaccinationDialog(false)} vaccination={currentVaccination} setVaccination={setCurrentVaccination} onSave={handleSaveVaccination} isEditMode={vaccinationEditIndex >= 0} isMobile={!isDesktop} petType={currentPet?.type} petDateOfBirth={currentPet?.dateOfBirth} vaccinationEditIndex={vaccinationEditIndex} loading={isSavingVaccination} />)}
      {openMessageDialog && (<MessageDialog open={openMessageDialog} onClose={() => setOpenMessageDialog(false)} conversationId={currentMessage.conversationId} recipientId={currentMessage.recipientId} recipientName={currentMessage.recipientName} senderPet={currentMessage.senderPet} receiverPet={currentMessage.receiverPet} />)}
      {openUserProfileDialog && (<UserProfileDialog isOpen={openUserProfileDialog} onClose={() => setOpenUserProfileDialog(false)} user={userData} onUpdate={handleUpdateProfile} />)}
    </>
  );
};

export default Profile;
