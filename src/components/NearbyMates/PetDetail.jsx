/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ref, get, set, onValue } from "firebase/database";
import { database, auth } from "../../firebase";
import {
  ArrowLeft,
  Heart,
  Info,
  Cake,
  MapPin,
  Palette,
  Scale,
  Command,
  PawPrint,
  CheckCircle,
  Clipboard,
  AlertTriangle,
  Pill,
  Syringe,
} from "lucide-react";
import MatingRequestDialog from "../Profile/components/MatingRequestDialog";
import { LocationCity } from "@mui/icons-material";
import { FaPaw } from "react-icons/fa";
import PetDetailShimmer from "../../UI/PetDetailShimmer";

const PetDetail = () => {
  const { petId } = useParams();
  const navigate = useNavigate();
  const user = auth.currentUser;

  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userPets, setUserPets] = useState([]);
  const [selectedUserPet, setSelectedUserPet] = useState(null);
  const [openMatingRequestDialog, setOpenMatingRequestDialog] = useState(false);
  const [requestStatus, setRequestStatus] = useState(null);

  useEffect(() => {
    const fetchPetDetails = async () => {
      if (!petId) {
        setError("No pet ID provided");
        setLoading(false);
        return;
      }
      try {
        const allUserPetsRef = ref(database, "userPets");
        const snapshot = await get(allUserPetsRef);
        if (snapshot.exists()) {
          const allUserPets = snapshot.val();
          let foundPet = null;
          Object.entries(allUserPets).forEach(([userId, pets]) => {
            if (pets[petId]) {
              foundPet = { ...pets[petId], id: petId, userId };
            }
          });
          if (foundPet) {
            setPet(foundPet);
            if (user && user.uid) {
              const userPetsRef = ref(database, `userPets/${user.uid}`);
              const userPetsSnapshot = await get(userPetsRef);
              if (userPetsSnapshot.exists()) {
                const petsData = userPetsSnapshot.val();
                const petsArray = Object.keys(petsData).map((id) => ({
                  id,
                  ...petsData[id],
                }));
                const compatiblePets = petsArray.filter(
                  (userPet) =>
                    userPet.type === foundPet.type &&
                    userPet.gender !== foundPet.gender
                );
                setUserPets(compatiblePets);
                if (compatiblePets.length > 0) {
                  setSelectedUserPet(compatiblePets[0]);
                }
              }
              checkRequestStatus(user.uid, foundPet.userId, foundPet.id);
            }
          } else {
            setError("Pet not found");
          }
        } else {
          setError("No pets found in the database");
        }
      } catch (err) {
        console.error("Error fetching pet details:", err);
        setError("Failed to fetch pet details. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchPetDetails();

    if (user && pet?.userId) {
      const receivedRequestsRef = ref(
        database,
        `matingRequests/received/${user.uid}`
      );
      const onValueChange = (snapshot) => {
        if (snapshot.exists()) {
          const requests = snapshot.val();
          const matchingRequest = Object.values(requests).find(
            (req) => req.senderPetId === pet.id && req.receiverId === user.uid
          );
          if (matchingRequest && matchingRequest.status === "accepted") {
            setRequestStatus("accepted");
          } else if (!requestStatus || requestStatus === "accepted") {
            checkRequestStatus(user.uid, pet.userId, pet.id);
          }
        } else if (requestStatus === "accepted") {
          setRequestStatus(null);
        }
      };
      const unsubscribeReceived = onValue(receivedRequestsRef, onValueChange);
      return () => unsubscribeReceived();
    }
  }, [petId, user]);

  const checkRequestStatus = async (
    currentUserId,
    receiverId,
    receiverPetId
  ) => {
    if (!currentUserId || !receiverId || !receiverPetId) return;
    const sentRequestsRef = ref(
      database,
      `matingRequests/sent/${currentUserId}`
    );
    const snapshot = await get(sentRequestsRef);
    if (snapshot.exists()) {
      const requests = snapshot.val();
      const matchingRequest = Object.values(requests).find(
        (req) =>
          req.receiverPetId === receiverPetId && req.receiverId === receiverId
      );
      if (matchingRequest) {
        setRequestStatus(matchingRequest.status);
      } else {
        setRequestStatus(null);
      }
    } else {
      setRequestStatus(null);
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleRequestMatingClick = () => {
    if (!user) {
      navigate("/", { state: { from: `/pet-detail/${petId}` } });
      return;
    }
    if (requestStatus === null) {
      setOpenMatingRequestDialog(true);
    }
  };

  const handleSendMatingRequest = async (requestData) => {
    if (!user || !selectedUserPet || !pet) return;
    try {
      const requestId = Date.now().toString();
      const receiverRequestRef = ref(
        database,
        `matingRequests/received/${pet.userId}/${requestId}`
      );
      await set(receiverRequestRef, {
        id: requestId,
        senderId: user.uid,
        senderName: user.displayName,
        senderPetId: selectedUserPet.id,
        senderPetName: selectedUserPet.name,
        receiverId: pet.userId,
        receiverPetId: pet.id,
        receiverPetName: pet.name,
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
        receiverId: pet.userId,
        receiverPetId: pet.id,
        receiverPetName: pet.name,
        message: requestData.message,
        status: "pending",
        createdAt: Date.now(),
        direction: "outgoing",
      });
      setRequestStatus("pending");
      setOpenMatingRequestDialog(false);
    } catch (error) {
      console.error("Error sending mating request:", error);
    }
  };

  if (loading) {
    return <PetDetailShimmer />;
  }

  if (error) {
    return (
      <div className="container mx-auto py-4 px-4 max-w-4xl">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <button
              onClick={handleGoBack}
              className="mr-2 p-1 rounded-full hover:bg-gray-100"
            >
              <ArrowLeft className="text-gray-700" />
            </button>
            <h2 className="text-xl font-semibold">Error</h2>
          </div>
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="container mx-auto py-4 px-4 max-w-4xl">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <button
              onClick={handleGoBack}
              className="mr-2 p-1 rounded-full hover:bg-gray-100"
            >
              <ArrowLeft className="text-gray-700" />
            </button>
            <h2 className="text-xl font-semibold">Pet Not Found</h2>
          </div>
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4">
            <p>The pet you're looking for doesn't exist or has been removed.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4 px-4 lg:py-8 max-w-7xl">
      <div className="bg-gradient-to-r from-lavender-600 to-lavender-800 rounded-xl shadow-xl overflow-hidden">
        <div className="p-4 sm:p-6 bg-lavender-700 text-white flex items-center">
          <button
            onClick={handleGoBack}
            className="mr-3 p-1 rounded-full hover:bg-lavender-600"
          >
            <ArrowLeft className="text-white" />
          </button>
          <h1 className="text-xl sm:text-2xl font-bold">Pet Details</h1>
        </div>
        <div className="flex flex-col lg:flex-row">
          <div className="w-full lg:w-5/12">
            {pet.image ? (
              <img
                src={pet.image}
                alt={pet.name}
                className="w-full h-64 sm:h-80 md:h-96 lg:h-full object-cover"
              />
            ) : (
              <div className="w-full h-64 sm:h-80 md:h-96 lg:h-full flex items-center justify-center bg-gray-100">
                <FaPaw className="h-12 w-12 text-lavender-300" />
              </div>
            )}
          </div>
          <div className="w-full lg:w-7/12 bg-white p-4 sm:p-6 md:p-8 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-lavender-700">
                {pet.name}
              </h2>
              {pet.availableForMating && (
                <div className="flex items-center bg-lavender-100 text-lavender-700 px-3 py-1 rounded-full text-sm font-medium">
                  <Heart className="w-4 h-4 mr-1" />
                  <span>Available for Mating</span>
                </div>
              )}
              {pet.availableForAdoption && (
                <div className="flex items-center bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium ml-2">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  <span>Available for Adoption</span>
                </div>
              )}
            </div>
            <div className="flex items-center mb-4">
              <PawPrint className="text-lavender-600 mr-2" />
              <span className="text-lg">
                {pet.breed || "Unknown breed"} {pet.type ? `(${pet.type})` : ""}
              </span>
            </div>

            <div className="border-t border-gray-200 my-4"></div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
              <div className="flex items-center">
                {pet.gender === "Male" ? (
                  <Command className="text-lavender-600 mr-2" />
                ) : (
                  <Command className="text-lavender-600 mr-2" />
                )}
                <span>{pet.gender || "Unknown gender"}</span>
              </div>
              <div className="flex items-center">
                <Cake className="text-lavender-600 mr-2" />
                <span>{pet.age ? `${pet.age} years` : "Unknown age"}</span>
              </div>
              <div className="flex items-center">
                <Scale className="text-lavender-600 mr-2" />
                <span>
                  {pet.weight ? `${pet.weight} kg` : "Unknown weight"}
                </span>
              </div>
              {pet.color && (
                <div className="flex items-center">
                  <Palette className="text-lavender-600 mr-2" />
                  <span>{pet.color}</span>
                </div>
              )}
              {pet.distance && (
                <div className="flex items-center">
                  <MapPin className="text-lavender-600 mr-2" />
                  <span>{pet.distance} km away</span>
                </div>
              )}
              {pet.location && (
                <div className="flex items-center">
                  <LocationCity className="text-lavender-600 mr-2" />
                  <span>Location Tracked</span>
                </div>
              )}
            </div>
            {pet.description && (
              <div className="mb-6">
                <div className="flex items-center mb-2">
                  <Info className="text-lavender-600 mr-2" />
                  <h3 className="text-lg font-semibold">About</h3>
                </div>
                <p className="pl-6 text-gray-700">{pet.description}</p>
              </div>
            )}

            {pet.medical && (
              <div className="mb-6">
                <div className="flex items-center mb-2">
                  <Pill className="text-lavender-600 mr-2" />
                  <h3 className="text-lg font-semibold">Medical Information</h3>
                </div>
                <div className="pl-6 text-gray-700 space-y-2">
                  {pet.medical.medications && (
                    <div className="flex items-start">
                      <Pill className="text-lavender-600 mr-2 w-4 h-4 mt-1" />
                      <span>Medications: {pet.medical.medications}</span>
                    </div>
                  )}
                  {pet.medical.allergies &&
                    pet.medical.allergies.length > 0 && (
                      <div className="flex items-start">
                        <AlertTriangle className="text-lavender-600 mr-2 w-4 h-4 mt-1" />
                        <span>
                          Allergies: {pet.medical.allergies.join(", ")}
                        </span>
                      </div>
                    )}
                  {pet.medical.conditions &&
                    pet.medical.conditions.length > 0 && (
                      <div className="flex items-start">
                        <Clipboard className="text-lavender-600 mr-2 w-4 h-4 mt-1" />
                        <span>
                          Conditions: {pet.medical.conditions.join(", ")}
                        </span>
                      </div>
                    )}
                </div>
              </div>
            )}

            {pet.vaccinations && pet.vaccinations.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center mb-2">
                  <Syringe className="text-lavender-600 mr-2" />
                  <h3 className="text-lg font-semibold">Vaccinations</h3>
                </div>
                <div className="pl-6 text-gray-700">
                  <ul className="list-disc list-inside">
                    {pet.vaccinations.map((vax, index) => (
                      <li key={index} className="mb-1">
                        <span className="font-medium">{vax.name}</span>
                        {vax.notes && <span> - {vax.notes}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <div className="mt-auto pt-4">
              <div className="border-t border-gray-200 mb-4"></div>
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-lavender-600 flex items-center justify-center text-white mr-3">
                    {pet?.petOwner?.charAt(0)}
                  </div>
                  <span>Owner: {pet?.petOwner} </span>
                </div>
                {user && pet.userId !== user.uid && pet.availableForMating && (
                  <button
                    onClick={handleRequestMatingClick}
                    disabled={
                      requestStatus !== null && requestStatus !== "accepted"
                    }
                    className={`flex items-center px-4 py-2 rounded-lg transition-colors text-sm font-medium
                                            ${requestStatus === "pending"
                        ? "bg-yellow-500 text-white hover:bg-yellow-600"
                        : requestStatus === "accepted"
                          ? "bg-green-500 text-white hover:bg-green-600"
                          : "bg-lavender-600 hover:bg-lavender-700 text-white"
                      }
                                        `}
                  >
                    {requestStatus === "pending" ? (
                      <>
                        <Heart className="w-5 h-5 mr-2 animate-pulse" />
                        <span>Request Sent</span>
                      </>
                    ) : requestStatus === "accepted" ? (
                      <>
                        <CheckCircle className="w-5 h-5 mr-2" />
                        <span>Accepted</span>
                      </>
                    ) : (
                      <>
                        <Heart className="w-5 h-5 mr-2" />
                        <span>Request Mating</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {openMatingRequestDialog && (
        <MatingRequestDialog
          open={openMatingRequestDialog}
          onClose={() => setOpenMatingRequestDialog(false)}
          onSubmit={handleSendMatingRequest}
          petName={pet.name}
          userPets={userPets}
          selectedPet={selectedUserPet}
          onPetSelect={(pet) => setSelectedUserPet(pet)}
        />
      )}
    </div>
  );
};

export default PetDetail;
