// src/components/Profile/components/PetCard.jsx
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FiEdit2, 
  FiTrash2, 
  FiHeart, 
  FiCalendar, 
  FiAlertCircle,
  FiCheck,
  FiChevronDown,
  FiPlus
} from "react-icons/fi";
import { FaPaw, FaSyringe, FaMedkit } from "react-icons/fa";

const PetCard = ({ pet, onEdit, onDelete }) => {
  const [showVaccinations, setShowVaccinations] = useState(false);
  const [showMedical, setShowMedical] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";

    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Check if vaccination is due soon or overdue
  const getVaccinationStatus = (nextDue) => {
    if (!nextDue) return "unknown";

    const dueDate = new Date(nextDue);
    const now = new Date();
    const oneMonthFromNow = new Date();
    oneMonthFromNow.setMonth(now.getMonth() + 1);

    if (dueDate < now) return "overdue";
    if (dueDate <= oneMonthFromNow) return "due-soon";
    return "up-to-date";
  };

  // Get appropriate background color based on pet type
  const getPetTypeBackground = () => {
    if (!pet.type) return "bg-gradient-to-br from-gray-100 to-gray-200";
    
    switch(pet.type.toLowerCase()) {
      case 'dog':
        return "bg-gradient-to-br from-blue-50 to-lavender-100";
      case 'cat':
        return "bg-gradient-to-br from-yellow-50 to-lavender-100";
      case 'bird':
        return "bg-gradient-to-br from-teal-50 to-lavender-100";
      case 'fish':
        return "bg-gradient-to-br from-cyan-50 to-lavender-100";
      default:
        return "bg-gradient-to-br from-lavender-50 to-lavender-100";
    }
  };

  // Handle delete confirmation
  const handleDeleteClick = () => {
    if (deleteConfirm) {
      onDelete(pet.id);
      setDeleteConfirm(false);
    } else {
      setDeleteConfirm(true);
      
      // Auto-reset confirm state after 5 seconds
      setTimeout(() => {
        setDeleteConfirm(false);
      }, 5000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-2xl shadow-md border border-lavender-100 overflow-hidden"
    >
      {/* Pet Header */}
      <div className="relative">
        {/* Pet Image or Placeholder */}
        <div className={`h-48 sm:h-52 ${getPetTypeBackground()}`}>
          {pet.image ? (
            <img 
              src={pet.image} 
              alt={pet.name} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="bg-white bg-opacity-50 rounded-full p-4">
                <FaPaw className="w-12 h-12 text-lavender-400" />
              </div>
            </div>
          )}
        </div>
        
        {/* Availability Badge */}
        {(pet.availableForMating || pet.availableForAdoption) && (
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {pet.availableForMating && (
              <div className="px-3 py-1 bg-pink-500 text-white text-xs rounded-full font-medium shadow-sm flex items-center">
                <FiHeart className="mr-1" /> Mating
              </div>
            )}
            {pet.availableForAdoption && (
              <div className="px-3 py-1 bg-green-500 text-white text-xs rounded-full font-medium shadow-sm flex items-center">
                <FaPaw className="mr-1" /> Adoption
              </div>
            )}
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="absolute top-3 right-3 flex gap-2">
          <motion.button 
            onClick={() => onEdit(pet)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="bg-white/90 hover:bg-white p-1.5 rounded-full shadow-sm text-lavender-700 hover:text-lavender-900 transition-colors"
          >
            <FiEdit2 className="w-4 h-4" />
          </motion.button>
          
          <motion.button
            onClick={handleDeleteClick}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className={`p-1.5 rounded-full shadow-sm transition-colors ${
              deleteConfirm 
                ? 'bg-red-500 text-white' 
                : 'bg-white/90 hover:bg-white text-red-500 hover:text-red-700'
            }`}
          >
            <FiTrash2 className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
      
      {/* Pet Info */}
      <div className="px-5 pt-5 pb-2">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xl font-bold text-lavender-900">{pet.name}</h3>
          <div className="flex items-center text-xs rounded-full bg-lavender-100 px-2 py-0.5 text-lavender-800">
            <FaPaw className="mr-1" /> 
            {pet.type ? pet.type.charAt(0).toUpperCase() + pet.type.slice(1) : 'Pet'}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4">
          {pet.breed && (
            <div>
              <div className="text-xs text-gray-500">Breed</div>
              <div className="text-sm text-gray-800 font-medium">{pet.breed}</div>
            </div>
          )}
          
          {pet.gender && (
            <div>
              <div className="text-xs text-gray-500">Gender</div>
              <div className="text-sm text-gray-800 font-medium">{pet.gender}</div>
            </div>
          )}
          
          {pet.age && (
            <div>
              <div className="text-xs text-gray-500">Age</div>
              <div className="text-sm text-gray-800 font-medium">{pet.age}</div>
            </div>
          )}
          
          {pet.weight && (
            <div>
              <div className="text-xs text-gray-500">Weight</div>
              <div className="text-sm text-gray-800 font-medium">{pet.weight}</div>
            </div>
          )}
        </div>
        
        {pet.description && (
          <div className="mb-4">
            <div className="text-xs text-gray-500 mb-1">Description</div>
            <p className="text-sm text-gray-800">{pet.description}</p>
          </div>
        )}
      </div>
      
      {/* Medical Information */}
      <div className="px-5 py-2">
        <button 
          className="w-full flex items-center justify-between py-2 text-left text-lavender-900 hover:text-lavender-700 transition-colors focus:outline-none"
          onClick={() => setShowMedical(!showMedical)}
        >
          <div className="flex items-center">
            <FaMedkit className="w-4 h-4 mr-2 text-lavender-600" />
            <span className="font-medium">Medical Information</span>
          </div>
          <motion.div
            animate={{ rotate: showMedical ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <FiChevronDown />
          </motion.div>
        </button>
        
        <AnimatePresence>
          {showMedical && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="pt-2 pb-4">
                <div className="bg-lavender-50 rounded-lg p-4 text-sm text-gray-700">
                  {(pet.medical?.conditions?.length > 0 || pet.medical?.allergies?.length > 0 || pet.medical?.medications) ? (
                    <>
                      {pet.medical?.conditions?.length > 0 && (
                        <div className="mb-3">
                          <div className="font-medium text-lavender-900 mb-1">Conditions</div>
                          <div className="flex flex-wrap gap-1">
                            {pet.medical.conditions.map(condition => (
                              <span key={condition} className="bg-white px-2 py-0.5 rounded text-xs">
                                {condition}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {pet.medical?.allergies?.length > 0 && (
                        <div className="mb-3">
                          <div className="font-medium text-lavender-900 mb-1">Allergies</div>
                          <div className="flex flex-wrap gap-1">
                            {pet.medical.allergies.map(allergy => (
                              <span key={allergy} className="bg-white px-2 py-0.5 rounded text-xs">
                                {allergy}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {pet.medical?.medications && (
                        <div>
                          <div className="font-medium text-lavender-900 mb-1">Medications</div>
                          <p>{pet.medical.medications}</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-2 text-gray-500 italic">
                      No medical information provided
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Vaccinations */}
      <div className="px-5 py-2">
        <button 
          className="w-full flex items-center justify-between py-2 text-left text-lavender-900 hover:text-lavender-700 transition-colors focus:outline-none"
          onClick={() => setShowVaccinations(!showVaccinations)}
        >
          <div className="flex items-center">
            <FaSyringe className="w-4 h-4 mr-2 text-lavender-600" />
            <span className="font-medium">Vaccination Records</span>
            
            {pet.vaccinations && pet.vaccinations.length > 0 && (
              <span className="ml-2 bg-lavender-100 text-lavender-800 text-xs px-2 py-0.5 rounded-full">
                {pet.vaccinations.length}
              </span>
            )}
          </div>
          <motion.div
            animate={{ rotate: showVaccinations ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <FiChevronDown />
          </motion.div>
        </button>
        
        <AnimatePresence>
          {showVaccinations && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="pt-2 pb-4">
                {pet.vaccinations && pet.vaccinations.length > 0 ? (
                  <div className="space-y-3">
                    {pet.vaccinations.map((vaccination, index) => {
                      const status = getVaccinationStatus(vaccination.nextDue);
                      return (
                        <div 
                          key={index} 
                          className="bg-white border border-lavender-100 rounded-lg p-3 shadow-sm"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-lavender-900">
                              {vaccination.name}
                            </h4>
                            
                            {status !== 'unknown' && (
                              <div className={`text-xs px-2 py-0.5 rounded-full flex items-center ${
                                status === 'overdue' 
                                  ? 'bg-red-100 text-red-800' 
                                  : status === 'due-soon' 
                                  ? 'bg-yellow-100 text-yellow-800' 
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {status === 'overdue' ? (
                                  <>
                                    <FiAlertCircle className="mr-1" /> Overdue
                                  </>
                                ) : status === 'due-soon' ? (
                                  <>
                                    <FiCalendar className="mr-1" /> Due Soon
                                  </>
                                ) : (
                                  <>
                                    <FiCheck className="mr-1" /> Up to Date
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <div className="text-xs text-gray-500">Date</div>
                              <div>{formatDate(vaccination.date)}</div>
                            </div>
                            
                            {vaccination.nextDue && (
                              <div>
                                <div className="text-xs text-gray-500">Next Due</div>
                                <div>{formatDate(vaccination.nextDue)}</div>
                              </div>
                            )}
                          </div>
                          
                          {vaccination.notes && (
                            <div className="mt-2 text-xs text-gray-600 border-t border-lavender-50 pt-2">
                              {vaccination.notes}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-lavender-50 rounded-lg p-4 text-center">
                    <p className="text-sm text-gray-600 mb-3">
                      No vaccination records available
                    </p>
                    <button
                      onClick={() => onEdit(pet, 'vaccinations')}
                      className="text-xs bg-lavender-600 text-white px-3 py-1.5 rounded-full inline-flex items-center"
                    >
                      <FiPlus className="mr-1" /> Add Vaccination
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Card Footer */}
      <div className="px-5 py-4 border-t border-lavender-100 flex justify-between items-center bg-gradient-to-r from-lavender-50 to-white">
        <div className="flex items-center">
          <label className="inline-flex items-center cursor-pointer">
            <span className="mr-2 text-sm text-lavender-900">Mating</span>
            <div className="relative">
              <input
                type="checkbox"
                className="sr-only"
                checked={pet.availableForMating || false}
                onChange={(e) => onEdit({ ...pet, availableForMating: e.target.checked })}
              />
              <div className={`w-10 h-5 rounded-full transition-colors ${pet.availableForMating ? 'bg-pink-500' : 'bg-gray-300'}`}></div>
              <div className={`absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform ${pet.availableForMating ? 'translate-x-5' : ''}`}></div>
            </div>
          </label>
        </div>
        
        <button
          onClick={() => onEdit(pet)}
          className="flex items-center bg-lavender-600 hover:bg-lavender-700 text-white text-sm px-3 py-1.5 rounded-lg transition-colors shadow-sm"
        >
          <FiEdit2 className="mr-1" /> Edit
        </button>
      </div>
    </motion.div>
  );
};

export default PetCard;