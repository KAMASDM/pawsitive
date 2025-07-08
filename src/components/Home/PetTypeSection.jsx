import React from "react";
import { motion } from "framer-motion";
import PetTypeCard from "./PetTypeCard";
import { FaPaw, FaHospital, FaBone } from "react-icons/fa";
import { MdPets, MdOutlinePets } from "react-icons/md";

const PetTypeSection = ({ isMobile }) => {
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  };

  const dogIcons = [FaHospital, FaBone, MdPets, FaPaw];
  const catIcons = [FaHospital, FaBone, MdPets, MdOutlinePets];

  return (
    <motion.div
      className={`max-w-6xl mx-auto px-6 ${isMobile ? "py-4" : "py-16"}`}
      initial="hidden"
      animate="visible"
      variants={fadeIn}
    >
      <h2
        className={`${
          isMobile ? "text-xl mb-4" : "text-2xl md:text-3xl"
        } font-bold text-center text-lavender-900 mb-2`}
      >
        Choose Your Pet
      </h2>
      <p
        className={`${
          isMobile && "!hidden "
        }text-gray-600 text-center mb-8 max-w-2xl mx-auto text-sm`}
      >
        Select your pet type to discover tailored resources and services
      </p>
      <div className="grid grid-cols-2 gap-6">
        <PetTypeCard
          petType="dog"
          emoji="🐕"
          description="Find everything your canine companion needs - from healthcare and nutrition to training and supplies."
          icons={dogIcons}
          route="/dog-resources"
          isMobile={isMobile}
        />
        <PetTypeCard
          petType="cat"
          emoji="🐈"
          description="Discover all the essentials for your feline friend - from health services and food to toys and grooming."
          icons={catIcons}
          route="/cat-resources"
          isMobile={isMobile}
        />
      </div>
    </motion.div>
  );
};

export default PetTypeSection;
