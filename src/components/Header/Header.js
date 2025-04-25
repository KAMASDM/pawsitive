/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { auth, database } from "../../firebase";
import logo from "../../images/logo.png";
import BottomNavigation from "./BottomNavigation";
import { get, ref } from "firebase/database";

const Header = () => {
  const [user, setUser] = useState(null);
  const [matingRequests, setMatingRequests] = useState([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const location = useLocation();

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

  useEffect(() => {
    if (user && location.pathname === "/profile") {
      fetchMatingRequests();
    }
  }, [user, location.pathname]);

  const fetchMatingRequests = async () => {
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
  };

  const pendingRequestsCount = matingRequests.filter(
    (req) => req.direction === "incoming" && req.status === "pending"
  ).length;

  return (
    <>
      <header className="bg-lavender-900 text-lavender-100 shadow-lg">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <Link
              to="/"
              className="flex items-center hover:opacity-90 transition-opacity"
            >
              <img src={logo} alt="Pawsitive Logo" className="h-10 mr-5" />
              <span className="text-2xl font-bold text-white">Pawsitive</span>
            </Link>
            <nav className="hidden md:flex space-x-6">
              {user && (
                <>
                  <NavLink to="/">Home</NavLink>
                  <NavLink to="/dog-resources">Dog Resources</NavLink>
                  <NavLink to="/cat-resources">Cat Resources</NavLink>
                  <NavLink to="/profile">Profile</NavLink>
                  <NavLink to="/profile">
                    <div className="flex items-center relative">
                      <svg
                        className="h-5 w-5 mr-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                        />
                      </svg>
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
                    className="text-lavender-200 hover:text-white hover:bg-lavender-700 px-3 py-1 rounded transition-colors"
                  >
                    Logout
                  </button>
                </>
              )}
            </nav>
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-lavender-200 hover:text-white focus:outline-none focus:text-white"
                aria-label="Toggle menu"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={
                      isMenuOpen
                        ? "M6 18L18 6M6 6l12 12"
                        : "M4 6h16M4 12h16M4 18h16"
                    }
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
        {isMenuOpen && user && (
          <div className="md:hidden bg-lavender-800">
            <div className="container mx-auto px-4 py-2">
              <MobileNavLink to="/" onClick={() => setIsMenuOpen(false)}>
                Home
              </MobileNavLink>
              <MobileNavLink
                to="/dog-resources"
                onClick={() => setIsMenuOpen(false)}
              >
                Dog Resources
              </MobileNavLink>
              <MobileNavLink
                to="/cat-resources"
                onClick={() => setIsMenuOpen(false)}
              >
                Cat Resources
              </MobileNavLink>
              <MobileNavLink to="/profile" onClick={() => setIsMenuOpen(false)}>
                Profile
              </MobileNavLink>
              <MobileNavLink to="/profile" onClick={() => setIsMenuOpen(false)}>
                <div className="flex items-center relative">
                  <svg
                    className="h-5 w-5 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                  Notifications
                  {pendingRequestsCount > 0 && (
                    <span className="ml-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {pendingRequestsCount}
                    </span>
                  )}
                </div>
              </MobileNavLink>
              <button
                onClick={handleLogout}
                className="block w-full text-left py-2 px-4 text-lavender-200 hover:text-white hover:bg-lavender-700 rounded transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </header>

      {user && <BottomNavigation />}

      {user && <div className="md:hidden pb-16"></div>}
    </>
  );
};

const NavLink = ({ to, children }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link
      to={to}
      className={`${
        isActive
          ? "text-white bg-lavender-700"
          : "text-lavender-200 hover:text-white hover:bg-lavender-700"
      } px-3 py-1 rounded transition-colors`}
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
      className={`block py-2 px-4 ${
        isActive
          ? "text-white bg-lavender-700"
          : "text-lavender-200 hover:text-white hover:bg-lavender-700"
      } rounded transition-colors`}
    >
      {children}
    </Link>
  );
};

export default Header;
