import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { auth } from "../../firebase";

const HomeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
    />
  </svg>
);

const DogIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 5h2a2 2 0 012 2v3.343M15 5v1a1 1 0 001 1h1a1 1 0 001-1v-1m-3 0H7m8 0l-2-2H9L7 5M7 5H5a2 2 0 00-2 2v3.343m0 0A6 6 0 003 13v1a5 5 0 005 5h8a5 5 0 005-5v-1a6 6 0 000-2.657M3 10.657L5 12l2-2 2 2 2-2 2 2 2-2 2 2 2-2"
    />
  </svg>
);

const CatIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 3c.5 0 3.5 2 4 3m-8 0c-.5-1 3-3 4-3m0 0c.5 2 1 3 1 3m-2 0c-1 0-1-1-1-3m7.414 0L19 6.414V15c0 3-2.239 5-5 5h-4c-2.761 0-5-2-5-5V6.414L8.586 3 12 3zM9 13v-1m3 1v-1m3 1v-1"
    />
  </svg>
);

const ProfileIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
    />
  </svg>
);

const LogoutIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
    />
  </svg>
);

const BottomNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    auth.signOut();
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-lavender-900 shadow-lg z-50">
      <div className="grid grid-cols-5 h-16">
        <Link
          to="/"
          className={`flex flex-col items-center justify-center ${
            isActive("/")
              ? "text-white bg-lavender-700"
              : "text-lavender-200 hover:text-white"
          }`}
        >
          <HomeIcon />
          <span className="text-xs mt-1">Home</span>
        </Link>
        <Link
          to="/dog-resources"
          className={`flex flex-col items-center justify-center ${
            isActive("/dog-resources")
              ? "text-white bg-lavender-700"
              : "text-lavender-200 hover:text-white"
          }`}
        >
          <DogIcon />
          <span className="text-xs mt-1">Dogs</span>
        </Link>
        <Link
          to="/cat-resources"
          className={`flex flex-col items-center justify-center ${
            isActive("/cat-resources")
              ? "text-white bg-lavender-700"
              : "text-lavender-200 hover:text-white"
          }`}
        >
          <CatIcon />
          <span className="text-xs mt-1">Cats</span>
        </Link>
        <Link
          to="/profile"
          className={`flex flex-col items-center justify-center ${
            isActive("/profile")
              ? "text-white bg-lavender-700"
              : "text-lavender-200 hover:text-white"
          }`}
        >
          <ProfileIcon />
          <span className="text-xs mt-1">Profile</span>
        </Link>
        <button
          onClick={handleLogout}
          className="flex flex-col items-center justify-center text-lavender-200 hover:text-white"
        >
          <LogoutIcon />
          <span className="text-xs mt-1">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default BottomNavigation;
