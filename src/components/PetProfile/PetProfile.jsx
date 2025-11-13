import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiShare2, FiLock, FiCalendar, FiArrowLeft, FiEdit, FiInfo, FiPlus } from 'react-icons/fi';
import { FaBirthdayCake, FaPaw } from 'react-icons/fa';
import { ref, get, onValue, off } from 'firebase/database';
import { onAuthStateChanged } from 'firebase/auth';
import { database, auth } from '../../firebase';
import PetPostsFeed from './PetPostsFeed';
import PetEventsTimeline from './PetEventsTimeline';
import ShareModal from './ShareModal';
import QuickActionDialog from './QuickActionDialog';
import './PetProfile.css';

const PetProfile = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [pet, setPet] = useState(null);
  const [owner, setOwner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [posts, setPosts] = useState([]);
  const [events, setEvents] = useState([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showQuickActionDialog, setShowQuickActionDialog] = useState(false);
  const [quickActionType, setQuickActionType] = useState(null); // 'post' or 'event'

  // Listen to auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser({
          uid: user.uid,
          email: user.email,
          name: user.displayName
        });
      } else {
        setCurrentUser(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Don't load pet data until auth state is determined
    if (authLoading) {
      console.log('Waiting for auth state...');
      return;
    }

    const loadPetData = async () => {
      setLoading(true);
      
      try {
        console.log('Looking for pet with slug:', slug);
        
        // First, try to get pet location from slug index
        const slugRef = ref(database, `petSlugs/${slug}`);
        const slugSnapshot = await get(slugRef);
        
        console.log('Slug snapshot exists:', slugSnapshot.exists());
        if (slugSnapshot.exists()) {
          console.log('Slug data:', slugSnapshot.val());
        }
        
        let petData = null;
        let ownerId = null;
        let petId = null;
        
        if (slugSnapshot.exists()) {
          const slugData = slugSnapshot.val();
          ownerId = slugData.userId;
          petId = slugData.petId;
          
          console.log('Fetching pet from userPets:', ownerId, petId);
          
          // Get the pet data
          const petRef = ref(database, `userPets/${ownerId}/${petId}`);
          const petSnapshot = await get(petRef);
          
          console.log('Pet snapshot exists:', petSnapshot.exists());
          
          if (petSnapshot.exists()) {
            petData = { id: petSnapshot.key, ...petSnapshot.val() };
            console.log('Found matching pet!', petData);
          } else {
            console.error('Pet not found at path:', `userPets/${ownerId}/${petId}`);
          }
        } else {
          console.error('Slug not found in petSlugs index:', slug);
        }
        
        if (!petData) {
          console.log('No pet found with slug:', slug);
          setNotFound(true);
          setLoading(false);
          return;
        }
        
        // Check privacy settings - only block if private AND user is not the owner
        const isOwner = ownerId === currentUser?.uid;
        const isPrivate = petData.privacy?.isPrivate || false;
        
        console.log('Privacy check:', {
          isPrivate,
          ownerId,
          currentUserId: currentUser?.uid,
          isOwner
        });
        
        if (isPrivate && !isOwner) {
          console.log('Pet is private and user is not owner');
          setNotFound(true);
          setLoading(false);
          return;
        }

        console.log('PetProfile: Setting pet state with data:', petData);
        setPet(petData);

        // Fetch owner data
        if (ownerId) {
          const ownerRef = ref(database, `users/${ownerId}`);
          const ownerSnapshot = await get(ownerRef);
          if (ownerSnapshot.exists()) {
            setOwner(ownerSnapshot.val());
          }
        }

        // Listen to posts
        const postsRef = ref(database, `petPosts/${petId}`);
        onValue(postsRef, (snapshot) => {
          if (snapshot.exists()) {
            const postsData = [];
            snapshot.forEach((childSnapshot) => {
              postsData.push({
                id: childSnapshot.key,
                ...childSnapshot.val()
              });
            });
            // Sort by timestamp descending
            postsData.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
            setPosts(postsData);
          } else {
            setPosts([]);
          }
        });

        // Listen to events
        const eventsRef = ref(database, `petEvents/${petId}`);
        onValue(eventsRef, (snapshot) => {
          if (snapshot.exists()) {
            const eventsData = [];
            snapshot.forEach((childSnapshot) => {
              eventsData.push({
                id: childSnapshot.key,
                ...childSnapshot.val()
              });
            });
            // Sort by date ascending
            eventsData.sort((a, b) => new Date(a.date) - new Date(b.date));
            setEvents(eventsData);
          } else {
            setEvents([]);
          }
        });

        console.log('PetProfile: Setting loading to false');
        setLoading(false);

        // Cleanup listeners
        return () => {
          off(postsRef);
          off(eventsRef);
        };
      } catch (error) {
        console.error('Error loading pet profile:', error);
        setNotFound(true);
        setLoading(false);
      }
    };

    loadPetData();
  }, [slug, currentUser, authLoading]);

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return 'Unknown';
    
    const birth = new Date(dateOfBirth);
    const now = new Date();
    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();
    
    if (months < 0) {
      years--;
      months += 12;
    }
    
    if (years > 0) {
      return `${years} year${years > 1 ? 's' : ''}${months > 0 ? ` ${months} month${months > 1 ? 's' : ''}` : ''}`;
    } else {
      return `${months} month${months > 1 ? 's' : ''}`;
    }
  };

  const getNextBirthday = (dateOfBirth) => {
    if (!dateOfBirth) return null;
    
    const birth = new Date(dateOfBirth);
    const now = new Date();
    const nextBirthday = new Date(now.getFullYear(), birth.getMonth(), birth.getDate());
    
    if (nextBirthday < now) {
      nextBirthday.setFullYear(now.getFullYear() + 1);
    }
    
    const daysUntil = Math.ceil((nextBirthday - now) / (1000 * 60 * 60 * 24));
    
    return {
      date: nextBirthday,
      daysUntil,
      isToday: daysUntil === 0
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FaPaw className="w-12 h-12 text-violet-600 animate-bounce mx-auto mb-4" />
          <p className="text-gray-600">Loading pet profile...</p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FiLock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Pet Not Found</h2>
          <p className="text-gray-600 mb-6">This pet profile doesn't exist or is private.</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const birthday = getNextBirthday(pet?.dateOfBirth);
  const isOwner = currentUser?.uid === pet?.userId;

  console.log('PetProfile: About to render, pet:', pet, 'loading:', loading, 'notFound:', notFound);

  if (!pet) {
    console.log('PetProfile: Pet is null/undefined, showing loading');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FaPaw className="w-12 h-12 text-violet-600 animate-bounce mx-auto mb-4" />
          <p className="text-gray-600">Loading pet data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back Button and Breadcrumb */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center text-gray-600 hover:text-violet-600 transition-colors mr-4"
              >
                <FiArrowLeft className="w-5 h-5 mr-2" />
                <span className="font-medium">Back</span>
              </button>
              <div className="hidden md:flex items-center text-sm text-gray-500">
                <button onClick={() => navigate('/')} className="hover:text-violet-600">Home</button>
                <span className="mx-2">/</span>
                <span className="text-gray-900 font-medium">{pet?.petName || pet?.name}</span>
              </div>
            </div>
            
            {/* Action Buttons for Owner */}
            {isOwner && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate(`/pet-details/${pet?.id}`)}
                  className="flex items-center px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <FiInfo className="w-4 h-4 mr-1" />
                  <span className="hidden md:inline">Pet Details</span>
                </button>
                <button
                  onClick={() => {
                    setQuickActionType('post');
                    setShowQuickActionDialog(true);
                  }}
                  className="flex items-center px-3 py-2 text-sm bg-violet-50 text-violet-600 rounded-lg hover:bg-violet-100 transition-colors"
                >
                  <FiPlus className="w-4 h-4 mr-1" />
                  <span className="hidden md:inline">Add Post</span>
                </button>
                <button
                  onClick={() => {
                    setQuickActionType('event');
                    setShowQuickActionDialog(true);
                  }}
                  className="flex items-center px-3 py-2 text-sm bg-violet-50 text-violet-600 rounded-lg hover:bg-violet-100 transition-colors"
                >
                  <FiCalendar className="w-4 h-4 mr-1" />
                  <span className="hidden md:inline">Add Event</span>
                </button>
                <button
                  onClick={() => setShowShareModal(true)}
                  className="flex items-center px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <FiShare2 className="w-4 h-4 mr-1" />
                  <span className="hidden md:inline">Share</span>
                </button>
              </div>
            )}
            
            {/* Share Button for Non-Owner */}
            {!isOwner && (
              <button
                onClick={() => setShowShareModal(true)}
                className="flex items-center px-3 py-2 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
              >
                <FiShare2 className="w-4 h-4 mr-1" />
                <span className="hidden md:inline">Share</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:block max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Sidebar - Pet Info */}
          <div className="col-span-3">
            <div className="bg-white rounded-xl shadow-sm sticky top-8">
              <div className="p-6">
                {/* Pet Avatar */}
                <div className="relative w-32 h-32 mx-auto mb-4">
                  <img
                    src={pet?.image || '/default-pet.png'}
                    alt={pet?.name}
                    className="w-full h-full rounded-full object-cover border-4 border-violet-200"
                  />
                  {birthday?.isToday && (
                    <div className="absolute -top-2 -right-2">
                      <FaBirthdayCake className="w-8 h-8 text-pink-500" />
                    </div>
                  )}
                </div>

                {/* Pet Name & Type */}
                <h1 className="text-2xl font-bold text-gray-900 text-center mb-1">
                  {pet?.name}
                </h1>
                <p className="text-gray-600 text-center capitalize mb-4">
                  {pet?.breed} • {pet?.type}
                </p>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6 pb-6 border-b border-gray-200">
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
                      {calculateAge(pet?.dateOfBirth)}
                    </div>
                    <div className="text-xs text-gray-600">Age</div>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm">
                    <FiCalendar className="w-4 h-4 text-violet-600 mr-2" />
                    <span className="text-gray-700">Born: {pet?.dateOfBirth || 'Unknown'}</span>
                  </div>
                  {birthday && !birthday.isToday && (
                    <div className="flex items-center text-sm">
                      <FaBirthdayCake className="w-4 h-4 text-pink-500 mr-2" />
                      <span className="text-gray-700">
                        Birthday in {birthday.daysUntil} day{birthday.daysUntil !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                  {birthday?.isToday && (
                    <div className="bg-pink-50 border border-pink-200 rounded-lg p-3">
                      <div className="flex items-center text-sm font-medium text-pink-700">
                        <FaBirthdayCake className="w-4 h-4 mr-2" />
                        🎉 Birthday Today!
                      </div>
                    </div>
                  )}
                </div>

                {/* Owner Info */}
                {owner && (
                  <div className="pt-6 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-2">Owner</p>
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-violet-200 rounded-full flex items-center justify-center mr-3">
                        <span className="text-violet-700 font-medium">
                          {owner.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{owner.name}</p>
                        <p className="text-xs text-gray-600">{owner.email}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="mt-6 space-y-2">
                  {isOwner ? (
                    <>
                      <button
                        onClick={() => {
                          // Navigate to profile with state to open edit dialog
                          navigate('/profile', { 
                            state: { 
                              editPetId: pet?.id,
                              openEditDialog: true 
                            } 
                          });
                        }}
                        className="w-full px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors flex items-center justify-center"
                      >
                        <FiEdit className="w-4 h-4 mr-2" />
                        Edit Profile
                      </button>
                      <button
                        onClick={() => setShowShareModal(true)}
                        className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center"
                      >
                        <FiShare2 className="w-4 h-4 mr-2" />
                        Share Profile
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setShowShareModal(true)}
                      className="w-full px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors flex items-center justify-center"
                    >
                      <FiShare2 className="w-4 h-4 mr-2" />
                      Share Profile
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Center - Posts Feed */}
          <div className="col-span-6">
            <PetPostsFeed
              posts={posts}
              pet={pet}
              isOwner={isOwner}
              currentUser={currentUser}
              viewMode="feed"
            />
          </div>

          {/* Right Sidebar - Events */}
          <div className="col-span-3">
            <PetEventsTimeline
              events={events}
              pet={pet}
              isOwner={isOwner}
              birthday={birthday}
            />
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden">
        <PetPostsFeed
          posts={posts}
          pet={pet}
          owner={owner}
          isOwner={isOwner}
          currentUser={currentUser}
          viewMode="feed"
          birthday={birthday}
          events={events}
          onShare={() => setShowShareModal(true)}
        />
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        pet={pet}
        slug={slug}
      />

      {/* Quick Action Dialog */}
      {isOwner && (
        <QuickActionDialog
          isOpen={showQuickActionDialog}
          onClose={() => {
            setShowQuickActionDialog(false);
            setQuickActionType(null);
          }}
          pet={pet}
          actionType={quickActionType}
        />
      )}
    </div>
  );
};

export default PetProfile;
