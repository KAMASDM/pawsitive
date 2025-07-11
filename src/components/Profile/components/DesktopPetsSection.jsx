import React from "react";
import { motion } from "framer-motion";
import { FiPlus, FiEdit, FiTrash2, FiEye } from "react-icons/fi";
import {
  FaPaw,
  FaMedkit,
  FaSyringe,
  FaVenusMars,
  FaBirthdayCake,
  FaDog,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import EmptyState from "./EmptyState";

const DesktopPetsSection = ({ pets, onAddPet, onEditPet, onDeletePet }) => (
  <motion.div
    key="pets"
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    transition={{ duration: 0.3 }}
  >
    {pets.length > 0 ? (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pets.map((pet, index) => (
          <motion.div
            key={pet.id}
            className="bg-white rounded-2xl overflow-hidden shadow-lg border border-violet-100 flex flex-col justify-between"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="cursor-pointer">
              <div className="h-48 bg-gradient-to-br from-violet-100 to-indigo-100 relative">
                {pet.image ? (
                  <img
                    src={pet.image}
                    alt={pet.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FaPaw className="text-violet-400 text-3xl" />
                  </div>
                )}

                {/* Status badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                  {pet.availableForMating && (
                    <span className="bg-pink-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                      💕 Mating
                    </span>
                  )}
                  {pet.availableForAdoption && (
                    <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                      🏠 Adoption
                    </span>
                  )}
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-xl font-bold text-slate-800 mb-2">
                  {pet.name}
                </h3>

                {/* Pet Info with Icons */}
                <div className="text-gray-600 mb-3 space-y-1">
                  <div className="flex items-center gap-2">
                    <FaDog className="text-violet-500 w-4 h-4" />
                    <span>{pet.breed}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaVenusMars className="text-pink-500 w-4 h-4" />
                    <span>{pet.gender}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaBirthdayCake className="text-yellow-500 w-4 h-4" />
                    <span>{pet.age}</span>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {pet.description}
                </p>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center text-gray-500">
                    <FaSyringe className="w-4 h-4 mr-1" />
                    {pet.vaccinations?.length || 0} vaccines
                  </div>
                  <div className="flex items-center text-gray-500">
                    <FaMedkit className="w-4 h-4 mr-1" />
                    {pet.medical?.conditions?.length || 0} conditions
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons with icons */}
            <div className="px-6 pb-4 pt-2 mt-auto flex justify-between items-center border-t border-gray-100">
              <button
                onClick={() => onEditPet(pet)}
                className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 text-sm font-medium"
              >
                <FiEdit className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={() => onDeletePet?.(pet.id)}
                className="flex items-center gap-1 text-red-500 hover:text-red-700 text-sm font-medium"
              >
                <FiTrash2 className="w-4 h-4" />
                Delete
              </button>
              <Link
                to={`/pet-detail/${pet.id}`}
                className="flex items-center gap-1 text-blue-500 hover:text-blue-700 text-sm font-medium"
              >
                <FiEye className="w-4 h-4" />
                View
              </Link>
            </div>
          </motion.div>
        ))}

        {/* Add Pet Card */}
        <motion.button
          onClick={onAddPet}
          className="bg-gradient-to-br from-violet-100 to-indigo-100 border-2 border-dashed border-violet-300 rounded-2xl p-8 text-center hover:from-violet-200 hover:to-indigo-200 transition-all duration-300 flex flex-col items-center justify-center min-h-[320px]"
          whileHover={{ scale: 1.05, y: -5 }}
          whileTap={{ scale: 0.95 }}
        >
          <FiPlus className="w-12 h-12 text-violet-600 mb-4" />
          <span className="text-violet-700 font-medium text-lg">
            Add New Pet
          </span>
        </motion.button>
      </div>
    ) : (
      <EmptyState
        icon={<FaPaw className="w-12 h-12 text-violet-400" />}
        title="No Pets Added Yet"
        description="Add your pets to start managing their health and finding matches"
        buttonText="Add Your First Pet"
        onButtonClick={onAddPet}
        large
      />
    )}
  </motion.div>
);

export default DesktopPetsSection;
