import React, { useEffect, useState, useCallback, memo, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { auth, database } from "../../firebase";
import { ref, set, get, update, remove } from "firebase/database";
import { useNavigate, useLocation } from "react-router-dom";
import { FiMail, FiPhone } from "react-icons/fi";
import useResponsive from "../../hooks/useResponsive";
import { FaPlus, FaPaw, FaHeart, FaCommentDots } from "react-icons/fa";
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
import SkeletonLoader from "../Loaders/SkeletonLoader";
import ConversationsList from "./components/ConversationsList";

// Memoize components to prevent unnecessary re-renders
const PetsSection = memo(PetsSectionComponent);
const DesktopPetsSection = memo(DesktopPetsSectionComponent);
const RequestsSection = memo(RequestsSectionComponent);
const DesktopRequestsSection = memo(DesktopRequestsSectionComponent);
const ConversationsListSection = memo(ConversationsList);

// --- Child Components for Mobile/Desktop Views ---

const MobileVersion = ({ user, pets, matingRequests, chats, activeTab, setActiveTab, tabs, handleAddPet, handleEditPet, handleDeletePet, handleToggleAvailability, handleAcceptRequest, handleDeclineRequest, handleOpenMessageDialog, handleEditProfile }) => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 to-violet-50 p-4">
    {/* User Profile Header */}
    <motion.div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-violet-100 mb-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
      <div className="flex items-center mb-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 text-white flex items-center justify-center text-xl font-bold mr-4">
          {user.displayName?.split(" ").map((word) => word[0]).join("").slice(0, 2)}
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-800 mb-1">{user.displayName}</h1>
          <div className="flex items-center text-gray-600 text-sm mb-1"><FiMail className="w-3 h-3 mr-1" /><span className="truncate">{user.email}</span></div>
          {user.phoneNumber && (<div className="flex items-center text-gray-600 text-sm"><FiPhone className="w-3 h-3 mr-1" /><span>{user.phoneNumber}</span></div>)}
          {(user.city || user.country) && (
            <div className="flex items-center text-gray-600 text-sm">
              <span>{[user.city, user.country].filter(Boolean).join(', ')}</span>
            </div>
          )}
        </div>
        <button
          onClick={handleEditProfile}
          className="ml-2 px-3 py-1.5 text-xs font-medium text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
        >
          Edit
        </button>
      </div>
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-violet-100">
        <div className="text-center"><div className="text-lg font-bold text-slate-800">{pets.length}</div><div className="text-xs text-gray-600">Pets</div></div>
        <div className="text-center"><div className="text-lg font-bold text-slate-800">{matingRequests.length}</div><div className="text-xs text-gray-600">Requests</div></div>
      </div>
    </motion.div>
    <motion.button onClick={handleAddPet} className="w-full flex items-center justify-center gap-2 py-3 mb-6 bg-gradient-to-r from-violet-400 to-indigo-400 text-white font-semibold rounded-xl shadow-md transition-all duration-300 hover:shadow-lg" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}><FaPlus />Add a New Pet</motion.button>
    {/* Tab Navigation */}
    <motion.div className="mb-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}>
      <div className="bg-white/75 backdrop-blur-md rounded-2xl p-2 shadow-lg border border-violet-100">
        <div className="grid grid-cols-3 gap-1">
          {tabs.map((tab) => (
            <motion.button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`relative flex flex-col items-center p-3 rounded-xl transition-all duration-300 ${activeTab === tab.id ? "bg-gradient-to-r from-violet-400 to-indigo-400 text-white shadow-md" : "text-gray-600 hover:bg-violet-50"}`} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              {tab.badge > 0 && (<div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"><span className="text-xs text-white font-bold">{tab.badge}</span></div>)}
              <span className="text-lg mb-1">{tab.icon}</span>
              <span className="text-xs font-medium">{tab.label}</span>
              {tab.count > 0 && !tab.badge && (<span className="text-xs opacity-75">{tab.count}</span>)}
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
    {/* Content */}
    <motion.div className="min-h-[400px]" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
      <AnimatePresence mode="wait">
        {activeTab === "pets" && (<PetsSection key="pets" pets={pets} onAddPet={handleAddPet} onEditPet={handleEditPet} onDeletePet={handleDeletePet} onToggleAvailability={handleToggleAvailability} />)}
        {activeTab === "requests" && (<RequestsSection key="requests" requests={matingRequests} onAccept={handleAcceptRequest} onDecline={handleDeclineRequest} />)}
        {activeTab === "messages" && <ConversationsListSection key="messages" onOpenConversation={handleOpenMessageDialog} />}
      </AnimatePresence>
    </motion.div>
  </div>
);

const DesktopVersion = ({ user, pets, matingRequests, activeTab, setActiveTab, tabs, handleAddPet, handleEditPet, handleDeletePet, handleToggleAvailability, handleAcceptRequest, handleDeclineRequest, handleOpenMessageDialog, handleEditProfile, navigate }) => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 to-violet-50 p-8">
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <motion.div className="bg-white rounded-3xl p-8 shadow-lg border border-violet-100 mb-8" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 text-white flex items-center justify-center text-2xl font-bold mr-6">
              {user.displayName?.split(" ").map((word) => word[0]).join("").slice(0, 2)}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">{user.displayName}</h1>
              <div className="flex items-center text-gray-600 mb-1"><FiMail className="w-4 h-4 mr-2" /><span>{user.email}</span></div>
              {user.phoneNumber && (<div className="flex items-center text-gray-600 mb-1"><FiPhone className="w-4 h-4 mr-2" /><span>{user.phoneNumber}</span></div>)}
              {(user.city || user.country) && (
                <div className="flex items-center text-gray-600">
                  <span>{[user.city, user.country].filter(Boolean).join(', ')}</span>
                </div>
              )}
            </div>
          </div>
          {/* Desktop Stats & Edit Button */}
          <div className="flex gap-8 items-center">
            <div className="flex gap-8">
              <div className="text-center"><div className="text-2xl font-bold text-slate-800">{pets.length}</div><div className="text-sm text-gray-600">Pets</div></div>
              <div className="text-center"><div className="text-2xl font-bold text-slate-800">{matingRequests.length}</div><div className="text-sm text-gray-600">Requests</div></div>
            </div>
            <button
              onClick={handleEditProfile}
              className="px-4 py-2 text-sm font-medium text-violet-600 hover:bg-violet-50 border border-violet-200 rounded-lg transition-colors"
            >
              Edit Profile
            </button>
          </div>
        </div>
      </motion.div>
      <motion.div className="mb-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
        <div className="bg-white rounded-2xl p-3 shadow-md border border-violet-100">
          <div className="flex justify-between items-center flex-wrap gap-4">
            {/* Tabs on the left */}
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center px-6 py-3 rounded-xl transition-all duration-300 ${activeTab === tab.id
                    ? "bg-gradient-to-r from-violet-400 to-indigo-400 text-white shadow-md"
                    : "text-gray-600 hover:bg-violet-50"
                    }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {tab.badge > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-xs text-white font-bold">{tab.badge}</span>
                    </div>
                  )}
                  <span className="text-xl mr-3">{tab.icon}</span>
                  <span className="font-medium">{tab.label}</span>
                  {tab.count > 0 && !tab.badge && (
                    <span className="ml-2 bg-white bg-opacity-20 rounded-full px-2 py-1 text-xs">
                      {tab.count}
                    </span>
                  )}
                </motion.button>
              ))}
            </div>

            {/* Action buttons on the right - UPDATED DESIGN */}
            <div className="flex gap-4">
              <motion.button
                onClick={() => navigate("/nearby-mates")}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-violet-400 to-indigo-400 text-white font-semibold shadow-md transition-all duration-300 hover:shadow-lg hover:brightness-110"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaHeart />
                Find Mates
              </motion.button>

              <motion.button
                onClick={() => navigate("/adopt-pets")}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-teal-400 to-cyan-500 text-white font-semibold shadow-md transition-all duration-300 hover:shadow-lg hover:brightness-110"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaPaw />
                Adopt Pet
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }}>
        <AnimatePresence mode="wait">
          {activeTab === "pets" && (<DesktopPetsSection key="pets" pets={pets} onAddPet={handleAddPet} onEditPet={handleEditPet} onDeletePet={handleDeletePet} onToggleAvailability={handleToggleAvailability} />)}
          {activeTab === "requests" && (<DesktopRequestsSection key="requests" requests={matingRequests} onAccept={handleAcceptRequest} onDecline={handleDeclineRequest} />)}
          {activeTab === "messages" && (<ConversationsListSection key="messages" onOpenConversation={handleOpenMessageDialog} />)}
        </AnimatePresence>
      </motion.div>
    </div>
  </div>
);


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
              get(ref(database, `users/${otherUserId}`)),
              get(ref(database, `userPets/${otherUserId}/${otherPetId}`))
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
      id: Date.now().toString(), name: "", type: "", breed: "", gender: "", age: "",
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
      await set(petRef, petDataWithSlug);
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
        petName: currentPet.name,
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
        const senderSnapshot = await get(senderRef);
        
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
            get(ref(database, `users/${user.uid}`)),
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
    { id: "pets", label: "Pets", icon: <FaPaw />, count: pets.length },
    { id: "requests", label: "Requests", icon: <FaHeart />, count: matingRequests.length, badge: pendingRequestsCount },
    { id: "messages", label: "Messages", icon: <FaCommentDots /> },
  ], [pets.length, matingRequests.length, pendingRequestsCount]);

  if (isLoading) {
    return <SkeletonLoader type="profile" />;
  }

  return (
    <>
      {isDesktop ? (
        <DesktopVersion user={userData} pets={pets} navigate={navigate} matingRequests={matingRequests} activeTab={activeTab} setActiveTab={setActiveTab} tabs={tabs} handleAddPet={handleAddPet} handleEditPet={handleEditPet} handleDeletePet={handleDeletePet} handleToggleAvailability={handleToggleAvailability} handleAcceptRequest={handleAcceptRequest} handleDeclineRequest={handleDeclineRequest} handleOpenMessageDialog={handleOpenMessageDialog} handleEditProfile={handleEditProfile} />
      ) : (
        <MobileVersion user={userData} pets={pets} matingRequests={matingRequests} activeTab={activeTab} setActiveTab={setActiveTab} tabs={tabs} handleAddPet={handleAddPet} handleEditPet={handleEditPet} handleDeletePet={handleDeletePet} handleToggleAvailability={handleToggleAvailability} handleAcceptRequest={handleAcceptRequest} handleDeclineRequest={handleDeclineRequest} handleOpenMessageDialog={handleOpenMessageDialog} handleEditProfile={handleEditProfile} />
      )}

      {openPetDialog && (<PetDialog open={openPetDialog} onClose={() => setOpenPetDialog(false)} pet={currentPet} setPet={setCurrentPet} onSave={handleSavePet} isEditMode={isEditMode} tabValue={tabValue} onTabChange={(e, val) => setTabValue(val)} onAddVaccination={handleAddVaccination} onEditVaccination={handleEditVaccination} onDeleteVaccination={handleDeleteVaccination} isMobile={!isDesktop} />)}
      {openVaccinationDialog && (<VaccinationDialog open={openVaccinationDialog} onClose={() => setOpenVaccinationDialog(false)} vaccination={currentVaccination} setVaccination={setCurrentVaccination} onSave={handleSaveVaccination} isEditMode={vaccinationEditIndex >= 0} isMobile={!isDesktop} petType={currentPet?.type} vaccinationEditIndex={vaccinationEditIndex} loading={isSavingVaccination} />)}
      {openMessageDialog && (<MessageDialog open={openMessageDialog} onClose={() => setOpenMessageDialog(false)} conversationId={currentMessage.conversationId} recipientId={currentMessage.recipientId} recipientName={currentMessage.recipientName} senderPet={currentMessage.senderPet} receiverPet={currentMessage.receiverPet} />)}
      {openUserProfileDialog && (<UserProfileDialog isOpen={openUserProfileDialog} onClose={() => setOpenUserProfileDialog(false)} user={userData} onUpdate={handleUpdateProfile} />)}
    </>
  );
};

export default Profile;