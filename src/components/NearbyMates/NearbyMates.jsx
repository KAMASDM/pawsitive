// src/components/NearbyMates/NearbyMates.jsx
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ref, get, set } from "firebase/database";
import { database, auth } from "../../firebase";
import { FiArrowLeft, FiInfo, FiMapPin, FiHeart, FiFilter, FiChevronDown, FiX, FiCheck } from "react-icons/fi";
import { FaPaw } from "react-icons/fa";


const NearbyMates = () => {
  const { isMobile } = useResponsive();
  const navigate = useNavigate();
  const user = auth.currentUser;
  const bottomSheetRef = useRef(null);
  
  // State management
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

  // Fetch user location
  useEffect(() => {
    setLocationLoading(true);
    if (!user) {
      navigate("/login", { state: { from: "/nearby-mates" } });
      return;
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
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

  // Fetch user's pets
  useEffect(() => {
    const fetchUserPets = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const userPetsRef = ref(database, `userPets/${user.uid}`);
        const snapshot = await get(userPetsRef);

        if (snapshot.exists()) {
          const petsData = snapshot.val();
          const petsArray = Object.keys(petsData).map(petId => ({
            id: petId,
            ...petsData[petId]
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

  // Calculate distance between two coordinates
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  // Fetch available pets for mating
  useEffect(() => {
    const fetchAvailablePets = async () => {
      if (!userLocation || !selectedUserPet) return;

      setLoading(true);
      try {
        const userPetsRef = ref(database, "userPets");
        const snapshot = await get(userPetsRef);

        if (snapshot.exists()) {
          const allPets = [];
          const petsData = snapshot.val();

          // Process all pets from database
          Object.keys(petsData).forEach(userId => {
            if (userId === user?.uid) return; // Skip current user's pets

            const userPets = petsData[userId];
            Object.keys(userPets).forEach(petId => {
              const pet = userPets[petId];
              if (pet.availableForMating) {
                // Create simulated locations nearby for demo purposes
                const petLocation = {
                  latitude: userLocation.latitude + (Math.random() - 0.5) * 0.1,
                  longitude: userLocation.longitude + (Math.random() - 0.5) * 0.1
                };

                const distance = calculateDistance(
                  userLocation.latitude,
                  userLocation.longitude,
                  petLocation.latitude,
                  petLocation.longitude
                );

                // For demo purposes, we're setting owner data
                // In a real application, you would fetch this from user profiles
                const ownerData = {
                  id: userId,
                  displayName: "Pet Owner"
                };

                allPets.push({
                  ...pet,
                  id: petId,
                  userId: userId,
                  distance: distance.toFixed(1),
                  location: petLocation,
                  owner: ownerData
                });
              }
            });
          });

          // Sort pets by distance
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

    if (userLocation && selectedUserPet) {
      fetchAvailablePets();
    }
  }, [userLocation, selectedUserPet, user]);

  // Filter pets based on criteria
  useEffect(() => {
    if (!selectedUserPet || availablePets.length === 0) {
      setFilteredPets([]);
      return;
    }

    // Apply filters
    let filtered = availablePets.filter(pet => {
      // Basic compatibility filtering
      if (pet.type !== selectedUserPet.type) return false;
      if (pet.gender === selectedUserPet.gender) return false;
      if (parseFloat(pet.distance) > maxDistance) return false;

      // Search query filtering
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

    // Category filtering
    if (activeCategory === "nearby") {
      filtered = filtered.filter(pet => parseFloat(pet.distance) < 5);
    } else if (activeCategory === "breed") {
      filtered = filtered.filter(pet => 
        pet.breed && selectedUserPet.breed && pet.breed.toLowerCase() === selectedUserPet.breed.toLowerCase()
      );
    }

    setFilteredPets(filtered);
  }, [selectedUserPet, maxDistance, availablePets, activeCategory, searchQuery]);

  // Handle mating request
  const handleSendMatingRequest = async (requestData) => {
    if (!user || !selectedUserPet || !selectedPet) return;

    try {
      const requestId = Date.now().toString();

      // Create request in receiver's inbox
      const receiverRequestRef = ref(database, `matingRequests/received/${selectedPet.userId}/${requestId}`);
      await set(receiverRequestRef, {
        id: requestId,
        senderId: user.uid,
        senderName: user.displayName,
        senderPetId: selectedUserPet.id,
        senderPetName: selectedUserPet.name,
        receiverId: selectedPet.userId,
        receiverPetId: selectedPet.id,
        receiverPetName: selectedPet.name,
        message: requestData.message,
        status: 'pending',
        createdAt: Date.now(),
        direction: 'incoming'
      });

      // Create a copy in sender's outbox
      const senderRequestRef = ref(database, `matingRequests/sent/${user.uid}/${requestId}`);
      await set(senderRequestRef, {
        id: requestId,
        senderId: user.uid,
        senderName: user.displayName,
        senderPetId: selectedUserPet.id,
        senderPetName: selectedUserPet.name,
        receiverId: selectedPet.userId,
        receiverPetId: selectedPet.id,
        receiverPetName: selectedPet.name,
        message: requestData.message,
        status: 'pending',
        createdAt: Date.now(),
        direction: 'outgoing'
      });

      setShowRequestModal(false);
      
      // Show success notification
      alert("Mating request sent successfully!");
    } catch (error) {
      console.error("Error sending mating request:", error);
      alert("Failed to send mating request. Please try again.");
    }
  };

  // Loading states
  if (locationLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-lavender-50">
        <div className="w-16 h-16 border-4 border-lavender-200 border-t-lavender-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-lavender-900 font-medium">Getting your location...</p>
      </div>
    );
  }

  // Error state
  if (showLocationPrompt) {
    return (
      <div className="min-h-screen bg-lavender-50 p-4 sm:p-8">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-6 sm:p-8">
          <div className="flex flex-col items-center text-center">
            <div className="h-24 w-24 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <FiMapPin className="h-12 w-12 text-red-500" />
            </div>
            
            <h2 className="text-2xl font-bold text-lavender-900 mb-2">Location Access Required</h2>
            <p className="text-gray-600 mb-6">
              We need access to your location to find pets near you. Please enable location services in your browser and try again.
            </p>
            
            <p className="text-sm text-gray-500 mb-8">
              Error: {locationError}
            </p>
            
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

  // No pets added yet
  // if (userPets.length === 0) {
  //   return (
  //     <div className="min-h-screen bg-lavender-50 p-4 sm:p-8">
  //       <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-6 sm:p-8">
  //         <div className="flex flex-col items-center text-center">
  //           <div className="h-24 w-24 bg-lavender-100 rounded-full flex items-center justify-center mb-6">
  //             <FaPaw className="h-12 w-12 text-lavender-600" />
  //           </div>
            
  //           <h2 className="text-2xl font-bold text-lavender-900 mb-2">No Pets Found</h2>
  //           <p className="text-gray-600 mb-8">
  //             You haven't added any pets to your profile yet. Please add a pet first before using the mating search feature.
  //           </p>
            
  //           <div className="flex flex-col sm:flex-row gap-3">
  //             <button 
  //               onClick={() => navigate(-1)}
  //               className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-full transition-colors duration-300"
  //             >
  //               Go Back
  //             </button>
  //             <button 
  //               onClick={() => navigate('/profile/add-pet')}
  //               className="px-6 py-3 bg-lavender-600 hover:bg-lavender-700 text-white rounded-full transition-colors duration-300"
  //             >
  //               Add a Pet
  //             </button>
  //           </div>
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }

 return (
    <div className="min-h-screen bg-lavender-50">
      {/* Wrapper to constrain Header width and center it */}
      <div className="sticky top-0 z-30 max-w-6xl mx-auto px-4 sm:px-6"> {/* Apply max-width and horizontal padding here */}
        {/* Header - Styled like the Pet Selector Card & Constrained Width */}
        <div className="sticky top-0 z-30 bg-lavender-100 rounded-2xl shadow-md p-4 sm:p-6 mb-6 border border-lavender-100">
        {/* Added margin-top/bottom (my-6) instead of just mb-6 */}
          {/* Header Content Wrapper - No max-width needed here anymore */}
          <div>
            {/* Top Row: Back Button, Title, Filter Button */}
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

            {/* Search Bar */}
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

            {/* Category Tabs */}
            <div className="flex items-center space-x-3 overflow-x-auto hide-scrollbar">
              <button
                onClick={() => setActiveCategory("all")}
                className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all ${
                  activeCategory === "all"
                    ? "bg-lavender-600 text-white font-medium shadow-sm"
                    : "text-lavender-700 hover:bg-lavender-100"
                }`}
              >
                All Matches
              </button>
              <button
                onClick={() => setActiveCategory("nearby")}
                className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all flex items-center ${
                  activeCategory === "nearby"
                    ? "bg-lavender-600 text-white font-medium shadow-sm"
                    : "text-lavender-700 hover:bg-lavender-100"
                }`}
              >
                <FiMapPin className={`mr-1 ${activeCategory === "nearby" ? "text-white" : "text-lavender-600"}`} />
                Nearby ({"<"}5km)
              </button>
              <button
                onClick={() => setActiveCategory("breed")}
                className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all ${
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

      {/* Main Content */}
      {/* Added pt-0 because header now has my-6 */}
      <div className="max-w-6xl mx-auto px-4 pb-6 sm:px-6 pt-0">
        {/* Pet Selector Card */}
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

        {/* Filter Panel */}
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
                  <h3 className="font-bold text-lavender-900">Filter Options</h3>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>

                {/* User Pet Selection */}
                {userPets.length > 1 && (
                  <div className="mb-6">
                    <p className="text-sm font-medium text-gray-700 mb-2">Select Your Pet</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {userPets.map(pet => (
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

                {/* Distance Slider */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm font-medium text-gray-700">Maximum Distance</p>
                    <span className="text-sm font-semibold text-lavender-700">{maxDistance} km</span>
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

                {/* Information */}
                <div className="mt-6 p-3 bg-lavender-50 rounded-lg">
                  <p className="text-sm text-lavender-900">
                    <span className="font-semibold">Finding compatible matches:</span> We're showing {selectedUserPet?.gender === 'Male' ? 'female' : 'male'} pets for your {selectedUserPet?.gender?.toLowerCase()} pet.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-lavender-200 border-t-lavender-600 rounded-full animate-spin"></div>
            <p className="mt-4 text-lavender-900 font-medium">Finding matches...</p>
          </div>
        ) : filteredPets.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredPets.map((pet) => (
              <PetCard
                key={pet.id}
                pet={pet}
                onRequestMating={() => {
                  setSelectedPet(pet);
                  setShowRequestModal(true);
                }}
                onViewDetails={() => navigate(`/pet-detail/${pet.id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-md p-6 sm:p-8 text-center border border-lavender-100">
            <div className="flex flex-col items-center">
              <div className="h-20 w-20 bg-lavender-100 rounded-full flex items-center justify-center mb-4">
                <FaPaw className="h-10 w-10 text-lavender-300" />
              </div>

              <h3 className="text-xl font-bold text-lavender-900 mb-2">No Matching Pets Found</h3>
              <p className="text-gray-600 max-w-md mx-auto mb-6">
                We couldn't find any pets that match your criteria. Try adjusting your filters or check back later.
              </p>

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
            </div>
          </div>
        )}
      </div>

      {/* Mating Request Modal */}
      {selectedPet && (
        <PetMatingRequestModal
          isOpen={showRequestModal}
          onClose={() => setShowRequestModal(false)}
          selectedPet={selectedPet}
          userPet={selectedUserPet}
          onSendRequest={handleSendMatingRequest}
        />
      )}
    </div>
  );
};

// Pet Card Component
const PetCard = ({ pet, onRequestMating, onViewDetails }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-2xl shadow-md overflow-hidden border border-lavender-100 group"
    >
      {/* Pet Image */}
      <div className="relative h-48 bg-lavender-100">
        {pet.image ? (
          <img 
            src={pet.image} 
            alt={pet.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <FaPaw className="h-12 w-12 text-lavender-300" />
          </div>
        )}
        
        {/* Distance Badge */}
        <div className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center">
          <FiMapPin className="mr-1 h-3 w-3" /> {pet.distance} km
        </div>
        
        {/* Gender Badge */}
        <div className={`absolute top-3 left-3 text-xs px-2 py-1 rounded-full flex items-center ${
          pet.gender === 'Female' 
            ? 'bg-pink-500 text-white' 
            : 'bg-blue-500 text-white'
        }`}>
          {pet.gender}
        </div>
      </div>
      
      {/* Pet Info */}
      <div className="p-4">
        <h3 className="font-bold text-lavender-900 text-lg mb-1">{pet.name}</h3>
        
        <div className="space-y-1 mb-3">
          <div className="flex items-center text-sm text-gray-600">
            <span className="font-medium w-16">Breed:</span>
            <span>{pet.breed || "Unknown"}</span>
          </div>
          
          <div className="flex items-center text-sm text-gray-600">
            <span className="font-medium w-16">Age:</span>
            <span>{pet.age || "Unknown"}</span>
          </div>
        </div>
        
        {pet.description && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-4">
            {pet.description}
          </p>
        )}
        
        {/* Action Buttons */}
        <div className="flex space-x-2">
          <button
            onClick={onViewDetails}
            className="flex-1 py-2 px-3 bg-lavender-100 hover:bg-lavender-200 text-lavender-800 rounded-lg transition-colors text-sm font-medium flex items-center justify-center"
          >
            <FiInfo className="mr-1" /> Details
          </button>
          
          <button
            onClick={onRequestMating}
            className="flex-1 py-2 px-3 bg-gradient-to-r from-lavender-600 to-purple-600 hover:from-lavender-700 hover:to-purple-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center justify-center"
          >
            <FiHeart className="mr-1" /> Match
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// Mating Request Modal Component
const PetMatingRequestModal = ({ isOpen, onClose, selectedPet, userPet, onSendRequest }) => {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    setSending(true);
    
    onSendRequest({ 
      message: message.trim() || `Hello! I'd like to arrange a mating between our pets.`
    });
    
    setTimeout(() => {
      setSending(false);
    }, 500);
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4 text-center">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left shadow-xl transition-all"
        >
          <div className="absolute top-3 right-3">
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
          
          <div className="text-center mb-4">
            <FiHeart className="h-8 w-8 text-pink-500 mx-auto mb-2" />
            <h3 className="text-lg font-bold text-lavender-900">
              Mating Request
            </h3>
          </div>
          
          <div className="flex items-center justify-center space-x-4 mb-6">
            {/* User Pet */}
            <div className="flex flex-col items-center">
              <div className="h-16 w-16 rounded-full overflow-hidden bg-lavender-100 flex items-center justify-center mb-1">
                {userPet.image ? (
                  <img 
                    src={userPet.image} 
                    alt={userPet.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <FaPaw className="h-8 w-8 text-lavender-300" />
                )}
              </div>
              <p className="text-xs font-medium">{userPet.name}</p>
            </div>
            
            {/* Connection Icon */}
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="h-px w-12 bg-lavender-300"></div>
                <FiHeart className="absolute -top-2 left-1/2 transform -translate-x-1/2 text-pink-500" />
              </div>
              <p className="text-xs text-gray-500 mt-4">Match</p>
            </div>
            
            {/* Selected Pet */}
            <div className="flex flex-col items-center">
              <div className="h-16 w-16 rounded-full overflow-hidden bg-lavender-100 flex items-center justify-center mb-1">
                {selectedPet.image ? (
                  <img 
                    src={selectedPet.image} 
                    alt={selectedPet.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <FaPaw className="h-8 w-8 text-lavender-300" />
                )}
              </div>
              <p className="text-xs font-medium">{selectedPet.name}</p>
            </div>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                Message for the pet owner
              </label>
              <textarea
                id="message"
                rows="3"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={`Hello! I'd like to arrange a mating between our pets.`}
                className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-lavender-500 focus:border-transparent resize-none"
              />
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={sending}
                className="flex-1 py-2 px-4 bg-gradient-to-r from-lavender-600 to-purple-600 hover:from-lavender-700 hover:to-purple-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center justify-center"
              >
                {sending ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                ) : (
                  <FiHeart className="mr-2" />
                )}
                Send Request
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

// Hook for responsive design
const useResponsive = () => {
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    isMobile: dimensions.width < 640,
    isTablet: dimensions.width >= 640 && dimensions.width < 1024,
    isDesktop: dimensions.width >= 1024,
    width: dimensions.width,
    height: dimensions.height,
  };
};

export default NearbyMates;