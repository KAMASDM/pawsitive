// src/components/Profile/components/UserInfo.jsx
import React from "react";
import { motion } from "framer-motion";
import { FiEdit2, FiMail, FiPhone, FiUser } from "react-icons/fi";

const UserInfo = ({ user }) => {
  // Function to get initials from name
  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className="relative overflow-hidden">
      {/* Background pattern */}
      {/* <div className="absolute inset-0 bg-gradient-to-r from-lavender-600 to-purple-600 opacity-5" />
      <div className="absolute -left-16 -top-16 w-64 h-64 rounded-full bg-lavender-100 opacity-30" />
      <div className="absolute right-0 bottom-0 w-32 h-32 rounded-full bg-lavender-200 opacity-30" /> */}
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative rounded-2xl bg-white p-6 sm:p-8 shadow-sm border border-lavender-100"
      >
        <div className="flex flex-col sm:flex-row items-center sm:items-start">
          {/* User Avatar */}
          <div className="mb-4 sm:mb-0 sm:mr-6">
            {user?.photoURL ? (
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-4 border-lavender-200 shadow-md">
                <img
                  src={user.photoURL}
                  alt={user.displayName || "User"}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-lavender-400 to-purple-500 text-white flex items-center justify-center text-3xl font-bold border-4 border-lavender-200 shadow-md">
                {getInitials(user?.displayName || user?.email || "User")}
              </div>
            )}
          </div>
          
          {/* User Information */}
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-2xl font-bold text-lavender-900 mb-2">
              {user?.displayName || "Pet Owner"}
            </h2>
            
            <div className="space-y-2">
              {user?.email && (
                <div className="flex items-center justify-center sm:justify-start text-gray-600">
                  <FiMail className="w-4 h-4 mr-2 text-lavender-600" />
                  <span>{user.email}</span>
                </div>
              )}
              
              {user?.phoneNumber && (
                <div className="flex items-center justify-center sm:justify-start text-gray-600">
                  <FiPhone className="w-4 h-4 mr-2 text-lavender-600" />
                  <span>{user.phoneNumber}</span>
                </div>
              )}
            </div>
            
            {/* User bio or additional info could go here */}
            <div className="mt-4 text-gray-600 text-sm">
              <p>Pet lover and dedicated owner. Managing pet profiles and connecting with other pet owners.</p>
            </div>
          </div>
          
          {/* Edit button */}
          {/* <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="absolute top-4 right-4 p-2 bg-lavender-100 text-lavender-700 hover:bg-lavender-200 rounded-full transition-colors"
          >
            <FiEdit2 className="w-4 h-4" />
          </motion.button> */}
        </div>
        
        {/* User stats */}
        <div className="mt-6 pt-6 border-t border-lavender-100 grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-lavender-900">{user?.pets?.length || 0}</p>
            <p className="text-sm text-gray-600">Pets</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-lavender-900">{user?.matingRequests?.length || 0}</p>
            <p className="text-sm text-gray-600">Requests</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-lavender-900">{user?.connections?.length || 0}</p>
            <p className="text-sm text-gray-600">Connections</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default UserInfo;