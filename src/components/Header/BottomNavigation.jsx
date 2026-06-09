import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiAward, FiShoppingBag, FiUser } from "react-icons/fi";
import { FaPaw } from "react-icons/fa";
import { HiOutlineLightBulb } from "react-icons/hi";

const MENUS = [
  { id: "challenge", label: "Challenges", Icon: FiAward,            path: "/challenge"              },
  { id: "shop",      label: "Shop",       Icon: FiShoppingBag,      path: "/shop"                   },
  { id: "home",      label: "Home",       Icon: FaPaw,              path: "/my-pets?picker=true", featured: true },
  { id: "quiz",      label: "Quiz",       Icon: HiOutlineLightBulb, path: "/quiz"                   },
  { id: "profile",   label: "Profile",    Icon: FiUser,             path: "/profile"                },
];

const matchId = (pathname) => {
  if (pathname.startsWith("/challenge"))   return "challenge";
  if (
    pathname.startsWith("/shop") || pathname.startsWith("/store") ||
    pathname.startsWith("/products") || pathname.startsWith("/cart") ||
    pathname.startsWith("/checkout") || pathname.startsWith("/orders")
  ) return "shop";
  if (pathname === "/my-pets" || pathname.startsWith("/my-pets/")) return "home";
  if (pathname.startsWith("/quiz"))        return "quiz";
  if (pathname === "/profile")             return "profile";
  return null;
};

// Tags that should trigger nav hide when focused
const FORM_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

