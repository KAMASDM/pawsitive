import React from "react";
import { motion } from "framer-motion";
import { FiEdit, FiTrash2, FiEye } from "react-icons/fi";
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

// Helper function to get vaccination status
const getVaccinationStatus = (vaccinations) => {
  if (!vaccinations || vaccinations.length === 0) {
    return { status: 'none', label: 'No vaccines', color: 'bg-gray-400/90' };
  }

  const today = new Date();
  const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
  
  let hasOverdue = false;
  let hasDueSoon = false;

  vaccinations.forEach(vac => {
    if (vac.nextDue) {
      const nextDueDate = new Date(vac.nextDue);
      if (nextDueDate < today) {
        hasOverdue = true;
      } else if (nextDueDate <= thirtyDaysFromNow) {
        hasDueSoon = true;
      }
    }
  });

  if (hasOverdue) {
    return { status: 'overdue', label: '🚨 Overdue', color: 'bg-red-500/90' };
  } else if (hasDueSoon) {
    return { status: 'due-soon', label: '⚠️ Due Soon', color: 'bg-amber-500/90' };
  } else {
    return { status: 'up-to-date', label: '✓ Up to Date', color: 'bg-green-500/90' };
  }
};

const DesktopPetsSection = ({ pets, onAddPet, onEditPet, onDeletePet, onToggleAvailability }) => (
  <motion.div
    key="pets"
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    transition={{ duration: 0.3 }}
  >
    {pets.length > 0 ? (
      <>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">My Pets</h2>
            <p className="text-gray-600 text-sm mt-1">Manage your pet profiles</p>
          </div>
          <button
            onClick={onAddPet}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg inline-flex items-center gap-2 transition-colors shadow-md hover:shadow-lg"
          >
            <FaPaw className="w-4 h-4" />
            Add Pet
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-8">
        {pets.map((pet, index) => (
          <motion.div
            key={pet.id}
            className="bg-white rounded-2xl overflow-hidden shadow-md border border-violet-100 flex flex-col hover:shadow-lg transition-all duration-300"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4, scale: 1.01 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="relative h-48 bg-gradient-to-br from-violet-100 via-purple-100 to-indigo-100">
              {pet.image ? (
                <img
                  src={pet.image}
                  alt={pet.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-white/40 backdrop-blur-sm flex items-center justify-center mb-2">
                    <FaPaw className="text-violet-400 text-2xl" />
                  </div>
                  <p className="text-violet-500 text-sm font-medium">No photo</p>
                </div>
              )}
              <div className="absolute top-2 right-2 flex flex-col gap-1.5">
                {pet.availableForMating && (
                  <motion.span 
                    className="bg-violet-500/90 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-xs font-medium shadow-md"
                    whileHover={{ scale: 1.05 }}
                  >
                    💕 Mating
                  </motion.span>
                )}
                {pet.availableForAdoption && (
                  <motion.span 
                    className="bg-violet-500/90 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-xs font-medium shadow-md"
                    whileHover={{ scale: 1.05 }}
                  >
                    🏠 Adoption
                  </motion.span>
                )}
              </div>

              {/* Vaccination Status Badge - Bottom Left */}
              {(() => {
                const vacStatus = getVaccinationStatus(pet.vaccinations);
                return (
                  <div className="absolute bottom-2 left-2">
                    <motion.span 
                      className={`${vacStatus.color} backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-xs font-medium shadow-md`}
                      whileHover={{ scale: 1.05 }}
                    >
                      {vacStatus.label}
                    </motion.span>
                  </div>
                );
              })()}
            </div>
            <div className="p-6 flex-1 flex flex-col">
              <h3 className="text-xl font-bold text-slate-800 mb-3">{pet.name}</h3>
              <div className="space-y-2 mb-4">
                {pet.breed && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <FaDog className="text-violet-500 w-4 h-4 flex-shrink-0" />
                    <span className="text-sm">{pet.breed}</span>
                  </div>
                )}
                {pet.gender && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <FaVenusMars className="text-pink-500 w-4 h-4 flex-shrink-0" />
                    <span className="text-sm">{pet.gender}</span>
                  </div>
                )}
                {pet.age && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <FaBirthdayCake className="text-yellow-500 w-4 h-4 flex-shrink-0" />
                    <span className="text-sm">{pet.age}</span>
                  </div>
                )}
              </div>
              {pet.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{pet.description}</p>
              )}
              <div className="flex items-center gap-4 text-xs text-gray-500 mb-4 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-1">
                  <FaSyringe className="w-3 h-3" />
                  <span>{pet.vaccinations?.length || 0} vaccines</span>
                </div>
                <div className="flex items-center gap-1">
                  <FaMedkit className="w-3 h-3" />
                  <span>{pet.medical?.conditions?.length || 0} conditions</span>
                </div>
              </div>
              
              {/* Quick Toggle Actions */}
              <div className="grid grid-cols-2 gap-2 mt-3">
                <motion.button
                  onClick={() => onToggleAvailability?.(pet, 'availableForMating')}
                  className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg font-medium transition-all duration-200 text-sm ${
                    pet.availableForMating
                      ? 'bg-violet-600 text-white hover:bg-violet-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span>💕</span>
                  <span>Mating</span>
                </motion.button>
                <motion.button
                  onClick={() => onToggleAvailability?.(pet, 'availableForAdoption')}
                  className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg font-medium transition-all duration-200 text-sm ${
                    pet.availableForAdoption
                      ? 'bg-violet-600 text-white hover:bg-violet-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span>🏠</span>
                  <span>Adoption</span>
                </motion.button>
              </div>
              
              <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-gray-100">
                <motion.button
                  onClick={() => onEditPet(pet)}
                  className="flex items-center justify-center gap-1 px-3 py-2.5 bg-violet-100 hover:bg-violet-200 text-violet-700 rounded-lg font-medium transition-all duration-200 text-sm"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FiEdit className="w-4 h-4" />
                  <span>Edit</span>
                </motion.button>
                <Link
                  to={`/pet-details/${pet.id}`}
                  className="flex items-center justify-center gap-1 px-3 py-2.5 bg-violet-100 hover:bg-violet-200 text-violet-700 rounded-lg font-medium transition-all duration-200 text-sm"
                >
                  <FiEye className="w-4 h-4" />
                  <span>View</span>
                </Link>
                <motion.button
                  onClick={() => onDeletePet?.(pet.id)}
                  className="flex items-center justify-center px-3 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-medium transition-all duration-200"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FiTrash2 className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      </>
    ) : (
      <EmptyState
        icon={<FaPaw className="w-12 h-12 text-violet-400" />}
        title="No Pets Added Yet"
        description="Add your pets to start managing their health and finding matches"
        buttonText="Add Your First Pet"
        onButtonClick={onAddPet}
      />
    )}
  </motion.div>
);

export default DesktopPetsSection;
