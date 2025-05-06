import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { auth, db, database } from "../../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { ref, set, get, update, remove } from "firebase/database";
import {
  FiPlus,
  FiHeart,
  FiMessageSquare,
  FiX,
  FiCheck,
  FiMoreVertical,
} from "react-icons/fi";
import { FaPaw } from "react-icons/fa";
import UserInfo from "./components/UserInfo";
import PetCard from "./components/PetCard";
import PetDialog from "./components/PetDialog";
import ResourcesList from "./components/ResourcesList";
import VaccinationDialog from "./components/VaccinationDialog";
import MessageDialog from "./components/MessageDialog";
import ConversationsList from "./components/ConversationsList";
import useResponsive from "../../hooks/useResponsive";
import MeetingDetailsSkeleton from "../../UI/MeetingDetailsSkeleton";

const TabPanel = ({ children, value, index }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
    >
      <AnimatePresence mode="wait">
        {value === index && (
          <motion.div
            key={`panel-${index}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="py-6"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Profile = () => {
  const navigate = useNavigate();
  const { isMobile } = useResponsive();
  const user = auth.currentUser;

  const [likedResources, setLikedResources] = useState([]);
  const [pets, setPets] = useState([]);
  const [profileTabValue, setProfileTabValue] = useState(0);
  const [matingRequests, setMatingRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openPetDialog, setOpenPetDialog] = useState(false);
  const [openVaccinationDialog, setOpenVaccinationDialog] = useState(false);
  const [isSavingVaccination, setIsSavingVaccination] = useState(false);
  const [openMessageDialog, setOpenMessageDialog] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [currentPet, setCurrentPet] = useState({
    id: "",
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

  const fetchLikedResources = useCallback(async () => {
    if (!user) return;
    try {
      const userLikesRef = ref(database, `userLikes/${user.uid}`);
      const snapshot = await get(userLikesRef);

      if (snapshot.exists()) {
        const likedResourceIds = Object.keys(snapshot.val());
        const likedResourcesArray = [];

        for (const resourceId of likedResourceIds) {
          const resourceRef = ref(database, `resources/${resourceId}`);
          const resourceSnapshot = await get(resourceRef);

          if (resourceSnapshot.exists()) {
            const resourceData = resourceSnapshot.val();
            likedResourcesArray.push({
              id: resourceId,
              ...resourceData,
            });
          } else {
            try {
              const resourceDoc = await getDoc(
                doc(db, "resources", resourceId)
              );
              if (resourceDoc.exists()) {
                likedResourcesArray.push({
                  id: resourceId,
                  ...resourceDoc.data(),
                });
              }
            } catch (err) {
              console.warn("Could not fetch resource from Firestore:", err);
            }
          }
        }

        setLikedResources(likedResourcesArray);
      } else {
        const resourcesCollection = collection(db, "resources");
        const q = query(resourcesCollection);
        const querySnapshot = await getDocs(q);
        const likedResourcesArray = [];

        for (const resourceDoc of querySnapshot.docs) {
          const likesCollection = collection(
            db,
            "resources",
            resourceDoc.id,
            "likes"
          );
          const likeDocRef = doc(likesCollection, user.uid);
          const likeDoc = await getDoc(likeDocRef);
          if (likeDoc.exists()) {
            const resourceData = resourceDoc.data();
            likedResourcesArray.push({
              id: resourceDoc.id,
              ...resourceData,
            });
          }
        }

        setLikedResources(likedResourcesArray);
      }
    } catch (error) {
      console.error("Error fetching liked resources:", error);
    }
  }, [user]);

  const fetchUserComments = useCallback(async () => {
    if (!user) return;

    try {
      const userCommentsRef = ref(database, `userComments/${user.uid}`);
      const snapshot = await get(userCommentsRef);

      if (snapshot.exists()) {
        const commentsData = snapshot.val();
        const commentsArray = [];

        for (const resourceId in commentsData) {
          for (const commentId in commentsData[resourceId]) {
            const comment = commentsData[resourceId][commentId];

            try {
              const resourceRef = ref(database, `resources/${resourceId}`);
              const resourceSnapshot = await get(resourceRef);
              const resourceName = resourceSnapshot.exists()
                ? resourceSnapshot.val().name
                : "Unknown Resource";

              commentsArray.push({
                id: commentId,
                resourceId,
                resourceName,
                ...comment,
              });
            } catch (err) {
              console.warn("Error fetching resource for comment:", err);
            }
          }
        }
      } else {
        const commentsArray = [];
        const resourcesCollection = collection(db, "resources");
        const q = query(resourcesCollection);
        const querySnapshot = await getDocs(q);

        for (const resourceDoc of querySnapshot.docs) {
          const commentsCollection = collection(
            db,
            "resources",
            resourceDoc.id,
            "comments"
          );
          const userCommentsQuery = query(
            commentsCollection,
            where("userId", "==", user.uid)
          );
          const commentsSnapshot = await getDocs(userCommentsQuery);
          commentsSnapshot.forEach((commentDoc) => {
            commentsArray.push({
              id: commentDoc.id,
              resourceId: resourceDoc.id,
              resourceName: resourceDoc.data().name,
              ...commentDoc.data(),
            });
          });
        }
      }
    } catch (error) {
      console.error("Error fetching user comments:", error);
    }
  }, [user]);

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

        if (user) {
          user.pets = petsArray;
        }
      } else {
        setPets([]);
        if (user) {
          user.pets = [];
        }
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

      if (user) {
        user.matingRequests = requests;
      }
    } catch (error) {
      console.error("Error fetching mating requests:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const handleProfileTabChange = (newValue) => {
    setProfileTabValue(newValue);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleAddPet = () => {
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
  };

  const handleEditPet = (pet, section) => {
    setCurrentPet({ ...pet });
    setIsEditMode(true);
    setOpenPetDialog(true);

    if (section === "vaccinations") {
      setTabValue(2);
    }
  };

  const handleSavePet = async () => {
    if (!user || !currentPet.name) return;

    try {
      const petRef = ref(database, `userPets/${user.uid}/${currentPet.id}`);
      await set(petRef, currentPet);

      if (isEditMode) {
        setPets(
          pets.map((pet) => (pet.id === currentPet.id ? currentPet : pet))
        );
      } else {
        setPets([...pets, currentPet]);
      }

      if (user) {
        user.pets = isEditMode
          ? pets.map((pet) => (pet.id === currentPet.id ? currentPet : pet))
          : [...pets, currentPet];
      }

      setOpenPetDialog(false);
    } catch (error) {
      console.error("Error saving pet:", error);
      alert("Failed to save pet information. Please try again.");
    }
  };

  const handleDeletePet = async (petId) => {
    try {
      const petRef = ref(database, `userPets/${user.uid}/${petId}`);
      await remove(petRef);

      const updatedPets = pets.filter((pet) => pet.id !== petId);
      setPets(updatedPets);

      if (user) {
        user.pets = updatedPets;
      }
    } catch (error) {
      console.error("Error deleting pet:", error);
      alert("Failed to delete pet. Please try again.");
    }
  };

  const handleAddVaccination = () => {
    setCurrentVaccination({
      name: "",
      date: null,
      nextDue: null,
      notes: "",
    });
    setVaccinationEditIndex(-1);
    setOpenVaccinationDialog(true);
  };

  const handleEditVaccination = (vaccination, index) => {
    setCurrentVaccination({ ...vaccination });
    setVaccinationEditIndex(index);
    setOpenVaccinationDialog(true);
  };

  const handleSaveVaccination = async () => {
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
  };

  const handleDeleteVaccination = (index) => {
    const updatedPet = { ...currentPet };
    updatedPet.vaccinations.splice(index, 1);
    setCurrentPet(updatedPet);
  };

  const handleToggleRequestDropdown = (request, e) => {
    if (e) e.stopPropagation();
    setSelectedRequest(request);
    setShowDropdown((prev) => !prev);
  };

  const handleAcceptRequest = async () => {
    if (!selectedRequest) return;

    try {
      const requestRef = ref(
        database,
        `matingRequests/received/${user.uid}/${selectedRequest.id}`
      );
      await update(requestRef, {
        status: "accepted",
        updatedAt: Date.now(),
      });

      const senderRequestRef = ref(
        database,
        `matingRequests/sent/${selectedRequest.senderId}/${selectedRequest.id}`
      );
      await update(senderRequestRef, {
        status: "accepted",
        updatedAt: Date.now(),
      });

      const updatedRequests = matingRequests.map((req) =>
        req.id === selectedRequest.id
          ? { ...req, status: "accepted", updatedAt: Date.now() }
          : req
      );

      setMatingRequests(updatedRequests);

      if (user) {
        user.matingRequests = updatedRequests;
      }

      setShowDropdown(false);
    } catch (error) {
      console.error("Error accepting request:", error);
      alert("Failed to accept request. Please try again.");
    }
  };

  const handleDeclineRequest = async () => {
    if (!selectedRequest) return;

    try {
      const requestRef = ref(
        database,
        `matingRequests/received/${user.uid}/${selectedRequest.id}`
      );
      await update(requestRef, {
        status: "declined",
        updatedAt: Date.now(),
      });

      const senderRequestRef = ref(
        database,
        `matingRequests/sent/${selectedRequest.senderId}/${selectedRequest.id}`
      );
      await update(senderRequestRef, {
        status: "declined",
        updatedAt: Date.now(),
      });

      const updatedRequests = matingRequests.map((req) =>
        req.id === selectedRequest.id
          ? { ...req, status: "declined", updatedAt: Date.now() }
          : req
      );

      setMatingRequests(updatedRequests);

      if (user) {
        user.matingRequests = updatedRequests;
      }

      setShowDropdown(false);
    } catch (error) {
      console.error("Error declining request:", error);
      alert("Failed to decline request. Please try again.");
    }
  };

  const handleOpenMessageDialog = (request) => {
    const conversationId = `mating_${request.id}`;

    const senderPet = pets.find(
      (pet) =>
        pet.id ===
        (request.direction === "incoming"
          ? request.receiverPetId
          : request.senderPetId)
    );

    setCurrentMessage({
      text: "",
      recipientId:
        request.direction === "incoming"
          ? request.senderId
          : request.receiverId,
      recipientName:
        request.direction === "incoming"
          ? request.senderName
          : request.receiverName,
      petId:
        request.direction === "incoming"
          ? request.receiverPetId
          : request.senderPetId,
      receiverPetId:
        request.direction === "incoming"
          ? request.senderPetId
          : request.receiverPetId,
      matingRequestId: request.id,
      conversationId: conversationId,
      senderPet: senderPet,
      receiverPet: {
        name:
          request.direction === "incoming"
            ? request.senderPetName
            : request.receiverPetName,
        image:
          request.direction === "incoming"
            ? request.senderPetImage
            : request.receiverPetImage,
      },
    });

    setOpenMessageDialog(true);
  };

  const handleOpenConversationFromList = (conversation) => {
    setCurrentMessage({
      text: "",
      recipientId: conversation.otherParticipantId,
      recipientName: conversation.otherParticipantName,
      senderPet: conversation.senderPet,
      receiverPet: conversation.receiverPet,
      matingRequestId: conversation.matingRequestId,
      conversationId: conversation.id,
    });

    setOpenMessageDialog(true);
  };

  useEffect(() => {
    if (user) {
      setIsLoading(true);

      if (user) {
        user.pets = [];
        user.matingRequests = [];
        user.connections = [];
      }

      const promises = [
        fetchUserPets(),
        fetchMatingRequests(),
        fetchLikedResources(),
        fetchUserComments(),
      ];

      Promise.all(promises)
        .catch((error) => {
          console.error("Error loading profile data:", error);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [
    fetchLikedResources,
    fetchMatingRequests,
    fetchUserComments,
    fetchUserPets,
    user,
  ]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-lavender-50">
        <div className="container max-w-7xl mx-auto py-6 px-4">
          <MeetingDetailsSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-lavender-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
        {pendingRequestsCount > 0 && (
          <button
            onClick={() => handleProfileTabChange(2)}
            className="bg-pink-100 text-pink-800 px-3 py-1 rounded-full text-sm font-medium flex items-center"
          >
            <span className="bg-pink-500 text-white w-5 h-5 rounded-full flex items-center justify-center mr-1.5">
              {pendingRequestsCount}
            </span>
            Pending Requests
          </button>
        )}
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <UserInfo user={user} />
        <div className="mt-6 mb-2 border-b border-gray-200 overflow-x-auto hide-scrollbar">
          <div className="flex">
            <button
              onClick={() => handleProfileTabChange(0)}
              className={`px-4 py-3 text-sm font-medium flex items-center border-b-2 transition-colors ${
                profileTabValue === 0
                  ? "text-lavender-700 border-lavender-600"
                  : "text-gray-500 border-transparent hover:text-lavender-600 hover:border-lavender-200"
              }`}
            >
              <FaPaw
                className={`${
                  profileTabValue === 0 ? "text-lavender-600" : "text-gray-400"
                } mr-2`}
              />
              My Pets
            </button>
            <button
              onClick={() => handleProfileTabChange(1)}
              className={`px-4 py-3 text-sm font-medium flex items-center border-b-2 transition-colors ${
                profileTabValue === 1
                  ? "text-lavender-700 border-lavender-600"
                  : "text-gray-500 border-transparent hover:text-lavender-600 hover:border-lavender-200"
              }`}
            >
              <FiHeart
                className={`${
                  profileTabValue === 1 ? "text-lavender-600" : "text-gray-400"
                } mr-2`}
              />
              Resources
            </button>
            <button
              onClick={() => handleProfileTabChange(2)}
              className={`px-4 py-3 text-sm font-medium flex items-center border-b-2 transition-colors ${
                profileTabValue === 2
                  ? "text-lavender-700 border-lavender-600"
                  : "text-gray-500 border-transparent hover:text-lavender-600 hover:border-lavender-200"
              }`}
            >
              <div className="relative mr-2">
                <FiHeart
                  className={`${
                    profileTabValue === 2
                      ? "text-lavender-600"
                      : "text-gray-400"
                  }`}
                />
                {pendingRequestsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
                )}
              </div>
              Mating Requests
            </button>
            <button
              onClick={() => handleProfileTabChange(3)}
              className={`px-4 py-3 text-sm font-medium flex items-center border-b-2 transition-colors ${
                profileTabValue === 3
                  ? "text-lavender-700 border-lavender-600"
                  : "text-gray-500 border-transparent hover:text-lavender-600 hover:border-lavender-200"
              }`}
            >
              <FiMessageSquare
                className={`${
                  profileTabValue === 3 ? "text-lavender-600" : "text-gray-400"
                } mr-2`}
              />
              Messages
            </button>
          </div>
        </div>
        <TabPanel value={profileTabValue} index={0}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-lavender-900">My Pets</h2>
            <button
              onClick={handleAddPet}
              className="bg-lavender-600 hover:bg-lavender-700 text-white p-3 rounded-full shadow-md transition-colors"
            >
              <FiPlus className="w-5 h-5" />
            </button>
          </div>
          {pets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pets.map((pet) => (
                <PetCard
                  key={pet.id}
                  pet={pet}
                  onEdit={handleEditPet}
                  onDelete={handleDeletePet}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm p-8 text-center border border-lavender-100">
              <div className="w-20 h-20 bg-lavender-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaPaw className="text-lavender-400 w-10 h-10" />
              </div>
              <h3 className="text-lg font-semibold text-lavender-900 mb-2">
                You haven't added any pets yet
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Add your pets to discover resources, find mating partners, and
                track their health information all in one place.
              </p>
              <button
                onClick={handleAddPet}
                className="px-4 py-2 bg-lavender-600 hover:bg-lavender-700 text-white rounded-lg inline-flex items-center"
              >
                <FiPlus className="mr-2" />
                Add Your First Pet
              </button>
            </div>
          )}
        </TabPanel>
        <TabPanel value={profileTabValue} index={1}>
          <ResourcesList resources={likedResources} navigate={navigate} />
        </TabPanel>
        <TabPanel value={profileTabValue} index={2}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-lavender-900">
              Mating Requests
            </h2>
          </div>
          {matingRequests.length > 0 ? (
            <div className="space-y-4">
              {matingRequests.map((request) => (
                <div
                  key={request.id}
                  className="bg-white rounded-xl shadow-sm border border-lavender-100 p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center">
                      <div className="w-12 h-12 rounded-full bg-lavender-100 overflow-hidden flex-shrink-0 flex items-center justify-center text-white text-sm font-medium">
                        {request.direction === "incoming" ? (
                          request.senderPetImage ? (
                            <img
                              src={request.senderPetImage}
                              alt={request.senderPetName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span>{request.senderPetName?.[0] || "P"}</span>
                          )
                        ) : request.receiverPetImage ? (
                          <img
                            src={request.receiverPetImage}
                            alt={request.receiverPetName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>{request.receiverPetName?.[0] || "P"}</span>
                        )}
                      </div>
                      <div className="ml-3">
                        <div className="text-sm text-gray-500">
                          {request.direction === "incoming"
                            ? "Request from"
                            : "Request to"}
                        </div>
                        <div className="font-medium text-lavender-900">
                          {request.direction === "incoming"
                            ? request.senderName
                            : request.receiverName}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {request.direction === "incoming"
                            ? `${request.senderPetName} (${
                                request.senderPetBreed || "Unknown breed"
                              })`
                            : `${request.receiverPetName} (${
                                request.receiverPetBreed || "Unknown breed"
                              })`}{" "}
                          for your{" "}
                          {request.direction === "incoming"
                            ? request.receiverPetName
                            : request.senderPetName}
                        </div>
                        {request.message && (
                          <div className="mt-2 text-sm text-gray-700 bg-lavender-50 p-2 rounded-md">
                            "{request.message}"
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="text-xs px-2 py-1 rounded-full font-medium mr-2">
                        {request.status === "pending" ? (
                          <span className="text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full">
                            Pending
                          </span>
                        ) : request.status === "accepted" ? (
                          <span className="text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                            Accepted
                          </span>
                        ) : (
                          <span className="text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                            Declined
                          </span>
                        )}
                      </div>
                      {request.status === "pending" &&
                        request.direction === "incoming" && (
                          <div className="relative">
                            <button
                              onClick={(e) =>
                                handleToggleRequestDropdown(request, e)
                              }
                              className="p-2 rounded-full hover:bg-lavender-100 transition-colors"
                            >
                              <FiMoreVertical className="w-5 h-5 text-gray-500" />
                            </button>
                            {selectedRequest &&
                              selectedRequest.id === request.id &&
                              showDropdown && (
                                <div className="absolute right-0 top-10 bg-white shadow-lg rounded-lg z-10 w-36 py-1 border border-gray-200">
                                  <button
                                    onClick={handleAcceptRequest}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-lavender-50 flex items-center"
                                  >
                                    <FiCheck className="mr-2 text-green-500" />
                                    Accept
                                  </button>
                                  <button
                                    onClick={handleDeclineRequest}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-lavender-50 flex items-center"
                                  >
                                    <FiX className="mr-2 text-red-500" />
                                    Decline
                                  </button>
                                </div>
                              )}
                          </div>
                        )}
                      {request.status === "accepted" && (
                        <button
                          onClick={() => handleOpenMessageDialog(request)}
                          className="p-2 rounded-full hover:bg-lavender-100 transition-colors"
                        >
                          <FiMessageSquare className="w-5 h-5 text-lavender-600" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm p-8 text-center border border-lavender-100">
              <div className="w-20 h-20 bg-lavender-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiHeart className="text-lavender-400 w-10 h-10" />
              </div>
              <h3 className="text-lg font-semibold text-lavender-900 mb-2">
                No mating requests yet
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                When you receive mating requests for your pets, or send requests
                to others, they will appear here.
              </p>
              <button
                onClick={() => navigate("/dashboard")}
                className="px-4 py-2 bg-lavender-600 hover:bg-lavender-700 text-white rounded-lg inline-flex items-center"
              >
                <FiHeart className="mr-2" />
                Find Matches
              </button>
            </div>
          )}
        </TabPanel>
        <TabPanel value={profileTabValue} index={3}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-lavender-900">Messages</h2>
          </div>
          <ConversationsList
            user={user}
            pets={pets}
            onOpenConversation={handleOpenConversationFromList}
          />
        </TabPanel>
      </div>
      {openPetDialog && (
        <PetDialog
          open={openPetDialog}
          onClose={() => setOpenPetDialog(false)}
          pet={currentPet}
          setPet={setCurrentPet}
          onSave={handleSavePet}
          isEditMode={isEditMode}
          tabValue={tabValue}
          onTabChange={handleTabChange}
          onAddVaccination={handleAddVaccination}
          onEditVaccination={handleEditVaccination}
          onDeleteVaccination={handleDeleteVaccination}
          isMobile={isMobile}
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
          isMobile={isMobile}
          petType={currentPet.type}
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
        />
      )}
    </div>
  );
};

export default Profile;
