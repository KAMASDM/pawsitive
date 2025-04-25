// src/components/NearbyMates/PetMatingRequestModal.jsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiHeart, FiX, FiSend, FiInfo } from "react-icons/fi";
import { FaPaw } from "react-icons/fa";

/**
 * Modal component for sending pet mating requests
 */
const PetMatingRequestModal = ({ isOpen, onClose, selectedPet, userPet, onSendRequest }) => {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [step, setStep] = useState(1); // 1: confirm, 2: message, 3: success
  
  // Reset state when modal is opened
  useEffect(() => {
    if (isOpen) {
      setMessage("");
      setSending(false);
      setStep(1);
    }
  }, [isOpen]);
  
  // Handle form submission
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
    if (step === 1) {
      setStep(2);
      return;
    }
    
    if (step === 2) {
      setSending(true);
      
      try {
        await onSendRequest({ 
          message: message.trim() || `Hello! I'd like to arrange a mating between our pets.`
        });
        setStep(3);
      } catch (error) {
        console.error("Error sending request:", error);
        alert("Failed to send request. Please try again.");
      } finally {
        setSending(false);
      }
    }
    
    if (step === 3) {
      onClose();
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4 text-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
          onClick={onClose}
        />
        
        {/* Modal */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`step-${step}`}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", duration: 0.4 }}
            className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left shadow-xl"
          >
            {/* Close Button */}
            <div className="absolute top-3 right-3">
              <button 
                onClick={onClose} 
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            
            {/* Step 1: Confirmation */}
            {step === 1 && (
              <>
                <div className="flex flex-col items-center text-center mb-6">
                  <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mb-3">
                    <FiHeart className="h-6 w-6 text-pink-500" />
                  </div>
                  <h3 className="text-xl font-bold text-lavender-900 mb-2">
                    Request Mating Match
                  </h3>
                  <p className="text-gray-600 text-sm">
                    You're about to send a mating request between your pet and {selectedPet.name}
                  </p>
                </div>
                
                <div className="flex items-center justify-center space-x-4 py-6">
                  {/* User Pet */}
                  <div className="flex flex-col items-center">
                    <div className="h-20 w-20 rounded-full overflow-hidden bg-lavender-100 flex items-center justify-center mb-2 border-2 border-lavender-300">
                      {userPet.image ? (
                        <img 
                          src={userPet.image} 
                          alt={userPet.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <FaPaw className="h-10 w-10 text-lavender-300" />
                      )}
                    </div>
                    <h4 className="font-medium text-sm text-lavender-900">{userPet.name}</h4>
                    <span className="text-xs text-gray-500">{userPet.breed}</span>
                  </div>
                  
                  {/* Connection Icon */}
                  <div className="flex flex-col items-center">
                    <motion.div 
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ 
                        repeat: Infinity, 
                        duration: 1.5,
                        ease: "easeInOut" 
                      }}
                    >
                      <FiHeart className="text-pink-500 text-2xl" />
                    </motion.div>
                  </div>
                  
                  {/* Selected Pet */}
                  <div className="flex flex-col items-center">
                    <div className="h-20 w-20 rounded-full overflow-hidden bg-lavender-100 flex items-center justify-center mb-2 border-2 border-lavender-300">
                      {selectedPet.image ? (
                        <img 
                          src={selectedPet.image} 
                          alt={selectedPet.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <FaPaw className="h-10 w-10 text-lavender-300" />
                      )}
                    </div>
                    <h4 className="font-medium text-sm text-lavender-900">{selectedPet.name}</h4>
                    <span className="text-xs text-gray-500">{selectedPet.breed}</span>
                  </div>
                </div>
                
                <div className="bg-lavender-50 p-3 rounded-lg mb-6">
                  <div className="flex items-start">
                    <FiInfo className="text-lavender-600 mt-0.5 mr-2 flex-shrink-0" />
                    <p className="text-xs text-lavender-800">
                      This will send a notification to {selectedPet.name}'s owner. 
                      They'll review your request and may contact you for more details.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors text-sm font-medium"
                  >
                    Cancel
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="flex-1 py-2.5 px-4 bg-gradient-to-r from-lavender-600 to-purple-600 hover:from-lavender-700 hover:to-purple-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center justify-center"
                  >
                    Continue
                  </button>
                </div>
              </>
            )}
            
            {/* Step 2: Message */}
            {step === 2 && (
              <form onSubmit={handleSubmit}>
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-lavender-900 mb-2">
                    Add a Message
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Add a personal message to {selectedPet.name}'s owner
                  </p>
                </div>
                
                <div className="mb-6">
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                    Your message (optional)
                  </label>
                  <textarea
                    id="message"
                    rows="4"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={`Hello! I'd like to arrange a mating between our pets. My pet ${userPet.name} is ${userPet.age || 'a'} ${userPet.breed || 'pet'} looking for a companion.`}
                    className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-lavender-500 focus:border-transparent resize-none"
                  />
                </div>
                
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors text-sm font-medium"
                  >
                    Back
                  </button>
                  
                  <button
                    type="submit"
                    disabled={sending}
                    className="flex-1 py-2.5 px-4 bg-gradient-to-r from-lavender-600 to-purple-600 hover:from-lavender-700 hover:to-purple-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center justify-center"
                  >
                    {sending ? (
                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                    ) : (
                      <FiSend className="mr-2" />
                    )}
                    Send Request
                  </button>
                </div>
              </form>
            )}
            
            {/* Step 3: Success */}
            {step === 3 && (
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                
                <h3 className="text-xl font-bold text-lavender-900 mb-2">
                  Request Sent!
                </h3>
                
                <p className="text-gray-600 mb-6">
                  Your mating request has been sent to {selectedPet.name}'s owner. 
                  You'll be notified when they respond.
                </p>
                
                <button
                  onClick={onClose}
                  className="w-full py-3 px-4 bg-gradient-to-r from-lavender-600 to-purple-600 hover:from-lavender-700 hover:to-purple-700 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  Done
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default PetMatingRequestModal;