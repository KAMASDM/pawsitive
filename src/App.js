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
import ScrollToTop from "./UI/ScrollToTop";

function App() {
  return (
    <div>
      <ScrollToTop />
      <div className="min-h-screen bg-lavender-50">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dog-resources" element={<DogResources />} />
            <Route path="/cat-resources" element={<CatResources />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/resources/:category" element={<ResourceList />} />
            <Route
              path="/resource-details/:resourceId"
              element={<ResourceDetail />}
            />
            <Route path="/map/:category" element={<ResourceList />} />
            <Route path="/nearby-mates" element={<NearbyMates />} />
            <Route path="/pet-detail/:petId" element={<PetDetail />} />
            <Route path="/adopt-pets" element={<AdoptPet />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;
