// src/components/Profile/components/ResourcesList.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiHeart, FiBookmark, FiSearch, FiFilter, FiExternalLink, FiX, FiChevronDown, FiInfo, FiCalendar } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const ResourcesList = ({ resources = [] }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter resources based on search query
  const filteredResources = resources
    .filter(resource => {
      // First apply search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          resource.name?.toLowerCase().includes(query) ||
          resource.description?.toLowerCase().includes(query) ||
          resource.category?.toLowerCase().includes(query)
        );
      }
      return true;
    })
    .filter(resource => {
      // Then apply category filter
      if (activeFilter === 'all') return true;
      return resource.category?.toLowerCase() === activeFilter.toLowerCase();
    })
    .sort((a, b) => {
      // Apply sort order
      if (sortOrder === 'newest') {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      } else if (sortOrder === 'oldest') {
        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      } else if (sortOrder === 'az') {
        return (a.name || '').localeCompare(b.name || '');
      } else if (sortOrder === 'za') {
        return (b.name || '').localeCompare(a.name || '');
      }
      return 0;
    });
  
  // Get unique categories from resources
  const categories = ['all', ...new Set(resources.map(resource => 
    resource.category?.toLowerCase() || 'uncategorized'
  ))];
  
  // Format date for display
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Animation variants
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };
  
  return (
    <div className="min-h-screen bg-lavender-50">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="sticky top-0 z-30 bg-lavender-100 rounded-2xl shadow-md p-4 sm:p-6 mb-6 border border-lavender-100">
          {/* Header Content */}
          <div>
            {/* Top Row: Title, Filter Button */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-lavender-900 flex items-center">
                <FiBookmark className="mr-2 text-lavender-600" />
                Liked Resources
              </h2>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center text-sm font-medium text-lavender-600 hover:text-lavender-800"
              >
                Filters <FiFilter className="ml-1 w-4 h-4" />
              </button>
            </div>
            
            {/* Search Bar */}
            <div className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search resources..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full py-2 pl-4 pr-10 rounded-full border border-lavender-300 bg-lavender-50 text-lavender-900 focus:ring-2 focus:ring-lavender-500 focus:border-transparent focus:outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
            
            {/* Category Filter Tabs */}
            <div className="flex items-center space-x-3 overflow-x-auto hide-scrollbar">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveFilter(category)}
                  className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all ${
                    activeFilter === category
                      ? 'bg-lavender-600 text-white font-medium shadow-sm'
                      : 'text-lavender-700 hover:bg-lavender-100'
                  }`}
                >
                  {category === 'all' ? 'All Resources' : category.charAt(0).toUpperCase() + category.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 pb-6 sm:px-6 pt-0">
        {/* Filter Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white rounded-2xl shadow-md overflow-hidden mb-6 border border-lavender-100"
            >
              <div className="p-4 sm:p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lavender-900">Filter Options</h3>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>
                
                {/* Sort Options */}
                <div className="mb-6">
                  <p className="text-sm font-medium text-gray-700 mb-2">Sort Resources</p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <button
                      onClick={() => setSortOrder('newest')}
                      className={`px-4 py-2 rounded-lg text-sm flex justify-center items-center transition-colors ${
                        sortOrder === 'newest'
                          ? 'bg-lavender-600 text-white'
                          : 'bg-lavender-50 text-lavender-800 hover:bg-lavender-100'
                      }`}
                    >
                      <FiCalendar className="mr-1" /> Newest First
                    </button>
                    <button
                      onClick={() => setSortOrder('oldest')}
                      className={`px-4 py-2 rounded-lg text-sm flex justify-center items-center transition-colors ${
                        sortOrder === 'oldest'
                          ? 'bg-lavender-600 text-white'
                          : 'bg-lavender-50 text-lavender-800 hover:bg-lavender-100'
                      }`}
                    >
                      <FiCalendar className="mr-1" /> Oldest First
                    </button>
                    <button
                      onClick={() => setSortOrder('az')}
                      className={`px-4 py-2 rounded-lg text-sm flex justify-center items-center transition-colors ${
                        sortOrder === 'az'
                          ? 'bg-lavender-600 text-white'
                          : 'bg-lavender-50 text-lavender-800 hover:bg-lavender-100'
                      }`}
                    >
                      A-Z
                    </button>
                    <button
                      onClick={() => setSortOrder('za')}
                      className={`px-4 py-2 rounded-lg text-sm flex justify-center items-center transition-colors ${
                        sortOrder === 'za'
                          ? 'bg-lavender-600 text-white'
                          : 'bg-lavender-50 text-lavender-800 hover:bg-lavender-100'
                      }`}
                    >
                      Z-A
                    </button>
                  </div>
                </div>
                
                {/* Information */}
                <div className="mt-6 p-3 bg-lavender-50 rounded-lg">
                  <p className="text-sm text-lavender-900 flex items-start">
                    <FiInfo className="mt-0.5 mr-2 flex-shrink-0 text-lavender-600" />
                    <span>You can browse more resources in the Resources section to find helpful information for your pets.</span>
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Resource Cards */}
        {filteredResources.length > 0 ? (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
          >
            {filteredResources.map((resource) => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                navigate={navigate}
                formatDate={formatDate}
              />
            ))}
          </motion.div>
        ) : (
          <div className="bg-white rounded-2xl shadow-md p-6 sm:p-8 text-center border border-lavender-100">
            <div className="flex flex-col items-center">
              <div className="h-20 w-20 bg-lavender-100 rounded-full flex items-center justify-center mb-4">
                <FiBookmark className="h-10 w-10 text-lavender-300" />
              </div>

              <h3 className="text-xl font-bold text-lavender-900 mb-2">
                {searchQuery ? "No Matching Resources" : "No Liked Resources Yet"}
              </h3>
              
              <p className="text-gray-600 max-w-md mx-auto mb-6">
                {searchQuery
                  ? "No resources match your search criteria. Try adjusting your search or filters."
                  : "You haven't liked any resources yet. Explore our collection and save your favorites here."}
              </p>

              <button
                onClick={() => {
                  if (searchQuery) {
                    setSearchQuery('');
                    setActiveFilter('all');
                  } else {
                    navigate('/resources');
                  }
                }}
                className="px-6 py-3 bg-lavender-600 hover:bg-lavender-700 text-white rounded-full transition-colors duration-300"
              >
                {searchQuery ? "Clear Filters" : "Browse Resources"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Resource Card Component
const ResourceCard = ({ resource, navigate, formatDate }) => {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
      }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-2xl shadow-md overflow-hidden border border-lavender-100 group pet-card-shadow"
    >
      {/* Card Image */}
      <div className="h-48 bg-lavender-100 relative">
        {resource.image ? (
          <img 
            src={resource.image} 
            alt={resource.name} 
            className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-lavender-100 to-lavender-200">
            <FiBookmark className="w-12 h-12 text-lavender-400" />
          </div>
        )}
        
        {/* Category Tag */}
        {resource.category && (
          <div className="absolute top-3 left-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
            {resource.category}
          </div>
        )}
        
        {/* Like Button */}
        <div className="absolute top-3 right-3">
          <button className="bg-white w-8 h-8 rounded-full flex items-center justify-center shadow-sm text-pink-500">
            <FiHeart className="w-4 h-4 fill-current" />
          </button>
        </div>
        
        {/* Date Badge */}
        {resource.createdAt && (
          <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center">
            <FiCalendar className="mr-1 h-3 w-3" /> {formatDate(resource.createdAt)}
          </div>
        )}
      </div>
      
      {/* Card Content */}
      <div className="p-4">
        <h3 className="font-bold text-lavender-900 text-lg mb-2 line-clamp-1">{resource.name}</h3>
        
        {resource.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {resource.description}
          </p>
        )}
        
        {/* Action Buttons */}
        <div className="flex space-x-2">
          <button
            onClick={() => navigate(`/resource-details/${resource.id}`, {
              state: { resourceId: resource.id }
            })}
            className="w-full py-2 px-3 bg-gradient-to-r from-lavender-600 to-purple-600 hover:from-lavender-700 hover:to-purple-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center justify-center"
          >
            <FiExternalLink className="mr-1" /> View Resource
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ResourcesList;