import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiX,
  FiUpload,
  FiCamera,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiCheck,
  FiClock,
  FiLock,
  FiUnlock,
  FiMessageCircle,
  FiShare2,
} from "react-icons/fi";
import { FaPaw, FaSyringe, FaNotesMedical, FaDog, FaCat, FaFish, FaDove, FaHorse, FaPills } from "react-icons/fa";
import AllergiesSelect from "./AllergiesSelect";
import BreedSelect from "./BreedSelect";
import MedicalConditionsSelect from "./MedicalConditionsSelect";
import MedicationSelect from "./MedicationSelect";
import MedicationScheduleDialog from "./MedicationScheduleDialog";

// TabPanel component for tab content
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`pet-tabpanel-${index}`}
      aria-labelledby={`pet-tab-${index}`}
      {...other}
    >
      {value === index && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="p-4 sm:p-6"
        >
          {children}
        </motion.div>
      )}
    </div>
  );
}

// Card selection component for pet types
function PetTypeCard({ type, icon: Icon, selected, onSelect, disabled }) {
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className={`p-4 sm:p-6 rounded-xl border-2 transition-all relative ${
        selected
          ? "border-violet-600 bg-violet-50 shadow-lg"
          : "border-gray-200 bg-white hover:border-violet-300 hover:shadow-md"
      } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      {selected && (
        <div className="absolute top-2 right-2 w-6 h-6 bg-violet-600 rounded-full flex items-center justify-center">
          <FiCheck className="text-white w-4 h-4" />
        </div>
      )}
      <Icon className={`w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-2 ${selected ? "text-violet-600" : "text-gray-400"}`} />
      <p className={`font-semibold text-sm sm:text-base ${selected ? "text-violet-700" : "text-gray-700"}`}>
        {type}
      </p>
    </motion.button>
  );
}

// Card selection component for gender
function GenderCard({ gender, selected, onSelect, disabled }) {
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className={`p-4 rounded-xl border-2 transition-all relative ${
        selected
          ? "border-violet-600 bg-violet-50 shadow-lg"
          : "border-gray-200 bg-white hover:border-violet-300 hover:shadow-md"
      } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      {selected && (
        <div className="absolute top-2 right-2 w-5 h-5 bg-violet-600 rounded-full flex items-center justify-center">
          <FiCheck className="text-white w-3 h-3" />
        </div>
      )}
      <p className={`font-semibold text-sm sm:text-base ${selected ? "text-violet-700" : "text-gray-700"}`}>
        {gender}
      </p>
    </motion.button>
  );
}

