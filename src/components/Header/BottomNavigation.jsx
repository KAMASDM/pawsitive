import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { auth } from "../../firebase"; // Ensure this path is correct
import { FiHome, FiUser, FiLogOut } from "react-icons/fi";
import { MdQuestionAnswer } from "react-icons/md"; // FAQ icon
import { BsGrid } from "react-icons/bs";

const BottomNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    auth.signOut();
    navigate("/");
  };

  const menus = [
    { name: "FAQ", icon: <MdQuestionAnswer />, path: "/faq" },
    { name: "Resource", icon: <BsGrid />, path: "/resource" },
    { name: "Home", icon: <FiHome />, path: "/dashboard" },
    { name: "Profile", icon: <FiUser />, path: "/profile" },
    { name: "Logout", icon: <FiLogOut />, path: "/", onClick: handleLogout },
  ];

  const { pathname } = location;
  const [activeMenu, setActiveMenu] = useState(2); // Default to Home

  useEffect(() => {
    switch (pathname) {
      case "/faq":
        setActiveMenu(0);
        break;
      case "/resource":
        setActiveMenu(1);
        break;
      case "/dashboard":
        setActiveMenu(2);
        break;
      case "/profile":
        setActiveMenu(3);
        break;
      default:
        setActiveMenu(-1);
    }
  }, [pathname]);

  return (
    <div className="fixed bottom-0 left-0 w-full md:hidden h-[70px] z-50">
      <ul className="w-full flex justify-between items-center bg-lavender-700 text-white h-full shadow-lg">
        {menus.map((menu, index) => (
          <li
            key={index}
            className={`w-full h-full flex items-center justify-center text-center ${activeMenu === index ? "bg-lavender-800" : ""
              }`}
          >
            <Link
              onClick={() => {
                if (menu.name !== "Logout") {
                  setActiveMenu(index);
                }
                menu.onClick && menu.onClick();
              }}
              to={menu.path}
              className={`${activeMenu === index ? "gap-[6px]" : "gap-1"
                } flex flex-col items-center justify-center text-center h-full w-full`}
            >
              <span className={activeMenu === index ? "text-2xl" : "text-xl"}>
                {menu.icon}
              </span>
              <span
                className={`${activeMenu === index
                  ? "text-sm bg-white text-lavender-600 px-2 mt-1 rounded-sm"
                  : "text-xs"
                  }`}
              >
                {menu.name}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default BottomNavigation;
