import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiCopy, FiCheck, FiDownload } from 'react-icons/fi';
import { FaWhatsapp, FaFacebook, FaTwitter, FaLinkedin, FaPaw } from 'react-icons/fa';
import html2canvas from 'html2canvas';
import { QRCodeSVG } from 'qrcode.react';
import { getPetAgeInfo } from '../../utils/petAgeCalculator';

const ShareModal = ({ isOpen, onClose, pet, slug }) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('share'); // 'share' or 'card'
  const [downloading, setDownloading] = useState(false);
  const cardRef = useRef(null);

  const shareUrl = `${window.location.origin}/pet/${slug}`;
  const shareText = `Check out ${pet?.name}'s profile on Pawppy!`;

  // Get pet age info
  const ageInfo = pet?.dateOfBirth ? getPetAgeInfo(pet.type, pet.dateOfBirth) : null;

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

  const handleDownloadCard = async () => {
    if (!cardRef.current || downloading) return;

    try {
      setDownloading(true);
      
      // Generate canvas from the card
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2, // Higher quality
        logging: false,
        useCORS: true,
        allowTaint: true
      });

      // Convert to blob and download
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `${pet?.name}-pawppy-card.png`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
        setDownloading(false);
      });
    } catch (error) {
      console.error('Error generating card:', error);
      setDownloading(false);
    }
  };

  const handleShareCard = async (platform) => {
    if (!cardRef.current) return;

    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true
      });

      canvas.toBlob((blob) => {
        const file = new File([blob], `${pet?.name}-pawppy-card.png`, { type: 'image/png' });
        
        if (navigator.share && navigator.canShare({ files: [file] })) {
          navigator.share({
            files: [file],
            title: `${pet?.name}'s Profile Card`,
            text: shareText
          });
        } else {
          // Fallback to URL sharing
          handleShare(shareLinks.find(l => l.name === platform)?.url);
        }
      });
    } catch (error) {
      console.error('Error sharing card:', error);
      // Fallback to URL sharing
      handleShare(shareLinks.find(l => l.name === platform)?.url);
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
          className="bg-white rounded-2xl w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with Tabs */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Share {pet?.name}'s Profile</h2>
              <button
                onClick={onClose}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveTab('share')}
                className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all ${
                  activeTab === 'share'
                    ? 'bg-gradient-to-r from-violet-500 to-indigo-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Share Link
              </button>
              <button
                onClick={() => setActiveTab('card')}
                className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all ${
                  activeTab === 'card'
                    ? 'bg-gradient-to-r from-violet-500 to-indigo-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Profile Card
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              {activeTab === 'share' ? (
                <motion.div
                  key="share"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Pet Preview */}
                  <div className="flex items-center mb-6 p-4 bg-gradient-to-r from-violet-50 to-indigo-50 rounded-xl">
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
                        className={`px-4 py-2.5 rounded-lg transition-all flex items-center ${
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
                            className={`${platform.color} text-white px-4 py-3 rounded-lg transition-all flex items-center justify-center hover:shadow-lg`}
                          >
                            <Icon className="w-5 h-5 mr-2" />
                            {platform.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Tip */}
                  <div className="mt-6 p-4 bg-gradient-to-r from-violet-50 to-indigo-50 rounded-xl text-center">
                    <p className="text-sm text-gray-600">
                      💡 Share this link with friends and family to show off {pet?.name}!
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="card"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Profile Card Preview */}
                  <div className="mb-6">
                    <div
                      ref={cardRef}
                      className="bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 rounded-2xl p-8 text-white shadow-2xl"
                      style={{ width: '400px', margin: '0 auto' }}
                    >
                      {/* Header with Logo */}
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-2">
                          <FaPaw className="w-6 h-6" />
                          <span className="font-bold text-xl">Pawppy</span>
                        </div>
                        <div className="w-16 h-16 bg-white rounded-lg p-2">
                          <QRCodeSVG
                            value={shareUrl}
                            size={48}
                            level="H"
                            includeMargin={false}
                          />
                        </div>
                      </div>

                      {/* Pet Photo */}
                      <div className="flex justify-center mb-6">
                        <div className="relative">
                          <div className="w-32 h-32 rounded-full bg-white p-2">
                            <img
                              src={pet?.image || '/default-pet.png'}
                              alt={pet?.name}
                              className="w-full h-full rounded-full object-cover"
                            />
                          </div>
                          <div className="absolute -bottom-2 -right-2 bg-white rounded-full px-3 py-1 shadow-lg">
                            <span className="text-2xl">{ageInfo?.lifeStage?.emoji || '🐾'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Pet Info */}
                      <div className="text-center mb-6">
                        <h2 className="text-3xl font-bold mb-2">{pet?.name}</h2>
                        <p className="text-white/90 text-lg capitalize mb-1">
                          {pet?.breed}
                        </p>
                        <p className="text-white/80 text-sm capitalize">
                          {pet?.type} • {pet?.gender}
                        </p>
                      </div>

                      {/* Age Info */}
                      {ageInfo && (
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-6">
                          <div className="grid grid-cols-2 gap-4 text-center">
                            <div>
                              <p className="text-white/80 text-sm mb-1">Actual Age</p>
                              <p className="text-2xl font-bold">
                                {ageInfo.ageInYears}y {ageInfo.ageInMonths}m
                              </p>
                            </div>
                            <div>
                              <p className="text-white/80 text-sm mb-1">Human Years</p>
                              <p className="text-2xl font-bold">
                                {ageInfo.humanYears} years
                              </p>
                            </div>
                          </div>
                          <div className="mt-3 text-center">
                            <span className="inline-block bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm">
                              {ageInfo.lifeStage?.emoji} {ageInfo.lifeStage?.stage}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Footer */}
                      <div className="text-center">
                        <p className="text-white/70 text-xs mb-2">Scan QR code to view full profile</p>
                        <p className="text-white/90 text-sm font-medium">pawppy.in</p>
                      </div>
                    </div>
                  </div>

                  {/* Download Button */}
                  <button
                    onClick={handleDownloadCard}
                    disabled={downloading}
                    className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-6 py-3.5 rounded-xl font-medium hover:from-violet-700 hover:to-indigo-700 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl mb-4"
                  >
                    <FiDownload className="w-5 h-5 mr-2" />
                    {downloading ? 'Generating Card...' : 'Download Profile Card'}
                  </button>

                  {/* Share Card Options */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
                      Or share directly
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {shareLinks.slice(0, 2).map((platform) => {
                        const Icon = platform.icon;
                        return (
                          <button
                            key={platform.name}
                            onClick={() => handleShareCard(platform.name)}
                            className={`${platform.color} text-white px-4 py-3 rounded-lg transition-all flex items-center justify-center hover:shadow-lg`}
                          >
                            <Icon className="w-5 h-5 mr-2" />
                            {platform.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Tip */}
                  <div className="mt-6 p-4 bg-gradient-to-r from-violet-50 to-indigo-50 rounded-xl text-center">
                    <p className="text-sm text-gray-600">
                      ✨ Download and share this beautiful card on social media!
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ShareModal;
