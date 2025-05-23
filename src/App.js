import React from "react";
import { Route, Routes } from "react-router-dom";
import Home from "./components/Home/Home";
import Login from "./components/Login/Login";
import Header from "./components/Header/Header";
import Profile from "./components/Profile/Profile";
import DogResources from "./components/Resources/DogResources";
import CatResources from "./components/Resources/CatResources";
import ResourceList from "./components/Resources/ResourceList/ResourceList";
import ResourceDetail from "./components/Resources/ResourceDetail/ResourceDetail";
import NotFound from "./components/NotFound/NotFound";
import NearbyMates from "./components/NearbyMates/NearbyMates";
import AdoptPet from "./components/AdoptPet/AdoptPet";
import PetDetail from "./components/NearbyMates/PetDetail";
import PR from "./components/PR/PR";
import ScrollToTop from "./UI/ScrollToTop";
import Footer from "./components/Footer/Footer";
import AboutUs from "./components/AboutUs/AboutUs";
import ContactUs from "./components/ContactUs/ContactUs";
import OurTeam from "./components/OurTeam/OurTeam";
import PrivacyPolicy from "./components/PrivacyPolicy/PrivacyPolicy";
import TermsAndConditions from "./components/TermsAndConditions/TermsAndConditions";
import CookiePolicy from "./components/CookiePolicy/CookiePolicy";

function App() {
  return (
    <div>
      <ScrollToTop />
      <div className="min-h-screen bg-lavender-50 flex flex-col">
        <Header />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Login />} />
            <Route
              path="/dashboard"
              element={
                <PR>
                  <Home />
                </PR>
              }
            />
            <Route
              path="/dog-resources"
              element={
                <PR>
                  <DogResources />
                </PR>
              }
            />
            <Route
              path="/resources/:category"
              element={
                <PR>
                  <ResourceList />
                </PR>
              }
            />
            <Route
              path="/cat-resources"
              element={
                <PR>
                  <CatResources />
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
              path="/resource-details/:resourceId"
              element={
                <PR>
                  <ResourceDetail />
                </PR>
              }
            />
            <Route
              path="/map/:category"
              element={
                <PR>
                  <ResourceList viewMode="map" />
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
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
      <Footer />
    </div>
  );
}

export default App;
