import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const AdoptionCard = ({
  emoji,
  title,
  description,
  buttonText,
  route,
  gradientFrom,
  gradientTo,
}) => {
  const navigate = useNavigate();
  return (
    <motion.div
      className="bg-white rounded-2xl shadow-md overflow-hidden border border-lavender-100"
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.6 },
        },
      }}
      whileHover={{ y: -8 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <div
        className={`h-64 bg-gradient-to-r from-${gradientFrom} to-${gradientTo} flex items-center justify-center relative overflow-hidden`}
      >
        <div
          className={`absolute -${
            title === "Adopt a Pet" ? "left" : "right"
          }-12 -bottom-12 w-48 h-48 bg-${
            title === "Adopt a Pet" ? "pink" : "lavender"
          }-300 rounded-full opacity-30`}
        ></div>
        <div
          className={`absolute ${
            title === "Adopt a Pet" ? "right" : "left"
          }-12 top-12 w-24 h-24 bg-${
            title === "Adopt a Pet" ? "lavender" : "pink"
          }-300 rounded-full opacity-30`}
        ></div>
        <div className="text-9xl relative z-10">{emoji}</div>
      </div>
      <div className="p-6">
        <h3 className="text-xl font-bold text-lavender-900 mb-3">{title}</h3>
        <p className="text-gray-600 mb-6">{description}</p>
        <button
          onClick={() => navigate(route)}
          className="w-full bg-gradient-to-r from-lavender-600 to-purple-600 hover:from-lavender-700 hover:to-purple-700 text-white py-3 rounded-full font-medium transition-all duration-300 shadow-md hover:shadow-lg"
        >
          {buttonText}
        </button>
      </div>
    </motion.div>
  );
};

export default AdoptionCard;
