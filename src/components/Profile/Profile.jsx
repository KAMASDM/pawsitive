import React, { useEffect, useState, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { auth, database } from "../../firebase";
import { ref, set, get, update } from "firebase/database";
import SkeletonLoader from "../Loaders/SkeletonLoader";
import {
  FiPlus,
  FiMail,
  FiPhone,
} from "react-icons/fi";
import useResponsive from "../../hooks/useResponsive";
import { FaPlus } from "react-icons/fa";
import {
  PetDialog,
  VaccinationDialog,
  MessageDialog,
  PetsSection as PetsSectionComponent,
  DesktopPetsSection as DesktopPetsSectionComponent,
  RequestsSection as RequestsSectionComponent,
  DesktopRequestsSection as DesktopRequestsSectionComponent,
  MessagesSection as MessagesSectionComponent,
  DesktopMessagesSection as DesktopMessagesSectionComponent,
} from "./components";

const PetsSection = memo(PetsSectionComponent);
const DesktopPetsSection = memo(DesktopPetsSectionComponent);
const RequestsSection = memo(RequestsSectionComponent);
const DesktopRequestsSection = memo(DesktopRequestsSectionComponent);
const MessagesSection = memo(MessagesSectionComponent);
const DesktopMessagesSection = memo(DesktopMessagesSectionComponent);

// Mobile Version Component
const MobileVersion = ({
  user,
  pets,
  matingRequests,
  activeTab,
  setActiveTab,
  tabs,
  handleAddPet, // This function is passed in props
  handleEditPet,
  handleAcceptRequest,
  handleDeclineRequest,
}) => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 to-violet-50 p-4">
    {/* User Profile Header */}
    <motion.div
      className="bg-white rounded-2xl p-6 shadow-md border border-violet-100 mb-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="flex items-center mb-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 text-white flex items-center justify-center text-xl font-bold mr-4">
          {user.displayName
            ?.split(" ")
            .map((word) => word[0])
            .join("")
            .slice(0, 2)}
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-800 mb-1">
            {user.displayName}
          </h1>
          <div className="flex items-center text-gray-600 text-sm mb-1">
            <FiMail className="w-3 h-3 mr-1" />
            <span className="truncate">{user.email}</span>
          </div>
          {user.phoneNumber && (
            <div className="flex items-center text-gray-600 text-sm">
              <FiPhone className="w-3 h-3 mr-1" />
              <span>{user.phoneNumber}</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-violet-100">
        <div className="text-center">
          <div className="text-lg font-bold text-slate-800">
            {pets.length}
          </div>
          <div className="text-xs text-gray-600">Pets</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-slate-800">
            {matingRequests.length}
          </div>
          <div className="text-xs text-gray-600">Requests</div>
        </div>
      </div>
    </motion.div>

    {/* --- UPDATED ADD PET BUTTON --- */}
    <motion.button
      onClick={handleAddPet}
      className="w-full flex items-center justify-center gap-2 py-3 mb-6 bg-gradient-to-r from-violet-400 to-indigo-400 text-white font-semibold rounded-xl shadow-md transition-all duration-300 hover:shadow-lg"
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
    >
      <FaPlus />
      Add a New Pet
    </motion.button>
    {/* --- END OF UPDATE --- */}

    {/* Tab Navigation */}
    <motion.div
      className="mb-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1 }}
    >
      <div className="bg-white rounded-2xl p-2 shadow-md border border-violet-100">
        <div className="grid grid-cols-3 gap-1">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex flex-col items-center p-3 rounded-xl transition-all duration-300 ${activeTab === tab.id
                ? "bg-gradient-to-r from-violet-400 to-indigo-400 text-white shadow-md"
                : "text-gray-600 hover:bg-violet-50"
                }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {tab.badge > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-bold">
                    {tab.badge}
                  </span>
                </div>
              )}
              <span className="text-lg mb-1">{tab.icon}</span>
              <span className="text-xs font-medium">{tab.label}</span>
              {tab.count > 0 && !tab.badge && (
                <span className="text-xs opacity-75">{tab.count}</span>
              )}
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>

    {/* Content */}
    <motion.div
      className="min-h-[400px]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
    >
      <AnimatePresence mode="wait">
        {activeTab === "pets" && (
          <PetsSection
            key="pets"
            pets={pets}
            onAddPet={handleAddPet}
            onEditPet={handleEditPet}
          />
        )}
        {activeTab === "requests" && (
          <RequestsSection
            key="requests"
            requests={matingRequests}
            onAccept={handleAcceptRequest}
            onDecline={handleDeclineRequest}
          />
        )}
        {activeTab === "messages" && <MessagesSection key="messages" />}
      </AnimatePresence>
    </motion.div>

    {/* Floating Add Button */}
    <motion.button
      className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-violet-400 to-indigo-400 rounded-full shadow-lg flex items-center justify-center text-white z-20"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={handleAddPet}
      animate={{
        boxShadow: [
          "0 4px 15px rgba(139, 92, 246, 0.3)",
          "0 6px 20px rgba(139, 92, 246, 0.4)",
          "0 4px 15px rgba(139, 92, 246, 0.3)",
        ],
      }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    >
      <FiPlus className="text-lg" />
    </motion.button>
  </div>
);

// Desktop Version Component
const DesktopVersion = ({
  user,
  pets,
  matingRequests,
  activeTab,
  setActiveTab,
  tabs,
  handleAddPet,
  handleEditPet,
  handleAcceptRequest,
  handleDeclineRequest
}) => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 to-violet-50 p-8">
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        className="bg-white rounded-3xl p-8 shadow-lg border border-violet-100 mb-8"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 text-white flex items-center justify-center text-2xl font-bold mr-6">
              {user.displayName
                ?.split(" ")
                .map((word) => word[0])
                .join("")
                .slice(0, 2)}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">
                {user.displayName}
              </h1>
              <div className="flex items-center text-gray-600 mb-1">
                <FiMail className="w-4 h-4 mr-2" />
                <span>{user.email}</span>
              </div>
              {user.phoneNumber && (
                <div className="flex items-center text-gray-600">
                  <FiPhone className="w-4 h-4 mr-2" />
                  <span>{user.phoneNumber}</span>
                </div>
              )}
            </div>
          </div>

          {/* Desktop Stats */}
          <div className="flex gap-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-800">
                {pets.length}
              </div>
              <div className="text-sm text-gray-600">Pets</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-800">
                {matingRequests.length}
              </div>
              <div className="text-sm text-gray-600">Requests</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Desktop Tab Navigation */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className="bg-white rounded-2xl p-3 shadow-md border border-violet-100">
          <div className="flex justify-center gap-2">
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
                    <span className="text-xs text-white font-bold">
                      {tab.badge}
                    </span>
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
        </div>
      </motion.div>

      {/* Desktop Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <AnimatePresence mode="wait">
          {activeTab === "pets" && (
            <DesktopPetsSection
              key="pets"
              pets={pets}
              onAddPet={handleAddPet}
              onEditPet={handleEditPet}
            />
          )}
          {activeTab === "requests" && (
            <DesktopRequestsSection
              key="requests"
              requests={matingRequests}
              onAccept={handleAcceptRequest}
              onDecline={handleDeclineRequest}
            />
          )}
          {activeTab === "messages" && (
            <DesktopMessagesSection key="messages" />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  </div>
);

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

  const [currentVaccination, setCurrentVaccination] = useState({
    name: "",
    date: null,
    nextDue: null,
    notes: "",
  });

  const [currentMessage, setCurrentMessage] = useState({
    text: "",
    recipientId: "",
    petId: "",
    receiverPetId: "",
  });

  const [isEditMode, setIsEditMode] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [vaccinationEditIndex, setVaccinationEditIndex] = useState(-1);

  const pendingRequestsCount = matingRequests.filter(
    (req) => req.direction === "incoming" && req.status === "pending"
  ).length;

  const fetchUserPets = useCallback(async () => {
    if (!user) return;

    try {
      const userPetsRef = ref(database, `userPets/${user.uid}`);
      const snapshot = await get(userPetsRef);

      if (snapshot.exists()) {
        const petsData = snapshot.val();
        const petsArray = Object.keys(petsData).map((petId) => ({
          id: petId,
          ...petsData[petId],
        }));

        setPets(petsArray);
      } else {
        setPets([]);
      }
    } catch (error) {
      console.error("Error fetching user pets:", error);
    }
  }, [user]);

  const fetchMatingRequests = useCallback(async () => {
    if (!user) return;

    try {
      const incomingRequestsRef = ref(
        database,
        `matingRequests/received/${user.uid}`
      );
      const sentRequestsRef = ref(database, `matingRequests/sent/${user.uid}`);

      const incomingSnapshot = await get(incomingRequestsRef);
      const sentSnapshot = await get(sentRequestsRef);

      const requests = [];

      if (incomingSnapshot.exists()) {
        const incomingData = incomingSnapshot.val();

        for (const requestId in incomingData) {
          const request = incomingData[requestId];

          const senderUserRef = ref(database, `users/${request.senderId}`);
          const senderSnapshot = await get(senderUserRef);
          const senderData = senderSnapshot.exists()
            ? senderSnapshot.val()
            : { displayName: "Pet's Owner" };

          const senderPetRef = ref(
            database,
            `userPets/${request.senderId}/${request.senderPetId}`
          );
          const senderPetSnapshot = await get(senderPetRef);
          const senderPetData = senderPetSnapshot.exists()
            ? senderPetSnapshot.val()
            : { name: "Unknown Pet" };

          const receiverPetRef = ref(
            database,
            `userPets/${user.uid}/${request.receiverPetId}`
          );
          const receiverPetSnapshot = await get(receiverPetRef);
          const receiverPetData = receiverPetSnapshot.exists()
            ? receiverPetSnapshot.val()
            : { name: "Unknown Pet" };

          requests.push({
            id: requestId,
            ...request,
            direction: "incoming",
            senderName: senderData.displayName,
            senderPetName: senderPetData.name,
            senderPetImage: senderPetData.image,
            senderPetBreed: senderPetData.breed,
            receiverPetName: receiverPetData.name,
            receiverPetImage: receiverPetData.image,
          });
        }
      }

      if (sentSnapshot.exists()) {
        const sentData = sentSnapshot.val();

        for (const requestId in sentData) {
          const request = sentData[requestId];

          const receiverUserRef = ref(database, `users/${request.receiverId}`);
          const receiverSnapshot = await get(receiverUserRef);
          const receiverData = receiverSnapshot.exists()
            ? receiverSnapshot.val()
            : { displayName: "Pet's Owner" };

          const senderPetRef = ref(
            database,
            `userPets/${user.uid}/${request.senderPetId}`
          );
          const senderPetSnapshot = await get(senderPetRef);
          const senderPetData = senderPetSnapshot.exists()
            ? senderPetSnapshot.val()
            : { name: "Unknown Pet" };

          const receiverPetRef = ref(
            database,
            `userPets/${request.receiverId}/${request.receiverPetId}`
          );
          const receiverPetSnapshot = await get(receiverPetRef);
          const receiverPetData = receiverPetSnapshot.exists()
            ? receiverPetSnapshot.val()
            : { name: "Unknown Pet" };

          requests.push({
            id: requestId,
            ...request,
            direction: "outgoing",
            receiverName: receiverData.displayName,
            senderPetName: senderPetData.name,
            senderPetImage: senderPetData.image,
            receiverPetName: receiverPetData.name,
            receiverPetImage: receiverPetData.image,
            receiverPetBreed: receiverPetData.breed,
          });
        }
      }

      requests.sort((a, b) => b.createdAt - a.createdAt);

      setMatingRequests(requests);
    } catch (error) {
      console.error("Error fetching mating requests:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const handleAddPet = useCallback(() => {
    setCurrentPet({
      id: Date.now().toString(),
      name: "",
      type: "dog",
      breed: "",
      gender: "",
      age: "",
      weight: "",
      color: "",
      description: "",
      image: "",
      availableForMating: false,
      availableForAdoption: false,
      medical: {
        conditions: [],
        allergies: [],
        medications: "",
      },
      vaccinations: [],
      petOwner: user.displayName,
    });
    setIsEditMode(false);
    setOpenPetDialog(true);
  }, [user]);

  const handleEditPet = useCallback((pet, section) => {
    setCurrentPet({ ...pet });
    setIsEditMode(true);
    setOpenPetDialog(true);

    if (section === "vaccinations") {
      setTabValue(2);
    }
  }, []);

  const handleSavePet = useCallback(async () => {
    if (!user || !currentPet.name) return;

    try {
      const petRef = ref(database, `userPets/${user.uid}/${currentPet.id}`);
      await set(petRef, currentPet);

      setPets((prevPets) => {
        if (isEditMode) {
          return prevPets.map((pet) =>
            pet.id === currentPet.id ? currentPet : pet
          );
        } else {
          return [...prevPets, currentPet];
        }
      });

      setOpenPetDialog(false);
    } catch (error) {
      console.error("Error saving pet:", error);
      alert("Failed to save pet information. Please try again.");
    }
  }, [user, currentPet, isEditMode]);

  // const handleDeletePet = useCallback(
  //   async (petId) => {
  //     try {
  //       const petRef = ref(database, `userPets/${user.uid}/${petId}`);
  //       await remove(petRef);

  //       setPets((prevPets) => prevPets.filter((pet) => pet.id !== petId));
  //     } catch (error) {
  //       console.error("Error deleting pet:", error);
  //       alert("Failed to delete pet. Please try again.");
  //     }
  //   },
  //   [user]
  // );

  const handleAddVaccination = useCallback(() => {
    setCurrentVaccination({
      name: "",
      date: null,
      nextDue: null,
      notes: "",
    });
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
    setCurrentPet((prevPet) => {
      const updatedPet = { ...prevPet };
      updatedPet.vaccinations.splice(index, 1);
      return updatedPet;
    });
  }, []);

  const handleAcceptRequest = useCallback(
    async (request) => {
      try {
        const requestRef = ref(
          database,
          `matingRequests/received/${user.uid}/${request.id}`
        );
        await update(requestRef, {
          status: "accepted",
          updatedAt: Date.now(),
        });

        const senderRequestRef = ref(
          database,
          `matingRequests/sent/${request.senderId}/${request.id}`
        );
        await update(senderRequestRef, {
          status: "accepted",
          updatedAt: Date.now(),
        });

        setMatingRequests((prevRequests) =>
          prevRequests.map((req) =>
            req.id === request.id
              ? { ...req, status: "accepted", updatedAt: Date.now() }
              : req
          )
        );
      } catch (error) {
        console.error("Error accepting request:", error);
        alert("Failed to accept request. Please try again.");
      }
    },
    [user]
  );

  const handleDeclineRequest = useCallback(
    async (request) => {
      try {
        const requestRef = ref(
          database,
          `matingRequests/received/${user.uid}/${request.id}`
        );
        await update(requestRef, {
          status: "declined",
          updatedAt: Date.now(),
        });

        const senderRequestRef = ref(
          database,
          `matingRequests/sent/${request.senderId}/${request.id}`
        );
        await update(senderRequestRef, {
          status: "declined",
          updatedAt: Date.now(),
        });

        setMatingRequests((prevRequests) =>
          prevRequests.map((req) =>
            req.id === request.id
              ? { ...req, status: "declined", updatedAt: Date.now() }
              : req
          )
        );
      } catch (error) {
        console.error("Error declining request:", error);
        alert("Failed to decline request. Please try again.");
      }
    },
    [user]
  );

  // const handleOpenMessageDialog = useCallback(
  //   (request) => {
  //     const conversationId = `mating_${request.id}`;

  //     const senderPet = pets.find(
  //       (pet) =>
  //         pet.id ===
  //         (request.direction === "incoming"
  //           ? request.receiverPetId
  //           : request.senderPetId)
  //     );

  //     setCurrentMessage({
  //       text: "",
  //       recipientId:
  //         request.direction === "incoming"
  //           ? request.senderId
  //           : request.receiverId,
  //       recipientName:
  //         request.direction === "incoming"
  //           ? request.senderName
  //           : request.receiverName,
  //       petId:
  //         request.direction === "incoming"
  //           ? request.receiverPetId
  //           : request.senderPetId,
  //       receiverPetId:
  //         request.direction === "incoming"
  //           ? request.senderPetId
  //           : request.receiverPetId,
  //       matingRequestId: request.id,
  //       conversationId: conversationId,
  //       senderPet: senderPet,
  //       receiverPet: {
  //         name:
  //           request.direction === "incoming"
  //             ? request.senderPetName
  //             : request.receiverPetName,
  //         image:
  //           request.direction === "incoming"
  //             ? request.senderPetImage
  //             : request.receiverPetImage,
  //       },
  //     });

  //     setOpenMessageDialog(true);
  //   },
  //   [pets]
  // );

  useEffect(() => {
    if (user) {
      setIsLoading(true);

      const promises = [
        fetchUserPets(),
        fetchMatingRequests(),
      ];

      Promise.all(promises)
        .catch((error) => {
          console.error("Error loading profile data:", error);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [fetchMatingRequests, fetchUserPets, user]);

  const tabs = [
    { id: "pets", label: "Pets", icon: "🐾", count: pets.length },
    {
      id: "requests",
      label: "Requests",
      icon: "💕",
      count: matingRequests.length,
      badge: pendingRequestsCount,
    },
    { id: "messages", label: "Messages", icon: "💬", count: 0 },
  ];



  if (isLoading) {
    return <SkeletonLoader type="profile" />;
  }


  return (
    <>
      {isDesktop ? (
        <DesktopVersion
          user={user}
          pets={pets}
          matingRequests={matingRequests}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          tabs={tabs}
          handleAddPet={handleAddPet}
          handleEditPet={handleEditPet}
          handleAcceptRequest={handleAcceptRequest}
          handleDeclineRequest={handleDeclineRequest}
        />
      ) : (
        <MobileVersion
          user={user}
          pets={pets}
          matingRequests={matingRequests}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          tabs={tabs}
          handleAddPet={handleAddPet}
          handleEditPet={handleEditPet}
          handleAcceptRequest={handleAcceptRequest}
          handleDeclineRequest={handleDeclineRequest}
        />
      )}
      {openPetDialog && (
        <PetDialog
          open={openPetDialog}
          onClose={() => setOpenPetDialog(false)}
          pet={currentPet}
          setPet={setCurrentPet}
          onSave={handleSavePet}
          isEditMode={isEditMode}
          tabValue={tabValue}
          onTabChange={(e, val) => setTabValue(val)}
          onAddVaccination={handleAddVaccination}
          onEditVaccination={handleEditVaccination}
          onDeleteVaccination={handleDeleteVaccination}
          isMobile={!isDesktop}
        />
      )}
      {openVaccinationDialog && (
        <VaccinationDialog
          open={openVaccinationDialog}
          onClose={() => setOpenVaccinationDialog(false)}
          vaccination={currentVaccination}
          setVaccination={setCurrentVaccination}
          onSave={handleSaveVaccination}
          isEditMode={vaccinationEditIndex >= 0}
          isMobile={!isDesktop}
          petType={currentPet?.type}
          vaccinationEditIndex={vaccinationEditIndex}
          loading={isSavingVaccination}
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
          matingRequestId={currentMessage.matingRequestId}
          tabValue={tabValue}
          setMessage={setCurrentMessage}
        />
      )}
    </>
  );
};

export default Profile;