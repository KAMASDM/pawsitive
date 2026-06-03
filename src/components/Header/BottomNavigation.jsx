import React from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiAward, FiShoppingBag, FiUser } from "react-icons/fi";
import { FaPaw } from "react-icons/fa";
import { HiOutlineLightBulb } from "react-icons/hi";

const MENUS = [
  { id: "challenge", label: "Challenge", Icon: FiAward,            path: "/challenge"  },
  { id: "shop",      label: "Shop",      Icon: FiShoppingBag,      path: "/shop"       },
  { id: "home",      label: "Home",      Icon: FaPaw,              path: "/my-pets?picker=true", featured: true },
  { id: "quiz",      label: "Quiz",      Icon: HiOutlineLightBulb, path: "/quiz"       },
  { id: "profile",   label: "Profile",   Icon: FiUser,             path: "/profile"    },
];

const matchId = (pathname) => {
  if (pathname.startsWith("/challenge"))                           return "challenge";
  if (pathname.startsWith("/shop") || pathname.startsWith("/store") || pathname.startsWith("/products") || pathname.startsWith("/cart") || pathname.startsWith("/checkout") || pathname.startsWith("/orders")) return "shop";
  if (pathname === "/my-pets" || pathname.startsWith("/my-pets/")) return "home";
  if (pathname.startsWith("/quiz"))                                return "quiz";
  if (pathname === "/profile")                                     return "profile";
  return null;
};

const BottomNavigation = () => {
  const location = useLocation();
  const activeId = matchId(location.pathname);

  return (
    <div
      className="fixed bottom-0 left-0 w-full md:hidden z-50 px-3 pb-3 pointer-events-none"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)" }}
    >
      <div
        className="relative max-w-md mx-auto rounded-[28px] border border-white/70 shadow-[0_18px_45px_rgba(51,38,92,0.2)] pointer-events-auto overflow-visible"
        style={{ background: "rgba(255,255,255,0.9)", backdropFilter: "blur(22px)" }}
      >
        <div className="absolute inset-x-7 top-0 h-px bg-gradient-to-r from-transparent via-violet-300 to-transparent" />
        <div className="absolute left-1/2 top-0 h-8 w-24 -translate-x-1/2 -translate-y-1/2 rounded-b-full bg-[#f4f1fb]" />

        <ul className="relative z-10 grid grid-cols-5 items-end gap-1 px-2 pt-2 pb-2">
          {MENUS.map((menu) => {
            const isActive = activeId === menu.id;
            return (
              <NavItem
                key={menu.id}
                menu={menu}
                isActive={isActive}
              />
            );
          })}
        </ul>
      </div>
    </div>
  );
};

const NavItem = ({ menu, isActive }) => {
  const { Icon, label, path, featured } = menu;

  if (featured) {
    return (
      <li className="flex items-center justify-center">
        <Link
          to={path}
          className="relative -top-6 flex h-[78px] min-w-0 flex-col items-center justify-start select-none"
          style={{ WebkitTapHighlightColor: "transparent" }}
          aria-label={label}
        >
          <AnimatePresence>
            {isActive && (
              <motion.span
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.7, opacity: 0 }}
                className="absolute top-0.5 h-[68px] w-[68px] rounded-full bg-violet-200/60 blur-md"
              />
            )}
          </AnimatePresence>
          <motion.div
            animate={{ y: isActive ? -2 : 0 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className={`relative z-10 w-16 h-16 rounded-full border-4 border-white shadow-[0_14px_30px_rgba(91,67,170,0.32)] flex items-center justify-center ${
              isActive
                ? "bg-gradient-to-br from-violet-600 to-indigo-700"
                : "bg-gradient-to-br from-violet-500 to-purple-600"
            }`}
          >
            <Icon className="text-white" size={22} />
            <span className="absolute inset-1 rounded-full border border-white/20" />
          </motion.div>
          <span
            className={`relative z-10 mt-1 text-[10px] font-extrabold leading-none ${
              isActive ? "text-violet-700" : "text-slate-500"
            }`}
          >
            {label}
          </span>
        </Link>
      </li>
    );
  }

  return (
    <li className="flex items-center justify-center min-w-0">
      <Link
        to={path}
        className="relative flex h-[62px] w-full min-w-0 flex-col items-center justify-center gap-1 select-none rounded-2xl"
        style={{ WebkitTapHighlightColor: "transparent" }}
        aria-label={label}
      >
        <AnimatePresence>
          {isActive && (
            <motion.span
              layoutId="bottom-nav-active"
              className="absolute inset-x-1 top-1 bottom-1 rounded-2xl bg-violet-50 border border-violet-100"
              transition={{ type: "spring", stiffness: 420, damping: 34 }}
            />
          )}
        </AnimatePresence>
        <motion.div
          animate={{ y: isActive ? -2 : 0, scale: isActive ? 1.04 : 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="relative z-10 flex items-center justify-center w-9 h-8 rounded-xl"
        >
          <Icon
            size={20}
            className={`transition-colors ${isActive ? "text-violet-700" : "text-slate-500"}`}
          />
          <AnimatePresence>
            {isActive && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-violet-500"
              />
            )}
          </AnimatePresence>
        </motion.div>

        <motion.span
          animate={{ opacity: isActive ? 1 : 0.55 }}
          transition={{ duration: 0.15 }}
          className={`relative z-10 text-[10px] font-bold leading-none truncate max-w-full ${
            isActive ? "text-violet-700" : "text-slate-500"
          }`}
        >
          {label}
        </motion.span>
      </Link>
    </li>
  );
};

export default BottomNavigation;

