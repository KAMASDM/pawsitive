import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleMap, Marker, Circle, DirectionsRenderer, useJsApiLoader } from '@react-google-maps/api';
import { FaArrowLeft, FaPhone, FaStar, FaMapMarkerAlt, FaClock, FaGlobe, FaDirections, FaHeart, FaShare, FaRegHeart, FaMapPin, FaRoute } from 'react-icons/fa';

const libraries = ['places'];

const ResourceDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [resource, setResource] = useState(null);
    const [placeDetails, setPlaceDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userLocation, setUserLocation] = useState(null);
    const [directions, setDirections] = useState(null);
    const [showDirections, setShowDirections] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [isFavorite, setIsFavorite] = useState(false);
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const [travelMode, setTravelMode] = useState('DRIVING');

    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
        libraries,
        preventGoogleFontsLoading: true,
        async: true,
        defer: true,
    });

    const mapContainerStyle = {
        width: '100%',
        height: '400px',
        borderRadius: '16px'
    };

    // Get user location
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                },
                (error) => console.error('Error getting location:', error)
            );
        }
    }, []);

    const fetchPlaceDetails = useCallback((placeId) => {
        if (!window.google || !isLoaded) {
            console.log('Google Maps not loaded yet');
            return;
        }

        const service = new window.google.maps.places.PlacesService(
            document.createElement('div')
        );

        const request = {
            placeId: placeId,
            fields: [
                'name',
                'formatted_address',
                'formatted_phone_number',
                'international_phone_number',
                'website',
                'rating',
                'user_ratings_total',
                'reviews',
                'photos',
                'opening_hours',
                'geometry',
                'types',
                'price_level',
                'url',
                'vicinity',
                'editorial_summary'
            ]
        };

        service.getDetails(request, (place, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK) {
                setPlaceDetails(place);
                if (!resource) {
                    setResource({
                        place_id: placeId,
                        name: place.name,
                        formatted_address: place.formatted_address,
                        geometry: place.geometry,
                        rating: place.rating,
                        user_ratings_total: place.user_ratings_total
                    });
                }
            }
            setLoading(false);
        });
    }, [resource, isLoaded]);

    // Load resource from location state or fetch from Places API
    useEffect(() => {
        if (!isLoaded) return;
        
        if (location.state?.resource) {
            setResource(location.state.resource);
            fetchPlaceDetails(location.state.resource.place_id);
        } else {
            // If no state, fetch from Places API using place_id
            fetchPlaceDetails(id);
        }
    }, [id, location.state, isLoaded, fetchPlaceDetails]);

    // Calculate directions
    const calculateDirections = useCallback(() => {
        console.log('calculateDirections called');
        console.log('userLocation:', userLocation);
        console.log('resource:', resource);
        console.log('resource.geometry:', resource?.geometry);
        console.log('placeDetails:', placeDetails);
        console.log('placeDetails.geometry:', placeDetails?.geometry);
        console.log('isLoaded:', isLoaded);
        console.log('window.google:', window.google);
        
        // Use placeDetails.geometry if resource.geometry is not available
        const geometry = resource?.geometry || placeDetails?.geometry;
        
        if (!userLocation || !geometry?.location) {
            console.log('Missing userLocation or geometry location');
            console.log('userLocation:', userLocation);
            console.log('geometry:', geometry);
            return;
        }

        if (!window.google || !isLoaded) {
            console.log('Google Maps not loaded');
            return;
        }

        const directionsService = new window.google.maps.DirectionsService();

        const resourceLat = typeof geometry.location.lat === 'function' 
            ? geometry.location.lat() 
            : geometry.location.lat;
        const resourceLng = typeof geometry.location.lng === 'function' 
            ? geometry.location.lng() 
            : geometry.location.lng;

        console.log('Requesting directions:', {
            origin: userLocation,
            destination: { lat: resourceLat, lng: resourceLng },
            travelMode: travelMode
        });

        const request = {
            origin: userLocation,
            destination: {
                lat: resourceLat,
                lng: resourceLng
            },
            travelMode: window.google.maps.TravelMode[travelMode]
        };

        directionsService.route(request, (result, status) => {
            console.log('Directions result:', status, result);
            if (status === 'OK') {
                setDirections(result);
                setShowDirections(true);
                console.log('Directions set successfully');
            } else {
                console.error('Directions request failed:', status);
            }
        });
    }, [userLocation, resource, placeDetails, travelMode, isLoaded]);

    // Automatically show route on page load with DRIVING mode
    useEffect(() => {
        if (userLocation && (resource || placeDetails) && isLoaded && !directions) {
            console.log('Auto-calculating directions on page load');
            calculateDirections();
        }
    }, [userLocation, resource, placeDetails, isLoaded, directions, calculateDirections]);

    const calculateDistance = () => {
        const geometry = resource?.geometry || placeDetails?.geometry;
        if (!userLocation || !geometry?.location) return null;

        const R = 6371; // Earth's radius in km
        const resourceLat = typeof geometry.location.lat === 'function' 
            ? geometry.location.lat() 
            : geometry.location.lat;
        const resourceLng = typeof geometry.location.lng === 'function' 
            ? geometry.location.lng() 
            : geometry.location.lng;
            
        const dLat = toRad(resourceLat - userLocation.lat);
        const dLon = toRad(resourceLng - userLocation.lng);
        const lat1 = toRad(userLocation.lat);
        const lat2 = toRad(resourceLat);

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        return distance.toFixed(1);
    };

    const toRad = (value) => (value * Math.PI) / 180;

    const isOpenNow = () => {
        if (!placeDetails?.opening_hours) return null;
        return placeDetails.opening_hours.isOpen?.() || placeDetails.opening_hours.open_now;
    };

    const handleShare = async () => {
        const shareData = {
            title: resource?.name,
            text: `Check out ${resource?.name} on Pawppy!`,
            url: window.location.href
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                // Fallback: Copy to clipboard
                await navigator.clipboard.writeText(window.location.href);
                alert('Link copied to clipboard!');
            }
        } catch (err) {
            console.error('Error sharing:', err);
        }
    };

    const toggleFavorite = () => {
        setIsFavorite(!isFavorite);
        // TODO: Save to Firebase user favorites
    };

    if (loadError) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-violet-50 via-lavender-50 to-indigo-50 flex items-center justify-center">
                <div className="text-center p-8">
                    <div className="text-5xl mb-4">😥</div>
                    <h3 className="text-xl font-bold text-violet-800 mb-2">Error loading maps</h3>
                    <button
                        onClick={() => navigate(-1)}
                        className="mt-4 px-6 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    if (!isLoaded || loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-violet-50 via-lavender-50 to-indigo-50 flex items-center justify-center">
                <div className="text-center">
                    <img src="/PawPrints.gif" alt="Loading" width="200px" className="mx-auto" />
                    <p className="text-violet-700 font-medium mt-4">Loading resource details...</p>
                </div>
            </div>
        );
    }

    if (!resource) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-violet-50 via-lavender-50 to-indigo-50 flex items-center justify-center">
                <div className="text-center p-8">
                    <div className="text-5xl mb-4">😥</div>
                    <h3 className="text-xl font-bold text-violet-800 mb-2">Resource not found</h3>
                    <button
                        onClick={() => navigate('/resource')}
                        className="mt-4 px-6 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
                    >
                        Back to Resources
                    </button>
                </div>
            </div>
        );
    }

    // Handle both serialized (plain object) and Google Maps API geometry
    const geometry = resource.geometry || placeDetails?.geometry;
    const mapCenter = geometry?.location
        ? { 
            lat: typeof geometry.location.lat === 'function' 
                ? geometry.location.lat() 
                : geometry.location.lat,
            lng: typeof geometry.location.lng === 'function' 
                ? geometry.location.lng() 
                : geometry.location.lng
        }
        : userLocation || { lat: 0, lng: 0 };

    const distance = calculateDistance();

    return (
        <div className="min-h-screen bg-gradient-to-br from-violet-50 via-lavender-50 to-indigo-50 py-6 px-4 relative overflow-hidden">
            {/* Decorative Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    className="absolute top-10 right-10 w-20 h-20 bg-violet-200 rounded-full opacity-20"
                    animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                />
                <motion.div
                    className="absolute bottom-20 left-5 w-16 h-16 bg-indigo-200 rounded-full opacity-25"
                    animate={{ y: [0, -20, 0], x: [0, 10, 0] }}
                    transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                />
            </div>

            <div className="max-w-6xl mx-auto relative z-10">
                {/* Breadcrumb Navigation */}
                <motion.div
                    className="mb-4 flex items-center gap-2 text-sm"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <button
                        onClick={() => navigate('/resource')}
                        className="text-violet-600 hover:text-violet-800 font-medium transition-colors"
                    >
                        Resources
                    </button>
                    <span className="text-gray-400">/</span>
                    <span className="text-gray-600 truncate max-w-md">{resource.name}</span>
                </motion.div>

                {/* Header Actions */}
                <motion.div
                    className="flex items-center justify-between mb-6"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-md rounded-full shadow-lg hover:shadow-xl transition-all duration-300 text-violet-700 font-medium"
                    >
                        <FaArrowLeft /> Back
                    </button>
                    <div className="flex gap-2">
                        <button
                            onClick={toggleFavorite}
                            className="p-3 bg-white/80 backdrop-blur-md rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                        >
                            {isFavorite ? <FaHeart className="text-red-500 text-xl" /> : <FaRegHeart className="text-violet-700 text-xl" />}
                        </button>
                        <button
                            onClick={handleShare}
                            className="p-3 bg-white/80 backdrop-blur-md rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                        >
                            <FaShare className="text-violet-700 text-xl" />
                        </button>
                    </div>
                </motion.div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Details */}
                    <motion.div
                        className="lg:col-span-2 space-y-6"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        {/* Hero Card */}
                        <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl p-6 border border-violet-100">
                            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                                <div>
                                    <h1 className="text-3xl md:text-4xl font-bold text-violet-900 mb-2">
                                        {resource.name}
                                    </h1>
                                    <div className="flex items-center gap-3 flex-wrap">
                                        {resource.rating && (
                                            <div className="flex items-center gap-1">
                                                <FaStar className="text-yellow-500" />
                                                <span className="font-semibold">{resource.rating}</span>
                                                <span className="text-gray-500 text-sm">
                                                    ({resource.user_ratings_total || placeDetails?.user_ratings_total} reviews)
                                                </span>
                                            </div>
                                        )}
                                        {isOpenNow() !== null && (
                                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${isOpenNow() ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {isOpenNow() ? '🟢 Open Now' : '🔴 Closed'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {distance && (
                                    <div className="bg-gradient-to-br from-violet-500 to-indigo-500 text-white px-4 py-2 rounded-2xl text-center shadow-lg">
                                        <div className="text-2xl font-bold">{distance} km</div>
                                        <div className="text-xs opacity-90">away</div>
                                    </div>
                                )}
                            </div>

                            {/* Photo Gallery */}
                            {placeDetails?.photos && placeDetails.photos.length > 0 && (
                                <div className="mb-6">
                                    <div className="grid grid-cols-4 gap-2">
                                        {placeDetails.photos.slice(0, 4).map((photo, index) => (
                                            <div
                                                key={index}
                                                className="aspect-square rounded-xl overflow-hidden cursor-pointer hover:scale-105 transition-transform duration-300 shadow-lg"
                                                onClick={() => setSelectedPhoto(photo.getUrl())}
                                            >
                                                <img
                                                    src={photo.getUrl({ maxWidth: 400 })}
                                                    alt={`${resource.name} ${index + 1}`}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Contact Info */}
                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <FaMapMarkerAlt className="text-violet-600 mt-1 flex-shrink-0" />
                                    <p className="text-gray-700">{resource.formatted_address}</p>
                                </div>
                                {placeDetails?.formatted_phone_number && (
                                    <div className="flex items-center gap-3">
                                        <FaPhone className="text-violet-600 flex-shrink-0" />
                                        <a href={`tel:${placeDetails.formatted_phone_number}`} className="text-violet-700 hover:underline">
                                            {placeDetails.formatted_phone_number}
                                        </a>
                                    </div>
                                )}
                                {placeDetails?.website && (
                                    <div className="flex items-center gap-3">
                                        <FaGlobe className="text-violet-600 flex-shrink-0" />
                                        <a href={placeDetails.website} target="_blank" rel="noopener noreferrer" className="text-violet-700 hover:underline truncate">
                                            {placeDetails.website}
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-violet-100 overflow-hidden">
                            <div className="flex border-b border-violet-100">
                                {['overview', 'reviews', 'hours'].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`flex-1 px-6 py-4 font-medium capitalize transition-all duration-300 ${activeTab === tab
                                                ? 'bg-gradient-to-r from-violet-500 to-indigo-500 text-white'
                                                : 'text-violet-700 hover:bg-violet-50'
                                            }`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>

                            <div className="p-6">
                                {/* Overview Tab */}
                                {activeTab === 'overview' && (
                                    <div className="space-y-4">
                                        {/* Business Name */}
                                        <div>
                                            <h3 className="text-2xl font-bold text-violet-900 mb-2">{resource.name}</h3>
                                            {placeDetails?.rating && (
                                                <div className="flex items-center gap-2 mb-3">
                                                    <div className="flex items-center gap-1">
                                                        <FaStar className="text-yellow-500" />
                                                        <span className="font-semibold text-lg">{placeDetails.rating}</span>
                                                    </div>
                                                    <span className="text-gray-500">
                                                        ({placeDetails.user_ratings_total || resource.user_ratings_total} reviews)
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Business Description / Editorial Summary */}
                                        {placeDetails?.editorial_summary?.overview && (
                                            <div className="bg-violet-50 border-l-4 border-violet-500 p-4 rounded-r-lg">
                                                <p className="text-gray-700 leading-relaxed">
                                                    {placeDetails.editorial_summary.overview}
                                                </p>
                                            </div>
                                        )}

                                        {/* About this place */}
                                        <div>
                                            <h4 className="text-lg font-semibold text-violet-900 mb-3">Details</h4>
                                            
                                            {/* Business Types */}
                                            {placeDetails?.types && (
                                                <div className="mb-4">
                                                    <p className="text-sm font-medium text-gray-600 mb-2">Categories:</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {placeDetails.types.slice(0, 5).map((type, index) => (
                                                            <span key={index} className="px-3 py-1 bg-violet-100 text-violet-700 rounded-full text-sm capitalize">
                                                                {type.replace(/_/g, ' ')}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Price Level */}
                                            {placeDetails?.price_level && (
                                                <div className="mb-4">
                                                    <p className="text-sm font-medium text-gray-600 mb-1">Price Level:</p>
                                                    <p className="text-xl text-violet-700 font-semibold">
                                                        {'$'.repeat(placeDetails.price_level)}
                                                    </p>
                                                </div>
                                            )}

                                            {/* Address */}
                                            <div className="mb-4">
                                                <p className="text-sm font-medium text-gray-600 mb-1">Address:</p>
                                                <p className="text-gray-700">{resource.formatted_address || resource.vicinity}</p>
                                            </div>

                                            {/* Phone */}
                                            {placeDetails?.formatted_phone_number && (
                                                <div className="mb-4">
                                                    <p className="text-sm font-medium text-gray-600 mb-1">Phone:</p>
                                                    <a 
                                                        href={`tel:${placeDetails.formatted_phone_number}`} 
                                                        className="text-violet-700 hover:underline font-medium"
                                                    >
                                                        {placeDetails.formatted_phone_number}
                                                    </a>
                                                </div>
                                            )}

                                            {/* Website */}
                                            {placeDetails?.website && (
                                                <div className="mb-4">
                                                    <p className="text-sm font-medium text-gray-600 mb-1">Website:</p>
                                                    <a 
                                                        href={placeDetails.website} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer" 
                                                        className="text-violet-700 hover:underline truncate block"
                                                    >
                                                        {placeDetails.website}
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Reviews Tab */}
                                {activeTab === 'reviews' && (
                                    <div className="space-y-4">
                                        {placeDetails?.reviews && placeDetails.reviews.length > 0 ? (
                                            placeDetails.reviews.slice(0, 3).map((review, index) => (
                                                <div key={index} className="border-b border-violet-100 pb-4 last:border-0">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <img
                                                            src={review.profile_photo_url}
                                                            alt={review.author_name}
                                                            className="w-10 h-10 rounded-full"
                                                        />
                                                        <div>
                                                            <p className="font-semibold text-violet-900">{review.author_name}</p>
                                                            <div className="flex items-center gap-1">
                                                                {[...Array(5)].map((_, i) => (
                                                                    <FaStar
                                                                        key={i}
                                                                        className={i < review.rating ? 'text-yellow-500' : 'text-gray-300'}
                                                                        size={12}
                                                                    />
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <p className="text-gray-700">{review.text}</p>
                                                    <p className="text-xs text-gray-500 mt-2">{review.relative_time_description}</p>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-gray-500">No reviews available</p>
                                        )}
                                    </div>
                                )}

                                {/* Hours Tab */}
                                {activeTab === 'hours' && (
                                    <div>
                                        {placeDetails?.opening_hours?.weekday_text ? (
                                            <div className="space-y-2">
                                                {placeDetails.opening_hours.weekday_text.map((day, index) => (
                                                    <div key={index} className="flex items-center gap-2">
                                                        <FaClock className="text-violet-600 flex-shrink-0" />
                                                        <p className="text-gray-700">{day}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-gray-500">Opening hours not available</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>

                    {/* Right Column - Map & Directions */}
                    <motion.div
                        className="space-y-6"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        {/* Map Card */}
                        <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl p-4 border border-violet-100 sticky top-6">
                            <h3 className="text-xl font-bold text-violet-900 mb-4 flex items-center gap-2">
                                <FaMapPin /> Location
                            </h3>
                            {isLoaded && (
                                <GoogleMap
                                    mapContainerStyle={mapContainerStyle}
                                    center={mapCenter}
                                    zoom={15}
                                    options={{
                                        styles: [
                                            {
                                                featureType: 'poi',
                                                elementType: 'labels',
                                                stylers: [{ visibility: 'off' }]
                                            }
                                        ]
                                    }}
                                >
                                    {/* Resource Marker */}
                                    <Marker
                                        position={mapCenter}
                                        icon={{
                                            url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
                                        }}
                                    />

                                    {/* User Location Marker */}
                                    {userLocation && (
                                        <Marker
                                            position={userLocation}
                                            icon={{
                                                url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
                                            }}
                                        />
                                    )}

                                    {/* 5km Radius Circle */}
                                    {userLocation && (
                                        <Circle
                                            center={userLocation}
                                            radius={5000}
                                            options={{
                                                fillColor: '#8B5CF6',
                                                fillOpacity: 0.1,
                                                strokeColor: '#8B5CF6',
                                                strokeOpacity: 0.3,
                                                strokeWeight: 2
                                            }}
                                        />
                                    )}

                                    {/* Directions */}
                                    {showDirections && directions && (
                                        <DirectionsRenderer
                                            directions={directions}
                                            options={{
                                                polylineOptions: {
                                                    strokeColor: '#8B5CF6',
                                                    strokeWeight: 5
                                                }
                                            }}
                                        />
                                    )}
                                </GoogleMap>
                            )}

                            {/* Direction Controls */}
                            <div className="mt-4 space-y-3">
                                {/* Travel Mode Selection */}
                                <div className="flex gap-2">
                                    {['DRIVING', 'WALKING', 'TRANSIT'].map((mode) => (
                                        <button
                                            key={mode}
                                            onClick={() => {
                                                setTravelMode(mode);
                                                setShowDirections(false);
                                                setDirections(null);
                                            }}
                                            className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-300 ${travelMode === mode
                                                    ? 'bg-gradient-to-r from-violet-500 to-indigo-500 text-white'
                                                    : 'bg-violet-50 text-violet-700 hover:bg-violet-100'
                                                }`}
                                        >
                                            {mode === 'DRIVING' ? '🚗' : mode === 'WALKING' ? '🚶' : '🚌'} {mode}
                                        </button>
                                    ))}
                                </div>

                                {/* Show Route Button */}
                                <button
                                    onClick={() => {
                                        console.log('Button clicked!');
                                        calculateDirections();
                                    }}
                                    disabled={!userLocation}
                                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-500 to-indigo-500 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <FaDirections /> Show Route on Map
                                </button>

                                {/* Route Info */}
                                {directions && showDirections && (
                                    <motion.div
                                        className="bg-violet-50 rounded-xl p-4"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                    >
                                        <div className="flex items-center gap-2 mb-3">
                                            <FaRoute className="text-violet-600" />
                                            <span className="font-semibold text-violet-900">Route Details</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-white rounded-lg p-3">
                                                <p className="text-xs text-gray-600 mb-1">Distance</p>
                                                <p className="text-lg font-bold text-violet-700">{directions.routes[0].legs[0].distance.text}</p>
                                            </div>
                                            <div className="bg-white rounded-lg p-3">
                                                <p className="text-xs text-gray-600 mb-1">Duration</p>
                                                <p className="text-lg font-bold text-violet-700">{directions.routes[0].legs[0].duration.text}</p>
                                            </div>
                                        </div>
                                        <div className="mt-3 text-xs text-violet-600 flex items-center gap-1">
                                            {travelMode === 'DRIVING' && '🚗 Driving'}
                                            {travelMode === 'WALKING' && '🚶 Walking'}
                                            {travelMode === 'TRANSIT' && '🚌 Public Transit'}
                                        </div>
                                    </motion.div>
                                )}

                                {/* Open in Google Maps */}
                                {placeDetails?.url && (
                                    <a
                                        href={placeDetails.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-violet-300 text-violet-700 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                                    >
                                        <FaMapMarkerAlt /> Open in Google Maps
                                    </a>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Photo Modal */}
            <AnimatePresence>
                {selectedPhoto && (
                    <motion.div
                        className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedPhoto(null)}
                    >
                        <motion.img
                            src={selectedPhoto}
                            alt="Resource"
                            className="max-w-full max-h-full rounded-xl"
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.8 }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ResourceDetail;
