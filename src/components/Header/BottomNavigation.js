import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { auth } from "../../firebase";
import { FiHome, FiUser, FiLogOut } from "react-icons/fi";
import { FaDog, FaCat } from "react-icons/fa";

const BottomNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    auth.signOut();
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-lavender-900 shadow-lg z-50 md:hidden">
      <div className="grid grid-cols-5 h-16">
        <Link
          to="/"
          className={`flex flex-col items-center justify-center transition-colors ${
            isActive("/")
              ? "text-white bg-lavender-700"
              : "text-lavender-200 hover:text-white hover:bg-lavender-800"
          }`}
          aria-label="Home"
        >
          <FiHome className="text-lg" />
          <span className="text-xs mt-0.5">Home</span>
        </Link>
        <Link
          to="/dog-resources"
          className={`flex flex-col items-center justify-center transition-colors ${
            isActive("/dog-resources")
              ? "text-white bg-lavender-700"
              : "text-lavender-200 hover:text-white hover:bg-lavender-800"
          }`}
          aria-label="Dog Resources"
        >
          <FaDog className="text-lg" />
          <span className="text-xs mt-0.5">Dogs</span>
        </Link>
        <Link
          to="/cat-resources"
          className={`flex flex-col items-center justify-center transition-colors ${
            isActive("/cat-resources")
              ? "text-white bg-lavender-700"
              : "text-lavender-200 hover:text-white hover:bg-lavender-800"
          }`}
          aria-label="Cat Resources"
        >
          <FaCat className="text-lg" />
          <span className="text-xs mt-0.5">Cats</span>
        </Link>
        <Link
          to="/profile"
          className={`flex flex-col items-center justify-center transition-colors ${
            isActive("/profile")
              ? "text-white bg-lavender-700"
              : "text-lavender-200 hover:text-white hover:bg-lavender-800"
          }`}
          aria-label="Profile"
        >
          <FiUser className="text-lg" />
          <span className="text-xs mt-0.5">Profile</span>
        </Link>
        <button
          onClick={handleLogout}
          className="flex flex-col items-center justify-center text-lavender-200 hover:text-white hover:bg-lavender-800 transition-colors"
          aria-label="Logout"
        >
          <FiLogOut className="text-lg" />
          <span className="text-xs mt-0.5">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default BottomNavigation;
