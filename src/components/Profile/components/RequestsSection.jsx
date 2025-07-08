import React, { useState } from "react";
import { motion } from "framer-motion";
import { FiHeart, FiMoreVertical, FiCheck, FiX } from "react-icons/fi";
import { FaPaw } from "react-icons/fa";
import EmptyState from "./EmptyState";

const RequestsSection = ({ requests, onAccept, onDecline }) => {
  const [selectedRequest, setSelectedRequest] = useState(null);

  const handleToggleDropdown = (request) => {
    setSelectedRequest(selectedRequest?.id === request.id ? null : request);
  };

  return (
    <motion.div
      key="requests"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      {requests.length > 0 ? (
        <div className="space-y-4">
          {requests.map((request, index) => (
            <motion.div
              key={request.id}
              className="bg-white rounded-2xl p-4 shadow-md border border-violet-100"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center flex-1">
                  <div className="w-12 h-12 rounded-full bg-violet-100 overflow-hidden mr-3">
                    {request.direction === "incoming" ? (
                      request.senderPetImage
                    ) : request.receiverPetImage ? (
                      <img
                        src={
                          request.direction === "incoming"
                            ? request.senderPetImage
                            : request.receiverPetImage
                        }
                        alt="Pet"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FaPaw className="text-violet-500 text-lg" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-gray-500 mb-1">
                      {request.direction === "incoming"
                        ? "Request from"
                        : "Request to"}
                    </div>
                    <div className="font-medium text-slate-800">
                      {request.direction === "incoming"
                        ? request.senderName
                        : request.receiverName}
                    </div>
                    <div className="text-sm text-gray-600">
                      {request.direction === "incoming"
                        ? request.senderPetName
                        : request.receiverPetName}{" "}
                      for{" "}
                      {request.direction === "incoming"
                        ? request.receiverPetName
                        : request.senderPetName}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      request.status === "pending"
                        ? "bg-yellow-100 text-yellow-700"
                        : request.status === "accepted"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {request.status}
                  </span>

                  {request.status === "pending" &&
                    request.direction === "incoming" && (
                      <div className="relative">
                        <button
                          onClick={() => handleToggleDropdown(request)}
                          className="p-1 rounded-full hover:bg-violet-100"
                        >
                          <FiMoreVertical className="w-4 h-4 text-gray-500" />
                        </button>
                        {selectedRequest?.id === request.id && (
                          <div className="absolute right-0 top-8 bg-white shadow-lg rounded-lg z-10 w-32 py-1 border">
                            <button
                              onClick={() => onAccept(request)}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-violet-50 flex items-center text-green-600"
                            >
                              <FiCheck className="mr-2" /> Accept
                            </button>
                            <button
                              onClick={() => onDecline(request)}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-violet-50 flex items-center text-red-600"
                            >
                              <FiX className="mr-2" /> Decline
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                </div>
              </div>

              {request.message && (
                <div className="mt-3 p-3 bg-violet-50 rounded-lg">
                  <p className="text-sm text-slate-700">"{request.message}"</p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<FiHeart className="w-8 h-8 text-violet-400" />}
          title="No Mating Requests"
          description="Requests from other pet owners will appear here"
          buttonText="Find Matches"
          onButtonClick={() => {}}
        />
      )}
    </motion.div>
  );
};

export default RequestsSection;