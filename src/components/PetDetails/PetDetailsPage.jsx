import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ref, get } from 'firebase/database';
import { onAuthStateChanged } from 'firebase/auth';
import { database, auth } from '../../firebase';
import {
  FiArrowLeft,
  FiEdit,
  FiActivity,
  FiHeart,
  FiAlertCircle,
} from 'react-icons/fi';
import {
  FaPaw,
  FaSyringe,
  FaPills,
  FaNotesMedical,
  FaBirthdayCake,
  FaWeight,
  FaPalette,
  FaVenusMars,
} from 'react-icons/fa';
import { motion } from 'framer-motion';

const PetDetailsPage = () => {
  const { petId } = useParams();
  const navigate = useNavigate();
  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Listen to auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Load pet data
  useEffect(() => {
    if (authLoading) return;

    const loadPetData = async () => {
      if (!currentUser) {
        navigate('/login');
        return;
      }

      try {
        setLoading(true);
        
        // First, try to load from current user's pets
        const petRef = ref(database, `userPets/${currentUser.uid}/${petId}`);
        const petSnapshot = await get(petRef);

        if (petSnapshot.exists()) {
          const petData = { id: petSnapshot.key, ...petSnapshot.val() };
          setPet(petData);
        } else {
          // Pet not found or user doesn't have access
          navigate('/profile');
        }
      } catch (error) {
        console.error('Error loading pet details:', error);
        navigate('/profile');
      } finally {
        setLoading(false);
      }
    };

    loadPetData();
  }, [petId, currentUser, authLoading, navigate]);

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return 'Unknown';
    
    const birth = new Date(dateOfBirth);
    const now = new Date();
    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();
    
    if (months < 0) {
      years--;
      months += 12;
    }
    
    if (years > 0) {
      return `${years} year${years > 1 ? 's' : ''}${months > 0 ? ` ${months} month${months > 1 ? 's' : ''}` : ''}`;
    } else {
      return `${months} month${months > 1 ? 's' : ''}`;
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FaPaw className="w-12 h-12 text-violet-600 animate-bounce mx-auto mb-4" />
          <p className="text-gray-600">Loading pet details...</p>
        </div>
      </div>
    );
  }

  if (!pet) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/profile')}
                className="flex items-center text-gray-600 hover:text-violet-600 transition-colors"
              >
                <FiArrowLeft className="w-5 h-5 mr-2" />
                <span className="font-medium">Back to Profile</span>
              </button>
              <div className="hidden md:flex items-center text-sm text-gray-500">
                <button onClick={() => navigate('/')} className="hover:text-violet-600">Home</button>
                <span className="mx-2">/</span>
                <button onClick={() => navigate('/profile')} className="hover:text-violet-600">Profile</button>
                <span className="mx-2">/</span>
                <span className="text-gray-900 font-medium">{pet.name}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate(`/pet/${pet.slug}`)}
                className="flex items-center px-4 py-2 text-sm bg-violet-50 text-violet-600 rounded-lg hover:bg-violet-100 transition-colors"
              >
                <FiActivity className="w-4 h-4 mr-2" />
                <span>Social Profile</span>
              </button>
              <button
                onClick={() => {
                  navigate('/profile', { 
                    state: { 
                      editPetId: pet.id,
                      openEditDialog: true 
                    } 
                  });
                }}
                className="flex items-center px-4 py-2 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
              >
                <FiEdit className="w-4 h-4 mr-2" />
                <span>Edit</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Pet Overview */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm overflow-hidden sticky top-24"
            >
              {/* Pet Image */}
              <div className="relative h-64 bg-gradient-to-br from-violet-100 to-purple-100">
                {pet.image ? (
                  <img
                    src={pet.image}
                    alt={pet.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FaPaw className="w-20 h-20 text-violet-300" />
                  </div>
                )}
              </div>

              {/* Pet Basic Info */}
              <div className="p-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{pet.name}</h1>
                <p className="text-lg text-gray-600 capitalize mb-4">
                  {pet.breed} • {pet.type}
                </p>

                <div className="space-y-3">
                  {pet.gender && (
                    <div className="flex items-center text-sm">
                      <FaVenusMars className="w-4 h-4 text-violet-600 mr-3" />
                      <span className="text-gray-700">{pet.gender}</span>
                    </div>
                  )}
                  {pet.dateOfBirth && (
                    <div className="flex items-center text-sm">
                      <FaBirthdayCake className="w-4 h-4 text-pink-500 mr-3" />
                      <span className="text-gray-700">
                        {calculateAge(pet.dateOfBirth)} old
                      </span>
                    </div>
                  )}
                  {pet.weight && (
                    <div className="flex items-center text-sm">
                      <FaWeight className="w-4 h-4 text-blue-500 mr-3" />
                      <span className="text-gray-700">{pet.weight}</span>
                    </div>
                  )}
                  {pet.color && (
                    <div className="flex items-center text-sm">
                      <FaPalette className="w-4 h-4 text-amber-500 mr-3" />
                      <span className="text-gray-700">{pet.color}</span>
                    </div>
                  )}
                </div>

                {pet.microchipId && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">Microchip ID</p>
                    <p className="font-mono text-sm text-gray-900">{pet.microchipId}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Right Column - Detailed Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Vaccinations Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <FaSyringe className="w-5 h-5 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Vaccinations</h2>
              </div>
              
              {pet.vaccinations && pet.vaccinations.length > 0 ? (
                <div className="space-y-3">
                  {pet.vaccinations.map((vaccination, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                          <FaSyringe className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{vaccination.name || vaccination}</p>
                          {vaccination.date && (
                            <p className="text-sm text-gray-500">
                              Administered: {new Date(vaccination.date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                      {vaccination.nextDue && (
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Next Due</p>
                          <p className="text-sm font-medium text-gray-900">
                            {new Date(vaccination.nextDue).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No vaccination records yet</p>
              )}
            </motion.div>

            {/* Medications Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <FaPills className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Medications</h2>
              </div>
              
              {pet.medications && pet.medications.length > 0 ? (
                <div className="space-y-3">
                  {pet.medications.map((medication, index) => (
                    <div
                      key={index}
                      className="p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                            <FaPills className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {medication.name || medication}
                            </p>
                            {medication.dosage && (
                              <p className="text-sm text-gray-600">Dosage: {medication.dosage}</p>
                            )}
                          </div>
                        </div>
                        {medication.active && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                            Active
                          </span>
                        )}
                      </div>
                      {medication.schedule && (
                        <p className="text-sm text-gray-500 ml-11">
                          Schedule: {medication.schedule}
                        </p>
                      )}
                      {medication.notes && (
                        <p className="text-sm text-gray-500 ml-11 mt-1">
                          Notes: {medication.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No medications recorded</p>
              )}
            </motion.div>

            {/* Medical Conditions Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                  <FaNotesMedical className="w-5 h-5 text-red-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Medical Conditions</h2>
              </div>
              
              {pet.medicalConditions && pet.medicalConditions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {pet.medicalConditions.map((condition, index) => (
                    <div
                      key={index}
                      className="flex items-center p-3 bg-red-50 rounded-lg"
                    >
                      <FiAlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0" />
                      <span className="text-gray-900">{condition}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No medical conditions recorded</p>
              )}
            </motion.div>

            {/* Allergies Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center mr-3">
                  <FiHeart className="w-5 h-5 text-amber-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Allergies</h2>
              </div>
              
              {pet.allergies && pet.allergies.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {pet.allergies.map((allergy, index) => (
                    <div
                      key={index}
                      className="flex items-center p-3 bg-amber-50 rounded-lg"
                    >
                      <FiAlertCircle className="w-5 h-5 text-amber-600 mr-2 flex-shrink-0" />
                      <span className="text-gray-900">{allergy}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No allergies recorded</p>
              )}
            </motion.div>

            {/* Additional Notes */}
            {pet.notes && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white rounded-xl shadow-sm p-6"
              >
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                    <FaNotesMedical className="w-5 h-5 text-gray-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Additional Notes</h2>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap">{pet.notes}</p>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PetDetailsPage;
