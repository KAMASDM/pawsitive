import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiShare2, FiPlus } from 'react-icons/fi';
import { FaBirthdayCake, FaPaw } from 'react-icons/fa';
import PostCard from './PostCard';
import CreatePostModal from './CreatePostModal';
import PetEventsTimeline from './PetEventsTimeline';
import PetAgeCard from './PetAgeCard';

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
  const navigate = useNavigate();
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [activeTab, setActiveTab] = useState('posts'); // 'posts' or 'events'

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;

  return (
    <div className="w-full">
      {/* ── Mobile Hero ── */}
      {isMobile && (
        <div>
          {/* Hero Header */}
          <div
            className="relative overflow-hidden pb-8"
            style={{ background: "linear-gradient(160deg, #6d5dbf 0%, #4a3d7d 60%, #2e2550 100%)" }}
          >
            {/* Decorative paw prints */}
            {[
              { top: "10%", left: "6%",   size: 24, opacity: 0.11, rotate: -18 },
              { top: "22%", right: "8%",  size: 18, opacity: 0.08, rotate: 22  },
              { top: "50%", left: "15%",  size: 20, opacity: 0.07, rotate: 38  },
              { top: "38%", right: "20%", size: 28, opacity: 0.09, rotate: -10 },
              { top: "68%", left: "44%",  size: 16, opacity: 0.06, rotate: 6   },
            ].map((p, i) => (
              <div key={i} className="absolute pointer-events-none" style={{ top: p.top, left: p.left, right: p.right, transform: `rotate(${p.rotate}deg)` }}>
                <svg width={p.size} height={p.size} viewBox="0 0 64 64" fill="#fff" opacity={p.opacity}>
                  <ellipse cx="16" cy="14" rx="7" ry="9" />
                  <ellipse cx="32" cy="10" rx="7" ry="9" />
                  <ellipse cx="48" cy="14" rx="7" ry="9" />
                  <ellipse cx="8" cy="28" rx="6" ry="8" />
                  <path d="M32 56 C14 56 10 38 14 30 C18 22 46 22 50 30 C54 38 50 56 32 56Z" />
                </svg>
              </div>
            ))}

            {/* Top nav strip */}
            <div className="relative z-10 flex items-center justify-between px-5 pt-4 pb-2">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }}
              >
                <FiArrowLeft size={14} /> Back
              </button>
              <button
                onClick={onShare}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }}
              >
                <FiShare2 size={14} /> Share
              </button>
            </div>

            {/* Pet Photo + Info */}
            <div className="relative z-10 flex flex-col items-center px-5 mt-4">
              <div className="relative mb-3">
                <div
                  className="w-24 h-24 rounded-full overflow-hidden"
                  style={{ boxShadow: "0 0 0 4px rgba(255,255,255,0.25)" }}
                >
                  <img
                    src={pet?.image || '/default-pet.png'}
                    alt={pet?.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                {birthday?.isToday && (
                  <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.2)" }}>
                    <FaBirthdayCake className="w-4 h-4 text-pink-400" />
                  </div>
                )}
              </div>
              <h1 className="text-[22px] font-extrabold text-white leading-tight text-center">{pet?.name}</h1>
              <p className="text-sm mt-0.5 capitalize text-center" style={{ color: "rgba(255,255,255,0.7)" }}>
                {[pet?.breed, pet?.type].filter(Boolean).join(" · ")}
              </p>
              {birthday?.isToday && (
                <div className="mt-2 px-3 py-1 rounded-full text-xs font-bold" style={{ background: "rgba(236,72,153,0.3)", color: "#fce7f3" }}>
                  🎂 Birthday Today!
                </div>
              )}
              {birthday && !birthday.isToday && (
                <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.55)" }}>
                  🎂 Birthday in {birthday.daysUntil} day{birthday.daysUntil !== 1 ? 's' : ''}
                </p>
              )}
            </div>

            {/* Stats strip */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="relative z-10 flex gap-3 px-5 mt-5"
            >
              {[
                { value: posts.length, label: "Posts" },
                { value: posts.reduce((s, p) => s + (p.likes?.length || 0), 0), label: "Likes" },
                { value: events?.length || 0, label: "Events", onClick: () => setActiveTab('events') },
              ].map((stat, i) => (
                <div
                  key={i}
                  className={`flex-1 rounded-2xl px-3 py-2.5 text-center${stat.onClick ? ' cursor-pointer' : ''}`}
                  style={{ background: "rgba(255,255,255,0.13)" }}
                  onClick={stat.onClick}
                >
                  <p className="text-xl font-extrabold text-white leading-none">{stat.value}</p>
                  <p className="text-[10px] mt-0.5 font-medium" style={{ color: "rgba(255,255,255,0.65)" }}>{stat.label}</p>
                </div>
              ))}
            </motion.div>

            {/* Curved bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-7 bg-[#f4f1fb]" style={{ borderRadius: "40px 40px 0 0" }} />
          </div>

          {/* Tab bar */}
          <div className="px-4 pt-2 pb-3" style={{ marginTop: -4, background: "#f4f1fb" }}>
            <div
              className="rounded-2xl p-1.5 flex gap-1"
              style={{ background: "#fff", boxShadow: "0 2px 12px rgba(109,93,183,0.08)" }}
            >
              {['posts', 'events'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold capitalize transition-colors"
                  style={
                    activeTab === tab
                      ? { background: "linear-gradient(135deg, #7c3aed, #4f46e5)", color: "#fff" }
                      : { color: "#64748b" }
                  }
                >
                  {tab}
                </button>
              ))}
              {isOwner && activeTab === 'posts' && (
                <button
                  onClick={() => setShowCreatePost(true)}
                  className="flex items-center gap-1 px-4 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ background: "#ede9f6", color: "#7c3aed" }}
                >
                  <FiPlus size={14} /> Post
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Events Tab Content */}
      {isMobile && activeTab === 'events' && (
        <div className="p-4" style={{ background: "#f4f1fb", minHeight: "50vh" }}>
          <PetEventsTimeline
            events={events}
            pet={pet}
            isOwner={isOwner}
            birthday={birthday}
          />
        </div>
      )}

      {/* Mobile Posts Tab Content */}
      {isMobile && activeTab === 'posts' && (
        <div style={{ background: "#f4f1fb", minHeight: "50vh" }}>
          {/* Pet Age Card for Mobile */}
          <div className="p-4 pb-0">
            <PetAgeCard pet={pet} compact={true} />
          </div>
          
          {/* Posts Feed View */}
          <div className="space-y-6 p-4">
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
        </div>
      )}

      {/* Desktop Header */}
      {!isMobile && (
        <div className="bg-white rounded-xl shadow-sm mb-6 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Posts</h2>
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
      )}

      {/* Desktop Posts - Always Feed View */}
      {!isMobile && (
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
