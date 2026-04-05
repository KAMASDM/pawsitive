import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { auth } from "../../firebase";
import { FiHome, FiUser, FiLogOut } from "react-icons/fi";
import { MdQuestionAnswer } from "react-icons/md";
import { BsGrid } from "react-icons/bs";

const MENUS = [
  { id: "faq",      label: "FAQ",      Icon: MdQuestionAnswer, path: "/faq"      },
  { id: "resource", label: "Resource", Icon: BsGrid,           path: "/resource" },
  { id: "home",     label: "Home",     Icon: FiHome,           path: "/my-pets"  },
  { id: "profile",  label: "Profile",  Icon: FiUser,           path: "/profile"  },
  { id: "logout",   label: "Logout",   Icon: FiLogOut,         path: "/"         },
];

const matchId = (pathname) => {
  if (pathname === "/faq")                                        return "faq";
  if (pathname.startsWith("/resource"))                           return "resource";
  if (pathname === "/my-pets" || pathname.startsWith("/my-pets/")) return "home";
  if (pathname === "/profile")                                    return "profile";
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
      <ul className="w-full flex justify-between items-center bg-lavender-700 text-white shadow-[0_-2px_16px_rgba(0,0,0,0.18)]">
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
  );
};

/* ── Individual nav item ── */
const NavItem = ({ menu, isActive, onLogout }) => {
  const { Icon, label, id, path } = menu;

  return (
    <li className={`w-full flex items-center justify-center ${isActive ? "bg-lavender-800" : ""}`}>
      <Link
        to={path}
        onClick={onLogout || undefined}
        className="flex flex-col items-center justify-center w-full h-[62px] gap-0.5 select-none"
        style={{ WebkitTapHighlightColor: "transparent" }}
        aria-label={label}
      >
        {/* Icon */}
        <motion.span
          animate={{
            scale: isActive ? 1.15 : 1,
            y:     isActive ? -2   : 0,
          }}
          transition={{ type: "spring", stiffness: 500, damping: 36 }}
          className={`text-2xl leading-none ${isActive ? "text-white" : "text-lavender-200"}`}
        >
          <Icon />
        </motion.span>

        {/* Label */}
        <motion.span
          animate={{ opacity: isActive ? 1 : 0.65 }}
          transition={{ duration: 0.15 }}
          className={`leading-none text-[10px] font-semibold tracking-wide ${
            isActive
              ? "bg-white text-lavender-700 px-2 py-0.5 rounded-sm"
              : "text-lavender-200"
          }`}
        >
          {label}
        </motion.span>
      </Link>
    </li>
  );
};

export default BottomNavigation;

