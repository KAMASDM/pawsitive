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
import GlobalSearch from "./components/Search/GlobalSearch";

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
const NotificationsInbox = lazy(() => import("./components/Notifications/NotificationsInbox"));
const Storefront = lazy(() => import("./features/ecommerce/components/Storefront"));
const CommerceMarketplace = lazy(() => import("./features/commerce/shop/CommerceMarketplace"));
const ProductDetail = lazy(() => import("./features/commerce/shop/ProductDetail"));
const StorePage = lazy(() => import("./features/commerce/shop/StorePage"));
const CartPage = lazy(() => import("./features/commerce/shop/CartPage"));
const CheckoutPage = lazy(() => import("./features/commerce/shop/CheckoutPage"));
const OrdersPage = lazy(() => import("./features/commerce/shop/OrdersPage"));
const OrderDetail = lazy(() => import("./features/commerce/shop/OrdersPage").then((module) => ({ default: module.OrderDetail })));
const VendorRegister = lazy(() => import("./features/commerce/vendor/VendorRegister"));
const VendorOnboarding = lazy(() => import("./features/commerce/vendor/VendorOnboarding"));
const VendorStatus = lazy(() => import("./features/commerce/vendor/VendorStatus"));
const AdminVendors = lazy(() => import("./features/commerce/admin/AdminVendors"));
const AdminVendorDetail = lazy(() => import("./features/commerce/admin/AdminVendorDetail"));
const SellerDashboard = lazy(() => import("./features/commerce/vendor/SellerDashboard"));
const VendorProducts = lazy(() => import("./features/commerce/vendor/VendorProducts"));
const ProductEditor = lazy(() => import("./features/commerce/vendor/ProductEditor"));
const VendorOrders = lazy(() => import("./features/commerce/vendor/VendorOrders"));
const StoreProfileEditor = lazy(() => import("./features/commerce/vendor/StoreProfileEditor"));
const AdminOrders = lazy(() => import("./features/commerce/admin/AdminOrders"));
const AdminCarts = lazy(() => import("./features/commerce/admin/AdminCarts"));
const AdminProducts = lazy(() => import("./features/commerce/admin/AdminProducts"));
const AdminCommerceDashboard = lazy(() => import("./features/commerce/admin/AdminCommerceDashboard"));
const AdminCoupons = lazy(() => import("./features/commerce/admin/AdminCoupons"));

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
import { initializeForegroundNotifications, requestNotificationPermission } from "./services/notificationService";
import { auth } from "./firebase";
import { getStoreSlugFromHost } from "./features/ecommerce/services/ecommerceService";
import { RequireApprovedVendor, RequireAuth, RequireRole } from "./features/commerce/auth/commerceGuards";

function App() {
  // Initialize vaccination reminder checker
  useVaccinationReminder();
  const location = useLocation();
  const subdomainStoreSlug = getStoreSlugFromHost();
  
  useEffect(() => {
    // Initialize badge management for PWA
    initializeBadgeManagement();
    initializeForegroundNotifications();

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!user || !('Notification' in window) || Notification.permission === 'denied') return;

      const setupKey = `pawppy_push_setup_${user.uid}`;
      if (sessionStorage.getItem(setupKey)) return;
      sessionStorage.setItem(setupKey, 'true');

      requestNotificationPermission(user.uid).catch((err) =>
        console.log('Notification permission not granted:', err)
      );
    });
    
    // Check if Google Maps script is already loaded or being loaded
    if (!window.google && !document.querySelector('script[src*="maps.googleapis.com"]')) {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places&loading=async`;
      script.async = true;
      script.defer = true;
      script.id = "google-maps-script";
      document.body.appendChild(script);
    }

    return () => unsubscribeAuth();
  }, []);

  return (
    <div>
      <ScrollToTop />
      <UpdateNotification />
      {location.pathname !== "/" && <GlobalSearch />}
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
                {subdomainStoreSlug ? (
                  <Storefront subdomainSlug={subdomainStoreSlug} />
                ) : (
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
              path="/notifications"
              element={
                <PR>
                  <NotificationsInbox />
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
              path="/shop"
              element={
                <PR>
                  <CommerceMarketplace />
                </PR>
              }
            />
            <Route path="/products/:slug" element={<PR><ProductDetail /></PR>} />
            <Route path="/store/:slug" element={<PR><StorePage /></PR>} />
            <Route
              path="/shop/seller"
              element={
                <Navigate to="/vendor/register" replace />
              }
            />
            <Route path="/cart" element={<RequireAuth><CartPage /></RequireAuth>} />
            <Route path="/checkout" element={<RequireAuth><CheckoutPage /></RequireAuth>} />
            <Route path="/orders" element={<RequireAuth><OrdersPage /></RequireAuth>} />
            <Route path="/orders/:id" element={<RequireAuth><OrderDetail /></RequireAuth>} />
            <Route path="/shop/store/:storeSlug" element={<PR><Storefront /></PR>} />
            <Route path="/shop/:storeSlug/:productId" element={<PR><Storefront /></PR>} />
            <Route path="/pawppy-admin/vendors" element={<Navigate to="/admin/vendors" replace />} />
            <Route path="/vendor/register" element={<VendorRegister />} />
            <Route path="/vendor/onboarding" element={<RequireRole role="vendor"><VendorOnboarding /></RequireRole>} />
            <Route path="/vendor/status" element={<RequireAuth><VendorStatus /></RequireAuth>} />
            <Route path="/vendor/dashboard" element={<RequireApprovedVendor><SellerDashboard /></RequireApprovedVendor>} />
            <Route path="/vendor/products" element={<RequireApprovedVendor><VendorProducts /></RequireApprovedVendor>} />
            <Route path="/vendor/products/new" element={<RequireApprovedVendor><ProductEditor /></RequireApprovedVendor>} />
            <Route path="/vendor/products/:id/edit" element={<RequireApprovedVendor><ProductEditor /></RequireApprovedVendor>} />
            <Route path="/vendor/orders" element={<RequireApprovedVendor><VendorOrders /></RequireApprovedVendor>} />
            <Route path="/vendor/store" element={<RequireApprovedVendor><StoreProfileEditor /></RequireApprovedVendor>} />
            <Route path="/admin/vendors" element={<RequireRole role="admin"><AdminVendors /></RequireRole>} />
            <Route path="/admin/vendors/:id" element={<RequireRole role="admin"><AdminVendorDetail /></RequireRole>} />
            <Route path="/admin/commerce" element={<RequireRole role="admin"><AdminCommerceDashboard /></RequireRole>} />
            <Route path="/admin/orders" element={<RequireRole role="admin"><AdminOrders /></RequireRole>} />
            <Route path="/admin/carts" element={<RequireRole role="admin"><AdminCarts /></RequireRole>} />
            <Route path="/admin/products" element={<RequireRole role="admin"><AdminProducts /></RequireRole>} />
            <Route path="/admin/coupons" element={<RequireRole role="admin"><AdminCoupons /></RequireRole>} />
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
                )}
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
