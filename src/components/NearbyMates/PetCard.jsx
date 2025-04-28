import React from "react";
import { motion } from "framer-motion";
import { FaPaw } from "react-icons/fa";
import { FiInfo, FiMapPin, FiHeart } from "react-icons/fi";

const PetCard = ({ pet, onRequestMating, onViewDetails }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-2xl shadow-md overflow-hidden border border-lavender-100 group"
    >
      <div className="relative h-48 bg-lavender-100">
        {pet.image ? (
          <img
            src={pet.image}
            alt={pet.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <FaPaw className="h-12 w-12 text-lavender-300" />
          </div>
        )}
        <div className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center">
          <FiMapPin className="mr-1 h-3 w-3" /> {pet.distance} km
        </div>
        <div
          className={`absolute top-3 left-3 text-xs px-2 py-1 rounded-full flex items-center ${
            pet.gender === "Female"
              ? "bg-pink-500 text-white"
              : "bg-blue-500 text-white"
          }`}
        >
          {pet.gender}
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-bold text-lavender-900 text-lg mb-1">{pet.name}</h3>
        <div className="space-y-1 mb-3">
          <div className="flex items-center text-sm text-gray-600">
            <span className="font-medium w-16">Breed:</span>
            <span>{pet.breed || "Unknown"}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <span className="font-medium w-16">Age:</span>
            <span>{pet.age || "Unknown"}</span>
          </div>
        </div>
        {pet.description && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-4">
            {pet.description}
          </p>
        )}
        <div className="flex space-x-2">
          <button
            onClick={onViewDetails}
            className="flex-1 py-2 px-3 bg-lavender-100 hover:bg-lavender-200 text-lavender-800 rounded-lg transition-colors text-sm font-medium flex items-center justify-center"
          >
            <FiInfo className="mr-1" /> Details
          </button>
          <button
            onClick={onRequestMating}
            className="flex-1 py-2 px-3 bg-gradient-to-r from-lavender-600 to-purple-600 hover:from-lavender-700 hover:to-purple-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center justify-center"
          >
            <FiHeart className="mr-1" /> Match
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default PetCard;
