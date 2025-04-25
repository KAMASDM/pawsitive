// src/components/Profile/components/ConversationsList.jsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ref, onValue, off, get } from "firebase/database";
import { database, auth } from "../../../firebase";
import { FiMessageSquare, FiHeart, FiChevronRight, FiClock } from "react-icons/fi";
import { FaPaw } from "react-icons/fa";

const ConversationsList = ({ onOpenConversation }) => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    const conversationsRef = ref(database, "conversations");

    const handleConversationsSnapshot = async (snapshot) => {
      if (snapshot.exists()) {
        const conversationsData = snapshot.val();
        const relevantConversations = [];

        for (const conversationId in conversationsData) {
          const conversation = conversationsData[conversationId];

          if (conversation.participants && conversation.participants[user.uid]) {
            const otherParticipantId = Object.keys(conversation.participants)
              .find(id => id !== user.uid);

            if (!otherParticipantId) continue;

            let otherParticipantName = "Unknown User";
            let senderPet = null;
            let receiverPet = null;

            try {
              // Get other participant name
              const userRef = ref(database, `users/${otherParticipantId}`);
              const userSnapshot = await get(userRef);

              if (userSnapshot.exists()) {
                const userData = userSnapshot.val();
                otherParticipantName = userData.displayName || "Unknown User";
              }

              // Get pet details if this is a mating conversation
              if (conversation.matingRequestId) {
                const sentRef = ref(database, `matingRequests/sent/${user.uid}/${conversation.matingRequestId}`);
                const sentSnapshot = await get(sentRef);

                if (sentSnapshot.exists()) {
                  const request = sentSnapshot.val();

                  const userPetRef = ref(database, `userPets/${user.uid}/${request.senderPetId}`);
                  const otherPetRef = ref(database, `userPets/${otherParticipantId}/${request.receiverPetId}`);

                  const [userPetSnapshot, otherPetSnapshot] = await Promise.all([
                    get(userPetRef), get(otherPetRef)
                  ]);

                  senderPet = userPetSnapshot.exists()
                    ? { id: request.senderPetId, ...userPetSnapshot.val() }
                    : { name: request.senderPetName };

                  receiverPet = otherPetSnapshot.exists()
                    ? { id: request.receiverPetId, ...otherPetSnapshot.val() }
                    : { name: request.receiverPetName, image: request.receiverPetImage };
                } else {
                  // Check if it's a received mating request
                  const receivedRef = ref(database, `matingRequests/received/${user.uid}/${conversation.matingRequestId}`);
                  const receivedSnapshot = await get(receivedRef);

                  if (receivedSnapshot.exists()) {
                    const request = receivedSnapshot.val();

                    const userPetRef = ref(database, `userPets/${user.uid}/${request.receiverPetId}`);
                    const otherPetRef = ref(database, `userPets/${otherParticipantId}/${request.senderPetId}`);

                    const [userPetSnapshot, otherPetSnapshot] = await Promise.all([
                      get(userPetRef), get(otherPetRef)
                    ]);

                    receiverPet = userPetSnapshot.exists()
                      ? { id: request.receiverPetId, ...userPetSnapshot.val() }
                      : { name: request.receiverPetName };

                    senderPet = otherPetSnapshot.exists()
                      ? { id: request.senderPetId, ...otherPetSnapshot.val() }
                      : { name: request.senderPetName, image: request.senderPetImage };
                  }
                }
              }
            } catch (error) {
              console.error("Error getting conversation details:", error);
            }

            relevantConversations.push({
              id: conversationId,
              otherParticipantId,
              otherParticipantName,
              senderPet,
              receiverPet,
              lastMessage: conversation.lastMessageText || "No messages yet",
              lastMessageTime: conversation.lastMessageTimestamp || 0,
              matingRequestId: conversation.matingRequestId,
              type: conversation.matingRequestId ? "mating" : "adoption"
            });
          }
        }

        // Sort by most recent message
        relevantConversations.sort((a, b) => b.lastMessageTime - a.lastMessageTime);
        setConversations(relevantConversations);
      }

      setLoading(false);
    };

    onValue(conversationsRef, handleConversationsSnapshot);

    return () => {
      off(conversationsRef, "value", handleConversationsSnapshot);
    };
  }, [user]);

  // Filter conversations based on active filter
  const filteredConversations = activeFilter === "all" 
    ? conversations 
    : conversations.filter(conv => conv.type === activeFilter);

  // Format message time for display
  const formatLastMessageTime = (timestamp) => {
    if (!timestamp) return "";

    const date = new Date(timestamp);
    const now = new Date();
    const diff = (now - date) / 1000; // difference in seconds

    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return date.toLocaleDateString([], { weekday: "short" });

    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  // Function to get pet avatar background based on pet type
  const getPetBackground = (petType) => {
    if (!petType) return "bg-gray-200";
    
    switch(petType.toLowerCase()) {
      case 'dog':
        return "bg-blue-100";
      case 'cat':
        return "bg-yellow-100";
      default:
        return "bg-lavender-100";
    }
  };

  // Animation variants
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-lavender-100 p-6 flex flex-col items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-t-lavender-600 border-lavender-200 rounded-full animate-spin mb-4"></div>
        <p className="text-lavender-900 font-medium">Loading conversations...</p>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-lavender-100 p-8 flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-lavender-100 rounded-full flex items-center justify-center mb-4">
          <FiMessageSquare className="w-8 h-8 text-lavender-600" />
        </div>
        <h3 className="text-xl font-bold text-lavender-900 mb-2">
          No Conversations Yet
        </h3>
        <p className="text-gray-600 max-w-md mb-6">
          When you start messaging with pet owners, your conversations will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-lavender-100 overflow-hidden">
      {/* Filters */}
      <div className="p-4 border-b border-lavender-100 flex items-center gap-2">
        <button
          onClick={() => setActiveFilter("all")}
          className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
            activeFilter === "all"
              ? "bg-lavender-600 text-white" 
              : "bg-lavender-50 text-lavender-800 hover:bg-lavender-100"
          }`}
        >
          All
        </button>
        <button
          onClick={() => setActiveFilter("mating")}
          className={`px-3 py-1.5 rounded-full text-sm transition-colors flex items-center ${
            activeFilter === "mating"
              ? "bg-pink-500 text-white" 
              : "bg-pink-50 text-pink-800 hover:bg-pink-100"
          }`}
        >
          <FiHeart className="mr-1 w-3.5 h-3.5" /> 
          Mating
        </button>
        <button
          onClick={() => setActiveFilter("adoption")}
          className={`px-3 py-1.5 rounded-full text-sm transition-colors flex items-center ${
            activeFilter === "adoption"
              ? "bg-green-500 text-white" 
              : "bg-green-50 text-green-800 hover:bg-green-100"
          }`}
        >
          <FaPaw className="mr-1 w-3.5 h-3.5" />
          Adoption
        </button>
      </div>

      {/* Conversation list */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="divide-y divide-lavender-100"
      >
        <AnimatePresence>
          {filteredConversations.length > 0 ? (
            filteredConversations.map((conversation) => (
              <motion.div
                key={conversation.id}
                variants={item}
                whileHover={{ backgroundColor: 'rgba(124, 58, 237, 0.05)' }}
                onClick={() => onOpenConversation(conversation)}
                className="p-4 flex items-start cursor-pointer transition-colors"
              >
                {/* Pet avatars */}
                <div className="relative mr-4 flex-shrink-0">
                  <div className={`w-12 h-12 rounded-full overflow-hidden ${getPetBackground(conversation.senderPet?.type)}`}>
                    {conversation.senderPet?.image ? (
                      <img 
                        src={conversation.senderPet.image} 
                        alt={conversation.senderPet.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FaPaw className="text-lavender-600 w-5 h-5" />
                      </div>
                    )}
                  </div>
                  
                  {/* Second pet small avatar */}
                  <div className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-full border-2 border-white overflow-hidden ${getPetBackground(conversation.receiverPet?.type)}`}>
                    {conversation.receiverPet?.image ? (
                      <img 
                        src={conversation.receiverPet.image} 
                        alt={conversation.receiverPet.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FaPaw className="text-lavender-600 w-3 h-3" />
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Conversation content */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    {/* User name */}
                    <h3 className="font-semibold text-lavender-900 truncate">
                      {conversation.otherParticipantName}
                    </h3>
                    
                    {/* Time */}
                    <div className="text-xs text-gray-500 flex items-center ml-2 flex-shrink-0">
                      <FiClock className="w-3 h-3 mr-1" />
                      {formatLastMessageTime(conversation.lastMessageTime)}
                    </div>
                  </div>
                  
                  {/* Message preview */}
                  <p className="text-sm text-gray-700 truncate mb-1">
                    {conversation.lastMessage}
                  </p>
                  
                  {/* Pet names and type tag */}
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      {conversation.senderPet?.name} 
                      <span className="mx-1">⟷</span> 
                      {conversation.receiverPet?.name}
                    </div>
                    
                    <div className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                      conversation.type === "mating" 
                        ? "bg-pink-100 text-pink-800" 
                        : "bg-green-100 text-green-800"
                    }`}>
                      {conversation.type === "mating" ? "Mating" : "Adoption"}
                    </div>
                  </div>
                </div>
                
                {/* Navigation icon */}
                <FiChevronRight className="w-5 h-5 text-gray-400 ml-2 flex-shrink-0 self-center" />
              </motion.div>
            ))
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-8 text-center"
            >
              <p className="text-gray-500">
                No {activeFilter === "mating" ? "mating" : activeFilter === "adoption" ? "adoption" : ""} conversations found.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default ConversationsList;