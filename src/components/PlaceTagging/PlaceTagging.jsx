import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiMapPin, FiThumbsUp, FiThumbsDown, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { FaPaw } from 'react-icons/fa';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { ref as dbRef, push, set, serverTimestamp, get } from 'firebase/database';
import { database, auth } from '../../firebase';
import * as geofire from 'geofire-common';

const libraries = ['places'];

const PlaceTagging = ({ isOpen, onClose, userLocation }) => {
  const [step, setStep] = useState(1); // 1: Location, 2: Details
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [placeName, setPlaceName] = useState('');
  const [isPetFriendly, setIsPetFriendly] = useState(true);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [map, setMap] = useState(null); // eslint-disable-line no-unused-vars

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries,
    preventGoogleFontsLoading: true,
    async: true,
    defer: true,
  });

  useEffect(() => {
    if (userLocation && !selectedLocation) {
      setSelectedLocation(userLocation);
    }
  }, [userLocation, selectedLocation]);

  const onMapClick = useCallback((e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    setSelectedLocation({ lat, lng });
  }, []);

  const onLoad = useCallback((map) => {
    setMap(map);
  }, []);

  const handleSubmit = async () => {
    if (!selectedLocation) {
      setError('Please select a location on the map');
      return;
    }

    if (!placeName.trim()) {
      setError('Please enter a place name');
      return;
    }

    if (!comment.trim()) {
      setError('Please add a comment explaining your rating');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const user = auth.currentUser;
      if (!user) {
        setError('You must be logged in to tag places');
        return;
      }

      // Generate geohash for location-based queries
      const hash = geofire.geohashForLocation([selectedLocation.lat, selectedLocation.lng]);

      const taggedPlacesRef = dbRef(database, 'taggedPlaces');
      const newPlaceRef = push(taggedPlacesRef);

      const placeData = {
        placeName: placeName.trim(),
        location: {
          lat: selectedLocation.lat,
          lng: selectedLocation.lng,
        },
        geohash: hash,
        isPetFriendly,
        comment: comment.trim(),
        userId: user.uid,
        userEmail: user.email,
        timestamp: serverTimestamp(),
        createdAt: Date.now(),
      };

      await set(newPlaceRef, placeData);
      console.log('Place tagged successfully:', newPlaceRef.key);

      // Notify nearby users (don't fail if this errors)
      try {
        await notifyNearbyUsers(placeData, newPlaceRef.key);
      } catch (notifyError) {
        console.warn('Could not notify nearby users:', notifyError);
        // Continue anyway - place was still tagged successfully
      }

      setSuccess(true);
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (error) {
      console.error('Error tagging place:', error);
      setError('Failed to tag place. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const notifyNearbyUsers = async (placeData, placeId) => {
    try {
      // Get all users
      const usersRef = dbRef(database, 'users');
      const usersSnapshot = await get(usersRef);
      
      if (!usersSnapshot.exists()) return;

      const users = usersSnapshot.val();
      const currentUserId = auth.currentUser.uid;

      // Check each user's location
      Object.keys(users).forEach(async (userId) => {
        if (userId === currentUserId) return; // Don't notify yourself

        const userData = users[userId];
        if (!userData.location) return;

        // Calculate distance
        const distanceInKm = geofire.distanceBetween(
          [placeData.location.lat, placeData.location.lng],
          [userData.location.lat, userData.location.lng]
        );

        // If within 1km, create notification
        if (distanceInKm <= 1) {
          const notificationRef = dbRef(database, `notifications/${userId}`);
          const newNotificationRef = push(notificationRef);
          
          await set(newNotificationRef, {
            type: 'pet_friendly_place',
            placeId,
            placeName: placeData.placeName,
            isPetFriendly: placeData.isPetFriendly,
            distance: distanceInKm.toFixed(2),
            comment: placeData.comment,
            fromUser: placeData.userEmail,
            timestamp: serverTimestamp(),
            read: false,
          });
        }
      });
    } catch (error) {
      console.error('Error notifying nearby users:', error);
    }
  };

  const handleClose = () => {
    setStep(1);
    setSelectedLocation(userLocation);
    setPlaceName('');
    setIsPetFriendly(true);
    setComment('');
    setError('');
    setSuccess(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-violet-600 to-purple-600 p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <div className="bg-white/20 p-3 rounded-xl mr-3">
                  <FaPaw className="text-2xl" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Tag a Place</h2>
                  <p className="text-white/80 text-sm">Help other pet parents!</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-white/20 rounded-xl transition-colors"
              >
                <FiX className="text-2xl" />
              </button>
            </div>

            {/* Steps Indicator */}
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-white text-violet-600' : 'bg-white/20'}`}>
                  {step > 1 ? <FiCheck /> : '1'}
                </div>
                <div className={`flex-1 h-1 mx-2 ${step > 1 ? 'bg-white' : 'bg-white/20'}`}></div>
              </div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-white text-violet-600' : 'bg-white/20'}`}>
                2
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {success ? (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center py-8"
              >
                <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                  <FiCheck className="text-4xl text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Place Tagged Successfully!</h3>
                <p className="text-gray-600">Nearby users will be notified about this place.</p>
              </motion.div>
            ) : (
              <>
                {/* Step 1: Location Selection */}
                {step === 1 && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                  >
                    <div className="mb-4">
                      <h3 className="text-lg font-bold text-gray-900 mb-2">Select Location</h3>
                      <p className="text-sm text-gray-600">Tap on the map to select the place you want to tag</p>
                    </div>

                    {isLoaded && (
                      <div className="rounded-2xl overflow-hidden border-2 border-gray-200 mb-4">
                        <GoogleMap
                          mapContainerStyle={{ width: '100%', height: '400px' }}
                          center={selectedLocation || userLocation || { lat: 0, lng: 0 }}
                          zoom={15}
                          onClick={onMapClick}
                          onLoad={onLoad}
                        >
                          {selectedLocation && (
                            <Marker
                              position={selectedLocation}
                              icon={{
                                path: 'M256 224c-79.37 0-191.1 122.7-191.1 200.2C64.02 459.1 90.76 480 135.8 480C184.6 480 216.9 454.9 256 454.9C295.5 454.9 327.9 480 376.2 480c44.1 0 71.74-20.88 71.74-55.75C447.1 346.8 335.4 224 256 224zM108.8 211.4c-10.37-34.62-1.383-73.48 21.02-101.1c-22.39 4.25-46.04 22.44-57.93 50.86C60.84 187.8 69.81 226.6 92.23 255.1C103.1 261.6 120.3 244.3 108.8 211.4zM193.5 190.6c30.87-8.125 46.37-49.1 34.87-93.37s-46.5-71.1-77.49-63.87c-30.87 8.125-46.37 49.1-34.87 93.37C127.5 170.1 162.5 198.8 193.5 190.6zM474.9 161.3c-11.88-28.43-35.54-46.62-57.93-50.86c22.4 27.63 31.39 66.48 21.02 101.1c-11.52 32.9 5.641 50.16 16.62 43.66C476.6 226.6 485.6 187.8 474.9 161.3zM318.5 190.6c30.1 8.125 66.9-20.5 77.49-63.87c11.5-43.37-3.1-85.25-34.87-93.37c-30.1-8.125-66.9 20.5-77.49 63.87C272.1 140.6 287.6 182.5 318.5 190.6z',
                                fillColor: '#7c3aed',
                                fillOpacity: 1,
                                strokeColor: '#ffffff',
                                strokeWeight: 2,
                                scale: 0.06,
                                anchor: new window.google.maps.Point(256, 480),
                              }}
                            />
                          )}
                        </GoogleMap>
                      </div>
                    )}

                    {selectedLocation && (
                      <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 mb-4">
                        <div className="flex items-start">
                          <FiMapPin className="text-violet-600 mt-1 mr-2" />
                          <div>
                            <p className="text-sm font-semibold text-gray-900">Selected Location</p>
                            <p className="text-xs text-gray-600">
                              {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {error && (
                      <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-4 flex items-center">
                        <FiAlertCircle className="mr-2" />
                        {error}
                      </div>
                    )}

                    <button
                      onClick={() => {
                        if (selectedLocation) {
                          setStep(2);
                          setError('');
                        } else {
                          setError('Please select a location on the map');
                        }
                      }}
                      className="w-full bg-gradient-to-r from-violet-600 to-purple-600 text-white py-4 rounded-xl font-semibold hover:from-violet-700 hover:to-purple-700 transition-all shadow-lg"
                    >
                      Continue
                    </button>
                  </motion.div>
                )}

                {/* Step 2: Place Details */}
                {step === 2 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <div className="space-y-4">
                      {/* Place Name */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Place Name *
                        </label>
                        <input
                          type="text"
                          value={placeName}
                          onChange={(e) => setPlaceName(e.target.value)}
                          placeholder="e.g., Central Park, Dog Beach, Pet Store"
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all"
                        />
                      </div>

                      {/* Pet Friendly Rating */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Is this place pet-friendly? *
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => setIsPetFriendly(true)}
                            className={`p-4 rounded-xl border-2 transition-all ${
                              isPetFriendly
                                ? 'border-green-500 bg-green-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center justify-center mb-2">
                              <FiThumbsUp className={`text-2xl ${isPetFriendly ? 'text-green-600' : 'text-gray-400'}`} />
                            </div>
                            <p className={`font-semibold ${isPetFriendly ? 'text-green-600' : 'text-gray-600'}`}>
                              Pet Friendly
                            </p>
                          </button>

                          <button
                            type="button"
                            onClick={() => setIsPetFriendly(false)}
                            className={`p-4 rounded-xl border-2 transition-all ${
                              !isPetFriendly
                                ? 'border-red-500 bg-red-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center justify-center mb-2">
                              <FiThumbsDown className={`text-2xl ${!isPetFriendly ? 'text-red-600' : 'text-gray-400'}`} />
                            </div>
                            <p className={`font-semibold ${!isPetFriendly ? 'text-red-600' : 'text-gray-600'}`}>
                              Not Pet Friendly
                            </p>
                          </button>
                        </div>
                      </div>

                      {/* Comment */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Your Experience *
                        </label>
                        <textarea
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          placeholder="Share details about your experience... Why is this place pet-friendly or not?"
                          rows="4"
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all resize-none"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Help others by sharing specific details
                        </p>
                      </div>

                      {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 flex items-center">
                          <FiAlertCircle className="mr-2" />
                          {error}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-3 pt-4">
                        <button
                          onClick={() => setStep(1)}
                          className="flex-1 border-2 border-gray-300 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                        >
                          Back
                        </button>
                        <button
                          onClick={handleSubmit}
                          disabled={loading}
                          className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-violet-700 hover:to-purple-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loading ? 'Tagging Place...' : 'Tag Place'}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PlaceTagging;
