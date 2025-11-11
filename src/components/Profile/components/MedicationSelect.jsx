import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiSearch, FiChevronDown, FiCheck } from "react-icons/fi";

const COMMON_MEDICATIONS = {
  dog: [
    "Apoquel (Oclacitinib)",
    "Bravecto (Fluralaner)",
    "Carprofen (Rimadyl)",
    "Cephalexin",
    "Clindamycin",
    "Doxycycline",
    "Enalapril",
    "Furosemide (Lasix)",
    "Gabapentin",
    "Heartgard (Ivermectin)",
    "Metacam (Meloxicam)",
    "NexGard (Afoxolaner)",
    "Prednisone",
    "Simparica (Sarolaner)",
    "Trazodone",
    "Amoxicillin",
    "Metronidazole",
    "Tramadol",
  ],
  cat: [
    "Amoxicillin",
    "Buprenorphine",
    "Clavamox",
    "Clindamycin",
    "Doxycycline",
    "Enrofloxacin (Baytril)",
    "Gabapentin",
    "Meloxicam (Metacam)",
    "Methimazole (Felimazole)",
    "Orbax",
    "Prednisolone",
    "Revolution (Selamectin)",
    "Tramadol",
    "Advantage Multi",
    "Cerenia (Maropitant)",
  ],
  general: [
    "Antibiotics",
    "Anti-inflammatory",
    "Pain Relief",
    "Flea & Tick Prevention",
    "Heartworm Prevention",
    "Allergy Medication",
    "Thyroid Medication",
    "Heart Medication",
    "Joint Supplements",
    "Probiotics",
  ],
};

const MedicationSelect = ({ petType, value = [], onChange, disabled = false }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [customMedication, setCustomMedication] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Get medications based on pet type
  const medications = useMemo(() => {
    const petMeds = COMMON_MEDICATIONS[petType?.toLowerCase()] || [];
    const generalMeds = COMMON_MEDICATIONS.general;
    return [...new Set([...petMeds, ...generalMeds])].sort();
  }, [petType]);

  // Filter medications based on search
  const filteredMedications = useMemo(() => {
    if (!searchTerm) return medications;
    return medications.filter(med =>
      med.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [medications, searchTerm]);

  const handleToggleMedication = (medication) => {
    const newValue = value.includes(medication)
      ? value.filter(m => m !== medication)
      : [...value, medication];
    onChange(newValue);
  };

  const handleAddCustom = () => {
    if (customMedication.trim() && !value.includes(customMedication.trim())) {
      onChange([...value, customMedication.trim()]);
      setCustomMedication("");
      setShowCustomInput(false);
    }
  };

  const handleRemoveMedication = (medication) => {
    onChange(value.filter(m => m !== medication));
  };

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Current Medications
      </label>
      
      {/* Selected Medications */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {value.map((medication, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="bg-violet-100 text-violet-700 px-3 py-1.5 rounded-full text-sm flex items-center gap-2"
            >
              <span>{medication}</span>
              <button
                type="button"
                onClick={() => handleRemoveMedication(medication)}
                disabled={disabled}
                className="hover:bg-violet-200 rounded-full p-0.5 transition-colors disabled:opacity-50"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Dropdown Button */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
          className={`w-full px-4 py-2.5 rounded-lg border ${
            disabled
              ? "border-gray-200 bg-gray-100 cursor-not-allowed"
              : "border-lavender-200 bg-white hover:border-lavender-400"
          } text-left flex items-center justify-between transition-colors`}
        >
          <span className="text-gray-500">
            {value.length > 0 ? "Add more medications..." : "Select medications"}
          </span>
          <FiChevronDown
            className={`text-gray-400 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Dropdown Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute z-50 w-full mt-2 bg-white border border-lavender-200 rounded-lg shadow-lg max-h-80 overflow-hidden"
            >
              {/* Search Input */}
              <div className="p-3 border-b border-gray-100">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search medications..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-lavender-500"
                  />
                </div>
              </div>

              {/* Medication List */}
              <div className="overflow-y-auto max-h-60 scrollbar-thin scrollbar-thumb-lavender-400 scrollbar-track-lavender-100">
                {filteredMedications.length > 0 ? (
                  filteredMedications.map((medication) => (
                    <button
                      key={medication}
                      type="button"
                      onClick={() => handleToggleMedication(medication)}
                      className="w-full px-4 py-2.5 text-left hover:bg-lavender-50 flex items-center justify-between transition-colors"
                    >
                      <span className="text-gray-700">{medication}</span>
                      {value.includes(medication) && (
                        <FiCheck className="text-lavender-600" />
                      )}
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-8 text-center text-gray-500">
                    No medications found
                  </div>
                )}
              </div>

              {/* Add Custom Medication */}
              <div className="border-t border-gray-100 p-3">
                {!showCustomInput ? (
                  <button
                    type="button"
                    onClick={() => setShowCustomInput(true)}
                    className="w-full px-4 py-2 text-sm text-lavender-600 hover:bg-lavender-50 rounded-lg transition-colors font-medium"
                  >
                    + Add Custom Medication
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter medication name"
                      value={customMedication}
                      onChange={(e) => setCustomMedication(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleAddCustom()}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-lavender-500 text-sm"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleAddCustom}
                      disabled={!customMedication.trim()}
                      className="px-4 py-2 bg-lavender-600 text-white rounded-lg hover:bg-lavender-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCustomInput(false);
                        setCustomMedication("");
                      }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {!petType && (
        <p className="mt-2 text-sm text-amber-600">
          ⚠️ Please select pet type first to see relevant medications
        </p>
      )}
    </div>
  );
};

export default MedicationSelect;
