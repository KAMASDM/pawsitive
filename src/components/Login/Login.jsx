import { trackProductEvent } from "../../services/productAnalytics";
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { auth, signInWithPopup, googleProvider } from "../../firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, sendEmailVerification } from "firebase/auth";
import { ref, get, set } from "firebase/database";
import { database } from "../../firebase";
import { sendWelcomeEmail } from "../../services/notificationService";
import { motion, AnimatePresence } from "framer-motion";
import { FaGoogle, FaPaw } from "react-icons/fa";
import { FiMail, FiLock, FiUser, FiArrowRight, FiCheck } from "react-icons/fi";

const Login = () => {
  const navigate = useNavigate();
  const next = new URLSearchParams(window.location.search).get("next");
  let destination = '/today';
  if (next?.startsWith('/')) {
    try {
      const url = new URL(next, window.location.origin);
      if (url.origin === window.location.origin && !['/', '/login'].includes(url.pathname)) destination = url.pathname + url.search + url.hash;
    } catch { /* Invalid return links fall back to Today. */ }
  }
  const [isLogin, setIsLogin] = useState(new URLSearchParams(window.location.search).get('signup') !== '1');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
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
        phoneNumber: '',
        city: '',
        country: '',
        dateOfBirth: '',
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

      await set(userRef, { ...userData, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata' });
      sessionStorage.setItem('pawppy_signup_pending', user.uid);
      trackProductEvent('signup_completed', 'login').then((recorded) => { if (recorded) sessionStorage.removeItem('pawppy_signup_pending'); });


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
      await createUserProfile(result.user);


      // Navigate to pet-first landing after login
      navigate(destination);
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


      navigate(destination);
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

      // Check ref instead of state to avoid race condition
      if (user && !isShowingVerification.current && (user.emailVerified || !user.providerData.some(provider => provider.providerId === 'password'))) {
        navigate(destination);
      }
    });

    return unsubscribe;
  }, [navigate, destination]);

  return <div className="login-page min-h-screen px-4 py-8 flex flex-col items-center">
    <a href="/" className="font-bold text-2xl text-violet-800 flex items-center gap-2 mb-8"><FaPaw /> pawppy</a>
    <div className="w-full max-w-md"><AnimatePresence mode="wait">
            {showVerificationMessage ? (
              <motion.div
                key="verification-message"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="app-panel login-panel"
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
                className="app-panel login-panel"
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
                        type="email" aria-label="Email Address" autoComplete="email"
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
                className="app-panel login-panel"
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
                          type="text" aria-label="Full Name" autoComplete="name"
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
                        type="email" aria-label="Email Address" autoComplete="email"
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
                        type="password" aria-label="Password" autoComplete={isLogin ? "current-password" : "new-password"}
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
                    className="app-button w-full"
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

                <button
                  type="button"
                  onClick={() => navigate("/vendor/register")}
                  className="mt-3 w-full bg-violet-50 border-2 border-violet-100 text-violet-700 py-3 lg:py-4 rounded-xl font-semibold hover:bg-violet-100 transition-all flex items-center justify-center group"
                >
                  Register as a Vendor
                  <FiArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
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
          </AnimatePresence><p className="text-xs text-slate-500 text-center mt-6">By creating an account, you agree to our <a className="underline" href="/terms-and-conditions">terms</a>. Read our <a className="underline" href="/privacy-policy">privacy policy</a>, including optional product measurement.</p></div>
  </div>;
};
export default Login;
