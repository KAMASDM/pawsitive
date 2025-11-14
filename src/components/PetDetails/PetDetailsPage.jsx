import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ref, get, set } from 'firebase/database';
import { onAuthStateChanged } from 'firebase/auth';
import { database, auth } from '../../firebase';
import {
  FiArrowLeft,
  FiEdit,
  FiActivity,
  FiHeart,
  FiAlertCircle,
  FiPlus,
  FiTrash2,
  FiX,
  FiSave,
  FiChevronDown,
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
import { motion, AnimatePresence } from 'framer-motion';

const COMMON_CONDITIONS = [
  "Allergies",
  "Arthritis",
  "Asthma",
  "Cancer",
  "Cataracts",
  "Dental Disease",
  "Diabetes",
  "Ear Infections",
  "Epilepsy",
  "Heart Disease",
  "Hip Dysplasia",
  "Hypothyroidism",
  "Kidney Disease",
  "Obesity",
  "Pancreatitis",
  "Skin Infections",
];

const COMMON_ALLERGIES = [
  "Beef",
  "Chicken",
  "Dairy",
  "Dust Mites",
  "Eggs",
  "Fish",
  "Fleas",
  "Grain",
  "Grass",
  "Lamb",
  "Mold",
  "Pollen",
  "Pork",
  "Soy",
  "Wheat",
];

const PetDetailsPage = () => {
  const { petId } = useParams();
  const navigate = useNavigate();
  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  // Editing states
  const [editingVaccination, setEditingVaccination] = useState(null);
  const [editingMedication, setEditingMedication] = useState(null);
  const [editingCondition, setEditingCondition] = useState(false);
  const [editingAllergy, setEditingAllergy] = useState(false);
  const [newCondition, setNewCondition] = useState('');
  const [newAllergy, setNewAllergy] = useState('');

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

  // Save pet data to Firebase
  const savePetToFirebase = async (updatedPet) => {
    try {
      const petRef = ref(database, `userPets/${currentUser.uid}/${petId}`);
      await set(petRef, updatedPet);
      setPet(updatedPet);
      return true;
    } catch (error) {
      console.error('Error saving pet:', error);
      alert('Failed to save changes. Please try again.');
      return false;
    }
  };

  // Vaccination handlers
  const handleAddVaccination = () => {
    setEditingVaccination({
      id: Date.now().toString(),
      name: '',
      date: '',
      nextDue: '',
      notes: '',
      isNew: true
    });
  };

  const handleSaveVaccination = async () => {
    if (!editingVaccination?.name || !editingVaccination?.date) {
      alert('Please fill in vaccination name and date');
      return;
    }

    const updatedPet = { ...pet };
    updatedPet.vaccinations = updatedPet.vaccinations || [];

    if (editingVaccination.isNew) {
      const { isNew, ...vaccinationData } = editingVaccination;
      updatedPet.vaccinations.push(vaccinationData);
    } else {
      // Try to find by ID first, then by index
      let index = updatedPet.vaccinations.findIndex(v => v.id === editingVaccination.id);
      if (index === -1 && editingVaccination.index !== undefined) {
        index = editingVaccination.index;
      }
      
      if (index !== -1) {
        const { isNew, index: _, ...vaccinationData } = editingVaccination;
        updatedPet.vaccinations[index] = vaccinationData;
      }
    }

    const success = await savePetToFirebase(updatedPet);
    if (success) {
      setEditingVaccination(null);
    }
  };

  const handleDeleteVaccination = async (vaccinationId) => {
    if (!window.confirm('Are you sure you want to delete this vaccination record?')) return;

    const updatedPet = { ...pet };
    
    // Try to find by ID first
    let filtered = updatedPet.vaccinations.filter(v => v.id !== vaccinationId && `vacc-${updatedPet.vaccinations.indexOf(v)}` !== vaccinationId);
    
    // If nothing was filtered, try by index
    if (filtered.length === updatedPet.vaccinations.length && vaccinationId.startsWith('vacc-')) {
      const index = parseInt(vaccinationId.split('-')[1]);
      filtered = updatedPet.vaccinations.filter((_, i) => i !== index);
    }
    
    updatedPet.vaccinations = filtered;
    await savePetToFirebase(updatedPet);
  };

  // Medication handlers
  const handleAddMedication = () => {
    setEditingMedication({
      id: Date.now().toString(),
      name: '',
      dosage: '',
      schedule: '',
      notes: '',
      active: true,
      isNew: true
    });
  };

  const handleSaveMedication = async () => {
    if (!editingMedication?.name) {
      alert('Please fill in medication name');
      return;
    }

    const updatedPet = { ...pet };
    updatedPet.medications = updatedPet.medications || [];

    if (editingMedication.isNew) {
      const { isNew, ...medicationData } = editingMedication;
      updatedPet.medications.push(medicationData);
    } else {
      // Try to find by ID first, then by index
      let index = updatedPet.medications.findIndex(m => m.id === editingMedication.id);
      if (index === -1 && editingMedication.index !== undefined) {
        index = editingMedication.index;
      }
      
      if (index !== -1) {
        const { isNew, index: _, ...medicationData } = editingMedication;
        updatedPet.medications[index] = medicationData;
      }
    }

    const success = await savePetToFirebase(updatedPet);
    if (success) {
      setEditingMedication(null);
    }
  };

  const handleDeleteMedication = async (medicationId) => {
    if (!window.confirm('Are you sure you want to delete this medication?')) return;

    const updatedPet = { ...pet };
    
    // Try to find by ID first
    let filtered = updatedPet.medications.filter(m => m.id !== medicationId && `med-${updatedPet.medications.indexOf(m)}` !== medicationId);
    
    // If nothing was filtered, try by index
    if (filtered.length === updatedPet.medications.length && medicationId.startsWith('med-')) {
      const index = parseInt(medicationId.split('-')[1]);
      filtered = updatedPet.medications.filter((_, i) => i !== index);
    }
    
    updatedPet.medications = filtered;
    await savePetToFirebase(updatedPet);
  };

  // Medical Condition handlers
  const handleAddCondition = async () => {
    if (!newCondition.trim()) return;

    const updatedPet = { ...pet };
    updatedPet.medicalConditions = updatedPet.medicalConditions || [];
    updatedPet.medicalConditions.push(newCondition.trim());

    const success = await savePetToFirebase(updatedPet);
    if (success) {
      setNewCondition('');
      setEditingCondition(false);
    }
  };

  const handleDeleteCondition = async (condition) => {
    if (!window.confirm('Are you sure you want to delete this medical condition?')) return;

    const updatedPet = { ...pet };
    updatedPet.medicalConditions = updatedPet.medicalConditions.filter(c => c !== condition);
    await savePetToFirebase(updatedPet);
  };

  // Allergy handlers
  const handleAddAllergy = async () => {
    if (!newAllergy.trim()) return;

    const updatedPet = { ...pet };
    updatedPet.allergies = updatedPet.allergies || [];
    updatedPet.allergies.push(newAllergy.trim());

    const success = await savePetToFirebase(updatedPet);
    if (success) {
      setNewAllergy('');
      setEditingAllergy(false);
    }
  };

  const handleDeleteAllergy = async (allergy) => {
    if (!window.confirm('Are you sure you want to delete this allergy?')) return;

    const updatedPet = { ...pet };
    updatedPet.allergies = updatedPet.allergies.filter(a => a !== allergy);
    await savePetToFirebase(updatedPet);
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
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                    <FaSyringe className="w-5 h-5 text-green-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Vaccinations</h2>
                </div>
                <button
                  onClick={handleAddVaccination}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <FiPlus className="w-4 h-4" />
                  <span>Add</span>
                </button>
              </div>
              
              <div className="space-y-3">
                {/* Existing Vaccinations */}
                {pet.vaccinations && pet.vaccinations.length > 0 && pet.vaccinations.map((vaccination, index) => {
                  // Ensure vaccination has an id
                  const vaccId = vaccination?.id || `vacc-${index}`;
                  const isEditing = editingVaccination?.id === vaccId || (editingVaccination?.index === index && !vaccination?.id);
                  
                  return (
                  <div key={vaccId}>
                    {isEditing ? (
                      // Edit Mode
                      <div className="p-4 bg-green-50 rounded-lg border-2 border-green-200 space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Vaccine Name *</label>
                          <input
                            type="text"
                            value={editingVaccination?.name || ''}
                            onChange={(e) => setEditingVaccination({...editingVaccination, name: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="e.g., Rabies, DHPP"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date Administered *</label>
                            <input
                              type="date"
                              value={editingVaccination?.date || ''}
                              onChange={(e) => setEditingVaccination({...editingVaccination, date: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Next Due Date</label>
                            <input
                              type="date"
                              value={editingVaccination?.nextDue || ''}
                              onChange={(e) => setEditingVaccination({...editingVaccination, nextDue: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                          <textarea
                            value={editingVaccination?.notes || ''}
                            onChange={(e) => setEditingVaccination({...editingVaccination, notes: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            rows="2"
                            placeholder="Any additional notes..."
                          />
                        </div>
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => setEditingVaccination(null)}
                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                          >
                            <FiX className="w-4 h-4" />
                            Cancel
                          </button>
                          <button
                            onClick={handleSaveVaccination}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                          >
                            <FiSave className="w-4 h-4" />
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      // View Mode
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group">
                        <div className="flex items-center flex-1">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                            <FaSyringe className="w-4 h-4 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{vaccination?.name || vaccination || 'Unknown Vaccine'}</p>
                            {vaccination?.date && (
                              <p className="text-sm text-gray-500">
                                Administered: {new Date(vaccination.date).toLocaleDateString()}
                              </p>
                            )}
                            {vaccination?.notes && (
                              <p className="text-xs text-gray-500 mt-1">{vaccination.notes}</p>
                            )}
                          </div>
                          {vaccination?.nextDue && (
                            <div className="text-right mr-4">
                              <p className="text-xs text-gray-500">Next Due</p>
                              <p className="text-sm font-medium text-gray-900">
                                {new Date(vaccination.nextDue).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setEditingVaccination({ ...vaccination, id: vaccId, index })}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <FiEdit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteVaccination(vaccId)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  );
                })}

                {/* New Vaccination Form */}
                {editingVaccination?.isNew && (
                  <div className="p-4 bg-green-50 rounded-lg border-2 border-green-200 space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Vaccine Name *</label>
                      <input
                        type="text"
                        value={editingVaccination.name}
                        onChange={(e) => setEditingVaccination({...editingVaccination, name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="e.g., Rabies, DHPP"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date Administered *</label>
                        <input
                          type="date"
                          value={editingVaccination.date}
                          onChange={(e) => setEditingVaccination({...editingVaccination, date: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Next Due Date</label>
                        <input
                          type="date"
                          value={editingVaccination.nextDue || ''}
                          onChange={(e) => setEditingVaccination({...editingVaccination, nextDue: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                      <textarea
                        value={editingVaccination.notes || ''}
                        onChange={(e) => setEditingVaccination({...editingVaccination, notes: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        rows="2"
                        placeholder="Any additional notes..."
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => setEditingVaccination(null)}
                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                      >
                        <FiX className="w-4 h-4" />
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveVaccination}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                      >
                        <FiSave className="w-4 h-4" />
                        Save
                      </button>
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {(!pet.vaccinations || pet.vaccinations.length === 0) && !editingVaccination && (
                  <div className="text-center py-8">
                    <FaSyringe className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 mb-4">No vaccination records yet</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Medications Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <FaPills className="w-5 h-5 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Medications</h2>
                </div>
                <button
                  onClick={handleAddMedication}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FiPlus className="w-4 h-4" />
                  <span>Add</span>
                </button>
              </div>
              
              <div className="space-y-3">
                {/* Existing Medications */}
                {pet.medications && pet.medications.length > 0 && pet.medications.map((medication, index) => {
                  const medId = medication?.id || `med-${index}`;
                  const isEditing = editingMedication?.id === medId || (editingMedication?.index === index && !medication?.id);
                  
                  return (
                  <div key={medId}>
                    {isEditing ? (
                      // Edit Mode
                      <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200 space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Medication Name *</label>
                          <input
                            type="text"
                            value={editingMedication?.name || ''}
                            onChange={(e) => setEditingMedication({...editingMedication, name: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="e.g., Amoxicillin"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Dosage</label>
                            <input
                              type="text"
                              value={editingMedication?.dosage || ''}
                              onChange={(e) => setEditingMedication({...editingMedication, dosage: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="e.g., 500mg"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Schedule</label>
                            <input
                              type="text"
                              value={editingMedication?.schedule || ''}
                              onChange={(e) => setEditingMedication({...editingMedication, schedule: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="e.g., Twice daily"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                          <textarea
                            value={editingMedication?.notes || ''}
                            onChange={(e) => setEditingMedication({...editingMedication, notes: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            rows="2"
                            placeholder="Any additional notes..."
                          />
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={editingMedication?.active || false}
                            onChange={(e) => setEditingMedication({...editingMedication, active: e.target.checked})}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <label className="ml-2 text-sm text-gray-700">Currently Active</label>
                        </div>
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => setEditingMedication(null)}
                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                          >
                            <FiX className="w-4 h-4" />
                            Cancel
                          </button>
                          <button
                            onClick={handleSaveMedication}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                          >
                            <FiSave className="w-4 h-4" />
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      // View Mode
                      <div className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center flex-1">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                              <FaPills className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{medication?.name || medication || 'Unknown Medication'}</p>
                              {medication?.dosage && (
                                <p className="text-sm text-gray-600">Dosage: {medication.dosage}</p>
                              )}
                              {medication?.schedule && (
                                <p className="text-sm text-gray-500">Schedule: {medication.schedule}</p>
                              )}
                              {medication?.notes && (
                                <p className="text-sm text-gray-500 mt-1">Notes: {medication.notes}</p>
                              )}
                            </div>
                            {medication?.active && (
                              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                                Active
                              </span>
                            )}
                          </div>
                          <div className="flex gap-2 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => setEditingMedication({ ...medication, id: medId, index })}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <FiEdit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteMedication(medId)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  );
                })}

                {/* New Medication Form */}
                {editingMedication?.isNew && (
                  <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200 space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Medication Name *</label>
                      <input
                        type="text"
                        value={editingMedication.name}
                        onChange={(e) => setEditingMedication({...editingMedication, name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Amoxicillin"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Dosage</label>
                        <input
                          type="text"
                          value={editingMedication.dosage || ''}
                          onChange={(e) => setEditingMedication({...editingMedication, dosage: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="e.g., 500mg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Schedule</label>
                        <input
                          type="text"
                          value={editingMedication.schedule || ''}
                          onChange={(e) => setEditingMedication({...editingMedication, schedule: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="e.g., Twice daily"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                      <textarea
                        value={editingMedication.notes || ''}
                        onChange={(e) => setEditingMedication({...editingMedication, notes: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows="2"
                        placeholder="Any additional notes..."
                      />
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={editingMedication.active || false}
                        onChange={(e) => setEditingMedication({...editingMedication, active: e.target.checked})}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <label className="ml-2 text-sm text-gray-700">Currently Active</label>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => setEditingMedication(null)}
                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                      >
                        <FiX className="w-4 h-4" />
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveMedication}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                      >
                        <FiSave className="w-4 h-4" />
                        Save
                      </button>
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {(!pet.medications || pet.medications.length === 0) && !editingMedication && (
                  <div className="text-center py-8">
                    <FaPills className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No medications recorded</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Medical Conditions Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                    <FaNotesMedical className="w-5 h-5 text-red-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Medical Conditions</h2>
                </div>
                <button
                  onClick={() => setEditingCondition(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <FiPlus className="w-4 h-4" />
                  <span>Add</span>
                </button>
              </div>
              
              <div className="space-y-3">
                {/* Add New Condition Form */}
                {editingCondition && (
                  <div className="space-y-2">
                    <div className="relative">
                      <select
                        value={newCondition}
                        onChange={(e) => setNewCondition(e.target.value)}
                        className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent appearance-none bg-white pr-10"
                      >
                        <option value="">Select a medical condition...</option>
                        {COMMON_CONDITIONS.map((condition) => (
                          <option key={condition} value={condition}>
                            {condition}
                          </option>
                        ))}
                        <option value="Other">Other (Custom)</option>
                      </select>
                      <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                    
                    {newCondition === 'Other' && (
                      <input
                        type="text"
                        value={newCondition}
                        onChange={(e) => setNewCondition(e.target.value)}
                        className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        placeholder="Enter custom medical condition..."
                        autoFocus
                      />
                    )}
                    
                    <div className="flex gap-2">
                      <button
                        onClick={handleAddCondition}
                        disabled={!newCondition || newCondition === 'Other'}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FiSave className="w-4 h-4" />
                        Add
                      </button>
                      <button
                        onClick={() => {
                          setEditingCondition(false);
                          setNewCondition('');
                        }}
                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                      >
                        <FiX className="w-4 h-4" />
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Existing Conditions */}
                {pet.medicalConditions && pet.medicalConditions.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {pet.medicalConditions.map((condition, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-red-50 rounded-lg hover:bg-red-100 transition-colors group"
                      >
                        <div className="flex items-center flex-1">
                          <FiAlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0" />
                          <span className="text-gray-900">{condition}</span>
                        </div>
                        <button
                          onClick={() => handleDeleteCondition(condition)}
                          className="p-1.5 text-red-600 hover:bg-red-200 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                          title="Delete"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  !editingCondition && (
                    <div className="text-center py-8">
                      <FiAlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No medical conditions recorded</p>
                    </div>
                  )
                )}
              </div>
            </motion.div>

            {/* Allergies Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center mr-3">
                    <FiHeart className="w-5 h-5 text-amber-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Allergies</h2>
                </div>
                <button
                  onClick={() => setEditingAllergy(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                >
                  <FiPlus className="w-4 h-4" />
                  <span>Add</span>
                </button>
              </div>
              
              <div className="space-y-3">
                {/* Add New Allergy Form */}
                {editingAllergy && (
                  <div className="space-y-2">
                    <div className="relative">
                      <select
                        value={newAllergy}
                        onChange={(e) => setNewAllergy(e.target.value)}
                        className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent appearance-none bg-white pr-10"
                      >
                        <option value="">Select an allergy...</option>
                        {COMMON_ALLERGIES.map((allergy) => (
                          <option key={allergy} value={allergy}>
                            {allergy}
                          </option>
                        ))}
                        <option value="Other">Other (Custom)</option>
                      </select>
                      <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                    
                    {newAllergy === 'Other' && (
                      <input
                        type="text"
                        value={newAllergy}
                        onChange={(e) => setNewAllergy(e.target.value)}
                        className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        placeholder="Enter custom allergy..."
                        autoFocus
                      />
                    )}
                    
                    <div className="flex gap-2">
                      <button
                        onClick={handleAddAllergy}
                        disabled={!newAllergy || newAllergy === 'Other'}
                        className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FiSave className="w-4 h-4" />
                        Add
                      </button>
                      <button
                        onClick={() => {
                          setEditingAllergy(false);
                          setNewAllergy('');
                        }}
                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                      >
                        <FiX className="w-4 h-4" />
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Existing Allergies */}
                {pet.allergies && pet.allergies.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {pet.allergies.map((allergy, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors group"
                      >
                        <div className="flex items-center flex-1">
                          <FiAlertCircle className="w-5 h-5 text-amber-600 mr-2 flex-shrink-0" />
                          <span className="text-gray-900">{allergy}</span>
                        </div>
                        <button
                          onClick={() => handleDeleteAllergy(allergy)}
                          className="p-1.5 text-amber-600 hover:bg-amber-200 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                          title="Delete"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  !editingAllergy && (
                    <div className="text-center py-8">
                      <FiHeart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No allergies recorded</p>
                    </div>
                  )
                )}
              </div>
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
