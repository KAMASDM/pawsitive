import React from 'react';
import { motion } from 'framer-motion';
import { FiBookmark, FiExternalLink } from 'react-icons/fi';
import EmptyState from './EmptyState'; // We will create this component next

const ResourcesSection = ({ resources, navigate }) => (
  <motion.div
    key="resources"
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    transition={{ duration: 0.3 }}
  >
    {resources.length > 0 ? (
      <div className="space-y-4">
        {resources.map((resource, index) => (
          <motion.div
            key={resource.id}
            className="bg-white rounded-2xl overflow-hidden shadow-md border border-violet-100"
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="flex">
              <div className="w-24 h-24 bg-gradient-to-br from-violet-100 to-indigo-100 flex-shrink-0">
                {resource.image ? (
                  <img
                    src={resource.image}
                    alt={resource.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FiBookmark className="text-violet-400 text-xl" />
                  </div>
                )}
              </div>
              <div className="flex-1 p-4">
                <h3 className="font-semibold text-slate-800 text-base mb-1">
                  {resource.name}
                </h3>
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                  {resource.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="bg-violet-100 text-violet-700 px-2 py-1 rounded-full text-xs">
                    {resource.category}
                  </span>
                  <button
                    onClick={() => navigate(`/resource/${resource.id}`)}
                    className="text-violet-600 hover:text-violet-800 text-sm font-medium flex items-center"
                  >
                    View <FiExternalLink className="ml-1 w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    ) : (
      <EmptyState
        icon={<FiBookmark className="w-8 h-8 text-violet-400" />}
        title="No Saved Resources"
        description="Resources you save will appear here for easy access"
        buttonText="Browse Resources"
        onButtonClick={() => navigate('/resources')}
      />
    )}
  </motion.div>
);

export default ResourcesSection;