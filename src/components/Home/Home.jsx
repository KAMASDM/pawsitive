import React, { useState, useEffect } from "react";
import SkeletonLoader from "../Loaders/SkeletonLoader";
import HeroSection from "./HeroSection";
import PetTypeSection from "./PetTypeSection";
import FeaturedServicesSection from "./FeaturedServicesSection";
import ResourceFinderSection from "./ResourceFinderSection";
import AdoptionSection from "./AdoptionSection";
import { motion, AnimatePresence } from "framer-motion";
import useWindowSize from "../../hooks/useWindowSize";

const Home = () => {
  const [loading, setLoading] = useState(true);
  const { width } = useWindowSize();
  const isMobile = width < 768;

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-lavender-50 to-white p-6">
        <div className="max-w-7xl mx-auto">
          <SkeletonLoader type="list" count={9} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-lavender-50 to-white overflow-hidden">
      <AnimatePresence>
        {!isMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <HeroSection />
          </motion.div>
        )}
      </AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className={isMobile ? "pt-6" : ""}
      >
        <PetTypeSection />
        <FeaturedServicesSection />
        <ResourceFinderSection />
        <AdoptionSection />
      </motion.div>
    </div>
  );
};

export default Home;
