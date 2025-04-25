// src/components/Home/ResourceFinderSection.jsx
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaSearch, FaDog, FaCat } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import useWindowSize from "../../hooks/useWindowSize";

const ResourceFinderSection = () => {
  const navigate = useNavigate();
  const [showOptions, setShowOptions] = useState(false);
  const { width } = useWindowSize();
  const isMobile = width < 768;

  const handleOptionClick = (type) => {
    if (type === "dog") {
      navigate("/dog-resources");
    } else if (type === "cat") {
      navigate("/cat-resources");
    }
  };

  return (
    <motion.div
      className={`max-w-6xl mx-auto px-6 ${isMobile ? '-mb-6' : '-mb-16'} relative z-10`}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true, margin: "-100px" }}
    >
      <motion.div 
        className="bg-white rounded-2xl shadow-xl p-8 flex flex-col md:flex-row items-center border border-lavender-200 overflow-hidden relative"
        whileHover={{ y: -5, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        {/* Animated background elements */}
        <motion.div 
          className="absolute top-0 right-0 w-64 h-64 bg-lavender-100 rounded-full opacity-20 transform translate-x-1/3 -translate-y-1/2"
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 5, 0] 
          }}
          transition={{ 
            duration: 8, 
            repeat: Infinity,
            ease: "easeInOut" 
          }}
        />
        <motion.div 
          className="absolute bottom-0 left-0 w-48 h-48 bg-pink-100 rounded-full opacity-20 transform -translate-x-1/3 translate-y-1/3"
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, -8, 0] 
          }}
          transition={{ 
            duration: 12, 
            repeat: Infinity,
            ease: "easeInOut" 
          }}
        />

        <div className="md:w-2/3 mb-6 md:mb-0 md:pr-8 relative z-10">
          <h2 className="text-2xl font-bold text-lavender-900 mb-3">
            Need help finding the right resources?
          </h2>
          <p className="text-gray-600 mb-6">
            Not sure what your pet needs? Our resource finder can help you discover the perfect services and products for your furry friend.
          </p>

          <AnimatePresence mode="wait">
            {!showOptions ? (
              <motion.button
                key="finder-button"
                onClick={() => setShowOptions(true)}
                className="group bg-gradient-to-r from-lavender-600 to-purple-600 text-white px-6 py-3 rounded-full text-sm font-medium hover:from-lavender-700 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg flex items-center"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <FaSearch className="mr-2 group-hover:scale-110 transition-transform duration-300" />
                Try Resource Finder
              </motion.button>
            ) : (
              <motion.div 
                key="option-buttons"
                className="flex flex-col sm:flex-row gap-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <motion.button
                  onClick={() => handleOptionClick("dog")}
                  className="group bg-gradient-to-r from-lavender-600 to-purple-600 text-white px-6 py-3 rounded-full text-sm font-medium hover:from-lavender-700 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <FaDog className="mr-2 group-hover:scale-110 transition-transform duration-300" /> 
                  Dog Resources
                </motion.button>
                <motion.button
                  onClick={() => handleOptionClick("cat")}
                  className="group bg-gradient-to-r from-lavender-600 to-purple-600 text-white px-6 py-3 rounded-full text-sm font-medium hover:from-lavender-700 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <FaCat className="mr-2 group-hover:scale-110 transition-transform duration-300" /> 
                  Cat Resources
                </motion.button>
                <motion.button
                  onClick={() => setShowOptions(false)}
                  className="group bg-lavender-100 text-lavender-800 hover:bg-lavender-200 px-6 py-3 rounded-full text-sm font-medium transition-all duration-300 flex items-center justify-center"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Cancel
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="md:w-1/3 flex justify-center relative z-10">
          <motion.div 
            className="text-7xl bg-gradient-to-br from-lavender-200 to-lavender-100 p-5 rounded-full shadow-inner flex items-center justify-center h-28 w-28"
            whileHover={{ 
              rotate: [0, -5, 5, -5, 0],
              scale: 1.05
            }}
            animate={{ 
              y: [0, -5, 0],
              boxShadow: ["inset 0 2px 10px rgba(0,0,0,0.1)", "inset 0 5px 15px rgba(0,0,0,0.15)", "inset 0 2px 10px rgba(0,0,0,0.1)"]
            }}
            transition={{ 
              duration: 3, 
              repeat: Infinity,
              ease: "easeInOut",
              rotate: [0, -5, 5, -5, 0],
              scale: 1.05
            }}
          >
            🔍
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ResourceFinderSection;