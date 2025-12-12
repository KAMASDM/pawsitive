// import React, { useState, useEffect, useCallback, useRef } from "react";
// import { Link, useLocation, useNavigate } from "react-router-dom";
// import { auth, database } from "../../firebase";
// import logo from "../../images/logo.png";
// import BottomNavigation from "./BottomNavigation";
// import { get, ref, update } from "firebase/database";
// import {
//   FiHome,
//   FiUser,
//   FiLogOut,
//   FiMenu,
//   FiX,
//   FiBell,
//   FiHelpCircle,
//   FiArrowRight,
//   FiInbox,
// } from "react-icons/fi";
// import { BsGrid } from "react-icons/bs";

// // --- Notifications Popup Component (Fixed Click Issue) ---
// const NotificationsPopup = ({ requests, isOpen, onClose, onUpdateRequest }) => {
//   const popupRef = useRef();
//   const navigate = useNavigate();

//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (popupRef.current && !popupRef.current.contains(event.target)) {
//         onClose();
//       }
//     };
//     if (isOpen) {
//       document.addEventListener("click", handleClickOutside);
//     }
//     return () => {
//       document.removeEventListener("click", handleClickOutside);
//     };
//   }, [isOpen, onClose]);

//   const handleNavigate = () => {
//     onClose();
//     navigate("/profile");
//   };

//   if (!isOpen) return null;

//   return (
//     <div
//       ref={popupRef}
//       className="absolute top-full mt-2 right-0 w-80 md:w-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 overflow-hidden"
//     >
//       <div className="p-4 border-b border-gray-100 flex justify-between items-center">
//         <h3 className="font-semibold text-gray-800">Mating Requests</h3>
//         <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
//           <FiX className="w-4 h-4 text-gray-500" />
//         </button>
//       </div>
//       <div className="max-h-96 overflow-y-auto">
//         {requests.length > 0 ? (
//           <ul>
//             {requests.map((req) => (
//               <li key={req.id} className="p-4 border-b border-gray-100 hover:bg-lavender-50 transition-colors">
//                 <Link to="/profile" onClick={onClose} className="block">
//                   <div className="flex items-center">
//                     <div className="flex-shrink-0 w-10 h-10 rounded-full bg-lavender-100 overflow-hidden mr-3">
//                       <img
//                         src={req.direction === "incoming" ? req.senderPetImage : req.receiverPetImage}
//                         alt="Pet"
//                         className="w-full h-full object-cover"
//                       />
//                     </div>
//                     <div className="flex-grow">
//                       <p className="text-sm text-gray-700">
//                         <span className="font-semibold">
//                           {req.direction === "incoming" ? req.senderName : req.receiverName}
//                         </span>
//                         {req.direction === "incoming"
//                           ? " sent a request for "
//                           : " received a request for "}
//                         <span className="font-semibold">
//                           {req.direction === "incoming" ? req.receiverPetName : req.senderPetName}
//                         </span>
//                       </p>
//                       <div
//                         className={`text-xs font-bold mt-1 ${req.status === "pending"
//                           ? "text-yellow-600"
//                           : req.status === "accepted"
//                             ? "text-green-600"
//                             : "text-red-600"
//                           }`}
//                       >
//                         {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
//                       </div>
//                     </div>
//                   </div>
//                 </Link>

