// src/components/Profile/components/ResourcesList.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiHeart, FiBookmark, FiSearch, FiFilter, FiExternalLink, FiX } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const ResourcesList = ({ resources = [] }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  
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
    <div className="bg-white rounded-2xl shadow-sm border border-lavender-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-lavender-900 flex items-center">
          <FiBookmark className="mr-2 text-lavender-600" />
          Liked Resources
        </h2>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-lg border border-lavender-200 focus:outline-none focus:ring-2 focus:ring-lavender-500 focus:border-transparent text-sm w-48 sm:w-auto"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <FiX className="w-4 h-4" />
              </button>
            )}
          </div>
          
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="px-3 py-2 rounded-lg border border-lavender-200 focus:outline-none focus:ring-2 focus:ring-lavender-500 focus:border-transparent text-sm bg-white"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="az">A-Z</option>
            <option value="za">Z-A</option>
          </select>
        </div>
      </div>
      
      {/* Category Filter Tabs */}
      <div className="mb-6 overflow-x-auto pb-2 hide-scrollbar">
        <div className="flex gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveFilter(category)}
              className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                activeFilter === category
                  ? 'bg-lavender-600 text-white'
                  : 'bg-lavender-50 text-lavender-800 hover:bg-lavender-100'
              }`}
            >
              {category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>
      
      {/* Resource Cards */}
      {filteredResources.length > 0 ? (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
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
        <div className="bg-lavender-50 rounded-xl p-8 flex flex-col items-center text-center">
          <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-sm">
            <FiBookmark className="w-7 h-7 text-lavender-400" />
          </div>
          
          {searchQuery ? (
            <>
              <h3 className="text-lg font-semibold text-lavender-900 mb-2">
                No Matching Resources
              </h3>
              <p className="text-gray-600 max-w-md mb-6">
                No resources match your search criteria. Try adjusting your search or filters.
              </p>
            </>
          ) : (
            <>
              <h3 className="text-lg font-semibold text-lavender-900 mb-2">
                No Liked Resources Yet
              </h3>
              <p className="text-gray-600 max-w-md mb-6">
                You haven't liked any resources yet. Explore our collection and save your favorites here.
              </p>
            </>
          )}
          
          <button
            onClick={() => navigate('/resources')}
            className="px-4 py-2 bg-lavender-600 hover:bg-lavender-700 text-white rounded-full transition-colors shadow-sm"
          >
            Browse Resources
          </button>
        </div>
      )}
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
      className="bg-white rounded-xl border border-lavender-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
    >
      {/* Card Image */}
      <div className="h-36 bg-lavender-100 relative">
        {resource.image ? (
          <img 
            src={resource.image} 
            alt={resource.name} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-lavender-100 to-lavender-200">
            <FiBookmark className="w-10 h-10 text-lavender-400" />
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
      </div>
      
      {/* Card Content */}
      <div className="p-4">
        <h3 className="font-bold text-lavender-900 mb-1 line-clamp-1">{resource.name}</h3>
        
        {resource.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {resource.description}
          </p>
        )}
        
        <div className="flex justify-between items-center">
          <div className="text-xs text-gray-500">
            {formatDate(resource.createdAt)}
          </div>
          
          <button
            onClick={() => navigate(`/resource-details/${resource.id}`, {
              state: { resourceId: resource.id }
            })}
            className="flex items-center text-xs font-medium text-lavender-700 hover:text-lavender-900 transition-colors"
          >
            <span>View</span>
            <FiExternalLink className="ml-1 w-3 h-3" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ResourcesList;