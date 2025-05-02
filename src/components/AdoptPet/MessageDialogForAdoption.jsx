import React, { useState, useEffect, useRef } from "react";
import { ref, get, onValue, off, push, set, update } from "firebase/database";
import { database, auth } from "../../firebase";
import { Info } from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import { Send, X, Smile, PawPrint } from "lucide-react";

const MessageDialogForAdoption = ({
  open,
  onClose,
  conversationId,
  recipientId,
  senderPet,
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
      const convoRef = ref(database, `conversations/${conversationId}`);
      const convoSnapshot = await get(convoRef);

      if (!convoSnapshot.exists()) {
        await set(convoRef, {
          participants: {
            [user.uid]: true,
            [recipientId]: true,
          },
          createdAt: Date.now(),
          isAdoption: true,
        });
      }

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

      await update(convoRef, {
        lastMessageText: newMessage,
        lastMessageTimestamp: Date.now(),
        lastMessageSender: user.uid,
      });

      setNewMessage("");
      scrollToBottom();
      setShowEmojiPicker(false);
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
    if (!type) return "bg-gradient-to-br from-gray-50 to-gray-100";

    switch (type.toLowerCase()) {
      case "dog":
        return "bg-gradient-to-br from-blue-50 to-blue-100";
      case "cat":
        return "bg-gradient-to-br from-yellow-50 to-yellow-100";
      default:
        return "bg-gradient-to-br from-gray-50 to-gray-100";
    }
  };

  const onEmojiClick = (emojiData) => {
    setNewMessage((prev) => prev + emojiData.emoji);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center ${
        open ? "" : "hidden"
      }`}
    >
      <div
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      ></div>
      <div className="relative w-full max-w-4xl h-[80vh] bg-white rounded-lg shadow-xl flex flex-col overflow-hidden">
        <div
          className={`flex justify-between items-center p-4 border-b border-gray-200 ${getPetGradient(
            senderPet?.type
          )}`}
        >
          <div className="flex items-center">
            <div
              className={`w-12 h-12 rounded-full border-2 border-white shadow-md flex items-center justify-center ${
                senderPet?.image ? "" : getPetGradient(senderPet?.type)
              } mr-3`}
            >
              {senderPet?.image ? (
                <img
                  src={senderPet.image}
                  alt={senderPet.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <PawPrint className="text-gray-500" size={24} />
              )}
            </div>
            <div>
              <h3 className="font-bold text-lg">Adoption Inquiry</h3>
              <p className="text-sm text-gray-600">About {senderPet?.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>
        {matingRequest && (
          <div className="p-4 bg-lavender-50 border-b border-gray-100">
            <div className="flex items-center">
              <Info className="text-lavender-500 mr-2" size={18} />
              <p className="text-sm font-medium">
                You're inquiring about adopting {senderPet?.name}
              </p>
            </div>
          </div>
        )}
        <div className="flex-1 p-6 overflow-y-auto bg-gray-50">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center">
              <div className="w-12 h-12 border-4 border-lavender-200 border-t-lavender-600 rounded-full animate-spin"></div>
              <p className="text-gray-500">Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center pb-8">
              <h4 className="text-lg font-semibold mb-2 text-center">
                Start Your Adoption Inquiry
              </h4>
              <p className="text-gray-500 text-center max-w-md mb-6">
                This is the beginning of your conversation about adopting{" "}
                {senderPet?.name}.
              </p>
              <div className="mt-4 p-4 rounded-lg bg-gray-50">
                <p className="text-gray-500 text-center">
                  "Hello! I'm interested in adopting {senderPet?.name}. Could
                  you tell me more about them?"
                </p>
                <button
                  className="mt-3 mx-auto block px-4 py-1.5 border border-lavender-500 text-lavender-500 rounded-full text-sm hover:bg-blue-50 transition"
                  onClick={() => {
                    setNewMessage(
                      `Hello! I'm interested in adopting ${senderPet?.name}. Could you tell me more about them?`
                    );
                  }}
                >
                  Use Suggestion
                </button>
              </div>
            </div>
          ) : (
            <>
              {Object.keys(groupedMessages).map((date) => (
                <div key={date}>
                  <div className="flex items-center my-4">
                    <div className="flex-1 border-t border-gray-200"></div>
                    <span className="mx-3 text-xs text-gray-500 px-2 py-1 border border-gray-200 rounded-full">
                      {new Date(date).toLocaleDateString([], {
                        weekday: "long",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <div className="flex-1 border-t border-gray-200"></div>
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
                        className={`flex mb-3 ${
                          isSender ? "justify-end" : "justify-start"
                        }`}
                      >
                        {!isSender && showAvatar && (
                          <div className="mr-2 mt-1 w-9 h-9 rounded-full bg-purple-500 flex items-center justify-center text-white">
                            {message.senderName?.charAt(0) || "?"}
                          </div>
                        )}
                        {!isSender && !showAvatar && (
                          <div className="w-9 mr-2"></div>
                        )}
                        <div className={`max-w-[70%] relative`}>
                          {!isSender && showAvatar && (
                            <p className="text-xs text-gray-500 ml-2 mb-1">
                              {message.senderName}
                            </p>
                          )}
                          <div
                            className={`p-3 rounded-xl ${
                              isSender
                                ? "bg-lavender-600 text-white rounded-br-none"
                                : "bg-white border border-gray-100 rounded-bl-none"
                            } shadow-sm`}
                          >
                            <p>{message.text}</p>
                          </div>
                          <p
                            className={`text-xs mt-1 ${
                              isSender
                                ? "text-gray-500 text-right"
                                : "text-gray-500 text-left"
                            }`}
                          >
                            {formatMessageTime(message.timestamp)}
                          </p>
                        </div>
                        {isSender && showAvatar && (
                          <div className="ml-2 mt-1 w-9 h-9 rounded-full bg-lavender-500 flex items-center justify-center text-white">
                            {user?.displayName?.charAt(0) || "Y"}
                          </div>
                        )}
                        {isSender && !showAvatar && (
                          <div className="w-9 ml-2"></div>
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
        <div className="p-4 border-t border-gray-200 bg-white relative">
          <div className="flex items-center w-full">
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2 text-gray-500 hover:text-lavender-500 rounded-full hover:bg-gray-100 mr-1"
            >
              <Smile size={20} />
            </button>
            {showEmojiPicker && (
              <div
                ref={emojiPickerRef}
                className="absolute bottom-16 left-4 z-10"
              >
                <EmojiPicker
                  onEmojiClick={onEmojiClick}
                  width={300}
                  height={350}
                />
              </div>
            )}
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
              className="flex-1 py-2 px-4 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-lavender-500 focus:bg-white"
            />
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className={`ml-2 p-2 rounded-full ${
                newMessage.trim()
                  ? "bg-lavender-500 text-white hover:bg-lavender-600"
                  : "bg-gray-200 text-gray-400"
              }`}
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageDialogForAdoption;
