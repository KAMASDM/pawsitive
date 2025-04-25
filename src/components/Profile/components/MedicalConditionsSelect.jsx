// src/components/Profile/components/MedicalConditionsSelect.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiX, FiSearch } from 'react-icons/fi';

const COMMON_CONDITIONS = [
  'Allergies', 'Arthritis', 'Asthma', 'Cancer', 'Cataracts', 'Dental Disease',
  'Diabetes', 'Ear Infections', 'Epilepsy', 'Heart Disease', 'Hip Dysplasia',
  'Hypothyroidism', 'Kidney Disease', 'Obesity', 'Pancreatitis', 'Skin Infections'
];

const MedicalConditionsSelect = ({ value = [], onChange, otherValue = '', onOtherChange }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddPanel, setShowAddPanel] = useState(false);
  const isOtherSelected = value.includes('Other');

  // Filter conditions based on search query
  const filteredConditions = searchQuery.trim()
    ? COMMON_CONDITIONS.filter(condition =>
        condition.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : COMMON_CONDITIONS;

  // Handle condition selection
  const handleConditionToggle = (condition) => {
    const updatedConditions = [...value];
    const conditionIndex = updatedConditions.indexOf(condition);
    
    if (conditionIndex === -1) {
      updatedConditions.push(condition);
    } else {
      updatedConditions.splice(conditionIndex, 1);
    }
    
    onChange(updatedConditions);
  };

  // Remove a selected condition
  const handleRemoveCondition = (condition, e) => {
    e.stopPropagation();
    onChange(value.filter(c => c !== condition));
  };

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2">
        <label className="block text-sm font-medium text-lavender-800">
          Medical Conditions
        </label>
        <button
          type="button"
          onClick={() => setShowAddPanel(!showAddPanel)}
          className={`text-sm flex items-center ${showAddPanel ? 'text-lavender-800' : 'text-lavender-600 hover:text-lavender-800'}`}
        >
          {showAddPanel ? (
            <>
              <FiX className="w-4 h-4 mr-1" /> Close
            </>
          ) : (
            <>
              <FiPlus className="w-4 h-4 mr-1" /> Add Condition
            </>
          )}
        </button>
      </div>
      
      {/* Selected conditions */}
      <div className="flex flex-wrap gap-2 mb-3">
        {value.length > 0 ? (
          value.map(condition => (
            <motion.div
              key={condition}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="bg-lavender-100 text-lavender-800 px-3 py-1.5 rounded-full text-sm font-medium flex items-center"
            >
              {condition}
              <button 
                type="button"
                onClick={(e) => handleRemoveCondition(condition, e)}
                className="ml-2 text-lavender-500 hover:text-lavender-700 rounded-full focus:outline-none"
              >
                <FiX className="w-4 h-4" />
              </button>
            </motion.div>
          ))
        ) : (
          <div className="text-sm text-gray-500 py-1.5">
            No medical conditions selected
          </div>
        )}
      </div>
      
      {/* Add condition panel */}
      <AnimatePresence>
        {showAddPanel && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            {/* Search input */}
            <div className="relative mb-3">
              <FiSearch className="absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conditions..."
                className="w-full pl-9 pr-4 py-2 border border-lavender-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-lavender-500 focus:border-transparent text-gray-700"
              />
            </div>
            
            {/* Conditions grid */}
            <div className="bg-white rounded-lg border border-lavender-200 p-3 h-48 overflow-y-auto">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {filteredConditions.map(condition => (
                  <motion.button
                    key={condition}
                    type="button"
                    onClick={() => handleConditionToggle(condition)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`p-2 rounded-lg text-sm text-left transition-colors ${
                      value.includes(condition)
                        ? 'bg-lavender-500 text-white font-medium'
                        : 'bg-lavender-50 text-lavender-800 hover:bg-lavender-100'
                    }`}
                  >
                    {condition}
                  </motion.button>
                ))}
                <motion.button
                  type="button"
                  onClick={() => handleConditionToggle('Other')}
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Other conditions input */}
      <AnimatePresence>
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
              placeholder="Enter other medical conditions..."
              className="w-full p-3 border border-lavender-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-lavender-500 focus:border-transparent resize-none"
              rows={3}
            ></textarea>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MedicalConditionsSelect;