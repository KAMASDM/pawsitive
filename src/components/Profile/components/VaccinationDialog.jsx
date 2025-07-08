import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiX,
  FiCalendar,
  FiInfo,
  FiChevronDown,
  FiSearch,
  FiCheck,
} from "react-icons/fi";
import { FaSyringe } from "react-icons/fa";

const DOG_VACCINATIONS = [
  "Rabies",
  "Distemper",
  "Parvovirus",
  "Adenovirus/Hepatitis",
  "Parainfluenza",
  "Bordetella (Kennel Cough)",
  "Leptospirosis",
  "Canine Influenza",
  "Lyme Disease",
  "Coronavirus",
];

const CAT_VACCINATIONS = [
  "Rabies",
  "Feline Viral Rhinotracheitis",
  "Calicivirus",
  "Panleukopenia",
  "Feline Leukemia Virus (FeLV)",
  "Chlamydia",
  "Bordetella",
  "Feline Immunodeficiency Virus (FIV)",
];

const VaccinationDialog = ({
  open,
  onClose,
  vaccination,
  setVaccination,
  onSave,
  isEditMode,
  petType,
  loading = false,
}) => {
  const currentVaccination = vaccination;
  const setCurrentVaccination = setVaccination;

  const [selectedVaccine, setSelectedVaccine] = useState("");
  const [vaccineSearch, setVaccineSearch] = useState("");
  const [vaccineDropdownOpen, setVaccineDropdownOpen] = useState(false);
  const [customVaccine, setCustomVaccine] = useState("");

  useEffect(() => {
    if (open) {
      setSelectedVaccine(currentVaccination?.name || "");
      setCustomVaccine(
        currentVaccination?.name === "Other"
          ? currentVaccination.customName || ""
          : ""
      );
      setVaccineSearch("");
      setVaccineDropdownOpen(false);
    }
  }, [open, currentVaccination, petType]);

  const getVaccinationList = () => {
    if (petType === "dog") return DOG_VACCINATIONS;
    if (petType === "cat") return CAT_VACCINATIONS;
    return [];
  };

  const filteredVaccinations = vaccineSearch.trim()
    ? getVaccinationList().filter((v) =>
      v.toLowerCase().includes(vaccineSearch.toLowerCase())
    )
    : getVaccinationList();

  const handleVaccinationSelect = (vaccination) => {
    setSelectedVaccine(vaccination);
    setCurrentVaccination({
      ...currentVaccination,
      name: vaccination,
    });
    setVaccineDropdownOpen(false);
  };

  const handleCustomVaccinationChange = (e) => {
    const value = e.target.value;
    setCustomVaccine(value);
    setCurrentVaccination({
      ...currentVaccination,
      customName: value,
      name: "Other",
    });
  };

  const formatDateForInput = (date) => {
    if (!date) return "";

    let d;
    if (typeof date === "string") {
      d = new Date(date);
    } else if (date instanceof Date) {
      d = date;
    } else {
      return "";
    }

    if (isNaN(d.getTime())) {
      return "";
    }

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const handleDateChange = (e) => {
    const newDate = e.target.value ? new Date(e.target.value) : null;
    setCurrentVaccination({
      ...currentVaccination,
      date: newDate.toDateString(),
    });
  };

  const handleNextDueDateChange = (e) => {
    const newDate = e.target.value ? new Date(e.target.value) : null;
    setCurrentVaccination({
      ...currentVaccination,
      nextDue: newDate.toDateString(),
    });
  };

  const handleSaveClick = async () => {
    if (!currentVaccination?.name || !currentVaccination?.date) return;
    await onSave();
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-30 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-md"
          >
            <div className="px-6 py-4 bg-lavender-600 text-white rounded-t-2xl flex justify-between items-center">
              <div className="flex items-center">
                <FaSyringe className="mr-2" />
                <h2 className="text-lg font-semibold">
                  {isEditMode ? "Edit Vaccination" : "Add Vaccination"}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-lavender-500"
                disabled={loading}
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vaccination Type
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setVaccineDropdownOpen(!vaccineDropdownOpen)}
                    className={`w-full px-4 py-2.5 rounded-lg border ${!petType || !["dog", "cat"].includes(petType)
                      ? "border-gray-200 bg-gray-100 cursor-not-allowed"
                      : "border-lavender-200 bg-white hover:border-lavender-400"
                      } text-left flex items-center justify-between transition-colors`}
                    disabled={
                      !petType || !["dog", "cat"].includes(petType) || loading
                    }
                  >
                    <span
                      className={`${selectedVaccine ? "text-gray-900" : "text-gray-500"
                        }`}
                    >
                      {selectedVaccine || "Select vaccination type"}
                    </span>
                    <FiChevronDown
                      className={`text-gray-400 transition-transform ${vaccineDropdownOpen ? "rotate-180" : ""
                        }`}
                    />
                  </button>
                  <AnimatePresence>
                    {vaccineDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute z-50 mt-1 w-full bg-white border border-lavender-200 rounded-lg shadow-lg max-h-80 overflow-hidden"
                      >
                        <div className="p-2 border-b border-lavender-100 sticky top-0 bg-white">
                          <div className="relative">
                            <FiSearch className="absolute left-3 top-2.5 text-gray-400" />
                            <input
                              type="text"
                              value={vaccineSearch}
                              onChange={(e) => setVaccineSearch(e.target.value)}
                              placeholder="Search vaccinations..."
                              className="w-full pl-9 pr-4 py-2 rounded-md border border-lavender-200 focus:outline-none focus:ring-2 focus:ring-lavender-500 focus:border-transparent text-sm"
                            />
                          </div>
                        </div>
                        <div className="max-h-52 overflow-y-auto p-2">
                          {filteredVaccinations.length > 0 ? (
                            filteredVaccinations.map((vaccine) => (
                              <button
                                key={vaccine}
                                type="button"
                                onClick={() => handleVaccinationSelect(vaccine)}
                                className={`w-full text-left px-3 py-2 rounded-md text-sm hover:bg-lavender-50 transition-colors ${selectedVaccine === vaccine
                                  ? "bg-lavender-100 text-lavender-900 font-medium"
                                  : "text-gray-700"
                                  }`}
                              >
                                <div className="flex items-center">
                                  {selectedVaccine === vaccine && (
                                    <FiCheck className="text-lavender-600 mr-2 flex-shrink-0" />
                                  )}
                                  <span>{vaccine}</span>
                                </div>
                              </button>
                            ))
                          ) : (
                            <div className="px-3 py-2 text-gray-500 text-center">
                              No vaccinations found
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => handleVaccinationSelect("Other")}
                            className={`w-full text-left px-3 py-2 rounded-md text-sm mt-2 border-t border-lavender-100 pt-3 hover:bg-lavender-50 transition-colors ${selectedVaccine === "Other"
                              ? "bg-lavender-100 text-lavender-900 font-medium"
                              : "text-gray-700"
                              }`}
                          >
                            <div className="flex items-center">
                              {selectedVaccine === "Other" && (
                                <FiCheck className="text-lavender-600 mr-2 flex-shrink-0" />
                              )}
                              <span>Other</span>
                            </div>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <AnimatePresence>
                  {selectedVaccine === "Other" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden mt-2"
                    >
                      <input
                        type="text"
                        value={customVaccine}
                        onChange={handleCustomVaccinationChange}
                        placeholder="Enter vaccination name"
                        className="w-full px-4 py-2 border border-lavender-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-lavender-500 focus:border-transparent"
                        disabled={loading}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date Administered
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={formatDateForInput(currentVaccination?.date)}
                    onChange={handleDateChange}
                    className="w-full px-4 py-2 border border-lavender-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-lavender-500 focus:border-transparent pr-10"
                    disabled={loading}
                  />
                  <FiCalendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Next Due Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={formatDateForInput(currentVaccination?.nextDue)}
                    onChange={handleNextDueDateChange}
                    className="w-full px-4 py-2 border border-lavender-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-lavender-500 focus:border-transparent pr-10"
                    disabled={loading}
                  />
                  <FiCalendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={currentVaccination?.notes || ""}
                  onChange={(e) =>
                    setCurrentVaccination({
                      ...currentVaccination,
                      notes: e.target.value,
                    })
                  }
                  placeholder="Additional information, reactions, etc."
                  className="w-full px-4 py-2 border border-lavender-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-lavender-500 focus:border-transparent resize-none"
                  rows={3}
                  disabled={loading}
                ></textarea>
              </div>
              <div className="mb-6 p-3 bg-lavender-50 rounded-lg flex items-start">
                <FiInfo className="text-lavender-600 mt-0.5 mr-2 flex-shrink-0" />
                <div className="text-xs text-lavender-900">
                  <p>
                    Regular vaccinations help protect your pet from serious
                    diseases and are often required by law or for services like
                    boarding and grooming.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveClick}
                  disabled={
                    !currentVaccination?.name ||
                    !currentVaccination?.date ||
                    loading
                  }
                  className={`px-4 py-2 rounded-lg flex items-center justify-center min-w-24 ${!currentVaccination?.name ||
                    !currentVaccination?.date ||
                    loading
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-lavender-600 hover:bg-lavender-700 text-white"
                    } transition-colors`}
                >
                  {loading ? (
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
                      {isEditMode ? "Update" : "Save"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default VaccinationDialog;
