import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiChevronDown, FiX, FiSearch } from "react-icons/fi";

const DOG_BREEDS = [
  "Affenpinscher",
  "Afghan Hound",
  "Airedale Terrier",
  "Akita",
  "Alaskan Malamute",
  "American Bulldog",
  "American Eskimo Dog",
  "Australian Shepherd",
  "Basenji",
  "Basset Hound",
  "Beagle",
  "Bernese Mountain Dog",
  "Bichon Frise",
  "Border Collie",
  "Boston Terrier",
  "Boxer",
  "Bulldog",
  "Cavalier King Charles Spaniel",
  "Chihuahua",
  "Cocker Spaniel",
  "Dachshund",
  "Dalmatian",
  "Doberman Pinscher",
  "French Bulldog",
  "German Shepherd",
  "Golden Retriever",
  "Great Dane",
  "Greyhound",
  "Havanese",
  "Labrador Retriever",
  "Maltese",
  "Miniature Schnauzer",
  "Mixed Breed",
  "Pomeranian",
  "Poodle",
  "Pug",
  "Rottweiler",
  "Saint Bernard",
  "Shih Tzu",
  "Siberian Husky",
  "Yorkshire Terrier",
];

const CAT_BREEDS = [
  "Abyssinian",
  "American Bobtail",
  "American Shorthair",
  "Bengal",
  "Birman",
  "British Shorthair",
  "Burmese",
  "Devon Rex",
  "Egyptian Mau",
  "Exotic",
  "Himalayan",
  "Maine Coon",
  "Manx",
  "Mixed Breed",
  "Norwegian Forest",
  "Persian",
  "Ragdoll",
  "Russian Blue",
  "Scottish Fold",
  "Siamese",
  "Siberian",
  "Sphynx",
  "Tonkinese",
  "Turkish Angora",
  "Turkish Van",
];

const BreedSelect = ({
  petType,
  value,
  onChange,
  otherValue,
  onOtherChange,
  error,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  const isOtherSelected = value === "Other";

  const breedList =
    petType === "dog" ? DOG_BREEDS : petType === "cat" ? CAT_BREEDS : [];

  const filteredBreeds = searchQuery.trim()
    ? breedList.filter((breed) =>
        breed.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : breedList;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleBreedSelect = (breed) => {
    onChange({ target: { value: breed } });
    setIsOpen(false);
    setSearchQuery("");
  };

  const getDisplayValue = () => {
    if (!value) return "";
    return value;
  };

  const handleClearBreed = (e) => {
    e.stopPropagation();
    onChange({ target: { value: "" } });
  };

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-lavender-800 mb-2">
        Breed
      </label>
      <div className="relative" ref={dropdownRef}>
        <div
          onClick={() =>
            petType && ["dog", "cat"].includes(petType) && setIsOpen(!isOpen)
          }
          className={`w-full px-4 py-2.5 bg-white rounded-lg border ${
            error ? "border-red-500" : "border-lavender-200"
          } flex items-center justify-between cursor-pointer ${
            !petType || !["dog", "cat"].includes(petType)
              ? "opacity-60 cursor-not-allowed"
              : ""
          }`}
        >
          <div className="flex items-center flex-1 truncate">
            {value ? (
              <span className="text-gray-800">{getDisplayValue()}</span>
            ) : (
              <span className="text-gray-500">Select breed</span>
            )}
          </div>
          <div className="flex items-center">
            {value && (
              <button
                type="button"
                onClick={handleClearBreed}
                className="mr-2 text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                <FiX />
              </button>
            )}
            <FiChevronDown
              className={`text-gray-400 transition-transform ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </div>
        </div>
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute z-30 mt-1 w-full bg-white border border-lavender-200 rounded-lg shadow-lg max-h-80 overflow-hidden flex flex-col"
            >
              <div className="p-2 border-b border-lavender-100 sticky top-0 bg-white z-10">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-2.5 text-gray-400" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search breeds..."
                    className="w-full pl-9 pr-4 py-2 rounded-md border border-lavender-200 focus:outline-none focus:ring-2 focus:ring-lavender-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
              <div className="overflow-y-auto max-h-60 p-2">
                {filteredBreeds.length > 0 ? (
                  filteredBreeds.map((breed) => (
                    <motion.button
                      key={breed}
                      type="button"
                      onClick={() => handleBreedSelect(breed)}
                      whileHover={{
                        backgroundColor: "rgba(124, 58, 237, 0.1)",
                      }}
                      className={`w-full text-left px-3 py-2.5 rounded-md text-sm transition-colors ${
                        value === breed
                          ? "bg-lavender-100 text-lavender-800 font-medium"
                          : "text-gray-700 hover:bg-lavender-50"
                      }`}
                    >
                      {breed}
                    </motion.button>
                  ))
                ) : (
                  <div className="px-3 py-2.5 text-sm text-gray-500 text-center">
                    No breeds found. Try a different search.
                  </div>
                )}
                <motion.button
                  key="Other"
                  type="button"
                  onClick={() => handleBreedSelect("Other")}
                  whileHover={{ backgroundColor: "rgba(124, 58, 237, 0.1)" }}
                  className={`w-full text-left px-3 py-2.5 rounded-md text-sm mt-2 border-t border-lavender-100 pt-3 ${
                    value === "Other"
                      ? "bg-lavender-100 text-lavender-800 font-medium"
                      : "text-gray-700 hover:bg-lavender-50"
                  }`}
                >
                  Other
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {isOtherSelected && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3"
          >
            <input
              type="text"
              value={otherValue || ""}
              onChange={(e) => onOtherChange(e)}
              placeholder="Specify breed"
              className="w-full px-4 py-2.5 rounded-lg border border-lavender-200 focus:outline-none focus:ring-2 focus:ring-lavender-500 focus:border-transparent text-gray-700"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BreedSelect;
