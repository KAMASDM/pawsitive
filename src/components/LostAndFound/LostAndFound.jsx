import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaSearch, 
  FaMapMarkerAlt, 
  FaExclamationTriangle, 
  FaHeart,
  FaDog,
  FaCat,
  FaFilter,
  FaMap
} from 'react-icons/fa';
import { FiAlertCircle, FiCheckCircle, FiEye, FiMapPin } from 'react-icons/fi';
import ReportLostPet from './ReportLostPet';
import ReportFoundPet from './ReportFoundPet';
import BrowseLostPets from './BrowseLostPets';
import BrowseFoundPets from './BrowseFoundPets';
import LostFoundMap from './LostFoundMap';
import { getDatabase, ref, onValue, query, orderByChild } from 'firebase/database';
import useResponsive from '../../hooks/useResponsive';

const LostAndFound = () => {
  const [activeTab, setActiveTab] = useState('browse-lost');
  const [stats, setStats] = useState({
    totalLost: 0,
    totalFound: 0,
    reunited: 0,
    activeCases: 0
  });
  const { isMobile, isDesktop } = useResponsive();

  useEffect(() => {
    const db = getDatabase();
    
    // Listen to lost pets
    const lostPetsRef = ref(db, 'lostPets');
    const lostPetsQuery = query(lostPetsRef, orderByChild('createdAt'));
    const unsubscribeLost = onValue(lostPetsQuery, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const lostArray = Object.values(data);
        const active = lostArray.filter(pet => pet.status === 'lost').length;
        const reunited = lostArray.filter(pet => pet.status === 'reunited').length;
        setStats(prev => ({ 
          ...prev, 
          totalLost: lostArray.length,
          activeCases: active,
          reunited: reunited
        }));
      }
    });

    // Listen to found pets
    const foundPetsRef = ref(db, 'foundPets');
    const foundPetsQuery = query(foundPetsRef, orderByChild('createdAt'));
    const unsubscribeFound = onValue(foundPetsQuery, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setStats(prev => ({ ...prev, totalFound: Object.keys(data).length }));
      }
    });

    return () => {
      unsubscribeLost();
      unsubscribeFound();
    };
  }, []);

  const tabs = [
    { id: 'browse-lost', label: 'Lost Pets', icon: FiAlertCircle, color: 'red' },
    { id: 'browse-found', label: 'Found Pets', icon: FiCheckCircle, color: 'green' },
    { id: 'report-lost', label: 'Report Lost', icon: FaExclamationTriangle, color: 'violet' },
    { id: 'report-found', label: 'Report Found', icon: FaHeart, color: 'violet' },
    { id: 'map', label: 'Map View', icon: FaMap, color: 'indigo' }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'report-lost':
        return <ReportLostPet />;
      case 'report-found':
        return <ReportFoundPet />;
      case 'browse-lost':
        return <BrowseLostPets />;
      case 'browse-found':
        return <BrowseFoundPets />;
      case 'map':
        return <LostFoundMap />;
      default:
        return <BrowseLostPets />;
    }
  };

  if (isMobile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 pb-20">
        {/* Mobile Header */}
        <motion.div 
          className="bg-white shadow-lg"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="max-w-md mx-auto p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center mb-4"
            >
              <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                Lost & Found Pets
              </h1>
              <p className="text-gray-600 text-sm">
                Help reunite pets with their families
              </p>
            </motion.div>

            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                className="bg-gradient-to-br from-red-50 to-red-100 p-3 rounded-xl text-center"
              >
                <div className="text-2xl font-bold text-red-600">{stats.totalLost}</div>
                <div className="text-xs text-red-700 font-medium">Lost</div>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                className="bg-gradient-to-br from-green-50 to-green-100 p-3 rounded-xl text-center"
              >
                <div className="text-2xl font-bold text-green-600">{stats.totalFound}</div>
                <div className="text-xs text-green-700 font-medium">Found</div>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                className="bg-gradient-to-br from-violet-50 to-violet-100 p-3 rounded-xl text-center"
              >
                <div className="text-2xl font-bold text-violet-600">{stats.reunited}</div>
                <div className="text-xs text-violet-700 font-medium">Reunited</div>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-3 rounded-xl text-center"
              >
                <div className="text-2xl font-bold text-indigo-600">{stats.activeCases}</div>
                <div className="text-xs text-indigo-700 font-medium">Active</div>
              </motion.div>
            </div>

            {/* Quick Help Banner */}
            <div className="mb-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
              <div className="flex gap-3">
                <div className="text-2xl">ℹ️</div>
                <div className="flex-1">
                  <h4 className="font-bold text-slate-800 text-sm mb-1">How to Report a Lost Pet</h4>
                  <p className="text-xs text-gray-700 mb-2">
                    Click <strong className="text-violet-600">"Report Lost"</strong> tab above, then fill the 6-step form with your pet's details, photos, and last seen location.
                  </p>
                  <div className="flex gap-2 text-xs">
                    <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">🚨 Lost</span>
                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">✅ Found</span>
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">🗺️ Map</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
              {tabs.map((tab, index) => {
                const Icon = tab.icon;
                return (
                  <motion.button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg'
                        : 'bg-white text-gray-700 border border-violet-200 hover:border-violet-400'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Icon className="text-lg" />
                    <span className="text-sm">{tab.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // Desktop Version
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50">
      {/* Desktop Hero Section */}
      <motion.div 
        className="bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 py-20 relative overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* Animated Background Elements */}
        <motion.div
          className="absolute top-20 right-20 w-72 h-72 bg-violet-200 rounded-full mix-blend-multiply filter blur-xl opacity-30"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-20 left-20 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-30"
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [90, 0, 90],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        <div className="max-w-7xl mx-auto px-8 relative z-10">
          <div className="text-center mb-12">
            <motion.h1 
              className="text-5xl lg:text-6xl font-bold mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                Lost & Found Pets
              </span>
            </motion.h1>
            <motion.p 
              className="text-xl text-gray-700 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Together, we can help reunite pets with their families. Report, search, and spread the word.
            </motion.p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-6 max-w-5xl mx-auto mb-12">
            {[
              { label: 'Lost Pets', value: stats.totalLost, icon: FiAlertCircle, gradient: 'from-red-500 to-red-600' },
              { label: 'Found Pets', value: stats.totalFound, icon: FiCheckCircle, gradient: 'from-green-500 to-green-600' },
              { label: 'Reunited', value: stats.reunited, icon: FaHeart, gradient: 'from-violet-500 to-violet-600' },
              { label: 'Active Cases', value: stats.activeCases, icon: FiEye, gradient: 'from-indigo-500 to-indigo-600' }
            ].map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  className="bg-white p-6 rounded-2xl shadow-lg border border-violet-200 text-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -3 }}
                >
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${stat.gradient} mx-auto mb-3 flex items-center justify-center`}>
                    <Icon className="text-white text-xl" />
                  </div>
                  <div className="text-3xl font-bold text-slate-800 mb-1">{stat.value}</div>
                  <div className="text-sm text-gray-600 font-medium">{stat.label}</div>
                </motion.div>
              );
            })}
          </div>

          {/* Tab Navigation */}
          <div className="flex justify-center gap-4 flex-wrap">
            {tabs.map((tab, index) => {
              const Icon = tab.icon;
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-6 py-3 rounded-xl font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-xl'
                      : 'bg-white text-gray-700 border-2 border-violet-200 hover:border-violet-400 hover:shadow-lg'
                  }`}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + index * 0.05 }}
                >
                  <Icon className="text-xl" />
                  <span>{tab.label}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default LostAndFound;
