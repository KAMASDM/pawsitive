import React, { useState, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { auth, database } from "../../firebase";
import logo from "../../images/logo.png";
import BottomNavigation from "./BottomNavigation";
import { get, ref } from "firebase/database";
import { FiHome, FiUser, FiLogOut, FiMenu, FiX, FiBell } from "react-icons/fi";
import { FaDog, FaCat } from "react-icons/fa";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [matingRequests, setMatingRequests] = useState([]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user ? user : null);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    auth.signOut();
    navigate("/login");
    setIsMenuOpen(false);
  };

  const fetchMatingRequests = useCallback(async () => {
    if (!user) return;
    try {
      const incomingRequestsRef = ref(
        database,
        `matingRequests/received/${user.uid}`
      );
      const sentRequestsRef = ref(database, `matingRequests/sent/${user.uid}`);
      const incomingSnapshot = await get(incomingRequestsRef);
      const sentSnapshot = await get(sentRequestsRef);
      const requests = [];

      if (incomingSnapshot.exists()) {
        const incomingData = incomingSnapshot.val();
        for (const requestId in incomingData) {
          const request = incomingData[requestId];
          const senderUserRef = ref(database, `users/${request.senderId}`);
          const senderSnapshot = await get(senderUserRef);
          const senderData = senderSnapshot.exists()
            ? senderSnapshot.val()
            : { displayName: "Unknown User" };

          const senderPetRef = ref(
            database,
            `userPets/${request.senderId}/${request.senderPetId}`
          );
          const senderPetSnapshot = await get(senderPetRef);
          const senderPetData = senderPetSnapshot.exists()
            ? senderPetSnapshot.val()
            : { name: "Unknown Pet" };

          const receiverPetRef = ref(
            database,
            `userPets/${user.uid}/${request.receiverPetId}`
          );
          const receiverPetSnapshot = await get(receiverPetRef);
          const receiverPetData = receiverPetSnapshot.exists()
            ? receiverPetSnapshot.val()
            : { name: "Unknown Pet" };

          requests.push({
            id: requestId,
            ...request,
            direction: "incoming",
            senderName: senderData.displayName,
            senderPetName: senderPetData.name,
            senderPetImage: senderPetData.image,
            senderPetBreed: senderPetData.breed,
            receiverPetName: receiverPetData.name,
            receiverPetImage: receiverPetData.image,
          });
        }
      }

      if (sentSnapshot.exists()) {
        const sentData = sentSnapshot.val();
        for (const requestId in sentData) {
          const request = sentData[requestId];
          const receiverUserRef = ref(database, `users/${request.receiverId}`);
          const receiverSnapshot = await get(receiverUserRef);
          const receiverData = receiverSnapshot.exists()
            ? receiverSnapshot.val()
            : { displayName: "Unknown User" };

          const senderPetRef = ref(
            database,
            `userPets/${user.uid}/${request.senderPetId}`
          );
          const senderPetSnapshot = await get(senderPetRef);
          const senderPetData = senderPetSnapshot.exists()
            ? senderPetSnapshot.val()
            : { name: "Unknown Pet" };

          const receiverPetRef = ref(
            database,
            `userPets/${request.receiverId}/${request.receiverPetId}`
          );
          const receiverPetSnapshot = await get(receiverPetRef);
          const receiverPetData = receiverPetSnapshot.exists()
            ? receiverPetSnapshot.val()
            : { name: "Unknown Pet" };

          requests.push({
            id: requestId,
            ...request,
            direction: "outgoing",
            receiverName: receiverData.displayName,
            senderPetName: senderPetData.name,
            senderPetImage: senderPetData.image,
            receiverPetName: receiverPetData.name,
            receiverPetImage: receiverPetData.image,
            receiverPetBreed: receiverPetData.breed,
          });
        }
      }

      requests.sort((a, b) => b.createdAt - a.createdAt);
      setMatingRequests(requests);
    } catch (error) {
      console.error("Error fetching mating requests:", error);
    }
  }, [user]);

  useEffect(() => {
    if (user && location.pathname === "/profile") {
      fetchMatingRequests();
    }
  }, [user, location.pathname, fetchMatingRequests]);

  const pendingRequestsCount = matingRequests.filter(
    (req) => req.direction === "incoming" && req.status === "pending"
  ).length;

  return (
    <>
      <header className="bg-lavender-900 text-lavender-100 shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <Link
              to="/"
              className="flex items-center hover:opacity-90 transition-opacity"
            >
              <img src={logo} alt="Pawsitive Logo" className="h-10 mr-3" />
              <span className="text-2xl font-bold text-white hidden sm:inline">
                Pawsitive
              </span>
            </Link>
            <nav className="hidden md:flex items-center space-x-2">
              {user && (
                <>
                  <NavLink to="/">
                    <FiHome className="mr-1" /> Home
                  </NavLink>
                  <NavLink to="/dog-resources">
                    <FaDog className="mr-1" /> Dogs
                  </NavLink>
                  <NavLink to="/cat-resources">
                    <FaCat className="mr-1" /> Cats
                  </NavLink>
                  <NavLink to="/profile">
                    <FiUser className="mr-1" /> Profile
                  </NavLink>
                  <NavLink>
                    <div className="flex items-center relative">
                      <FiBell className="mr-1" />
                      {pendingRequestsCount > 0 && (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                          {pendingRequestsCount}
                        </span>
                      )}
                      Notifications
                    </div>
                  </NavLink>
                  <button
                    onClick={handleLogout}
                    className="flex items-center text-lavender-200 hover:text-white hover:bg-lavender-700 px-3 py-2 rounded-lg transition-colors"
                  >
                    <FiLogOut className="mr-1" /> Logout
                  </button>
                </>
              )}
            </nav>
            <div className="md:hidden flex items-center">
              {user && pendingRequestsCount > 0 && (
                <div className="relative mr-4">
                  <Link to="/profile" className="text-white">
                    <FiBell size={20} />
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {pendingRequestsCount}
                    </span>
                  </Link>
                </div>
              )}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-lavender-200 hover:text-white focus:outline-none"
                aria-label="Toggle menu"
              >
                {isMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
              </button>
            </div>
          </div>
        </div>
        {isMenuOpen && user && (
          <div className="md:hidden bg-lavender-800 animate-fadeIn">
            <div className="container mx-auto px-4 py-2 space-y-1">
              <MobileNavLink to="/" onClick={() => setIsMenuOpen(false)}>
                <FiHome className="mr-2" /> Home
              </MobileNavLink>
              <MobileNavLink
                to="/dog-resources"
                onClick={() => setIsMenuOpen(false)}
              >
                <FaDog className="mr-2" /> Dog Resources
              </MobileNavLink>
              <MobileNavLink
                to="/cat-resources"
                onClick={() => setIsMenuOpen(false)}
              >
                <FaCat className="mr-2" /> Cat Resources
              </MobileNavLink>
              <MobileNavLink to="/profile" onClick={() => setIsMenuOpen(false)}>
                <FiUser className="mr-2" /> Profile
              </MobileNavLink>
              <button
                onClick={handleLogout}
                className="flex items-center w-full text-left py-2 px-4 text-lavender-200 hover:text-white hover:bg-lavender-700 rounded-lg transition-colors"
              >
                <FiLogOut className="mr-2" /> Logout
              </button>
            </div>
          </div>
        )}
      </header>
      {user && <BottomNavigation />}
    </>
  );
};

const NavLink = ({ to, children }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link
      to={to}
      className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
        isActive
          ? "text-white bg-lavender-700"
          : "text-lavender-200 hover:text-white hover:bg-lavender-700"
      }`}
    >
      {children}
    </Link>
  );
};

const MobileNavLink = ({ to, onClick, children }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center py-2 px-4 rounded-lg transition-colors ${
        isActive
          ? "text-white bg-lavender-700"
          : "text-lavender-200 hover:text-white hover:bg-lavender-700"
      }`}
    >
      {children}
    </Link>
  );
};

export default Header;
