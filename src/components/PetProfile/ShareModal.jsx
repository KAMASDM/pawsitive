import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiCopy, FiCheck } from 'react-icons/fi';
import { FaWhatsapp, FaFacebook, FaTwitter, FaLinkedin } from 'react-icons/fa';

const ShareModal = ({ isOpen, onClose, pet, slug }) => {
  const [copied, setCopied] = useState(false);

  const shareUrl = `${window.location.origin}/pet/${slug}`;
  const shareText = `Check out ${pet?.name}'s profile on Pawppy!`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLinks = [
    {
      name: 'WhatsApp',
      icon: FaWhatsapp,
      color: 'bg-green-500 hover:bg-green-600',
      url: `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`
    },
    {
      name: 'Facebook',
      icon: FaFacebook,
      color: 'bg-blue-600 hover:bg-blue-700',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
    },
    {
      name: 'Twitter',
      icon: FaTwitter,
      color: 'bg-sky-500 hover:bg-sky-600',
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`
    },
    {
      name: 'LinkedIn',
      icon: FaLinkedin,
      color: 'bg-blue-700 hover:bg-blue-800',
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
    }
  ];

  const handleShare = (url) => {
    window.open(url, '_blank', 'width=600,height=400');
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
          className="bg-white rounded-2xl w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Share {pet?.name}'s Profile</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Pet Preview */}
            <div className="flex items-center mb-6 p-4 bg-violet-50 rounded-xl">
              <img
                src={pet?.image || '/default-pet.png'}
                alt={pet?.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-violet-200 mr-4"
              />
              <div>
                <h3 className="font-bold text-gray-900">{pet?.name}</h3>
                <p className="text-sm text-gray-600 capitalize">
                  {pet?.breed} • {pet?.type}
                </p>
              </div>
            </div>

            {/* Copy Link */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Share Link
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-700"
                />
                <button
                  onClick={handleCopyLink}
                  className={`px-4 py-2.5 rounded-lg transition-colors flex items-center ${
                    copied
                      ? 'bg-green-500 text-white'
                      : 'bg-violet-600 text-white hover:bg-violet-700'
                  }`}
                >
                  {copied ? (
                    <>
                      <FiCheck className="w-4 h-4 mr-1" />
                      Copied
                    </>
                  ) : (
                    <>
                      <FiCopy className="w-4 h-4 mr-1" />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Social Share Buttons */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Share on Social Media
              </label>
              <div className="grid grid-cols-2 gap-3">
                {shareLinks.map((platform) => {
                  const Icon = platform.icon;
                  return (
                    <button
                      key={platform.name}
                      onClick={() => handleShare(platform.url)}
                      className={`${platform.color} text-white px-4 py-3 rounded-lg transition-colors flex items-center justify-center`}
                    >
                      <Icon className="w-5 h-5 mr-2" />
                      {platform.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* QR Code Placeholder */}
            <div className="mt-6 p-4 bg-gray-50 rounded-xl text-center">
              <p className="text-sm text-gray-600">
                💡 Share this link with friends and family to show off {pet?.name}!
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ShareModal;
