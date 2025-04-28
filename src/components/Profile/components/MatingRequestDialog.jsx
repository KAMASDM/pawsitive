import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiHeart, FiInfo, FiSend, FiX } from "react-icons/fi";
import { FaPaw } from "react-icons/fa";

const MatingRequestDialog = ({
  open,
  onClose,
  onSend,
  senderPet,
  receiverPet,
  receiverOwner,
}) => {
  const [message, setMessage] = useState("");
  const [step, setStep] = useState(1);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (open) {
      setStep(1);
      setMessage("");
      setSending(false);
    }
  }, [open]);

  const handleSend = async () => {
    if (step === 1) {
      setStep(2);
      return;
    }

    if (step === 2) {
      setSending(true);
      try {
        await onSend({
          senderPetId: senderPet.id,
          receiverPetId: receiverPet.id,
          receiverId: receiverOwner?.id,
          message:
            message || `Hello! I'd like to arrange mating between our pets.`,
          createdAt: Date.now(),
          status: "pending",
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

  const getPetDetails = (pet) => {
    const details = [];
    if (pet?.breed) details.push(pet.breed);
    if (pet?.age) details.push(pet.age);
    if (pet?.gender) details.push(pet.gender);

    return details.join(" • ");
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-md relative overflow-hidden"
          >
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
              onClick={onClose}
            >
              <FiX className="w-5 h-5" />
            </button>
            <div className="bg-gradient-to-r from-lavender-600 to-purple-600 px-6 pt-16 pb-8 text-white text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full opacity-10">
                <div className="absolute -left-8 -top-8 w-40 h-40 rounded-full bg-white"></div>
                <div className="absolute right-10 bottom-6 w-20 h-20 rounded-full bg-white"></div>
              </div>
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step1-header"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <FiHeart className="mx-auto text-pink-200 w-10 h-10 mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Mating Request</h2>
                    <p className="text-lavender-100">
                      Connect your pet with a compatible mate
                    </p>
                  </motion.div>
                )}
                {step === 2 && (
                  <motion.div
                    key="step2-header"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <FiSend className="mx-auto text-lavender-100 w-8 h-8 mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Add a Message</h2>
                    <p className="text-lavender-100">
                      Let {receiverPet?.name}'s owner know more about your
                      interest
                    </p>
                  </motion.div>
                )}
                {step === 3 && (
                  <motion.div
                    key="step3-header"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="w-16 h-16 mx-auto bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-4">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-10 w-10 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Request Sent!</h2>
                    <p className="text-lavender-100">
                      Your mating request has been sent successfully
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="p-6">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step1-content"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <div className="flex items-center justify-center space-x-12 mb-8">
                      <div className="text-center">
                        <div className="w-20 h-20 mx-auto rounded-full overflow-hidden border-4 border-lavender-100 mb-2 bg-lavender-50">
                          {senderPet?.image ? (
                            <img
                              src={senderPet.image}
                              alt={senderPet.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <FaPaw className="w-8 h-8 text-lavender-400" />
                            </div>
                          )}
                        </div>
                        <h3 className="font-medium text-lavender-900">
                          {senderPet?.name}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {getPetDetails(senderPet)}
                        </p>
                      </div>
                      <div className="flex flex-col items-center">
                        <motion.div
                          animate={{
                            scale: [1, 1.1, 1],
                            rotate: [0, 5, 0],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                          className="text-pink-500"
                        >
                          <FiHeart className="w-8 h-8" />
                        </motion.div>
                      </div>
                      <div className="text-center">
                        <div className="w-20 h-20 mx-auto rounded-full overflow-hidden border-4 border-lavender-100 mb-2 bg-lavender-50">
                          {receiverPet?.image ? (
                            <img
                              src={receiverPet.image}
                              alt={receiverPet.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <FaPaw className="w-8 h-8 text-lavender-400" />
                            </div>
                          )}
                        </div>
                        <h3 className="font-medium text-lavender-900">
                          {receiverPet?.name}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {getPetDetails(receiverPet)}
                        </p>
                      </div>
                    </div>
                    <div className="bg-lavender-50 p-4 rounded-xl mb-6 flex items-start">
                      <FiInfo className="text-lavender-600 w-5 h-5 flex-shrink-0 mr-2 mt-0.5" />
                      <div className="text-sm text-lavender-900">
                        <p className="mb-1">
                          You're about to send a mating request for your pet{" "}
                          {senderPet?.name} with {receiverPet?.name}.
                        </p>
                        <p>
                          The owner will review your request and may contact you
                          to discuss details.
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSend}
                        className="px-4 py-2 text-white bg-gradient-to-r from-lavender-600 to-purple-600 hover:from-lavender-700 hover:to-purple-700 rounded-lg transition-colors flex items-center"
                      >
                        Continue <FiHeart className="ml-2" />
                      </button>
                    </div>
                  </motion.div>
                )}
                {step === 2 && (
                  <motion.div
                    key="step2-content"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Message to {receiverPet?.name}'s owner
                      </label>
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="w-full rounded-lg border border-lavender-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-lavender-500 focus:border-transparent resize-none"
                        placeholder={`Hello! I'd like to arrange a mating between my pet ${
                          senderPet?.name
                        } and your pet ${receiverPet?.name}. My pet is a ${
                          senderPet?.breed || ""
                        } ${senderPet?.gender || ""}, ${
                          senderPet?.age || ""
                        }. Please let me know if you're interested.`}
                        rows={6}
                      ></textarea>
                    </div>
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => setStep(1)}
                        className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleSend}
                        disabled={sending}
                        className="px-4 py-2 text-white bg-gradient-to-r from-lavender-600 to-purple-600 hover:from-lavender-700 hover:to-purple-700 rounded-lg transition-colors flex items-center"
                      >
                        {sending ? (
                          <>
                            <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></span>
                            Sending...
                          </>
                        ) : (
                          <>
                            Send Request <FiSend className="ml-2" />
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}
                {step === 3 && (
                  <motion.div
                    key="step3-content"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="text-center"
                  >
                    <div className="my-6">
                      <p className="text-gray-700 mb-6">
                        Your mating request has been sent to {receiverPet?.name}
                        's owner. You'll be notified when they respond.
                      </p>

                      <div className="flex justify-between bg-lavender-50 p-4 rounded-xl mx-auto max-w-xs">
                        <div className="text-center">
                          <div className="w-12 h-12 mx-auto rounded-full overflow-hidden border-2 border-lavender-100 mb-1">
                            {senderPet?.image ? (
                              <img
                                src={senderPet.image}
                                alt={senderPet.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-lavender-50">
                                <FaPaw className="w-5 h-5 text-lavender-400" />
                              </div>
                            )}
                          </div>
                          <p className="text-xs font-medium text-lavender-900">
                            {senderPet?.name}
                          </p>
                        </div>
                        <FiHeart className="text-pink-500 self-center w-5 h-5" />
                        <div className="text-center">
                          <div className="w-12 h-12 mx-auto rounded-full overflow-hidden border-2 border-lavender-100 mb-1">
                            {receiverPet?.image ? (
                              <img
                                src={receiverPet.image}
                                alt={receiverPet.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-lavender-50">
                                <FaPaw className="w-5 h-5 text-lavender-400" />
                              </div>
                            )}
                          </div>
                          <p className="text-xs font-medium text-lavender-900">
                            {receiverPet?.name}
                          </p>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={onClose}
                      className="px-6 py-2 bg-gradient-to-r from-lavender-600 to-purple-600 hover:from-lavender-700 hover:to-purple-700 text-white rounded-lg transition-colors mx-auto"
                    >
                      Done
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default MatingRequestDialog;
