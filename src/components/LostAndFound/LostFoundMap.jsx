import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FaDog, FaCat, FaMapMarkerAlt, FaPhone, FaEnvelope } from 'react-icons/fa';
import { FiAlertCircle, FiCheckCircle, FiClock } from 'react-icons/fi';
import { GoogleMap, Marker, InfoWindow } from '@react-google-maps/api';
import { ref as dbRef, onValue } from 'firebase/database';
import { database } from '../../firebase';
import useResponsive from '../../hooks/useResponsive';

// Helper function to get marker icon for lost pets
const getLostPetIcon = () => {
  return {
    path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
    fillColor: '#ef4444',
    fillOpacity: 1,
    strokeColor: '#ffffff',
    strokeWeight: 2,
    scale: 2,
    anchor: new window.google.maps.Point(12, 24),
  };
};

// Helper function to get marker icon for found pets
const getFoundPetIcon = () => {
  return {
    path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
    fillColor: '#10b981',
    fillOpacity: 1,
    strokeColor: '#ffffff',
    strokeWeight: 2,
    scale: 2,
    anchor: new window.google.maps.Point(12, 24),
  };
};

const LostFoundMap = ({ onPetClick }) => {
  const { isMobile } = useResponsive();
  const [lostPets, setLostPets] = useState([]);
  const [foundPets, setFoundPets] = useState([]);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [map, setMap] = useState(null);
  const [showLost, setShowLost] = useState(true);
  const [showFound, setShowFound] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState({ lat: 28.6139, lng: 77.2090 }); // Default: Delhi
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // Check if Google Maps is already loaded (from App.js)
  useEffect(() => {
    if (window.google && window.google.maps) {
      setIsMapLoaded(true);
    } else {
      // Poll for Google Maps to be loaded
      const checkInterval = setInterval(() => {
        if (window.google && window.google.maps) {
          setIsMapLoaded(true);
          clearInterval(checkInterval);
        }
      }, 100);
      
      // Cleanup after 10 seconds
      const timeout = setTimeout(() => {
        clearInterval(checkInterval);
        setIsMapLoaded(true); // Proceed anyway
      }, 10000);
      
      return () => {
        clearInterval(checkInterval);
        clearTimeout(timeout);
      };
    }
  }, []);

  useEffect(() => {
    // Get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(location);
          setMapCenter(location);
        },
        (error) => {
          console.log('Location access denied:', error);
        }
      );
    }

    // Fetch lost pets
    const lostPetsRef = dbRef(database, 'lostPets');
    const unsubscribeLost = onValue(lostPetsRef, (snapshot) => {
      if (!snapshot.exists()) {
        setLostPets([]);
        return;
      }

      const data = snapshot.val();
      const petsArray = Object.entries(data)
        .map(([id, pet]) => ({ id, ...pet }))
        .filter(pet => 
          pet.status === 'lost' && 
          pet.lastSeenLatitude && 
          pet.lastSeenLongitude
        );
      
      setLostPets(petsArray);
    });

    // Fetch found pets
    const foundPetsRef = dbRef(database, 'foundPets');
    const unsubscribeFound = onValue(foundPetsRef, (snapshot) => {
      if (!snapshot.exists()) {
        setFoundPets([]);
        return;
      }

      const data = snapshot.val();
      const petsArray = Object.entries(data)
        .map(([id, pet]) => ({ id, ...pet }))
        .filter(pet => 
          pet.status === 'found' && 
          pet.foundLatitude && 
          pet.foundLongitude
        );
      
      setFoundPets(petsArray);
    });

    return () => {
      unsubscribeLost();
      unsubscribeFound();
    };
  }, []);

  const onLoad = useCallback((map) => {
    setMap(map);
  }, []);

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Recently';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const filteredLostPets = showLost ? lostPets : [];
  const filteredFoundPets = showFound ? foundPets : [];

  const mapContainerStyle = {
    width: '100%',
    height: isMobile ? '70vh' : '700px'
  };

  const mapOptions = {
    disableDefaultUI: false,
    zoomControl: true,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: true,
    styles: [
      {
        featureType: 'poi',
        elementType: 'labels',
        stylers: [{ visibility: 'off' }]
      }
    ]
  };

  if (!isMapLoaded) {
    return (
      <div className="w-full h-96 bg-gray-100 rounded-2xl flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats & Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setShowLost(!showLost)}
          className={`px-4 py-2 rounded-xl font-semibold whitespace-nowrap transition-all flex items-center ${
            showLost
              ? 'bg-red-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <FiAlertCircle className="mr-2" />
          Lost Pets ({lostPets.length})
        </button>
        <button
          onClick={() => setShowFound(!showFound)}
          className={`px-4 py-2 rounded-xl font-semibold whitespace-nowrap transition-all flex items-center ${
            showFound
              ? 'bg-green-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <FiCheckCircle className="mr-2" />
          Found Pets ({foundPets.length})
        </button>
        {userLocation && (
          <motion.button
            onClick={() => map?.panTo(userLocation)}
            className="px-4 py-2 rounded-xl bg-blue-500 text-white font-semibold whitespace-nowrap"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            📍 My Location
          </motion.button>
        )}
      </div>

      {/* Map */}
      <div className="rounded-2xl overflow-hidden border-2 border-gray-200 shadow-lg">
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: isMobile ? '400px' : '600px' }}
          center={mapCenter}
          zoom={12}
          onLoad={onLoad}
          options={{
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: true,
            zoomControl: true,
            gestureHandling: 'greedy',
          }}
        >
          {/* User Location */}
          {userLocation && (
            <Marker
              position={userLocation}
              icon={{
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 10,
                fillColor: '#3b82f6',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 3,
              }}
              title="Your Location"
            />
          )}

          {/* Lost Pet Markers */}
          {filteredLostPets.map((pet) => (
            <Marker
              key={`lost-${pet.id}`}
              position={{ 
                lat: pet.lastSeenLatitude, 
                lng: pet.lastSeenLongitude 
              }}
              icon={getLostPetIcon()}
              onClick={() => setSelectedMarker({ ...pet, type: 'lost' })}
            />
          ))}

          {/* Found Pet Markers */}
          {filteredFoundPets.map((pet) => (
            <Marker
              key={`found-${pet.id}`}
              position={{ 
                lat: pet.foundLatitude, 
                lng: pet.foundLongitude 
              }}
              icon={getFoundPetIcon()}
              onClick={() => setSelectedMarker({ ...pet, type: 'found' })}
            />
          ))}

          {/* Info Window */}
          {selectedMarker && (
            <InfoWindow
              position={
                selectedMarker.type === 'lost'
                  ? { lat: selectedMarker.lastSeenLatitude, lng: selectedMarker.lastSeenLongitude }
                  : { lat: selectedMarker.foundLatitude, lng: selectedMarker.foundLongitude }
              }
              onCloseClick={() => setSelectedMarker(null)}
            >
              <div className="p-2 max-w-sm" style={{ maxWidth: '300px' }}>
                {/* Pet Image */}
                {selectedMarker.photos && selectedMarker.photos.length > 0 && (
                  <img 
                    src={selectedMarker.photos[0].base64 || selectedMarker.photos[0]} 
                    alt="Pet"
                    className="w-full h-40 object-cover rounded-lg mb-3"
                  />
                )}

                {/* Header */}
                <div className="flex items-center gap-2 mb-3">
                  {selectedMarker.type === 'lost' ? (
                    <div className="flex items-center gap-2">
                      <FiAlertCircle className="text-red-600 text-xl flex-shrink-0" />
                      <h3 className="font-bold text-lg text-gray-800">{selectedMarker.petName}</h3>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <FiCheckCircle className="text-green-600 text-xl flex-shrink-0" />
                      <h3 className="font-bold text-lg text-gray-800">Found {selectedMarker.petType}</h3>
                    </div>
                  )}
                </div>

                {/* Pet Details */}
                <div className="space-y-2 mb-3">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    {selectedMarker.petType === 'Dog' ? <FaDog /> : <FaCat />}
                    <span className="font-medium">{selectedMarker.breed || selectedMarker.approximateBreed || 'Unknown breed'}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <FaMapMarkerAlt className="text-violet-600 flex-shrink-0" />
                    <span>
                      {selectedMarker.type === 'lost' 
                        ? selectedMarker.lastSeenLocation 
                        : selectedMarker.foundLocation}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FiClock className="flex-shrink-0" />
                    <span>
                      {selectedMarker.type === 'lost' ? 'Last seen' : 'Found'}: {formatDate(selectedMarker.createdAt)}
                    </span>
                  </div>

                  {selectedMarker.type === 'lost' && selectedMarker.reward && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-2 py-1 text-sm">
                      <span className="font-bold text-yellow-800">💰 Reward: ${selectedMarker.rewardAmount}</span>
                    </div>
                  )}

                  {selectedMarker.type === 'lost' && selectedMarker.microchipped && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg px-2 py-1 text-sm text-blue-800">
                      🔖 Microchipped
                    </div>
                  )}
                </div>

                {/* Contact Info */}
                <div className="border-t pt-3 space-y-1">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <FaPhone className="text-violet-600" />
                    <span>{selectedMarker.contactPhone || selectedMarker.ownerPhone}</span>
                  </div>
                  {selectedMarker.contactEmail && (
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <FaEnvelope className="text-violet-600" />
                      <span className="truncate">{selectedMarker.contactEmail}</span>
                    </div>
                  )}
                </div>

                {/* View Details Button */}
                <button
                  className={`mt-3 w-full py-2 rounded-lg font-medium text-white transition-colors ${
                    selectedMarker.type === 'lost'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                  onClick={() => {
                    setSelectedMarker(null);
                    if (onPetClick) {
                      onPetClick(selectedMarker);
                    }
                  }}
                >
                  View Full Details
                </button>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </div>

      {/* Map Legend */}
      <div className="bg-gradient-to-r from-violet-50 to-purple-50 border-2 border-violet-200 rounded-2xl p-4">
        <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
          <FaMapMarkerAlt className="text-violet-600" />
          Map Legend
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-red-500 border-2 border-white shadow-md flex-shrink-0"></div>
            <span className="text-gray-700"><strong>Red:</strong> Lost pets</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-green-500 border-2 border-white shadow-md flex-shrink-0"></div>
            <span className="text-gray-700"><strong>Green:</strong> Found pets</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-500 border-2 border-white shadow-md flex-shrink-0"></div>
            <span className="text-gray-700"><strong>Blue:</strong> Your location</span>
          </div>
        </div>
      </div>

      {/* Map Tips */}
      {(lostPets.length > 0 || foundPets.length > 0) && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4">
          <div className="flex gap-3">
            <FiAlertCircle className="text-blue-600 text-xl flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-bold mb-1">💡 Map Tips:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Click on markers to see pet details</li>
                <li>Use filter buttons to show/hide lost or found pets</li>
                <li>Click "My Location" to center map on your position</li>
                <li>Zoom and pan to explore different areas</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LostFoundMap;
