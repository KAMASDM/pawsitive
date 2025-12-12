import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FaTimes,
  FaDog,
  FaCat,
  FaMapMarkerAlt,
  FaClock,
  FaPhone,
  FaEnvelope,
  FaDollarSign,
  FaShareAlt,
  FaExclamationTriangle,
  FaHeart,
  FaEdit,
  FaTrash
} from 'react-icons/fa';
import { FiAlertCircle, FiCheckCircle, FiX } from 'react-icons/fi';
import { getDatabase, ref, update, remove } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import useResponsive from '../../hooks/useResponsive';

const LostFoundPetDetail = ({ pet, type, onClose, onEdit, onDelete }) => {
  const { isMobile } = useResponsive();
  const Icon = pet.petType === 'Dog' ? FaDog : FaCat;
  const isLost = type === 'lost';
  const auth = getAuth();
  const user = auth.currentUser;
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Check if current user is the owner
  const isOwner = user && pet.userId === user.uid;

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleContact = () => {
    const phone = pet.contactPhone || pet.ownerPhone;
    const email = pet.contactEmail || pet.ownerEmail;
    const name = pet.ownerName || pet.finderName;
    
    // Create contact info message
    let message = `📞 Contact Information:\n\n`;
    if (name) message += `Name: ${name}\n`;
    if (phone) message += `Phone: ${phone}\n`;
    if (email) message += `Email: ${email}\n`;
    
    // Show contact info
    alert(message);
    
    // Optional: Open phone dialer if on mobile
    if (phone && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      const makeCall = confirm('Would you like to call now?');
      if (makeCall) {
        window.location.href = `tel:${phone}`;
      }
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: isLost ? `Lost ${pet.petType}: ${pet.petName}` : `Found ${pet.petType}`,
        text: `Help reunite this pet with their family`,
        url: window.location.href
      });
    } else {
      // Fallback copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(pet);
    }
  };

  const handleDelete = async () => {
    if (!isOwner) {
      alert('You can only delete your own posts');
      return;
    }

    setIsDeleting(true);
    try {
      const db = getDatabase();
      const petRef = ref(db, `${isLost ? 'lostPets' : 'foundPets'}/${pet.id}`);
      await remove(petRef);
      
      alert('Post deleted successfully');
      if (onDelete) {
        onDelete();
      }
      onClose();
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post. Please try again.');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleMarkAsReunited = async () => {
    if (!isOwner || !isLost) return;

    try {
      const db = getDatabase();
      const petRef = ref(db, `lostPets/${pet.id}`);
      await update(petRef, {
        status: 'reunited',
        reunitedAt: Date.now(),
        updatedAt: Date.now()
      });
      
      alert('🎉 Congratulations! Your pet has been marked as reunited!');
      onClose();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status. Please try again.');
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className={`bg-white rounded-2xl shadow-2xl overflow-hidden ${
          isMobile ? 'w-full max-h-[90vh]' : 'w-full max-w-4xl max-h-[90vh]'
        } overflow-y-auto`}
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`relative ${isLost ? 'bg-gradient-to-br from-red-50 to-red-100' : 'bg-gradient-to-br from-green-50 to-green-100'} p-6`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100"
          >
            <FiX className="text-xl" />
          </button>

          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
              isLost ? 'bg-red-200' : 'bg-green-200'
            }`}>
              {isLost ? (
                <FiAlertCircle className="text-3xl text-red-700" />
              ) : (
                <FiCheckCircle className="text-3xl text-green-700" />
              )}
            </div>
            <div>
              <h2 className="text-3xl font-bold text-slate-800">
                {isLost ? `${pet.petName}` : `Found ${pet.petType}`}
              </h2>
              <p className="text-gray-700 font-medium">
                {isLost ? pet.breed : pet.approximateBreed}
              </p>
            </div>
          </div>
        </div>

        {/* Photo Gallery */}
        {pet.photos && pet.photos.length > 0 && (
          <div className="p-6 bg-gray-50">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {pet.photos.map((photo, index) => (
                <motion.img
                  key={index}
                  src={photo.base64 || photo}
                  alt={`Photo ${index + 1}`}
                  className="w-full h-48 object-cover rounded-xl cursor-pointer"
                  whileHover={{ scale: 1.05 }}
                  onClick={() => window.open(photo.base64 || photo, '_blank')}
                />
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Quick Info Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-violet-50 p-4 rounded-xl text-center">
              <Icon className="text-2xl text-violet-600 mx-auto mb-2" />
              <div className="text-sm text-gray-600">Type</div>
              <div className="font-bold text-slate-800">{pet.petType}</div>
            </div>
            <div className="bg-indigo-50 p-4 rounded-xl text-center">
              <div className="text-2xl mb-2">⚧</div>
              <div className="text-sm text-gray-600">Gender</div>
              <div className="font-bold text-slate-800">{pet.gender || 'Unknown'}</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-xl text-center">
              <div className="text-2xl mb-2">📏</div>
              <div className="text-sm text-gray-600">Size</div>
              <div className="font-bold text-slate-800">{pet.size || 'Unknown'}</div>
            </div>
            <div className="bg-pink-50 p-4 rounded-xl text-center">
              <div className="text-2xl mb-2">🎂</div>
              <div className="text-sm text-gray-600">Age</div>
              <div className="font-bold text-slate-800">{pet.age || pet.approximateAge || 'Unknown'}</div>
            </div>
          </div>

          {/* Location & Date */}
          <div className="bg-gradient-to-r from-violet-50 to-purple-50 p-6 rounded-2xl">
            <h3 className="text-lg font-bold text-slate-800 mb-4">
              {isLost ? 'Last Seen' : 'Found Location'}
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <FaMapMarkerAlt className={`text-xl ${isLost ? 'text-red-500' : 'text-green-500'} mt-1`} />
                <div>
                  <div className="font-medium text-slate-800">
                    {isLost ? pet.lastSeenLocation : pet.foundLocation}
                  </div>
                  {(isLost ? pet.lastSeenAddress : pet.foundAddress) && (
                    <div className="text-sm text-gray-600">
                      {isLost ? pet.lastSeenAddress : pet.foundAddress}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <FaClock className="text-xl text-gray-400" />
                <div>
                  <span className="font-medium text-slate-800">
                    {formatDate(pet.createdAt)}
                  </span>
                  {(isLost ? pet.lastSeenTime : pet.foundTime) && (
                    <span className="text-gray-600 ml-2">
                      at {isLost ? pet.lastSeenTime : pet.foundTime}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Physical Description */}
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-3">Physical Description</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-xl">
                <div className="text-sm text-gray-600 mb-1">Primary Color</div>
                <div className="font-medium text-slate-800">{pet.primaryColor || 'Not specified'}</div>
              </div>
              {pet.secondaryColor && (
                <div className="bg-gray-50 p-4 rounded-xl">
                  <div className="text-sm text-gray-600 mb-1">Secondary Color</div>
                  <div className="font-medium text-slate-800">{pet.secondaryColor}</div>
                </div>
              )}
              {pet.markings && (
                <div className="bg-gray-50 p-4 rounded-xl col-span-2">
                  <div className="text-sm text-gray-600 mb-1">Markings & Patterns</div>
                  <div className="font-medium text-slate-800">{pet.markings}</div>
                </div>
              )}
              {pet.distinctiveFeatures && (
                <div className="bg-gray-50 p-4 rounded-xl col-span-2">
                  <div className="text-sm text-gray-600 mb-1">Distinctive Features</div>
                  <div className="font-medium text-slate-800">{pet.distinctiveFeatures}</div>
                </div>
              )}
            </div>
          </div>

          {/* Lost Pet Specific Info */}
          {isLost && (
            <>
              {/* Behavior & ID */}
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-3">Behavior & Identification</h3>
                <div className="space-y-3">
                  {pet.microchipped && (
                    <div className="flex items-center gap-3 bg-blue-50 p-4 rounded-xl">
                      <FiCheckCircle className="text-xl text-blue-600" />
                      <div>
                        <div className="font-medium text-slate-800">Microchipped</div>
                        {pet.microchipNumber && (
                          <div className="text-sm text-gray-600">ID: {pet.microchipNumber}</div>
                        )}
                      </div>
                    </div>
                  )}
                  {pet.collar && (
                    <div className="bg-violet-50 p-4 rounded-xl">
                      <div className="font-medium text-slate-800 mb-1">Collar</div>
                      <div className="text-gray-600">{pet.collarDescription}</div>
                    </div>
                  )}
                  {pet.responsive && (
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <div className="font-medium text-slate-800 mb-1">Responds to Name</div>
                      <div className="text-gray-600">{pet.responsive}</div>
                    </div>
                  )}
                  {pet.temperament && (
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <div className="font-medium text-slate-800 mb-1">Temperament</div>
                      <div className="text-gray-600">{pet.temperament}</div>
                    </div>
                  )}
                  {pet.medicalConditions && (
                    <div className="bg-red-50 p-4 rounded-xl border-2 border-red-200">
                      <div className="flex items-start gap-2">
                        <FaExclamationTriangle className="text-red-600 mt-0.5" />
                        <div>
                          <div className="font-medium text-slate-800 mb-1">Medical Conditions</div>
                          <div className="text-gray-700">{pet.medicalConditions}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Circumstances */}
              {pet.circumstances && (
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-3">How They Went Missing</h3>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-gray-700">{pet.circumstances}</p>
                  </div>
                </div>
              )}

              {/* Reward */}
              {pet.reward && (
                <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-6 rounded-2xl border-2 border-yellow-300">
                  <div className="flex items-center gap-3">
                    <FaDollarSign className="text-3xl text-yellow-600" />
                    <div>
                      <div className="text-lg font-bold text-slate-800">Reward Offered</div>
                      {pet.rewardAmount && (
                        <div className="text-2xl font-bold text-yellow-700">${pet.rewardAmount}</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Found Pet Specific Info */}
          {!isLost && (
            <>
              {/* Current Status */}
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-3">Current Status</h3>
                <div className="space-y-3">
                  <div className="bg-green-50 p-4 rounded-xl">
                    <div className="font-medium text-slate-800 mb-1">Currently</div>
                    <div className="text-gray-700">
                      {pet.currentStatus === 'with_me' && 'With the finder'}
                      {pet.currentStatus === 'at_shelter' && `At shelter: ${pet.shelterName || 'Contact for details'}`}
                      {pet.currentStatus === 'at_vet' && `At vet clinic: ${pet.vetClinicName || 'Contact for details'}`}
                      {pet.currentStatus === 'with_someone_else' && 'In temporary care'}
                    </div>
                  </div>

                  {pet.scannedForMicrochip && (
                    <div className={`p-4 rounded-xl ${pet.microchipFound ? 'bg-blue-50' : 'bg-gray-50'}`}>
                      <div className="font-medium text-slate-800 mb-1">Microchip Scan</div>
                      <div className="text-gray-700">
                        {pet.microchipFound ? (
                          <div className="flex items-center gap-2">
                            <FiCheckCircle className="text-blue-600" />
                            <span>Microchip found: {pet.microchipNumber}</span>
                          </div>
                        ) : (
                          'No microchip detected'
                        )}
                      </div>
                    </div>
                  )}

                  {pet.hasCollar && (
                    <div className="bg-violet-50 p-4 rounded-xl">
                      <div className="font-medium text-slate-800 mb-1">Collar</div>
                      <div className="text-gray-700">{pet.collarDescription}</div>
                      {pet.hasTag && pet.tagInfo && (
                        <div className="mt-2 text-sm text-gray-600">
                          <span className="font-medium">Tag info:</span> {pet.tagInfo}
                        </div>
                      )}
                    </div>
                  )}

                  {pet.injuries && (
                    <div className="bg-red-50 p-4 rounded-xl border-2 border-red-200">
                      <div className="flex items-start gap-2">
                        <FaExclamationTriangle className="text-red-600 mt-0.5" />
                        <div>
                          <div className="font-medium text-slate-800 mb-1">Injuries Noted</div>
                          <div className="text-gray-700">{pet.injuryDescription}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Behavior */}
              {pet.behaviorNotes && (
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-3">Behavior</h3>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-gray-700">{pet.behaviorNotes}</p>
                  </div>
                </div>
              )}

              {/* Finder Assistance */}
              <div className="bg-gradient-to-r from-violet-50 to-purple-50 p-6 rounded-2xl">
                <h3 className="text-lg font-bold text-slate-800 mb-3">Finder Can Provide</h3>
                <div className="flex flex-wrap gap-3">
                  {pet.willingToFoster && (
                    <span className="flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full font-medium">
                      <FaHeart /> Temporary fostering
                    </span>
                  )}
                  {pet.willingToTransport && (
                    <span className="flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full font-medium">
                      <FaMapMarkerAlt /> Pet transportation
                    </span>
                  )}
                  {!pet.willingToFoster && !pet.willingToTransport && (
                    <span className="text-gray-600">Contact for arrangement details</span>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Additional Info */}
          {pet.additionalInfo && (
            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-3">Additional Information</h3>
              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-gray-700">{pet.additionalInfo}</p>
              </div>
            </div>
          )}

          {/* Contact Information */}
          <div className={`border-2 ${isLost ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'} p-6 rounded-2xl`}>
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <FaPhone className={isLost ? 'text-red-600' : 'text-green-600'} />
              Contact {isLost ? 'Owner' : 'Finder'}
            </h3>
            <div className="space-y-3">
              {(pet.ownerName || pet.finderName) && (
                <div className="bg-white p-4 rounded-xl">
                  <div className="text-sm text-gray-600 mb-1">Name</div>
                  <div className="font-bold text-slate-800">{pet.ownerName || pet.finderName}</div>
                </div>
              )}
              {(pet.contactPhone || pet.ownerPhone) && (
                <div className="bg-white p-4 rounded-xl">
                  <div className="text-sm text-gray-600 mb-1">Phone Number</div>
                  <a 
                    href={`tel:${pet.contactPhone || pet.ownerPhone}`}
                    className={`font-bold ${isLost ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'} flex items-center gap-2`}
                  >
                    <FaPhone className="text-sm" />
                    {pet.contactPhone || pet.ownerPhone}
                  </a>
                </div>
              )}
              {(pet.contactEmail || pet.ownerEmail) && (
                <div className="bg-white p-4 rounded-xl">
                  <div className="text-sm text-gray-600 mb-1">Email Address</div>
                  <a 
                    href={`mailto:${pet.contactEmail || pet.ownerEmail}`}
                    className={`font-bold ${isLost ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'} flex items-center gap-2 break-all`}
                  >
                    <FaEnvelope className="text-sm flex-shrink-0" />
                    {pet.contactEmail || pet.ownerEmail}
                  </a>
                </div>
              )}
              {pet.alternateContact && (
                <div className="bg-white p-4 rounded-xl">
                  <div className="text-sm text-gray-600 mb-1">Alternate Contact</div>
                  <div className="font-medium text-slate-800">{pet.alternateContact}</div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            {/* Owner Actions */}
            {isOwner && (
              <div className="flex flex-col sm:flex-row gap-3 pb-4 border-b border-gray-200">
                <motion.button
                  onClick={handleEdit}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <FaEdit /> Edit Post
                </motion.button>
                {isLost && pet.status === 'lost' && (
                  <motion.button
                    onClick={handleMarkAsReunited}
                    className="flex-1 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-bold flex items-center justify-center gap-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <FiCheckCircle /> Mark as Reunited
                  </motion.button>
                )}
                <motion.button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="py-3 px-6 bg-red-600 text-white rounded-xl font-bold flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <FaTrash />
                </motion.button>
              </div>
            )}

            {/* Contact Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <motion.button
                onClick={handleContact}
                className={`flex-1 py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 ${
                  isLost 
                    ? 'bg-gradient-to-r from-red-600 to-red-700'
                    : 'bg-gradient-to-r from-green-600 to-green-700'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <FaPhone /> Contact {isLost ? 'Owner' : 'Finder'}
              </motion.button>
              <motion.button
                onClick={handleShare}
                className="flex-1 py-4 bg-white border-2 border-violet-600 text-violet-600 rounded-xl font-bold flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <FaShareAlt /> Share
              </motion.button>
            </div>
          </div>

          {/* Report Info */}
          <div className="text-center text-sm text-gray-500 pt-4 border-t border-gray-200">
            Report ID: {pet.reportId || pet.id} • Created {formatDate(pet.createdAt)}
          </div>
        </div>
      </motion.div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <motion.div
          className="absolute inset-0 bg-black/70 z-10 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setShowDeleteConfirm(false)}
        >
          <motion.div
            className="bg-white rounded-2xl p-6 max-w-md w-full"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <FaTrash className="text-5xl text-red-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-slate-800 mb-2">Delete Post?</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this {isLost ? 'lost' : 'found'} pet post? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300"
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 disabled:opacity-50"
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default LostFoundPetDetail;
