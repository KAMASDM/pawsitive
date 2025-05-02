import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  getDoc,
  setDoc,
  query,
  where,
  writeBatch,
} from "firebase/firestore";
import { ref, get, push, update } from "firebase/database";
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
  const directionsVisible = false;
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
    const userUid = auth.currentUser.uid;
    try {
      const userLikesRef = ref(database, `userLikes/${userUid}/${resource.id}`);
      const snapshot = await get(userLikesRef);
      if (snapshot.exists()) {
        setLiked(true);
      } else {
        setLiked(false);
        try {
          const likeDoc = await getDoc(
            doc(db, "resources", resource.id, "likes", userUid)
          );
          setLiked(likeDoc.exists());
        } catch (firestoreErr) {}
      }
    } catch (error) {
      try {
        const likeDoc = await getDoc(
          doc(db, "resources", resource.id, "likes", userUid)
        );
        setLiked(likeDoc.exists());
      } catch (firestoreErr) {
        console.log("Failed to check if resource is liked in both DBs");
      }
    }
  }, [resource.id]);

  const fetchComments = useCallback(async () => {
    if (!resource.id) {
      setComments([]);
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
        setComments(
          commentsList.sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          )
        );
      } else {
        try {
          const commentsSnapshot = await getDocs(
            collection(db, `resources/${resource.id}/comments`)
          );
          const commentsList = commentsSnapshot.docs.map((doc) => ({
            ...doc.data(),
            id: doc.id,
          }));
          setComments(
            commentsList.sort(
              (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
            )
          );
        } catch (firestoreErr) {
          console.log("Firestore comments fetch failed");
          setComments([]);
        }
      }
    } catch (error) {
      console.error(
        "Error fetching comments from RTDB, trying Firestore:",
        error
      );
      try {
        const commentsSnapshot = await getDocs(
          collection(db, `resources/${resource.id}/comments`)
        );
        const commentsList = commentsSnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));
        setComments(
          commentsList.sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          )
        );
      } catch (firestoreErr) {
        console.error(
          "Error fetching comments from Firestore as well:",
          firestoreErr
        );
        setComments([]);
      }
    }
  }, [resource.id]);

  useEffect(() => {
    if (resource.id) {
      fetchComments();
      if (userAuthenticated) {
        checkIfLiked();
      } else {
        setLiked(false);
      }
    }
  }, [fetchComments, resource.id, checkIfLiked, userAuthenticated]);

  const handleLike = async () => {
    if (!userAuthenticated) {
      alert("Please sign in to like resources");
      return;
    }
    if (!resource.id || !auth.currentUser) {
      console.warn("Cannot like resource without ID or user");
      return;
    }
    const userUid = auth.currentUser.uid;
    const newLikedState = !liked;
    const currentLikes = likes;
    const newLikesCount = newLikedState
      ? currentLikes + 1
      : currentLikes > 0
      ? currentLikes - 1
      : 0;

    setLiked(newLikedState);
    setLikes(newLikesCount);
    if (onResourceUpdated) onResourceUpdated(resource.id, newLikesCount);

    try {
      const updates = {};
      updates[`resources/${resource.id}/likes`] = newLikesCount;
      if (newLikedState) {
        updates[`userLikes/${userUid}/${resource.id}`] = true;
      } else {
        updates[`userLikes/${userUid}/${resource.id}`] = null;
      }
      await update(ref(database), updates);

      try {
        const resourceDocRef = doc(db, "resources", resource.id);
        const userLikeRef = doc(db, "resources", resource.id, "likes", userUid);
        const batch = writeBatch(db);
        batch.update(resourceDocRef, { likes: newLikesCount });
        if (newLikedState) {
          batch.set(userLikeRef, { userId: userUid, timestamp: new Date() });
        } else {
          batch.delete(userLikeRef);
        }
        await batch.commit();
      } catch (firestoreError) {
        console.warn(
          "Firestore like sync failed (RTDB succeeded):",
          firestoreError
        );
      }
    } catch (rtdbError) {
      console.warn(
        "RTDB like update failed, attempting Firestore directly:",
        rtdbError
      );
      setLiked(!newLikedState);
      setLikes(currentLikes);
      if (onResourceUpdated) onResourceUpdated(resource.id, currentLikes);

      try {
        const resourceDocRef = doc(db, "resources", resource.id);
        const userLikeRef = doc(db, "resources", resource.id, "likes", userUid);
        const batch = writeBatch(db);
        batch.update(resourceDocRef, { likes: newLikesCount });
        if (newLikedState) {
          batch.set(userLikeRef, { userId: userUid, timestamp: new Date() });
        } else {
          batch.delete(userLikeRef);
        }
        await batch.commit();

        setLiked(newLikedState);
        setLikes(newLikesCount);
        if (onResourceUpdated) onResourceUpdated(resource.id, newLikesCount);
      } catch (firestoreError) {
        console.error("Firestore like update also failed:", firestoreError);
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
        resource.address || resource.vicinity || "N/A"
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
    if (!auth.currentUser || newComment.trim() === "" || !resource.id) return;

    const userUid = auth.currentUser.uid;
    const displayName = auth.currentUser?.displayName || "Anonymous";

    const commentData = {
      text: newComment,
      user: displayName,
      userId: userUid,
      createdAt: new Date().toISOString(),
    };

    try {
      if (editComment) {
        const commentId = editComment.id;
        const updates = {};
        updates[`resources/${resource.id}/comments/${commentId}/text`] =
          newComment;
        updates[`userComments/${userUid}/${resource.id}/${commentId}/text`] =
          newComment;
        await update(ref(database), updates);

        try {
          const commentDocRef = doc(
            db,
            `resources/${resource.id}/comments`,
            commentId
          );
          await updateDoc(commentDocRef, { text: newComment });
        } catch (fsError) {
          console.warn(
            "Firestore comment update sync failed (RTDB succeeded):",
            fsError
          );
        }
      } else {
        const commentsRef = ref(database, `resources/${resource.id}/comments`);
        const newCommentRef = push(commentsRef);
        const commentId = newCommentRef.key;

        const updates = {};
        updates[`resources/${resource.id}/comments/${commentId}`] = commentData;
        updates[`userComments/${userUid}/${resource.id}/${commentId}`] = {
          ...commentData,
          resourceName: resource.name,
        };
        await update(ref(database), updates);

        try {
          const resourceCommentsColRef = collection(
            db,
            `resources/${resource.id}/comments`
          );
          const commentDocRef = doc(resourceCommentsColRef, commentId);
          await setDoc(commentDocRef, commentData);

          const userCommentsColRef = collection(
            db,
            `users/${userUid}/comments`
          );
          await addDoc(userCommentsColRef, {
            ...commentData,
            resourceId: resource.id,
            resourceName: resource.name,
            commentId: commentId,
          });
        } catch (fsError) {
          console.warn(
            "Firestore comment add sync failed (RTDB succeeded):",
            fsError
          );
        }
      }

      setNewComment("");
      setEditComment(null);
      fetchComments();
      setCommentDialogOpen(false);
    } catch (rtdbError) {
      console.error("RTDB comment submission/update failed:", rtdbError);
      try {
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
          await addDoc(collection(db, `users/${userUid}/comments`), {
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
      } catch (firestoreError) {
        console.error(
          "Firestore comment submission/update also failed:",
          firestoreError
        );
        alert("Failed to submit comment. Please try again.");
      }
    }
  };

  const handleEditComment = (comment) => {
    setEditComment(comment);
    setNewComment(comment.text);
    setCommentDialogOpen(true);
  };

  const handleDeleteComment = async (commentId) => {
    if (!userAuthenticated || !auth.currentUser) {
      alert("Please sign in to delete comments.");
      return;
    }
    if (!resource.id || !commentId) {
      console.warn("Missing resource ID or comment ID for deletion.");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this comment?"))
      return;

    const userUid = auth.currentUser.uid;

    try {
      const updates = {};
      updates[`resources/${resource.id}/comments/${commentId}`] = null;
      updates[`userComments/${userUid}/${resource.id}/${commentId}`] = null;
      await update(ref(database), updates);

      try {
        const batch = writeBatch(db);
        const commentDocRef = doc(
          db,
          `resources/${resource.id}/comments`,
          commentId
        );
        batch.delete(commentDocRef);

        const userCommentsQuery = query(
          collection(db, `users/${userUid}/comments`),
          where("resourceId", "==", resource.id),
          where("commentId", "==", commentId)
        );
        const querySnapshot = await getDocs(userCommentsQuery);
        querySnapshot.forEach((doc) => {
          batch.delete(doc.ref);
        });

        await batch.commit();
      } catch (fsError) {
        console.warn(
          "Firestore comment delete sync failed (RTDB succeeded):",
          fsError
        );
      }

      fetchComments();
    } catch (rtdbError) {
      console.warn(
        "RTDB comment delete failed, attempting Firestore directly:",
        rtdbError
      );
      try {
        const batch = writeBatch(db);
        const commentDocRef = doc(
          db,
          `resources/${resource.id}/comments`,
          commentId
        );
        batch.delete(commentDocRef);

        const userCommentsQuery = query(
          collection(db, `users/${userUid}/comments`),
          where("resourceId", "==", resource.id),
          where("commentId", "==", commentId)
        );
        const querySnapshot = await getDocs(userCommentsQuery);
        querySnapshot.forEach((doc) => {
          batch.delete(doc.ref);
        });

        await batch.commit();
        fetchComments();
      } catch (firestoreError) {
        console.error("Firestore comment delete also failed:", firestoreError);
        alert("Failed to delete comment. Please try again.");
      }
    }
  };

  const handleViewDetails = (resource) => {
    const detailId = resource.id || resource.place_id;
    if (detailId) {
      navigate(`/resource-details/${detailId}`, {
        state: { resourceData: resource },
      });
    } else {
      console.error("Cannot view details: No resource ID or place_id found.");
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

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200 h-full flex flex-col transition-shadow hover:shadow-xl z-0"
      >
        <div className="relative group">
          <div className="h-52 w-full overflow-hidden bg-gray-200">
            <img
              src={
                resource.photoUrl ||
                "https://via.placeholder.com/400x300.png?text=No+Image"
              }
              alt={resource.name || "Resource Image"}
              className="w-full h-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-105"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src =
                  "https://via.placeholder.com/400x300.png?text=No+Image";
              }}
            />
          </div>
          <div className="absolute top-0 left-0 w-full p-3 flex justify-between items-start">
            <div className="bg-lavender-600 text-white px-3 py-1 text-xs font-semibold rounded-full shadow capitalize">
              {resource.type ||
                resource.category
                  ?.replace(/^(dog_|cat_)/, "")
                  .replace(/_/g, " ") ||
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
                  } ${isOpen ? "animate-pulse" : ""}`}
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
              } ${!userAuthenticated ? "cursor-not-allowed opacity-70" : ""}`}
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
            className="text-xl font-bold text-lavender-900 mb-1 line-clamp-1"
            title={resource.name || "No Name"}
          >
            {resource.name || "Unnamed Resource"}
          </h2>
          <p
            className="text-sm text-gray-500 mb-3 flex items-start"
            title={resource.address || resource.vicinity || ""}
          >
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
                className="flex items-center text-lavender-600 hover:text-lavender-800 transition-colors"
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
                className="flex items-center text-lavender-600 hover:text-lavender-800 transition-colors"
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
                  className="flex items-center text-xs text-lavender-600 hover:text-lavender-800 p-1.5 rounded-md hover:bg-gray-100 transition-colors"
                  title={
                    userAuthenticated
                      ? "View/Add Comments"
                      : "Sign in to comment"
                  }
                >
                  <FiMessageSquare className="w-4 h-4" />
                  {comments.length > 0 && (
                    <span className="ml-1">{comments.length}</span>
                  )}
                </button>
                <button
                  onClick={() => setShowHours(true)}
                  className="flex items-center text-xs text-lavender-600 hover:text-lavender-800 p-1.5 rounded-md hover:bg-gray-100 transition-colors"
                  title="Operating Hours"
                  disabled={!resource.hours && !resource.time}
                >
                  <FiClock className="w-4 h-4" />
                </button>
                <button
                  onClick={handleShare}
                  className="flex items-center text-xs text-lavender-600 hover:text-lavender-800 p-1.5 rounded-md hover:bg-gray-100 transition-colors"
                  title="Share"
                >
                  <FiShare2 className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={() => handleViewDetails(resource)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-lavender-600 hover:bg-lavender-700 hover:shadow-md transition-all flex items-center"
              >
                <FiInfo className="w-4 h-4 mr-1.5" /> Details
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {commentDialogOpen && (
          <motion.div
            key="hours-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-white rounded-xl max-w-sm w-full shadow-xl overflow-hidden flex flex-col max-h-[60vh]"
            >
              <div className="p-3 bg-lavender-50 border-b border-lavender-200 flex-shrink-0">
                <div className="flex justify-between items-center">
                  <h2 className="text-base font-semibold text-lavender-900">
                    Comments ({comments.length})
                  </h2>
                  <button
                    onClick={() => setCommentDialogOpen(false)}
                    className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
                    aria-label="Close comments"
                  >
                    <FiX />
                  </button>
                </div>
              </div>
              <div
                className="p-3 flex-grow overflow-y-auto"
                style={{ maxHeight: comments.length > 2 ? "160px" : "auto" }}
              >
                {comments.length > 0 ? (
                  <div className="space-y-2 mb-2">
                    {comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="p-2 rounded-lg bg-lavender-50"
                      >
                        <div className="flex justify-between items-start mb-1">
                          <p className="font-medium text-xs text-lavender-900">
                            {comment.user || "Anonymous"}
                          </p>
                          {canEditComment(comment) && (
                            <div className="flex space-x-1 flex-shrink-0 ml-2">
                              <button
                                onClick={() => handleEditComment(comment)}
                                className="text-lavender-600 hover:text-lavender-800 p-1 rounded hover:bg-lavender-100"
                                title="Edit"
                                aria-label="Edit comment"
                              >
                                <FiEdit2 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                                title="Delete"
                                aria-label="Delete comment"
                              >
                                <FiTrash2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-lavender-800 whitespace-pre-wrap break-words">
                          {comment.text}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(comment.createdAt).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-xs text-gray-500 italic my-4">
                    No comments yet.
                  </p>
                )}
              </div>
              <div className="p-3 bg-gray-50 border-t border-gray-200 flex-shrink-0">
                {!userAuthenticated ? (
                  <div className="text-center text-xs text-gray-500 p-2 bg-gray-100 rounded-lg">
                    Please sign in to add or manage comments.
                  </div>
                ) : (
                  <div className="flex flex-col space-y-2">
                    <textarea
                      className="w-full p-2 border border-lavender-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-lavender-500 resize-none text-xs"
                      rows="2"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder={
                        editComment
                          ? "Update your comment..."
                          : "Write a comment..."
                      }
                      aria-label="New comment input"
                    />
                    <div className="flex justify-end gap-2">
                      {editComment && (
                        <button
                          onClick={() => {
                            setEditComment(null);
                            setNewComment("");
                          }}
                          className="px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg"
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        onClick={handleCommentSubmit}
                        disabled={!newComment.trim()}
                        className={`px-3 py-1 text-xs text-white rounded-lg transition-colors ${
                          !newComment.trim()
                            ? "bg-gray-300 cursor-not-allowed"
                            : `bg-lavender-600 hover:bg-lavender-700`
                        }`}
                      >
                        {editComment ? "Update" : "Submit"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showHours && (
          <motion.div
            key="hours-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowHours(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-white rounded-xl max-w-md w-full shadow-xl overflow-hidden flex flex-col max-h-[70vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 bg-lavender-50 border-b border-lavender-200 flex-shrink-0">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-lavender-900 flex items-center">
                    <FiClock className="mr-2" />
                    Operating Hours
                  </h2>
                  <button
                    onClick={() => setShowHours(false)}
                    className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
                    aria-label="Close operating hours"
                  >
                    <FiX />
                  </button>
                </div>
              </div>
              <div className="p-4 text-sm text-lavender-800 flex-grow overflow-y-auto">
                {resource.hours ? (
                  Array.isArray(resource.hours) ? (
                    resource.hours.map((t, i) => (
                      <p key={i} className="mb-1">
                        {t}
                      </p>
                    ))
                  ) : typeof resource.hours === "string" ? (
                    resource.hours.split("\n").map((line, i) => (
                      <p key={i} className="mb-1">
                        {line}
                      </p>
                    ))
                  ) : (
                    <p className="italic text-gray-500">
                      Hours format unclear.
                    </p>
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
              <div className="bg-gray-50 px-4 py-3 flex justify-end flex-shrink-0 border-t border-gray-200">
                <button
                  onClick={() => setShowHours(false)}
                  className="px-4 py-2 text-sm text-white rounded-lg bg-lavender-600 hover:bg-lavender-700"
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
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-lavender-600"></div>
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
                  Map location not available
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ResourceCard;
