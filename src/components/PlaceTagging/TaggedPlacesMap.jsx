import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FiMapPin, FiThumbsUp, FiThumbsDown, FiUser, FiClock } from 'react-icons/fi';
import { FaPaw } from 'react-icons/fa';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { ref as dbRef, onValue } from 'firebase/database';
import { database } from '../../firebase';
import * as geofire from 'geofire-common';

const libraries = ['places'];

// Helper function to get marker icon based on place type
const getMarkerIcon = (placeType, isPetFriendly) => {
  const color = isPetFriendly ? '#10b981' : '#ef4444'; // green or red
  const strokeColor = '#ffffff';
  
  // SVG paths for different place types
  const icons = {
    park: {
      // Tree/Park icon
      path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm-1 13v-3H9v3H7v-3c0-1.1.9-2 2-2h2V8c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1v3h2c1.1 0 2 .9 2 2v3h-2v-3h-2v3h-2z',
      scale: 1.8,
    },
    shelter: {
      // House/Shelter icon
      path: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
      scale: 1.8,
    },
    vet: {
      // Medical cross icon  
      path: 'M19 3H5c-1.1 0-1.99.9-1.99 2L3 19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 11h-4v4h-4v-4H6v-4h4V6h4v4h4v4z',
      scale: 1.8,
    },
    hospital: {
      // Hospital icon
      path: 'M19 3H5c-1.1 0-1.99.9-1.99 2L3 19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 11h-4v4h-4v-4H6v-4h4V6h4v4h4v4z',
      scale: 1.8,
    },
    store: {
      // Shopping bag icon
      path: 'M18 6h-2c0-2.21-1.79-4-4-4S8 3.79 8 6H6c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-6-2c1.1 0 2 .9 2 2h-4c0-1.1.9-2 2-2zm6 16H6V8h2v2c0 .55.45 1 1 1s1-.45 1-1V8h4v2c0 .55.45 1 1 1s1-.45 1-1V8h2v12z',
      scale: 1.8,
    },
    cafe: {
      // Coffee cup icon
      path: 'M20 3H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.11 0 2-.9 2-2V5c0-1.11-.89-2-2-2zm0 5h-2V5h2v3zM2 21h18v-2H2v2z',
      scale: 1.8,
    },
    grooming: {
      // Scissors icon
      path: 'M9.64 7.64c.23-.5.36-1.05.36-1.64 0-2.21-1.79-4-4-4S2 3.79 2 6s1.79 4 4 4c.59 0 1.14-.13 1.64-.36L10 12l-2.36 2.36C7.14 14.13 6.59 14 6 14c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4c0-.59-.13-1.14-.36-1.64L12 14l7 7h3v-1L9.64 7.64zM6 8c-1.1 0-2-.89-2-2s.9-2 2-2 2 .89 2 2-.9 2-2 2zm0 12c-1.1 0-2-.89-2-2s.9-2 2-2 2 .89 2 2-.9 2-2 2zm6-7.5c-.28 0-.5-.22-.5-.5s.22-.5.5-.5.5.22.5.5-.22.5-.5.5zM19 3l-6 6 2 2 7-7V3z',
      scale: 1.6,
    },
    other: {
      // Generic pin icon
      path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
      scale: 1.8,
    },
  };

  const iconData = icons[placeType] || icons.other;
  
  return {
    path: iconData.path,
    fillColor: color,
    fillOpacity: 1,
    strokeColor: strokeColor,
    strokeWeight: 2,
    scale: iconData.scale,
    anchor: new window.google.maps.Point(12, 24),
  };
};

const TaggedPlacesMap = ({ userLocation, radius = 5 }) => {
  const [places, setPlaces] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [map, setMap] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'friendly', 'not-friendly'

  console.log('TaggedPlacesMap - userLocation:', userLocation, 'radius:', radius);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries,
    preventGoogleFontsLoading: true,
    async: true,
    defer: true,
  });

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

  if (!isLoaded) {
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
              icon={getMarkerIcon(place.placeType || 'other', place.isPetFriendly)}
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
