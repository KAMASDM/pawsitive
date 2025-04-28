import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { ref, get, push, update, remove, set } from "firebase/database";
import { db, auth, database } from "../../../firebase";
import Googlemap from "../../GoogleMap/GoogleMap";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiHeart,
  FiMessageSquare,
  FiClock,
  FiShare2,
  FiGlobe,
  FiPhone,
  FiMapPin,
  FiEdit2,
  FiTrash2,
  FiX,
  FiInfo,
} from "react-icons/fi";
import { FaStar, FaRegStar } from "react-icons/fa";

const ResourceCard = ({ resource, onResourceUpdated }) => {
  const [likes, setLikes] = useState(resource.likes || 0);
  const [liked, setLiked] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [showHours, setShowHours] = useState(false);
  const [editComment, setEditComment] = useState(null);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [directionsVisible, setDirectionsVisible] = useState(false);
  const [mapLoading, setMapLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [checkedOpenStatus, setCheckedOpenStatus] = useState(false);
  const [userAuthenticated, setUserAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) =>
      setUserAuthenticated(!!user)
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!resource.hours && !resource.time) {
      setCheckedOpenStatus(true);
      return;
    }
    const checkIfOpen = () => {
      const now = new Date();
      const currentDay = now.toLocaleDateString("en-US", { weekday: "long" });
      let hoursText = "";
      if (Array.isArray(resource.hours)) {
        const todayHours = resource.hours.find((hourStr) =>
          hourStr.toLowerCase().includes(currentDay.toLowerCase())
        );
        hoursText = todayHours || "";
      } else if (typeof resource.hours === "string") {
        hoursText = resource.hours;
      } else if (resource.time) {
        hoursText = resource.time;
      }
      if (!hoursText || hoursText.toLowerCase().includes("closed")) {
        setIsOpen(false);
        setCheckedOpenStatus(true);
        return;
      }
      const timeRegex =
        /(\d{1,2}:\d{2}\s*[APap][Mm])\s*-\s*(\d{1,2}:\d{2}\s*[APap][Mm])/;
      const match = hoursText.match(timeRegex);
      if (match) {
        const openingTime = match[1].trim();
        const closingTime = match[2].trim();
        const convertTimeToDate = (timeStr) => {
          const [time, period] = timeStr.split(/\s+/);
          const [hours, minutes] = time.split(":");
          const date = new Date();
          let hour = parseInt(hours, 10);
          if (period.toLowerCase() === "pm" && hour < 12) hour += 12;
          else if (period.toLowerCase() === "am" && hour === 12) hour = 0;
          date.setHours(hour, parseInt(minutes, 10), 0);
          return date;
        };
        const openTime = convertTimeToDate(openingTime);
        const closeTime = convertTimeToDate(closingTime);
        setIsOpen(now >= openTime && now <= closeTime);
      } else {
        setIsOpen(false);
      }
      setCheckedOpenStatus(true);
    };
    checkIfOpen();
  }, [resource.hours, resource.time]);

  const checkIfLiked = useCallback(async () => {
    if (!resource.id || !auth.currentUser) return;
    try {
      const userLikesRef = ref(
        database,
        `userLikes/${auth.currentUser.uid}/${resource.id}`
      );
      const snapshot = await get(userLikesRef);
      if (snapshot.exists()) {
        setLiked(true);
        return;
      }
      try {
        const likeDoc = await getDoc(
          doc(db, "resources", resource.id, "likes", auth.currentUser.uid)
        );
        setLiked(likeDoc.exists());
      } catch (firestoreErr) {
        console.warn("Firestore check failed:", firestoreErr);
      }
    } catch (error) {
      console.warn("Failed to check if resource is liked:", error);
    }
  }, [resource.id]);

  const fetchComments = useCallback(async () => {
    if (!resource.id) {
      console.warn("Resource ID is missing for comments:", resource);
      return;
    }
    try {
      const commentsRef = ref(database, `resources/${resource.id}/comments`);
      const snapshot = await get(commentsRef);
      if (snapshot.exists()) {
        const commentsData = snapshot.val();
        const commentsList = Object.keys(commentsData).map((key) => ({
          id: key,
          ...commentsData[key],
        }));
        setComments(commentsList);
        return;
      }
      try {
        const commentsSnapshot = await getDocs(
          collection(db, `resources/${resource.id}/comments`)
        );
        const commentsList = commentsSnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));
        setComments(commentsList);
      } catch (firestoreErr) {
        console.warn("Firestore comments fetch failed:", firestoreErr);
        setComments([]);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
      setComments([]);
    }
  }, [resource]);

  useEffect(() => {
    if (resource.id) {
      fetchComments();
      if (userAuthenticated) {
        checkIfLiked();
      }
    }
  }, [fetchComments, resource.id, checkIfLiked, userAuthenticated]);

  const handleLike = async () => {
    if (!userAuthenticated) {
      alert("Please sign in to like resources");
      return;
    }
    if (!resource.id) {
      console.warn("Cannot like resource without ID");
      return;
    }
    const newLikesCount = liked ? (likes > 0 ? likes - 1 : 0) : likes + 1;
    const userUid = auth.currentUser.uid;

    try {
      const resourceLikesRef = ref(database, `resources/${resource.id}/likes`);
      await set(resourceLikesRef, newLikesCount);

      const userLikesRef = ref(database, `userLikes/${userUid}/${resource.id}`);
      if (liked) {
        await remove(userLikesRef);
      } else {
        await set(userLikesRef, true);
      }

      setLikes(newLikesCount);
      setLiked(!liked);
      if (onResourceUpdated) onResourceUpdated(resource.id, newLikesCount);
      return;
    } catch (rtdbError) {
      console.warn("RTDB like update failed, trying Firestore:", rtdbError);
      try {
        const resourceDocRef = doc(db, "resources", resource.id);
        await updateDoc(resourceDocRef, { likes: newLikesCount });

        const userLikeRef = doc(db, "resources", resource.id, "likes", userUid);
        if (liked) {
          await deleteDoc(userLikeRef);
        } else {
          await setDoc(userLikeRef, { userId: userUid, timestamp: new Date() });
        }
        setLikes(newLikesCount);
        setLiked(!liked);
        if (onResourceUpdated) onResourceUpdated(resource.id, newLikesCount);
      } catch (firestoreError) {
        console.error("Firestore like update failed:", firestoreError);
        alert("Failed to update like. Please try again.");
      }
    }
  };

  const handleShare = () => {
    const detailUrl = `${window.location.origin}/resource-details/${
      resource.id || resource.place_id
    }`;
    const shareData = {
      title: resource.name,
      text: `Check out this pet resource: ${resource.name} at ${
        resource.address || resource.vicinity
      }.`,
      url: detailUrl,
    };
    if (navigator.share) {
      navigator
        .share(shareData)
        .then(() => console.log("Shared successfully"))
        .catch((error) => console.error("Sharing error:", error));
    } else {
      navigator.clipboard
        .writeText(`${shareData.text}\n${shareData.url}`)
        .then(() => alert(`Resource info copied!`))
        .catch((err) => console.error("Copy failed:", err));
    }
  };

  const handleCommentSubmit = async () => {
    if (!userAuthenticated) {
      alert("Please sign in to comment");
      return;
    }

    if (newComment.trim() === "" || !resource.id) return;

    try {
      const commentData = {
        text: newComment,
        user: auth.currentUser?.displayName || "Anonymous",
        userId: auth.currentUser.uid,
        createdAt: new Date().toISOString(),
      };

      try {
        if (editComment) {
          const commentRef = ref(
            database,
            `resources/${resource.id}/comments/${editComment.id}`
          );
          await update(commentRef, { text: newComment });

          const userCommentRef = ref(
            database,
            `userComments/${auth.currentUser.uid}/${resource.id}/${editComment.id}`
          );
          await update(userCommentRef, { text: newComment });
        } else {
          const commentsRef = ref(
            database,
            `resources/${resource.id}/comments`
          );
          const newCommentRef = push(commentsRef);
          await update(newCommentRef, commentData);

          const commentId = newCommentRef.key;
          const userCommentRef = ref(
            database,
            `userComments/${auth.currentUser.uid}/${resource.id}/${commentId}`
          );
          await update(userCommentRef, {
            ...commentData,
            resourceName: resource.name,
          });
        }

        setNewComment("");
        setEditComment(null);
        fetchComments();
        setCommentDialogOpen(false);
        return;
      } catch (rtdbError) {
        console.warn(
          "Realtime DB comment update failed, trying Firestore:",
          rtdbError
        );
      }

      if (editComment) {
        await updateDoc(
          doc(db, `resources/${resource.id}/comments`, editComment.id),
          { text: newComment }
        );
      } else {
        const docRef = await addDoc(
          collection(db, `resources/${resource.id}/comments`),
          commentData
        );

        await addDoc(collection(db, `users/${auth.currentUser.uid}/comments`), {
          ...commentData,
          resourceId: resource.id,
          resourceName: resource.name,
          commentId: docRef.id,
        });
      }

      setNewComment("");
      setEditComment(null);
      fetchComments();
      setCommentDialogOpen(false);
    } catch (error) {
      console.error("Error submitting comment:", error);
      alert("Failed to submit comment. Please try again.");
    }
  };

  const handleEditComment = (comment) => {
    setEditComment(comment);
    setNewComment(comment.text);
    setCommentDialogOpen(true);
  };

  const handleDeleteComment = async (commentId) => {
    if (!userAuthenticated) {
    }
    if (!resource.id || !commentId) return;
    if (!window.confirm("Delete comment?")) return;
    try {
    } catch (rtdbError) {}
  };

  const handleViewDetails = (resource) => {
    const detailId = resource.id || resource.place_id;
    if (detailId) {
      navigate(`/resource-details/${detailId}`, {
        state: { resourceData: resource },
      });
    } else {
      console.log("No detail ID found");
    }
  };

  const handleMapLoaded = () => setMapLoading(false);
  const canEditComment = (comment) => {
    return (
      userAuthenticated &&
      auth.currentUser &&
      comment.userId === auth.currentUser.uid
    );
  };

  const isDogResource = resource.category?.startsWith("dog_");
  const isCatResource = resource.category?.startsWith("cat_");
  const themeColor = isDogResource
    ? "lavender"
    : isCatResource
    ? "lavender"
    : "lavender";
  const bgTheme = {
    lavender: "bg-lavender-600 hover:bg-lavender-700",
    blue: "bg-blue-600 hover:bg-blue-700",
    amber: "bg-amber-600 hover:bg-amber-700",
  };
  const textTheme = {
    lavender: "text-lavender-600 hover:text-lavender-800",
    blue: "text-blue-600 hover:text-blue-800",
    amber: "text-amber-600 hover:text-amber-800",
  };
  const ringTheme = {
    lavender: "focus:ring-lavender-500",
    blue: "focus:ring-blue-500",
    amber: "focus:ring-amber-500",
  };
  const bgLight = {
    lavender: "bg-lavender-50",
    blue: "bg-blue-50",
    amber: "bg-amber-50",
  };
  const textDark = {
    lavender: "text-lavender-900",
    blue: "text-blue-900",
    amber: "text-amber-900",
  };
  const textMedium = {
    lavender: "text-lavender-800",
    blue: "text-blue-800",
    amber: "text-amber-800",
  };
  const borderTheme = {
    lavender: "border-lavender-200",
    blue: "border-blue-200",
    amber: "border-amber-200",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200 h-full flex flex-col transition-shadow hover:shadow-xl"
    >
      <div className="relative group">
        <div className="h-52 w-full overflow-hidden bg-gray-200">
          <img
            src={
              resource.photoUrl ||
              "https://via.placeholder.com/400x300.png?text=No+Image"
            }
            alt={resource.name}
            className="w-full h-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-105"
            onError={(e) => {
              e.target.src =
                "https://via.placeholder.com/400x300.png?text=Error";
            }}
          />
        </div>
        <div className="absolute top-0 left-0 w-full p-3 flex justify-between items-start">
          <div
            className={`bg-${themeColor}-600 text-white px-3 py-1 text-xs font-semibold rounded-full shadow`}
          >
            {resource.type ||
              resource.category
                ?.replace(/^(dog_|cat_)/, "")
                .replace(/_/g, " ")
                .split(" ")
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ") ||
              "Resource"}
          </div>
          {checkedOpenStatus && (
            <div
              className={`px-3 py-1 text-xs font-semibold rounded-full shadow flex items-center ${
                isOpen
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full mr-1.5 ${
                  isOpen ? "bg-green-500" : "bg-red-500"
                } animate-pulse`}
              ></div>
              {isOpen ? "Open" : "Closed"}
            </div>
          )}
        </div>
        <div className="absolute top-14 right-3">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleLike}
            className={`bg-white w-9 h-9 rounded-full flex items-center justify-center shadow-md transition-colors ${
              liked ? "text-red-500" : "text-gray-500 hover:text-red-400"
            }`}
            disabled={!userAuthenticated}
            title={
              userAuthenticated
                ? liked
                  ? "Unlike"
                  : "Like"
                : "Sign in to like"
            }
          >
            <FiHeart className={`${liked ? "fill-current" : ""} w-5 h-5`} />
          </motion.button>
        </div>
      </div>

      <div className="p-5 flex-grow flex flex-col">
        <h2
          className={`text-xl font-bold ${textDark[themeColor]} mb-1 line-clamp-1`}
        >
          {resource.name}
        </h2>
        <p className="text-sm text-gray-500 mb-3 flex items-start">
          <FiMapPin className="w-4 h-4 mr-1.5 mt-0.5 flex-shrink-0 text-gray-400" />
          <span className="line-clamp-1">
            {resource.address || resource.vicinity || "Address not available"}
          </span>
        </p>

        {resource.rating > 0 && (
          <div className="flex items-center mb-4">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) =>
                i < Math.round(resource.rating) ? (
                  <FaStar key={i} className="text-yellow-400 w-4 h-4" />
                ) : (
                  <FaRegStar key={i} className="text-gray-300 w-4 h-4" />
                )
              )}
            </div>
            <span className="ml-2 text-xs text-gray-500">
              {resource.rating.toFixed(1)} ({resource.userRatingsTotal || 0}{" "}
              reviews)
            </span>
          </div>
        )}

        <div className="flex items-center space-x-4 text-gray-500 mb-4 text-sm">
          {resource.phone && resource.phone !== "N/A" && (
            <a
              href={`tel:${resource.phone}`}
              title={`Call ${resource.phone}`}
              className={`flex items-center hover:${textTheme[themeColor]}`}
            >
              <FiPhone className="w-4 h-4 mr-1" /> Phone
            </a>
          )}
          {resource.website && resource.website !== "N/A" && (
            <a
              href={
                resource.website.startsWith("http")
                  ? resource.website
                  : `http://${resource.website}`
              }
              target="_blank"
              rel="noopener noreferrer"
              title="Visit website"
              className={`flex items-center hover:${textTheme[themeColor]}`}
            >
              <FiGlobe className="w-4 h-4 mr-1" /> Website
            </a>
          )}
        </div>

        <div className="mt-auto pt-4 border-t border-gray-100">
          <div className="flex justify-between items-center">
            <div className="flex space-x-1">
              <button
                onClick={() => setCommentDialogOpen(true)}
                className={`flex items-center text-xs ${textTheme[themeColor]} p-1.5 rounded-md hover:bg-gray-100`}
                title={
                  userAuthenticated ? "View/Add Comments" : "Sign in to comment"
                }
              >
                <FiMessageSquare className="w-4 h-4" />
                {comments.length > 0 && (
                  <span className="ml-1">{comments.length}</span>
                )}
              </button>
              <button
                onClick={() => setShowHours(true)}
                className={`flex items-center text-xs ${textTheme[themeColor]} p-1.5 rounded-md hover:bg-gray-100`}
                title="Operating Hours"
              >
                <FiClock className="w-4 h-4" />
              </button>
              <button
                onClick={handleShare}
                className={`flex items-center text-xs ${textTheme[themeColor]} p-1.5 rounded-md hover:bg-gray-100`}
                title="Share"
              >
                <FiShare2 className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={() => handleViewDetails(resource)}
              className={`px-4 py-2 rounded-lg text-sm font-medium text-white ${bgTheme[themeColor]} hover:shadow-md transition-all flex items-center`}
            >
              <FiInfo className="w-4 h-4 mr-1.5" /> Details
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {commentDialogOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={(e) => {
              if (e.target === e.currentTarget) setCommentDialogOpen(false);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl max-w-lg w-full shadow-xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className={`p-4 ${bgLight[themeColor]} border-b ${borderTheme[themeColor]}`}
              >
                <div className="flex justify-between items-center">
                  <h2
                    className={`text-lg font-semibold ${textDark[themeColor]}`}
                  >
                    Comments
                  </h2>
                  <button
                    onClick={() => setCommentDialogOpen(false)}
                    className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
                  >
                    <FiX />
                  </button>
                </div>
              </div>
              <div className="p-4 max-h-[60vh] overflow-y-auto">
                {comments.length > 0 ? (
                  <div className="space-y-3 mb-4">
                    {comments.map((comment) => (
                      <div
                        key={comment.id}
                        className={`p-3 rounded-lg ${bgLight[themeColor]}`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <p
                            className={`font-medium text-sm ${textDark[themeColor]}`}
                          >
                            {comment.user}
                          </p>
                          {canEditComment(comment) && (
                            <div className="flex space-x-1 flex-shrink-0">
                              <button
                                onClick={() => handleEditComment(comment)}
                                className={`text-${themeColor}-600 hover:text-${themeColor}-800 p-1 rounded hover:bg-${themeColor}-100`}
                                title="Edit"
                              >
                                <FiEdit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                                title="Delete"
                              >
                                <FiTrash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                        <p className={`text-sm ${textMedium[themeColor]}`}>
                          {comment.text}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-sm text-gray-500 italic my-4">
                    No comments yet.
                  </p>
                )}
                {!userAuthenticated ? (
                  <div className="text-center text-sm text-gray-500 p-4 bg-gray-50 rounded-lg">
                    Please sign in to comment.
                  </div>
                ) : (
                  <textarea
                    className={`w-full p-3 border ${borderTheme[themeColor]} rounded-lg focus:outline-none focus:ring-2 ${ringTheme[themeColor]} resize-none`}
                    rows="3"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                  />
                )}
              </div>
              <div className="bg-gray-50 px-4 py-3 flex justify-end gap-2">
                <button
                  onClick={() => setCommentDialogOpen(false)}
                  className="px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCommentSubmit}
                  disabled={!userAuthenticated || !newComment.trim()}
                  className={`px-4 py-2 text-sm text-white rounded-lg ${
                    !userAuthenticated || !newComment.trim()
                      ? "bg-gray-300 cursor-not-allowed"
                      : `${bgTheme[themeColor]}`
                  }`}
                >
                  {editComment ? "Update" : "Submit"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showHours && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowHours(false);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl max-w-md w-full shadow-xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className={`p-4 ${bgLight[themeColor]} border-b ${borderTheme[themeColor]}`}
              >
                <div className="flex justify-between items-center">
                  <h2
                    className={`text-lg font-semibold ${textDark[themeColor]} flex items-center`}
                  >
                    <FiClock className="mr-2" />
                    Operating Hours
                  </h2>
                  <button
                    onClick={() => setShowHours(false)}
                    className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
                  >
                    <FiX />
                  </button>
                </div>
              </div>
              <div
                className={`p-4 text-sm ${textMedium[themeColor]} max-h-[50vh] overflow-y-auto`}
              >
                {resource.hours ? (
                  Array.isArray(resource.hours) ? (
                    resource.hours.map((t, i) => (
                      <p key={i} className="mb-1">
                        {t}
                      </p>
                    ))
                  ) : (
                    <p>{resource.hours}</p>
                  )
                ) : resource.time ? (
                  resource.time.split(", ").map((t, i) => (
                    <p key={i} className="mb-1">
                      {t}
                    </p>
                  ))
                ) : (
                  <p className="italic text-gray-500">Hours not available.</p>
                )}
              </div>
              <div className="bg-gray-50 px-4 py-3 flex justify-end">
                <button
                  onClick={() => setShowHours(false)}
                  className={`px-4 py-2 text-sm text-white rounded-lg ${bgTheme[themeColor]}`}
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {directionsVisible && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="relative border-t border-gray-200"
          >
            {mapLoading && (
              <div className="absolute inset-0 bg-white/75 flex items-center justify-center z-10">
                {" "}
                <div
                  className={`animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-${themeColor}-600`}
                ></div>{" "}
              </div>
            )}
            <div className="h-64">
              {resource.lat && resource.lng ? (
                <Googlemap
                  center={{ lat: resource.lat, lng: resource.lng }}
                  destination={{ lat: resource.lat, lng: resource.lng }}
                  directions={true}
                  onMapLoaded={handleMapLoaded}
                />
              ) : (
                <div className="h-full flex items-center justify-center bg-gray-100 text-gray-500 text-sm">
                  <FiMapPin className="mr-1.5" />
                  Location not available
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ResourceCard;
