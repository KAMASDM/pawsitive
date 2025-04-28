// components/PetDetail/PetDetail.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Divider,
  Button,
  Avatar,
  CircularProgress,
  Container,
  Card,
  CardMedia,
  IconButton,
  Alert,
  useTheme,
} from "@mui/material";
import { ref, get, set } from "firebase/database";
import { database, auth } from "../../firebase";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PetsIcon from "@mui/icons-material/Pets";
import FavoriteIcon from "@mui/icons-material/Favorite";
import MedicalInformationIcon from "@mui/icons-material/MedicalInformation";
import FemaleIcon from "@mui/icons-material/Female";
import MaleIcon from "@mui/icons-material/Male";
import ScaleIcon from "@mui/icons-material/Scale";
import CakeIcon from "@mui/icons-material/Cake";
import InfoIcon from "@mui/icons-material/Info";
import ColorLensIcon from "@mui/icons-material/ColorLens";
import MatingRequestDialog from "../Profile/components/MatingRequestDialog";
import defaultDogImage from ".././../images/Dog.jpg";
import defaultCatImage from "../../images/Cat.jpg";
import defaultBirdImage from "../../images/Bird.jpg";
import defaultSmallPetImage from "../../images/Pet.jpg";

const PetDetail = () => {
  const { petId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const user = auth.currentUser;

  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [petOwner, setPetOwner] = useState(null);
  const [userPets, setUserPets] = useState([]);
  const [selectedUserPet, setSelectedUserPet] = useState(null);
  const [openMatingRequestDialog, setOpenMatingRequestDialog] = useState(false);

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
          let ownerId = null;

          Object.entries(allUserPets).forEach(([userId, pets]) => {
            if (pets[petId]) {
              foundPet = { ...pets[petId], id: petId, userId };
              ownerId = userId;
            }
          });

          if (foundPet) {
            setPet(foundPet);

            if (ownerId) {
              const userRef = ref(database, `users/${ownerId}`);
              const userSnapshot = await get(userRef);

              if (userSnapshot.exists()) {
                setPetOwner(userSnapshot.val());
              } else {
                setPetOwner({ displayName: "Pet Owner" });
              }
            }

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
  }, [petId, user]);

  const getDefaultPetImage = (petType) => {
    switch (petType?.toLowerCase()) {
      case "dog":
        return defaultDogImage;
      case "cat":
        return defaultCatImage;
      case "bird":
        return defaultBirdImage;
      default:
        return defaultSmallPetImage;
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleRequestMating = () => {
    if (!user) {
      navigate("/login", { state: { from: `/pet-detail/${petId}` } });
      return;
    }

    setOpenMatingRequestDialog(true);
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

      setOpenMatingRequestDialog(false);
      alert("Mating request sent successfully!");
    } catch (error) {
      console.error("Error sending mating request:", error);
      alert("Failed to send mating request. Please try again.");
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress sx={{ color: "rgb(139 121 195)" }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
          <Box display="flex" alignItems="center" mb={2}>
            <IconButton onClick={handleGoBack} sx={{ mr: 1 }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h5">Error</Typography>
          </Box>
          <Alert severity="error">{error}</Alert>
        </Paper>
      </Container>
    );
  }

  if (!pet) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
          <Box display="flex" alignItems="center" mb={2}>
            <IconButton onClick={handleGoBack} sx={{ mr: 1 }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h5">Pet Not Found</Typography>
          </Box>
          <Alert severity="warning">
            The pet you're looking for doesn't exist or has been removed.
          </Alert>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 4 } }}>
      <Paper
        elevation={3}
        sx={{
          borderRadius: 3,
          overflow: "hidden",
          background: theme.palette.primary.light,
        }}
      >
        <Box
          sx={{
            p: { xs: 2, sm: 3 },
            background: "rgb(139 121 195)",
            color: "white",
            display: "flex",
            alignItems: "center",
          }}
        >
          <IconButton onClick={handleGoBack} sx={{ color: "white", mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5" fontWeight="bold">
            Pet Details
          </Typography>
        </Box>

        <Grid container spacing={0}>
          <Grid item xs={12} md={5}>
            <Card
              elevation={0}
              sx={{
                height: "100%",
                background: "transparent",
                borderRadius: 0,
              }}
            >
              <CardMedia
                component="img"
                image={pet.image || getDefaultPetImage(pet.type)}
                alt={pet.name}
                sx={{
                  height: { xs: 250, sm: 300, md: "100%" },
                  objectFit: "cover",
                }}
              />
            </Card>
          </Grid>

          <Grid item xs={12} md={7}>
            <Box
              sx={{
                p: { xs: 2, sm: 4 },
                height: "100%",
                background: "#fff",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                mb={2}
              >
                <Typography
                  variant="h4"
                  fontWeight="bold"
                  color="rgb(139 121 195)"
                >
                  {pet.name}
                </Typography>
                {pet.availableForMating && (
                  <Chip
                    icon={<FavoriteIcon />}
                    label="Available for Mating"
                    color="rgb(139 121 195)"
                    sx={{ fontWeight: "bold" }}
                  />
                )}
              </Box>

              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <PetsIcon color="rgb(139 121 195)" />
                <Typography variant="h6">
                  {pet.breed || "Unknown breed"}{" "}
                  {pet.type ? `(${pet.type})` : ""}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6} sm={4}>
                  <Box display="flex" alignItems="center">
                    {pet.gender === "Male" ? (
                      <MaleIcon sx={{ color: "rgb(139 121 195)", mr: 1 }} />
                    ) : (
                      <FemaleIcon sx={{ color: "rgb(139 121 195)", mr: 1 }} />
                    )}
                    <Typography>{pet.gender || "Unknown"}</Typography>
                  </Box>
                </Grid>

                <Grid item xs={6} sm={4}>
                  <Box display="flex" alignItems="center">
                    <CakeIcon sx={{ color: "rgb(139 121 195)", mr: 1 }} />
                    <Typography>
                      {pet.age ? `${pet.age} years` : "Unknown age"}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={6} sm={4}>
                  <Box display="flex" alignItems="center">
                    <ScaleIcon sx={{ color: "rgb(139 121 195)", mr: 1 }} />
                    <Typography>
                      {pet.weight ? `${pet.weight} kg` : "Unknown weight"}
                    </Typography>
                  </Box>
                </Grid>

                {pet.color && (
                  <Grid item xs={6} sm={4}>
                    <Box display="flex" alignItems="center">
                      <ColorLensIcon
                        sx={{ color: "rgb(139 121 195)", mr: 1 }}
                      />
                      <Typography>{pet.color}</Typography>
                    </Box>
                  </Grid>
                )}

                {pet.distance && (
                  <Grid item xs={6} sm={4}>
                    <Box display="flex" alignItems="center">
                      <LocationOnIcon
                        sx={{ color: "rgb(139 121 195)", mr: 1 }}
                      />
                      <Typography>{pet.distance} km away</Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>

              {pet.description && (
                <Box mb={3}>
                  <Box display="flex" alignItems="center" mb={1}>
                    <InfoIcon sx={{ color: "rgb(139 121 195)", mr: 1 }} />
                    <Typography variant="h6">About</Typography>
                  </Box>
                  <Typography variant="body1" sx={{ pl: 3 }}>
                    {pet.description}
                  </Typography>
                </Box>
              )}

              {pet.medical && pet.medical.medications && (
                <Box mb={3}>
                  <Box display="flex" alignItems="center" mb={1}>
                    <MedicalInformationIcon
                      sx={{ color: "rgb(139 121 195)", mr: 1 }}
                    />
                    <Typography variant="h6">Medical Information</Typography>
                  </Box>
                  <Typography variant="body1" sx={{ pl: 3 }}>
                    Medications: {pet.medical.medications || "None"}
                  </Typography>
                </Box>
              )}

              <Box sx={{ mt: "auto", pt: 2 }}>
                <Divider sx={{ mb: 2 }} />
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Box display="flex" alignItems="center">
                    <Avatar sx={{ bgcolor: "rgb(139 121 195)", mr: 1 }}>
                      {petOwner?.displayName?.charAt(0) || "P"}
                    </Avatar>
                    <Typography>
                      Owner: {petOwner?.displayName || "Pet Owner"}
                    </Typography>
                  </Box>

                  {user &&
                    pet.userId !== user.uid &&
                    pet.availableForMating && (
                      <Button
                        variant="contained"
                        startIcon={<FavoriteIcon />}
                        onClick={handleRequestMating}
                        sx={{
                          backgroundColor: "rgb(139 121 195)",
                          "&:hover": {
                            backgroundColor: "rgb(139 121 195)",
                          },
                        }}
                      >
                        Request Mating
                      </Button>
                    )}
                </Box>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>

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
    </Container>
  );
};

export default PetDetail;
