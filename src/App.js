import React, { useEffect, lazy, Suspense } from "react";
import { Route, Routes, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

// Eagerly loaded — tiny, always needed on first paint
import Login from "./components/Login/Login";
import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";
import NotFound from "./components/NotFound/NotFound";
import PR from "./components/PR/PR";
import ScrollToTop from "./UI/ScrollToTop";
import UpdateNotification from "./components/PWA/UpdateNotification";

// Lazy-loaded route chunks — only downloaded when the route is visited
const Home              = lazy(() => import("./components/Home/Home"));
const Profile           = lazy(() => import("./components/Profile/Profile"));
const NearbyMates       = lazy(() => import("./components/NearbyMates/NearbyMates"));
const AdoptPet          = lazy(() => import("./components/AdoptPet/AdoptPet"));
const PetDetail         = lazy(() => import("./components/NearbyMates/PetDetail"));
const PetProfile        = lazy(() => import("./components/PetProfile/PetProfile"));
const PetDetailsPage    = lazy(() => import("./components/PetDetails/PetDetailsPage"));
const AboutUs           = lazy(() => import("./components/AboutUs/AboutUs"));
const ContactUs         = lazy(() => import("./components/ContactUs/ContactUs"));
const OurTeam           = lazy(() => import("./components/OurTeam/OurTeam"));
const PrivacyPolicy     = lazy(() => import("./components/PrivacyPolicy/PrivacyPolicy"));
const TermsAndConditions= lazy(() => import("./components/TermsAndConditions/TermsAndConditions"));
const CookiePolicy      = lazy(() => import("./components/CookiePolicy/CookiePolicy"));
const ResourcesPage     = lazy(() => import("./components/Resources/Resources"));
const ResourceDetail    = lazy(() => import("./components/Resources/ResourceDetail"));
const FAQ               = lazy(() => import("./components/FAQ/FAQ"));
const TestNotifications = lazy(() => import("./components/TestNotifications/TestNotifications"));
const LostAndFound      = lazy(() => import("./components/LostAndFound/LostAndFound"));
const PetSelector       = lazy(() => import("./components/MyPets/PetSelector"));
const PetDashboard      = lazy(() => import("./components/MyPets/PetDashboard"));
const PlaceTaggingPage  = lazy(() => import("./components/PlaceTagging/PlaceTaggingPage"));

// Challenge feature
const ChallengeHomeBanner   = lazy(() => import("./features/challenge/components/ChallengeHomeBanner"));
const ChallengeSubmitScreen = lazy(() => import("./features/challenge/components/ChallengeSubmitScreen"));
const ChallengeFeed         = lazy(() => import("./features/challenge/components/ChallengeFeed"));
const ChallengeLeaderboard  = lazy(() => import("./features/challenge/components/ChallengeLeaderboard"));

// Quiz feature
const QuizScreen      = lazy(() => import("./features/quiz/components/QuizScreen"));
const QuizResults     = lazy(() => import("./features/quiz/components/QuizResults"));
const QuizLeaderboard = lazy(() => import("./features/quiz/components/QuizLeaderboard"));

// Activity page
const ActivityPage = lazy(() => import("./features/activity/ActivityPage"));

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
              <Suspense fallback={
                <div className="min-h-screen flex items-center justify-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full border-4 border-violet-200 border-t-violet-500 animate-spin" />
                    <span className="text-sm text-violet-400 font-medium">Loading…</span>
                  </div>
                </div>
              }>
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
            {/* Challenge routes */}
            <Route path="/challenge" element={<PR><ChallengeHomeBanner /></PR>} />
            <Route path="/challenge/submit" element={<PR><ChallengeSubmitScreen /></PR>} />
            <Route path="/challenge/feed" element={<PR><ChallengeFeed /></PR>} />
            <Route path="/challenge/leaderboard" element={<PR><ChallengeLeaderboard /></PR>} />

            {/* Quiz routes */}
            <Route path="/quiz" element={<PR><QuizScreen /></PR>} />
            <Route path="/quiz/play" element={<PR><QuizScreen /></PR>} />
            <Route path="/quiz/results" element={<PR><QuizResults /></PR>} />
            <Route path="/quiz/leaderboard" element={<PR><QuizLeaderboard /></PR>} />

            {/* Activity history */}
            <Route path="/activity" element={<PR><ActivityPage /></PR>} />

            <Route path="*" element={<NotFound />} />
              </Routes>
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <Footer />
    </div>
  );
}

export default App;
