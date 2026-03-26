import { useState, useCallback } from "react";
import { auth, database } from "../firebase";
import { ref, set, remove } from "firebase/database";

/**
 * Shared hook for pet CRUD operations.
 * Used by PetSelector and PetDashboard to avoid duplicating logic.
 */
export function usePetOperations(pets, setPets) {
  const user = auth.currentUser;

  const [currentPet, setCurrentPet] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [openPetDialog, setOpenPetDialog] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  // Vaccination dialog state
  const [openVaccinationDialog, setOpenVaccinationDialog] = useState(false);
  const [isSavingVaccination, setIsSavingVaccination] = useState(false);
  const [currentVaccination, setCurrentVaccination] = useState({
    name: "",
    date: null,
    nextDue: null,
    notes: "",
  });
  const [vaccinationEditIndex, setVaccinationEditIndex] = useState(-1);

  // ---- Pet handlers ----

  const handleAddPet = useCallback(() => {
    setCurrentPet({
      id: Date.now().toString(),
      name: "",
      type: "",
      breed: "",
      gender: "",
      age: "",
      weight: "",
      color: "",
      description: "",
      image: "",
      availableForMating: false,
      availableForAdoption: false,
      medical: { conditions: [], allergies: [], medications: "" },
      vaccinations: [],
      petOwner: user?.displayName,
    });
    setIsEditMode(false);
    setTabValue(0);
    setOpenPetDialog(true);
  }, [user]);

  const handleEditPet = useCallback((pet, section) => {
    setCurrentPet({ ...pet });
    setIsEditMode(true);
    setOpenPetDialog(true);
    if (section === "vaccinations") setTabValue(2);
    else setTabValue(0);
  }, []);

  const handleSavePet = useCallback(async () => {
    if (!user || !currentPet?.name) return null;
    try {
      const baseSlug = currentPet.name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

      const petIdSuffix = currentPet.id.slice(-6);
      const slug = `${baseSlug}-${petIdSuffix}`;

      const petDataWithSlug = {
        ...currentPet,
        slug,
        userId: user.uid,
        privacy: currentPet.privacy || {
          isPrivate: false,
          commentsDisabled: false,
        },
      };

      const petRef = ref(database, `userPets/${user.uid}/${currentPet.id}`);
      await set(petRef, petDataWithSlug);

      if (isEditMode && currentPet.slug && currentPet.slug !== slug) {
        await remove(ref(database, `petSlugs/${currentPet.slug}`));
      }

      await set(ref(database, `petSlugs/${slug}`), {
        userId: user.uid,
        petId: currentPet.id,
        petName: currentPet.name,
        isPrivate: petDataWithSlug.privacy.isPrivate,
      });

      setPets((prev) =>
        isEditMode
          ? prev.map((p) => (p.id === currentPet.id ? petDataWithSlug : p))
          : [...prev, petDataWithSlug]
      );
      setOpenPetDialog(false);
      return petDataWithSlug;
    } catch (error) {
      console.error("Error saving pet:", error);
      alert(`Failed to save pet: ${error.message}`);
      return null;
    }
  }, [user, currentPet, isEditMode, setPets]);

  const handleDeletePet = useCallback(
    async (petId) => {
      if (!user) return;
      try {
        const pet = pets.find((p) => p.id === petId);
        await remove(ref(database, `userPets/${user.uid}/${petId}`));
        if (pet?.slug) {
          await remove(ref(database, `petSlugs/${pet.slug}`));
        }
        setPets((prev) => prev.filter((p) => p.id !== petId));
      } catch (error) {
        console.error("Error deleting pet:", error);
      }
    },
    [user, pets, setPets]
  );

  const handleToggleAvailability = useCallback(
    async (pet, type) => {
      if (!user) return;
      try {
        const updatedPet = { ...pet, [type]: !pet[type] };
        await set(
          ref(database, `userPets/${user.uid}/${pet.id}`),
          updatedPet
        );
        setPets((prev) => prev.map((p) => (p.id === pet.id ? updatedPet : p)));
      } catch (error) {
        console.error("Error toggling availability:", error);
      }
    },
    [user, setPets]
  );

  // ---- Vaccination handlers ----

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
        updatedPet.vaccinations.push({
          ...currentVaccination,
          id: Date.now().toString(),
        });
      }
      setCurrentPet(updatedPet);
      setOpenVaccinationDialog(false);
    } finally {
      setIsSavingVaccination(false);
    }
  }, [currentPet, currentVaccination, vaccinationEditIndex]);

  const handleDeleteVaccination = useCallback((index) => {
    setCurrentPet((prev) => {
      const updated = { ...prev };
      updated.vaccinations = [...(updated.vaccinations || [])];
      updated.vaccinations.splice(index, 1);
      return updated;
    });
  }, []);

  return {
    currentPet,
    setCurrentPet,
    isEditMode,
    openPetDialog,
    setOpenPetDialog,
    tabValue,
    setTabValue,
    openVaccinationDialog,
    setOpenVaccinationDialog,
    isSavingVaccination,
    currentVaccination,
    setCurrentVaccination,
    vaccinationEditIndex,
    handleAddPet,
    handleEditPet,
    handleSavePet,
    handleDeletePet,
    handleToggleAvailability,
    handleAddVaccination,
    handleEditVaccination,
    handleSaveVaccination,
    handleDeleteVaccination,
  };
}
