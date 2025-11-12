import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { auth, signInWithPopup, googleProvider } from "../../firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, sendEmailVerification } from "firebase/auth";
import { ref, get, set } from "firebase/database";
import { database } from "../../firebase";
import { sendWelcomeEmail, requestNotificationPermission } from "../../services/notificationService";
import { motion, AnimatePresence } from "framer-motion";
import { FaGoogle, FaPaw } from "react-icons/fa";
import { FiMail, FiLock, FiUser, FiArrowRight, FiCheck, FiMapPin, FiUsers, FiHeart, FiShield, FiZap, FiMap, FiCamera, FiActivity } from "react-icons/fi";

const Login = () => {
  const navigate = useNavigate();
  const [showContent, setShowContent] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [activeFeature, setActiveFeature] = useState(0);
  const [savedPassword, setSavedPassword] = useState(""); // Store password temporarily for resend
  const isShowingVerification = useRef(false); // Use ref for immediate updates

  const createUserProfile = async (user, displayName) => {
    const userRef = ref(database, `users/${user.uid}`);
    const snapshot = await get(userRef);
    
    if (!snapshot.exists()) {
      const userData = {
        uid: user.uid,
        displayName: displayName || user.displayName || user.email?.split('@')[0],
        email: user.email,
        photoURL: user.photoURL || null,
        createdAt: Date.now(),
        isNewUser: true, // Flag for showing tour
        hasCompletedTour: false,
        notificationPreferences: {
          email: {
            matingRequests: true,
            adoptionInquiries: true,
            messages: true,
            vaccinations: true,
            nearbyMates: true,
          },
          push: {
            matingRequests: true,
            adoptionInquiries: true,
            messages: true,
            vaccinations: true,
            nearbyMates: true,
          },
        },
      };
      
      await set(userRef, userData);
      
      // Request notification permission
      requestNotificationPermission(user.uid).catch(err =>
        console.log('Notification permission not granted:', err)
      );
      
      // Send welcome email
      sendWelcomeEmail({
        uid: user.uid,
        displayName: userData.displayName,
        email: user.email,
        photoURL: userData.photoURL,
      }).catch(err => console.error('Failed to send welcome email:', err));
      
      return true; // New user
    }
    return false; // Existing user
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const isNewUser = await createUserProfile(result.user);
      
      // Navigate with tour flag if new user
      if (isNewUser) {
        navigate("/dashboard?tour=true");
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Error during Google sign in:", error);
      setError(error.message || "Failed to sign in with Google");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      // Check if email is verified
      if (!result.user.emailVerified) {
        // Save credentials and show verification pending screen
        const userEmail = email;
        const userPassword = password;
        
        setVerificationEmail(userEmail);
        setSavedPassword(userPassword);
        setEmail("");
        setPassword("");
        
        // Sign out the user
        await auth.signOut();
        
        // Set ref and state to show verification message
        isShowingVerification.current = true;
        setShowVerificationMessage(true);
        setLoading(false);
        return;
      }
      
      // Check if user needs tour
      const userRef = ref(database, `users/${result.user.uid}`);
      const snapshot = await get(userRef);
      const userData = snapshot.val();
      
      if (userData && !userData.hasCompletedTour) {
        navigate("/dashboard?tour=true");
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Error during email sign in:", error);
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        setError("Invalid email or password");
      } else if (error.code === 'auth/invalid-email') {
        setError("Invalid email address");
      } else {
        setError(error.message || "Failed to sign in");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    if (!name.trim()) {
      setError("Please enter your name");
      setLoading(false);
      return;
    }
    
    // Set ref IMMEDIATELY to block auth state redirect
    isShowingVerification.current = true;
    
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Send email verification
      await sendEmailVerification(result.user);
      
      console.log("Verification email sent to:", email);
      
      // Save credentials before clearing
      const userEmail = email;
      const userPassword = password;
      
      // Create user profile (but they won't be able to access it until verified)
      await createUserProfile(result.user, name);
      
      // Sign out the user IMMEDIATELY
      await auth.signOut();
      
      // NOW set the UI states
      setVerificationEmail(userEmail);
      setSavedPassword(userPassword);
      setShowVerificationMessage(true);
      setEmail("");
      setPassword("");
      setName("");
      
    } catch (error) {
      // Reset ref on error
      isShowingVerification.current = false;
      
      console.error("Error during email sign up:", error);
      if (error.code === 'auth/email-already-in-use') {
        setError("Email already in use. Please login instead.");
      } else if (error.code === 'auth/weak-password') {
        setError("Password should be at least 6 characters");
      } else if (error.code === 'auth/invalid-email') {
        setError("Invalid email address");
      } else {
        setError(error.message || "Failed to create account");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setLoading(true);
    setError("");
    setSuccessMessage("");
    try {
      // Sign in temporarily to resend verification
      const result = await signInWithEmailAndPassword(auth, verificationEmail, savedPassword);
      if (!result.user.emailVerified) {
        await sendEmailVerification(result.user);
        setSuccessMessage("Verification email sent! Please check your inbox.");
        console.log("Resent verification email to:", verificationEmail);
      } else {
        setSuccessMessage("Email already verified! You can now sign in.");
        setTimeout(() => {
          isShowingVerification.current = false; // Reset ref
          setShowVerificationMessage(false);
          setIsLogin(true);
          setSavedPassword("");
        }, 2000);
      }
      await auth.signOut();
    } catch (error) {
      setError("Failed to resend verification email. Please try signing up again.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMessage("");
    
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMessage("Password reset email sent! Check your inbox.");
      setTimeout(() => {
        setShowForgotPassword(false);
        setSuccessMessage("");
      }, 3000);
    } catch (error) {
      console.error("Error sending reset email:", error);
      if (error.code === 'auth/user-not-found') {
        setError("No account found with this email");
      } else if (error.code === 'auth/invalid-email') {
        setError("Invalid email address");
      } else {
        setError(error.message || "Failed to send reset email");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      console.log("Auth state changed:", { 
        user: user?.email, 
        showingVerificationRef: isShowingVerification.current 
      });
      
      // Check ref instead of state to avoid race condition
      if (user && !isShowingVerification.current) {
        console.log("Redirecting to dashboard");
        navigate("/dashboard");
      }
    });

    const timer = setTimeout(() => {
      setShowContent(true);
    }, 100);

    // Auto-rotate features
    const featureInterval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 4);
    }, 4000);

    return () => {
      unsubscribe();
      clearTimeout(timer);
      clearInterval(featureInterval);
    };
  }, [navigate]);

  // Interactive features data
  const interactiveFeatures = [
    {
      icon: <FiMap className="text-4xl" />,
      title: "Find Nearby Mates",
      description: "Real-time geospatial matching with pets in your area",
      color: "from-violet-500 to-purple-600",
      stats: "10km radius",
    },
    {
      icon: <FiHeart className="text-4xl" />,
      title: "Smart Matching",
      description: "AI-powered breed compatibility and health verification",
      color: "from-pink-500 to-rose-600",
      stats: "98% success",
    },
    {
      icon: <FiShield className="text-4xl" />,
      title: "Health Tracking",
      description: "Complete vaccination and medical history management",
      color: "from-emerald-500 to-teal-600",
      stats: "All-in-one",
    },
    {
      icon: <FiCamera className="text-4xl" />,
      title: "Pet Profiles",
      description: "Instagram-style posts, stories, and event sharing",
      color: "from-orange-500 to-amber-600",
      stats: "Unlimited posts",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 flex flex-col lg:flex-row">
      {/* Mobile Header */}
      <div className="lg:hidden bg-gradient-to-r from-violet-600 to-purple-600 p-4 pb-8 relative">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="bg-white p-2 rounded-xl mr-3">
              <FaPaw className="text-violet-600 text-xl" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Pawppy</h1>
              <p className="text-white/80 text-xs">Pet Care Platform</p>
            </div>
          </div>
        </div>

        {/* Mobile Feature Cards Carousel */}
        <motion.div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeFeature}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20"
            >
              <div className={`inline-flex p-2 rounded-xl bg-gradient-to-r ${interactiveFeatures[activeFeature].color} mb-2`}>
                <div className="text-white text-2xl">{interactiveFeatures[activeFeature].icon}</div>
              </div>
              <h3 className="text-white font-bold text-lg mb-1">{interactiveFeatures[activeFeature].title}</h3>
              <p className="text-white/90 text-sm mb-2 line-clamp-2">{interactiveFeatures[activeFeature].description}</p>
              <div className="flex items-center text-white/80 text-xs">
                <FiZap className="mr-1" />
                <span>{interactiveFeatures[activeFeature].stats}</span>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Carousel Indicators */}
          <div className="flex justify-center space-x-2 mt-3">
            {interactiveFeatures.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveFeature(idx)}
                className={`h-1.5 rounded-full transition-all ${
                  idx === activeFeature ? 'w-8 bg-white' : 'w-1.5 bg-white/40'
                }`}
              />
            ))}
          </div>
        </motion.div>
      </div>

      {/* Desktop Left Side - Interactive Showcase */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-12 flex-col justify-between relative overflow-hidden shadow-2xl">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40"></div>
          
          {/* Floating Elements */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-32 h-32 bg-white/5 rounded-full blur-2xl"
              animate={{
                x: [0, Math.random() * 100 - 50, 0],
                y: [0, Math.random() * 100 - 50, 0],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 8 + i * 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
            />
          ))}
        </div>

        {/* Content */}
        <div className="relative z-10">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-12"
          >
            <div className="flex items-center mb-6">
              <div className="bg-white p-3 rounded-2xl mr-4 shadow-xl">
                <FaPaw className="text-violet-600 text-4xl" />
              </div>
              <div>
                <h1 className="text-5xl font-bold text-white">Pawppy</h1>
                <p className="text-white/80 text-lg">Where Pet Care Meets Technology</p>
              </div>
            </div>
          </motion.div>

          {/* Interactive Features Grid */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            {interactiveFeatures.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ 
                  opacity: 1, 
                  y: 0,
                  scale: activeFeature === idx ? 1.05 : 1,
                  zIndex: activeFeature === idx ? 10 : 1,
                }}
                transition={{ 
                  delay: 0.3 + idx * 0.1,
                  scale: { duration: 0.3 },
                }}
                onHoverStart={() => setActiveFeature(idx)}
                className="relative group cursor-pointer"
              >
                <motion.div 
                  className="bg-white/10 backdrop-blur-md rounded-2xl p-6 h-full border border-white/20 transition-all duration-300 overflow-hidden"
                  animate={{
                    backgroundColor: activeFeature === idx ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                    boxShadow: activeFeature === idx 
                      ? '0 20px 50px rgba(0, 0, 0, 0.3), 0 0 0 2px rgba(255, 255, 255, 0.3)' 
                      : '0 0 0 0 rgba(0, 0, 0, 0)',
                  }}
                  whileHover={{
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  }}
                >
                  <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${feature.color} mb-3 group-hover:scale-110 transition-transform`}>
                    <div className="text-white">{feature.icon}</div>
                  </div>
                  <h3 className="text-white font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-white/80 text-sm mb-2 line-clamp-2">{feature.description}</p>
                  <div className="flex items-center text-white/70 text-xs">
                    <FiZap className="mr-1" />
                    <span>{feature.stats}</span>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Interactive Map Preview */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
          className="relative z-10"
        >
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-white font-semibold text-lg">Live Near You</h3>
                <p className="text-white/70 text-sm">Real-time pet locations</p>
              </div>
              <div className="bg-white/20 rounded-full p-2">
                <FiMapPin className="text-white text-xl" />
              </div>
            </div>
            
            {/* Mock Map Interface */}
            <div className="bg-gradient-to-br from-blue-400 to-cyan-500 rounded-xl h-48 relative overflow-hidden">
              {/* Animated Pins */}
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute"
                  style={{
                    left: `${20 + i * 15}%`,
                    top: `${30 + (i % 2) * 20}%`,
                  }}
                  animate={{
                    y: [0, -10, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                >
                  <div className="relative">
                    <FiMapPin className="text-white text-3xl drop-shadow-lg" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse" />
                  </div>
                </motion.div>
              ))}
              
              {/* Center Point */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <motion.div
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 0, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                  }}
                  className="w-16 h-16 bg-white/30 rounded-full"
                />
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full border-2 border-violet-600" />
              </div>
            </div>
            
            <div className="mt-4 flex items-center justify-between text-white/80 text-sm">
              <span className="flex items-center">
                <FiActivity className="mr-2" />
                128 pets nearby
              </span>
              <span className="flex items-center">
                <FiUsers className="mr-2" />
                45 active now
              </span>
            </div>
          </div>
        </motion.div>

        {/* Stats Bar */}
        <div className="relative z-10 grid grid-cols-3 gap-4 mt-8">
          {[
            { label: "Pet Parents", value: "10K+", icon: <FiUsers /> },
            { label: "Successful Matches", value: "5K+", icon: <FiHeart /> },
            { label: "Cities", value: "50+", icon: <FiMapPin /> },
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + idx * 0.1 }}
              className="bg-white/10 backdrop-blur-md rounded-xl p-4 text-center border border-white/20"
            >
              <div className="text-white/70 text-2xl mb-2 flex justify-center">{stat.icon}</div>
              <div className="text-white text-2xl font-bold">{stat.value}</div>
              <div className="text-white/70 text-xs">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Right Side - Auth Forms */}
      <div className="flex-1 flex items-center justify-center p-4 lg:p-12 bg-gradient-to-br from-white via-violet-50/30 to-purple-50/50 relative -mt-6 lg:mt-0 overflow-hidden">
        {/* Animated Paw Prints - Desktop Only */}
        <div className="hidden lg:block absolute inset-0 pointer-events-none">
          {/* Left Side Paws */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={`left-${i}`}
              className="absolute text-violet-400"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ 
                opacity: [0, 0.5, 0.7, 0.5],
                scale: [0, 1, 1, 0],
                rotate: [0, 10, -10, 0]
              }}
              transition={{
                duration: 3,
                delay: i * 0.4,
                repeat: Infinity,
                repeatDelay: 5
              }}
              style={{
                left: `${10 + (i % 2) * 8}%`,
                top: `${15 + i * 10}%`,
                fontSize: `${20 + Math.random() * 15}px`
              }}
            >
              <FaPaw />
            </motion.div>
          ))}
          
          {/* Right Side Paws */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={`right-${i}`}
              className="absolute text-purple-400"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ 
                opacity: [0, 0.5, 0.7, 0.5],
                scale: [0, 1, 1, 0],
                rotate: [0, -10, 10, 0]
              }}
              transition={{
                duration: 3,
                delay: i * 0.4 + 0.2,
                repeat: Infinity,
                repeatDelay: 5
              }}
              style={{
                right: `${10 + (i % 2) * 8}%`,
                top: `${15 + i * 10}%`,
                fontSize: `${20 + Math.random() * 15}px`
              }}
            >
              <FaPaw />
            </motion.div>
          ))}
          
          {/* Top Crawling Paws */}
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={`top-${i}`}
              className="absolute text-indigo-400"
              initial={{ x: '-100%', opacity: 0 }}
              animate={{ 
                x: ['0%', '100%', '100%'],
                opacity: [0, 0.6, 0],
                y: [0, -5, 0, 5, 0]
              }}
              transition={{
                duration: 8,
                delay: i * 2,
                repeat: Infinity,
                repeatDelay: 2,
                ease: "linear"
              }}
              style={{
                top: `${10 + i * 5}%`,
                left: 0,
                fontSize: '24px'
              }}
            >
              <FaPaw />
            </motion.div>
          ))}
          
          {/* Bottom Crawling Paws */}
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={`bottom-${i}`}
              className="absolute text-violet-500"
              initial={{ x: '100%', opacity: 0 }}
              animate={{ 
                x: ['0%', '-100%', '-100%'],
                opacity: [0, 0.6, 0],
                y: [0, 5, 0, -5, 0]
              }}
              transition={{
                duration: 8,
                delay: i * 2 + 1,
                repeat: Infinity,
                repeatDelay: 2,
                ease: "linear"
              }}
              style={{
                bottom: `${10 + i * 5}%`,
                right: 0,
                fontSize: '24px'
              }}
            >
              <FaPaw />
            </motion.div>
          ))}
        </div>

        <motion.div
          className="w-full max-w-md relative z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: showContent ? 1 : 0, y: showContent ? 0 : 20 }}
          transition={{ duration: 0.5 }}
        >
          <AnimatePresence mode="wait">
            {showVerificationMessage ? (
              <motion.div
                key="verification-message"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-6 lg:p-8 border border-violet-100"
              >
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full mb-6 shadow-lg"
                  >
                    <FiMail className="text-white text-4xl" />
                  </motion.div>
                  
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Verify Your Email</h2>
                  <p className="text-gray-600 mb-6">
                    We've sent a verification link to<br />
                    <span className="font-semibold text-violet-600">{verificationEmail}</span>
                  </p>

                  <div className="bg-violet-50 border border-violet-200 rounded-2xl p-4 mb-6 text-left">
                    <p className="text-sm text-gray-700 mb-2 font-semibold">
                      Next steps:
                    </p>
                    <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
                      <li>Check your email inbox (and spam folder)</li>
                      <li>Click the verification link in the email</li>
                      <li>Return here and sign in to your account</li>
                    </ol>
                  </div>

                  {successMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-4 flex items-center justify-center"
                    >
                      <FiCheck className="mr-2" />
                      {successMessage}
                    </motion.div>
                  )}

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4"
                    >
                      {error}
                    </motion.div>
                  )}

                  <div className="space-y-3">
                    <button
                      onClick={() => {
                        isShowingVerification.current = false; // Reset ref
                        setShowVerificationMessage(false);
                        setSavedPassword(""); // Clear saved password
                        setVerificationEmail("");
                        setIsLogin(true);
                        setError("");
                        setSuccessMessage("");
                      }}
                      className="w-full bg-gradient-to-r from-violet-600 to-purple-600 text-white py-4 rounded-xl font-semibold hover:from-violet-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      Back to Login
                    </button>
                    
                    <button
                      onClick={handleResendVerification}
                      disabled={loading}
                      className="w-full border-2 border-violet-600 text-violet-600 py-4 rounded-xl font-semibold hover:bg-violet-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? "Sending..." : "Resend Verification Email"}
                    </button>
                  </div>

                  <p className="text-xs text-gray-500 mt-6">
                    Didn't receive the email? Check your spam folder or click resend.
                  </p>
                </div>
              </motion.div>
            ) : showForgotPassword ? (
              <motion.div
                key="forgot-password"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-6 lg:p-8 border border-violet-100"
              >
                <button
                  onClick={() => setShowForgotPassword(false)}
                  className="text-violet-600 hover:text-violet-700 mb-6 flex items-center font-medium"
                >
                  <FiArrowRight className="mr-2 rotate-180" />
                  Back to login
                </button>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Reset Password</h2>
                <p className="text-gray-600 mb-6">Enter your email to receive a reset link</p>

                {successMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-4 flex items-center"
                  >
                    <FiCheck className="mr-2" />
                    {successMessage}
                  </motion.div>
                )}

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4"
                  >
                    {error}
                  </motion.div>
                )}

                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                        <FiMail />
                      </div>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all"
                        placeholder="you@example.com"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-violet-600 to-purple-600 text-white py-4 rounded-xl font-semibold hover:from-violet-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {loading ? "Sending..." : "Send Reset Link"}
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="auth-form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-6 lg:p-8 border border-violet-100"
              >
                {/* Mobile Logo Already shown in header */}
                <div className="lg:flex hidden justify-center mb-6">
                  <div className="bg-gradient-to-br from-violet-500 to-purple-600 p-4 rounded-2xl shadow-lg">
                    <FaPaw className="text-white text-3xl" />
                  </div>
                </div>

                <div className="mb-4 lg:mb-6 text-center lg:text-left">
                  <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-1 lg:mb-2">
                    {isLogin ? "Welcome Back!" : "Get Started"}
                  </h2>
                  <p className="text-sm lg:text-base text-gray-600">
                    {isLogin ? "Sign in to manage your pets" : "Create your free account"}
                  </p>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 lg:py-3 rounded-xl mb-4 text-sm"
                  >
                    {error}
                  </motion.div>
                )}

                <form onSubmit={isLogin ? handleEmailLogin : handleEmailSignup} className="space-y-3 lg:space-y-4">
                  {!isLogin && (
                    <div>
                      <label className="block text-xs lg:text-sm font-semibold text-gray-700 mb-1 lg:mb-2">
                        Full Name
                      </label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                          <FiUser />
                        </div>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full pl-12 pr-4 py-3 lg:py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all"
                          placeholder="John Doe"
                          required={!isLogin}
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs lg:text-sm font-semibold text-gray-700 mb-1 lg:mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                        <FiMail />
                      </div>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 lg:py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all"
                        placeholder="you@example.com"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs lg:text-sm font-semibold text-gray-700 mb-1 lg:mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                        <FiLock />
                      </div>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 lg:py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all"
                        placeholder="••••••••"
                        required
                        minLength={6}
                      />
                    </div>
                  </div>

                  {isLogin && (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        className="text-xs lg:text-sm text-violet-600 hover:text-violet-700 font-medium"
                      >
                        Forgot password?
                      </button>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-violet-600 to-purple-600 text-white py-3 lg:py-4 rounded-xl font-semibold hover:from-violet-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center group"
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Processing...
                      </div>
                    ) : (
                      <>
                        {isLogin ? "Sign In" : "Create Account"}
                        <FiArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </form>

                <div className="relative my-4 lg:my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-xs lg:text-sm">
                    <span className="px-4 bg-white text-gray-500 font-medium">Or continue with</span>
                  </div>
                </div>

                <button
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full bg-white border-2 border-gray-200 text-gray-700 py-3 lg:py-4 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center group shadow-sm hover:shadow"
                >
                  <FaGoogle className="mr-2 text-red-500 group-hover:scale-110 transition-transform" />
                  Continue with Google
                </button>

                <div className="mt-4 lg:mt-6 text-center">
                  <button
                    onClick={() => {
                      setIsLogin(!isLogin);
                      setError("");
                    }}
                    className="text-sm lg:text-base text-gray-600 hover:text-violet-600 font-medium transition-colors"
                  >
                    {isLogin ? (
                      <>
                        Don't have an account? <span className="text-violet-600">Sign up</span>
                      </>
                    ) : (
                      <>
                        Already have an account? <span className="text-violet-600">Sign in</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;

