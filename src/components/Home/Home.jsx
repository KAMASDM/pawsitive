import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FaSearch, FaHeart, FaDog, FaCat, FaArrowRight } from "react-icons/fa";
import { IoIosArrowForward } from "react-icons/io";

const quickActions = [
  { icon: "🚨", title: "Emergency", subtitle: "24/7 Care", description: "Round-the-clock emergency veterinary services", color: "from-purple-300 to-purple-400", route: "/resource", state: { category: "all", subCategory: "Health & Wellness" } },
  { icon: "🐾", title: "Adopt", subtitle: "Find Pets", description: "Browse verified pets looking for loving homes", color: "from-violet-300 to-violet-400", route: "/adopt-pets" },
  { icon: "💕", title: "Mates", subtitle: "Find Partner", description: "Connect with nearby pets for responsible breeding", color: "from-indigo-300 to-indigo-400", route: "/nearby-mates" },
  { icon: "🏥", title: "Care", subtitle: "Health Services", description: "Complete healthcare and wellness services", color: "from-slate-300 to-slate-400", route: "/resource", state: { category: "all", subCategory: "Nutrition" } }
];

const services = [
  { icon: "🏥", title: "Emergency Care", description: "24/7 veterinary emergency services", details: "Round-the-clock emergency care with certified veterinarians", badge: "24/7", color: "purple", route: "/resource", stats: "50+ Vets Available", state: { category: "all", subCategory: "Health & Wellness" } },
  { icon: "🐾", title: "Pet Adoption", description: "Find your perfect companion", details: "Verified pets with health checkups and adoption support", badge: "500+", color: "violet", route: "/resource", stats: "500+ Happy Adoptions", state: { category: "all", subCategory: "Adoption" } },
  { icon: "💕", title: "Pet Mating", description: "Safe breeding services", details: "Health-verified pets with breed matching services", badge: "Verified", color: "indigo", route: "/nearby-mates", stats: "200+ Successful Matches" }
];

const adoptionCards = [
  { emoji: "🐶", title: "Adopt a Pet", count: "500+ Pets", color: "from-violet-100 to-purple-200", route: "/adopt-pets" },
  { emoji: "💕", title: "Find Mates", count: "200+ Matches", color: "from-indigo-100 to-violet-200", route: "/nearby-mates" }
];

const petResources = [
  { emoji: "🐕", title: "Dog Care", services: "150+ Services", color: "from-purple-100 to-violet-200", route: "/dog-resources" },
  { emoji: "🐈", title: "Cat Care", services: "120+ Services", color: "from-indigo-100 to-purple-200", route: "/cat-resources" }
];

const featuredStats = [
  { icon: "👥", number: "10,000+", label: "Pet Owners" },
  { icon: "🏥", number: "50+", label: "Vet Clinics" },
  { icon: "🐾", number: "500+", label: "Adoptions" },
  { icon: "⭐", number: "4.9", label: "Rating" }
];

