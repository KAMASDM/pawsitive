import React, { useState, useEffect, useRef } from "react";
import { ref, get, onValue, off, push, set, update } from "firebase/database";
import { database, auth } from "../../../firebase";
import EmojiPicker from "emoji-picker-react";
import {
  FiSend,
  FiX,
  FiHeart,
  FiCheckCircle,
  FiSmile,
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
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [matingRequest, setMatingRequest] = useState(null);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const user = auth.currentUser;
  const messagesEndRef = useRef(null);
  const emojiPickerRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target)
      ) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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
      setShowEmojiPicker(false);
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message. Please try again.");
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

  const getPetColor = (type) => {
    if (!type) return "linear-gradient(145deg, #f5f7fa 0%, #e4e8eb 100%)";

    switch (type.toLowerCase()) {
      case "dog":
        return "linear-gradient(145deg, #e3f2fd 0%, #bbdefb 100%)";
      case "cat":
        return "linear-gradient(145deg, #fff8e1 0%, #ffecb3 100%)";
      default:
        return "linear-gradient(145deg, #f5f7fa 0%, #e4e8eb 100%)";
    }
  };

  const onEmojiClick = (emojiData) => {
    setNewMessage((prev) => prev + emojiData.emoji);
  };

  if (!open) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 ${
        open ? "" : "hidden"
      }`}
    >
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="relative w-full max-w-4xl h-full max-h-[90vh] bg-white rounded-lg shadow-xl flex flex-col overflow-hidden">
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center overflow-hidden">
            <div className="flex -space-x-2 mr-3 min-w-[96px]">
              <div
                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-white shadow-md flex items-center justify-center ${getPetColor(
                  senderPet?.type
                )}`}
              >
                {senderPet?.image ? (
                  <img
                    src={senderPet.image}
                    alt={senderPet.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <FaPaw className="text-gray-600 text-lg sm:text-xl" />
                )}
              </div>
              <div
                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-white shadow-md flex items-center justify-center ${getPetColor(
                  receiverPet?.type
                )}`}
              >
                {receiverPet?.image ? (
                  <img
                    src={receiverPet.image}
                    alt={receiverPet.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <FaPaw className="text-gray-600 text-lg sm:text-xl" />
                )}
              </div>
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-lg font-semibold text-gray-900 truncate">
                {user.displayName}
              </h3>
              {matingRequest && (
                <p className="text-xs text-gray-500 truncate">
                  {matingRequest.status === "accepted" ? "Accepted" : "Pending"}{" "}
                  request
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none"
          >
            <FiX className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>
        {matingRequest && (
          <div className="hidden sm:flex bg-pink-50 px-4 py-2 border-b border-gray-200 items-center justify-between">
            <div className="flex items-center">
              <FiHeart className="text-pink-500 mr-2" />
              <div>
                <p className="text-xs sm:text-sm font-medium">
                  Mating Request:{" "}
                  {matingRequest.status === "accepted" ? "Accepted" : "Pending"}
                </p>
                <p className="text-xs text-gray-500">
                  Requested on{" "}
                  {new Date(matingRequest.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            {matingRequest.status === "accepted" && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <FiCheckCircle className="mr-1" />
                Accepted
              </span>
            )}
          </div>
        )}
        <div className="flex-1 overflow-y-auto bg-gray-50 p-2 sm:p-4">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-b-2 border-lavender-500 mb-2 sm:mb-3"></div>
              <p className="text-xs sm:text-sm text-gray-500">
                Loading messages...
              </p>
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center pb-4 sm:pb-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-pink-50 flex items-center justify-center text-pink-500 mb-3 sm:mb-4">
                <FiHeart className="w-8 h-8 sm:w-10 sm:h-10" />
              </div>
              <h4 className="text-sm sm:text-lg font-medium text-gray-900 mb-1 sm:mb-2 text-center">
                Start Your Conversation
              </h4>
              <p className="text-xs sm:text-sm text-gray-500 text-center max-w-xs sm:max-w-md mb-4 sm:mb-6">
                This is the beginning of your conversation about the mating
                request between {senderPet?.name} and {receiverPet?.name}.
              </p>
              <div className="bg-gray-50 p-3 sm:p-4 rounded-lg max-w-xs sm:max-w-sm border border-gray-200">
                <p className="text-xs sm:text-sm text-gray-500 italic text-center mb-2 sm:mb-3">
                  "Hello! I'm interested in arranging a meeting for our pets.
                  When would be a good time to discuss the details?"
                </p>
                <button
                  onClick={() => {
                    setNewMessage(
                      "Hello! I'm interested in arranging a meeting for our pets. When would be a good time to discuss the details?"
                    );
                  }}
                  className="block mx-auto px-2 py-0.5 sm:px-3 sm:py-1 border border-lavender-500 rounded-md text-xs sm:text-sm text-lavender-500 hover:bg-lavender-50 transition"
                >
                  Use Suggestion
                </button>
              </div>
            </div>
          ) : (
            <>
              {Object.keys(groupedMessages).map((date) => (
                <div key={date}>
                  <div className="flex items-center my-2 sm:my-4">
                    <div className="flex-grow border-t border-gray-200"></div>
                    <span className="mx-2 sm:mx-3 text-xs font-medium text-gray-500 px-2 py-0.5 border border-gray-200 rounded-full">
                      {new Date(date).toLocaleDateString([], {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <div className="flex-grow border-t border-gray-200"></div>
                  </div>

                  {groupedMessages[date].map((message, idx) => {
                    const isSender = message.senderId === user?.uid;
                    const showAvatar =
                      idx === 0 ||
                      groupedMessages[date][idx - 1].senderId !==
                        message.senderId;

                    return (
                      <div
                        key={message.id}
                        className={`flex mb-2 sm:mb-3 ${
                          isSender ? "justify-end" : "justify-start"
                        }`}
                      >
                        {!isSender && showAvatar && (
                          <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-purple-500 flex items-center justify-center text-white font-medium mr-1 sm:mr-2 mt-0.5 sm:mt-1 text-xs sm:text-sm">
                            {message.senderName?.charAt(0) || "?"}
                          </div>
                        )}

                        {!isSender && !showAvatar && (
                          <div className="w-7 sm:w-9 mr-1 sm:mr-2"></div>
                        )}

                        <div
                          className={`max-w-[75%] sm:max-w-[70%] ${
                            isSender ? "ml-1 sm:ml-2" : "mr-1 sm:mr-2"
                          }`}
                        >
                          {!isSender && showAvatar && (
                            <p className="text-xs text-gray-500 ml-1 mb-0.5 sm:mb-1 truncate">
                              {message.senderName}
                            </p>
                          )}

                          <div
                            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-2xl text-sm sm:text-base ${
                              isSender
                                ? "bg-lavender-500 text-white rounded-br-none"
                                : "bg-white text-gray-800 rounded-bl-none border border-gray-100 shadow-sm"
                            }`}
                          >
                            <p>{message.text}</p>
                          </div>

                          <p
                            className={`text-[0.65rem] sm:text-xs mt-0.5 sm:mt-1 ${
                              isSender
                                ? "text-gray-500 text-right"
                                : "text-gray-500 text-left"
                            }`}
                          >
                            {formatMessageTime(message.timestamp)}
                          </p>
                        </div>

                        {isSender && showAvatar && (
                          <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-lavender-500 flex items-center justify-center text-white font-medium ml-1 sm:ml-2 mt-0.5 sm:mt-1 text-xs sm:text-sm">
                            {user?.displayName?.charAt(0) || "Y"}
                          </div>
                        )}

                        {isSender && !showAvatar && (
                          <div className="w-7 sm:w-9 ml-1 sm:ml-2"></div>
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
        <div className="border-t border-gray-200 p-2 sm:p-3 bg-white relative">
          {showEmojiPicker && (
            <div
              ref={emojiPickerRef}
              className="absolute bottom-12 sm:bottom-14 left-0 right-0 sm:right-auto sm:left-0 z-10"
            >
              <EmojiPicker
                onEmojiClick={onEmojiClick}
                width="100%"
                height={300}
                previewConfig={{ showPreview: false }}
              />
            </div>
          )}
          <div className="flex items-center">
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-1 sm:p-2 rounded-full text-gray-500 hover:text-lavender-500 hover:bg-gray-100 mr-1"
            >
              <FiSmile className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <input
              type="text"
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              onKeyPress={(e) =>
                e.key === "Enter" && !e.shiftKey && handleSendMessage()
              }
              className="flex-1 border border-gray-200 rounded-full py-1.5 px-3 sm:py-2 sm:px-4 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-lavender-500 focus:border-lavender-500 text-sm sm:text-base"
            />

            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className={`ml-1 sm:ml-2 p-1.5 sm:p-2 rounded-full ${
                newMessage.trim()
                  ? "bg-lavender-500 text-white hover:bg-lavender-600"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              <FiSend className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageDialog;
