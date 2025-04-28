import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, signInWithPopup, googleProvider } from "../../firebase";
import logo from "../../images/logo.png";

const Login = () => {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [showContent, setShowContent] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      console.log("User Info:", result.user);
      navigate("/");
    } catch (error) {
      console.error("Error during sign in:", error);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowContent(true);
    }, 300);

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
      setShowInstallButton(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      clearTimeout(timer);
    };
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === "accepted") {
          console.log("User accepted the install prompt");
        } else {
          console.log("User dismissed the install prompt");
        }
        setDeferredPrompt(null);
        setShowInstallButton(false);
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-lavender-100 to-lavender-300 flex items-center justify-center p-4 md:p-12 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="paw-pattern"></div>
      </div>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, index) => (
          <div
            key={index}
            className="absolute rounded-full animate-pulse-slow opacity-30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 100 + 50}px`,
              height: `${Math.random() * 100 + 50}px`,
              backgroundColor: "#8b79c3",
              animationDelay: `${index * 0.5}s`,
              animationDuration: `${Math.random() * 4 + 3}s`,
            }}
          />
        ))}
      </div>

      <div
        className={`max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden transform transition-all duration-500 ${
          showContent ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
        } relative z-10`}
      >
        <div className="p-8">
          <div className="flex justify-center mb-6 relative">
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-lavender-100 rounded-full animate-pulse"></div>
            <img
              src={logo}
              alt="Pawsitive Logo"
              className="w-32 h-32 rounded-full border-4 border-lavender-300 shadow-lg relative z-10 animate-bounce-slow"
            />
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 text-2xl filter drop-shadow-md">
              🐾
            </div>
          </div>

          <h2 className="text-3xl font-bold text-center text-lavender-900 mb-2">
            Welcome to Pawsitive
          </h2>
          <p className="text-center text-lavender-600 mb-6">
            Your ultimate pet resource finder
          </p>

          <div className="bg-lavender-50 rounded-lg p-4 mb-6 border-l-4 border-lavender-500 relative overflow-hidden">
            <div className="absolute -right-4 top-1/2 transform -translate-y-1/2 opacity-10 text-4xl animate-move-horizontal">
              🐾
            </div>

            <h3 className="font-semibold text-lavender-800 mb-2">
              Find everything your pet needs:
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center transform transition-transform duration-300 hover:scale-105">
                <span className="mr-2 animate-pulse">🏥</span>
                <span className="text-sm">Healthcare</span>
              </div>
              <div className="flex items-center transform transition-transform duration-300 hover:scale-105">
                <span
                  className="mr-2 animate-pulse"
                  style={{ animationDelay: "0.5s" }}
                >
                  🍖
                </span>
                <span className="text-sm">Nutrition</span>
              </div>
              <div className="flex items-center transform transition-transform duration-300 hover:scale-105">
                <span
                  className="mr-2 animate-pulse"
                  style={{ animationDelay: "1s" }}
                >
                  🧶
                </span>
                <span className="text-sm">Supplies</span>
              </div>
              <div className="flex items-center transform transition-transform duration-300 hover:scale-105">
                <span
                  className="mr-2 animate-pulse"
                  style={{ animationDelay: "1.5s" }}
                >
                  🦮
                </span>
                <span className="text-sm">Services</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            className="w-full bg-lavender-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-lavender-700 transition duration-300 ease-in-out flex items-center justify-center transform hover:scale-105 relative overflow-hidden group"
          >
            <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-20 transition-opacity">
              <span className="text-3xl filter blur-sm animate-spin-slow">
                🐾
              </span>
            </span>

            <svg
              className="w-6 h-6 mr-2 relative z-10"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z"
                fill="currentColor"
              />
            </svg>
            <span className="relative z-10">Sign in with Google</span>
          </button>

          {showInstallButton && (
            <div className="mt-4">
              <button
                onClick={handleInstallClick}
                className="w-full bg-green-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-600 transition duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center relative overflow-hidden group"
              >
                <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-20 transition-opacity">
                  <span className="text-lg animate-bounce">⬇️</span>
                </span>

                <svg
                  className="w-5 h-5 mr-2 relative z-10"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  ></path>
                </svg>
                <span className="relative z-10">Install App</span>
              </button>
            </div>
          )}
        </div>

        <div className="bg-lavender-50 p-6 border-t border-lavender-200 relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 text-8xl opacity-5 animate-pulse-slow">
            🐕
          </div>
          <div
            className="absolute -left-10 -bottom-5 text-6xl opacity-5 animate-pulse-slow"
            style={{ animationDelay: "1.5s" }}
          >
            🐈
          </div>

          <div className="flex items-start space-x-4 relative z-10">
            <div className="flex-shrink-0 bg-lavender-200 rounded-full p-2 shadow-md transform transition-transform hover:rotate-12">
              <span className="text-2xl">🐶</span>
            </div>
            <div>
              <p className="text-sm text-lavender-800 italic">
                "Find veterinarians, pet stores, groomers, and more with just a
                few taps. The perfect app for pet parents!"
              </p>
              <div className="mt-2 flex">
                <div className="flex animate-shimmer">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className="w-4 h-4 text-yellow-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 left-6 text-6xl text-white opacity-20 transform rotate-45 animate-pulse-slow">
        🐕
      </div>
      <div
        className="absolute top-10 right-10 text-6xl text-white opacity-20 transform -rotate-12 animate-pulse-slow"
        style={{ animationDelay: "1s" }}
      >
        🐈
      </div>
    </div>
  );
};

export default Login;
