import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiSearch, FiX, FiPlus } from "react-icons/fi";

const COMMON_ALLERGIES = [
  "Beef",
  "Chicken",
  "Dairy",
  "Dust Mites",
  "Eggs",
  "Fish",
  "Fleas",
  "Grain",
  "Grass",
  "Lamb",
  "Mold",
  "Pollen",
  "Pork",
  "Soy",
  "Wheat",
];

const AllergiesSelect = ({
  value = [],
  onChange,
  otherValue = "",
  onOtherChange,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddPanel, setShowAddPanel] = useState(false);
  const isOtherSelected = value.includes("Other");

  const filteredAllergies = searchQuery.trim()
    ? COMMON_ALLERGIES.filter((allergy) =>
        allergy.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : COMMON_ALLERGIES;

  const handleAllergyToggle = (allergy) => {
    const updatedAllergies = [...value];
    const conditionIndex = updatedAllergies.indexOf(allergy);

    if (conditionIndex === -1) {
      updatedAllergies.push(allergy);
    } else {
      updatedAllergies.splice(conditionIndex, 1);
    }

    onChange(updatedAllergies);
  };

  const handleRemoveAllergy = (condition, e) => {
    e.stopPropagation();
    onChange(value.filter((c) => c !== condition));
  };

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2">
        <label className="block text-sm font-medium text-lavender-800">
          Allergies
        </label>
        <button
          type="button"
          onClick={() => setShowAddPanel(!showAddPanel)}
          className={`text-sm flex items-center ${
            showAddPanel
              ? "text-lavender-800"
              : "text-lavender-600 hover:text-lavender-800"
          }`}
        >
          {showAddPanel ? (
            <>
              <FiX className="w-4 h-4 mr-1" /> Close
            </>
          ) : (
            <>
              <FiPlus className="w-4 h-4 mr-1" /> Add Allergies
            </>
          )}
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {value.length > 0 ? (
          value.map((allergy) => (
            <motion.div
              key={allergy}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="bg-lavender-100 text-lavender-800 px-3 py-1.5 rounded-full text-sm font-medium flex items-center"
            >
              {allergy}
              <button
                type="button"
                onClick={(e) => handleRemoveAllergy(allergy, e)}
                className="ml-2 text-lavender-500 hover:text-lavender-700 rounded-full focus:outline-none"
              >
                <FiX className="w-4 h-4" />
              </button>
            </motion.div>
          ))
        ) : (
          <div className="text-sm text-gray-500 py-1.5">
            No allergies selected
          </div>
        )}
      </div>
      <AnimatePresence>
        {showAddPanel && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="relative mb-3">
              <FiSearch className="absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search allergies..."
                className="w-full pl-9 pr-4 py-2 border border-lavender-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-lavender-500 focus:border-transparent text-gray-700"
              />
            </div>
            <div className="bg-white rounded-lg border border-lavender-200 p-3 h-48 overflow-y-auto">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {filteredAllergies.map((allergy) => (
                  <motion.button
                    key={allergy}
                    type="button"
                    onClick={() => handleAllergyToggle(allergy)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`p-2 rounded-lg text-sm text-left transition-colors ${
                      value.includes(allergy)
                        ? "bg-lavender-500 text-white font-medium"
                        : "bg-lavender-50 text-lavender-800 hover:bg-lavender-100"
                    }`}
                  >
                    {allergy}
                  </motion.button>
                ))}
                <motion.button
                  type="button"
                  onClick={() => handleAllergyToggle("Other")}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`p-2 rounded-lg text-sm text-left transition-colors ${
                    value.includes("Other")
                      ? "bg-lavender-500 text-white font-medium"
                      : "bg-lavender-50 text-lavender-800 hover:bg-lavender-100"
                  }`}
                >
                  Other
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isOtherSelected && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3"
          >
            <textarea
              value={otherValue}
              onChange={(e) => onOtherChange(e)}
              placeholder="Enter other allergies here..."
              className="w-full p-3 border border-lavender-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-lavender-500 focus:border-transparent resize-none"
              rows={3}
            ></textarea>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AllergiesSelect;
