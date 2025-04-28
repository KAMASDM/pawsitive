import React from "react";
import { Route, Routes } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import theme from "./theme";
import Home from "./components/Home/Home";
import Login from "./components/Login/Login";
import Header from "./components/Header/Header";
import Profile from "./components/Profile/Profile";
import DogResources from "./components/Resources/DogResources";
import CatResources from "./components/Resources/CatResources";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";
import ResourceList from "./components/Resources/ResourceList/ResourceList";
import ResourceDetail from "./components/Resources/ResourceDetail/ResourceDetail";
import NotFound from "./components/NotFound/NotFound";
import NearbyMates from "./components/NearbyMates/NearbyMates";
import ScrollToTop from "./UI/ScrollToTop";
import AdoptPet from "./components/AdoptPet/AdoptPet";
import PetDetail from "./components/NearbyMates/PetDetail";

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ScrollToTop />
      <div className="min-h-screen bg-lavender-50">
        <Header />
        <main>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dog-resources"
              element={
                <ProtectedRoute>
                  <DogResources />
                </ProtectedRoute>
              }
            />
            <Route
              path="/resources/:category"
              element={
                <ProtectedRoute>
                  <ResourceList />
                </ProtectedRoute>
              }
            />

            <Route
              path="/cat-resources"
              element={
                <ProtectedRoute>
                  <CatResources />
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            <Route
              path="/resource-details/:resourceId"
              element={
                <ProtectedRoute>
                  <ResourceDetail />
                </ProtectedRoute>
              }
            />

            <Route
              path="/map/:category"
              element={
                <ProtectedRoute>
                  <ResourceList viewMode="map" />
                </ProtectedRoute>
              }
            />

            <Route
              path="/nearby-mates"
              element={
                <ProtectedRoute>
                  <NearbyMates />
                </ProtectedRoute>
              }
            />

            <Route
              path="/pet-detail/:petId"
              element={
                <ProtectedRoute>
                  <PetDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/adopt-pets"
              element={
                <ProtectedRoute>
                  <AdoptPet />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </ThemeProvider>
  );
}

export default App;
