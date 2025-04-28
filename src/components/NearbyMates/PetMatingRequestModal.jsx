import React, { useState } from "react";
import { motion } from "framer-motion";
import { FiHeart, FiX } from "react-icons/fi";
import { FaPaw } from "react-icons/fa";

const PetMatingRequestModal = ({
  isOpen,
  onClose,
  selectedPet,
  userPet,
  onSendRequest,
}) => {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSending(true);
    onSendRequest({
      message:
        message.trim() ||
        `Hello! I'd like to arrange a mating between our pets.`,
    });
    setTimeout(() => {
      setSending(false);
    }, 500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4 text-center">
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left shadow-xl transition-all"
        >
          <div className="absolute top-3 right-3">
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
          <div className="text-center mb-4">
            <FiHeart className="h-8 w-8 text-pink-500 mx-auto mb-2" />
            <h3 className="text-lg font-bold text-lavender-900">
              Mating Request
            </h3>
          </div>
          <div className="flex items-center justify-center space-x-4 mb-6">
            <div className="flex flex-col items-center">
              <div className="h-16 w-16 rounded-full overflow-hidden bg-lavender-100 flex items-center justify-center mb-1">
                {userPet.image ? (
                  <img
                    src={userPet.image}
                    alt={userPet.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <FaPaw className="h-8 w-8 text-lavender-300" />
                )}
              </div>
              <p className="text-xs font-medium">{userPet.name}</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="h-px w-12 bg-lavender-300"></div>
                <FiHeart className="absolute -top-2 left-1/2 transform -translate-x-1/2 text-pink-500" />
              </div>
              <p className="text-xs text-gray-500 mt-4">Match</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="h-16 w-16 rounded-full overflow-hidden bg-lavender-100 flex items-center justify-center mb-1">
                {selectedPet.image ? (
                  <img
                    src={selectedPet.image}
                    alt={selectedPet.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <FaPaw className="h-8 w-8 text-lavender-300" />
                )}
              </div>
              <p className="text-xs font-medium">{selectedPet.name}</p>
            </div>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                htmlFor="message"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Message for the pet owner
              </label>
              <textarea
                id="message"
                rows="3"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={`Hello! I'd like to arrange a mating between our pets.`}
                className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-lavender-500 focus:border-transparent resize-none"
              />
            </div>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={sending}
                className="flex-1 py-2 px-4 bg-gradient-to-r from-lavender-600 to-purple-600 hover:from-lavender-700 hover:to-purple-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center justify-center"
              >
                {sending ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                ) : (
                  <FiHeart className="mr-2" />
                )}
                Send Request
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default PetMatingRequestModal;