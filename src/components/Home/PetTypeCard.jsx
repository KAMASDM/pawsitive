import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { IoIosArrowForward } from "react-icons/io";

const PetTypeCard = ({
  petType,
  emoji,
  description,
  icons,
  route,
  isMobile,
}) => {
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
      whileHover={{
        y: isMobile ? -4 : -8,
        boxShadow: isMobile
          ? "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)"
          : "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300 }}
      className="bg-white rounded-2xl shadow-md overflow-hidden cursor-pointer border border-lavender-100"
      onClick={handleCardClick}
    >
      <div
        className={`${
          isMobile ? "h-32" : "h-48 md:h-56"
        } bg-gradient-to-br from-lavender-100 to-lavender-200 flex items-center justify-center relative overflow-hidden`}
      >
        <div
          className={`absolute ${
            petType === "dog" ? "-right-6" : "-left-6"
          } -bottom-6 ${
            isMobile ? "w-24 h-24" : "w-32 h-32"
          } bg-lavender-300 rounded-full opacity-40`}
        ></div>
        <div className={`${isMobile ? "text-5xl" : "text-8xl"}`}>{emoji}</div>
      </div>

      <div
        className={`${isMobile ? "p-4" : "p-6"} border-t border-lavender-100`}
      >
        <h3
          className={`${
            isMobile ? "text-sm text-center" : "text-xl"
          } font-bold mb-2 text-lavender-900`}
        >
          {petType === "dog" ? "Dog" : "Cat"} Resources
        </h3>

        {!isMobile && (
          <p className="mb-4 text-gray-600 text-sm">{description}</p>
        )}

        <div
          className={`flex justify-between items-center ${
            isMobile ? "hidden" : ""
          }`}
        >
          <div className="flex space-x-2">
            {icons.slice(0, isMobile ? 3 : 4).map((Icon, index) => (
              <span
                key={index}
                className={`${
                  isMobile ? "h-6 w-6" : "h-8 w-8"
                } rounded-full bg-lavender-100 flex items-center justify-center shadow-sm`}
              >
                <Icon
                  className="text-lavender-700"
                  size={isMobile ? 12 : index === 2 || index === 3 ? 16 : 14}
                />
              </span>
            ))}
          </div>
          <button
            onClick={handleViewAllClick}
            className={`text-lavender-600 font-medium flex items-center group hover:text-lavender-800 ${
              isMobile ? "text-sm hidden" : ""
            }`}
          >
            {isMobile ? "View" : "View All"}
            <IoIosArrowForward className="ml-1 group-hover:ml-2 transition-all duration-300" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default PetTypeCard;
