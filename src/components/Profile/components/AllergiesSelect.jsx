// src/components/Profile/components/AllergiesSelect.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';

const COMMON_ALLERGIES = [
  'Beef', 'Chicken', 'Dairy', 'Dust Mites', 'Eggs', 'Fish', 'Fleas',
  'Grain', 'Grass', 'Lamb', 'Mold', 'Pollen', 'Pork', 'Soy', 'Wheat'
];

const AllergiesSelect = ({ value = [], onChange, otherValue = '', onOtherChange }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const isOtherSelected = value.includes('Other');

  const filteredAllergies = searchQuery.trim() 
    ? COMMON_ALLERGIES.filter(allergy => 
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
    const selectedValues = value.filter(item => item !== allergy);
    onChange(selectedValues);
  };

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-lavender-800 mb-2">
        Allergies
      </label>
      
      {/* Selected allergies */}
      <div className="flex flex-wrap gap-2 mb-3">
        {value.length > 0 ? (
          value.map(allergy => (
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
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-lavender-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </button>
            </motion.div>
          ))
        ) : (
          <div className="text-sm text-gray-500 py-1.5">No allergies selected</div>
        )}
      </div>
      
      {/* Search input */}
      <div className={`relative mb-3 transition-all duration-300 ${isFocused ? 'ring-2 ring-lavender-500 ring-opacity-50' : ''}`}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Search or select allergies..."
          className="w-full px-4 py-2.5 rounded-lg border border-lavender-200 focus:outline-none text-gray-700"
        />
        <div className="absolute inset-y-0 right-3 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
      
      {/* Allergies list */}
      <div className="bg-white rounded-lg border border-lavender-200 p-3 max-h-52 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-2">
        {filteredAllergies.map(allergy => (
          <motion.button
            key={allergy}
            type="button"
            onClick={() => handleAllergyClick(allergy)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`p-2 rounded-lg text-sm text-left transition-colors ${
              value.includes(allergy) 
                ? 'bg-lavender-500 text-white font-medium' 
                : 'bg-lavender-50 text-lavender-800 hover:bg-lavender-100'
            }`}
          >
            {allergy}
          </motion.button>
        ))}
        <motion.button
          type="button"
          onClick={() => handleAllergyClick('Other')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`p-2 rounded-lg text-sm text-left transition-colors ${
            value.includes('Other') 
              ? 'bg-lavender-500 text-white font-medium' 
              : 'bg-lavender-50 text-lavender-800 hover:bg-lavender-100'
          }`}
        >
          Other
        </motion.button>
      </div>
      
      {/* Other allergies */}
      {isOtherSelected && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
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