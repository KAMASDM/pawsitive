import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiUpload, FiImage, FiVideo } from 'react-icons/fi';
import { ref as dbRef, push } from 'firebase/database';
import { database } from '../../firebase';

const CreatePostModal = ({ isOpen, onClose, pet }) => {
  const [caption, setCaption] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check file type
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      alert('Please select an image or video file');
      return;
    }

    // Check file size (max 1MB for database storage)
    if (file.size > 1 * 1024 * 1024) {
      alert('File size must be less than 1MB for best performance');
      return;
    }

    setMediaFile(file);
    setMediaType(isImage ? 'image' : 'video');

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setMediaPreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
  };

  const handlePost = async () => {
    if (!mediaFile) {
      alert('Please select a photo or video');
      return;
    }

    setUploading(true);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Data = e.target.result;

        // Create post data with base64 image
        const postData = {
          petId: pet.id,
          caption: caption.trim(),
          mediaUrl: base64Data, // Store base64 directly
          mediaType,
          timestamp: Date.now(),
          likes: [],
          comments: {}
        };

        // Save post to database
        const postsRef = dbRef(database, `petPosts/${pet.id}`);
        await push(postsRef, postData);

        // Reset form and close
        setCaption('');
        setMediaFile(null);
        setMediaPreview(null);
        setMediaType(null);
        setUploading(false);
        onClose();
      };

      reader.onerror = (error) => {
        console.error('Error reading file:', error);
        alert('Failed to read file. Please try again.');
        setUploading(false);
      };

      reader.readAsDataURL(mediaFile);
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post. Please try again.');
      setUploading(false);
    }
  };

  if (!isOpen) return null;

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
          className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Create New Post</h2>
            <button
              onClick={onClose}
              disabled={uploading}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Media Upload */}
            {!mediaPreview ? (
              <div className="border-2 border-dashed border-violet-300 rounded-xl p-12 bg-violet-50/50 mb-6">
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-4 mb-4">
                    <FiImage className="w-12 h-12 text-violet-600" />
                    <FiVideo className="w-12 h-12 text-violet-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Upload Photo or Video
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Share a moment with {pet?.name}
                  </p>
                  <label className="inline-block px-6 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 cursor-pointer transition-colors">
                    <div className="flex items-center">
                      <FiUpload className="w-5 h-5 mr-2" />
                      Select File
                    </div>
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleFileSelect}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                  <p className="text-sm text-gray-500 mt-3">
                    Max file size: 50MB
                  </p>
                </div>
              </div>
            ) : (
              <div className="mb-6">
                <div className="relative rounded-xl overflow-hidden bg-gray-100">
                  {mediaType === 'video' ? (
                    <video
                      src={mediaPreview}
                      controls
                      className="w-full max-h-96 object-contain"
                    />
                  ) : (
                    <img
                      src={mediaPreview}
                      alt="Preview"
                      className="w-full max-h-96 object-contain"
                    />
                  )}
                  <button
                    onClick={handleRemoveMedia}
                    disabled={uploading}
                    className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* Caption */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Caption
              </label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder={`Write a caption about ${pet?.name}...`}
                rows={4}
                disabled={uploading}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent disabled:opacity-50 resize-none"
              />
              <p className="text-sm text-gray-500 mt-1">
                {caption.length}/2200 characters
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end space-x-3">
            <button
              onClick={onClose}
              disabled={uploading}
              className="px-6 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handlePost}
              disabled={!mediaFile || uploading}
              className="px-6 py-2.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {uploading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Posting...
                </>
              ) : (
                'Post'
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CreatePostModal;