const MobileVersion = ({ activeTab, setActiveTab, showSearchOptions, setShowSearchOptions, handlePetTypeSelect }) => {
  const navigate = useNavigate();

  return (
    <div className="relative z-10 p-4 max-w-md mx-auto min-h-screen flex flex-col">
      <motion.div className="text-center mb-6" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent mb-2">Pawppy</h1>
        <p className="text-gray-600 text-sm">Everything your pet needs, simplified</p>
      </motion.div>

      <motion.div className="mb-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}>
        <div className="grid grid-cols-4 gap-3">
          {quickActions.map((action, index) => (
            <motion.button
              key={index}
              onClick={() => navigate(action.route, { state: action.state })}
              className={`bg-lavender-400 text-white p-3 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 text-center border border-purple-50`}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 + index * 0.1 }}
            >
              <div className="text-2xl mb-1">{action.icon}</div>
              <div className="text-xs font-medium">{action.title}</div>
              <div className="text-xs opacity-90">{action.subtitle}</div>
            </motion.button>
          ))}
        </div>
      </motion.div>

      <motion.div className="mb-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
        <AnimatePresence mode="wait">
          {!showSearchOptions ? (
            <motion.button key="search" onClick={() => setShowSearchOptions(true)} className="w-full bg-white rounded-2xl p-4 shadow-md border border-violet-100 flex items-center justify-center group hover:shadow-lg transition-all duration-300" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <FaSearch className="mr-3 text-violet-500 group-hover:scale-110 transition-transform duration-300" />
              <span className="text-slate-700 font-medium">Search pet resources...</span>
            </motion.button>
          ) : (
            <motion.div key="options" className="bg-white rounded-2xl p-4 shadow-md border border-violet-100" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <motion.button
                  onClick={() => navigate("/resource", { state: { category: "dog", subCategory: "all" } })}
                  className="flex items-center p-3 bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl hover:from-purple-100 hover:to-violet-100 transition-all duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FaDog className="mr-2 text-purple-500 text-lg" />
                  <span className="text-slate-700 font-medium text-sm">Dogs</span>
                </motion.button>
                <motion.button
                  onClick={() => navigate("/resource", { state: { category: "cat", subCategory: "all" } })}
                  className="flex items-center p-3 bg-gradient-to-r from-indigo-50 to-violet-50 rounded-xl hover:from-indigo-100 hover:to-violet-100 transition-all duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FaCat className="mr-2 text-indigo-500 text-lg" />
                  <span className="text-slate-700 font-medium text-sm">Cats</span>
                </motion.button>
              </div>
              <button onClick={() => setShowSearchOptions(false)} className="w-full text-gray-500 text-sm py-2 hover:text-gray-700 transition-colors duration-300">
                Cancel
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <motion.div className="mb-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}>
        <div className="flex bg-white rounded-2xl p-2 shadow-md border border-violet-100">
          {[
            { id: "services", label: "Services", icon: "🏥" },
            { id: "adoption", label: "Adopt", icon: "🐾" },
            { id: "resources", label: "Care", icon: "📚" },
            { id: "mates", label: "Mates", icon: "💕" }
          ].map((tab) => (
            <motion.button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-300 ${activeTab === tab.id ? "bg-gradient-to-r from-violet-400 to-indigo-400 text-white shadow-md" : "text-gray-600 hover:bg-violet-50"}`} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <span className="text-lg mb-1">{tab.icon}</span>
              <span className="text-xs font-medium">{tab.label}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      <motion.div className="flex-1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }}>
        <AnimatePresence mode="wait">
          {activeTab === "services" && (
            <motion.div key="services" className="space-y-3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              {services.map((service, index) => (
                <motion.div key={index} onClick={() => navigate(service.route, { state: service.state })} className="bg-white rounded-2xl p-4 shadow-md border border-violet-100 hover:shadow-lg transition-all duration-300 cursor-pointer h-24 flex items-center" whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                  <div className="flex items-center flex-1">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-violet-400 to-indigo-400 flex items-center justify-center text-white text-xl mr-4 shadow-sm">{service.icon}</div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-800 text-base mb-1">{service.title}</h3>
                      <p className="text-gray-600 text-sm">{service.description}</p>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`bg-${service.color}-100 text-${service.color}-700 px-2 py-1 rounded-full text-xs font-medium mb-1`}>{service.badge}</span>
                      <FaArrowRight className="text-violet-500" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {activeTab === "adoption" && (
            <motion.div key="adoption" className="grid grid-cols-1 gap-4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              {adoptionCards.map((card, index) => (
                <motion.div key={index} onClick={() => navigate(card.route)} className="bg-white rounded-2xl overflow-hidden shadow-md border border-violet-100 hover:shadow-lg transition-all duration-300 cursor-pointer h-40" whileHover={{ scale: 1.03, y: -3 }} whileTap={{ scale: 0.97 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                  <div className={`h-24 bg-gradient-to-r ${card.color} flex items-center justify-center relative overflow-hidden`}>
                    <div className="absolute -right-4 -top-4 w-16 h-16 bg-white rounded-full opacity-20"></div>
                    <div className="text-4xl">{card.emoji}</div>
                  </div>
                  <div className="p-4 flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-slate-800 text-base mb-1">{card.title}</h3>
                      <p className="text-violet-600 text-sm font-medium">{card.count}</p>
                    </div>
                    <IoIosArrowForward className="text-violet-500 text-lg" />
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {activeTab === "resources" && (
            <motion.div key="resources" className="grid grid-cols-2 gap-4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              {petResources.map((resource, index) => (
                <motion.div key={index} onClick={() => navigate(resource.route)} className="bg-white rounded-2xl overflow-hidden shadow-md border border-violet-100 hover:shadow-lg transition-all duration-300 cursor-pointer h-44" whileHover={{ scale: 1.05, y: -5 }} whileTap={{ scale: 0.95 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                  <div className={`h-28 bg-gradient-to-br ${resource.color} flex items-center justify-center relative overflow-hidden`}>
                    <div className="absolute -right-3 -bottom-3 w-12 h-12 bg-white rounded-full opacity-20"></div>
                    <div className="text-4xl">{resource.emoji}</div>
                  </div>
                  <div className="p-3 text-center">
                    <h3 className="font-semibold text-slate-800 text-sm mb-1">{resource.title}</h3>
                    <p className="text-violet-600 text-xs font-medium">{resource.services}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {activeTab === "mates" && (
            <motion.div key="mates" className="bg-white rounded-2xl p-6 shadow-md border border-violet-100 text-center h-64 flex flex-col justify-center items-center" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <motion.div className="text-5xl mb-4" animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>💕</motion.div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Find Pet Mates</h3>
              <p className="text-gray-600 text-sm mb-6 max-w-xs">Connect with verified pet owners for safe breeding</p>
              <motion.button onClick={() => navigate('/nearby-mates')} className="bg-gradient-to-r from-violet-400 to-indigo-400 text-white px-6 py-3 rounded-full font-medium hover:from-violet-500 hover:to-indigo-500 transition-all duration-300 shadow-md hover:shadow-lg flex items-center" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <FaHeart className="mr-2" />
                Find Mates
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <motion.button className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-violet-400 to-indigo-400 rounded-full shadow-lg flex items-center justify-center text-white hover:from-violet-500 hover:to-indigo-500 transition-all duration-300 z-20" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setShowSearchOptions(!showSearchOptions)} animate={{ boxShadow: ["0 4px 15px rgba(139, 92, 246, 0.3)", "0 6px 20px rgba(139, 92, 246, 0.4)", "0 4px 15px rgba(139, 92, 246, 0.3)"] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
        <FaSearch className="text-lg" />
      </motion.button>
    </div>
  );
};

const DesktopVersion = ({ showSearchOptions, setShowSearchOptions, handlePetTypeSelect }) => {
  const navigate = useNavigate();

  return (
    <div className="relative z-10 min-h-screen">
      <motion.div className="relative bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 py-20 overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>
        <div className="absolute inset-0 overflow-hidden">
          <motion.div className="absolute top-20 right-20 w-32 h-32 bg-violet-200 rounded-full opacity-20" animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} />
          <motion.div className="absolute bottom-20 left-20 w-24 h-24 bg-indigo-200 rounded-full opacity-25" animate={{ y: [0, -20, 0], x: [0, 10, 0] }} transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }} />
        </div>

        <div className="max-w-7xl mx-auto px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.2 }}>
              <h1 className="text-5xl lg:text-6xl font-bold mb-6">
                <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">Pawppy</span><br />
                <span className="text-slate-800">Resources</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-lg">Everything your beloved pet needs - from emergency care to finding companions, all in one beautiful platform.</p>

              <div className="mb-8">
                <AnimatePresence mode="wait">
                  {!showSearchOptions ? (
                    <motion.button key="search-desktop" onClick={() => setShowSearchOptions(true)} className="w-full max-w-md bg-white rounded-2xl p-5 shadow-lg border border-violet-200 flex items-center group hover:shadow-xl transition-all duration-300" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <FaSearch className="mr-4 text-violet-500 group-hover:scale-110 transition-transform duration-300 text-xl" />
                      <span className="text-slate-700 font-medium text-lg">Search pet resources...</span>
                    </motion.button>
                  ) : (
                    <motion.div key="options-desktop" className="w-full max-w-md bg-white rounded-2xl p-5 shadow-lg border border-violet-200" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <motion.button onClick={() => handlePetTypeSelect("dog")} className="flex items-center p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl hover:from-purple-100 hover:to-violet-100 transition-all duration-300" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <FaDog className="mr-3 text-purple-500 text-2xl" />
                          <span className="text-slate-700 font-medium">Dog Resources</span>
                        </motion.button>
                        <motion.button onClick={() => handlePetTypeSelect("cat")} className="flex items-center p-4 bg-gradient-to-r from-indigo-50 to-violet-50 rounded-xl hover:from-indigo-100 hover:to-violet-100 transition-all duration-300" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <FaCat className="mr-3 text-indigo-500 text-2xl" />
                          <span className="text-slate-700 font-medium">Cat Resources</span>
                        </motion.button>
                      </div>
                      <button onClick={() => setShowSearchOptions(false)} className="w-full text-gray-500 py-2 hover:text-gray-700 transition-colors duration-300">Cancel</button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="grid grid-cols-4 gap-6">
                {featuredStats.map((stat, index) => (
                  <motion.div key={index} className="text-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}>
                    <div className="text-2xl mb-2">{stat.icon}</div>
                    <div className="text-2xl font-bold text-slate-800">{stat.number}</div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div className="grid grid-cols-2 gap-6" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.4 }}>
              {quickActions.map((action, index) => (
                <motion.div key={index} onClick={() => navigate(action.route, { state: action.state })} className={`bg-gradient-to-br ${action.color} text-white p-8 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer text-center`} whileHover={{ scale: 1.05, y: -5 }} whileTap={{ scale: 0.95 }} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}>
                  <div className="text-4xl mb-4">{action.icon}</div>
                  <h3 className="text-xl font-bold mb-2">{action.title}</h3>
                  <p className="text-sm opacity-90 mb-4">{action.description}</p>
                  <FaArrowRight className="mx-auto text-lg" />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </motion.div>

      <motion.div className="py-20 bg-white" initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} viewport={{ once: true }}>
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-800 mb-4">Our Featured Services</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">Comprehensive care and services for your beloved pets, available 24/7 when you need them most.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <motion.div key={index} onClick={() => navigate(service.route, { state: service.state })} className="bg-white rounded-3xl p-8 shadow-lg border border-violet-100 hover:shadow-xl transition-all duration-300 cursor-pointer group" whileHover={{ scale: 1.03, y: -10 }} whileTap={{ scale: 0.97 }} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: index * 0.2 }} viewport={{ once: true }}>
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-violet-400 to-indigo-400 flex items-center justify-center text-white text-3xl mb-6 mx-auto group-hover:scale-110 transition-transform duration-300">{service.icon}</div>
                <h3 className="text-2xl font-bold text-slate-800 mb-4 text-center">{service.title}</h3>
                <p className="text-gray-600 mb-4 text-center">{service.details}</p>
                <div className="flex justify-between items-center mb-4">
                  <span className={`bg-${service.color}-100 text-${service.color}-700 px-3 py-1 rounded-full text-sm font-medium`}>{service.badge}</span>
                  <span className="text-violet-600 font-medium text-sm">{service.stats}</span>
                </div>
                <div className="text-center">
                  <FaArrowRight className="text-violet-500 mx-auto group-hover:translate-x-2 transition-transform duration-300" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const Home = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("services");
  const [showSearchOptions, setShowSearchOptions] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const handlePetTypeSelect = useCallback((petType) => {
    if (petType === "dog") {
      navigate("/resource", { state: { category: "dog", subCategory: "all" } });
    } else if (petType === "cat") {
      navigate("/resource", { state: { category: "cat", subCategory: "all" } });
    }
    setShowSearchOptions(false);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-violet-50 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div className="absolute top-10 right-10 w-20 h-20 bg-violet-200 rounded-full opacity-20" animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} />
        <motion.div className="absolute bottom-20 left-5 w-16 h-16 bg-indigo-200 rounded-full opacity-25" animate={{ y: [0, -20, 0], x: [0, 10, 0] }} transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }} />
      </div>

      {isDesktop
        ? <DesktopVersion
          showSearchOptions={showSearchOptions}
          setShowSearchOptions={setShowSearchOptions}
          handlePetTypeSelect={handlePetTypeSelect}
        />
        : <MobileVersion
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          showSearchOptions={showSearchOptions}
          setShowSearchOptions={setShowSearchOptions}
          handlePetTypeSelect={handlePetTypeSelect}
        />
      }
    </div>
  );
};

export default Home;