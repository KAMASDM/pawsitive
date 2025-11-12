import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiArrowRight, FiArrowLeft, FiCheck } from 'react-icons/fi';
import { FaPaw, FaHeart, FaMapMarkerAlt, FaCalendarAlt, FaUsers, FaImage } from 'react-icons/fa';
import { ref, update } from 'firebase/database';
import { database, auth } from '../../firebase';

const SiteTour = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const tourSteps = [
    {
      title: "Welcome to Pawppy! 🐾",
      description: "Let's take a quick tour to help you get started with managing your pet's life all in one place.",
      icon: <FaPaw className="text-5xl text-violet-600" />,
      position: "center",
    },
    {
      title: "Create Pet Profiles",
      description: "Add your pets and create beautiful Instagram-style profiles with photos, posts, and events.",
      icon: <FaImage className="text-5xl text-blue-600" />,
      position: "center",
      highlight: "#profile-section",
    },
    {
      title: "Track Health Records",
      description: "Keep track of vaccinations, medications, vet appointments, and medical history for each pet.",
      icon: <FaHeart className="text-5xl text-red-600" />,
      position: "center",
    },
    {
      title: "Find Nearby Mates",
      description: "Use our geospatial matching to find compatible mates for your pets in your area with verified health records.",
      icon: <FaMapMarkerAlt className="text-5xl text-green-600" />,
      position: "center",
    },
    {
      title: "Schedule & Events",
      description: "Never miss important dates! Add events, vet appointments, and get reminders for vaccinations.",
      icon: <FaCalendarAlt className="text-5xl text-orange-600" />,
      position: "center",
    },
    {
      title: "Connect with Community",
      description: "Chat with other pet parents, share experiences, and get advice from the Pawppy community.",
      icon: <FaUsers className="text-5xl text-purple-600" />,
      position: "center",
    },
    {
      title: "You're All Set! 🎉",
      description: "Start by adding your first pet profile and exploring all the features. We're here to help!",
      icon: <FiCheck className="text-5xl text-green-600" />,
      position: "center",
    },
  ];

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = async () => {
    setIsVisible(false);
    
    // Mark tour as completed in database
    const user = auth.currentUser;
    if (user) {
      const userRef = ref(database, `users/${user.uid}`);
      await update(userRef, {
        hasCompletedTour: true,
        isNewUser: false,
      });
    }
    
    setTimeout(() => {
      if (onComplete) onComplete();
    }, 300);
  };

  if (!isVisible) return null;

  const currentStepData = tourSteps[currentStep];
  const progress = ((currentStep + 1) / tourSteps.length) * 100;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden"
        >
          {/* Progress Bar */}
          <div className="h-2 bg-gray-200">
            <motion.div
              className="h-full bg-gradient-to-r from-violet-600 to-purple-600"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Close Button */}
            <button
              onClick={handleSkip}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <FiX className="text-2xl" />
            </button>

            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="flex justify-center mb-6"
            >
              {currentStepData.icon}
            </motion.div>

            {/* Title */}
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl font-bold text-gray-900 text-center mb-4"
            >
              {currentStepData.title}
            </motion.h2>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-gray-600 text-center text-lg leading-relaxed mb-8"
            >
              {currentStepData.description}
            </motion.p>

            {/* Step Indicators */}
            <div className="flex justify-center space-x-2 mb-8">
              {tourSteps.map((_, index) => (
                <motion.div
                  key={index}
                  className={`h-2 rounded-full transition-all ${
                    index === currentStep
                      ? 'w-8 bg-violet-600'
                      : index < currentStep
                      ? 'w-2 bg-violet-400'
                      : 'w-2 bg-gray-300'
                  }`}
                  animate={{
                    scale: index === currentStep ? 1.2 : 1,
                  }}
                />
              ))}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between space-x-4">
              {currentStep > 0 ? (
                <button
                  onClick={handlePrevious}
                  className="flex items-center text-gray-600 hover:text-gray-900 font-medium transition-colors"
                >
                  <FiArrowLeft className="mr-2" />
                  Previous
                </button>
              ) : (
                <button
                  onClick={handleSkip}
                  className="text-gray-500 hover:text-gray-700 font-medium transition-colors"
                >
                  Skip Tour
                </button>
              )}

              <button
                onClick={handleNext}
                className="flex items-center bg-gradient-to-r from-violet-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-violet-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {currentStep === tourSteps.length - 1 ? (
                  <>
                    Get Started
                    <FiCheck className="ml-2" />
                  </>
                ) : (
                  <>
                    Next
                    <FiArrowRight className="ml-2" />
                  </>
                )}
              </button>
            </div>

            {/* Step Counter */}
            <p className="text-center text-sm text-gray-400 mt-6">
              Step {currentStep + 1} of {tourSteps.length}
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SiteTour;
