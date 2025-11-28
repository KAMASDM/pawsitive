import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiX,
  FiCalendar,
  FiInfo,
  FiChevronDown,
  FiSearch,
  FiCheck,
  FiClock,
} from "react-icons/fi";
import { FaPills } from "react-icons/fa";

const COMMON_MEDICATIONS = [
  "Heartworm Prevention",
  "Flea & Tick Prevention",
  "Pain Relief (NSAID)",
  "Antibiotics",
  "Prednisone/Steroids",
  "Insulin",
  "Thyroid Medication",
  "Anxiety Medication",
  "Allergy Medication",
  "Joint Supplements",
  "Probiotics",
  "Dewormer",
  "Other",
];

const FREQUENCY_OPTIONS = [
  { value: "once-daily", label: "Once Daily" },
  { value: "twice-daily", label: "Twice Daily" },
  { value: "three-times-daily", label: "Three Times Daily" },
  { value: "every-other-day", label: "Every Other Day" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "as-needed", label: "As Needed" },
];

const MedicationDialog = ({
  open,
  onClose,
  medication,
  setMedication,
  onSave,
  isEditMode,
  loading = false,
}) => {
  const currentMedication = medication;
  const setCurrentMedication = setMedication;

  const [selectedMedicine, setSelectedMedicine] = useState("");
  const [medicineSearch, setMedicineSearch] = useState("");
  const [medicineDropdownOpen, setMedicineDropdownOpen] = useState(false);
  const [customMedicine, setCustomMedicine] = useState("");
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedMedicine(currentMedication?.name || "");
      setCustomMedicine(
        currentMedication?.name === "Other"
          ? currentMedication.customName || ""
          : ""
      );
      setMedicineSearch("");
      setMedicineDropdownOpen(false);
      setShowInstructions(false);
    }
  }, [open, currentMedication]);

  const filteredMedications = medicineSearch.trim()
    ? COMMON_MEDICATIONS.filter((m) =>
        m.toLowerCase().includes(medicineSearch.toLowerCase())
      )
    : COMMON_MEDICATIONS;

  const handleMedicationSelect = (medicine) => {
    setSelectedMedicine(medicine);
    setCurrentMedication({
      ...currentMedication,
      name: medicine,
    });
    setMedicineDropdownOpen(false);
  };

  const handleCustomMedicationChange = (e) => {
    const value = e.target.value;
    setCustomMedicine(value);
    setCurrentMedication({
      ...currentMedication,
      customName: value,
      name: "Other",
    });
  };

  const formatDateForInput = (date) => {
    if (!date) return "";
    try {
      const d = new Date(date);
      return d.toISOString().split("T")[0];
    } catch {
      return "";
    }
  };

  const handleSave = () => {
    if (!currentMedication?.name) {
      alert("Please select a medication");
      return;
    }
    if (currentMedication.name === "Other" && !customMedicine.trim()) {
      alert("Please enter a custom medication name");
      return;
    }
    if (!currentMedication?.dosage?.trim()) {
      alert("Please enter dosage information");
      return;
    }
    if (!currentMedication?.frequency) {
      alert("Please select frequency");
      return;
    }

    const medicationData = {
      ...currentMedication,
      name:
        currentMedication.name === "Other"
          ? customMedicine.trim()
          : currentMedication.name,
      dosage: currentMedication.dosage.trim(),
      timestamp: isEditMode ? currentMedication.timestamp : Date.now(),
    };

    onSave(medicationData);
  };

  if (!open) return null;

  const displayName =
    selectedMedicine === "Other" ? customMedicine : selectedMedicine;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-4 flex items-center justify-between z-10">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-3">
                <FaPills className="text-white text-xl" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {isEditMode ? "Edit" : "Add"} Medication
                </h2>
                <p className="text-white text-opacity-90 text-sm">
                  Track your pet's medications and refill dates
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
              disabled={loading}
            >
              <FiX className="text-white text-xl" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <FiInfo className="text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Medication Reminders</p>
                  <p className="text-blue-700">
                    Never miss a dose! We'll send you reminders when it's time to
                    give your pet their medication.
                  </p>
                </div>
              </div>
            </div>

            {/* Medication Name Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Medication Name *
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMedicineDropdownOpen(!medicineDropdownOpen)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white hover:border-blue-300 transition-colors flex items-center justify-between focus:outline-none focus:border-blue-500"
                >
                  <span
                    className={
                      displayName
                        ? "text-gray-900 font-medium"
                        : "text-gray-400"
                    }
                  >
                    {displayName || "Select medication..."}
                  </span>
                  <FiChevronDown
                    className={`text-gray-400 transition-transform ${
                      medicineDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {medicineDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute z-20 mt-2 w-full bg-white border-2 border-gray-200 rounded-xl shadow-lg overflow-hidden"
                    >
                      {/* Search */}
                      <div className="p-3 border-b border-gray-200">
                        <div className="relative">
                          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            value={medicineSearch}
                            onChange={(e) => setMedicineSearch(e.target.value)}
                            placeholder="Search medications..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>

                      {/* Options */}
                      <div className="max-h-64 overflow-y-auto">
                        {filteredMedications.map((med) => (
                          <button
                            key={med}
                            onClick={() => handleMedicationSelect(med)}
                            className={`w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors flex items-center justify-between ${
                              selectedMedicine === med
                                ? "bg-blue-50 text-blue-600 font-medium"
                                : "text-gray-700"
                            }`}
                          >
                            <span>{med}</span>
                            {selectedMedicine === med && (
                              <FiCheck className="text-blue-600" />
                            )}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Custom Medication Name */}
            {selectedMedicine === "Other" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Custom Medication Name *
                </label>
                <input
                  type="text"
                  value={customMedicine}
                  onChange={handleCustomMedicationChange}
                  placeholder="Enter medication name..."
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </motion.div>
            )}

            {/* Dosage */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Dosage *
              </label>
              <input
                type="text"
                value={currentMedication?.dosage || ""}
                onChange={(e) =>
                  setCurrentMedication({
                    ...currentMedication,
                    dosage: e.target.value,
                  })
                }
                placeholder="e.g., 1 tablet, 5ml, 0.5mg"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter the amount and unit (e.g., 1 tablet, 5ml, 0.5mg)
              </p>
            </div>

            {/* Frequency */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Frequency *
              </label>
              <select
                value={currentMedication?.frequency || ""}
                onChange={(e) =>
                  setCurrentMedication({
                    ...currentMedication,
                    frequency: e.target.value,
                  })
                }
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 bg-white"
              >
                <option value="">Select frequency...</option>
                {FREQUENCY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Start Date
              </label>
              <div className="relative">
                <FiCalendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="date"
                  value={formatDateForInput(currentMedication?.startDate)}
                  onChange={(e) =>
                    setCurrentMedication({
                      ...currentMedication,
                      startDate: e.target.value,
                    })
                  }
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Next Dose Date */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Next Dose Date
              </label>
              <div className="relative">
                <FiClock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="date"
                  value={formatDateForInput(currentMedication?.nextDose)}
                  onChange={(e) =>
                    setCurrentMedication({
                      ...currentMedication,
                      nextDose: e.target.value,
                    })
                  }
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                We'll send you a reminder on this date
              </p>
            </div>

            {/* Instructions/Notes */}
            <div>
              <button
                type="button"
                onClick={() => setShowInstructions(!showInstructions)}
                className="flex items-center text-sm font-semibold text-blue-600 hover:text-blue-700 mb-2"
              >
                <FiInfo className="mr-1" />
                {showInstructions ? "Hide" : "Add"} Instructions/Notes
                <FiChevronDown
                  className={`ml-1 transition-transform ${
                    showInstructions ? "rotate-180" : ""
                  }`}
                />
              </button>
              <AnimatePresence>
                {showInstructions && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <textarea
                      value={currentMedication?.notes || ""}
                      onChange={(e) =>
                        setCurrentMedication({
                          ...currentMedication,
                          notes: e.target.value,
                        })
                      }
                      placeholder="e.g., Give with food, avoid dairy, etc."
                      rows={3}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 resize-none"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all font-medium disabled:opacity-50 flex items-center"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                  Saving...
                </>
              ) : (
                <>
                  <FaPills className="mr-2" />
                  {isEditMode ? "Update" : "Add"} Medication
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MedicationDialog;
