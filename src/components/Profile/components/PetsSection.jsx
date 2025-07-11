import React from "react";
 import { motion } from "framer-motion";
import { FaPaw } from "react-icons/fa";
import EmptyState from "./EmptyState";
import { FiEdit, FiTrash2, FiEye } from "react-icons/fi";

import { Link } from "react-router-dom";

const PetsSection = ({ pets, onAddPet, onEditPet, onDeletePet }) => {
 

  return (
    <motion.div
      key="pets"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      {pets.length > 0 ? (
        <div className="space-y-4">
          {pets.map((pet, index) => (
            <motion.div
              key={pet.id}
              className="bg-white rounded-2xl overflow-hidden shadow-md border border-violet-100 relative"
              whileHover={{ scale: 1.02, y: -2 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex">
                <div className="w-24 h-24 bg-gradient-to-br from-violet-100 to-indigo-100 flex-shrink-0">
                  {pet.image ? (
                    <img
                      src={pet.image}
                      alt={pet.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FaPaw className="text-violet-400 text-xl" />
                    </div>
                  )}
                </div>
                <div className="flex-1 p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-slate-800 text-base">
                      {pet.name}
                    </h3>
                    <div className="flex gap-1 flex-wrap">
                      {pet.availableForMating && (
                        <span className="bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full text-xs font-medium">
                          💕 Mating
                        </span>
                      )}
                      {pet.availableForAdoption && (
                        <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium">
                          🏠 Adoption
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    {pet.breed} • {pet.gender} • {pet.age}
                  </div>
                  <div className=" mt-auto flex gap-2 items-center justify-end  border-gray-100">
                    <button
                      onClick={() => onEditPet(pet)}
                      className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                    >
                      <FiEdit className="w-4 h-4" />

                    </button>
                    <button
                      onClick={() => onDeletePet?.(pet.id)}
                      className="flex items-center gap-1 text-red-500 hover:text-red-700 text-sm font-medium"
                    >
                      <FiTrash2 className="w-4 h-4" />

                    </button>
                    <Link
                      to={`/pet-detail/${pet.id}`}
                      className="flex items-center gap-1 text-blue-500 hover:text-blue-700 text-sm font-medium"
                    >
                      <FiEye className="w-4 h-4" />

                    </Link>
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
