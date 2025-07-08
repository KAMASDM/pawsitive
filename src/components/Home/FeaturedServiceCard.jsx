import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FaArrowRight } from "react-icons/fa";

const FeaturedServiceCard = ({
  icon,
  title,
  description,
  location,
  buttonText,
  route,
  borderColor,
  isMobile,
}) => {
  const navigate = useNavigate();

  // Mobile simplified version (just icon and title)
  if (isMobile) {
    return (
      <motion.div
        className="flex flex-col items-center p-3 bg-white rounded-xl shadow-sm border border-lavender-100 cursor-pointer hover:shadow-md transition-all duration-300"
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => navigate(route)}
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0 },
        }}
      >
        <div className="text-2xl mb-2">{icon}</div>
        <h3 className="text-xs font-semibold text-lavender-900 text-center leading-tight">
          {title}
        </h3>
      </motion.div>
    );
  }

  // Desktop full version
  return (
    <motion.div
      className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 border border-lavender-100"
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.6 },
        },
      }}
      whileHover={{ y: -5 }}
    >
      <div className={`p-5 border-l-4 border-${borderColor}`}>
        <div className="flex items-center mb-3">
          <span className="text-3xl mr-3">{icon}</span>
          <h3 className="text-lg font-semibold text-lavender-900">{title}</h3>
        </div>
        <p className="text-gray-600 text-sm mb-3">{description}</p>
        <p className="text-xs text-gray-500 flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-3 w-3 mr-1 text-${borderColor}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          {location}
        </p>
      </div>
      <div className="px-5 py-3 bg-lavender-50 border-t border-lavender-100">
        <button
          onClick={() => navigate(route)}
          className={`text-${
            borderColor === "pink-500" ? "pink-600" : "lavender-700"
          } font-medium text-xs hover:text-${
            borderColor === "pink-500" ? "pink-800" : "lavender-900"
          } flex items-center transition-colors duration-200`}
        >
          {buttonText}
          <FaArrowRight className="ml-2 text-xs" />
        </button>
      </div>
    </motion.div>
  );
};

export default FeaturedServiceCard;
