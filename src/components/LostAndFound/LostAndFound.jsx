import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { FaExclamationTriangle, FaHeart, FaMap } from 'react-icons/fa';
import { FiAlertCircle, FiCheckCircle, FiEye } from 'react-icons/fi';
import ReportLostPet from './ReportLostPet';
import ReportFoundPet from './ReportFoundPet';
import BrowseLostPets from './BrowseLostPets';
import BrowseFoundPets from './BrowseFoundPets';
import LostFoundMap from './LostFoundMap';
import { getDatabase, ref, onValue, query, orderByChild } from 'firebase/database';
import { ExperienceHero } from '../Experience/ExperiencePage';

const LostAndFound = () => {
  const location = useLocation();
  // Allow other pages (e.g. PetDashboard) to deep-link to a specific tab
  const initialTab = location.state?.openTab ?? 'browse-lost';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [stats, setStats] = useState({
    totalLost: 0,
    totalFound: 0,
    reunited: 0,
    activeCases: 0
  });

  useEffect(() => {
    if (location.state?.openTab) setActiveTab(location.state.openTab);
  }, [location.state?.openTab]);

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

  return (
    <div className="min-h-screen bg-[#f7f5fb] pb-28 md:pb-12">
      <ExperienceHero
        eyebrow="Community safety"
        title="Lost & found pets"
        description="Report quickly, search nearby cases and help reunite pets with their families."
        actions={
          <>
            <button onClick={() => setActiveTab('report-lost')} className="flex flex-1 items-center justify-center gap-2 rounded-full bg-rose-500 px-4 py-2.5 text-xs font-black text-white shadow-lg sm:flex-none"><FaExclamationTriangle /> Report lost pet</button>
            <button onClick={() => setActiveTab('report-found')} className="flex flex-1 items-center justify-center gap-2 rounded-full bg-white px-4 py-2.5 text-xs font-black text-[#3b305f] sm:flex-none"><FaHeart /> Report found pet</button>
          </>
        }
      />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Lost reports', value: stats.totalLost, icon: FiAlertCircle, tone: 'bg-rose-50 text-rose-600' },
            { label: 'Found reports', value: stats.totalFound, icon: FiCheckCircle, tone: 'bg-emerald-50 text-emerald-600' },
            { label: 'Reunited', value: stats.reunited, icon: FaHeart, tone: 'bg-violet-50 text-violet-600' },
            { label: 'Active cases', value: stats.activeCases, icon: FiEye, tone: 'bg-indigo-50 text-indigo-600' },
          ].map(({ label, value, icon: Icon, tone }) => (
            <div key={label} className="flex items-center gap-3 rounded-2xl border border-white bg-white/85 p-3 shadow-sm sm:p-4">
              <span className={`grid h-10 w-10 flex-none place-items-center rounded-xl ${tone}`}><Icon /></span>
              <span><strong className="block text-xl font-black text-[#30274e]">{value}</strong><span className="text-[10px] font-semibold text-slate-500 sm:text-xs">{label}</span></span>
            </div>
          ))}
        </section>

        <nav className="mt-6 flex gap-2 overflow-x-auto rounded-2xl border border-white bg-white/80 p-2 shadow-sm scrollbar-hide">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex flex-none items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${activeTab === tab.id ? 'bg-[#4a3d7d] text-white shadow-md' : 'text-slate-500 hover:bg-violet-50 hover:text-violet-700'}`}>
                <Icon /> {tab.label}
              </button>
            );
          })}
        </nav>

        <div className="mt-6">
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
      </main>
    </div>
  );
};

export default LostAndFound;
