import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  setDoc,
  query,
  where,
  writeBatch,
} from "firebase/firestore";
import { ref, get, push, update, remove } from "firebase/database";
import { db, auth, database } from "../../../firebase";
import {
  FaStar,
  FaMapMarkerAlt,
  FaClock,
  FaPhone,
  FaMapMarkedAlt
} from "react-icons/fa";
import {
  FiMessageSquare,
  FiShare2,
  FiEdit2,
  FiTrash2,
  FiX,
} from "react-icons/fi";


const ResourceCard = ({ resource, onResourceUpdated, onClick, userLocation }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [showHours, setShowHours] = useState(false);
  const [editComment, setEditComment] = useState(null);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [userAuthenticated, setUserAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [commentToDeleteId, setCommentToDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);


  const getCategoryIcon = (resourceTypes) => {
    const types = resourceTypes || [];
    if (types.includes("veterinary_care")) return "🏥";
    if (types.includes("dog_park")) return "🌳";
    if (types.includes("pet_groomer")) return "✂️";
    if (types.includes("dog_trainer")) return "🦮";
    if (types.includes("pet_boarding") || types.includes("pet_sitting")) return "🏨";
    if (types.includes("pet_store")) return "🛒";
    return "🐾";
  };

  // Trim long text
  const trimText = (text, maxLength) => {
    if (!text) return "";
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) =>
      setUserAuthenticated(!!user)
    );
    return () => unsubscribe();
  }, []);


  const fetchComments = useCallback(async () => {
    if (!resource.place_id) {
      setComments([]);
      return;
    }
    try {
      const commentsRef = ref(database, `resources/${resource.place_id}/comments`);
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
            collection(db, `resources/${resource.place_id}/comments`)
          );
          const commentsList = commentsSnapshot.docs.map((doc) => ({
            ...doc.data(),
            id: doc.id,
          }));
          setComments(
            commentsList.sort(
              (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
            ))
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
          collection(db, `resources/${resource.place_id}/comments`)
        );
        const commentsList = commentsSnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));
        setComments(
          commentsList.sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          ))
      } catch (firestoreErr) {
        console.error(
          "Error fetching comments from Firestore as well:",
          firestoreErr
        );
        setComments([]);
      }
    }
  }, [resource.place_id]);

  useEffect(() => {
    if (resource.place_id) {
      fetchComments();
    }
  }, [fetchComments, resource.place_id]);

  const handleShare = () => {
    const detailUrl = `${window.location.origin}/resource-details/${resource.place_id}`;
    const shareData = {
      title: resource.name,
      text: `Check out this pet resource: ${resource.name} at ${resource.vicinity || resource.formatted_address || "N/A"}.`,
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
    setLoading(true);
    if (!userAuthenticated) {
      alert("Please sign in to comment");
      return;
    }
    if (!auth.currentUser || newComment.trim() === "" || !resource.place_id) return;

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
        updates[`resources/${resource.place_id}/comments/${commentId}/text`] =
          newComment;
        updates[`userComments/${userUid}/${resource.place_id}/${commentId}/text`] =
          newComment;
        await update(ref(database), updates);

        try {
          const commentDocRef = doc(
            db,
            `resources/${resource.place_id}/comments`,
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
        const commentsRef = ref(database, `resources/${resource.place_id}/comments`);
        const newCommentRef = push(commentsRef);
        const commentId = newCommentRef.key;

        const updates = {};
        updates[`resources/${resource.place_id}/comments/${commentId}`] = commentData;
        updates[`userComments/${userUid}/${resource.place_id}/${commentId}`] = {
          ...commentData,
          resourceName: resource.name,
        };
        await update(ref(database), updates);

        try {
          const resourceCommentsColRef = collection(
            db,
            `resources/${resource.place_id}/comments`
          );
          const commentDocRef = doc(resourceCommentsColRef, commentId);
          await setDoc(commentDocRef, commentData);

          const userCommentsColRef = collection(
            db,
            `users/${userUid}/comments`
          );
          await addDoc(userCommentsColRef, {
            ...commentData,
            resourceId: resource.place_id,
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
            doc(db, `resources/${resource.place_id}/comments`, editComment.id),
            { text: newComment }
          );
        } else {
          const docRef = await addDoc(
            collection(db, `resources/${resource.place_id}/comments`),
            commentData
          );
          await addDoc(collection(db, `users/${userUid}/comments`), {
            ...commentData,
            resourceId: resource.place_id,
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
    } finally {
      setLoading(false);
    }
  };

  const handleEditComment = (comment) => {
    setEditComment(comment);
    setNewComment(comment.text);
    setCommentDialogOpen(true);
  };

  const confirmDeleteComment = (commentId) => {
    setCommentDialogOpen(false);
    setCommentToDeleteId(commentId);
    setDeleteConfirm(true);
  };

  const handleDeleteClick = async () => {
    setCommentDialogOpen(false);
    if (!commentToDeleteId) return;
    setIsDeleting(true);
    const commentIdToDelete = commentToDeleteId;
    setCommentToDeleteId(null);
    setDeleteConfirm(false);

    if (!userAuthenticated || !auth.currentUser) {
      alert("Please sign in to delete comments.");
      setIsDeleting(false);
      return;
    }
    if (!resource.place_id || !commentIdToDelete) {
      console.warn("Missing resource ID or comment ID for deletion.");
      setIsDeleting(false);
      return;
    }
    const userUid = auth.currentUser.uid;

    try {
      const rtdbCommentRef = ref(
        database,
        `resources/${resource.place_id}/comments/${commentIdToDelete}`
      );
      const rtdbUserCommentRef = ref(
        database,
        `userComments/${userUid}/${resource.place_id}/${commentIdToDelete}`
      );
      await Promise.all([remove(rtdbCommentRef), remove(rtdbUserCommentRef)]);

      try {
        const firestoreCommentRef = doc(
          db,
          `resources/${resource.place_id}/comments`,
          commentIdToDelete
        );
        const userCommentsQuery = query(
          collection(db, `users/${userUid}/comments`),
          where("resourceId", "==", resource.place_id),
          where("commentId", "==", commentIdToDelete)
        );
        const querySnapshot = await getDocs(userCommentsQuery);

        const batch = writeBatch(db);
        batch.delete(firestoreCommentRef);
        querySnapshot.forEach((doc) => {
          batch.delete(doc.ref);
        });
        await batch.commit();
        fetchComments();
      } catch (firestoreError) {
        console.warn("Firestore comment delete sync failed:", firestoreError);
        fetchComments();
      }
    } catch (rtdbError) {
      console.warn("RTDB comment delete failed:", rtdbError);
      try {
        const firestoreCommentRef = doc(
          db,
          `resources/${resource.place_id}/comments`,
          commentIdToDelete
        );
        const userCommentsQuery = query(
          collection(db, `users/${userUid}/comments`),
          where("resourceId", "==", resource.place_id),
          where("commentId", "==", commentIdToDelete)
        );
        const querySnapshot = await getDocs(userCommentsQuery);

        const batch = writeBatch(db);
        batch.delete(firestoreCommentRef);
        querySnapshot.forEach((doc) => {
          batch.delete(doc.ref);
        });
        await batch.commit();
        fetchComments();
      } catch (firestoreError) {
        console.error("Firestore comment delete also failed:", firestoreError);
        alert("Failed to delete comment. Please try again.");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const canEditComment = (comment) => {
    return (
      userAuthenticated &&
      auth.currentUser &&
      comment.userId === auth.currentUser.uid
    );
  };

  const handleCallNow = () => {
    if (resource.phone) {
      window.open(`tel:${resource.phone}`, '_self');
    }
  };

  const handleViewOnMaps = () => {
    if (resource.vicinity || resource.formatted_address) {
      const address = encodeURIComponent(resource.vicinity || resource.formatted_address);
      window.open(`https://www.google.com/maps/search/?api=1&query=${address}`, '_blank');
    }
  };

  return (
    <>
      <motion.div
        className="bg-white h-full rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden flex flex-col"
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
      >
        {/* Image Section at Top */}
        <div className="h-32 sm:h-48 w-full bg-gradient-to-br from-violet-50 to-indigo-50 overflow-hidden relative">
          <img
            src={resource.photoUrl}
            alt={resource.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Details Section Below Image */}
        <div className="p-3 sm:p-4 flex flex-col flex-grow ">
          <div className="flex items-start">
            <div className={`hidden sm:flex w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-violet-400 to-indigo-400  items-center justify-center text-white text-sm sm:text-lg mr-2 sm:mr-3 flex-shrink-0`}>
              {getCategoryIcon(resource.types)}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-800 text-sm sm:text-base mb-1 line-clamp-2 sm:line-clamp-1">
                {trimText(resource.name, window.innerWidth < 640 ? 25 : 30)}
              </h3>
              {/* Hide types/keywords on mobile */}
              <p className="hidden sm:block text-gray-600 text-xs mb-2 line-clamp-2">
                {trimText((resource.types || []).join(", ").replace(/_/g, " "), 50)}
              </p>
              {/* Hide address on mobile */}
              <div className="hidden sm:flex items-center text-xs text-gray-500">
                <FaMapMarkerAlt className="mr-1 text-gray-400 flex-shrink-0" />
                <span className="truncate">
                  {trimText(resource.vicinity || resource.formatted_address || "Unknown location", 40)}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end ml-2">
              {resource.rating && (
                <div className="flex items-center mb-1">
                  <FaStar className="text-yellow-400 mr-1 text-xs sm:text-sm" />
                  <span className="text-xs font-medium">{resource.rating}</span>
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-auto sm:mt-3 flex justify-between items-center border-t border-gray-100 pt-2 sm:pt-3">
            <div className="flex space-x-1 sm:space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCommentDialogOpen(true);
                }}
                className="flex items-center text-xs text-violet-500 hover:text-violet-700 p-1 sm:p-1.5 rounded-md hover:bg-violet-50 transition-colors"
                title={userAuthenticated ? "View/Add Comments" : "Sign in to comment"}
              >
                <FiMessageSquare className="w-3 h-3" />
                {comments.length > 0 && (
                  <span className="ml-1 text-xs hidden sm:inline">{comments.length}</span>
                )}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowHours(true);
                }}
                className="flex items-center text-xs text-violet-500 hover:text-violet-700 p-1 sm:p-1.5 rounded-md hover:bg-violet-50 transition-colors"
                title="Operating Hours"
                disabled={!resource.hours && !resource.time}
              >
                <FaClock className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleShare();
                }}
                className="flex items-center text-xs text-violet-500 hover:text-violet-700 p-1 sm:p-1.5 rounded-md hover:bg-violet-50 transition-colors"
                title="Share"
              >
                <FiShare2 className="w-3 h-3" />
              </button>
            </div>
            <div className="flex space-x-1 sm:space-x-2">
              {resource.phone && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCallNow();
                  }}
                  className="p-1.5 sm:p-2 rounded-full bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                  title="Call Now"
                >
                  <FaPhone className="w-3 h-3" />
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewOnMaps();
                }}
                className="p-1.5 sm:p-2 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                title="View on Maps"
              >
                <FaMapMarkedAlt className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Comment Dialog */}
      <AnimatePresence>
        {commentDialogOpen && (
          <motion.div
            key="comment-modal"
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
              className="bg-white rounded-xl max-w-sm w-full shadow-xl overflow-hidden flex flex-col max-h-[70vh] sm:max-h-[60vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-3 bg-gradient-to-r from-violet-400 to-indigo-400 text-white">
                <div className="flex justify-between items-center">
                  <h2 className="text-base font-semibold">
                    Comments ({comments.length})
                  </h2>
                  <button
                    onClick={() => setCommentDialogOpen(false)}
                    className="text-white hover:text-gray-200 p-1 rounded-full"
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
                        className="p-2 rounded-lg bg-violet-50"
                      >
                        <div className="flex justify-between items-start mb-1">
                          <p className="font-medium text-xs text-violet-900">
                            {comment.user || "Anonymous"}
                          </p>
                          {canEditComment(comment) && (
                            <div className="flex space-x-1 flex-shrink-0 ml-2">
                              <button
                                onClick={() => handleEditComment(comment)}
                                className="text-violet-600 hover:text-violet-800 p-1 rounded hover:bg-violet-100"
                                title="Edit"
                              >
                                <FiEdit2 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => confirmDeleteComment(comment.id)}
                                className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                                title="Delete"
                              >
                                <FiTrash2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-violet-800 whitespace-pre-wrap break-words">
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
                      className="w-full p-2 border border-violet-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-500 resize-none text-xs"
                      rows="2"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder={
                        editComment
                          ? "Update your comment..."
                          : "Write a comment..."
                      }
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
                        disabled={!newComment.trim() || loading}
                        className={`px-3 py-1 text-xs text-white rounded-lg flex items-center justify-center gap-2 transition-colors ${!newComment.trim() || loading
                          ? "bg-gray-300 cursor-not-allowed"
                          : "bg-gradient-to-r from-violet-400 to-indigo-400 hover:from-violet-500 hover:to-indigo-500"
                          }`}
                      >
                        {loading ? (
                          <svg
                            className="w-4 h-4 animate-spin text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z"
                            />
                          </svg>
                        ) : editComment ? (
                          "Update"
                        ) : (
                          "Submit"
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Dialog */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-70 z-50 flex flex-col items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-white rounded-xl max-w-sm w-full shadow-xl overflow-hidden flex flex-col max-h-[60vh]"
            >
              <div className="p-4 bg-gradient-to-r from-violet-400 to-indigo-400 text-white">
                <h3 className="text-lg font-bold mb-2">
                  Delete Comment
                </h3>
                <p className="text-white/90 mb-4">
                  Are you sure you want to delete this comment? This action cannot be undone.
                </p>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setDeleteConfirm(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    disabled={isDeleting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteClick}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center justify-center"
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Deleting...
                      </>
                    ) : (
                      "Delete"
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hours Dialog */}
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
              <div className="p-4 bg-gradient-to-r from-violet-400 to-indigo-400 text-white">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold flex items-center">
                    <FaClock className="mr-2" />
                    Operating Hours
                  </h2>
                  <button
                    onClick={() => setShowHours(false)}
                    className="text-white hover:text-gray-200 p-1 rounded-full"
                  >
                    <FiX />
                  </button>
                </div>
              </div>
              <div className="p-4 text-sm text-gray-600 flex-grow overflow-y-auto">
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
                  className="px-4 py-2 text-sm text-white rounded-lg bg-gradient-to-r from-violet-400 to-indigo-400 hover:from-violet-500 hover:to-indigo-500"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ResourceCard;