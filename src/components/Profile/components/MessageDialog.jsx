import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ref, get, onValue, off, push, set, update } from "firebase/database";
import { database, auth } from "../../../firebase";
import {
  FiSend,
  FiX,
  FiHeart,
  FiPaperclip,
  FiImage,
  FiSmile,
  FiMessageCircle,
  FiCheckCircle,
} from "react-icons/fi";
import { FaPaw } from "react-icons/fa";

const MessageDialog = ({
  open,
  onClose,
  conversationId,
  recipientId,
  senderPet,
  receiverPet,
  matingRequestId,
}) => {
  const user = auth.currentUser;

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [matingRequest, setMatingRequest] = useState(null);
  const [typingTimeout, setTypingTimeout] = useState(null);

  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        messageInputRef.current?.focus();
      }, 300);
    }
  }, [open]);

  useEffect(() => {
    if (!open || !matingRequestId) return;
    const fetchMatingRequest = async () => {
      try {
        const sentRef = ref(
          database,
          `matingRequests/sent/${user.uid}/${matingRequestId}`
        );
        const sentSnapshot = await get(sentRef);

        if (sentSnapshot.exists()) {
          setMatingRequest(sentSnapshot.val());
          return;
        }
        const receivedRef = ref(
          database,
          `matingRequests/received/${user.uid}/${matingRequestId}`
        );
        const receivedSnapshot = await get(receivedRef);

        if (receivedSnapshot.exists()) {
          setMatingRequest(receivedSnapshot.val());
        }
      } catch (error) {
        console.error("Error fetching mating request:", error);
      }
    };

    fetchMatingRequest();
  }, [open, matingRequestId, user]);

  useEffect(() => {
    if (!open || !conversationId) return;
    setLoading(true);
    const messagesRef = ref(
      database,
      `conversations/${conversationId}/messages`
    );

    onValue(messagesRef, (snapshot) => {
      if (snapshot.exists()) {
        const messagesData = snapshot.val();
        const messagesArray = Object.keys(messagesData).map((key) => ({
          id: key,
          ...messagesData[key],
        }));

        messagesArray.sort((a, b) => a.timestamp - b.timestamp);
        setMessages(messagesArray);
      } else {
        setMessages([]);
      }
      setLoading(false);
    });

    return () => {
      off(messagesRef);
    };
  }, [open, conversationId]);

  const handleTyping = () => {
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    const typingRef = ref(
      database,
      `conversations/${conversationId}/typing/${user.uid}`
    );
    update(typingRef, { typing: true });

    const timeout = setTimeout(() => {
      const typingRef = ref(
        database,
        `conversations/${conversationId}/typing/${user.uid}`
      );
      update(typingRef, { typing: false });
    }, 2000);
    setTypingTimeout(timeout);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || !conversationId) return;

    try {
      const messagesRef = ref(
        database,
        `conversations/${conversationId}/messages`
      );
      const newMessageRef = push(messagesRef);

      await set(newMessageRef, {
        text: newMessage,
        senderId: user.uid,
        senderName: user.displayName || "You",
        timestamp: Date.now(),
        read: false,
      });

      const conversationRef = ref(database, `conversations/${conversationId}`);
      await update(conversationRef, {
        lastMessageText: newMessage,
        lastMessageTimestamp: Date.now(),
        participants: {
          [user.uid]: true,
          [recipientId]: true,
        },
        matingRequestId: matingRequestId || null,
      });

      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
      const typingRef = ref(
        database,
        `conversations/${conversationId}/typing/${user.uid}`
      );
      update(typingRef, { typing: false });
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();

    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    const daysDiff = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (daysDiff < 7) {
      return `${date.toLocaleDateString([], {
        weekday: "short",
      })} ${date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    }

    return (
      date.toLocaleDateString([], { month: "short", day: "numeric" }) +
      " " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  const groupedMessages = messages.reduce((groups, message) => {
    const date = new Date(message.timestamp).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});

  const getPetGradient = (type) => {
    if (!type) return "bg-gray-100";

    switch (type.toLowerCase()) {
      case "dog":
        return "bg-blue-100";
      case "cat":
        return "bg-yellow-100";
      default:
        return "bg-lavender-100";
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const suggestedReplies = [
    "Hello! I'm interested in arranging a meeting for our pets. When would be a good time to discuss the details?",
    `I'd love to know more about ${receiverPet?.name}. Can you share some details about their temperament?`,
    "I'm excited about this potential mating. Can we discuss health records and genetic testing?",
  ];

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ type: "spring", duration: 0.4 }}
            className="bg-white w-full max-w-4xl rounded-2xl shadow-xl overflow-hidden flex flex-col h-[80vh] max-h-[700px]"
          >
            <div className="p-4 bg-gradient-to-r from-lavender-600 to-purple-600 text-white flex items-center justify-between">
              <div className="flex items-center">
                <div className="relative mr-3">
                  <div
                    className={`w-10 h-10 rounded-full overflow-hidden ${getPetGradient(
                      senderPet?.type
                    )} border-2 border-white`}
                  >
                    {senderPet?.image ? (
                      <img
                        src={senderPet.image}
                        alt={senderPet?.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FaPaw className="text-lavender-600" />
                      </div>
                    )}
                  </div>
                  <div
                    className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full overflow-hidden ${getPetGradient(
                      receiverPet?.type
                    )} border-2 border-white`}
                  >
                    {receiverPet?.image ? (
                      <img
                        src={receiverPet.image}
                        alt={receiverPet?.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FaPaw className="text-lavender-600 text-xs" />
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold">Chat with Pets</h3>
                  <div className="text-sm text-lavender-100 flex items-center">
                    {senderPet?.name}
                    <FiHeart className="mx-1 text-pink-200" />
                    {receiverPet?.name}

                    {matingRequest && (
                      <span className="ml-2 bg-white bg-opacity-20 text-xs px-2 py-0.5 rounded-full flex items-center">
                        {matingRequest.status === "accepted" ? (
                          <>
                            <FiCheckCircle className="mr-1" />
                            Accepted
                          </>
                        ) : (
                          <>
                            <FiHeart className="mr-1" />
                            Pending
                          </>
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>
            {matingRequest && (
              <div
                className={`px-4 py-2 flex items-center justify-between text-sm ${
                  matingRequest.status === "accepted"
                    ? "bg-green-50 text-green-800 border-b border-green-100"
                    : "bg-lavender-50 text-lavender-800 border-b border-lavender-100"
                }`}
              >
                <div className="flex items-center">
                  <FiHeart
                    className={`mr-2 ${
                      matingRequest.status === "accepted"
                        ? "text-green-500"
                        : "text-pink-500"
                    }`}
                  />
                  <span>
                    Mating Request:{" "}
                    {matingRequest.status === "accepted"
                      ? "Accepted"
                      : "Pending"}
                    <span className="ml-1 text-gray-500">
                      • Requested on{" "}
                      {new Date(matingRequest.createdAt).toLocaleDateString()}
                    </span>
                  </span>
                </div>
              </div>
            )}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center">
                  <div className="w-10 h-10 border-4 border-lavender-200 border-t-lavender-600 rounded-full animate-spin mb-4"></div>
                  <p className="text-gray-500">Loading messages...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4">
                  <div className="w-16 h-16 bg-lavender-100 rounded-full flex items-center justify-center mb-4">
                    <FiMessageCircle className="w-8 h-8 text-lavender-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-lavender-900 mb-2">
                    Start Your Conversation
                  </h3>
                  <p className="text-gray-600 max-w-md mb-6">
                    This is the beginning of your conversation about the mating
                    request between {senderPet?.name} and {receiverPet?.name}.
                  </p>
                  <div className="w-full max-w-md space-y-2">
                    {suggestedReplies.map((reply, index) => (
                      <motion.button
                        key={index}
                        onClick={() => setNewMessage(reply)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full py-2 px-4 bg-white border border-lavender-200 hover:border-lavender-400 rounded-lg text-sm text-left text-gray-700 shadow-sm hover:shadow transition-all"
                      >
                        {reply}
                      </motion.button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {Object.keys(groupedMessages).map((date) => (
                    <div key={date}>
                      <div className="flex items-center justify-center my-4">
                        <div className="border-t border-gray-200 flex-grow"></div>
                        <span className="mx-4 text-xs px-2 py-1 bg-lavender-100 text-lavender-800 rounded-full">
                          {new Date(date).toLocaleDateString([], {
                            weekday: "long",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                        <div className="border-t border-gray-200 flex-grow"></div>
                      </div>
                      {groupedMessages[date].map((message, idx) => {
                        const isSender = message.senderId === user?.uid;
                        const showAvatar =
                          idx === 0 ||
                          groupedMessages[date][idx - 1].senderId !==
                            message.senderId;
                        const isConsecutive =
                          idx > 0 &&
                          groupedMessages[date][idx - 1].senderId ===
                            message.senderId;

                        return (
                          <div
                            key={message.id}
                            className={`flex mb-3 ${
                              isSender ? "justify-end" : "justify-start"
                            }`}
                          >
                            {!isSender && showAvatar && (
                              <div className="w-8 h-8 rounded-full bg-lavender-200 flex-shrink-0 mr-2 overflow-hidden">
                                {receiverPet?.image ? (
                                  <img
                                    src={receiverPet.image}
                                    alt={receiverPet?.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-lavender-200">
                                    <FaPaw className="text-lavender-600 text-xs" />
                                  </div>
                                )}
                              </div>
                            )}
                            {!isSender && isConsecutive && (
                              <div className="w-8 mr-2 flex-shrink-0"></div>
                            )}
                            <div
                              className={`max-w-[75%] ${
                                isConsecutive ? "mt-1" : ""
                              }`}
                            >
                              {!isSender && showAvatar && (
                                <div className="text-xs text-gray-500 ml-1 mb-1">
                                  {message.senderName}
                                </div>
                              )}
                              <div
                                className={`px-4 py-2 rounded-t-2xl ${
                                  isSender
                                    ? "bg-lavender-600 text-white rounded-bl-2xl rounded-br-md"
                                    : "bg-white border border-gray-200 rounded-br-2xl rounded-bl-md"
                                } ${
                                  isConsecutive
                                    ? isSender
                                      ? "rounded-tr-md"
                                      : "rounded-tl-md"
                                    : ""
                                }`}
                              >
                                <p className="whitespace-pre-wrap break-words">
                                  {message.text}
                                </p>
                              </div>
                              <div
                                className={`text-xs mt-1 ${
                                  isSender ? "text-right mr-1" : "ml-1"
                                } text-gray-500`}
                              >
                                {formatMessageTime(message.timestamp)}
                              </div>
                            </div>
                            {isSender && showAvatar && (
                              <div className="w-8 h-8 rounded-full bg-lavender-200 flex-shrink-0 ml-2 overflow-hidden">
                                {senderPet?.image ? (
                                  <img
                                    src={senderPet.image}
                                    alt={senderPet?.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-lavender-200">
                                    <FaPaw className="text-lavender-600 text-xs" />
                                  </div>
                                )}
                              </div>
                            )}
                            {isSender && isConsecutive && (
                              <div className="w-8 ml-2 flex-shrink-0"></div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>
            <div className="p-3 border-t border-gray-200 bg-white">
              <div className="flex items-center">
                <div className="flex space-x-1 mr-2">
                  <button className="p-2 text-gray-500 hover:text-lavender-600 hover:bg-lavender-50 rounded-full transition-colors">
                    <FiPaperclip className="w-5 h-5" />
                  </button>
                  <button className="p-2 text-gray-500 hover:text-lavender-600 hover:bg-lavender-50 rounded-full transition-colors">
                    <FiImage className="w-5 h-5" />
                  </button>
                  <button className="p-2 text-gray-500 hover:text-lavender-600 hover:bg-lavender-50 rounded-full transition-colors">
                    <FiSmile className="w-5 h-5" />
                  </button>
                </div>
                <div className="relative flex-1">
                  <textarea
                    ref={messageInputRef}
                    className="w-full border border-lavender-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-lavender-500 focus:border-transparent resize-none max-h-24"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      handleTyping();
                    }}
                    onKeyDown={handleKeyDown}
                    rows={1}
                  ></textarea>
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className={`p-3 ml-2 rounded-full ${
                    newMessage.trim()
                      ? "bg-lavender-600 hover:bg-lavender-700"
                      : "bg-gray-200 cursor-not-allowed"
                  } text-white transition-colors`}
                >
                  <FiSend className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default MessageDialog;
