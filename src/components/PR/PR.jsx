import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { auth } from "../../firebase";
import SplashScreen from "../Loaders/SplashScreen";

const PR = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user ? user : null);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <AnimatePresence>
        <SplashScreen />
      </AnimatePresence>
    );
  }

  if (!user) {
    return <Navigate to="/" />;
  }

  return children;
};

export default PR;
