// src/components/Profile/components/CommentsList.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { FiMessageSquare, FiExternalLink, FiCalendar } from 'react-icons/fi';

const CommentsList = ({ comments = [], navigate }) => {
  // Format date for display
  const formatDate = (dateValue) => {
    if (!dateValue) return "Unknown date";

    let date;
    if (dateValue.toDate) {
      date = dateValue.toDate();
    } else if (dateValue instanceof Date) {
      date = dateValue;
    } else {
      date = new Date(dateValue);
    }

    // Format: Jan 1, 2025, 3:30 PM
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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
      <div className="flex items-center mb-6">
        <FiMessageSquare className="w-5 h-5 text-lavender-700 mr-2" />
        <h2 className="text-xl font-bold text-lavender-900">My Comments</h2>
      </div>

      {comments.length > 0 ? (
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-4"
        >
          {comments.map((comment) => (
            <motion.div 
              key={comment.id} 
              variants={item}
              className="bg-white rounded-xl border border-lavender-100 overflow-hidden hover:shadow-md transition-shadow duration-300"
            >
              <div className="p-4 border-b border-lavender-100 bg-gradient-to-r from-lavender-50 to-white">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium text-lavender-900">{comment.resourceName}</h3>
                  <div className="flex items-center text-xs text-gray-500">
                    <FiCalendar className="w-3 h-3 mr-1" />
                    {formatDate(comment.createdAt)}
                  </div>
                </div>
              </div>
              
              <div className="p-4">
                <p className="text-gray-700 text-sm mb-4">{comment.text}</p>
                
                <button
                  onClick={() => navigate(`/resource-details/${comment.resourceId}`, {
                    state: { resourceId: comment.resourceId },
                  })}
                  className="inline-flex items-center text-sm font-medium text-lavender-700 hover:text-lavender-900 transition-colors"
                >
                  <span>View Resource</span>
                  <FiExternalLink className="ml-1 w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-lavender-50 rounded-xl p-8 flex flex-col items-center text-center"
        >
          <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-sm">
            <FiMessageSquare className="w-7 h-7 text-lavender-400" />
          </div>
          
          <h3 className="text-lg font-semibold text-lavender-900 mb-2">
            No Comments Yet
          </h3>
          
          <p className="text-gray-600 max-w-md mb-6">
            You haven't commented on any resources yet. Share your thoughts and join the conversation!
          </p>
          
          <button
            onClick={() => navigate('/resources')}
            className="px-4 py-2 bg-lavender-600 hover:bg-lavender-700 text-white rounded-full transition-colors shadow-sm"
          >
            Browse Resources
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default CommentsList;