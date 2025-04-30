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

function App() {
  return (
    <div>
      <ScrollToTop />
      <div className="min-h-screen bg-lavender-50">
        <Header />
        <main>
          <Routes>
            <Route
              path="/"
              element={
                <PR>
                  <Home />
                </PR>
              }
            />
            <Route path="/login" element={<Login />} />
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
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;