//                 {req.direction === "incoming" && req.status === "pending" && (
//                   <div className="mt-3 flex items-center justify-end gap-2">
//                     <button
//                       onClick={() => onUpdateRequest(req, "declined")}
//                       className="px-3 py-1 text-xs font-semibold text-red-700 bg-red-100 hover:bg-red-200 rounded-md transition-colors"
//                     >
//                       Decline
//                     </button>
//                     <button
//                       onClick={() => onUpdateRequest(req, "accepted")}
//                       className="px-3 py-1 text-xs font-semibold text-white bg-green-500 hover:bg-green-600 rounded-md transition-colors"
//                     >
//                       Accept
//                     </button>
//                   </div>
//                 )}
//               </li>
//             ))}
//           </ul>
//         ) : (
//           <div className="text-center p-8">
//             <FiInbox className="mx-auto text-4xl text-gray-300" />
//             <p className="mt-4 text-sm text-gray-500">No requests yet.</p>
//           </div>
//         )}
//       </div>
//       <div className="p-2 bg-gray-50 border-t border-gray-100">
//         <button
//           onClick={handleNavigate}
//           className="w-full flex items-center justify-center text-sm font-semibold text-lavender-600 hover:text-lavender-800 transition-colors"
//         >
//           View All in Profile <FiArrowRight className="ml-1" />
//         </button>
//       </div>
//     </div>
//   );
// };

// const Header = () => {
//   const navigate = useNavigate();
//   const [user, setUser] = useState(null);
//   const [isMenuOpen, setIsMenuOpen] = useState(false);
//   const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
//   const [matingRequests, setMatingRequests] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const unsubscribe = auth.onAuthStateChanged((user) => {
//       setUser(user ? user : null);
//       setLoading(false);
//     });
//     return () => unsubscribe();
//   }, []);

//   const handleLogout = () => {
//     auth.signOut();
//     navigate("/");
//     setIsMenuOpen(false);
//   };

//   const handleUpdateRequestStatus = async (request, newStatus) => {
//     try {
//       const updates = {};
//       const timestamp = Date.now();

//       updates[`matingRequests/received/${user.uid}/${request.id}/status`] = newStatus;
//       updates[`matingRequests/received/${user.uid}/${request.id}/updatedAt`] = timestamp;
//       updates[`matingRequests/sent/${request.senderId}/${request.id}/status`] = newStatus;
//       updates[`matingRequests/sent/${request.senderId}/${request.id}/updatedAt`] = timestamp;

//       await update(ref(database), updates);

//       setMatingRequests((prev) =>
//         prev.map((req) => (req.id === request.id ? { ...req, status: newStatus } : req))
//       );
//     } catch (error) {
//       console.error(`Error updating request to ${newStatus}:`, error);
//     }
//   };

//   const fetchMatingRequests = useCallback(async () => {
//     if (!user) return;

//     try {
//       const incomingRef = ref(database, `matingRequests/received/${user.uid}`);
//       const sentRef = ref(database, `matingRequests/sent/${user.uid}`);
//       const [incomingSnap, sentSnap] = await Promise.all([get(incomingRef), get(sentRef)]);
//       const requests = [];

//       const processSnapshot = async (snap, direction) => {
//         if (!snap.exists()) return [];
//         const data = snap.val();
//         const promises = Object.keys(data).map(async (id) => {
//           const req = data[id];
//           const otherUserId = direction === "incoming" ? req.senderId : req.receiverId;

//           const [userSnap, senderPetSnap, receiverPetSnap] = await Promise.all([
//             get(ref(database, `users/${otherUserId}`)),
//             get(ref(database, `userPets/${req.senderId}/${req.senderPetId}`)),
//             get(ref(database, `userPets/${req.receiverId}/${req.receiverPetId}`)),
//           ]);

//           return {
//             id,
//             ...req,
//             direction,
//             senderName: direction === "incoming" ? userSnap.val()?.displayName : user.displayName,
//             receiverName: direction === "outgoing" ? userSnap.val()?.displayName : user.displayName,
//             senderPetName: senderPetSnap.val()?.name || "Unknown",
//             senderPetImage: senderPetSnap.val()?.image || "",
//             receiverPetName: receiverPetSnap.val()?.name || "Unknown",
//             receiverPetImage: receiverPetSnap.val()?.image || "",
//           };
//         });
//         return Promise.all(promises);
//       };

//       const incoming = await processSnapshot(incomingSnap, "incoming");
//       const outgoing = await processSnapshot(sentSnap, "outgoing");

