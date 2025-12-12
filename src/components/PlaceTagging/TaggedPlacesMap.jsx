import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FiMapPin, FiThumbsUp, FiThumbsDown, FiUser, FiClock } from 'react-icons/fi';
import { FaPaw } from 'react-icons/fa';
import { GoogleMap, Marker, InfoWindow } from '@react-google-maps/api';
import { ref as dbRef, onValue } from 'firebase/database';
import { database } from '../../firebase';
import * as geofire from 'geofire-common';

// Helper function to get marker icon based on pet friendliness
const getMarkerIcon = (isPetFriendly) => {
  const iconUrl = isPetFriendly 
    ? '/paw-marker-green.svg' 
    : '/paw-marker-red.svg';
  
  return {
    url: iconUrl,
    scaledSize: new window.google.maps.Size(40, 53),
    anchor: new window.google.maps.Point(20, 53),
  };
};

const TaggedPlacesMap = ({ userLocation, radius = 5 }) => {
  const [places, setPlaces] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [map, setMap] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'friendly', 'not-friendly'
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  console.log('TaggedPlacesMap - userLocation:', userLocation, 'radius:', radius);

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
    console.log('Setting up Firebase listener for taggedPlaces...');
    const placesRef = dbRef(database, 'taggedPlaces');

    const unsubscribe = onValue(placesRef, (snapshot) => {
      console.log('TaggedPlacesMap - Snapshot exists:', snapshot.exists());
      
      if (!snapshot.exists()) {
        setPlaces([]);
        console.log('No tagged places found in database');
        return;
      }

      const placesData = [];
      snapshot.forEach((childSnapshot) => {
        const place = {
          id: childSnapshot.key,
          ...childSnapshot.val(),
        };
        console.log('Found place:', place);

        // Filter by distance if user location available
        if (userLocation && place.location) {
          const distanceInKm = geofire.distanceBetween(
            [place.location.lat, place.location.lng],
            [userLocation.lat, userLocation.lng]
          );
          console.log(`Distance to ${place.placeName}:`, distanceInKm, 'km');

          if (distanceInKm <= radius) {
            place.distance = distanceInKm;
            placesData.push(place);
          } else {
            console.log(`Place ${place.placeName} is too far (${distanceInKm.toFixed(2)} km > ${radius} km)`);
          }
        } else {
          // If no user location, show all places
          console.log('No user location or place location, adding place anyway');
          placesData.push(place);
        }
      });

      console.log('Total places found within radius:', placesData.length);
      setPlaces(placesData);
    }, (error) => {
      console.error('Error loading tagged places:', error);
    });

    return () => unsubscribe();
  }, [userLocation, radius]);

  const onLoad = useCallback((map) => {
    setMap(map);
  }, []);

  const filteredPlaces = places.filter((place) => {
    if (filter === 'friendly') return place.isPetFriendly === true;
    if (filter === 'not-friendly') return place.isPetFriendly === false;
    return true;
  });

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Just now';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
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
      {/* Filter Buttons */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-xl font-semibold whitespace-nowrap transition-all ${
            filter === 'all'
              ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All Places ({places.length})
        </button>
        <button
          onClick={() => setFilter('friendly')}
          className={`px-4 py-2 rounded-xl font-semibold whitespace-nowrap transition-all flex items-center ${
            filter === 'friendly'
              ? 'bg-green-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <FiThumbsUp className="mr-2" />
          Pet Friendly ({places.filter(p => p.isPetFriendly).length})
        </button>
        <button
          onClick={() => setFilter('not-friendly')}
          className={`px-4 py-2 rounded-xl font-semibold whitespace-nowrap transition-all flex items-center ${
            filter === 'not-friendly'
              ? 'bg-red-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <FiThumbsDown className="mr-2" />
          Not Pet Friendly ({places.filter(p => !p.isPetFriendly).length})
        </button>
      </div>

      {/* Map */}
      <div className="rounded-2xl overflow-hidden border-2 border-gray-200 shadow-lg">
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '500px' }}
          center={userLocation || { lat: 0, lng: 0 }}
          zoom={13}
          onLoad={onLoad}
          options={{
            disableDefaultUI: false,
            zoomControl: true,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
            gestureHandling: 'greedy',
          }}
        >
          {/* User Location */}
          {userLocation && (
            <Marker
              position={userLocation}
              icon={{
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: '#3b82f6',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 3,
              }}
            />
          )}

          {/* Tagged Places */}
          {filteredPlaces.map((place) => (
            <Marker
              key={place.id}
              position={place.location}
              onClick={() => setSelectedPlace(place)}
              icon={getMarkerIcon(place.isPetFriendly)}
            />
          ))}

          {/* Info Window */}
          {selectedPlace && selectedPlace.location && (
            <InfoWindow
              position={selectedPlace.location}
              onCloseClick={() => setSelectedPlace(null)}
              options={{
                pixelOffset: new window.google.maps.Size(0, -40),
                maxWidth: 300,
              }}
            >
              <div style={{ padding: '8px', maxWidth: '280px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontWeight: 'bold', color: '#111827', fontSize: '16px', margin: 0, paddingRight: '8px' }}>
                      {selectedPlace.placeName}
                    </h3>
                    {selectedPlace.placeType && (
                      <div style={{ 
                        backgroundColor: '#ede9fe', 
                        color: '#6b21a8', 
                        padding: '2px 8px', 
                        borderRadius: '6px', 
                        fontSize: '10px', 
                        fontWeight: '600',
                        display: 'inline-block',
                        marginTop: '4px'
                      }}>
                        {(() => {
                          const types = {
                            park: '🌳 Park',
                            shelter: '🏠 Shelter',
                            vet: '🏥 Vet Clinic',
                            store: '🛍️ Pet Store',
                            cafe: '☕ Café',
                            grooming: '✂️ Grooming',
                            hospital: '⚕️ Hospital',
                            other: '📍 Other'
                          };
                          return types[selectedPlace.placeType] || '📍 Other';
                        })()}
                      </div>
                    )}
                  </div>
                  {selectedPlace.isPetFriendly ? (
                    <div style={{ 
                      backgroundColor: '#dcfce7', 
                      color: '#15803d', 
                      padding: '4px 8px', 
                      borderRadius: '8px', 
                      fontSize: '11px', 
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      whiteSpace: 'nowrap',
                      flexShrink: 0
                    }}>
                      ✓ Friendly
                    </div>
                  ) : (
                    <div style={{ 
                      backgroundColor: '#fee2e2', 
                      color: '#b91c1c', 
                      padding: '4px 8px', 
                      borderRadius: '8px', 
                      fontSize: '11px', 
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      whiteSpace: 'nowrap',
                      flexShrink: 0
                    }}>
                      ✗ Not Friendly
                    </div>
                  )}
                </div>

                <div style={{ marginBottom: '8px' }}>
                  <div style={{ 
                    backgroundColor: '#f9fafb', 
                    borderRadius: '8px', 
                    padding: '8px',
                    marginBottom: '8px'
                  }}>
                    <p style={{ 
                      color: '#374151', 
                      fontSize: '13px', 
                      margin: 0,
                      lineHeight: '1.5'
                    }}>
                      {selectedPlace.comment || 'No comment provided'}
                    </p>
                  </div>

                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    color: '#6b7280', 
                    fontSize: '11px',
                    marginBottom: '4px'
                  }}>
                    <span style={{ marginRight: '4px' }}>👤</span>
                    <span>{selectedPlace.userEmail?.split('@')[0] || 'Anonymous'}</span>
                  </div>

                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    fontSize: '11px', 
                    color: '#9ca3af'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ marginRight: '4px' }}>🕐</span>
                      <span>{formatTimestamp(selectedPlace.createdAt)}</span>
                    </div>
                    {selectedPlace.distance && (
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ marginRight: '4px' }}>📍</span>
                        <span>{selectedPlace.distance.toFixed(2)} km away</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </div>

      {/* Places List */}
      {filteredPlaces.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-bold text-gray-900 text-lg">Tagged Places Nearby</h3>
          <div className="grid gap-3 max-h-96 overflow-y-auto">
            {filteredPlaces.map((place) => (
              <motion.div
                key={place.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-violet-300 transition-all cursor-pointer"
                onClick={() => {
                  setSelectedPlace(place);
                  if (map) {
                    map.panTo(place.location);
                    map.setZoom(16);
                  }
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900">{place.placeName}</h4>
                    {place.distance && (
                      <p className="text-xs text-gray-500 flex items-center mt-1">
                        <FiMapPin className="mr-1" />
                        {place.distance.toFixed(2)} km away
                      </p>
                    )}
                  </div>
                  {place.isPetFriendly ? (
                    <div className="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-xs font-semibold flex items-center">
                      <FiThumbsUp className="mr-1" /> Friendly
                    </div>
                  ) : (
                    <div className="bg-red-100 text-red-700 px-3 py-1 rounded-lg text-xs font-semibold flex items-center">
                      <FiThumbsDown className="mr-1" /> Not Friendly
                    </div>
                  )}
                </div>

                <p className="text-sm text-gray-600 mb-2">{place.comment}</p>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center">
                    <FiUser className="mr-1" />
                    {place.userEmail?.split('@')[0]}
                  </div>
                  <div className="flex items-center">
                    <FiClock className="mr-1" />
                    {formatTimestamp(place.createdAt)}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {filteredPlaces.length === 0 && (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <FaPaw className="text-3xl text-gray-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">No Places Tagged Yet</h3>
          <p className="text-gray-600 text-sm">
            Be the first to tag a pet-friendly place in your area!
          </p>
        </div>
      )}
    </div>
  );
};

export default TaggedPlacesMap;
