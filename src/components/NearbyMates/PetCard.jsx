import React from "react";
import { motion } from "framer-motion";
import { FaPaw } from "react-icons/fa";
import { FiInfo, FiMapPin, FiClock, FiTag } from "react-icons/fi";
import { BiMale, BiFemale } from "react-icons/bi";

const PetCard = ({ pet, onViewDetails }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 group flex flex-col h-full"
    >
      <div className="relative h-48 flex-shrink-0">
        {pet.image ? (
          <img
            src={pet.image}
            alt={pet.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-gray-50">
            <FaPaw className="h-12 w-12 text-lavender-300" />
          </div>
        )}
        <div className="absolute top-3 left-3 flex items-center text-xs font-semibold px-2 py-1 rounded-full text-white">
          {pet.gender === "Female" ? (
            <>
              <BiFemale className="mr-1 h-4 w-4 text-pink-400" />
              <span className="bg-pink-400 rounded-full px-1 py-0.5">
                {pet.gender}
              </span>
            </>
          ) : (
            <>
              <BiMale className="mr-1 h-4 w-4 text-blue-400" />
              <span className="bg-blue-400 rounded-full px-1 py-0.5">
                Male
              </span>
            </>
          )}
        </div>
        {pet.distance && (
          <div className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center">
            <FiMapPin className="mr-1 h-3 w-3 text-lime-300" /> {pet.distance}{" "}
            km
          </div>
        )}
      </div>

      <div className="flex flex-col justify-between flex-1 p-4">
        <div>
          <div className="mb-3">
            <h3 className="font-semibold text-gray-900 text-xl line-clamp-1">
              {pet.name}
            </h3>
            <p className="text-sm italic text-gray-500">
              {pet.breed || "Unknown"}
            </p>
          </div>

          <div className="space-y-2 mb-3">
            <div className="flex items-center text-sm text-gray-600">
              <FiClock className="mr-2 h-4 w-4 text-orange-400" />
              Age:
              <span className="font-medium ml-1">
                {pet.age} years
              </span>
            </div>
            {pet.color && (
              <div className="flex items-center text-sm text-gray-600">
                <FiTag className="mr-2 h-4 w-4 text-purple-400" />
                Color:
                <span className="font-medium ml-1">
                  {pet.color.trim() || "N/A"}
                </span>
              </div>
            )}
          </div>

          {pet.description && (
            <p className="text-sm text-gray-700 line-clamp-2 mb-4 min-h-[40px]">
              {pet.description}
            </p>
          )}
        </div>

        <div className="mt-auto">
          <button
            onClick={onViewDetails}
            className="w-full py-2 px-3 bg-lavender-200 hover:bg-lavender-300 text-lavender-800 rounded-md transition-colors text-sm font-medium flex items-center justify-center"
          >
            <FiInfo className="mr-2" /> View Details
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default PetCard;
