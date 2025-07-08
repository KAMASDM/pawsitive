import React, { useState, useEffect } from "react";
import { ref, get, set } from "firebase/database";
import { database, auth } from "../../firebase";
import { useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiHeart,
  FiInfo,
  FiMapPin,
  FiX,
  FiAward,
  FiPlusCircle,
  FiShield,
} from "react-icons/fi";
import MessageDialogForAdoption from "./MessageDialogForAdoption";
import SkeletonLoader from "../Loaders/SkeletonLoader";

// 1. PetDetailPopup component is now inside the same file
const PetDetailPopup = ({ pet, onClose, onMessageOwner }) => {
  if (!pet) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      {/* --- Style the scrollbar on this div --- */}
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh]  overflow-y-auto 
                   scrollbar-thin scrollbar-thumb-lavender-400 scrollbar-track-lavender-100 hover:scrollbar-thumb-lavender-500"
      >
        <div className="sticky top-0 bg-white p-4 border-b border-gray-200 flex justify-between items-center z-10">
          <h2 className="text-2xl font-bold text-lavender-800 flex items-center">
            <FiInfo className="mr-2" />
            {pet.name}'s Details
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-200"
          >
            <FiX className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <img
                src={pet.image}
                alt={pet.name}
                className="w-full h-64 object-cover rounded-lg shadow-md"
              />
            </div>
            <div className="flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-3xl font-bold text-gray-800">
                    {pet.name}
                  </h3>
                  <p className="text-gray-500">{pet.breed || "Unknown"}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${pet.gender === "Male"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-pink-100 text-pink-800"
                    }`}
                >
                  {pet.gender}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-gray-700 mb-4">
                <div className="flex items-center">
                  <FiAward className="mr-2 text-lavender-600" />
                  <span>{pet.age || "N/A"}</span>
                </div>
                <div className="flex items-center">
                  <FiMapPin className="mr-2 text-lavender-600" />
                  <span>{pet.distance} km away</span>
                </div>
              </div>

              {pet.description && (
                <p className="text-gray-600 mb-4">{pet.description}</p>
              )}

              <div className="mt-auto flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => onMessageOwner(pet)}
                  className="w-full flex items-center justify-center px-4 py-2 bg-lavender-600 text-white rounded-lg hover:bg-lavender-700 transition-colors"
                >
                  <FiHeart className="mr-2" />
                  Message Owner
                </button>
                <button
                  onClick={onClose}
                  className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>

          {(pet.medical || pet.vaccinations) && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-xl font-bold text-gray-800 mb-4">
                Additional Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {pet.medical && (
                  <div>
                    <h5 className="font-semibold mb-2 flex items-center">
                      <FiPlusCircle className="mr-2 text-lavender-600" />
                      Medical
                    </h5>
                    <ul className="space-y-1 text-gray-600 list-disc list-inside">
                      <li>
                        Allergies:{" "}
                        {pet.medical.allergies?.join(", ") || "None"}
                      </li>
                      <li>
                        Conditions:{" "}
                        {pet.medical.conditions?.join(", ") || "None"}
                      </li>
                      <li>Medications: {pet.medical.medications || "None"}</li>
                    </ul>
                  </div>
                )}
                {pet.vaccinations && pet.vaccinations.length > 0 && (
                  <div>
                    <h5 className="font-semibold mb-2 flex items-center">
                      <FiShield className="mr-2 text-lavender-600" />
                      Vaccinations
                    </h5>
                    <ul className="space-y-1 text-gray-600 list-disc list-inside">
                      {pet.vaccinations.map((vax, index) => (
                        <li key={index}>{vax.name}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const AdoptPet = () => {
  const navigate = useNavigate();
  const user = auth.currentUser;

  const [loading, setLoading] = useState(true);
  const [loadingUserLocation, setLoadingUserLocation] = useState(true);
  const [availablePets, setAvailablePets] = useState([]);
  const [filteredPets, setFilteredPets] = useState([]);
  const [userPets, setUserPets] = useState([]);
  const [selectedUserPetData, setSelectedUserPetData] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [maxDistance, setMaxDistance] = useState(25);
  const [locationError, setLocationError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [openMessageDialog, setOpenMessageDialog] = useState(false);
  const [currentMessage, setCurrentMessage] = useState({
    text: "",
    recipientId: "",
    petId: "",
    receiverPetId: "",
  });

  // State for the detail popup
  const [showDetailPopup, setShowDetailPopup] = useState(false);
  const [selectedPetForDetail, setSelectedPetForDetail] = useState(null);

  useEffect(() => {
    setLoadingUserLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setLoadingUserLocation(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          setLocationError(error.message);
          setLoadingUserLocation(false);
        }
      );
    } else {
      setLocationError("Geolocation is not supported by this browser.");
      setLoadingUserLocation(false);
    }
  }, []);

  useEffect(() => {
    const fetchUserPets = async () => {
      if (!user) {
        navigate("/", { state: { from: "/adopt-pets" } });
        return;
      }

      try {
        const userPetsRef = ref(database, `userPets/${user.uid}`);
        const snapshot = await get(userPetsRef);

        if (snapshot.exists()) {
          const petsData = snapshot.val();
          const petsArray = Object.keys(petsData).map((petId) => ({
            id: petId,
            ...petsData[petId],
          }));

          setUserPets(petsArray);

          if (petsArray.length > 0) {
            setSelectedUserPetData(petsArray[0]);
          }
        }
      } catch (error) {
        console.error("Error fetching user's pets:", error);
      }
    };

    fetchUserPets();
  }, [navigate, user]);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
  };

  useEffect(() => {
    const fetchAvailablePets = async () => {
      setLoading(true);
      if (!userLocation || !selectedUserPetData) return;
      try {
        const userPetsRef = ref(database, "userPets");
        const snapshot = await get(userPetsRef);

        if (snapshot.exists()) {
          const allPets = [];
          const petsData = snapshot.val();

          Object.keys(petsData).forEach((userId) => {
            if (userId === user?.uid) return;

            const userPets = petsData[userId];
            Object.keys(userPets).forEach((petId) => {
              const pet = userPets[petId];
              if (pet.availableForAdoption) {
                const petLocation = {
                  latitude: userLocation.latitude + (Math.random() - 0.5) * 0.1,
                  longitude:
                    userLocation.longitude + (Math.random() - 0.5) * 0.1,
                };

                const distance = calculateDistance(
                  userLocation.latitude,
                  userLocation.longitude,
                  petLocation.latitude,
                  petLocation.longitude
                );

                const ownerData = {
                  id: userId,
                  displayName: "Pet Owner",
                };

                allPets.push({
                  ...pet,
                  id: petId,
                  userId: userId,
                  distance: distance.toFixed(1),
                  location: petLocation,
                  owner: ownerData,
                });
              }
            });
          });

          allPets.sort((a, b) => a.distance - b.distance);

          setAvailablePets(allPets);
        } else {
          setAvailablePets([]);
        }
      } catch (error) {
        console.error("Error fetching available pets:", error);
      } finally {
        setLoading(false);
      }
    };

    if (userLocation && selectedUserPetData) {
      fetchAvailablePets();
    }
  }, [userLocation, selectedUserPetData, user]);

  useEffect(() => {
    if (!selectedUserPetData || availablePets.length === 0) {
      setFilteredPets([]);
      return;
    }

    const filtered = availablePets.filter((pet) => {
      if (pet.type !== selectedUserPetData.type) return false;
      if (pet.gender === selectedUserPetData.gender) return false;
      if (parseFloat(pet.distance) > maxDistance) return false;
      return true;
    });

    setFilteredPets(filtered);
  }, [selectedUserPetData, maxDistance, availablePets]);

  const handleTabChange = (newValue) => {
    setTabValue(newValue);
  };

  const handleDistanceChange = (e) => {
    setMaxDistance(e.target.value);
  };

  // Modified function to open the popup
  const handlePetDetail = (pet) => {
    setSelectedPetForDetail(pet);
    setShowDetailPopup(true);
  };

  const handleOpenMessageDialog = async (pet) => {
    const conversationId = `adopt_${[user.uid, pet.userId].sort().join("_")}`;
    const convoRef = ref(database, `conversations/${conversationId}`);
    const snapshot = await get(convoRef);

    if (!snapshot.exists()) {
      await set(convoRef, {
        participants: {
          [user.uid]: true,
          [pet.userId]: true,
        },
        petId: pet.id,
        createdAt: Date.now(),
        lastMessageTimestamp: Date.now(),
        isAdoption: true,
      });
    }

    setCurrentMessage({
      text: "",
      recipientId: pet.userId,
      recipientName: pet.owner?.displayName || "Pet Owner",
      senderPet: selectedUserPetData,
      receiverPet: pet,
      conversationId,
      isAdoption: true,
    });
    setOpenMessageDialog(true);
  };

  if (loadingUserLocation) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="w-12 h-12 border-4 border-lavender-200 border-t-lavender-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-lavender-900 font-medium">
          Getting your location...
        </p>
      </div>
    );
  }

  if (locationError) {
    return (
      <div className="p-4 sm:p-8 min-h-screen bg-lavender-50">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
          <p>
            Error: {locationError}. We need your location to find nearby pets.
          </p>
        </div>
        <p className="text-gray-700">
          Please enable location services in your browser and try again.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-lavender-50 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-full hover:bg-lavender-100 text-lavender-700"
            >
              <FiArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl md:text-3xl font-bold text-lavender-800 ml-4 flex items-center">
              <FiHeart className="text-pink-500 mr-2" />
              Adopt a Pet
            </h1>
          </div>
        </div>
        <div className="bg-gradient-to-r from-lavender-50 to-lavender-50 rounded-xl shadow-md p-6 mb-8 border border-lavender-100">
          <h2 className="text-xl font-bold text-lavender-900 mb-4">
            Find Matches For Your Pet
          </h2>
          {userPets.length === 0 ? (
            <div className="bg-lavender-100 border-l-4 border-lavender-500 text-lavender-700 p-4">
              <p>
                You don't have any pets in your profile yet. Please add a pet
                first.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              <div className="col-span-1">
                <p className="mb-2 text-gray-700">
                  Maximum Distance:{" "}
                  <span className="font-bold">{maxDistance} km</span>
                </p>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={maxDistance}
                  onChange={handleDistanceChange}
                  className="w-full h-2 bg-lavender-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-600 mt-1">
                  <span>1km</span>
                  <span>10km</span>
                  <span>25km</span>
                  <span>50km</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {userPets.length > 0 && (
          <>
            <div className="border-b border-gray-200 mb-6">
              <nav className="flex space-x-4 overflow-x-auto">
                <button
                  onClick={() => handleTabChange(0)}
                  className={`py-2 px-4 whitespace-nowrap ${tabValue === 0
                    ? "border-b-2 border-lavender-500 text-lavender-600"
                    : "text-gray-500 hover:text-gray-700"
                    }`}
                >
                  All Matches
                </button>
                <button
                  onClick={() => handleTabChange(1)}
                  className={`py-2 px-4 whitespace-nowrap ${tabValue === 1
                    ? "border-b-2 border-lavender-500 text-lavender-600"
                    : "text-gray-500 hover:text-gray-700"
                    }`}
                >
                  Nearby (&lt; 5km)
                </button>
                <button
                  onClick={() => handleTabChange(2)}
                  className={`py-2 px-4 whitespace-nowrap ${tabValue === 2
                    ? "border-b-2 border-lavender-500 text-lavender-600"
                    : "text-gray-500 hover:text-gray-700"
                    }`}
                >
                  Same Breed
                </button>
              </nav>
            </div>
            {loading ? (
              <div className="min-h-screen bg-lavender-50 p-6">
                <div className="max-w-7xl mx-auto">
                  <SkeletonLoader type="list" count={9} />
                </div>
              </div>
            ) : filteredPets.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPets.map((pet) => (
                  <div
                    key={pet.id}
                    className="bg-white rounded-xl shadow-md overflow-hidden transition-transform duration-300 hover:shadow-lg hover:-translate-y-2"
                  >
                    <div className="relative">
                      <div className="absolute top-3 right-3 z-10">
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-black bg-opacity-70 text-white text-sm">
                          <FiMapPin className="mr-1" />
                          {pet.distance} km
                        </span>
                      </div>
                      <div className="absolute top-3 left-3 z-10">
                        <span
                          className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full shadow ${pet.gender === "Female" &&
                            "bg-lavender-600 text-white"
                            }`}
                        >
                          {pet.gender}
                        </span>
                      </div>
                      {pet.image ? (
                        <img
                          src={pet.image}
                          alt={pet.name}
                          className="w-full h-48 object-cover"
                        />
                      ) : (
                        <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                          <FiHeart className="text-pink-400 text-5xl" />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-bold text-gray-900 mb-2">
                        {pet.name}
                      </h3>
                      <p className="text-gray-600 mb-1">
                        <span className="font-semibold">Breed:</span>{" "}
                        {pet.breed || "Unknown breed"}
                      </p>
                      <p className="text-gray-600 mb-3">
                        <span className="font-semibold">Age:</span>{" "}
                        {pet.age || "Unknown age"}
                      </p>
                      {pet.description && (
                        <p className="text-gray-600 text-sm mb-4">
                          {pet.description.length > 100
                            ? `${pet.description.substring(0, 100)}...`
                            : pet.description}
                        </p>
                      )}
                      <div className="flex justify-between">
                        <button
                          onClick={() => handlePetDetail(pet)}
                          className="flex items-center px-4 py-2 border border-lavender-600 text-lavender-600 rounded-lg hover:bg-lavender-50 transition-colors"
                        >
                          <FiInfo className="mr-2" />
                          Details
                        </button>
                        <button
                          onClick={() => handleOpenMessageDialog(pet)}
                          className="flex items-center px-4 py-2 bg-lavender-600 text-white rounded-lg hover:bg-lavender-700 transition-colors"
                        >
                          Message Owner
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl p-8 flex flex-col items-center">
                <div className="w-16 h-16 bg-pink-200 rounded-full flex items-center justify-center mb-4">
                  <FiHeart className="text-pink-500 text-2xl" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  No Matching Pets Found
                </h3>
                <p className="text-gray-600 text-center mb-6 max-w-md">
                  There are no pets available for adoption near you that match
                  your pet's profile. Try increasing the distance or checking
                  back later.
                </p>
                <button
                  onClick={() => navigate("/profile")}
                  className="flex items-center px-6 py-3 bg-lavender-600 text-white rounded-lg hover:bg-lavender-700 transition-colors"
                >
                  <FiArrowLeft className="mr-2" />
                  Back to Profile
                </button>
              </div>
            )}
          </>
        )}
        <MessageDialogForAdoption
          open={openMessageDialog}
          onClose={() => setOpenMessageDialog(false)}
          conversationId={currentMessage.conversationId}
          recipientId={currentMessage.recipientId}
          recipientName={currentMessage.recipientName}
          senderPet={currentMessage.senderPet}
          receiverPet={currentMessage.receiverPet}
          matingRequestId={currentMessage.matingRequestId}
        />
        {/* Render the popup */}
        {showDetailPopup && (
          <PetDetailPopup
            pet={selectedPetForDetail}
            onClose={() => setShowDetailPopup(false)}
            onMessageOwner={(pet) => {
              setShowDetailPopup(false);
              handleOpenMessageDialog(pet);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default AdoptPet;