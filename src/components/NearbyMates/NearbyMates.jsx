import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ref, get, set, query, orderByChild, equalTo } from "firebase/database";
import { database, auth } from "../../firebase";
import { sendMatingRequestNotification } from "../../services/notificationService";
import {
  FiArrowLeft,
  FiMapPin,
  FiHeart,
  FiFilter,
  FiChevronDown,
  FiX,
  FiCheck,
} from "react-icons/fi";
import { FaPaw } from "react-icons/fa";
import PetCard from "./PetCard";
import PetMatingRequestModal from "./PetMatingRequestModal";
import SkeletonLoader from "../Loaders/SkeletonLoader";

const NearbyMates = () => {
  const navigate = useNavigate();
  const user = auth.currentUser;

  const [loading, setLoading] = useState(true);
  const [locationLoading, setLocationLoading] = useState(true);
  const [availablePets, setAvailablePets] = useState([]);
  const [filteredPets, setFilteredPets] = useState([]);
  const [userPets, setUserPets] = useState([]);
  const [selectedUserPet, setSelectedUserPet] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [maxDistance, setMaxDistance] = useState(10);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPet, setSelectedPet] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setLocationLoading(true);
    if (!user) {
      navigate("/", { state: { from: "/nearby-mates" } });
      return;
    }
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setLocationLoading(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          setLocationError(error.message);
          setLocationLoading(false);
          setShowLocationPrompt(true);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    } else {
      setLocationError("Geolocation is not supported by this browser.");
      setLocationLoading(false);
      setShowLocationPrompt(true);
    }
  }, [navigate, user]);

  useEffect(() => {
    const fetchUserPets = async () => {
      setLoading(true);
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
          setUserPets(petsArray);
          if (petsArray.length > 0) {
            setSelectedUserPet(petsArray[0]);
          }
        } else {
          setUserPets([]);
        }
      } catch (error) {
        console.error("Error fetching user's pets:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserPets();
  }, [user]);

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
    return R * c;
  };

  useEffect(() => {
    const fetchAvailablePets = async () => {
      setLoading(true);
      if (!userLocation || !selectedUserPet) {
        return;
      }
      try {
        const userPetsRef = ref(database, "userPets");
        const snapshot = await get(userPetsRef);

        if (snapshot.exists()) {
          const allPets = [];
          const petsData = snapshot.val();
          console.log('[NearbyMates] Total users with pets:', Object.keys(petsData).length);

          Object.keys(petsData).forEach((userId) => {
            if (userId === user?.uid) return;

            const userPets = petsData[userId];
            if (!userPets) return;
            
            Object.keys(userPets).forEach((petId) => {
              const pet = userPets[petId];
              if (!pet || !pet.availableForMating) return;
              
              console.log('[NearbyMates] Found available pet:', pet.name);
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
            });
          });
          allPets.sort((a, b) => a.distance - b.distance);
          console.log('[NearbyMates] Found', allPets.length, 'pets available for mating');
          setAvailablePets(allPets);
        } else {
          console.log('[NearbyMates] No pets data in database');
          setAvailablePets([]);
        }
      } catch (error) {
        console.error("Error fetching available pets:", error);
      } finally {
        setLoading(false);
      }
    };

    if (userLocation && selectedUserPet) {
      fetchAvailablePets();
    }
  }, [userLocation, selectedUserPet?.id, user?.uid]); // Only refetch when these specific values change

  useEffect(() => {
    if (!selectedUserPet || availablePets.length === 0) {
      setFilteredPets([]);
      return;
    }

    let filtered = availablePets.filter((pet) => {
      if (pet.type !== selectedUserPet.type) return false;
      if (pet.gender === selectedUserPet.gender) return false;
      if (parseFloat(pet.distance) > maxDistance) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          pet.name?.toLowerCase().includes(query) ||
          pet.breed?.toLowerCase().includes(query) ||
          pet.description?.toLowerCase().includes(query)
        );
      }
      return true;
    });

    if (activeCategory === "nearby") {
      filtered = filtered.filter((pet) => parseFloat(pet.distance) < 5);
    } else if (activeCategory === "breed") {
      filtered = filtered.filter(
        (pet) =>
          pet.breed &&
          selectedUserPet.breed &&
          pet.breed.toLowerCase() === selectedUserPet.breed.toLowerCase()
      );
    }
    setFilteredPets(filtered);
  }, [
    selectedUserPet,
    maxDistance,
    availablePets,
    activeCategory,
    searchQuery,
  ]);

  const handleSendMatingRequest = async (requestData) => {
    if (!user || !selectedUserPet || !selectedPet) return;
    try {
      const requestId = Date.now().toString();
      const receiverRequestRef = ref(
        database,
        `matingRequests/received/${selectedPet.userId}/${requestId}`
      );
      await set(receiverRequestRef, {
        id: requestId,
        senderId: user.uid,
        senderName: user.displayName,
        senderPetId: selectedUserPet.id,
        senderPetName: selectedUserPet.name,
        senderPetBreed: selectedUserPet.breed,
        senderPetGender: selectedUserPet.gender,
        senderPetAge: selectedUserPet.age,
        receiverId: selectedPet.userId,
        receiverPetId: selectedPet.id,
        receiverPetName: selectedPet.name,
        message: requestData.message,
        status: "pending",
        createdAt: Date.now(),
        direction: "incoming",
      });
      const senderRequestRef = ref(
        database,
        `matingRequests/sent/${user.uid}/${requestId}`
      );
      await set(senderRequestRef, {
        id: requestId,
        senderId: user.uid,
        senderName: user.displayName,
        senderPetId: selectedUserPet.id,
        senderPetName: selectedUserPet.name,
        senderPetBreed: selectedUserPet.breed,
        senderPetGender: selectedUserPet.gender,
        senderPetAge: selectedUserPet.age,
        receiverId: selectedPet.userId,
        receiverPetId: selectedPet.id,
        receiverPetName: selectedPet.name,
        message: requestData.message,
        status: "pending",
        createdAt: Date.now(),
        direction: "outgoing",
      });
      
      // Get receiver's data and send notification
      const receiverRef = ref(database, `users/${selectedPet.userId}`);
      const receiverSnapshot = await get(receiverRef);
      
      if (receiverSnapshot.exists()) {
        const receiverData = receiverSnapshot.val();
        const senderData = {
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
        };
        
        const notificationData = {
          id: requestId,
          senderPetName: selectedUserPet.name,
          senderPetBreed: selectedUserPet.breed,
          senderPetGender: selectedUserPet.gender,
          senderPetAge: selectedUserPet.age,
          receiverPetName: selectedPet.name,
          message: requestData.message,
        };
        
        // Send email and push notification
        sendMatingRequestNotification(receiverData, senderData, notificationData)
          .catch(err => console.error('Failed to send mating request notification:', err));
      }
      
      setShowRequestModal(false);
    } catch (error) {
      console.error("Error sending mating request:", error);
    }
  };

  if (locationLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-lavender-50">
        <div className="w-16 h-16 border-4 border-lavender-200 border-t-lavender-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-lavender-900 font-medium">
          Getting your location...
        </p>
      </div>
    );
  }

  if (showLocationPrompt) {
    return (
      <div className="min-h-screen bg-lavender-50 p-4 sm:p-8">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-6 sm:p-8">
          <div className="flex flex-col items-center text-center">
            <div className="h-24 w-24 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <FiMapPin className="h-12 w-12 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-lavender-900 mb-2">
              Location Access Required
            </h2>
            <p className="text-gray-600 mb-6">
              We need access to your location to find pets near you. Please
              enable location services in your browser and try again.
            </p>
            <p className="text-sm text-gray-500 mb-8">Error: {locationError}</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate(-1)}
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-full transition-colors duration-300"
              >
                Go Back
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-lavender-600 hover:bg-lavender-700 text-white rounded-full transition-colors duration-300"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Check if user has no pets
  if (!loading && userPets.length === 0) {
    return (
      <div className="min-h-screen bg-lavender-50 p-4 sm:p-8">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-6 sm:p-8">
          <div className="flex flex-col items-center text-center">
            <div className="h-24 w-24 bg-lavender-100 rounded-full flex items-center justify-center mb-6">
              <FaPaw className="h-12 w-12 text-lavender-500" />
            </div>
            <h2 className="text-2xl font-bold text-lavender-900 mb-2">
              No Pets Added Yet
            </h2>
            <p className="text-gray-600 mb-6">
              You need to add at least one pet to your profile before you can find mates.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate(-1)}
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-full transition-colors duration-300"
              >
                Go Back
              </button>
              <button
                onClick={() => navigate('/profile')}
                className="px-6 py-3 bg-lavender-600 hover:bg-lavender-700 text-white rounded-full transition-colors duration-300"
              >
                Add Your Pet
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-lavender-50">
      <div className="sticky top-16 z-40 bg-lavender-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="bg-lavender-100 rounded-2xl shadow-md p-4 sm:p-6 mb-6 border border-lavender-100 mt-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <button
                    onClick={() => navigate(-1)}
                    className="mr-3 p-2 hover:bg-lavender-100 rounded-full transition-colors text-lavender-700 hover:text-lavender-900"
                  >
                    <FiArrowLeft className="w-5 h-5" />
                  </button>
                  <h2 className="text-lg font-bold text-lavender-900 flex items-center">
                    <FiHeart className="mr-2 text-pink-500" />
                    Nearby Mates
                  </h2>
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center text-sm font-medium text-lavender-600 hover:text-lavender-800"
                >
                  Filters <FiFilter className="ml-1 w-4 h-4" />
                </button>
              </div>
              <div className="mb-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by name, breed..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full py-2 pl-4 pr-10 rounded-full border border-lavender-300 bg-lavender-50 text-lavender-900 focus:ring-2 focus:ring-lavender-500 focus:border-transparent focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <FiX className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:flex sm:items-center sm:space-x-3">
                <button
                  onClick={() => setActiveCategory("all")}
                  className={`px-3 py-2 sm:px-4 rounded-full text-sm whitespace-nowrap transition-all ${
                    activeCategory === "all"
                      ? "bg-lavender-600 text-white font-medium shadow-sm"
                      : "text-lavender-700 hover:bg-lavender-100"
                  }`}
                >
                  All Matches
                </button>
                <button
                  onClick={() => setActiveCategory("nearby")}
                  className={`px-3 py-2 sm:px-4 rounded-full text-sm whitespace-nowrap transition-all flex items-center justify-center ${
                    activeCategory === "nearby"
                      ? "bg-lavender-600 text-white font-medium shadow-sm"
                      : "text-lavender-700 hover:bg-lavender-100"
                  }`}
                >
                  <FiMapPin
                    className={`mr-1 ${
                      activeCategory === "nearby"
                        ? "text-white"
                        : "text-lavender-600"
                    }`}
                  />
                  <span className="hidden sm:inline">Nearby</span>
                  <span className="sm:hidden">{"<"}5km</span>
                </button>
                <button
                  onClick={() => setActiveCategory("breed")}
                  className={`px-3 py-2 sm:px-4 rounded-full text-sm whitespace-nowrap transition-all ${
                    activeCategory === "breed"
                      ? "bg-lavender-600 text-white font-medium shadow-sm"
                      : "text-lavender-700 hover:bg-lavender-100"
                  }`}
                >
                  Same Breed
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 pb-6 sm:px-6 pt-0">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-md p-4 sm:p-6 mb-6 border border-lavender-100"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-lavender-900">Your Pet</h2>
            {userPets.length > 1 && (
              <div className="relative">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center text-sm font-medium text-lavender-600 hover:text-lavender-800"
                >
                  Change Pet <FiChevronDown className="ml-1" />
                </button>
              </div>
            )}
          </div>
          {selectedUserPet && (
            <div className="flex items-center">
              <div className="h-16 w-16 rounded-full overflow-hidden bg-lavender-100 flex items-center justify-center">
                {selectedUserPet.image ? (
                  <img
                    src={selectedUserPet.image}
                    alt={selectedUserPet.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <FaPaw className="h-8 w-8 text-lavender-300" />
                )}
              </div>
              <div className="ml-4">
                <p className="font-semibold text-lavender-900">
                  {selectedUserPet.name}
                </p>
                <div className="flex items-center mt-1 flex-wrap">
                  <span className="text-sm text-gray-600">
                    {selectedUserPet.breed || "Unknown breed"}
                  </span>
                  <span className="mx-2 h-1 w-1 rounded-full bg-gray-400 hidden sm:inline-block"></span>
                  <span className="text-sm text-gray-600 ml-2 sm:ml-0">
                    {selectedUserPet.gender}
                  </span>
                  <span className="mx-2 h-1 w-1 rounded-full bg-gray-400 hidden sm:inline-block"></span>
                  <span className="text-sm text-gray-600 ml-2 sm:ml-0">
                    {selectedUserPet.age || "Unknown age"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </motion.div>
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white rounded-2xl shadow-md overflow-hidden mb-6 border border-lavender-100"
            >
              <div className="p-4 sm:p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lavender-900">
                    Filter Options
                  </h3>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>
                {userPets.length > 1 && (
                  <div className="mb-6">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Select Your Pet
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {userPets.map((pet) => (
                        <button
                          key={pet.id}
                          onClick={() => setSelectedUserPet(pet)}
                          className={`flex flex-col items-center p-3 rounded-lg border transition-all ${
                            selectedUserPet?.id === pet.id
                              ? "border-lavender-600 bg-lavender-50 shadow-sm"
                              : "border-gray-200 hover:border-lavender-300"
                          }`}
                        >
                          <div className="h-12 w-12 rounded-full overflow-hidden bg-lavender-100 flex items-center justify-center mb-2">
                            {pet.image ? (
                              <img
                                src={pet.image}
                                alt={pet.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <FaPaw className="h-6 w-6 text-lavender-300" />
                            )}
                          </div>
                          <span className="text-xs font-medium truncate w-full text-center">
                            {pet.name}
                          </span>
                          {selectedUserPet?.id === pet.id && (
                            <span className="mt-1 flex items-center justify-center bg-lavender-600 h-5 w-5 rounded-full">
                              <FiCheck className="text-white w-3 h-3" />
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm font-medium text-gray-700">
                      Maximum Distance
                    </p>
                    <span className="text-sm font-semibold text-lavender-700">
                      {maxDistance} km
                    </span>
                  </div>

                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={maxDistance}
                    onChange={(e) => setMaxDistance(parseInt(e.target.value))}
                    className="w-full h-2 bg-lavender-200 rounded-lg appearance-none cursor-pointer accent-lavender-600"
                  />

                  <div className="flex justify-between mt-1 text-xs text-gray-500">
                    <span>1 km</span>
                    <span>25 km</span>
                    <span>50 km</span>
                  </div>
                </div>
                <div className="mt-6 p-3 bg-lavender-50 rounded-lg">
                  <p className="text-sm text-lavender-900">
                    <span className="font-semibold">
                      Finding compatible matches:
                    </span>{" "}
                    We're showing{" "}
                    {selectedUserPet?.gender === "Male" ? "female" : "male"}{" "}
                    pets for your {selectedUserPet?.gender?.toLowerCase()} pet.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {loading || locationLoading ? (
          <div className="min-h-screen bg-lavender-50 p-6">
            <div className="max-w-7xl mx-auto">
              <SkeletonLoader type="list" count={9} />
            </div>
          </div>
        ) : filteredPets.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredPets.map((pet) => {
              const petSlug = pet.slug || `${pet.name?.toLowerCase().replace(/\s+/g, '-')}-${pet.id.slice(-6)}`;
              return (
                <PetCard
                  key={pet.id}
                  pet={pet}
                  onRequestMating={() => {
                    setSelectedPet(pet);
                    setShowRequestModal(true);
                  }}
                  onViewDetails={() => navigate(`/pet-detail/${petSlug}`)}
                />
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-md p-6 sm:p-8 text-center border border-lavender-100">
            <div className="flex flex-col items-center">
              <div className="h-20 w-20 bg-lavender-100 rounded-full flex items-center justify-center mb-4">
                <FaPaw className="h-10 w-10 text-lavender-300" />
              </div>
              <h3 className="text-xl font-bold text-lavender-900 mb-2">
                {availablePets.length === 0 ? "No Pets Available for Mating" : "No Matching Pets Found"}
              </h3>
              <p className="text-gray-600 max-w-md mx-auto mb-6">
                {availablePets.length === 0 ? (
                  <>
                    There are currently no pets marked as available for mating in your area. 
                    <br /><br />
                    <strong>Want to find mates for your pet?</strong>
                    <br />
                    Go to your Profile → Edit your pet → Enable "Available for Mating" toggle
                  </>
                ) : (
                  "We couldn't find any pets that match your criteria. Try adjusting your filters or check back later."
                )}
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                {availablePets.length === 0 ? (
                  <button
                    onClick={() => navigate('/profile')}
                    className="px-6 py-3 bg-lavender-600 hover:bg-lavender-700 text-white rounded-full transition-colors duration-300"
                  >
                    Go to Profile
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setShowFilters(true);
                      setMaxDistance(50);
                      setActiveCategory("all");
                      setSearchQuery("");
                    }}
                    className="px-6 py-3 bg-lavender-600 hover:bg-lavender-700 text-white rounded-full transition-colors duration-300"
                  >
                    Adjust Filters
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      {selectedPet && (
        <PetMatingRequestModal
          isOpen={showRequestModal}
          userPet={selectedUserPet}
          selectedPet={selectedPet}
          onSendRequest={handleSendMatingRequest}
          onClose={() => setShowRequestModal(false)}
        />
      )}
    </div>
  );
};

export default NearbyMates;
