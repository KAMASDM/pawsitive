import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { auth } from "../../firebase";

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
      <div className="flex flex-col min-h-screen bg-white/97 bg-[radial-gradient(rgba(139,121,195,0.05)_1px,transparent_0)] bg-[length:20px_20px]" />
    );
  }

  if (!user) {
    return <Navigate to="/" />;
  }

  return children;
};

export default PR;