//       requests.push(...incoming.filter(Boolean), ...outgoing.filter(Boolean));
//       requests.sort((a, b) => b.createdAt - a.createdAt);
//       setMatingRequests(requests);
//     } catch (error) {
//       console.error("Error fetching mating requests:", error);
//     }
//   }, [user]);

//   useEffect(() => {
//     if (user) fetchMatingRequests();
//   }, [user, fetchMatingRequests]);

//   const pendingRequestsCount = matingRequests.filter(
//     (req) => req.direction === "incoming" && req.status === "pending"
//   ).length;

//   if (loading || !user) return null;

//   return (
//     <>
//       <header className="bg-lavender-700 text-lavender-100 shadow-lg sticky top-0 z-50">
//         <div className="container mx-auto px-4 py-3">
//           <div className="flex justify-between items-center">
//             <Link to="/dashboard" className="flex items-center hover:opacity-90 transition-opacity">
//               <img src={logo} alt="Pawppy" className="h-10 mr-3" />
//               <span className="text-2xl font-bold text-white hidden sm:inline">Pawppy</span>
//             </Link>

//             {/* Desktop Nav */}
//             <nav className="hidden md:flex items-center space-x-2">
//               <NavLink to="/dashboard"><FiHome className="mr-1" /> Home</NavLink>
//               <NavLink to="/resource"><BsGrid className="mr-1" /> Resources</NavLink>
//               <NavLink to="/profile"><FiUser className="mr-1" /> Profile</NavLink>
//               <NavLink to="/faq"><FiHelpCircle className="mr-1" /> FAQ</NavLink>

//               <div className="relative">
//                 <button
//                   onClick={() => setIsNotificationsOpen((prev) => !prev)}
//                   className="flex items-center text-lavender-200 hover:text-white hover:bg-lavender-700 px-3 py-2 rounded-lg transition-colors"
//                 >
//                   <FiBell className="mr-1" />
//                   Notifications
//                   {pendingRequestsCount > 0 && (
//                     <span className="ml-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
//                       {pendingRequestsCount}
//                     </span>
//                   )}
//                 </button>
//                 <NotificationsPopup
//                   isOpen={isNotificationsOpen}
//                   onClose={() => setIsNotificationsOpen(false)}
//                   requests={matingRequests}
//                   onUpdateRequest={handleUpdateRequestStatus}
//                 />
//               </div>

//               <button
//                 onClick={handleLogout}
//                 className="flex items-center text-lavender-200 hover:text-white hover:bg-lavender-700 px-3 py-2 rounded-lg transition-colors"
//               >
//                 <FiLogOut className="mr-1" /> Logout
//               </button>
//             </nav>

//             {/* Mobile Controls */}
//             <div className="md:hidden flex items-center space-x-3">
//               <div className="relative">
//                 <button
//                   onClick={() => setIsNotificationsOpen((prev) => !prev)}
//                   className="text-lavender-200 hover:text-white transition-colors"
//                 >
//                   <FiBell size={20} />
//                   {pendingRequestsCount > 0 && (
//                     <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
//                       {pendingRequestsCount}
//                     </span>
//                   )}
//                 </button>
//                 <NotificationsPopup
//                   isOpen={isNotificationsOpen}
//                   onClose={() => setIsNotificationsOpen(false)}
//                   requests={matingRequests}
//                   onUpdateRequest={handleUpdateRequestStatus}
//                 />
//               </div>
//               <button
//                 onClick={() => setIsMenuOpen(!isMenuOpen)}
//                 className="text-lavender-200 hover:text-white transition-colors"
//               >
//                 {isMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
//               </button>
//             </div>
//           </div>
//         </div>

