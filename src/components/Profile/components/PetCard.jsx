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
  FiPlus,
} from "react-icons/fi";
import { FaPaw, FaSyringe, FaMedkit } from "react-icons/fa";

const PetCard = ({ pet, onEdit, onDelete }) => {
  const [showVaccinations, setShowVaccinations] = useState(false);
  const [showMedical, setShowMedical] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";

    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

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

  const getPetTypeBackground = () => {
    if (!pet.type) return "bg-gradient-to-br from-gray-100 to-gray-200";

    switch (pet.type.toLowerCase()) {
      case "dog":
        return "bg-gradient-to-br from-blue-50 to-lavender-100";
      case "cat":
        return "bg-gradient-to-br from-yellow-50 to-lavender-100";
      case "bird":
        return "bg-gradient-to-br from-teal-50 to-lavender-100";
      case "fish":
        return "bg-gradient-to-br from-cyan-50 to-lavender-100";
      default:
        return "bg-gradient-to-br from-lavender-50 to-lavender-100";
    }
  };

  const handleDeleteClick = async () => {
    if (deleteConfirm) {
      setIsDeleting(true);
      try {
        await onDelete(pet.id);
      } finally {
        setIsDeleting(false);
        setDeleteConfirm(false);
      }
    } else {
      setDeleteConfirm(true);

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
      className="bg-white rounded-2xl shadow-md border border-lavender-100 overflow-hidden flex flex-col relative"
    >
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black bg-opacity-70 z-20 flex flex-col items-center justify-center p-6"
          >
            <div className="bg-white rounded-xl p-6 w-full max-w-xs">
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Delete {pet.name}?
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this pet? This action cannot be
                undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setDeleteConfirm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteClick}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center justify-center"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Deleting...
                    </>
                  ) : (
                    "Delete"
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="relative">
        <div className={`h-48 sm:h-52 ${getPetTypeBackground()} w-full`}>
          {pet.image ? (
            <img
              src={pet.image}
              alt={pet.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <div className="bg-white bg-opacity-70 rounded-full p-4 shadow-inner">
                <FaPaw className="w-12 h-12 text-lavender-400" />
              </div>
            </div>
          )}
        </div>
        {(pet.availableForMating || pet.availableForAdoption) && (
          <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
            {pet.availableForMating && (
              <div className="px-3 py-1 bg-pink-500 text-white text-xs rounded-full font-medium shadow-sm flex items-center whitespace-nowrap">
                <FiHeart className="mr-1 flex-shrink-0" /> Mating
              </div>
            )}
            {pet.availableForAdoption && (
              <div className="px-3 py-1 bg-green-500 text-white text-xs rounded-full font-medium shadow-sm flex items-center whitespace-nowrap">
                <FaPaw className="mr-1 flex-shrink-0" /> Adoption
              </div>
            )}
          </div>
        )}
        <div className="absolute top-3 right-3 flex gap-2 z-10">
          <motion.button
            onClick={() => onEdit(pet)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="bg-white/90 hover:bg-white p-1.5 rounded-full shadow-sm text-lavender-700 hover:text-lavender-900 transition-colors"
            aria-label={`Edit ${pet.name}`}
            disabled={isDeleting}
          >
            <FiEdit2 className="w-4 h-4" />
          </motion.button>
          <motion.button
            onClick={handleDeleteClick}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className={`p-1.5 rounded-full shadow-sm transition-colors ${
              deleteConfirm
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-white/90 hover:bg-white text-red-500 hover:text-red-700"
            }`}
            aria-label={
              deleteConfirm
                ? `Confirm delete ${pet.name}`
                : `Delete ${pet.name}`
            }
            disabled={isDeleting}
          >
            <FiTrash2 className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      <div className="px-5 pt-5 pb-2 flex-grow">
        <div className="flex items-center justify-between mb-3 gap-2">
          <h3 className="text-xl font-bold text-lavender-900 truncate">
            {pet.name}
          </h3>
          <div className="flex-shrink-0 flex items-center text-xs rounded-full bg-lavender-100 px-2 py-0.5 text-lavender-800 whitespace-nowrap">
            <FaPaw className="mr-1 flex-shrink-0" />
            {pet.type
              ? pet.type.charAt(0).toUpperCase() + pet.type.slice(1)
              : "Pet"}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4">
          {pet.breed && (
            <div>
              <div className="text-xs text-gray-500">Breed</div>
              <div className="text-sm text-gray-800 font-medium truncate">
                {pet.breed}
              </div>
            </div>
          )}
          {pet.gender && (
            <div>
              <div className="text-xs text-gray-500">Gender</div>
              <div className="text-sm text-gray-800 font-medium">
                {pet.gender}
              </div>
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
              <div className="text-sm text-gray-800 font-medium">
                {pet.weight}
              </div>
            </div>
          )}
        </div>

        {pet.description && (
          <div className="mb-4">
            <div className="text-xs text-gray-500 mb-1">Description</div>
            <p className="text-sm text-gray-800 line-clamp-3">
              {pet.description}
            </p>
          </div>
        )}
      </div>

      <div className="mt-auto">
        <div className="px-5 py-2 border-t border-lavender-100">
          <button
            className="w-full flex items-center justify-between py-2 text-left text-lavender-900 hover:text-lavender-700 transition-colors focus:outline-none"
            onClick={() => setShowMedical(!showMedical)}
            aria-expanded={showMedical}
          >
            <div className="flex items-center">
              <FaMedkit className="w-4 h-4 mr-2 text-lavender-600 flex-shrink-0" />
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
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="pt-2 pb-4">
                  <div className="bg-lavender-50 rounded-lg p-4 text-sm text-gray-700">
                    {pet.medical?.conditions?.length > 0 ||
                      pet.medical?.allergies?.length > 0 ||
                      pet.medical?.medications ? (
                      <>
                        {pet.medical?.conditions?.length > 0 && (
                          <div className="mb-3 last:mb-0">
                            <div className="font-medium text-lavender-900 mb-1">
                              Conditions
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {pet.medical.conditions.map((condition) => (
                                <span
                                  key={condition}
                                  className="bg-white px-2 py-0.5 rounded text-xs border border-lavender-200"
                                >
                                  {condition}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {pet.medical?.allergies?.length > 0 && (
                          <div className="mb-3 last:mb-0">
                            <div className="font-medium text-lavender-900 mb-1">
                              Allergies
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {pet.medical.allergies.map((allergy) => (
                                <span
                                  key={allergy}
                                  className="bg-white px-2 py-0.5 rounded text-xs border border-lavender-200"
                                >
                                  {allergy}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {pet.medical?.medications && (
                          <div className="last:mb-0">
                            <div className="font-medium text-lavender-900 mb-1">
                              Medications
                            </div>
                            <p className="break-words">
                              {pet.medical.medications}
                            </p>
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

        <div className="px-5 py-2 border-t border-lavender-100">
          <button
            className="w-full flex items-center justify-between py-2 text-left text-lavender-900 hover:text-lavender-700 transition-colors focus:outline-none"
            onClick={() => setShowVaccinations(!showVaccinations)}
            aria-expanded={showVaccinations}
          >
            <div className="flex items-center">
              <FaSyringe className="w-4 h-4 mr-2 text-lavender-600 flex-shrink-0" />
              <span className="font-medium">Vaccination Records</span>
              {pet.vaccinations && pet.vaccinations.length > 0 && (
                <span className="ml-2 bg-lavender-100 text-lavender-800 text-xs px-2 py-0.5 rounded-full flex-shrink-0">
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
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="pt-2 pb-4">
                  {pet.vaccinations && pet.vaccinations.length > 0 ? (
                    <div className="space-y-3">
                      {pet.vaccinations.map((vaccination, index) => {
                        const status = getVaccinationStatus(
                          vaccination.nextDue
                        );
                        return (
                          <div
                            key={index}
                            className="bg-white border border-lavender-100 rounded-lg p-3 shadow-sm"
                          >
                            <div className="flex justify-between items-start mb-2 gap-2">
                              <h4 className="font-medium text-lavender-900 flex-grow break-words">
                                {vaccination.name}
                              </h4>
                              {status !== "unknown" && (
                                <div
                                  className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full flex items-center whitespace-nowrap ${status === "overdue"
                                      ? "bg-red-100 text-red-800"
                                      : status === "due-soon"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : "bg-green-100 text-green-800"
                                    }`}
                                >
                                  {status === "overdue" ? (
                                    <>
                                      <FiAlertCircle className="mr-1 flex-shrink-0" />{" "}
                                      Overdue
                                    </>
                                  ) : status === "due-soon" ? (
                                    <>
                                      <FiCalendar className="mr-1 flex-shrink-0" />{" "}
                                      Due Soon
                                    </>
                                  ) : (
                                    <>
                                      <FiCheck className="mr-1 flex-shrink-0" />{" "}
                                      Up to Date
                                    </>
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                              <div>
                                <div className="text-xs text-gray-500">
                                  Date
                                </div>
                                <div className="text-gray-800">
                                  {formatDate(vaccination.date)}
                                </div>
                              </div>
                              {vaccination.nextDue && (
                                <div>
                                  <div className="text-xs text-gray-500">
                                    Next Due
                                  </div>
                                  <div className="text-gray-800">
                                    {formatDate(vaccination.nextDue)}
                                  </div>
                                </div>
                              )}
                            </div>
                            {vaccination.notes && (
                              <div className="mt-2 text-xs text-gray-600 border-t border-lavender-100 pt-2 break-words">
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
                        onClick={() => onEdit(pet, "vaccinations")}
                        className="text-xs bg-lavender-600 hover:bg-lavender-700 text-white px-3 py-1.5 rounded-full inline-flex items-center transition-colors"
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
      </div>

      <div className="px-5 py-4 border-t border-lavender-100 flex justify-between items-center bg-gradient-to-r from-lavender-50 to-white">
        <div className="flex items-center">
          <label className="inline-flex items-center cursor-pointer">
            <span className="mr-2 text-sm text-lavender-900">Mating</span>
            <div className="relative">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={pet.availableForMating || false}
                onChange={(e) =>
                  onEdit({ ...pet, availableForMating: e.target.checked })
                }
              />
              <div
                className={`w-10 h-5 rounded-full transition-colors ${pet.availableForMating
                    ? "bg-pink-500 peer-checked:bg-pink-500"
                    : "bg-gray-300"
                  } peer-focus:ring-2 peer-focus:ring-pink-300`}
              ></div>
              <div
                className={`absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform transform ${pet.availableForMating
                    ? "translate-x-5 peer-checked:translate-x-5"
                    : "translate-x-0"
                  }`}
              ></div>
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
