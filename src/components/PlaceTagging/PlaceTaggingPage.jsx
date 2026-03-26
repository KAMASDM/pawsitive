import React, { useState, useEffect, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FiArrowLeft, FiMapPin } from "react-icons/fi";
import PlaceTagging from "./PlaceTagging";

const TaggedPlacesMap = lazy(() => import("./TaggedPlacesMap"));

export default function PlaceTaggingPage() {
  const navigate = useNavigate();
  const [userLocation, setUserLocation] = useState(null);
  const [showTagModal, setShowTagModal] = useState(false);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}
    );
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-violet-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-violet-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-8 h-14 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-violet-600 font-medium transition-colors"
          >
            <FiArrowLeft size={16} />
            <span className="hidden sm:inline">Back</span>
          </button>
          <span className="font-bold text-slate-800">Pet-Friendly Places</span>
          <button
            onClick={() => setShowTagModal(true)}
            className="flex items-center gap-1.5 text-sm bg-violet-500 hover:bg-violet-600 text-white px-3.5 py-1.5 rounded-xl font-semibold transition-colors"
          >
            <FiMapPin size={14} />
            Tag a Place
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <p className="text-gray-400 text-sm mb-5">
            Discover and share pet-friendly spots in your area — parks, cafes, vets, groomers & more.
          </p>

          <Suspense
            fallback={
              <div className="w-full h-96 bg-white rounded-2xl border border-violet-100 animate-pulse" />
            }
          >
            <TaggedPlacesMap userLocation={userLocation} radius={20} />
          </Suspense>
        </motion.div>
      </div>

      <PlaceTagging
        isOpen={showTagModal}
        onClose={() => setShowTagModal(false)}
        userLocation={userLocation}
      />
    </div>
  );
}
