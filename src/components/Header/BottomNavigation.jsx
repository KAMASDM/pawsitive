import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { auth } from "../../firebase";
import { FiHome, FiUser, FiLogOut, FiHelpCircle } from "react-icons/fi";
import { BsGrid3X3Gap } from "react-icons/bs";
import { FaPaw } from "react-icons/fa";

const MENUS = [
  { id: "faq",      label: "FAQ",      Icon: FiHelpCircle,   path: "/faq"      },
  { id: "resource", label: "Resources",Icon: BsGrid3X3Gap,   path: "/resource" },
  { id: "home",     label: "Home",     Icon: FaPaw,          path: "/my-pets", featured: true },
  { id: "profile",  label: "Profile",  Icon: FiUser,         path: "/profile"  },
  { id: "logout",   label: "Logout",   Icon: FiLogOut,       path: "/"         },
];

const matchId = (pathname) => {
  if (pathname === "/faq")                                         return "faq";
  if (pathname.startsWith("/resource"))                            return "resource";
  if (pathname === "/my-pets" || pathname.startsWith("/my-pets/")) return "home";
  if (pathname === "/profile")                                     return "profile";
  return null;
};

const BottomNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const activeId = matchId(location.pathname);

  const handleLogout = () => {
    auth.signOut();
    navigate("/");
  };

  return (
    <div
      className="fixed bottom-0 left-0 w-full md:hidden z-50"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      {/* Frosted glass bar */}
      <div
        className="relative backdrop-blur-xl border-t border-white/40 shadow-[0_-4px_30px_rgba(109,93,191,0.12)]"
        style={{ background: "rgba(255,255,255,0.92)" }}
      >
        {/* Active indicator line at top */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-400 via-purple-500 to-violet-400 opacity-70" />

        <ul className="w-full flex justify-between items-end px-1 pt-2 pb-1">
          {MENUS.map((menu) => {
            const isActive = activeId === menu.id;
            return (
              <NavItem
                key={menu.id}
                menu={menu}
                isActive={isActive}
                onLogout={menu.id === "logout" ? handleLogout : null}
              />
            );
          })}
        </ul>
      </div>
    </div>
  );
};

/* ── Individual nav item ── */
const NavItem = ({ menu, isActive, onLogout }) => {
  const { Icon, label, path, featured } = menu;

  if (featured) {
    return (
      <li className="flex items-center justify-center flex-shrink-0">
        <Link
          to={path}
          onClick={onLogout || undefined}
          className="flex flex-col items-center justify-center select-none relative -top-4"
          style={{ WebkitTapHighlightColor: "transparent" }}
          aria-label={label}
        >
          <motion.div
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className={`w-14 h-14 rounded-2xl shadow-lg flex items-center justify-center ${
              isActive
                ? "bg-gradient-to-br from-violet-500 to-purple-700 shadow-violet-300"
                : "bg-gradient-to-br from-violet-400 to-purple-600 shadow-violet-200"
            }`}
          >
            <Icon className="text-white" size={22} />
          </motion.div>
          <span
            className={`mt-1 text-[10px] font-semibold leading-none ${
              isActive ? "text-violet-600" : "text-gray-400"
            }`}
          >
            {label}
          </span>
        </Link>
      </li>
    );
  }

  return (
    <li className="flex-1 flex items-center justify-center min-w-0">
      <Link
        to={path}
        onClick={onLogout || undefined}
        className="flex flex-col items-center justify-center gap-1 w-full h-[58px] select-none py-1"
        style={{ WebkitTapHighlightColor: "transparent" }}
        aria-label={label}
      >
        {/* Icon container with active pill */}
        <motion.div
          animate={{ y: isActive ? -1 : 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className={`relative flex items-center justify-center w-9 h-8 rounded-xl transition-colors ${
            isActive ? "bg-violet-100" : "bg-transparent"
          }`}
        >
          <Icon
            size={20}
            className={`transition-colors ${isActive ? "text-violet-600" : "text-violet-400"}`}
          />
          {/* Active dot */}
          <AnimatePresence>
            {isActive && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-violet-500"
              />
            )}
          </AnimatePresence>
        </motion.div>

        {/* Label */}
        <motion.span
          animate={{ opacity: isActive ? 1 : 0.55 }}
          transition={{ duration: 0.15 }}
          className={`text-[10px] font-semibold leading-none tracking-wide truncate ${
            isActive ? "text-violet-600" : "text-violet-400"
          }`}
        >
          {label}
        </motion.span>
      </Link>
    </li>
  );
};

export default BottomNavigation;

