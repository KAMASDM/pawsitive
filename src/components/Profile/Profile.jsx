import React, { useEffect, useState, useCallback, memo, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { auth, database } from "../../firebase";
import { ref, set, get, update, remove } from "firebase/database";
import { FiMail, FiPhone } from "react-icons/fi";
import useResponsive from "../../hooks/useResponsive";
import { FaPlus, FaPaw, FaHeart, FaCommentDots } from "react-icons/fa";
import {
  PetDialog,
  VaccinationDialog,
  MessageDialog,
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

const MobileVersion = ({ user, pets, matingRequests, chats, activeTab, setActiveTab, tabs, handleAddPet, handleEditPet, handleDeletePet, handleAcceptRequest, handleDeclineRequest, handleOpenMessageDialog }) => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 to-violet-50 p-4">
    {/* User Profile Header */}
    <motion.div className="bg-white rounded-2xl p-6 shadow-md border border-violet-100 mb-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
      <div className="flex items-center mb-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 text-white flex items-center justify-center text-xl font-bold mr-4">
          {user.displayName?.split(" ").map((word) => word[0]).join("").slice(0, 2)}
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-800 mb-1">{user.displayName}</h1>
          <div className="flex items-center text-gray-600 text-sm mb-1"><FiMail className="w-3 h-3 mr-1" /><span className="truncate">{user.email}</span></div>
          {user.phoneNumber && (<div className="flex items-center text-gray-600 text-sm"><FiPhone className="w-3 h-3 mr-1" /><span>{user.phoneNumber}</span></div>)}
        </div>
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
      <div className="bg-white rounded-2xl p-2 shadow-md border border-violet-100">
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
        {activeTab === "pets" && (<PetsSection key="pets" pets={pets} onAddPet={handleAddPet} onEditPet={handleEditPet} onDeletePet={handleDeletePet} />)}
        {activeTab === "requests" && (<RequestsSection key="requests" requests={matingRequests} onAccept={handleAcceptRequest} onDecline={handleDeclineRequest} />)}
        {activeTab === "messages" && <ConversationsListSection key="messages" onOpenConversation={handleOpenMessageDialog} />}
      </AnimatePresence>
    </motion.div>
  </div>
);

const DesktopVersion = ({ user, pets, matingRequests, activeTab, setActiveTab, tabs, handleAddPet, handleEditPet, handleDeletePet, handleAcceptRequest, handleDeclineRequest, handleOpenMessageDialog }) => (
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
              {user.phoneNumber && (<div className="flex items-center text-gray-600"><FiPhone className="w-4 h-4 mr-2" /><span>{user.phoneNumber}</span></div>)}
            </div>
          </div>
          {/* Desktop Stats */}
          <div className="flex gap-8">
            <div className="text-center"><div className="text-2xl font-bold text-slate-800">{pets.length}</div><div className="text-sm text-gray-600">Pets</div></div>
            <div className="text-center"><div className="text-2xl font-bold text-slate-800">{matingRequests.length}</div><div className="text-sm text-gray-600">Requests</div></div>
          </div>
        </div>
      </motion.div>
      <motion.div className="mb-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
        <div className="bg-white rounded-2xl p-3 shadow-md border border-violet-100">
          <div className="flex justify-center gap-2">
            {tabs.map((tab) => (
              <motion.button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`relative flex items-center px-6 py-3 rounded-xl transition-all duration-300 ${activeTab === tab.id ? "bg-gradient-to-r from-violet-400 to-indigo-400 text-white shadow-md" : "text-gray-600 hover:bg-violet-50"}`} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                {tab.badge > 0 && (<div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"><span className="text-xs text-white font-bold">{tab.badge}</span></div>)}
                <span className="text-xl mr-3">{tab.icon}</span>
                <span className="font-medium">{tab.label}</span>
                {tab.count > 0 && !tab.badge && (<span className="ml-2 bg-white bg-opacity-20 rounded-full px-2 py-1 text-xs">{tab.count}</span>)}
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }}>
        <AnimatePresence mode="wait">
          {activeTab === "pets" && (<DesktopPetsSection key="pets" pets={pets} onAddPet={handleAddPet} onEditPet={handleEditPet} onDeletePet={handleDeletePet} />)}
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

  const [pets, setPets] = useState([]);
  const [activeTab, setActiveTab] = useState("pets");
  const [matingRequests, setMatingRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openPetDialog, setOpenPetDialog] = useState(false);
  const [openVaccinationDialog, setOpenVaccinationDialog] = useState(false);
  const [isSavingVaccination, setIsSavingVaccination] = useState(false);
  const [openMessageDialog, setOpenMessageDialog] = useState(false);
  const [currentPet, setCurrentPet] = useState(null);
  const [currentVaccination, setCurrentVaccination] = useState({ name: "", date: null, nextDue: null, notes: "" });
  const [currentMessage, setCurrentMessage] = useState({ conversationId: null, recipientId: null, recipientName: null, senderPet: null, receiverPet: null });
  const [isEditMode, setIsEditMode] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [vaccinationEditIndex, setVaccinationEditIndex] = useState(-1);

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
        const detailedRequests = await Promise.all(Object.keys(requestsData).map(async (requestId) => {
          const request = requestsData[requestId];
          const otherUserId = direction === "incoming" ? request.senderId : request.receiverId;
          const otherPetId = direction === "incoming" ? request.senderPetId : request.receiverPetId;

          const [otherUserSnap, otherPetSnap] = await Promise.all([
            get(ref(database, `users/${otherUserId}`)),
            get(ref(database, `userPets/${otherUserId}/${otherPetId}`))
          ]);

          const otherUserData = otherUserSnap.exists() ? otherUserSnap.val() : {};
          const otherPetData = otherPetSnap.exists() ? otherPetSnap.val() : {};

          return {
            id: requestId, ...request, direction,
            senderName: direction === "incoming" ? otherUserData.displayName : user.displayName,
            receiverName: direction === "outgoing" ? otherUserData.displayName : user.displayName,
            senderPetName: direction === "incoming" ? otherPetData.name : currentPets.find(p => p.id === request.senderPetId)?.name,
            receiverPetName: direction === "outgoing" ? otherPetData.name : currentPets.find(p => p.id === request.receiverPetId)?.name,
            senderPetImage: direction === "incoming" ? otherPetData.image : currentPets.find(p => p.id === request.senderPetId)?.image,
            receiverPetImage: direction === "outgoing" ? otherPetData.image : currentPets.find(p => p.id === request.receiverPetId)?.image,
          };
        }));
        return detailedRequests.filter(Boolean);
      };

      const incoming = await fetchWithDetails(`matingRequests/received/${user.uid}`, "incoming");
      const sent = await fetchWithDetails(`matingRequests/sent/${user.uid}`, "outgoing");

      const allRequests = [...incoming, ...sent].sort((a, b) => b.createdAt - a.createdAt);
      setMatingRequests(allRequests);

    } catch (error) {
      console.error("Error fetching mating requests:", error);
    }
  }, [user]);


  // --- Action Handlers ---

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
      const petRef = ref(database, `userPets/${user.uid}/${currentPet.id}`);
      await set(petRef, currentPet);
      setPets(prev => isEditMode ? prev.map(p => p.id === currentPet.id ? currentPet : p) : [...prev, currentPet]);
      setOpenPetDialog(false);
    } catch (error) {
      console.error("Error saving pet:", error);
    }
  }, [user, currentPet, isEditMode]);

  const handleDeletePet = useCallback(async (petId) => {
    if (!user || !window.confirm("Are you sure you want to delete this pet? This action cannot be undone.")) return;
    try {
      const petRef = ref(database, `userPets/${user.uid}/${petId}`);
      await remove(petRef);
      setPets(prev => prev.filter(pet => pet.id !== petId));
    } catch (error) {
      console.error("Error deleting pet:", error);
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
        updatedPet.vaccinations.push(currentVaccination);
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
          const userPetsRef = ref(database, `userPets/${user.uid}`);
          const snapshot = await get(userPetsRef);
          const fetchedPets = snapshot.exists()
            ? Object.keys(snapshot.val()).map(id => ({ id, ...snapshot.val()[id] }))
            : [];
          setPets(fetchedPets);

          await fetchMatingRequests(fetchedPets);



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
        <DesktopVersion user={user} pets={pets} matingRequests={matingRequests} activeTab={activeTab} setActiveTab={setActiveTab} tabs={tabs} handleAddPet={handleAddPet} handleEditPet={handleEditPet} handleDeletePet={handleDeletePet} handleAcceptRequest={handleAcceptRequest} handleDeclineRequest={handleDeclineRequest} handleOpenMessageDialog={handleOpenMessageDialog} />
      ) : (
        <MobileVersion user={user} pets={pets} matingRequests={matingRequests} activeTab={activeTab} setActiveTab={setActiveTab} tabs={tabs} handleAddPet={handleAddPet} handleEditPet={handleEditPet} handleDeletePet={handleDeletePet} handleAcceptRequest={handleAcceptRequest} handleDeclineRequest={handleDeclineRequest} handleOpenMessageDialog={handleOpenMessageDialog} />
      )}

      {openPetDialog && (<PetDialog open={openPetDialog} onClose={() => setOpenPetDialog(false)} pet={currentPet} setPet={setCurrentPet} onSave={handleSavePet} isEditMode={isEditMode} tabValue={tabValue} onTabChange={(e, val) => setTabValue(val)} onAddVaccination={handleAddVaccination} onEditVaccination={handleEditVaccination} onDeleteVaccination={handleDeleteVaccination} isMobile={!isDesktop} />)}
      {openVaccinationDialog && (<VaccinationDialog open={openVaccinationDialog} onClose={() => setOpenVaccinationDialog(false)} vaccination={currentVaccination} setVaccination={setCurrentVaccination} onSave={handleSaveVaccination} isEditMode={vaccinationEditIndex >= 0} isMobile={!isDesktop} petType={currentPet?.type} vaccinationEditIndex={vaccinationEditIndex} loading={isSavingVaccination} />)}
      {openMessageDialog && (<MessageDialog open={openMessageDialog} onClose={() => setOpenMessageDialog(false)} conversationId={currentMessage.conversationId} recipientId={currentMessage.recipientId} recipientName={currentMessage.recipientName} senderPet={currentMessage.senderPet} receiverPet={currentMessage.receiverPet} />)}
    </>
  );
};

export default Profile;