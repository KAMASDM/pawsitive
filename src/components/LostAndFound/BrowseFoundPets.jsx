import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaSearch, 
  FaFilter, 
  FaMapMarkerAlt, 
  FaDog, 
  FaCat,
  FaClock,
  FaEye,
  FaHeart
} from 'react-icons/fa';
import { FiCheckCircle, FiX } from 'react-icons/fi';
import { getDatabase, ref, onValue, query, orderByChild } from 'firebase/database';
import LostFoundPetDetail from './LostFoundPetDetail';
import ReportFoundPet from './ReportFoundPet';
import useResponsive from '../../hooks/useResponsive';

const BrowseFoundPets = () => {
  const { isMobile } = useResponsive();
  const [foundPets, setFoundPets] = useState([]);
  const [filteredPets, setFilteredPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPet, setSelectedPet] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingPet, setEditingPet] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  
  const [filters, setFilters] = useState({
    petType: 'all',
    gender: 'all',
    size: 'all',
    currentStatus: 'all',
    distance: '50',
    sortBy: 'recent'
  });

  useEffect(() => {
    const db = getDatabase();
    const foundPetsRef = ref(db, 'foundPets');
    const foundPetsQuery = query(foundPetsRef, orderByChild('createdAt'));
    
    const unsubscribe = onValue(foundPetsQuery, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const petsArray = Object.entries(data).map(([id, pet]) => ({
          id,
          ...pet
        })).filter(pet => pet.status === 'found'); // Only show active found pets
        
        setFoundPets(petsArray.reverse());
        setFilteredPets(petsArray.reverse());
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, searchQuery, foundPets]);

  const applyFilters = () => {
    let filtered = [...foundPets];

    if (searchQuery.trim()) {
      filtered = filtered.filter(pet => 
        pet.approximateBreed?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pet.foundLocation?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filters.petType !== 'all') {
      filtered = filtered.filter(pet => pet.petType === filters.petType);
    }

    if (filters.gender !== 'all') {
      filtered = filtered.filter(pet => pet.gender === filters.gender);
    }

    if (filters.size !== 'all') {
      filtered = filtered.filter(pet => pet.size === filters.size);
    }

    if (filters.currentStatus !== 'all') {
      filtered = filtered.filter(pet => pet.currentStatus === filters.currentStatus);
    }

    switch (filters.sortBy) {
      case 'recent':
        filtered.sort((a, b) => b.createdAt - a.createdAt);
        break;
      case 'oldest':
        filtered.sort((a, b) => a.createdAt - b.createdAt);
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'with_me':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'at_shelter':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'at_vet':
        return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'with_someone_else':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'with_me':
        return 'With Finder';
      case 'at_shelter':
        return 'At Shelter';
      case 'at_vet':
        return 'At Vet';
      case 'with_someone_else':
        return 'In Care';
      default:
        return status;
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
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Pet Type</label>
          <select
            value={filters.petType}
            onChange={(e) => setFilters({...filters, petType: e.target.value})}
            className="w-full px-4 py-2 rounded-xl border-2 border-gray-300 focus:border-green-600 focus:outline-none"
          >
            <option value="all">All Types</option>
            <option value="Dog">Dogs</option>
            <option value="Cat">Cats</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
          <select
            value={filters.gender}
            onChange={(e) => setFilters({...filters, gender: e.target.value})}
            className="w-full px-4 py-2 rounded-xl border-2 border-gray-300 focus:border-green-600 focus:outline-none"
          >
            <option value="all">All</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Size</label>
          <select
            value={filters.size}
            onChange={(e) => setFilters({...filters, size: e.target.value})}
            className="w-full px-4 py-2 rounded-xl border-2 border-gray-300 focus:border-green-600 focus:outline-none"
          >
            <option value="all">All Sizes</option>
            <option value="Small">Small</option>
            <option value="Medium">Medium</option>
            <option value="Large">Large</option>
            <option value="X-Large">X-Large</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Current Status</label>
          <select
            value={filters.currentStatus}
            onChange={(e) => setFilters({...filters, currentStatus: e.target.value})}
            className="w-full px-4 py-2 rounded-xl border-2 border-gray-300 focus:border-green-600 focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="with_me">With Finder</option>
            <option value="at_shelter">At Shelter</option>
            <option value="at_vet">At Vet</option>
            <option value="with_someone_else">In Care</option>
          </select>
        </div>

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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
          <select
            value={filters.sortBy}
            onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
            className="w-full px-4 py-2 rounded-xl border-2 border-gray-300 focus:border-green-600 focus:outline-none"
          >
            <option value="recent">Most Recent</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      <div className="mt-4 flex gap-3">
        <button
          onClick={() => setFilters({
            petType: 'all',
            gender: 'all',
            size: 'all',
            currentStatus: 'all',
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
        className="bg-white rounded-2xl shadow-md border-2 border-green-100 overflow-hidden hover:shadow-xl transition-all cursor-pointer"
        whileHover={{ scale: 1.02, y: -3 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setSelectedPet(pet)}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        {/* Image */}
        <div className="relative h-48 bg-gradient-to-br from-green-50 to-green-100">
          {pet.photos && pet.photos.length > 0 ? (
            <img 
              src={pet.photos[0].base64 || pet.photos[0]} 
              alt="Found pet"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Icon className="text-6xl text-green-300" />
            </div>
          )}
          
          {/* Status Badge */}
          <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold border-2 ${getStatusColor(pet.currentStatus)}`}>
            {getStatusLabel(pet.currentStatus)}
          </div>

          {/* Microchip Badge */}
          {pet.microchipFound && (
            <div className="absolute bottom-3 left-3 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
              <FiCheckCircle /> Microchipped
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="text-xl font-bold text-slate-800">Found {pet.petType}</h3>
              <p className="text-sm text-gray-600">{pet.approximateBreed}</p>
            </div>
            <FiCheckCircle className="text-2xl text-green-500" />
          </div>

          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Icon className="text-green-600" />
              <span>
                {pet.gender || 'Unknown'} • {pet.size || 'Unknown'} • {pet.approximateAge || 'Unknown age'}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <FaMapMarkerAlt className="text-green-500" />
              <span className="truncate">{pet.foundLocation}</span>
            </div>

            <div className="flex items-center gap-2">
              <FaClock className="text-gray-400" />
              <span>Found: {formatDate(pet.createdAt)}</span>
            </div>

            {pet.primaryColor && (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full border-2 border-gray-300 bg-gradient-to-br from-green-200 to-green-300" />
                <span>{pet.primaryColor}{pet.secondaryColor ? ` & ${pet.secondaryColor}` : ''}</span>
              </div>
            )}
          </div>

          {/* Badges */}
          <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap gap-2">
            {pet.hasCollar && (
              <span className="bg-violet-100 text-violet-700 px-2 py-1 rounded-full text-xs font-medium">
                Has Collar
              </span>
            )}
            {pet.hasTag && (
              <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full text-xs font-medium">
                Has Tag
              </span>
            )}
            {pet.willingToFoster && (
              <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                <FaHeart /> Fostering
              </span>
            )}
          </div>

          {/* Stats */}
          <div className="mt-3 text-xs text-gray-500 flex items-center gap-1">
            <FaEye />
            <span>{pet.views || 0} views</span>
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
              placeholder="Search by breed or location..."
              className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-300 focus:border-green-600 focus:outline-none"
            />
          </div>
          <motion.button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-6 py-3 rounded-xl font-medium flex items-center gap-2 ${
              showFilters
                ? 'bg-gradient-to-r from-green-600 to-green-700 text-white'
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
        <span className="font-medium">{filteredPets.length}</span> found pets available
      </div>

      {/* Pet Grid */}
      {filteredPets.length === 0 ? (
        <motion.div
          className="text-center py-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <FiCheckCircle className="text-6xl text-gray-300 mx-auto mb-4" />
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
        {selectedPet && !showEditForm && (
          <LostFoundPetDetail
            pet={selectedPet}
            type="found"
            onClose={() => setSelectedPet(null)}
            onEdit={(pet) => {
              setEditingPet(pet);
              setShowEditForm(true);
              setSelectedPet(null);
            }}
            onDelete={() => {
              setSelectedPet(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Edit Form Modal */}
      <AnimatePresence>
        {showEditForm && editingPet && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/50 overflow-y-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="min-h-screen flex items-center justify-center p-4">
              <motion.div
                className="bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
              >
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
                      Edit Found Pet Report
                    </h2>
                    <button
                      onClick={() => {
                        setShowEditForm(false);
                        setEditingPet(null);
                      }}
                      className="p-2 hover:bg-white rounded-lg transition-colors"
                    >
                      <FiX className="text-2xl text-gray-600" />
                    </button>
                  </div>
                  <ReportFoundPet
                    editMode={true}
                    initialData={editingPet}
                    onEditComplete={() => {
                      setShowEditForm(false);
                      setEditingPet(null);
                    }}
                  />
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BrowseFoundPets;