const PetDialog = ({
  open,
  onClose,
  pet,
  setPet,
  isEditMode,
  tabValue,
  onTabChange,
  onSave,
  onAddVaccination,
  onEditVaccination,
  onDeleteVaccination,
}) => {
  const currentPet = pet;
  const setCurrentPet = setPet;
  const handleTabChange = onTabChange;

  const [isSaving, setIsSaving] = useState(false);
  const [isDeletingVaccination, setIsDeletingVaccination] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [vaccinationToDelete, setVaccinationToDelete] = useState(null);
  const [otherBreed, setOtherBreed] = useState("");
  const [otherConditions, setOtherConditions] = useState("");
  const [otherAllergies, setOtherAllergies] = useState("");
  
  // Medication scheduling states
  const [openMedicationSchedule, setOpenMedicationSchedule] = useState(false);
  const [currentMedication, setCurrentMedication] = useState(null);
  const [medicationEditIndex, setMedicationEditIndex] = useState(-1);

  // Validation states
  const [validationErrors, setValidationErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const vaccinations = currentPet?.vaccinations || [];
  const medicationSchedules = currentPet?.medical?.medicationSchedules || [];

  useEffect(() => {
    if (currentPet) {
      if (!currentPet.medical) {
        setCurrentPet({
          ...currentPet,
          medical: {
            conditions: [],
            allergies: [],
            medications: "",
          },
        });
      } else if (!Array.isArray(currentPet.medical.conditions)) {
        const conditionsArray = currentPet.medical.conditions
          ? [currentPet.medical.conditions]
          : [];

        const allergiesArray = currentPet.medical.allergies
          ? [currentPet.medical.allergies]
          : [];

        setCurrentPet({
          ...currentPet,
          medical: {
            ...currentPet.medical,
            conditions: conditionsArray,
            allergies: allergiesArray,
          },
        });
      }
    }
  }, [currentPet, currentPet?.id, setCurrentPet]);

  // Validation logic
  const validateField = (fieldName, value) => {
    const errors = {};
    
    switch (fieldName) {
      case 'name':
        if (!value || value.trim() === '') {
          errors.name = 'Pet name is required';
        } else if (value.length < 2) {
          errors.name = 'Name must be at least 2 characters';
        } else if (value.length > 30) {
          errors.name = 'Name must be less than 30 characters';
        }
        break;
      case 'type':
        if (!value) {
          errors.type = 'Please select a pet type';
        }
        break;
      case 'breed':
        if (currentPet?.type && !value) {
          errors.breed = 'Please select a breed';
        }
        break;
      case 'dateOfBirth':
        if (value) {
          const birthDate = new Date(value);
          const today = new Date();
          if (birthDate > today) {
            errors.dateOfBirth = 'Birth date cannot be in the future';
          }
        }
        break;
      default:
        break;
    }
    
    return errors;
  };

  const handleFieldBlur = (fieldName) => {
    setTouched({ ...touched, [fieldName]: true });
    const errors = validateField(fieldName, currentPet?.[fieldName]);
    setValidationErrors({ ...validationErrors, ...errors });
  };

  const handleFieldChange = (fieldName, value) => {
    setCurrentPet({ ...currentPet, [fieldName]: value });
    
    if (touched[fieldName]) {
      const errors = validateField(fieldName, value);
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        if (Object.keys(errors).length === 0) {
          delete newErrors[fieldName];
        } else {
          Object.assign(newErrors, errors);
        }
        return newErrors;
      });
    }
  };

  const handleSaveWithSpinner = async () => {
    // Clear previous validation errors
    setValidationErrors({});
    setTouched({});
    
    // Validate required fields
    const nameErrors = validateField('name', currentPet?.name);
    const typeErrors = validateField('type', currentPet?.type);
    const breedErrors = validateField('breed', currentPet?.breed);
    const dobErrors = validateField('dateOfBirth', currentPet?.dateOfBirth);
    
    const allErrors = { ...nameErrors, ...typeErrors, ...breedErrors, ...dobErrors };
    
    if (Object.keys(allErrors).length > 0) {
      setValidationErrors(allErrors);
      setTouched({ name: true, type: true, breed: true, dateOfBirth: true });
      return;
    }
    
    setIsSaving(true);
    try {
      await onSave();
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";

    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const getVaccinationStatus = (nextDue) => {
    if (!nextDue) return "up-to-date";

    const dueDate = new Date(nextDue);
    const now = new Date();
    const oneMonthFromNow = new Date();
    oneMonthFromNow.setMonth(now.getMonth() + 1);

    if (dueDate < now) return "overdue";
    if (dueDate <= oneMonthFromNow) return "due-soon";
    return "up-to-date";
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCurrentPet({ ...currentPet, image: e.target.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBreedChange = (event) => {
    const selectedBreed = event.target.value;
    setCurrentPet({ ...currentPet, breed: selectedBreed });

    if (selectedBreed !== "Other") {
      setOtherBreed("");
    }
  };

  const handleOtherBreedChange = (event) => {
    const value = event.target.value;
    setOtherBreed(value);

    if (currentPet.breed === "Other") {
      setCurrentPet({ ...currentPet, customBreed: value });
    }
  };

  const handleConditionsChange = (selectedConditions) => {
    setCurrentPet({
      ...currentPet,
      medical: {
        ...currentPet.medical,
        conditions: selectedConditions,
      },
    });

    if (!selectedConditions.includes("Other")) {
      setOtherConditions("");
    }
  };

  const handleOtherConditionsChange = (event) => {
    const value = event.target.value;
    setOtherConditions(value);

    setCurrentPet({
      ...currentPet,
      medical: {
        ...currentPet.medical,
        otherConditions: value,
      },
    });
  };

  const handleAllergiesChange = (selectedAllergies) => {
    setCurrentPet({
      ...currentPet,
      medical: {
        ...currentPet.medical,
        allergies: selectedAllergies,
      },
    });

    if (!selectedAllergies.includes("Other")) {
      setOtherAllergies("");
    }
  };

  const handleOtherAllergiesChange = (event) => {
    const value = event.target.value;
    setOtherAllergies(value);

    setCurrentPet({
      ...currentPet,
      medical: {
        ...currentPet.medical,
        otherAllergies: value,
      },
    });
  };

  // Medication handlers
  const handleMedicationsChange = (medications) => {
    setCurrentPet({
      ...currentPet,
      medical: {
        ...currentPet.medical,
        medications: medications,
      },
    });
  };

  const handleAddMedicationSchedule = () => {
    setCurrentMedication({
      name: "",
      dosage: "",
      frequency: "daily",
      timeOfDay: "",
      startDate: new Date().toISOString().split('T')[0],
      endDate: "",
      reminderEnabled: true,
      notes: "",
    });
    setMedicationEditIndex(-1);
    setOpenMedicationSchedule(true);
  };

  const handleEditMedicationSchedule = (schedule, index) => {
    setCurrentMedication(schedule);
    setMedicationEditIndex(index);
    setOpenMedicationSchedule(true);
  };

  const handleSaveMedicationSchedule = (schedule) => {
    const updatedSchedules = medicationEditIndex >= 0
      ? medicationSchedules.map((s, i) => i === medicationEditIndex ? schedule : s)
      : [...medicationSchedules, schedule];

    setCurrentPet({
      ...currentPet,
      medical: {
        ...currentPet.medical,
        medicationSchedules: updatedSchedules,
      },
    });
    setOpenMedicationSchedule(false);
  };

  const handleDeleteMedicationSchedule = (index) => {
    if (window.confirm("Are you sure you want to delete this medication schedule?")) {
      const updatedSchedules = medicationSchedules.filter((_, i) => i !== index);
      setCurrentPet({
        ...currentPet,
        medical: {
          ...currentPet.medical,
          medicationSchedules: updatedSchedules,
        },
      });
    }
  };

  const calculateAge = (dobString) => {
    if (!dobString) return "";
    const dob = new Date(dobString);
    const today = new Date();

    if (dob > today) return "Invalid Date";

    let years = today.getFullYear() - dob.getFullYear();
    let months = today.getMonth() - dob.getMonth();

    if (months < 0 || (months === 0 && today.getDate() < dob.getDate())) {
      years--;
      months += 12;
    }

    if (years === 0 && months === 0) {
      return "Newborn";
    }

    const yearText = years > 0 ? `${years} ${years > 1 ? "years" : "year"}` : "";
    const monthText = months > 0 ? `${months} ${months > 1 ? "months" : "month"}` : "";

    return [yearText, monthText].filter(Boolean).join(", ");
  };

  const handleDateOfBirthChange = (e) => {
    const dob = e.target.value;
    const newAge = calculateAge(dob);
    setCurrentPet({ ...currentPet, dateOfBirth: dob, age: newAge });
  };

  const handleDeleteVaccinationClick = (index) => {
    setVaccinationToDelete(index);
    setShowDeleteConfirmation(true);
  };

  const confirmDeleteVaccination = async () => {
    setIsDeletingVaccination(true);
    try {
      await onDeleteVaccination(vaccinationToDelete);
    } finally {
      setIsDeletingVaccination(false);
      setShowDeleteConfirmation(false);
      setVaccinationToDelete(null);
    }
  };

  const cancelDeleteVaccination = () => {
    setShowDeleteConfirmation(false);
    setVaccinationToDelete(null);
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-30 flex items-center justify-center p-4">
          <AnimatePresence>
            {showDeleteConfirmation && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
              >
                <div
                  className="fixed inset-0 bg-black bg-opacity-50"
                  onClick={cancelDeleteVaccination}
                ></div>
                <motion.div
                  initial={{ scale: 0.95, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.95, y: 20 }}
                  className="bg-white rounded-xl shadow-xl z-50 w-full max-w-md"
                >
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">
                      Delete Vaccination Record
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Are you sure you want to delete this vaccination record?
                      This action cannot be undone.
                    </p>
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={cancelDeleteVaccination}
                        disabled={isDeletingVaccination}
                        className="px-4 py-2 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 rounded-lg transition-colors disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={confirmDeleteVaccination}
                        disabled={isDeletingVaccination}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center justify-center min-w-24 transition-colors disabled:opacity-50"
                      >
                        {isDeletingVaccination ? (
                          <>
                            <svg
                              className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            Deleting...
                          </>
                        ) : (
                          "Delete"
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col"
          >
            {/* Success Message */}
            <AnimatePresence>
              {showSuccessMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50"
                >
                  <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2">
                    <FiCheck className="w-5 h-5" />
                    <span className="font-medium">Pet saved successfully!</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="px-6 py-4 bg-gradient-to-r from-lavender-600 to-purple-600 text-white rounded-t-2xl flex justify-between items-center">
              <h2 className="text-xl font-bold">
                {isEditMode
                  ? `Edit ${currentPet?.name}'s Profile`
                  : "Add New Pet"}
              </h2>
              <button
                onClick={onClose}
                disabled={isSaving}
                className="text-white/80 hover:text-white p-2 rounded-full hover:bg-lavender-500/30 transition-colors disabled:opacity-50"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="border-b border-lavender-100 bg-white relative z-10 overflow-x-auto scrollbar-hide">
              <div className="flex min-w-max">
                <button
                  onClick={(e) => handleTabChange(e, 0)}
                  disabled={isSaving}
                  className={`px-4 sm:px-6 py-3 text-xs sm:text-sm font-medium flex items-center transition-colors whitespace-nowrap ${tabValue === 0
                    ? "text-lavender-700 border-b-2 border-lavender-600"
                    : "text-gray-500 hover:text-lavender-600 hover:bg-lavender-50"
                    } disabled:opacity-50`}
                >
                  <FaPaw
                    className={`${tabValue === 0 ? "text-lavender-600" : "text-gray-400"
                      } mr-1.5 sm:mr-2 w-3.5 h-3.5 sm:w-4 sm:h-4`}
                  />
                  <span className="hidden sm:inline">General Information</span>
                  <span className="sm:hidden">General</span>
                </button>
                <button
                  onClick={(e) => handleTabChange(e, 1)}
                  disabled={isSaving}
                  className={`px-4 sm:px-6 py-3 text-xs sm:text-sm font-medium flex items-center transition-colors whitespace-nowrap ${tabValue === 1
                    ? "text-lavender-700 border-b-2 border-lavender-600"
                    : "text-gray-500 hover:text-lavender-600 hover:bg-lavender-50"
                    } disabled:opacity-50`}
                >
                  <FaNotesMedical
                    className={`${tabValue === 1 ? "text-lavender-600" : "text-gray-400"
                      } mr-1.5 sm:mr-2 w-3.5 h-3.5 sm:w-4 sm:h-4`}
                  />
                  <span className="hidden sm:inline">Medical Profile</span>
                  <span className="sm:hidden">Medical</span>
                </button>
                <button
                  onClick={(e) => handleTabChange(e, 2)}
                  disabled={isSaving}
                  className={`px-4 sm:px-6 py-3 text-xs sm:text-sm font-medium flex items-center transition-colors whitespace-nowrap ${tabValue === 2
                    ? "text-lavender-700 border-b-2 border-lavender-600"
                    : "text-gray-500 hover:text-lavender-600 hover:bg-lavender-50"
                    } disabled:opacity-50`}
                >
                  <FaSyringe
                    className={`${tabValue === 2 ? "text-lavender-600" : "text-gray-400"
                      } mr-1.5 sm:mr-2 w-3.5 h-3.5 sm:w-4 sm:h-4`}
                  />
                  <span className="hidden sm:inline">Vaccination Records</span>
                  <span className="sm:hidden">Vaccines</span>
                </button>
                <button
                  onClick={(e) => handleTabChange(e, 3)}
                  disabled={isSaving}
                  className={`px-4 sm:px-6 py-3 text-xs sm:text-sm font-medium flex items-center transition-colors whitespace-nowrap ${tabValue === 3
                    ? "text-lavender-700 border-b-2 border-lavender-600"
                    : "text-gray-500 hover:text-lavender-600 hover:bg-lavender-50"
                    } disabled:opacity-50`}
                >
                  <FiLock
                    className={`${tabValue === 3 ? "text-lavender-600" : "text-gray-400"
                      } mr-1.5 sm:mr-2 w-3.5 h-3.5 sm:w-4 sm:h-4`}
                  />
                  <span className="hidden sm:inline">Privacy & Sharing</span>
                  <span className="sm:hidden">Privacy</span>
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              <TabPanel value={tabValue} index={0}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2 mb-2">
                    <div className="border-2 border-dashed border-lavender-200 rounded-xl p-6 bg-lavender-50/50 flex flex-col items-center justify-center">
                      {currentPet?.image ? (
                        <div className="relative max-w-xs">
                          <img
                            src={currentPet.image}
                            alt={`${currentPet.name || "Pet"} preview`}
                            className="w-full h-48 object-cover rounded-lg shadow-md"
                          />
                          <label className="absolute bottom-3 right-3 cursor-pointer">
                            <div className="bg-lavender-600/90 hover:bg-lavender-700 text-white p-2 rounded-full shadow-md flex items-center">
                              <FiCamera className="w-4 h-4" />
                              <span className="ml-1 text-xs font-medium">
                                Change
                              </span>
                              <input
                                type="file"
                                hidden
                                accept="image/*"
                                onChange={handleImageUpload}
                                disabled={isSaving}
                              />
                            </div>
                          </label>
                        </div>
                      ) : (
                        <div className="text-center">
                          <div className="w-20 h-20 bg-lavender-200 rounded-full flex items-center justify-center mb-4 mx-auto">
                            <FiCamera className="w-8 h-8 text-lavender-600" />
                          </div>
                          <p className="text-lavender-900 font-medium mb-4">
                            Upload a photo of your pet
                          </p>
                          <label className="px-4 py-2 bg-lavender-600 hover:bg-lavender-700 text-white rounded-lg cursor-pointer inline-flex items-center transition-colors disabled:opacity-50">
                            <FiUpload className="mr-2" />
                            <span>Upload Image</span>
                            <input
                              type="file"
                              hidden
                              accept="image/*"
                              onChange={handleImageUpload}
                              disabled={isSaving}
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pet Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={currentPet?.name || ""}
                      onChange={(e) => handleFieldChange('name', e.target.value)}
                      onBlur={() => handleFieldBlur('name')}
                      placeholder="Enter pet name"
                      className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent disabled:opacity-50 ${
                        validationErrors.name && touched.name
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-lavender-200 focus:ring-lavender-500'
                      }`}
                      required
                      disabled={isSaving}
                    />
                    {validationErrors.name && touched.name && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Pet Type <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                      <PetTypeCard
                        type="Dog"
                        icon={FaDog}
                        selected={currentPet?.type === "dog"}
                        onSelect={() => {
                          handleFieldChange('type', 'dog');
                          setCurrentPet({ ...currentPet, type: "dog", breed: "" });
                        }}
                        disabled={isSaving}
                      />
                      <PetTypeCard
                        type="Cat"
                        icon={FaCat}
                        selected={currentPet?.type === "cat"}
                        onSelect={() => {
                          handleFieldChange('type', 'cat');
                          setCurrentPet({ ...currentPet, type: "cat", breed: "" });
                        }}
                        disabled={isSaving}
                      />
                      <PetTypeCard
                        type="Bird"
                        icon={FaDove}
                        selected={currentPet?.type === "bird"}
                        onSelect={() => {
                          handleFieldChange('type', 'bird');
                          setCurrentPet({ ...currentPet, type: "bird", breed: "" });
                        }}
                        disabled={isSaving}
                      />
                      <PetTypeCard
                        type="Fish"
                        icon={FaFish}
                        selected={currentPet?.type === "fish"}
                        onSelect={() => {
                          handleFieldChange('type', 'fish');
                          setCurrentPet({ ...currentPet, type: "fish", breed: "" });
                        }}
                        disabled={isSaving}
                      />
                      <PetTypeCard
                        type="Horse"
                        icon={FaHorse}
                        selected={currentPet?.type === "horse"}
                        onSelect={() => {
                          handleFieldChange('type', 'horse');
                          setCurrentPet({ ...currentPet, type: "horse", breed: "" });
                        }}
                        disabled={isSaving}
                      />
                    </div>
                    {validationErrors.type && touched.type && (
                      <p className="mt-2 text-sm text-red-600">{validationErrors.type}</p>
                    )}
                  </div>
                  <div>
                    <BreedSelect
                      petType={currentPet?.type}
                      value={currentPet?.breed || ""}
                      onChange={(e) => {
                        handleBreedChange(e);
                        handleFieldChange('breed', e.target.value);
                      }}
                      otherValue={otherBreed}
                      onOtherChange={handleOtherBreedChange}
                      disabled={isSaving}
                    />
                    {validationErrors.breed && touched.breed && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.breed}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Gender
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      <GenderCard
                        gender="Male"
                        selected={currentPet?.gender === "Male"}
                        onSelect={() => setCurrentPet({ ...currentPet, gender: "Male" })}
                        disabled={isSaving}
                      />
                      <GenderCard
                        gender="Female"
                        selected={currentPet?.gender === "Female"}
                        onSelect={() => setCurrentPet({ ...currentPet, gender: "Female" })}
                        disabled={isSaving}
                      />
                      <GenderCard
                        gender="Unknown"
                        selected={currentPet?.gender === "Unknown"}
                        onSelect={() => setCurrentPet({ ...currentPet, gender: "Unknown" })}
                        disabled={isSaving}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={currentPet?.dateOfBirth || ""}
                      onChange={(e) => {
                        handleDateOfBirthChange(e);
                        handleFieldChange('dateOfBirth', e.target.value);
                      }}
                      onBlur={() => handleFieldBlur('dateOfBirth')}
                      className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent disabled:opacity-50 ${
                        validationErrors.dateOfBirth && touched.dateOfBirth
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-lavender-200 focus:ring-lavender-500'
                      }`}
                      disabled={isSaving}
                    />
                    {validationErrors.dateOfBirth && touched.dateOfBirth && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.dateOfBirth}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Age
                    </label>
                    <input
                      type="text"
                      value={currentPet?.age || ""}
                      onChange={(e) =>
                        setCurrentPet({ ...currentPet, age: e.target.value })
                      }
                      placeholder={currentPet?.dateOfBirth ? "Calculated from DOB" : "e.g., 2 years"}
                      className="w-full px-4 py-2.5 border border-lavender-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-lavender-500 focus:border-transparent disabled:opacity-50"
                      disabled={isSaving || !!currentPet?.dateOfBirth}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Weight
                    </label>
                    <input
                      type="text"
                      value={currentPet?.weight || ""}
                      onChange={(e) =>
                        setCurrentPet({ ...currentPet, weight: e.target.value })
                      }
                      placeholder="e.g., 15 kg"
                      className="w-full px-4 py-2.5 border border-lavender-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-lavender-500 focus:border-transparent disabled:opacity-50"
                      disabled={isSaving}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Color/Markings
                    </label>
                    <input
                      type="text"
                      value={currentPet?.color || ""}
                      onChange={(e) =>
                        setCurrentPet({ ...currentPet, color: e.target.value })
                      }
                      placeholder="e.g., Brown with white markings"
                      className="w-full px-4 py-2.5 border border-lavender-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-lavender-500 focus:border-transparent disabled:opacity-50"
                      disabled={isSaving}
                    />
                  </div>
                  <div className="md:col-span-2 flex flex-wrap gap-6">
                    <div>
                      <label className="inline-flex items-center cursor-pointer disabled:opacity-50">
                        <div className="relative">
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={currentPet?.availableForMating || false}
                            onChange={(e) =>
                              setCurrentPet({
                                ...currentPet,
                                availableForMating: e.target.checked,
                              })
                            }
                            disabled={isSaving}
                          />
                          <div
                            className={`w-10 h-5 rounded-full transition-colors ${currentPet?.availableForMating
                              ? "bg-pink-500"
                              : "bg-gray-300"
                              }`}
                          ></div>
                          <div
                            className={`absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform ${currentPet?.availableForMating
                              ? "translate-x-5"
                              : ""
                              }`}
                          ></div>
                        </div>
                        <span className="ml-2 text-gray-700">
                          Available for Mating
                        </span>
                      </label>
                    </div>
                    <div>
                      <label className="inline-flex items-center cursor-pointer disabled:opacity-50">
                        <div className="relative">
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={currentPet?.availableForAdoption || false}
                            onChange={(e) =>
                              setCurrentPet({
                                ...currentPet,
                                availableForAdoption: e.target.checked,
                              })
                            }
                            disabled={isSaving}
                          />
                          <div
                            className={`w-10 h-5 rounded-full transition-colors ${currentPet?.availableForAdoption
                              ? "bg-green-500"
                              : "bg-gray-300"
                              }`}
                          ></div>
                          <div
                            className={`absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform ${currentPet?.availableForAdoption
                              ? "translate-x-5"
                              : ""
                              }`}
                          ></div>
                        </div>
                        <span className="ml-2 text-gray-700">
                          Available for Adoption
                        </span>
                      </label>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={currentPet?.description || ""}
                      onChange={(e) =>
                        setCurrentPet({
                          ...currentPet,
                          description: e.target.value,
                        })
                      }
                      placeholder="Special traits, personality, etc."
                      className="w-full px-4 py-2.5 border border-lavender-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-lavender-500 focus:border-transparent resize-none disabled:opacity-50"
                      rows={4}
                      disabled={isSaving}
                    ></textarea>
                  </div>
                </div>
              </TabPanel>
              <TabPanel value={tabValue} index={1}>
                <div className="bg-lavender-50 p-4 rounded-xl mb-6">
                  <h3 className="text-lg font-semibold text-lavender-900 mb-2">
                    Medical Information
                  </h3>
                  <p className="text-gray-600">
                    Keep track of your pet's health conditions, allergies, and
                    medications to ensure they receive the best care.
                  </p>
                </div>
                <MedicalConditionsSelect
                  value={currentPet?.medical?.conditions || []}
                  onChange={handleConditionsChange}
                  otherValue={otherConditions}
                  onOtherChange={handleOtherConditionsChange}
                  disabled={isSaving}
                />
                <AllergiesSelect
                  value={currentPet?.medical?.allergies || []}
                  onChange={handleAllergiesChange}
                  otherValue={otherAllergies}
                  onOtherChange={handleOtherAllergiesChange}
                  disabled={isSaving}
                />
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Medications
                  </label>
                  <MedicationSelect
                    petType={currentPet?.type}
                    value={currentPet?.medical?.medications || []}
                    onChange={handleMedicationsChange}
                    disabled={isSaving}
                  />
                </div>

                {/* Medication Schedules */}
                <div className="mt-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <FaPills className="text-violet-600 w-4 h-4" />
                        Medication Schedules
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Set dosage and reminders for each medication
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddMedicationSchedule}
                      disabled={isSaving}
                      className="w-full sm:w-auto px-3 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg inline-flex items-center justify-center text-sm transition-colors disabled:opacity-50 font-medium"
                    >
                      <FiPlus className="mr-1.5" />
                      Add Schedule
                    </button>
                  </div>

                  {medicationSchedules.length > 0 ? (
                    <div className="space-y-3">
                      {medicationSchedules.map((schedule, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-white border border-violet-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-all"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start sm:items-center gap-2 mb-2 flex-wrap">
                                <FaPills className="text-violet-600 w-4 h-4 flex-shrink-0 mt-0.5 sm:mt-0" />
                                <h4 className="font-semibold text-gray-900 text-sm sm:text-base break-words">{schedule.name}</h4>
                                {schedule.reminderEnabled && (
                                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full flex items-center gap-1">
                                    <FiClock className="w-3 h-3" />
                                    Reminders On
                                  </span>
                                )}
                              </div>
                              <div className="text-xs sm:text-sm text-gray-600 space-y-1">
                                <p><strong>Dosage:</strong> {schedule.dosage}</p>
                                <p><strong>Frequency:</strong> {schedule.frequency.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase())}</p>
                                {schedule.frequency !== "as-needed" && (
                                  <p><strong>Time:</strong> {schedule.timeOfDay}</p>
                                )}
                                <p>
                                  <strong>Period:</strong> {new Date(schedule.startDate).toLocaleDateString()}
                                  {schedule.endDate && ` - ${new Date(schedule.endDate).toLocaleDateString()}`}
                                  {!schedule.endDate && " - Ongoing"}
                                </p>
                                {schedule.notes && (
                                  <p className="mt-2 text-xs italic border-t border-gray-100 pt-2 break-words">
                                    {schedule.notes}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex sm:flex-row flex-col gap-1.5 sm:gap-2 flex-shrink-0">
                              <button
                                type="button"
                                onClick={() => handleEditMedicationSchedule(schedule, index)}
                                disabled={isSaving}
                                className="p-2 text-violet-600 hover:bg-violet-50 rounded-md transition-colors disabled:opacity-50"
                              >
                                <FiEdit2 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteMedicationSchedule(index)}
                                disabled={isSaving}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                              >
                                <FiTrash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 sm:py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                      <FaPills className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm sm:text-base text-gray-600 mb-3">No medication schedules yet</p>
                      <button
                        type="button"
                        onClick={handleAddMedicationSchedule}
                        disabled={isSaving}
                        className="w-full sm:w-auto px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg inline-flex items-center justify-center transition-colors disabled:opacity-50 font-medium"
                      >
                        <FiPlus className="mr-1.5" />
                        Add First Schedule
                      </button>
                    </div>
                  )}
                </div>
              </TabPanel>
              <TabPanel value={tabValue} index={2}>
                <div className="flex justify-between items-center bg-lavender-50 p-4 rounded-xl mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-lavender-900 mb-1">
                      Vaccination Records
                    </h3>
                    <p className="text-gray-600">
                      Keep track of your pet's vaccinations and upcoming renewal
                      dates.
                    </p>
                  </div>
                  <button
                    onClick={onAddVaccination}
                    disabled={isSaving}
                    className="px-4 py-2 bg-lavender-600 hover:bg-lavender-700 text-white rounded-lg flex items-center transition-colors disabled:opacity-50"
                  >
                    <FiPlus className="mr-1" />
                    Add Vaccination
                  </button>
                </div>
                {vaccinations && vaccinations.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {vaccinations.map((vaccine, index) => {
                      const status = getVaccinationStatus(vaccine.nextDue);
                      return (
                        <div
                          key={index}
                          className="bg-white border border-lavender-100 rounded-xl shadow-sm overflow-hidden relative"
                        >
                          {vaccine.nextDue && (
                            <div
                              className={`absolute top-0 right-0 px-3 py-1 text-xs font-medium rounded-bl-xl ${status === "overdue"
                                ? "bg-red-100 text-red-800"
                                : status === "due-soon"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-green-100 text-green-800"
                                }`}
                            >
                              {status === "overdue"
                                ? "Overdue"
                                : status === "due-soon"
                                  ? "Due Soon"
                                  : "Up to Date"}
                            </div>
                          )}
                          <div className="absolute -left-3 -top-3 w-12 h-12 bg-lavender-600 rounded-full p-2 shadow-md">
                            <FaSyringe className="w-full h-full text-white" />
                          </div>
                          <div className="p-5 pt-6 pl-10">
                            <h4 className="text-lg font-semibold text-lavender-900 mb-3">
                              {vaccine.name}
                            </h4>
                            <div className="grid grid-cols-2 gap-4 mb-3">
                              <div>
                                <p className="text-xs text-gray-500 mb-1">
                                  Date Administered
                                </p>
                                <p className="text-sm font-medium">
                                  {formatDate(vaccine?.date)}
                                </p>
                              </div>
                              {vaccine.nextDue && (
                                <div>
                                  <p className="text-xs text-gray-500 mb-1">
                                    Next Due
                                  </p>
                                  <p className="text-sm font-medium">
                                    {formatDate(vaccine?.nextDue)}
                                  </p>
                                </div>
                              )}
                            </div>
                            {vaccine.notes && (
                              <div className="mt-2 text-sm text-gray-600 border-t border-lavender-100 pt-2">
                                {vaccine.notes}
                              </div>
                            )}
                            <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-lavender-100">
                              <button
                                onClick={() =>
                                  onEditVaccination(vaccine, index)
                                }
                                disabled={isSaving}
                                className="p-1.5 text-lavender-600 hover:bg-lavender-50 rounded-md flex items-center disabled:opacity-50"
                              >
                                <FiEdit2 className="w-4 h-4 mr-1" />
                                <span className="text-xs">Edit</span>
                              </button>
                              <button
                                onClick={() =>
                                  handleDeleteVaccinationClick(index)
                                }
                                disabled={isSaving}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-md flex items-center disabled:opacity-50"
                              >
                                <FiTrash2 className="w-4 h-4 mr-1" />
                                <span className="text-xs">Delete</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-lavender-50 border-2 border-dashed border-lavender-200 rounded-xl p-8 text-center">
                    <div className="w-16 h-16 mx-auto bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                      <FaSyringe className="w-7 h-7 text-lavender-400" />
                    </div>
                    <h4 className="text-lg font-medium text-lavender-900 mb-2">
                      No vaccination records added yet
                    </h4>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                      Add vaccination records to keep track of your pet's
                      immunization schedule and receive reminders for upcoming
                      vaccines.
                    </p>
                    <button
                      onClick={onAddVaccination}
                      disabled={isSaving}
                      className="px-4 py-2 bg-lavender-600 hover:bg-lavender-700 text-white rounded-lg inline-flex items-center transition-colors disabled:opacity-50"
                    >
                      <FiPlus className="mr-1" />
                      Add First Vaccination
                    </button>
                  </div>
                )}
              </TabPanel>

              {/* Privacy & Sharing Tab */}
              <TabPanel value={tabValue} index={3}>
                <div className="grid grid-cols-1 gap-6">
                  <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl p-6 border border-violet-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <FiShare2 className="w-5 h-5 text-violet-600 mr-2" />
                      Public Profile Settings
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Control how {currentPet?.name || 'your pet'}'s profile is shared and who can interact with it.
                    </p>

                    {/* Profile Visibility */}
                    <div className="bg-white rounded-lg p-4 mb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            {currentPet?.privacy?.isPrivate ? (
                              <FiLock className="w-5 h-5 text-red-500 mr-2" />
                            ) : (
                              <FiUnlock className="w-5 h-5 text-green-500 mr-2" />
                            )}
                            <h4 className="font-semibold text-gray-900">
                              Profile Visibility
                            </h4>
                          </div>
                          <p className="text-sm text-gray-600">
                            {currentPet?.privacy?.isPrivate
                              ? 'Only you can see this profile'
                              : 'Anyone with the link can view this profile'}
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer ml-4">
                          <input
                            type="checkbox"
                            checked={currentPet?.privacy?.isPrivate || false}
                            onChange={(e) =>
                              setCurrentPet({
                                ...currentPet,
                                privacy: {
                                  ...currentPet?.privacy,
                                  isPrivate: e.target.checked
                                }
                              })
                            }
                            disabled={isSaving}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-violet-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                        </label>
                      </div>
                    </div>

                    {/* Comments */}
                    <div className="bg-white rounded-lg p-4 mb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <FiMessageCircle className="w-5 h-5 text-violet-600 mr-2" />
                            <h4 className="font-semibold text-gray-900">
                              Comments
                            </h4>
                          </div>
                          <p className="text-sm text-gray-600">
                            {currentPet?.privacy?.commentsDisabled
                              ? 'Comments are disabled on posts'
                              : 'Users can comment on posts'}
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer ml-4">
                          <input
                            type="checkbox"
                            checked={currentPet?.privacy?.commentsDisabled || false}
                            onChange={(e) =>
                              setCurrentPet({
                                ...currentPet,
                                privacy: {
                                  ...currentPet?.privacy,
                                  commentsDisabled: e.target.checked
                                }
                              })
                            }
                            disabled={isSaving}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-violet-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
                        </label>
                      </div>
                    </div>

                    {/* Share Link Preview */}
                    {currentPet?.slug && (
                      <div className="bg-white rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-2 text-sm">Profile Link</h4>
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={`${window.location.origin}/pet/${currentPet.slug}`}
                            readOnly
                            className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-700"
                          />
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(`${window.location.origin}/pet/${currentPet.slug}`);
                              alert('Link copied to clipboard!');
                            }}
                            className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors text-sm"
                          >
                            Copy
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Share this link to showcase {currentPet?.name}'s profile!
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </TabPanel>
            </div>
            <div className="border-t border-lavender-100 p-3 sm:p-4 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 bg-gray-50 rounded-b-2xl">
              <button
                onClick={onClose}
                disabled={isSaving}
                className="w-full sm:w-auto px-4 py-2.5 sm:py-2 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 rounded-lg transition-colors disabled:opacity-50 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveWithSpinner}
                disabled={!currentPet?.name || isSaving}
                className={`w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-lg flex items-center justify-center transition-colors font-medium ${!currentPet?.name || isSaving
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-lavender-600 hover:bg-lavender-700 text-white"
                  }`}
              >
                {isSaving ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    {isEditMode ? "Updating..." : "Saving..."}
                  </>
                ) : (
                  <>
                    <FiCheck className="mr-1" />
                    {isEditMode ? "Update Pet" : "Save Pet"}
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
      
      {/* Medication Schedule Dialog */}
      <MedicationScheduleDialog
        open={openMedicationSchedule}
        onClose={() => setOpenMedicationSchedule(false)}
        medication={currentMedication}
        onSave={handleSaveMedicationSchedule}
      />
    </AnimatePresence>
  );
};

export default PetDialog;