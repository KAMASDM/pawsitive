import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FiMapPin, FiThumbsUp, FiThumbsDown, FiUser, FiClock } from 'react-icons/fi';
import { FaPaw } from 'react-icons/fa';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { ref as dbRef, onValue } from 'firebase/database';
import { database } from '../../firebase';
import * as geofire from 'geofire-common';

const libraries = ['places'];

const TaggedPlacesMap = ({ userLocation, radius = 5 }) => {
  const [places, setPlaces] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [map, setMap] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'friendly', 'not-friendly'

  console.log('TaggedPlacesMap - userLocation:', userLocation, 'radius:', radius);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
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
              icon={{
                path: 'M256 224c-79.37 0-191.1 122.7-191.1 200.2C64.02 459.1 90.76 480 135.8 480C184.6 480 216.9 454.9 256 454.9C295.5 454.9 327.9 480 376.2 480c44.1 0 71.74-20.88 71.74-55.75C447.1 346.8 335.4 224 256 224zM108.8 211.4c-10.37-34.62-1.383-73.48 21.02-101.1c-22.39 4.25-46.04 22.44-57.93 50.86C60.84 187.8 69.81 226.6 92.23 255.1C103.1 261.6 120.3 244.3 108.8 211.4zM193.5 190.6c30.87-8.125 46.37-49.1 34.87-93.37s-46.5-71.1-77.49-63.87c-30.87 8.125-46.37 49.1-34.87 93.37C127.5 170.1 162.5 198.8 193.5 190.6zM474.9 161.3c-11.88-28.43-35.54-46.62-57.93-50.86c22.4 27.63 31.39 66.48 21.02 101.1c-11.52 32.9 5.641 50.16 16.62 43.66C476.6 226.6 485.6 187.8 474.9 161.3zM318.5 190.6c30.1 8.125 66.9-20.5 77.49-63.87c11.5-43.37-3.1-85.25-34.87-93.37c-30.1-8.125-66.9 20.5-77.49 63.87C272.1 140.6 287.6 182.5 318.5 190.6z',
                fillColor: place.isPetFriendly ? '#10b981' : '#ef4444',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 2,
                scale: 0.06,
                anchor: new window.google.maps.Point(256, 480),
              }}
            />
          ))}

          {/* Info Window */}
          {selectedPlace && (
            <InfoWindow
              position={selectedPlace.location}
              onCloseClick={() => setSelectedPlace(null)}
            >
              <div className="p-2 max-w-xs">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-gray-900 text-lg pr-2">{selectedPlace.placeName}</h3>
                  {selectedPlace.isPetFriendly ? (
                    <div className="bg-green-100 text-green-700 px-2 py-1 rounded-lg text-xs font-semibold flex items-center whitespace-nowrap">
                      <FiThumbsUp className="mr-1" /> Friendly
                    </div>
                  ) : (
                    <div className="bg-red-100 text-red-700 px-2 py-1 rounded-lg text-xs font-semibold flex items-center whitespace-nowrap">
                      <FiThumbsDown className="mr-1" /> Not Friendly
                    </div>
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-gray-700">{selectedPlace.comment}</p>
                  </div>

                  <div className="flex items-center text-gray-600 text-xs">
                    <FiUser className="mr-1" />
                    <span>{selectedPlace.userEmail?.split('@')[0]}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center">
                      <FiClock className="mr-1" />
                      {formatTimestamp(selectedPlace.createdAt)}
                    </div>
                    {selectedPlace.distance && (
                      <div className="flex items-center">
                        <FiMapPin className="mr-1" />
                        {selectedPlace.distance.toFixed(2)} km away
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
