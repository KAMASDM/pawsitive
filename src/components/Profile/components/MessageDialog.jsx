// components/Profile/components/MessageDialog.jsx
import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Avatar,
  Paper,
  IconButton,
  InputAdornment,
  Divider,
  CircularProgress,
  Chip,
  Tooltip,
  AvatarGroup,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import CloseIcon from "@mui/icons-material/Close";
import FavoriteIcon from "@mui/icons-material/Favorite";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import ImageIcon from "@mui/icons-material/Image";

import EmojiEmotionsIcon from "@mui/icons-material/EmojiEmotions";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PetsIcon from "@mui/icons-material/Pets";
import { ref, get, onValue, off, push, set, update } from "firebase/database";
import { database, auth } from "../../../firebase";

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
  const user = auth.currentUser;
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

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

  const getPetGradient = (type) => {
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

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          minHeight: "80vh",
          display: "flex",
          flexDirection: "column",
          borderRadius: 2,
          overflow: "hidden",
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
          p: 2,
          background: "linear-gradient(145deg, #f9f5ff 0%, #ffe6e6 100%)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <AvatarGroup sx={{ mr: 2 }}>
            <Avatar
              src={senderPet?.image}
              alt={senderPet?.name}
              sx={{
                width: 48,
                height: 48,
                border: "3px solid #fff",
                boxShadow: 2,
                background: getPetGradient(senderPet?.type),
              }}
            >
              {!senderPet?.image && <PetsIcon />}
            </Avatar>
            <Avatar
              src={receiverPet?.image}
              alt={receiverPet?.name}
              sx={{
                width: 48,
                height: 48,
                border: "3px solid #fff",
                boxShadow: 2,
                background: getPetGradient(receiverPet?.type),
              }}
            >
              {!receiverPet?.image && <PetsIcon />}
            </Avatar>
          </AvatarGroup>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 0.5 }}>
              {user.displayName}
            </Typography>
          </Box>
        </Box>
        <IconButton
          onClick={onClose}
          edge="end"
          sx={{
            bgcolor: "rgba(0,0,0,0.05)",
            "&:hover": { bgcolor: "rgba(0,0,0,0.1)" },
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {matingRequest && (
        <Box
          sx={{
            p: 2,
            backgroundColor: "rgba(251, 226, 244, 0.3)",
            borderBottom: "1px solid rgba(0,0,0,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <FavoriteIcon color="secondary" sx={{ mr: 1.5 }} />
            <Box>
              <Typography variant="subtitle2">
                Mating Request:{" "}
                {matingRequest.status === "accepted" ? "Accepted" : "Pending"}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Requested on{" "}
                {new Date(matingRequest.createdAt).toLocaleDateString()}
              </Typography>
            </Box>
          </Box>
          {matingRequest.status === "accepted" && (
            <Chip
              icon={<CheckCircleIcon />}
              label="Accepted"
              color="success"
              size="small"
            />
          )}
        </Box>
      )}

      <DialogContent
        sx={{
          flex: 1,
          p: 3,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#f9fafb",
        }}
      >
        {loading ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
            }}
          >
            <CircularProgress size={40} sx={{ mb: 2 }} />
            <Typography variant="body2" color="textSecondary">
              Loading messages...
            </Typography>
          </Box>
        ) : messages.length === 0 ? (
          <Box
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              pb: 4,
            }}
          >
            <Avatar
              sx={{
                width: 80,
                height: 80,
                backgroundColor: "rgba(233, 30, 99, 0.1)",
                color: "#e91e63",
                mb: 2,
              }}
            >
              <FavoriteIcon sx={{ fontSize: 40 }} />
            </Avatar>
            <Typography variant="h6" align="center" gutterBottom>
              Start Your Conversation
            </Typography>
            <Typography
              variant="body2"
              color="textSecondary"
              align="center"
              sx={{ maxWidth: 400 }}
            >
              This is the beginning of your conversation about the mating
              request between {senderPet?.name} and {receiverPet?.name}.
            </Typography>
            <Box
              sx={{
                mt: 4,
                p: 2,
                borderRadius: 2,
                backgroundColor: "rgba(0,0,0,0.03)",
                maxWidth: 450,
              }}
            >
              <Typography
                variant="body2"
                color="textSecondary"
                sx={{ fontStyle: "italic", textAlign: "center" }}
              >
                "Hello! I'm interested in arranging a meeting for our pets. When
                would be a good time to discuss the details?"
              </Typography>
              <Button
                variant="outlined"
                color="primary"
                size="small"
                sx={{ mt: 2, display: "block", mx: "auto" }}
                onClick={() => {
                  setNewMessage(
                    "Hello! I'm interested in arranging a meeting for our pets. When would be a good time to discuss the details?"
                  );
                }}
              >
                Use Suggestion
              </Button>
            </Box>
          </Box>
        ) : (
          <>
            {Object.keys(groupedMessages).map((date) => (
              <Box key={date}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    my: 2,
                  }}
                >
                  <Divider sx={{ flex: 1 }} />
                  <Chip
                    label={new Date(date).toLocaleDateString([], {
                      weekday: "long",
                      month: "short",
                      day: "numeric",
                    })}
                    variant="outlined"
                    size="small"
                    sx={{ mx: 2 }}
                  />
                  <Divider sx={{ flex: 1 }} />
                </Box>

                {groupedMessages[date].map((message, idx) => {
                  const isSender = message.senderId === user?.uid;
                  const showAvatar =
                    idx === 0 ||
                    groupedMessages[date][idx - 1].senderId !==
                    message.senderId;

                  return (
                    <Box
                      key={message.id}
                      sx={{
                        display: "flex",
                        justifyContent: isSender ? "flex-end" : "flex-start",
                        mb: 1.5,
                      }}
                    >
                      {!isSender && showAvatar && (
                        <Avatar
                          sx={{
                            mr: 1,
                            mt: 0.5,
                            width: 36,
                            height: 36,
                            bgcolor: "#9c27b0",
                          }}
                        >
                          {message.senderName?.charAt(0) || "?"}
                        </Avatar>
                      )}

                      {!isSender && !showAvatar && (
                        <Box sx={{ width: 36, mr: 1 }} />
                      )}

                      <Box
                        sx={{
                          maxWidth: "70%",
                          position: "relative",
                        }}
                      >
                        {!isSender && showAvatar && (
                          <Typography
                            variant="caption"
                            color="textSecondary"
                            sx={{ ml: 1, mb: 0.5, display: "block" }}
                          >
                            {message.senderName}
                          </Typography>
                        )}

                        <Paper
                          elevation={0}
                          sx={{
                            p: 1.5,
                            backgroundColor: isSender ? "#1976d2" : "#ffffff",
                            color: isSender ? "#ffffff" : "inherit",
                            borderRadius: isSender
                              ? "18px 18px 4px 18px"
                              : "18px 18px 18px 4px",
                            boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                            border: isSender
                              ? "none"
                              : "1px solid rgba(0,0,0,0.05)",
                          }}
                        >
                          <Typography variant="body1">
                            {message.text}
                          </Typography>
                        </Paper>

                        <Typography
                          variant="caption"
                          color={
                            isSender ? "rgba(255,255,255,0.7)" : "textSecondary"
                          }
                          sx={{
                            display: "block",
                            mt: 0.5,
                            mb: 0.5,
                            textAlign: isSender ? "right" : "left",
                            fontSize: "0.7rem",
                          }}
                        >
                          {formatMessageTime(message.timestamp)}
                        </Typography>
                      </Box>

                      {isSender && showAvatar && (
                        <Avatar
                          sx={{
                            ml: 1,
                            mt: 0.5,
                            width: 36,
                            height: 36,
                            bgcolor: "#2196f3",
                          }}
                        >
                          {user?.displayName?.charAt(0) || "Y"}
                        </Avatar>
                      )}

                      {isSender && !showAvatar && (
                        <Box sx={{ width: 36, ml: 1 }} />
                      )}
                    </Box>
                  );
                })}
              </Box>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          p: 2,
          borderTop: "1px solid rgba(0, 0, 0, 0.08)",
          display: "flex",
          backgroundColor: "#ffffff",
        }}
      >
        <Box sx={{ display: "flex", width: "100%", alignItems: "center" }}>
          <Box sx={{ display: "flex", mr: 1 }}>
            <Tooltip title="Add attachment">
              <IconButton
                color="default"
                size="small"
                sx={{
                  mr: 0.5,
                  color: "text.secondary",
                  "&:hover": {
                    color: "primary.main",
                    backgroundColor: "rgba(0,0,0,0.04)",
                  },
                }}
              >
                <AttachFileIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Add image">
              <IconButton
                color="default"
                size="small"
                sx={{
                  mr: 0.5,
                  color: "text.secondary",
                  "&:hover": {
                    color: "primary.main",
                    backgroundColor: "rgba(0,0,0,0.04)",
                  },
                }}
              >
                <ImageIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Add emoji">
              <IconButton
                color="default"
                size="small"
                sx={{
                  color: "text.secondary",
                  "&:hover": {
                    color: "primary.main",
                    backgroundColor: "rgba(0,0,0,0.04)",
                  },
                }}
              >
                <EmojiEmotionsIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          <TextField
            fullWidth
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            onKeyPress={(e) =>
              e.key === "Enter" && !e.shiftKey && handleSendMessage()
            }
            variant="outlined"
            size="small"
            InputProps={{
              sx: {
                borderRadius: 4,
                backgroundColor: "#f5f5f5",
                "&:hover": { backgroundColor: "#f0f0f0" },
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "transparent",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "transparent",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "primary.main",
                  borderWidth: 1,
                },
              },
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip title="Send message">
                    <span>
                      <IconButton
                        color="primary"
                        edge="end"
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim()}
                        sx={{
                          bgcolor: newMessage.trim()
                            ? "primary.main"
                            : "rgba(0,0,0,0.08)",
                          color: newMessage.trim() ? "white" : "text.disabled",
                          "&:hover": {
                            bgcolor: newMessage.trim()
                              ? "primary.dark"
                              : "rgba(0,0,0,0.08)",
                          },
                          transition: "all 0.2s ease",
                          width: 32,
                          height: 32,
                        }}
                      >
                        <SendIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </InputAdornment>
              ),
            }}
          />
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default MessageDialog;
