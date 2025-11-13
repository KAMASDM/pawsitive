import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiUpload } from 'react-icons/fi';
import { FaPaw } from 'react-icons/fa';
import { ref, push, set, get } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { database, storage, auth } from '../../firebase';

const QuickActionDialog = ({ isOpen, onClose, pet, actionType }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    type: 'milestone',
    mediaFile: null,
    mediaPreview: null,
    mediaType: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPet, setSelectedPet] = useState(pet);
  const [userPets, setUserPets] = useState([]);

  // Load user's pets for selection
  useEffect(() => {
    if (!isOpen) return;

    const loadUserPets = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const petsRef = ref(database, `userPets/${user.uid}`);
        const snapshot = await get(petsRef);
        
        if (snapshot.exists()) {
          const petsData = snapshot.val();
          const petsArray = Object.keys(petsData).map((id) => ({
            id,
            ...petsData[id],
          }));
          setUserPets(petsArray);
          
          // If pet prop is provided, use it as default
          if (pet) {
            setSelectedPet(pet);
          } else if (petsArray.length > 0) {
            setSelectedPet(petsArray[0]);
          }
        }
      } catch (error) {
        console.error('Error loading pets:', error);
      }
    };

    loadUserPets();
  }, [isOpen, pet]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        title: '',
        description: '',
        date: '',
        type: 'milestone',
        mediaFile: null,
        mediaPreview: null,
        mediaType: null,
      });
      setError(null);
      setLoading(false);
    }
  }, [isOpen]);

  const handleMediaSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    const mediaType = file.type.startsWith('image/') ? 'image' : 'video';
    const reader = new FileReader();
    
    reader.onloadend = () => {
      setFormData({
        ...formData,
        mediaFile: file,
        mediaPreview: reader.result,
        mediaType,
      });
      setError(null);
    };
    
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedPet) {
      setError('Please select a pet');
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      setError('You must be logged in');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (actionType === 'post') {
        await handlePostSubmit(user);
      } else if (actionType === 'event') {
        await handleEventSubmit(user);
      }

      onClose();
    } catch (error) {
      console.error('Error submitting:', error);
      setError(error.message || 'Failed to submit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePostSubmit = async (user) => {
    if (!formData.mediaFile) {
      throw new Error('Please select a photo or video');
    }

    // Upload media to Firebase Storage
    const filename = `${Date.now()}_${formData.mediaFile.name}`;
    const mediaStorageRef = storageRef(
      storage,
      `petPosts/${selectedPet.id}/${filename}`
    );
    
    await uploadBytes(mediaStorageRef, formData.mediaFile);
    const mediaUrl = await getDownloadURL(mediaStorageRef);

    // Save post to database
    const postsRef = ref(database, `petPosts/${selectedPet.id}`);
    const newPostRef = push(postsRef);
    
    await set(newPostRef, {
      mediaUrl,
      mediaType: formData.mediaType,
      caption: formData.description || '',
      timestamp: Date.now(),
      userId: user.uid,
      petId: selectedPet.id,
      likes: [],
      comments: [],
    });
  };

  const handleEventSubmit = async (user) => {
    if (!formData.title || !formData.date) {
      throw new Error('Please provide event title and date');
    }

    const eventsRef = ref(database, `petEvents/${selectedPet.id}`);
    const newEventRef = push(eventsRef);
    
    await set(newEventRef, {
      title: formData.title,
      description: formData.description || '',
      date: formData.date,
      type: formData.type,
      timestamp: Date.now(),
      userId: user.uid,
      petId: selectedPet.id,
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
            <h2 className="text-xl font-bold text-gray-900">
              {actionType === 'post' ? 'Add New Post' : 'Add New Event'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={loading}
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Pet Selection (if multiple pets) */}
            {userPets.length > 1 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Pet <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {userPets.map((petOption) => (
                    <button
                      key={petOption.id}
                      type="button"
                      onClick={() => setSelectedPet(petOption)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        selectedPet?.id === petOption.id
                          ? 'border-violet-600 bg-violet-50'
                          : 'border-gray-200 hover:border-violet-300'
                      }`}
                    >
                      <div className="flex flex-col items-center">
                        {petOption.image ? (
                          <img
                            src={petOption.image}
                            alt={petOption.name}
                            className="w-12 h-12 rounded-full object-cover mb-2"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center mb-2">
                            <FaPaw className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                        <span className="text-sm font-medium text-gray-900">
                          {petOption.name}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {actionType === 'post' && (
              <>
                {/* Media Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Photo or Video <span className="text-red-500">*</span>
                  </label>
                  
                  {formData.mediaPreview ? (
                    <div className="relative">
                      {formData.mediaType === 'image' ? (
                        <img
                          src={formData.mediaPreview}
                          alt="Preview"
                          className="w-full h-64 object-cover rounded-lg"
                        />
                      ) : (
                        <video
                          src={formData.mediaPreview}
                          className="w-full h-64 object-cover rounded-lg"
                          controls
                        />
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            mediaFile: null,
                            mediaPreview: null,
                            mediaType: null,
                          })
                        }
                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                      >
                        <FiX className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-violet-500 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <FiUpload className="w-12 h-12 text-gray-400 mb-3" />
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">
                          PNG, JPG, GIF, MP4 (MAX. 10MB)
                        </p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*,video/*"
                        onChange={handleMediaSelect}
                        disabled={loading}
                      />
                    </label>
                  )}
                </div>

                {/* Caption */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Caption (Optional)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                    placeholder="Write a caption for your post..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                    disabled={loading}
                  />
                </div>
              </>
            )}

            {actionType === 'event' && (
              <>
                {/* Event Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                    disabled={loading}
                  >
                    <option value="milestone">Milestone</option>
                    <option value="vet-visit">Vet Visit</option>
                    <option value="grooming">Grooming</option>
                    <option value="training">Training</option>
                    <option value="vaccination">Vaccination</option>
                    <option value="birthday">Birthday</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Event Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="e.g., First Vet Visit"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                    disabled={loading}
                    required
                  />
                </div>

                {/* Event Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                    disabled={loading}
                    required
                  />
                </div>

                {/* Event Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                    placeholder="Add any additional details..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                    disabled={loading}
                  />
                </div>
              </>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    {actionType === 'post' ? 'Posting...' : 'Adding Event...'}
                  </>
                ) : (
                  actionType === 'post' ? 'Post' : 'Add Event'
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default QuickActionDialog;
