// src/components/Profile/components/PetDialog.jsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiUpload, FiCamera, FiPlus, FiEdit2, FiTrash2, FiCheck } from "react-icons/fi";
import { FaPaw, FaSyringe, FaNotesMedical } from "react-icons/fa";
import AllergiesSelect from "./AllergiesSelect";
import BreedSelect from "./BreedSelect";
import MedicalConditionsSelect from "./MedicalConditionsSelect";

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
          className="p-6"
        >
          {children}
        </motion.div>
      )}
    </div>
  );
}

const PetDialog = ({
  open,
  onClose,
  currentPet,
  setCurrentPet,
  isEditMode,
  tabValue,
  handleTabChange,
  onSave,
  onAddVaccination,
  onEditVaccination,
  onDeleteVaccination,
  vaccinations = []
}) => {
  const [otherBreed, setOtherBreed] = useState("");
  const [otherConditions, setOtherConditions] = useState("");
  const [otherAllergies, setOtherAllergies] = useState("");

  // Initialize medical information if it doesn't exist
  useEffect(() => {
    if (currentPet) {
      if (!currentPet.medical) {
        setCurrentPet({
          ...currentPet,
          medical: {
            conditions: [],
            allergies: [],
            medications: ""
          }
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
            allergies: allergiesArray
          }
        });
      }
    }
  }, [currentPet, currentPet?.id, setCurrentPet]);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";

    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Check if vaccination is due soon or overdue
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

  // Handle image upload
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

  // Handle breed selection
  const handleBreedChange = (event) => {
    const selectedBreed = event.target.value;
    setCurrentPet({ ...currentPet, breed: selectedBreed });

    if (selectedBreed !== "Other") {
      setOtherBreed("");
    }
  };

  // Handle custom breed input
  const handleOtherBreedChange = (event) => {
    const value = event.target.value;
    setOtherBreed(value);

    if (currentPet.breed === "Other") {
      setCurrentPet({ ...currentPet, customBreed: value });
    }
  };

  // Handle medical conditions selection
  const handleConditionsChange = (selectedConditions) => {
    setCurrentPet({
      ...currentPet,
      medical: {
        ...currentPet.medical,
        conditions: selectedConditions
      }
    });

    if (!selectedConditions.includes("Other")) {
      setOtherConditions("");
    }
  };

  // Handle custom conditions input
  const handleOtherConditionsChange = (event) => {
    const value = event.target.value;
    setOtherConditions(value);

    setCurrentPet({
      ...currentPet,
      medical: {
        ...currentPet.medical,
        otherConditions: value
      }
    });
  };

  // Handle allergies selection
  const handleAllergiesChange = (selectedAllergies) => {
    setCurrentPet({
      ...currentPet,
      medical: {
        ...currentPet.medical,
        allergies: selectedAllergies
      }
    });

    if (!selectedAllergies.includes("Other")) {
      setOtherAllergies("");
    }
  };

  // Handle custom allergies input
  const handleOtherAllergiesChange = (event) => {
    const value = event.target.value;
    setOtherAllergies(value);

    setCurrentPet({
      ...currentPet,
      medical: {
        ...currentPet.medical,
        otherAllergies: value
      }
    });
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-30 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col"
          >
            {/* Dialog Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-lavender-600 to-purple-600 text-white rounded-t-2xl flex justify-between items-center">
              <h2 className="text-xl font-bold">
                {isEditMode ? `Edit ${currentPet.name}'s Profile` : "Add New Pet"}
              </h2>
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white p-2 rounded-full hover:bg-lavender-500/30 transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="border-b border-lavender-100">
              <div className="flex">
                <button
                  onClick={(e) => handleTabChange(e, 0)}
                  className={`px-6 py-3 text-sm font-medium flex items-center transition-colors ${
                    tabValue === 0
                      ? "text-lavender-700 border-b-2 border-lavender-600"
                      : "text-gray-500 hover:text-lavender-600 hover:bg-lavender-50"
                  }`}
                >
                  <FaPaw className={`${tabValue === 0 ? "text-lavender-600" : "text-gray-400"} mr-2`} />
                  General Information
                </button>
                <button
                  onClick={(e) => handleTabChange(e, 1)}
                  className={`px-6 py-3 text-sm font-medium flex items-center transition-colors ${
                    tabValue === 1
                      ? "text-lavender-700 border-b-2 border-lavender-600"
                      : "text-gray-500 hover:text-lavender-600 hover:bg-lavender-50"
                  }`}
                >
                  <FaNotesMedical className={`${tabValue === 1 ? "text-lavender-600" : "text-gray-400"} mr-2`} />
                  Medical Profile
                </button>
                <button
                  onClick={(e) => handleTabChange(e, 2)}
                  className={`px-6 py-3 text-sm font-medium flex items-center transition-colors ${
                    tabValue === 2
                      ? "text-lavender-700 border-b-2 border-lavender-600"
                      : "text-gray-500 hover:text-lavender-600 hover:bg-lavender-50"
                  }`}
                >
                  <FaSyringe className={`${tabValue === 2 ? "text-lavender-600" : "text-gray-400"} mr-2`} />
                  Vaccination Records
                </button>
              </div>
            </div>

            {/* Dialog Content with Scrollable Area */}
            <div className="flex-1 overflow-y-auto">
              {/* General Information Tab */}
              <TabPanel value={tabValue} index={0}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Image Upload */}
                  <div className="md:col-span-2 mb-2">
                    <div className="border-2 border-dashed border-lavender-200 rounded-xl p-6 bg-lavender-50/50 flex flex-col items-center justify-center">
                      {currentPet.image ? (
                        <div className="relative max-w-xs">
                          <img
                            src={currentPet.image}
                            alt={`${currentPet.name || 'Pet'} preview`}
                            className="w-full h-48 object-cover rounded-lg shadow-md"
                          />
                          <label className="absolute bottom-3 right-3 cursor-pointer">
                            <div className="bg-lavender-600/90 hover:bg-lavender-700 text-white p-2 rounded-full shadow-md flex items-center">
                              <FiCamera className="w-4 h-4" />
                              <span className="ml-1 text-xs font-medium">Change</span>
                              <input
                                type="file"
                                hidden
                                accept="image/*"
                                onChange={handleImageUpload}
                              />
                            </div>
                          </label>
                        </div>
                      ) : (
                        <div className="text-center">
                          <div className="w-20 h-20 bg-lavender-200 rounded-full flex items-center justify-center mb-4 mx-auto">
                            <FiCamera className="w-8 h-8 text-lavender-600" />
                          </div>
                          <p className="text-lavender-900 font-medium mb-4">Upload a photo of your pet</p>
                          <label className="px-4 py-2 bg-lavender-600 hover:bg-lavender-700 text-white rounded-lg cursor-pointer inline-flex items-center transition-colors">
                            <FiUpload className="mr-2" />
                            <span>Upload Image</span>
                            <input
                              type="file"
                              hidden
                              accept="image/*"
                              onChange={handleImageUpload}
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pet Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={currentPet.name || ""}
                      onChange={(e) => setCurrentPet({ ...currentPet, name: e.target.value })}
                      placeholder="Enter pet name"
                      className="w-full px-4 py-2.5 border border-lavender-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-lavender-500 focus:border-transparent"
                      required
                    />
                  </div>

                  {/* Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pet Type
                    </label>
                    <select
                      value={currentPet.type || ""}
                      onChange={(e) => setCurrentPet({ ...currentPet, type: e.target.value, breed: "" })}
                      className="w-full px-4 py-2.5 border border-lavender-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-lavender-500 focus:border-transparent bg-white"
                    >
                      <option value="">Select pet type</option>
                      <option value="dog">Dog</option>
                      <option value="cat">Cat</option>
                      <option value="bird">Bird</option>
                      <option value="fish">Fish</option>
                      <option value="rabbit">Rabbit</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  {/* Breed */}
                  <div>
                    <BreedSelect
                      petType={currentPet.type}
                      value={currentPet.breed || ""}
                      onChange={handleBreedChange}
                      otherValue={otherBreed}
                      onOtherChange={handleOtherBreedChange}
                    />
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Gender
                    </label>
                    <select
                      value={currentPet.gender || ""}
                      onChange={(e) => setCurrentPet({ ...currentPet, gender: e.target.value })}
                      className="w-full px-4 py-2.5 border border-lavender-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-lavender-500 focus:border-transparent bg-white"
                    >
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Unknown">Unknown</option>
                    </select>
                  </div>

                  {/* Age */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Age
                    </label>
                    <input
                      type="text"
                      value={currentPet.age || ""}
                      onChange={(e) => setCurrentPet({ ...currentPet, age: e.target.value })}
                      placeholder="e.g., 2 years"
                      className="w-full px-4 py-2.5 border border-lavender-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-lavender-500 focus:border-transparent"
                    />
                  </div>

                  {/* Weight */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Weight
                    </label>
                    <input
                      type="text"
                      value={currentPet.weight || ""}
                      onChange={(e) => setCurrentPet({ ...currentPet, weight: e.target.value })}
                      placeholder="e.g., 15 kg"
                      className="w-full px-4 py-2.5 border border-lavender-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-lavender-500 focus:border-transparent"
                    />
                  </div>

                  {/* Color */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Color/Markings
                    </label>
                    <input
                      type="text"
                      value={currentPet.color || ""}
                      onChange={(e) => setCurrentPet({ ...currentPet, color: e.target.value })}
                      placeholder="e.g., Brown with white markings"
                      className="w-full px-4 py-2.5 border border-lavender-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-lavender-500 focus:border-transparent"
                    />
                  </div>

                  {/* Toggles */}
                  <div className="md:col-span-2 flex flex-wrap gap-6">
                    <div>
                      <label className="inline-flex items-center cursor-pointer">
                        <div className="relative">
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={currentPet.availableForMating || false}
                            onChange={(e) => setCurrentPet({ ...currentPet, availableForMating: e.target.checked })}
                          />
                          <div className={`w-10 h-5 rounded-full transition-colors ${currentPet.availableForMating ? 'bg-pink-500' : 'bg-gray-300'}`}></div>
                          <div className={`absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform ${currentPet.availableForMating ? 'translate-x-5' : ''}`}></div>
                        </div>
                        <span className="ml-2 text-gray-700">Available for Mating</span>
                      </label>
                    </div>

                    <div>
                      <label className="inline-flex items-center cursor-pointer">
                        <div className="relative">
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={currentPet.availableForAdoption || false}
                            onChange={(e) => setCurrentPet({ ...currentPet, availableForAdoption: e.target.checked })}
                          />
                          <div className={`w-10 h-5 rounded-full transition-colors ${currentPet.availableForAdoption ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                          <div className={`absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform ${currentPet.availableForAdoption ? 'translate-x-5' : ''}`}></div>
                        </div>
                        <span className="ml-2 text-gray-700">Available for Adoption</span>
                      </label>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={currentPet.description || ""}
                      onChange={(e) => setCurrentPet({ ...currentPet, description: e.target.value })}
                      placeholder="Special traits, personality, etc."
                      className="w-full px-4 py-2.5 border border-lavender-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-lavender-500 focus:border-transparent resize-none"
                      rows={4}
                    ></textarea>
                  </div>
                </div>
              </TabPanel>

              {/* Medical Profile Tab */}
              <TabPanel value={tabValue} index={1}>
                <div className="bg-lavender-50 p-4 rounded-xl mb-6">
                  <h3 className="text-lg font-semibold text-lavender-900 mb-2">Medical Information</h3>
                  <p className="text-gray-600">
                    Keep track of your pet's health conditions, allergies, and medications to ensure they receive the best care.
                  </p>
                </div>

                {/* Medical Conditions */}
                <MedicalConditionsSelect
                  value={currentPet.medical?.conditions || []}
                  onChange={handleConditionsChange}
                  otherValue={otherConditions}
                  onOtherChange={handleOtherConditionsChange}
                />

                {/* Allergies */}
                <AllergiesSelect
                  value={currentPet.medical?.allergies || []}
                  onChange={handleAllergiesChange}
                  otherValue={otherAllergies}
                  onOtherChange={handleOtherAllergiesChange}
                />

                {/* Medications */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Medications
                  </label>
                  <textarea
                    value={currentPet.medical?.medications || ""}
                    onChange={(e) =>
                      setCurrentPet({
                        ...currentPet,
                        medical: { ...currentPet.medical, medications: e.target.value }
                      })
                    }
                    placeholder="Current medications and dosage"
                    className="w-full px-4 py-2.5 border border-lavender-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-lavender-500 focus:border-transparent resize-none"
                    rows={3}
                  ></textarea>
                </div>
              </TabPanel>

              {/* Vaccination Records Tab */}
              <TabPanel value={tabValue} index={2}>
                <div className="flex justify-between items-center bg-lavender-50 p-4 rounded-xl mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-lavender-900 mb-1">Vaccination Records</h3>
                    <p className="text-gray-600">
                      Keep track of your pet's vaccinations and upcoming renewal dates.
                    </p>
                  </div>
                  <button
                    onClick={onAddVaccination}
                    className="px-4 py-2 bg-lavender-600 hover:bg-lavender-700 text-white rounded-lg flex items-center transition-colors"
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
                          {/* Status badge */}
                          {vaccine.nextDue && (
                            <div
                              className={`absolute top-0 right-0 px-3 py-1 text-xs font-medium rounded-bl-xl ${
                                status === "overdue"
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

                          {/* Vaccine icon */}
                          <div className="absolute -left-3 -top-3 w-12 h-12 bg-lavender-600 rounded-full p-2 shadow-md">
                            <FaSyringe className="w-full h-full text-white" />
                          </div>

                          {/* Content */}
                          <div className="p-5 pt-6 pl-10">
                            <h4 className="text-lg font-semibold text-lavender-900 mb-3">
                              {vaccine.name}
                            </h4>

                            <div className="grid grid-cols-2 gap-4 mb-3">
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Date Administered</p>
                                <p className="text-sm font-medium">
                                  {formatDate(vaccine.date)}
                                </p>
                              </div>

                              {vaccine.nextDue && (
                                <div>
                                  <p className="text-xs text-gray-500 mb-1">Next Due</p>
                                  <p className="text-sm font-medium">
                                    {formatDate(vaccine.nextDue)}
                                  </p>
                                </div>
                              )}
                            </div>

                            {vaccine.notes && (
                              <div className="mt-2 text-sm text-gray-600 border-t border-lavender-100 pt-2">
                                {vaccine.notes}
                              </div>
                            )}

                            {/* Actions */}
                            <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-lavender-100">
                              <button
                                onClick={() => onEditVaccination(vaccine, index)}
                                className="p-1.5 text-lavender-600 hover:bg-lavender-50 rounded-md flex items-center"
                              >
                                <FiEdit2 className="w-4 h-4 mr-1" />
                                <span className="text-xs">Edit</span>
                              </button>
                              <button
                                onClick={() => onDeleteVaccination(index)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-md flex items-center"
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
                      Add vaccination records to keep track of your pet's immunization schedule and receive reminders for upcoming vaccines.
                    </p>
                    <button
                      onClick={onAddVaccination}
                      className="px-4 py-2 bg-lavender-600 hover:bg-lavender-700 text-white rounded-lg inline-flex items-center transition-colors"
                    >
                      <FiPlus className="mr-1" />
                      Add First Vaccination
                    </button>
                  </div>
                )}
              </TabPanel>
            </div>

            {/* Dialog Footer */}
            <div className="border-t border-lavender-100 p-4 flex justify-end gap-3 bg-gray-50 rounded-b-2xl">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onSave}
                disabled={!currentPet.name}
                className={`px-4 py-2 rounded-lg flex items-center transition-colors ${
                  !currentPet.name
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-lavender-600 hover:bg-lavender-700 text-white"
                }`}
              >
                <FiCheck className="mr-1" />
                {isEditMode ? "Update Pet" : "Save Pet"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PetDialog;