//         {/* Mobile Nav Menu */}
//         {isMenuOpen && (
//           <div className="md:hidden bg-lavender-800 animate-fadeIn">
//             <div className="container mx-auto px-4 py-2 space-y-1">
//               <MobileNavLink to="/dashboard" onClick={() => setIsMenuOpen(false)}>
//                 <FiHome className="mr-2" /> Home
//               </MobileNavLink>
//               <MobileNavLink to="/resource" onClick={() => setIsMenuOpen(false)}>
//                 <BsGrid className="mr-2" /> Resources
//               </MobileNavLink>
//               <MobileNavLink to="/profile" onClick={() => setIsMenuOpen(false)}>
//                 <FiUser className="mr-2" /> Profile
//               </MobileNavLink>
//               <MobileNavLink to="/faq" onClick={() => setIsMenuOpen(false)}>
//                 <FiHelpCircle className="mr-2" /> FAQ
//               </MobileNavLink>
//               <button
//                 onClick={handleLogout}
//                 className="flex items-center w-full text-left py-2 px-4 text-lavender-200 hover:text-white hover:bg-lavender-700 rounded-lg transition-colors"
//               >
//                 <FiLogOut className="mr-2" /> Logout
//               </button>
//             </div>
//           </div>
//         )}
//       </header>

//       <BottomNavigation />
//     </>
//   );
// };

// const NavLink = ({ to, children }) => {
//   const location = useLocation();
//   const isActive = location.pathname === to;
//   return (
//     <Link
//       to={to}
//       className={`flex items-center px-3 py-2 rounded-lg transition-colors ${isActive ? "text-white bg-lavender-800" : "text-lavender-200 hover:text-white hover:bg-lavender-700"
//         }`}
//     >
//       {children}
//     </Link>
//   );
// };

// const MobileNavLink = ({ to, onClick, children }) => {
//   const location = useLocation();
//   const isActive = location.pathname === to;
//   return (
//     <Link
//       to={to}
//       onClick={onClick}
//       className={`flex items-center py-2 px-4 rounded-lg transition-colors ${isActive ? "text-white bg-lavender-700" : "text-lavender-200 hover:text-white hover:bg-lavender-700"
//         }`}
//     >
//       {children}
//     </Link>
//   );
// };

// export default Header;
import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { auth, database } from "../../firebase";
import logo from "../../images/logo.png";
import BottomNavigation from "./BottomNavigation";
import { get, ref, update } from "firebase/database";
import {
  FiHome,
  FiUser,
  FiLogOut,
  FiMenu,
  FiX,
  FiBell,
  FiHelpCircle,
  FiArrowRight,
  FiInbox,
} from "react-icons/fi";
import { BsGrid } from "react-icons/bs";

