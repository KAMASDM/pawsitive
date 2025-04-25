// src/components/Home/FeaturedServicesSection.jsx
import React from "react";
import { motion } from "framer-motion";
import FeaturedServiceCard from "./FeaturedServiceCard";

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const featuredServices = [
  {
    icon: "🏥",
    title: "24/7 Pet Emergency",
    description:
      "Round-the-clock emergency care for your pets when they need it most.",
    location: "Race Course Circle, Vadodara",
    buttonText: "Find Emergency Clinics",
    route: "/resources/pet_emergency_24_7",
    borderColor: "lavender-500",
  },
  {
    icon: "🐾",
    title: "Pet Adoption",
    description:
      "Find a new furry family member or help a pet find their forever home.",
    location: "Available in all regions",
    buttonText: "Browse Adoptable Pets",
    route: "/resources/adoption",
    borderColor: "pink-500",
  },
  {
    icon: "❤️",
    title: "Pet Mating Services",
    description:
      "Find the perfect match for your pet with verified profiles and breed information.",
    location: "Available in all regions",
    buttonText: "Find Nearby Mates",
    route: "/nearby-mates",
    borderColor: "lavender-500",
  },
];
const FeaturedServicesSection = () => {
  return (
    <div className="bg-gradient-to-b from-lavender-50 to-white py-16">
      <motion.div
        className="max-w-6xl mx-auto px-6"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={staggerContainer}
      >
        <h2 className="text-2xl md:text-3xl font-bold text-center text-lavender-900 mb-2">
          Featured Pet Services
        </h2>
        <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
          Discover our most popular and essential services for your pets
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredServices.map((service, index) => (
            <FeaturedServiceCard key={index} {...service} />
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default FeaturedServicesSection;
