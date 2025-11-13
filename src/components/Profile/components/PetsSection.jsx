import React from "react";
import { motion } from "framer-motion";
import { FaPaw } from "react-icons/fa";
import EmptyState from "./EmptyState";
import { FiEdit, FiTrash2, FiEye } from "react-icons/fi";

import { Link } from "react-router-dom";

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

const PetsSection = ({ pets, onAddPet, onEditPet, onDeletePet, onToggleAvailability }) => {
  return (
    <motion.div
      key="pets"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      {pets.length > 0 ? (
        <div className="space-y-4 pb-4">
          {pets.map((pet, index) => (
            <motion.div
              key={pet.id}
              className="bg-white rounded-2xl overflow-hidden shadow-md border border-violet-100 relative hover:shadow-lg transition-all duration-300"
              whileHover={{ scale: 1.01, y: -2 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              {/* Pet Image Section */}
              <div className="relative">
                <div className="w-full h-48 bg-gradient-to-br from-violet-100 via-purple-100 to-indigo-100 flex items-center justify-center overflow-hidden">
                  {pet.image ? (
                    <img
                      src={pet.image}
                      alt={pet.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-white/40 backdrop-blur-sm flex items-center justify-center mb-2">
                        <FaPaw className="text-violet-400 text-2xl" />
                      </div>
                      <p className="text-violet-500 text-sm font-medium">No photo</p>
                    </div>
                  )}
                </div>
                
                {/* Availability Badges - Positioned on Image */}
                <div className="absolute top-2 right-2 flex flex-col gap-1.5">
                  {pet.availableForMating && (
                    <motion.span 
                      className="bg-violet-500/90 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-xs font-medium shadow-md flex items-center gap-1"
                      whileHover={{ scale: 1.05 }}
                    >
                      💕 Mating
                    </motion.span>
                  )}
                  {pet.availableForAdoption && (
                    <motion.span 
                      className="bg-violet-500/90 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-xs font-medium shadow-md flex items-center gap-1"
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

              {/* Pet Info Section */}
              <div className="p-4">
                <div className="mb-2">
                  <h3 className="text-lg font-bold text-slate-800 mb-0.5">
                    {pet.name}
                  </h3>
                  <div className="text-sm text-gray-600">
                    {pet.breed && <span className="font-medium">{pet.breed}</span>}
                    {pet.breed && (pet.gender || pet.age) && <span className="mx-1">•</span>}
                    {pet.gender && <span>{pet.gender}</span>}
                    {pet.gender && pet.age && <span className="mx-1">•</span>}
                    {pet.age && <span>{pet.age}</span>}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  {/* Quick Toggle Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => onToggleAvailability?.(pet, 'availableForMating')}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg font-medium transition-all duration-200 text-sm ${
                        pet.availableForMating
                          ? 'bg-violet-600 text-white hover:bg-violet-700'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <span>💕</span>
                      <span>Mating</span>
                    </button>
                    <button
                      onClick={() => onToggleAvailability?.(pet, 'availableForAdoption')}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg font-medium transition-all duration-200 text-sm ${
                        pet.availableForAdoption
                          ? 'bg-violet-600 text-white hover:bg-violet-700'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <span>🏠</span>
                      <span>Adoption</span>
                    </button>
                  </div>
                  
                  {/* Edit/View/Delete Actions */}
                  <div className="flex gap-2 pt-1 border-t border-gray-100">
                    <button
                      onClick={() => onEditPet(pet)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-violet-100 hover:bg-violet-200 text-violet-700 rounded-lg font-medium transition-all duration-200 text-sm"
                    >
                      <FiEdit className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                  <Link
                    to={`/pet-details/${pet.id}`}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-violet-100 hover:bg-violet-200 text-violet-700 rounded-lg font-medium transition-all duration-200 text-sm"
                  >
                    <FiEye className="w-3.5 h-3.5" />
                    <span>View</span>
                  </Link>
                  <button
                    onClick={() => onDeletePet?.(pet.id)}
                    className="flex items-center justify-center px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-medium transition-all duration-200"
                  >
                    <FiTrash2 className="w-3.5 h-3.5" />
                  </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<FaPaw className="w-8 h-8 text-violet-400" />}
          title="No Pets Added Yet"
          description="Add your pets to start managing their health and finding matches"
          buttonText="Add Your First Pet"
          onButtonClick={onAddPet}
        />
      )}
    </motion.div>
  );
};

export default PetsSection;