// --- Notifications Popup Component (Fixed Click Issue) ---
const NotificationsPopup = ({ requests, isOpen, onClose, onUpdateRequest }) => {
  const popupRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if the click is on the notification button itself
      const notificationButton = event.target.closest('button');
      if (notificationButton && notificationButton.querySelector('.mr-1')) {
        return; // Don't close if clicking the notification button
      }
      
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        onClose();
      }
    };
    if (isOpen) {
      // Use mousedown instead of click to capture earlier
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleNavigate = () => {
    onClose();
    navigate("/profile");
  };

  if (!isOpen) return null;

  return (
    <div
      ref={popupRef}
      className="absolute top-full mt-2 right-0 w-80 md:w-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-[9999] overflow-hidden"
    >
      <div className="p-4 border-b border-gray-100 flex justify-between items-center">
        <h3 className="font-semibold text-gray-800">Mating Requests</h3>
        <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
          <FiX className="w-4 h-4 text-gray-500" />
        </button>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {requests.length > 0 ? (
          <ul>
            {requests.map((req) => (
              <li key={req.id} className="p-4 border-b border-gray-100 hover:bg-lavender-50 transition-colors">
                <Link to="/profile" onClick={onClose} className="block">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-lavender-100 overflow-hidden mr-3">
                      <img
                        src={req.direction === "incoming" ? req.senderPetImage : req.receiverPetImage}
                        alt="Pet"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-grow">
                      <p className="text-sm text-gray-700">
                        <span className="font-semibold">
                          {req.direction === "incoming" ? req.senderName : req.receiverName}
                        </span>
                        {req.direction === "incoming"
                          ? " sent a request for "
                          : " received a request for "}
                        <span className="font-semibold">
                          {req.direction === "incoming" ? req.receiverPetName : req.senderPetName}
                        </span>
                      </p>
                      <div
                        className={`text-xs font-bold mt-1 ${req.status === "pending"
                          ? "text-yellow-600"
                          : req.status === "accepted"
                            ? "text-green-600"
                            : "text-red-600"
                          }`}
                      >
                        {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                      </div>
                    </div>
                  </div>
                </Link>

                {req.direction === "incoming" && req.status === "pending" && (
                  <div className="mt-3 flex items-center justify-end gap-2">
                    <button
                      onClick={() => onUpdateRequest(req, "declined")}
                      className="px-3 py-1 text-xs font-semibold text-red-700 bg-red-100 hover:bg-red-200 rounded-md transition-colors"
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => onUpdateRequest(req, "accepted")}
                      className="px-3 py-1 text-xs font-semibold text-white bg-green-500 hover:bg-green-600 rounded-md transition-colors"
                    >
                      Accept
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center p-8">
            <FiInbox className="mx-auto text-4xl text-gray-300" />
            <p className="mt-4 text-sm text-gray-500">No requests yet.</p>
          </div>
        )}
      </div>
      <div className="p-2 bg-gray-50 border-t border-gray-100">
        <button
          onClick={handleNavigate}
          className="w-full flex items-center justify-center text-sm font-semibold text-lavender-600 hover:text-lavender-800 transition-colors"
        >
          View All in Profile <FiArrowRight className="ml-1" />
        </button>
      </div>
    </div>
  );
};

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [matingRequests, setMatingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);

  // Check if we're on the home/dashboard page
  const isHomePage = location.pathname === "/dashboard" || location.pathname === "/";

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user ? user : null);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Scroll event listener
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      setIsScrolled(scrollTop > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    auth.signOut();
    navigate("/");
    setIsMenuOpen(false);
  };

  const handleUpdateRequestStatus = async (request, newStatus) => {
    try {
      const updates = {};
      const timestamp = Date.now();

      updates[`matingRequests/received/${user.uid}/${request.id}/status`] = newStatus;
      updates[`matingRequests/received/${user.uid}/${request.id}/updatedAt`] = timestamp;
      updates[`matingRequests/sent/${request.senderId}/${request.id}/status`] = newStatus;
      updates[`matingRequests/sent/${request.senderId}/${request.id}/updatedAt`] = timestamp;

      await update(ref(database), updates);

      setMatingRequests((prev) =>
        prev.map((req) => (req.id === request.id ? { ...req, status: newStatus } : req))
      );
    } catch (error) {
      console.error(`Error updating request to ${newStatus}:`, error);
    }
  };

  const fetchMatingRequests = useCallback(async () => {
    if (!user) return;

    try {
      const incomingRef = ref(database, `matingRequests/received/${user.uid}`);
      const sentRef = ref(database, `matingRequests/sent/${user.uid}`);
      const [incomingSnap, sentSnap] = await Promise.all([get(incomingRef), get(sentRef)]);
      const requests = [];

      const processSnapshot = async (snap, direction) => {
        if (!snap.exists()) return [];
        const data = snap.val();
        const promises = Object.keys(data).map(async (id) => {
          const req = data[id];
          const otherUserId = direction === "incoming" ? req.senderId : req.receiverId;

          const [userSnap, senderPetSnap, receiverPetSnap] = await Promise.all([
            get(ref(database, `users/${otherUserId}`)),
            get(ref(database, `userPets/${req.senderId}/${req.senderPetId}`)),
            get(ref(database, `userPets/${req.receiverId}/${req.receiverPetId}`)),
          ]);

          return {
            id,
            ...req,
            direction,
            senderName: direction === "incoming" ? userSnap.val()?.displayName : user.displayName,
            receiverName: direction === "outgoing" ? userSnap.val()?.displayName : user.displayName,
            senderPetName: senderPetSnap.val()?.name || "Unknown",
            senderPetImage: senderPetSnap.val()?.image || "",
            receiverPetName: receiverPetSnap.val()?.name || "Unknown",
            receiverPetImage: receiverPetSnap.val()?.image || "",
          };
        });
        return Promise.all(promises);
      };

      const incoming = await processSnapshot(incomingSnap, "incoming");
      const outgoing = await processSnapshot(sentSnap, "outgoing");

      requests.push(...incoming.filter(Boolean), ...outgoing.filter(Boolean));
      requests.sort((a, b) => b.createdAt - a.createdAt);
      setMatingRequests(requests);
    } catch (error) {
      console.error("Error fetching mating requests:", error);
    }
  }, [user]);

  useEffect(() => {
    if (user) fetchMatingRequests();
  }, [user, fetchMatingRequests]);

  const pendingRequestsCount = matingRequests.filter(
    (req) => req.direction === "incoming" && req.status === "pending"
  ).length;

  // Dynamic classes based on scroll and page
  const getHeaderClasses = () => {
    if (isHomePage) {
      return isScrolled
        ? "bg-white shadow-lg text-gray-800"
        : "bg-gradient-to-br from-slate-50 to-violet-50 text-gray-800";
    }
    return "bg-lavender-700 text-lavender-100 shadow-lg";
  };

  const getLogoTextClasses = () => {
    if (isHomePage) {
      return "bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent";
    }
    return "text-white";
  };

  const getNavLinkClasses = (isActive) => {
    if (isHomePage) {
      return isActive
        ? "text-white bg-gradient-to-r from-violet-600 to-indigo-600 shadow-lg"
        : "text-gray-700 hover:text-white hover:bg-gradient-to-r hover:from-violet-600 hover:to-indigo-600";
    }
    return isActive
      ? "text-white bg-lavender-800"
      : "text-lavender-200 hover:text-white hover:bg-lavender-700";
  };

  const getButtonClasses = () => {
    if (isHomePage) {
      return "text-gray-700 hover:text-white hover:bg-gradient-to-r hover:from-violet-600 hover:to-indigo-600";
    }
    return "text-lavender-200 hover:text-white hover:bg-lavender-700";
  };

  const getMobileIconClasses = () => {
    if (isHomePage) {
      return "text-gray-700 hover:text-violet-600";
    }
    return "text-lavender-200 hover:text-white";
  };

  const getMobileMenuClasses = () => {
    if (isHomePage) {
      return "bg-gradient-to-br from-violet-50 to-indigo-50";
    }
    return "bg-lavender-800";
  };

  const getMobileNavLinkClasses = (isActive) => {
    if (isHomePage) {
      return isActive
        ? "text-white bg-gradient-to-r from-violet-600 to-indigo-600 shadow-lg"
        : "text-gray-700 hover:text-white hover:bg-gradient-to-r hover:from-violet-600 hover:to-indigo-600";
    }
    return isActive
      ? "text-white bg-lavender-700"
      : "text-lavender-200 hover:text-white hover:bg-lavender-700";
  };

  if (loading || !user) return null;

  return (
    <>
      <header className={`sticky top-0 z-[100] transition-all duration-300 ${getHeaderClasses()}`}>
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <Link to="/dashboard" className="flex items-center hover:opacity-90 transition-opacity">
              <img src={logo} alt="Pawppy" className="h-10 mr-3" />
              <span className={`text-2xl font-bold hidden sm:inline transition-all duration-300 ${getLogoTextClasses()}`}>
                Pawppy
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center space-x-2">
              <NavLink
                to="/dashboard"
                className={getNavLinkClasses(location.pathname === "/dashboard")}
              >
                <FiHome className="mr-1" /> Home
              </NavLink>
              <NavLink
                to="/resource"
                className={getNavLinkClasses(location.pathname === "/resource")}
              >
                <BsGrid className="mr-1" /> Resources
              </NavLink>
              <NavLink
                to="/profile"
                className={getNavLinkClasses(location.pathname === "/profile")}
              >
                <FiUser className="mr-1" /> Profile
              </NavLink>
              <NavLink
                to="/faq"
                className={getNavLinkClasses(location.pathname === "/faq")}
              >
                <FiHelpCircle className="mr-1" /> FAQ
              </NavLink>

              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsNotificationsOpen((prev) => !prev);
                  }}
                  className={`flex items-center px-3 py-2 rounded-lg transition-all duration-300 ${getButtonClasses()}`}
                >
                  <FiBell className="mr-1" />
                  Notifications
                  {pendingRequestsCount > 0 && (
                    <span className="ml-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {pendingRequestsCount}
                    </span>
                  )}
                </button>
                <NotificationsPopup
                  isOpen={isNotificationsOpen}
                  onClose={() => setIsNotificationsOpen(false)}
                  requests={matingRequests}
                  onUpdateRequest={handleUpdateRequestStatus}
                />
              </div>

              <button
                onClick={handleLogout}
                className={`flex items-center px-3 py-2 rounded-lg transition-all duration-300 ${getButtonClasses()}`}
              >
                <FiLogOut className="mr-1" /> Logout
              </button>
            </nav>

            {/* Mobile Controls */}
            <div className="md:hidden flex items-center space-x-3">
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsNotificationsOpen((prev) => !prev);
                  }}
                  className={`transition-colors ${getMobileIconClasses()}`}
                >
                  <FiBell size={20} />
                  {pendingRequestsCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {pendingRequestsCount}
                    </span>
                  )}
                </button>
                <NotificationsPopup
                  isOpen={isNotificationsOpen}
                  onClose={() => setIsNotificationsOpen(false)}
                  requests={matingRequests}
                  onUpdateRequest={handleUpdateRequestStatus}
                />
              </div>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`transition-colors ${getMobileIconClasses()}`}
              >
                {isMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav Menu */}
        {isMenuOpen && (
          <div className={`md:hidden animate-fadeIn ${getMobileMenuClasses()}`}>
            <div className="container mx-auto px-4 py-2 space-y-1">
              <MobileNavLink
                to="/dashboard"
                onClick={() => setIsMenuOpen(false)}
                className={getMobileNavLinkClasses(location.pathname === "/dashboard")}
              >
                <FiHome className="mr-2" /> Home
              </MobileNavLink>
              <MobileNavLink
                to="/resource"
                onClick={() => setIsMenuOpen(false)}
                className={getMobileNavLinkClasses(location.pathname === "/resource")}
              >
                <BsGrid className="mr-2" /> Resources
              </MobileNavLink>
              <MobileNavLink
                to="/profile"
                onClick={() => setIsMenuOpen(false)}
                className={getMobileNavLinkClasses(location.pathname === "/profile")}
              >
                <FiUser className="mr-2" /> Profile
              </MobileNavLink>
              <MobileNavLink
                to="/faq"
                onClick={() => setIsMenuOpen(false)}
                className={getMobileNavLinkClasses(location.pathname === "/faq")}
              >
                <FiHelpCircle className="mr-2" /> FAQ
              </MobileNavLink>
              <button
                onClick={handleLogout}
                className={`flex items-center w-full text-left py-2 px-4 rounded-lg transition-all duration-300 ${getButtonClasses()}`}
              >
                <FiLogOut className="mr-2" /> Logout
              </button>
            </div>
          </div>
        )}
      </header>

      <BottomNavigation />
    </>
  );
};

const NavLink = ({ to, children, className }) => {
  return (
    <Link
      to={to}
      className={`flex items-center px-3 py-2 rounded-lg transition-all duration-300 ${className}`}
    >
      {children}
    </Link>
  );
};

const MobileNavLink = ({ to, onClick, children, className }) => {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center py-2 px-4 rounded-lg transition-all duration-300 ${className}`}
    >
      {children}
    </Link>
  );
};

export default Header;