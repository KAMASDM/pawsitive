import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiHeart, FiMessageCircle, FiGrid, FiList, FiPlus } from 'react-icons/fi';
import { FaBirthdayCake, FaPaw } from 'react-icons/fa';
import PostCard from './PostCard';
import CreatePostModal from './CreatePostModal';

const PetPostsFeed = ({
  posts,
  pet,
  owner,
  isOwner,
  currentUser,
  viewMode,
  onViewModeChange,
  birthday,
  events,
  onShare
}) => {
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;

  return (
    <div className="w-full">
      {/* Mobile Header */}
      {isMobile && (
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          {/* Pet Info Header */}
          <div className="px-4 py-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="relative w-16 h-16 mr-3">
                  <img
                    src={pet?.image || '/default-pet.png'}
                    alt={pet?.name}
                    className="w-full h-full rounded-full object-cover border-2 border-violet-200"
                  />
                  {birthday?.isToday && (
                    <FaBirthdayCake className="absolute -top-1 -right-1 w-5 h-5 text-pink-500" />
                  )}
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{pet?.name}</h1>
                  <p className="text-sm text-gray-600 capitalize">
                    {pet?.breed} • {pet?.type}
                  </p>
                </div>
              </div>
              <button
                onClick={onShare}
                className="p-2 text-violet-600 hover:bg-violet-50 rounded-lg"
              >
                <FiMessageCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 pb-4">
              <div className="text-center">
                <div className="font-bold text-lg text-gray-900">{posts.length}</div>
                <div className="text-xs text-gray-600">Posts</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-lg text-gray-900">
                  {posts.reduce((sum, post) => sum + (post.likes?.length || 0), 0)}
                </div>
                <div className="text-xs text-gray-600">Likes</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-lg text-gray-900">
                  {events?.length || 0}
                </div>
                <div className="text-xs text-gray-600">Events</div>
              </div>
            </div>

            {/* Birthday Alert */}
            {birthday?.isToday && (
              <div className="bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-lg p-3 mb-4">
                <div className="flex items-center text-sm font-medium text-pink-700">
                  <FaBirthdayCake className="w-4 h-4 mr-2" />
                  🎉 It's {pet?.name}'s Birthday Today!
                </div>
              </div>
            )}
          </div>

          {/* View Toggle & Create Button */}
          <div className="px-4 pb-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onViewModeChange('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-violet-100 text-violet-600'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <FiGrid className="w-5 h-5" />
              </button>
              <button
                onClick={() => onViewModeChange('feed')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'feed'
                    ? 'bg-violet-100 text-violet-600'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <FiList className="w-5 h-5" />
              </button>
            </div>
            {isOwner && (
              <button
                onClick={() => setShowCreatePost(true)}
                className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors flex items-center text-sm"
              >
                <FiPlus className="w-4 h-4 mr-1" />
                New Post
              </button>
            )}
          </div>
        </div>
      )}

      {/* Desktop Header */}
      {!isMobile && (
        <div className="bg-white rounded-xl shadow-sm mb-6 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Posts</h2>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onViewModeChange('grid')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-violet-100 text-violet-600'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <FiGrid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => onViewModeChange('feed')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'feed'
                      ? 'bg-violet-100 text-violet-600'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <FiList className="w-5 h-5" />
                </button>
              </div>
              {isOwner && (
                <button
                  onClick={() => setShowCreatePost(true)}
                  className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors flex items-center"
                >
                  <FiPlus className="w-4 h-4 mr-2" />
                  New Post
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Posts Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-3 gap-1 lg:gap-4">
          {posts.length === 0 ? (
            <div className="col-span-3 text-center py-12">
              <FaPaw className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No posts yet</p>
              {isOwner && (
                <button
                  onClick={() => setShowCreatePost(true)}
                  className="mt-4 px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
                >
                  Create First Post
                </button>
              )}
            </div>
          ) : (
            posts.map((post) => (
              <motion.div
                key={post.id}
                whileHover={{ scale: 1.02 }}
                className="aspect-square cursor-pointer relative group"
                onClick={() => setSelectedPost(post)}
              >
                {post.mediaType === 'video' ? (
                  <video
                    src={post.mediaUrl}
                    className="w-full h-full object-cover rounded-lg"
                    muted
                  />
                ) : (
                  <img
                    src={post.mediaUrl}
                    alt={post.caption}
                    className="w-full h-full object-cover rounded-lg"
                  />
                )}
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                  <div className="flex items-center space-x-6 text-white">
                    <div className="flex items-center">
                      <FiHeart className="w-6 h-6 mr-2" />
                      <span className="font-bold">{post.likes?.length || 0}</span>
                    </div>
                    <div className="flex items-center">
                      <FiMessageCircle className="w-6 h-6 mr-2" />
                      <span className="font-bold">{post.comments?.length || 0}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* Posts Feed View */}
      {viewMode === 'feed' && (
        <div className="space-y-6">
          {posts.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm text-center py-12">
              <FaPaw className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No posts yet</p>
              {isOwner && (
                <button
                  onClick={() => setShowCreatePost(true)}
                  className="mt-4 px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
                >
                  Create First Post
                </button>
              )}
            </div>
          ) : (
            posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                pet={pet}
                owner={owner}
                isOwner={isOwner}
                currentUser={currentUser}
              />
            ))
          )}
        </div>
      )}

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={showCreatePost}
        onClose={() => setShowCreatePost(false)}
        pet={pet}
      />

      {/* Post Detail Modal */}
      {selectedPost && (
        <PostCard
          post={selectedPost}
          pet={pet}
          owner={owner}
          isOwner={isOwner}
          currentUser={currentUser}
          isModal={true}
          onClose={() => setSelectedPost(null)}
        />
      )}
    </div>
  );
};

export default PetPostsFeed;
