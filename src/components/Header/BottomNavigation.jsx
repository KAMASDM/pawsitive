import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { auth } from "../../firebase";
import { FiHome, FiUser, FiGrid, FiHelpCircle, FiLogOut } from "react-icons/fi";

const MENUS = [
  { id: "faq",      label: "FAQ",       Icon: FiHelpCircle, path: "/faq"      },
  { id: "resource", label: "Explore",   Icon: FiGrid,       path: "/resource" },
  { id: "home",     label: "Home",      Icon: FiHome,       path: "/my-pets"  },
  { id: "profile",  label: "Profile",   Icon: FiUser,       path: "/profile"  },
  { id: "logout",   label: "Logout",    Icon: FiLogOut,     path: "/"         },
];

const matchId = (pathname) => {
  if (pathname === "/faq")             return "faq";
  if (pathname.startsWith("/resource")) return "resource";
  if (pathname === "/my-pets" || pathname.startsWith("/my-pets/")) return "home";
  if (pathname === "/profile")         return "profile";
  return null;
};

const BottomNavigation = () => {
  const location  = useLocation();
  const navigate  = useNavigate();
  const activeId  = matchId(location.pathname);

  const handleTap = (menu) => {
    if (menu.id === "logout") {
      auth.signOut();
      navigate("/");
    } else {
      navigate(menu.path);
    }
  };

  return (
    <div
      className="fixed bottom-0 left-0 right-0 md:hidden z-50"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      {/* Glass card nav bar */}
      <div className="bg-white/95 backdrop-blur-xl border-t border-gray-100 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
        <nav className="flex items-center justify-around px-2 h-[62px]">
          {MENUS.map((menu) => {
            const isActive = activeId === menu.id;
            return (
              <NavItem
                key={menu.id}
                menu={menu}
                isActive={isActive}
                onTap={handleTap}
              />
            );
          })}
        </nav>
      </div>
    </div>
  );
};

/* ── Individual nav item ── */
const NavItem = ({ menu, isActive, onTap }) => {
  const { Icon, label, id } = menu;
  const isLogout = id === "logout";

  return (
    <button
      onClick={() => onTap(menu)}
      className="relative flex flex-col items-center justify-center flex-1 h-full py-1 gap-0.5 select-none outline-none tap-highlight"
      style={{ WebkitTapHighlightColor: "transparent" }}
      aria-label={label}
    >
      {/* Active pill indicator */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            key="pill"
            layoutId="nav-indicator"
            className="absolute top-2 w-14 h-7 rounded-full bg-violet-100"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 36 }}
          />
        )}
      </AnimatePresence>

      {/* Icon */}
      <motion.div
        animate={{
          scale: isActive ? 1.08 : 1,
          y:     isActive ? -1  : 0,
        }}
        transition={{ type: "spring", stiffness: 500, damping: 38 }}
        className="relative z-10"
      >
        <Icon
          size={22}
          strokeWidth={isActive ? 2.2 : 1.7}
          className={
            isActive
              ? "text-violet-600"
              : isLogout
              ? "text-rose-400"
              : "text-gray-400"
          }
        />
      </motion.div>

      {/* Label */}
      <motion.span
        animate={{ opacity: isActive ? 1 : 0.55 }}
        transition={{ duration: 0.15 }}
        className={`text-[10px] font-semibold tracking-wide leading-none relative z-10 ${
          isActive
            ? "text-violet-600"
            : isLogout
            ? "text-rose-400"
            : "text-gray-400"
        }`}
      >
        {label}
      </motion.span>
    </button>
  );
};

export default BottomNavigation;

