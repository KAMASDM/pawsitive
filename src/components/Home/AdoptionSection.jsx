import React from "react";
import { motion } from "framer-motion";
import AdoptionCard from "./AdoptionCard";

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const adoptionCards = [
  {
    emoji: "🐶",
    title: "Adopt a Pet",
    description:
      "Browse through available pets looking for a loving home. Find the perfect companion for your family.",
    buttonText: "Find Adoptable Pets",
    route: "/adopt-pets",
    gradientFrom: "pink-200",
    gradientTo: "lavender-400",
    buttonGradientFrom: "lavender-600",
    buttonGradientTo: "lavender-700",
  },
  {
    emoji: "🐾",
    title: "Find a Mate for Your Pet",
    description:
      "Looking for a companion for your pet? Connect with nearby pet owners for safe and responsible mating.",
    buttonText: "Find Mating Partner",
    route: "/nearby-mates",
    gradientFrom: "pink-200",
    gradientTo: "lavender-400",
    buttonGradientFrom: "lavender-600",
    buttonGradientTo: "lavender-700",
  },
];
const AdoptionSection = () => {
  return (
    <div className="bg-gradient-to-b from-pink-50 to-lavender-50 pt-28 pb-16 mt-8 rounded-t-[40px]">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl md:text-3xl font-bold text-lavender-900 mb-3">
            Find Your New Best Friend
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Browse pets available for adoption or share your own pet for
            adoption. Help pets find their forever homes!
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
        >
          {adoptionCards.map((card, index) => (
            <AdoptionCard key={index} {...card} />
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default AdoptionSection;
