import React from "react";
import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full text-center">
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <div className="text-9xl">🐾</div>
            <div className="absolute -top-4 -right-4 text-6xl">🔍</div>
          </div>
        </div>
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Page Not Found
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Oops! The page you're looking for has gone for a walk. Let's help you
          find your way back.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-lavender-600 hover:bg-lavender-700 text-white font-semibold py-3 px-8 rounded-full transition-colors duration-300"
          >
            Go Home
          </button>
          <button
            onClick={() => navigate(-1)}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-8 rounded-full transition-colors duration-300"
          >
            Go Back
          </button>
        </div>
        <div className="mt-12 text-gray-500">
          <h2 className="text-lg font-semibold mb-4">
            Looking for pet resources?
          </h2>
          <div className="flex justify-center gap-6">
            <button
              onClick={() => navigate("/dog-resources")}
              className="flex flex-col items-center hover:text-lavender-600 transition-colors"
            >
              <span className="text-4xl mb-2">🐕</span>
              <span>Dog Resources</span>
            </button>
            <button
              onClick={() => navigate("/cat-resources")}
              className="flex flex-col items-center hover:text-lavender-600 transition-colors"
            >
              <span className="text-4xl mb-2">🐈</span>
              <span>Cat Resources</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
