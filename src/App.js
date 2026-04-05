import React, { useEffect } from "react";
import { Route, Routes, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Home from "./components/Home/Home";
import Login from "./components/Login/Login";
import Header from "./components/Header/Header";
import Profile from "./components/Profile/Profile";
import NotFound from "./components/NotFound/NotFound";
import NearbyMates from "./components/NearbyMates/NearbyMates";
import AdoptPet from "./components/AdoptPet/AdoptPet";
import PetDetail from "./components/NearbyMates/PetDetail";
import PetProfile from "./components/PetProfile/PetProfile";
import PetDetailsPage from "./components/PetDetails/PetDetailsPage";
import PR from "./components/PR/PR";
import ScrollToTop from "./UI/ScrollToTop";
import Footer from "./components/Footer/Footer";
import AboutUs from "./components/AboutUs/AboutUs";
import ContactUs from "./components/ContactUs/ContactUs";
import OurTeam from "./components/OurTeam/OurTeam";
import PrivacyPolicy from "./components/PrivacyPolicy/PrivacyPolicy";
import TermsAndConditions from "./components/TermsAndConditions/TermsAndConditions";
import CookiePolicy from "./components/CookiePolicy/CookiePolicy";
import ResourcesPage from "./components/Resources/Resources";
import ResourceDetail from "./components/Resources/ResourceDetail";
import FAQ from "./components/FAQ/FAQ";
import TestNotifications from "./components/TestNotifications/TestNotifications";
import LostAndFound from "./components/LostAndFound/LostAndFound";
import UpdateNotification from "./components/PWA/UpdateNotification";
import PetSelector from "./components/MyPets/PetSelector";
import PetDashboard from "./components/MyPets/PetDashboard";
import PlaceTaggingPage from "./components/PlaceTagging/PlaceTaggingPage";
import { useVaccinationReminder } from "./hooks/useVaccinationReminder";
import { initializeBadgeManagement } from "./services/badgeService";

function App() {
  // Initialize vaccination reminder checker
  useVaccinationReminder();
  const location = useLocation();
  
  useEffect(() => {
    // Hide the inline HTML splash screen now that React has mounted
    if (typeof window.__hideSplash === "function") {
      window.__hideSplash();
    }

    // Initialize badge management for PWA
    initializeBadgeManagement();
    
    // Check if Google Maps script is already loaded or being loaded
    if (!window.google && !document.querySelector('script[src*="maps.googleapis.com"]')) {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.id = "google-maps-script";
      document.body.appendChild(script);
    }
  }, []);

  return (
    <div>
      <ScrollToTop />
      <UpdateNotification />
      <div className="min-h-screen bg-lavender-50 flex flex-col">
        <Header />
        <main className="flex-grow mb-[62px] sm:mb-0">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{
                duration: 0.18,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
              className="will-change-[opacity,transform]"
            >
              <Routes location={location}>
                <Route path="/" element={<Login />} />

            {/* Pet-first landing — replaces /dashboard */}
            <Route
              path="/my-pets"
              element={
                <PR>
                  <PetSelector />
                </PR>
              }
            />
            <Route
              path="/my-pets/:petId"
              element={
                <PR>
                  <PetDashboard />
                </PR>
              }
            />

            {/* Legacy redirect so old bookmarks/links still work */}
            <Route path="/dashboard" element={<Navigate to="/my-pets" replace />} />

            <Route
              path="/faq"
              element={
                <PR>
                  <FAQ />
                </PR>
              }
            />
            <Route
              path="/profile"
              element={
                <PR>
                  <Profile />
                </PR>
              }
            />
            <Route
              path="/nearby-mates"
              element={
                <PR>
                  <NearbyMates />
                </PR>
              }
            />
            <Route
              path="/pet-detail/:petId"
              element={
                <PR>
                  <PetDetail />
                </PR>
              }
            />
            <Route
              path="/pet-details/:petId"
              element={
                <PR>
                  <PetDetailsPage />
                </PR>
              }
            />
            <Route
              path="/pet/:slug"
              element={<PetProfile />}
            />
            <Route
              path="/resource"
              element={
                <PR>
                  <ResourcesPage />
                </PR>
              }
            />
            <Route
              path="/resources/:id"
              element={
                <PR>
                  <ResourceDetail />
                </PR>
              }
            />
            <Route
              path="/adopt-pets"
              element={
                <PR>
                  <AdoptPet />
                </PR>
              }
            />
            <Route
              path="/about-us"
              element={
                <PR>
                  <AboutUs />
                </PR>
              }
            />
            <Route
              path="/contact-us"
              element={
                <PR>
                  <ContactUs />
                </PR>
              }
            />
            <Route
              path="/our-team"
              element={
                <PR>
                  <OurTeam />
                </PR>
              }
            />
            <Route
              path="/privacy-policy"
              element={
                <PR>
                  <PrivacyPolicy />
                </PR>
              }
            />
            <Route
              path="/terms-and-conditions"
              element={
                <PR>
                  <TermsAndConditions />
                </PR>
              }
            />
            <Route
              path="/cookie-policy"
              element={
                <PR>
                  <CookiePolicy />
                </PR>
              }
            />
            <Route
              path="/test-notifications"
              element={
                <PR>
                  <TestNotifications />
                </PR>
              }
            />
            <Route
              path="/lost-and-found"
              element={
                <PR>
                  <LostAndFound />
                </PR>
              }
            />
            <Route
              path="/place-tagging"
              element={
                <PR>
                  <PlaceTaggingPage />
                </PR>
              }
            />
            <Route path="*" element={<NotFound />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <Footer />
    </div>
  );
}

export default App;
