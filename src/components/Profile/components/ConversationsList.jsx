import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ref, onValue, get } from "firebase/database";
import { database, auth } from "../../../firebase";
import {
  FiMessageSquare,
  FiHeart,
  FiChevronRight,
  FiClock,
} from "react-icons/fi";
import { FaPaw } from "react-icons/fa";
import ConversationsListShimmer from "../../../UI/ConversationsListShimmer";

const ConversationsList = ({ onOpenConversation }) => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) {
      console.log("ConversationsList: No user logged in");
      setLoading(false);
      return;
    }
    
    console.log("ConversationsList: Setting up listener for user:", user.uid);
    const conversationsRef = ref(database, "conversations");
    
    const handleConversationsSnapshot = async (snapshot) => {
      console.log("ConversationsList: Snapshot received, exists:", snapshot.exists());
      
      if (!snapshot.exists()) {
        console.log("ConversationsList: No conversations node in database");
        setConversations([]);
        setLoading(false);
        return;
      }
      
      const conversationsData = snapshot.val();
      console.log("ConversationsList: Total conversations in DB:", Object.keys(conversationsData).length);
      
      // Filter conversations for current user first
      const userConversations = Object.entries(conversationsData)
        .filter(([_, conversation]) => 
          conversation.participants && conversation.participants[user.uid]
        );

      console.log("ConversationsList: User conversations count:", userConversations.length);

      if (userConversations.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      // Batch fetch all required data in parallel
      const conversationsPromises = userConversations.map(async ([conversationId, conversation]) => {
        try {
          const otherParticipantId = Object.keys(conversation.participants).find((id) => id !== user.uid);
          if (!otherParticipantId) return null;

          // Prepare all database references
          const userRef = ref(database, `users/${otherParticipantId}`);
          const fetchPromises = [get(userRef)];

          // If there's a mating request, prepare those refs too
          let sentRequestRef = null;
          let receivedRequestRef = null;
          
          if (conversation.matingRequestId) {
            sentRequestRef = ref(database, `matingRequests/sent/${user.uid}/${conversation.matingRequestId}`);
            receivedRequestRef = ref(database, `matingRequests/received/${user.uid}/${conversation.matingRequestId}`);
            fetchPromises.push(get(sentRequestRef), get(receivedRequestRef));
          }

          // Fetch all data in parallel
          const results = await Promise.all(fetchPromises);
          const [userSnapshot, sentSnapshot, receivedSnapshot] = results;

          let otherParticipantName = "Pet's Owner";
          let senderPet = null;
          let receiverPet = null;

          // Get participant name
          if (userSnapshot.exists()) {
            const userData = userSnapshot.val();
            otherParticipantName = userData.displayName || "Pet's Owner";
          }

          // Handle mating request data
          if (conversation.matingRequestId) {
            if (sentSnapshot && sentSnapshot.exists()) {
              const request = sentSnapshot.val();
              
              // Fetch both pets in parallel
              const [userPetSnapshot, otherPetSnapshot] = await Promise.all([
                get(ref(database, `userPets/${user.uid}/${request.senderPetId}`)),
                get(ref(database, `userPets/${otherParticipantId}/${request.receiverPetId}`))
              ]);

              senderPet = userPetSnapshot.exists()
                ? { id: request.senderPetId, ...userPetSnapshot.val() }
                : { name: request.senderPetName };

              receiverPet = otherPetSnapshot.exists()
                ? { id: request.receiverPetId, ...otherPetSnapshot.val() }
                : { name: request.receiverPetName, image: request.receiverPetImage };
                
            } else if (receivedSnapshot && receivedSnapshot.exists()) {
              const request = receivedSnapshot.val();
              
              // Fetch both pets in parallel
              const [userPetSnapshot, otherPetSnapshot] = await Promise.all([
                get(ref(database, `userPets/${user.uid}/${request.receiverPetId}`)),
                get(ref(database, `userPets/${otherParticipantId}/${request.senderPetId}`))
              ]);

              receiverPet = userPetSnapshot.exists()
                ? { id: request.receiverPetId, ...userPetSnapshot.val() }
                : { name: request.receiverPetName };

              senderPet = otherPetSnapshot.exists()
                ? { id: request.senderPetId, ...otherPetSnapshot.val() }
                : { name: request.senderPetName, image: request.senderPetImage };
            }
          }

          return {
            id: conversationId,
            otherParticipantId,
            otherParticipantName,
            senderPet,
            receiverPet,
            lastMessage: conversation.lastMessageText || "No messages yet",
            lastMessageTime: conversation.lastMessageTimestamp || 0,
            matingRequestId: conversation.matingRequestId,
            type: conversation.matingRequestId ? "mating" : "adoption",
          };
        } catch (error) {
          console.error(`Error processing conversation ${conversationId}:`, error);
          return null;
        }
      });

      // Wait for all conversations to be processed in parallel
      const processedConversations = await Promise.all(conversationsPromises);
      const validConversations = processedConversations.filter(Boolean);

      // Sort by most recent
      validConversations.sort((a, b) => b.lastMessageTime - a.lastMessageTime);
      
      console.log("ConversationsList: Setting conversations, count:", validConversations.length);
      setConversations(validConversations);
      setLoading(false);
    };

    console.log("ConversationsList: About to set up onValue listener");
    
    const unsubscribe = onValue(conversationsRef, handleConversationsSnapshot, (error) => {
      console.error("ConversationsList: Firebase listener error:", error);
      setLoading(false);
    });

    return () => {
      console.log("ConversationsList: Cleaning up listener");
      unsubscribe();
    };
  }, [user]);

  const filteredConversations =
    activeFilter === "all"
      ? conversations
      : conversations.filter((conv) => conv.type === activeFilter);

  const formatLastMessageTime = (timestamp) => {
    if (!timestamp) return "";

    const date = new Date(timestamp);
    const now = new Date();
    const diff = (now - date) / 1000;

    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return date.toLocaleDateString([], { weekday: "short" });

    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const getPetBackground = (petType) => {
    if (!petType) return "bg-gray-200";
    switch (petType.toLowerCase()) {
      case "dog":
        return "bg-blue-100";
      case "cat":
        return "bg-yellow-100";
      default:
        return "bg-lavender-100";
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  if (loading) {
    console.log("ConversationsList: Rendering shimmer (loading)");
    return <ConversationsListShimmer count={7} />;
  }

  if (conversations.length === 0) {
    console.log("ConversationsList: Rendering empty state");
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-lavender-100 p-8 flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-lavender-100 rounded-full flex items-center justify-center mb-4">
          <FiMessageSquare className="w-8 h-8 text-lavender-600" />
        </div>
        <h3 className="text-xl font-bold text-lavender-900 mb-2">
          No Conversations Yet
        </h3>
        <p className="text-gray-600 max-w-md mb-6">
          When you start messaging with pet owners, your conversations will
          appear here.
        </p>
        <div className="mt-4 p-4 bg-blue-50 rounded-lg text-left text-sm">
          <p className="font-semibold text-blue-900 mb-2">💡 How to start a conversation:</p>
          <ul className="text-blue-700 space-y-1">
            <li>• Send a mating request from Nearby Mates</li>
            <li>• Request to adopt a pet</li>
            <li>• Wait for someone to message you</li>
          </ul>
        </div>
      </div>
    );
  }

  console.log("ConversationsList: Rendering conversations, count:", conversations.length);
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-lavender-100 overflow-hidden">
      <div className="p-4 border-b border-lavender-100 flex items-center gap-2">
        <button
          onClick={() => setActiveFilter("all")}
          className={`px-3 py-1.5 rounded-full text-sm transition-colors ${activeFilter === "all"
            ? "bg-lavender-600 text-white"
            : "bg-lavender-50 text-lavender-800 hover:bg-lavender-100"
            }`}
        >
          All
        </button>
        <button
          onClick={() => setActiveFilter("mating")}
          className={`px-3 py-1.5 rounded-full text-sm transition-colors flex items-center ${activeFilter === "mating"
            ? "bg-pink-500 text-white"
            : "bg-pink-50 text-pink-800 hover:bg-pink-100"
            }`}
        >
          <FiHeart className="mr-1 w-3.5 h-3.5" />
          Mating
        </button>
        <button
          onClick={() => setActiveFilter("adoption")}
          className={`px-3 py-1.5 rounded-full text-sm transition-colors flex items-center ${activeFilter === "adoption"
            ? "bg-green-500 text-white"
            : "bg-green-50 text-green-800 hover:bg-green-100"
            }`}
        >
          <FaPaw className="mr-1 w-3.5 h-3.5" />
          Adoption
        </button>
      </div>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="divide-y divide-lavender-100"
      >
        <AnimatePresence>
          {filteredConversations.length > 0 ? (
            filteredConversations.map((conversation) => {
              console.log("Conversations--------", conversation);
              return (
                <motion.div
                  key={conversation.id}
                  variants={item}
                  whileHover={{ backgroundColor: "rgba(124, 58, 237, 0.05)" }}
                  onClick={() => {
                    onOpenConversation(conversation)
                  }}
                  className="p-4 flex items-start cursor-pointer transition-colors"
                >
                  <div className="relative mr-4 flex-shrink-0">
                    <div
                      className={`w-12 h-12 rounded-full overflow-hidden ${getPetBackground(
                        conversation.senderPet?.type
                      )}`}
                    >
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
                    <div
                      className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-full border-2 border-white overflow-hidden ${getPetBackground(
                        conversation.receiverPet?.type
                      )}`}
                    >
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
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="font-semibold text-lavender-900 truncate">
                        {conversation.otherParticipantName}
                      </h3>
                      <div className="text-xs text-gray-500 flex items-center ml-2 flex-shrink-0">
                        <FiClock className="w-3 h-3 mr-1" />
                        {formatLastMessageTime(conversation.lastMessageTime)}
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 truncate mb-1">
                      {conversation.lastMessage}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500">
                        {conversation.senderPet?.name && conversation.receiverPet?.name 
                          ? `${conversation.senderPet.name} & ${conversation.receiverPet.name}`
                          : conversation.senderPet?.name || conversation.receiverPet?.name || "Unknown"}
                      </div>
                      <div
                        className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${conversation.type === "mating"
                          ? "bg-pink-100 text-pink-800"
                          : "bg-green-100 text-green-800"
                          }`}
                      >
                        {conversation.type === "mating" ? "Mating" : "Adoption"}
                      </div>
                    </div>
                  </div>
                  <FiChevronRight className="w-5 h-5 text-gray-400 ml-2 flex-shrink-0 self-center" />
                </motion.div>)
            })
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-8 text-center"
            >
              <p className="text-gray-500">
                No{" "}
                {activeFilter === "mating"
                  ? "mating"
                  : activeFilter === "adoption"
                    ? "adoption"
                    : ""}{" "}
                conversations found.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default ConversationsList;