import React, { useState } from "react";
import { motion } from "framer-motion";
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
  const [isFocused, setIsFocused] = useState(false);
  const isOtherSelected = value.includes("Other");

  const filteredAllergies = searchQuery.trim()
    ? COMMON_ALLERGIES.filter((allergy) =>
        allergy.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : COMMON_ALLERGIES;

  const handleAllergyClick = (allergy) => {
    const selectedValues = [...value];
    const allergyIndex = selectedValues.indexOf(allergy);
    if (allergyIndex === -1) {
      selectedValues.push(allergy);
    } else {
      selectedValues.splice(allergyIndex, 1);
    }
    onChange(selectedValues);
  };

  const handleRemoveAllergy = (allergy, e) => {
    e.stopPropagation();
    const selectedValues = value.filter((item) => item !== allergy);
    onChange(selectedValues);
  };

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-lavender-800 mb-2">
        Allergies
      </label>
      <div className="flex flex-wrap gap-2 mb-3 min-h-10">
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
                className="ml-2 rounded-full p-0.5 hover:bg-lavender-200 transition-colors"
                aria-label={`Remove ${allergy}`}
              >
                <FiX className="h-4 w-4 text-lavender-600" />
              </button>
            </motion.div>
          ))
        ) : (
          <div className="text-sm text-gray-500 py-1.5">
            No allergies selected
          </div>
        )}
      </div>
      <div
        className={`relative mb-3 transition-all duration-300 rounded-lg ${
          isFocused ? "ring-2 ring-lavender-500 ring-opacity-50" : ""
        }`}
      >
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Search or select allergies..."
          className="w-full px-4 py-2.5 rounded-lg border border-lavender-200 focus:outline-none text-gray-700 pr-10"
        />
        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
          <FiSearch className="h-5 w-5 text-gray-400" />
        </div>
      </div>
      <div className="bg-white rounded-lg border border-lavender-200 p-3 max-h-52 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-2">
        {filteredAllergies.map((allergy) => (
          <motion.button
            key={allergy}
            type="button"
            onClick={() => handleAllergyClick(allergy)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`p-2 rounded-lg text-sm text-left transition-colors flex items-center ${
              value.includes(allergy)
                ? "bg-lavender-500 text-white font-medium"
                : "bg-lavender-50 text-lavender-800 hover:bg-lavender-100"
            }`}
            aria-label={`Select ${allergy}`}
          >
            {!value.includes(allergy) && (
              <FiPlus className="mr-1 flex-shrink-0" />
            )}
            {allergy}
          </motion.button>
        ))}
        <motion.button
          type="button"
          onClick={() => handleAllergyClick("Other")}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`p-2 rounded-lg text-sm text-left transition-colors flex items-center ${
            value.includes("Other")
              ? "bg-lavender-500 text-white font-medium"
              : "bg-lavender-50 text-lavender-800 hover:bg-lavender-100"
          }`}
          aria-label="Select other allergies"
        >
          {!value.includes("Other") && (
            <FiPlus className="mr-1 flex-shrink-0" />
          )}
          Other
        </motion.button>
      </div>
      {isOtherSelected && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className="mt-3"
        >
          <textarea
            value={otherValue}
            onChange={(e) => onOtherChange(e)}
            placeholder="Enter other allergies here..."
            className="w-full px-4 py-2.5 rounded-lg border border-lavender-200 focus:outline-none focus:ring-2 focus:ring-lavender-500 focus:ring-opacity-50 focus:border-transparent text-gray-700 resize-none"
            rows={3}
          />
        </motion.div>
      )}
    </div>
  );
};

export default AllergiesSelect;
