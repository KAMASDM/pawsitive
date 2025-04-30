import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaSearch, FaHeart, FaDog, FaCat } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

const HeroSection = () => {
  const navigate = useNavigate();
  const [showCategoryOptions, setShowCategoryOptions] = useState(false);

  const handleSearchClick = () => {
    setShowCategoryOptions(true);
  };

  const handleCategorySelect = (category) => {
    if (category === "dog") {
      navigate("/dog-resources");
    } else if (category === "cat") {
      navigate("/cat-resources");
    }
  };

  return (
    <div className="relative bg-gradient-to-r from-lavender-700 to-purple-800 text-white py-20 md:py-28 rounded-b-[40px] shadow-xl overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -right-24 -top-24 w-64 h-64 bg-lavender-500 rounded-full opacity-20"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 10, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute left-1/2 bottom-0 w-96 h-96 bg-purple-600 rounded-full opacity-10 transform -translate-x-1/2 translate-y-1/2"
          animate={{
            scale: [1, 1.1, 1],
            x: ["-50%", "-45%", "-50%"],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute left-1/4 top-1/4 w-32 h-32 bg-lavender-400 rounded-full opacity-10"
          animate={{
            y: [0, -20, 0],
            x: [0, 15, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>
      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.8,
            staggerChildren: 0.2,
          }}
        >
          <motion.h1
            className="text-4xl md:text-6xl font-bold mb-4 tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Pawppy <span className="text-lavender-200">Resources</span>
          </motion.h1>
          <motion.p
            className="text-lg md:text-xl mb-10 text-lavender-100 max-w-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            Connecting pet parents with the resources they need for happy,
            healthy furry companions.
          </motion.p>
          <AnimatePresence mode="wait">
            {!showCategoryOptions ? (
              <motion.div
                className="flex flex-col sm:flex-row gap-4"
                key="search-buttons"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                <motion.button
                  onClick={handleSearchClick}
                  className="group bg-white text-lavender-800 hover:bg-lavender-50 px-8 py-4 rounded-full font-medium transition-all duration-300 shadow-md hover:shadow-xl flex items-center justify-center"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <FaSearch className="mr-2 group-hover:scale-110 transition-transform duration-300" />
                  Search Resources
                </motion.button>
                <motion.button
                  onClick={() => navigate("/nearby-mates")}
                  className="group bg-transparent hover:bg-lavender-600 border-2 border-white px-8 py-4 rounded-full font-medium transition-all duration-300 flex items-center justify-center mt-3 sm:mt-0 hover:shadow-lg"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <FaHeart className="mr-2 group-hover:scale-110 transition-transform duration-300" />
                  Find Nearby Mates
                </motion.button>
              </motion.div>
            ) : (
              <motion.div
                className="flex flex-col sm:flex-row gap-4"
                key="category-buttons"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                <motion.button
                  onClick={() => handleCategorySelect("dog")}
                  className="group bg-white text-lavender-800 hover:bg-lavender-50 px-8 py-4 rounded-full font-medium transition-all duration-300 shadow-md hover:shadow-xl flex items-center justify-center"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <FaDog className="mr-2 group-hover:scale-110 transition-transform duration-300" />
                  Dog Resources
                </motion.button>
                <motion.button
                  onClick={() => handleCategorySelect("cat")}
                  className="group bg-white text-lavender-800 hover:bg-lavender-50 px-8 py-4 rounded-full font-medium transition-all duration-300 shadow-md hover:shadow-xl flex items-center justify-center"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <FaCat className="mr-2 group-hover:scale-110 transition-transform duration-300" />
                  Cat Resources
                </motion.button>
                <motion.button
                  onClick={() => setShowCategoryOptions(false)}
                  className="group bg-transparent hover:bg-lavender-600 border-2 border-white px-8 py-4 rounded-full font-medium transition-all duration-300 flex items-center justify-center mt-3 sm:mt-0"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default HeroSection;