const BottomNavigation = () => {
  const location  = useLocation();
  const activeId  = matchId(location.pathname);
  const [visible, setVisible] = useState(true);
  const lastY     = useRef(0);
  const formFocus = useRef(false);
  const showTimer = useRef(null);

  useEffect(() => {
    // ── Scroll-direction hide / show ──────────────────────────────────
    const onScroll = () => {
      const y     = window.scrollY;
      const delta = y - lastY.current;

      if (delta > 12 && y > 60 && !formFocus.current) {
        clearTimeout(showTimer.current);
        setVisible(false);
      } else if (delta < -8) {
        clearTimeout(showTimer.current);
        setVisible(true);
      }
      lastY.current = y;
    };

    // ── Input-focus hide / show ───────────────────────────────────────
    const onFocusIn = (e) => {
      if (FORM_TAGS.has(e.target.tagName) || e.target.isContentEditable) {
        formFocus.current = true;
        clearTimeout(showTimer.current);
        setVisible(false);
      }
    };

    const onFocusOut = (e) => {
      if (FORM_TAGS.has(e.target.tagName) || e.target.isContentEditable) {
        formFocus.current = false;
        // Small delay prevents flickering when tabbing between fields
        showTimer.current = setTimeout(() => setVisible(true), 350);
      }
    };

    window.addEventListener("scroll",   onScroll,   { passive: true });
    document.addEventListener("focusin",  onFocusIn,  true);
    document.addEventListener("focusout", onFocusOut, true);

    return () => {
      window.removeEventListener("scroll",   onScroll);
      document.removeEventListener("focusin",  onFocusIn,  true);
      document.removeEventListener("focusout", onFocusOut, true);
      clearTimeout(showTimer.current);
    };
  }, []);

  return (
    <div className="md:hidden">
      {/* ── Main navigation pill ─────────────────────────────────────── */}
      <AnimatePresence initial={false}>
        {visible && (
          <motion.div
            key="nav"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0,   opacity: 1 }}
            exit={{   y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 36 }}
            className="fixed bottom-0 left-0 w-full z-50 px-3 pointer-events-none"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 10px)" }}
          >
            <div
              className="relative max-w-md mx-auto rounded-[28px] pointer-events-auto overflow-visible"
              style={{
                background:    "rgba(255,255,255,0.92)",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                boxShadow:
                  "0 -1px 0 rgba(139,92,246,0.08) inset," +
                  "0 8px 32px rgba(51,38,92,0.14)," +
                  "0 2px 8px  rgba(51,38,92,0.08)",
                border: "1px solid rgba(255,255,255,0.7)",
              }}
            >
              {/* Subtle shimmer line along the top edge */}
              <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-violet-300/50 to-transparent" />

              <ul className="grid grid-cols-5 items-center px-1 py-1">
                {MENUS.map((menu) => (
                  <NavItem
                    key={menu.id}
                    menu={menu}
                    isActive={activeId === menu.id}
                  />
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Peek handle shown when nav is hidden ─────────────────────── */}
      <AnimatePresence initial={false}>
        {!visible && (
          <motion.button
            key="peek"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0,  opacity: 1 }}
            exit={{   y: 20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 38, delay: 0.08 }}
            onClick={() => {
              clearTimeout(showTimer.current);
              formFocus.current = false;
              setVisible(true);
            }}
            className="fixed left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-[7px] rounded-t-2xl"
            style={{
              bottom: 0,
              paddingBottom: "max(env(safe-area-inset-bottom, 0px), 6px)",
              background: "rgba(255,255,255,0.88)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              boxShadow: "0 -4px 16px rgba(91,67,170,0.10)",
              border: "1px solid rgba(255,255,255,0.65)",
              borderBottom: "none",
            }}
            aria-label="Show navigation"
          >
            {/* Left paw dot */}
            <FaPaw size={10} className="text-violet-300" />
            {/* Drag handle bar */}
            <div className="w-8 h-[3px] rounded-full bg-gradient-to-r from-violet-300 via-violet-400 to-violet-300" />
            {/* Right paw dot */}
            <FaPaw size={10} className="text-violet-300" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── NavItem ──────────────────────────────────────────────────────────────────

const NavItem = ({ menu, isActive }) => {
  const { Icon, label, path, featured } = menu;

  if (featured) {
    return (
      <li className="flex items-center justify-center">
        <Link
          to={path}
          className="relative flex flex-col items-center justify-center select-none -mt-5"
          style={{ WebkitTapHighlightColor: "transparent" }}
          aria-label={label}
        >
          {/* Glow behind active featured button */}
          <AnimatePresence>
            {isActive && (
              <motion.span
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1,   opacity: 1 }}
                exit={{   scale: 0.5, opacity: 0 }}
                className="absolute top-0.5 w-14 h-14 rounded-full bg-violet-300/40 blur-xl"
              />
            )}
          </AnimatePresence>

          {/* Circle button */}
          <motion.div
            animate={{ scale: isActive ? 1.07 : 1, y: isActive ? -2 : 0 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 480, damping: 30 }}
            className={`relative z-10 w-12 h-12 rounded-full border-[3px] border-white flex items-center justify-center ${
              isActive
                ? "bg-gradient-to-br from-violet-500 to-indigo-600 shadow-[0_8px_22px_rgba(91,67,170,0.45)]"
                : "bg-gradient-to-br from-violet-500 to-purple-600 shadow-[0_6px_16px_rgba(91,67,170,0.28)]"
            }`}
          >
            <Icon size={18} className="text-white" />
            {/* Inner ring */}
            <span className="absolute inset-1 rounded-full border border-white/25 pointer-events-none" />
          </motion.div>

          <span
            className={`text-[9px] font-extrabold mt-1 leading-none transition-colors ${
              isActive ? "text-violet-700" : "text-slate-400"
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
        className="relative flex flex-col items-center justify-center py-2 px-1 w-full select-none rounded-2xl"
        style={{ WebkitTapHighlightColor: "transparent" }}
        aria-label={label}
      >
        {/* Active background pill */}
        {isActive && (
          <motion.div
            layoutId="nav-active-bg"
            className="absolute inset-x-0.5 top-0.5 bottom-0.5 rounded-2xl bg-violet-50"
            style={{ boxShadow: "inset 0 0 0 1px rgba(139,92,246,0.12)" }}
            transition={{ type: "spring", stiffness: 420, damping: 36 }}
          />
        )}

        {/* Icon */}
        <motion.div
          className="relative z-10"
          animate={{ y: isActive ? -1 : 0, scale: isActive ? 1.1 : 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        >
          <Icon
            size={18}
            className={`transition-colors duration-150 ${
              isActive ? "text-violet-700" : "text-slate-400"
            }`}
          />
          {/* Active indicator dot */}
          <AnimatePresence>
            {isActive && (
              <motion.span
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{   scale: 0, opacity: 0 }}
                className="absolute -top-[3px] -right-[3px] w-[6px] h-[6px] rounded-full bg-violet-500"
              />
            )}
          </AnimatePresence>
        </motion.div>

        {/* Label */}
        <span
          className={`relative z-10 text-[9px] font-semibold mt-0.5 leading-none transition-colors duration-150 truncate max-w-full ${
            isActive ? "text-violet-700" : "text-slate-400"
          }`}
        >
          {label}
        </span>
      </Link>
    </li>
  );
};

export default BottomNavigation;
