import React from "react";

const PawLoader = ({ message = "Loading…", fullScreen = false }) => (
  <div
    className={`flex flex-col items-center justify-center gap-3 ${
      fullScreen
        ? "min-h-screen bg-gradient-to-br from-violet-50 via-lavender-50 to-indigo-50"
        : "py-16"
    }`}
  >
    <img src="/PawPrints.gif" alt="Loading" className="w-28 h-28 object-contain" />
    {message && (
      <p className="text-violet-600 font-medium text-sm tracking-wide">{message}</p>
    )}
  </div>
);

export default PawLoader;
