// src/components/Home/PetTypeCard.jsx
import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { IoIosArrowForward } from "react-icons/io";

const PetTypeCard = ({ petType, emoji, description, icons, route }) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(route);
  };

  const handleViewAllClick = (e) => {
    e.stopPropagation();
    navigate(route);
  };

  return (
    <motion.div
      whileHover={{ y: -8, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
      transition={{ type: "spring", stiffness: 300 }}
      className="bg-white rounded-2xl shadow-md overflow-hidden cursor-pointer border border-lavender-100"
      onClick={handleCardClick}
    >
      <div className="h-48 md:h-56 bg-gradient-to-br from-lavender-100 to-lavender-200 flex items-center justify-center relative overflow-hidden">
        <div className={`absolute ${petType === "dog" ? "-right-6" : "-left-6"} -bottom-6 w-32 h-32 bg-lavender-300 rounded-full opacity-40`}></div>
        <div className="text-8xl">{emoji}</div>
      </div>
      <div className="p-6 border-t border-lavender-100">
        <h3 className="text-xl font-bold mb-3 text-lavender-900">{petType === "dog" ? "Dog" : "Cat"} Resources</h3>
        <p className="mb-4 text-gray-600">{description}</p>
        <div className="flex justify-between items-center">
          <div className="flex space-x-2">
            {icons.map((Icon, index) => (
              <span key={index} className="h-8 w-8 rounded-full bg-lavender-100 flex items-center justify-center shadow-sm">
                <Icon className="text-lavender-700" size={index === 2 || index === 3 ? 16 : 14} />
              </span>
            ))}
          </div>
          <button
            onClick={handleViewAllClick}
            className="text-lavender-600 font-medium flex items-center group hover:text-lavender-800"
          >
            View All
            <IoIosArrowForward className="ml-1 group-hover:ml-2 transition-all duration-300" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default PetTypeCard;