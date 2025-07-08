import React from 'react';
import { motion } from 'framer-motion';
import { FiBookmark, FiExternalLink } from 'react-icons/fi';
import EmptyState from './EmptyState';

const DesktopResourcesSection = ({ resources, navigate }) => (
  <motion.div
    key="resources"
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    transition={{ duration: 0.3 }}
  >
    {resources.length > 0 ? (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {resources.map((resource, index) => (
          <motion.div
            key={resource.id}
            className="bg-white rounded-2xl overflow-hidden shadow-lg border border-violet-100"
            whileHover={{ scale: 1.05, y: -5 }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="h-48 bg-gradient-to-br from-violet-100 to-indigo-100">
              {resource.image ? (
                <img
                  src={resource.image}
                  alt={resource.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <FiBookmark className="text-violet-400 text-3xl" />
                </div>
              )}
            </div>

            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-bold text-slate-800 flex-1">
                  {resource.name}
                </h3>
                <span className="bg-violet-100 text-violet-700 px-2 py-1 rounded-full text-xs ml-2">
                  {resource.category}
                </span>
              </div>

              <p className="text-gray-600 mb-4 line-clamp-2">
                {resource.description}
              </p>

              <button
                onClick={() => navigate(`/resource/${resource.id}`)}
                className="w-full bg-gradient-to-r from-violet-400 to-indigo-400 text-white py-2 rounded-lg font-medium hover:from-violet-500 hover:to-indigo-500 transition-all duration-300 flex items-center justify-center"
              >
                View Resource <FiExternalLink className="ml-2" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    ) : (
      <EmptyState
        icon={<FiBookmark className="w-12 h-12 text-violet-400" />}
        title="No Saved Resources"
        description="Resources you save will appear here for easy access"
        buttonText="Browse Resources"
        onButtonClick={() => navigate('/resources')}
        large
      />
    )}
  </motion.div>
);

export default DesktopResourcesSection;