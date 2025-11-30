import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaSearch, 
  FaFilter, 
  FaMapMarkerAlt, 
  FaDog, 
  FaCat,
  FaClock,
  FaDollarSign,
  FaEye,
  FaPhone,
  FaEnvelope,
  FaTimes
} from 'react-icons/fa';
import { FiAlertCircle, FiX } from 'react-icons/fi';
import { getDatabase, ref, onValue, query, orderByChild } from 'firebase/database';
import LostFoundPetDetail from './LostFoundPetDetail';
import { calculateMatchScore } from '../../utils/matchingAlgorithm';
import useResponsive from '../../hooks/useResponsive';

const BrowseLostPets = () => {
  const { isMobile } = useResponsive();
  const [lostPets, setLostPets] = useState([]);
  const [filteredPets, setFilteredPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPet, setSelectedPet] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [filters, setFilters] = useState({
    petType: 'all',
    gender: 'all',
    size: 'all',
    urgency: 'all',
    distance: '50',
    sortBy: 'recent'
  });

  useEffect(() => {
    const db = getDatabase();
    const lostPetsRef = ref(db, 'lostPets');
    const lostPetsQuery = query(lostPetsRef, orderByChild('createdAt'));
    
    const unsubscribe = onValue(lostPetsQuery, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const petsArray = Object.entries(data).map(([id, pet]) => ({
          id,
          ...pet
        })).filter(pet => pet.status === 'lost'); // Only show active lost pets
        
        setLostPets(petsArray.reverse()); // Most recent first
        setFilteredPets(petsArray.reverse());
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, searchQuery, lostPets]);

  const applyFilters = () => {
    let filtered = [...lostPets];

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(pet => 
        pet.petName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pet.breed?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pet.lastSeenLocation?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Pet type filter
    if (filters.petType !== 'all') {
      filtered = filtered.filter(pet => pet.petType === filters.petType);
    }

    // Gender filter
    if (filters.gender !== 'all') {
      filtered = filtered.filter(pet => pet.gender === filters.gender);
    }

    // Size filter
    if (filters.size !== 'all') {
      filtered = filtered.filter(pet => pet.size === filters.size);
    }

    // Urgency filter
    if (filters.urgency !== 'all') {
      filtered = filtered.filter(pet => pet.urgency === filters.urgency);
    }

    // Sort
    switch (filters.sortBy) {
      case 'recent':
        filtered.sort((a, b) => b.createdAt - a.createdAt);
        break;
      case 'oldest':
        filtered.sort((a, b) => a.createdAt - b.createdAt);
        break;
      case 'reward':
        filtered.sort((a, b) => (b.rewardAmount || 0) - (a.rewardAmount || 0));
        break;
      default:
        break;
    }

    setFilteredPets(filtered);
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-700 border-green-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const FilterPanel = () => (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-2xl shadow-lg p-6 mb-6"
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-slate-800">Filters</h3>
        <button
          onClick={() => setShowFilters(false)}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <FiX className="text-xl" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Pet Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Pet Type</label>
          <select
            value={filters.petType}
            onChange={(e) => setFilters({...filters, petType: e.target.value})}
            className="w-full px-4 py-2 rounded-xl border-2 border-gray-300 focus:border-violet-600 focus:outline-none"
          >
            <option value="all">All Types</option>
            <option value="Dog">Dogs</option>
            <option value="Cat">Cats</option>
          </select>
        </div>

        {/* Gender */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
          <select
            value={filters.gender}
            onChange={(e) => setFilters({...filters, gender: e.target.value})}
            className="w-full px-4 py-2 rounded-xl border-2 border-gray-300 focus:border-violet-600 focus:outline-none"
          >
            <option value="all">All</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>

        {/* Size */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Size</label>
          <select
            value={filters.size}
            onChange={(e) => setFilters({...filters, size: e.target.value})}
            className="w-full px-4 py-2 rounded-xl border-2 border-gray-300 focus:border-violet-600 focus:outline-none"
          >
            <option value="all">All Sizes</option>
            <option value="Small">Small</option>
            <option value="Medium">Medium</option>
            <option value="Large">Large</option>
            <option value="X-Large">X-Large</option>
          </select>
        </div>

        {/* Urgency */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Urgency</label>
          <select
            value={filters.urgency}
            onChange={(e) => setFilters({...filters, urgency: e.target.value})}
            className="w-full px-4 py-2 rounded-xl border-2 border-gray-300 focus:border-violet-600 focus:outline-none"
          >
            <option value="all">All Levels</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {/* Distance */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Distance: {filters.distance} miles
          </label>
          <input
            type="range"
            min="5"
            max="100"
            step="5"
            value={filters.distance}
            onChange={(e) => setFilters({...filters, distance: e.target.value})}
            className="w-full"
          />
        </div>

        {/* Sort By */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
          <select
            value={filters.sortBy}
            onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
            className="w-full px-4 py-2 rounded-xl border-2 border-gray-300 focus:border-violet-600 focus:outline-none"
          >
            <option value="recent">Most Recent</option>
            <option value="oldest">Oldest First</option>
            <option value="reward">Highest Reward</option>
          </select>
        </div>
      </div>

      <div className="mt-4 flex gap-3">
        <button
          onClick={() => setFilters({
            petType: 'all',
            gender: 'all',
            size: 'all',
            urgency: 'all',
            distance: '50',
            sortBy: 'recent'
          })}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300"
        >
          Reset Filters
        </button>
      </div>
    </motion.div>
  );

  const PetCard = ({ pet }) => {
    const Icon = pet.petType === 'Dog' ? FaDog : FaCat;
    
    return (
      <motion.div
        className="bg-white rounded-2xl shadow-md border-2 border-red-100 overflow-hidden hover:shadow-xl transition-all cursor-pointer"
        whileHover={{ scale: 1.02, y: -3 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setSelectedPet(pet)}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        {/* Image */}
        <div className="relative h-48 bg-gradient-to-br from-red-50 to-red-100">
          {pet.photos && pet.photos.length > 0 ? (
            <img 
              src={pet.photos[0].base64 || pet.photos[0]} 
              alt={pet.petName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Icon className="text-6xl text-red-300" />
            </div>
          )}
          
          {/* Urgency Badge */}
          <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold border-2 ${getUrgencyColor(pet.urgency)}`}>
            {pet.urgency?.toUpperCase()}
          </div>

          {/* Reward Badge */}
          {pet.reward && (
            <div className="absolute bottom-3 left-3 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
              <FaDollarSign /> Reward
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="text-xl font-bold text-slate-800">{pet.petName}</h3>
              <p className="text-sm text-gray-600">{pet.breed}</p>
            </div>
            <FiAlertCircle className="text-2xl text-red-500" />
          </div>

          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Icon className="text-violet-600" />
              <span>{pet.gender} • {pet.size} • {pet.age}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <FaMapMarkerAlt className="text-red-500" />
              <span className="truncate">{pet.lastSeenLocation}</span>
            </div>

            <div className="flex items-center gap-2">
              <FaClock className="text-gray-400" />
              <span>Last seen: {formatDate(pet.createdAt)}</span>
            </div>

            {pet.primaryColor && (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full border-2 border-gray-300 bg-gradient-to-br from-violet-200 to-purple-200" />
                <span>{pet.primaryColor}{pet.secondaryColor ? ` & ${pet.secondaryColor}` : ''}</span>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <FaEye />
              <span>{pet.views || 0} views</span>
            </div>
            {pet.microchipped && (
              <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                Microchipped
              </span>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className={`${isMobile ? 'max-w-md mx-auto p-4' : 'max-w-7xl mx-auto'}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white rounded-2xl shadow-md h-96 animate-pulse">
              <div className="h-48 bg-gray-200" />
              <div className="p-4 space-y-3">
                <div className="h-6 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`${isMobile ? 'max-w-md mx-auto p-4' : 'max-w-7xl mx-auto'}`}>
      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, breed, or location..."
              className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-300 focus:border-violet-600 focus:outline-none"
            />
          </div>
          <motion.button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-6 py-3 rounded-xl font-medium flex items-center gap-2 ${
              showFilters
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <FaFilter /> Filters
          </motion.button>
        </div>
      </div>

      {/* Filter Panel */}
      <AnimatePresence>
        {showFilters && <FilterPanel />}
      </AnimatePresence>

      {/* Results Count */}
      <div className="mb-4 text-gray-600">
        <span className="font-medium">{filteredPets.length}</span> lost pets found
      </div>

      {/* Pet Grid */}
      {filteredPets.length === 0 ? (
        <motion.div
          className="text-center py-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <FiAlertCircle className="text-6xl text-gray-300 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-400 mb-2">No pets found</h3>
          <p className="text-gray-500">Try adjusting your filters or search query</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPets.map((pet, index) => (
            <PetCard key={pet.id} pet={pet} />
          ))}
        </div>
      )}

      {/* Pet Detail Modal */}
      <AnimatePresence>
        {selectedPet && (
          <LostFoundPetDetail
            pet={selectedPet}
            type="lost"
            onClose={() => setSelectedPet(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default BrowseLostPets;
