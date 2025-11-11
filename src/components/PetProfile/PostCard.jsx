import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiHeart, FiMessageCircle, FiX, FiSend, FiMoreVertical, FiTrash2 } from 'react-icons/fi';
import { FaHeart } from 'react-icons/fa';
import { ref, update, push, remove, get } from 'firebase/database';
import { database } from '../../firebase';

const PostCard = ({ post, pet, owner, isOwner, currentUser, isModal, onClose }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    // Check if current user has liked this post
    if (currentUser && post.likes) {
      setIsLiked(post.likes.includes(currentUser.uid));
    }
    setLikesCount(post.likes?.length || 0);

    // Load comments
    if (post.comments) {
      const commentsArray = Object.entries(post.comments).map(([id, comment]) => ({
        id,
        ...comment
      }));
      commentsArray.sort((a, b) => a.timestamp - b.timestamp);
      setComments(commentsArray);
    }
  }, [post, currentUser]);

  const handleLike = async () => {
    if (!currentUser) {
      alert('Please log in to like posts');
      return;
    }

    const postRef = ref(database, `petPosts/${pet.id}/${post.id}/likes`);
    const snapshot = await get(postRef);
    const currentLikes = snapshot.val() || [];

    if (isLiked) {
      // Unlike
      const updatedLikes = currentLikes.filter(uid => uid !== currentUser.uid);
      await update(ref(database, `petPosts/${pet.id}/${post.id}`), {
        likes: updatedLikes
      });
      setIsLiked(false);
      setLikesCount(updatedLikes.length);
    } else {
      // Like
      const updatedLikes = [...currentLikes, currentUser.uid];
      await update(ref(database, `petPosts/${pet.id}/${post.id}`), {
        likes: updatedLikes
      });
      setIsLiked(true);
      setLikesCount(updatedLikes.length);
    }
  };

  const handleComment = async () => {
    if (!currentUser) {
      alert('Please log in to comment');
      return;
    }

    if (!newComment.trim()) return;

    // Check if comments are disabled
    if (pet.privacy?.commentsDisabled && !isOwner) {
      alert('Comments are disabled for this pet');
      return;
    }

    const commentData = {
      userId: currentUser.uid,
      userName: currentUser.name || 'Anonymous',
      userEmail: currentUser.email,
      text: newComment.trim(),
      timestamp: Date.now()
    };

    const commentsRef = ref(database, `petPosts/${pet.id}/${post.id}/comments`);
    await push(commentsRef, commentData);

    setNewComment('');
    setShowComments(true);
  };

  const handleDeleteComment = async (commentId) => {
    if (!currentUser) return;

    const comment = comments.find(c => c.id === commentId);
    if (comment.userId !== currentUser.uid && !isOwner) {
      alert('You can only delete your own comments');
      return;
    }

    if (window.confirm('Delete this comment?')) {
      const commentRef = ref(database, `petPosts/${pet.id}/${post.id}/comments/${commentId}`);
      await remove(commentRef);
    }
  };

  const handleDeletePost = async () => {
    if (!isOwner) return;

    if (window.confirm('Delete this post? This action cannot be undone.')) {
      const postRef = ref(database, `petPosts/${pet.id}/${post.id}`);
      await remove(postRef);
      if (onClose) onClose();
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString();
  };

  const PostContent = () => (
    <div className={`bg-white ${!isModal ? 'rounded-xl shadow-sm' : ''}`}>
      {/* Post Header */}
      <div className="p-4 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center">
          <img
            src={pet?.image || '/default-pet.png'}
            alt={pet?.name}
            className="w-10 h-10 rounded-full object-cover mr-3"
          />
          <div>
            <p className="font-semibold text-gray-900">{pet?.name}</p>
            <p className="text-xs text-gray-500">{formatTimestamp(post.timestamp)}</p>
          </div>
        </div>
        {isOwner && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <FiMoreVertical className="w-5 h-5" />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                <button
                  onClick={handleDeletePost}
                  className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 rounded-lg flex items-center"
                >
                  <FiTrash2 className="w-4 h-4 mr-2" />
                  Delete Post
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Post Media */}
      <div className="relative">
        {post.mediaType === 'video' ? (
          <video
            src={post.mediaUrl}
            controls
            className="w-full max-h-[600px] object-contain bg-black"
          />
        ) : (
          <img
            src={post.mediaUrl}
            alt={post.caption}
            className="w-full max-h-[600px] object-contain bg-gray-50"
          />
        )}
      </div>

      {/* Post Actions */}
      <div className="p-4">
        <div className="flex items-center space-x-4 mb-3">
          <button
            onClick={handleLike}
            className="flex items-center space-x-1 group"
          >
            {isLiked ? (
              <FaHeart className="w-6 h-6 text-red-500" />
            ) : (
              <FiHeart className="w-6 h-6 text-gray-700 group-hover:text-red-500 transition-colors" />
            )}
          </button>
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center space-x-1 group"
          >
            <FiMessageCircle className="w-6 h-6 text-gray-700 group-hover:text-violet-600 transition-colors" />
          </button>
        </div>

        {/* Likes Count */}
        <p className="font-semibold text-sm text-gray-900 mb-2">
          {likesCount} {likesCount === 1 ? 'like' : 'likes'}
        </p>

        {/* Caption */}
        {post.caption && (
          <p className="text-gray-900 text-sm mb-3">
            <span className="font-semibold mr-2">{pet?.name}</span>
            {post.caption}
          </p>
        )}

        {/* View Comments Toggle */}
        {comments.length > 0 && !showComments && (
          <button
            onClick={() => setShowComments(true)}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            View all {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
          </button>
        )}

        {/* Comments Section */}
        {showComments && comments.length > 0 && (
          <div className="mt-3 space-y-3 max-h-60 overflow-y-auto">
            {comments.map((comment) => (
              <div key={comment.id} className="flex items-start space-x-2">
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-semibold mr-2">{comment.userName}</span>
                    {comment.text}
                  </p>
                  <div className="flex items-center space-x-3 mt-1">
                    <span className="text-xs text-gray-500">{formatTimestamp(comment.timestamp)}</span>
                    {(comment.userId === currentUser?.uid || isOwner) && (
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Comment - Only if comments are enabled or user is owner */}
        {currentUser && (!pet.privacy?.commentsDisabled || isOwner) && (
          <div className="mt-4 flex items-center space-x-2 pt-3 border-t border-gray-100">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleComment()}
              placeholder="Add a comment..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
            />
            <button
              onClick={handleComment}
              disabled={!newComment.trim()}
              className="p-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiSend className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Comments Disabled Message */}
        {pet.privacy?.commentsDisabled && !isOwner && (
          <p className="mt-4 text-sm text-gray-500 text-center pt-3 border-t border-gray-100">
            Comments are disabled for this post
          </p>
        )}
      </div>
    </div>
  );

  if (isModal) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-10">
              <h3 className="font-semibold text-gray-900">Post</h3>
              <button
                onClick={onClose}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <PostContent />
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return <PostContent />;
};

export default PostCard;
