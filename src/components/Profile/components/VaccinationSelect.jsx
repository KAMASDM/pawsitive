// src/components/Profile/components/VaccinationSelect.jsx
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiChevronDown, FiX, FiSearch, FiCheck } from "react-icons/fi";

// Common vaccinations by pet type
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
  "Coronavirus"
];

const CAT_VACCINATIONS = [
  "Rabies",
  "Feline Viral Rhinotracheitis",
  "Calicivirus",
  "Panleukopenia",
  "Feline Leukemia Virus (FeLV)",
  "Chlamydia",
  "Bordetella",
  "Feline Immunodeficiency Virus (FIV)"
];

const VaccinationSelect = ({ petType, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  
  // Get vaccination list based on pet type
  const getVaccinationList = () => {
    if (petType === 'dog') return DOG_VACCINATIONS;
    if (petType === 'cat') return CAT_VACCINATIONS;
    return [];
  };

  // Filter vaccinations based on search
  const filteredVaccinations = searchQuery.trim() 
    ? getVaccinationList().filter(vaccine => 
        vaccine.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : getVaccinationList();

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Handle selection
  const handleSelect = (vaccination) => {
    onChange({ target: { value: vaccination } });
    setIsOpen(false);
    setSearchQuery("");
  };
  
  // Clear selected vaccination
  const handleClear = (e) => {
    e.stopPropagation();
    onChange({ target: { value: '' } });
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Vaccination Type
      </label>
      
      <div className="relative" ref={dropdownRef}>
        {/* Selected value display */}
        <button
          type="button"
          onClick={() => petType && ['dog', 'cat'].includes(petType) && setIsOpen(!isOpen)}
          className={`w-full px-4 py-2.5 bg-white rounded-lg border ${
            !petType || !['dog', 'cat'].includes(petType) 
              ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'border-lavender-200 hover:border-lavender-400 text-gray-700'
          } flex items-center justify-between transition-colors`}
          disabled={!petType || !['dog', 'cat'].includes(petType)}
        >
          <span className={value ? 'text-gray-900' : 'text-gray-500'}>
            {value || 'Select vaccination'}
          </span>
          
          <div className="flex items-center gap-1">
            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full"
              >
                <FiX className="w-4 h-4" />
              </button>
            )}
            <FiChevronDown className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </button>
        
        {/* Dropdown */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute z-30 mt-1 w-full bg-white border border-lavender-200 rounded-lg shadow-lg max-h-80 overflow-hidden"
            >
              {/* Search input */}
              <div className="p-2 border-b border-lavender-100 sticky top-0 bg-white">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-2.5 text-gray-400" />
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Search vaccinations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-md border border-lavender-200 focus:outline-none focus:ring-2 focus:ring-lavender-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
              
              {/* Vaccinations list */}
              <div className="max-h-60 overflow-y-auto p-2">
                {filteredVaccinations.length > 0 ? (
                  <>
                    {filteredVaccinations.map((vaccination) => (
                      <button
                        key={vaccination}
                        type="button"
                        onClick={() => handleSelect(vaccination)}
                        className={`w-full text-left px-3 py-2.5 rounded-md text-sm transition-colors ${
                          value === vaccination 
                            ? 'bg-lavender-100 text-lavender-800 font-medium' 
                            : 'text-gray-700 hover:bg-lavender-50'
                        }`}
                      >
                        <div className="flex items-center">
                          {value === vaccination && (
                            <FiCheck className="text-lavender-600 mr-2 flex-shrink-0" />
                          )}
                          <span>{vaccination}</span>
                        </div>
                      </button>
                    ))}
                  </>
                ) : (
                  <div className="text-center py-3 text-gray-500">
                    No vaccinations found
                  </div>
                )}
                
                {/* Other option */}
                <button
                  type="button"
                  onClick={() => handleSelect('Other')}
                  className={`w-full text-left px-3 py-2.5 rounded-md text-sm mt-2 border-t border-lavender-100 pt-3 transition-colors ${
                    value === 'Other'
                      ? 'bg-lavender-100 text-lavender-800 font-medium'
                      : 'text-gray-700 hover:bg-lavender-50'
                  }`}
                >
                  <div className="flex items-center">
                    {value === 'Other' && (
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
    </div>
  );
};

export default VaccinationSelect;