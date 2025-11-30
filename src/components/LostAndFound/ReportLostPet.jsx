import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaDog, 
  FaCat, 
  FaCamera, 
  FaMapMarkerAlt,
  FaCalendar,
  FaPhone,
  FaEnvelope,
  FaDollarSign,
  FaShareAlt,
  FaQrcode,
  FaCheckCircle,
  FaArrowRight,
  FaArrowLeft
} from 'react-icons/fa';
import { FiUpload, FiX, FiAlertCircle } from 'react-icons/fi';
import { getDatabase, ref, push, set } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { GoogleMap, Marker } from '@react-google-maps/api';
import useResponsive from '../../hooks/useResponsive';

const ReportLostPet = () => {
  const { isMobile } = useResponsive();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [reportId, setReportId] = useState(null);
  const [showMapModal, setShowMapModal] = useState(false);
  const [tempMapLocation, setTempMapLocation] = useState(null);
  const fileInputRef = useRef(null);
  const auth = getAuth();
  const user = auth.currentUser;

  const [formData, setFormData] = useState({
    // Step 1: Pet Type & Basic Info
    petType: '',
    petName: '',
    breed: '',
    gender: '',
    age: '',
    size: '',
    
    // Step 2: Physical Appearance
    primaryColor: '',
    secondaryColor: '',
    markings: '',
    distinctiveFeatures: '',
    photos: [],
    
    // Step 3: Last Seen Information
    lastSeenDate: '',
    lastSeenTime: '',
    lastSeenLocation: '',
    lastSeenAddress: '',
    lastSeenLatitude: null,
    lastSeenLongitude: null,
    circumstances: '',
    
    // Step 4: Behavior & Temperament
    microchipped: false,
    microchipNumber: '',
    collar: false,
    collarDescription: '',
    responsive: '',
    temperament: '',
    medicalConditions: '',
    
    // Step 5: Contact Information
    ownerName: '',
    contactPhone: '',
    contactEmail: '',
    alternatePhone: '',
    preferredContact: 'phone',
    
    // Step 6: Additional Details
    reward: false,
    rewardAmount: '',
    searchRadius: '10',
    additionalInfo: '',
    urgency: 'high'
  });

  const steps = [
    { number: 1, title: 'Pet Info', icon: FaDog },
    { number: 2, title: 'Appearance', icon: FaCamera },
    { number: 3, title: 'Last Seen', icon: FaMapMarkerAlt },
    { number: 4, title: 'Behavior', icon: FaCheckCircle },
    { number: 5, title: 'Contact', icon: FaPhone },
    { number: 6, title: 'Details', icon: FaDollarSign }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length + formData.photos.length > 5) {
      alert('Maximum 5 photos allowed');
      return;
    }
    
    const newPhotos = await Promise.all(
      files.map(async (file) => {
        // Convert to base64
        const base64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(file);
        });
        
        return {
          base64,
          preview: URL.createObjectURL(file),
          name: file.name,
          type: file.type,
          size: file.size
        };
      })
    );
    
    setFormData(prev => ({
      ...prev,
      photos: [...prev.photos, ...newPhotos]
    }));
  };

  const removePhoto = (index) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const handleLocationSelect = () => {
    // Get user's current location as default center for map
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setTempMapLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setShowMapModal(true);
        },
        (error) => {
          // If location permission denied, use default location
          setTempMapLocation({ lat: 28.6139, lng: 77.2090 }); // Default to Delhi
          setShowMapModal(true);
        }
      );
    } else {
      // If geolocation not supported, use default location
      setTempMapLocation({ lat: 28.6139, lng: 77.2090 });
      setShowMapModal(true);
    }
  };

  const handleMapLocationConfirm = async () => {
    if (tempMapLocation) {
      handleInputChange('lastSeenLatitude', tempMapLocation.lat);
      handleInputChange('lastSeenLongitude', tempMapLocation.lng);
      
      // Reverse geocode to get address
      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${tempMapLocation.lat},${tempMapLocation.lng}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`
        );
        const data = await response.json();
        if (data.results[0]) {
          const address = data.results[0].formatted_address;
          handleInputChange('lastSeenAddress', address);
          // Extract city/area for location field
          const addressComponents = data.results[0].address_components;
          const locality = addressComponents.find(c => c.types.includes('locality'))?.long_name;
          const area = addressComponents.find(c => c.types.includes('sublocality'))?.long_name;
          const locationStr = [area, locality].filter(Boolean).join(', ');
          if (locationStr) {
            handleInputChange('lastSeenLocation', locationStr);
          }
        }
      } catch (error) {
        console.error('Geocoding error:', error);
      }
      
      setShowMapModal(false);
    }
  };

  const validateStep = () => {
    switch (currentStep) {
      case 1:
        return formData.petType && formData.petName && formData.breed;
      case 2:
        return formData.primaryColor && formData.photos.length > 0;
      case 3:
        return formData.lastSeenDate && formData.lastSeenLocation;
      case 4:
        return formData.responsive && formData.temperament;
      case 5:
        return formData.ownerName && formData.contactPhone && formData.contactEmail;
      case 6:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep()) {
      setCurrentStep(prev => Math.min(prev + 1, 6));
    } else {
      alert('Please fill in all required fields');
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!user) {
      alert('Please login to report a lost pet');
      return;
    }

    setLoading(true);

    try {
      const db = getDatabase();

      // Extract base64 images from photos
      const photoData = formData.photos.map(photo => ({
        base64: photo.base64,
        name: photo.name,
        type: photo.type
      }));

      // Create report
      const lostPetsRef = ref(db, 'lostPets');
      const newReportRef = push(lostPetsRef);
      
      const reportData = {
        ...formData,
        photos: photoData,
        userId: user.uid,
        userEmail: user.email,
        status: 'lost',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        views: 0,
        shares: 0,
        reportId: newReportRef.key
      };

      await set(newReportRef, reportData);

      setReportId(newReportRef.key);
      setSubmitted(true);
      
      // Send email notification (optional)
      // await sendLostPetEmail(reportData);

    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Pet Type & Basic Information</h2>
            
            {/* Pet Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pet Type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-4">
                {['Dog', 'Cat'].map(type => (
                  <motion.button
                    key={type}
                    type="button"
                    onClick={() => handleInputChange('petType', type)}
                    className={`p-4 rounded-xl border-2 font-medium transition-all ${
                      formData.petType === type
                        ? 'border-violet-600 bg-violet-50 text-violet-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-violet-400'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {type === 'Dog' ? <FaDog className="text-3xl mx-auto mb-2" /> : <FaCat className="text-3xl mx-auto mb-2" />}
                    {type}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Pet Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pet Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.petName}
                onChange={(e) => handleInputChange('petName', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-violet-600 focus:outline-none"
                placeholder="Enter your pet's name"
              />
            </div>

            {/* Breed */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Breed <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.breed}
                onChange={(e) => handleInputChange('breed', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-violet-600 focus:outline-none"
                placeholder="e.g., Golden Retriever, Persian Cat"
              />
            </div>

            {/* Gender & Age */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-violet-600 focus:outline-none"
                >
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
                <input
                  type="text"
                  value={formData.age}
                  onChange={(e) => handleInputChange('age', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-violet-600 focus:outline-none"
                  placeholder="e.g., 2 years"
                />
              </div>
            </div>

            {/* Size */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Size</label>
              <div className="grid grid-cols-4 gap-2">
                {['Small', 'Medium', 'Large', 'X-Large'].map(size => (
                  <motion.button
                    key={size}
                    type="button"
                    onClick={() => handleInputChange('size', size)}
                    className={`py-2 rounded-xl border-2 font-medium text-sm ${
                      formData.size === size
                        ? 'border-violet-600 bg-violet-50 text-violet-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-violet-400'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {size}
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Physical Appearance</h2>
            
            {/* Photo Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Photos <span className="text-red-500">*</span> (Max 5)
              </label>
              <div className="grid grid-cols-3 gap-4 mb-4">
                {formData.photos.map((photo, index) => (
                  <motion.div
                    key={index}
                    className="relative aspect-square rounded-xl overflow-hidden border-2 border-violet-200"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <img src={photo.preview} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                    >
                      <FiX />
                    </button>
                  </motion.div>
                ))}
                {formData.photos.length < 5 && (
                  <motion.button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square rounded-xl border-2 border-dashed border-violet-400 bg-violet-50 hover:bg-violet-100 flex flex-col items-center justify-center gap-2 text-violet-600"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <FiUpload className="text-3xl" />
                    <span className="text-sm font-medium">Upload</span>
                  </motion.button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>

            {/* Colors */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Color <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.primaryColor}
                  onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-violet-600 focus:outline-none"
                  placeholder="e.g., Brown, White"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Color</label>
                <input
                  type="text"
                  value={formData.secondaryColor}
                  onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-violet-600 focus:outline-none"
                  placeholder="e.g., Black spots"
                />
              </div>
            </div>

            {/* Markings */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Markings & Patterns</label>
              <textarea
                value={formData.markings}
                onChange={(e) => handleInputChange('markings', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-violet-600 focus:outline-none"
                rows="3"
                placeholder="Describe any unique markings, spots, or patterns"
              />
            </div>

            {/* Distinctive Features */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Distinctive Features</label>
              <textarea
                value={formData.distinctiveFeatures}
                onChange={(e) => handleInputChange('distinctiveFeatures', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-violet-600 focus:outline-none"
                rows="3"
                placeholder="Scars, unique eye color, cropped ears, etc."
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Last Seen Information</h2>
            
            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FaCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    value={formData.lastSeenDate}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => handleInputChange('lastSeenDate', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-300 focus:border-violet-600 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                <input
                  type="time"
                  value={formData.lastSeenTime}
                  onChange={(e) => {
                    const selectedDate = formData.lastSeenDate;
                    const today = new Date().toISOString().split('T')[0];
                    if (selectedDate === today) {
                      const now = new Date().toTimeString().slice(0, 5);
                      if (e.target.value > now) {
                        alert('Cannot select a future time');
                        return;
                      }
                    }
                    handleInputChange('lastSeenTime', e.target.value);
                  }}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-violet-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.lastSeenLocation}
                  onChange={(e) => handleInputChange('lastSeenLocation', e.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-violet-600 focus:outline-none"
                  placeholder="City, Area, Landmark"
                />
                <motion.button
                  type="button"
                  onClick={handleLocationSelect}
                  className="px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-medium"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <FaMapMarkerAlt />
                </motion.button>
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Detailed Address</label>
              <textarea
                value={formData.lastSeenAddress}
                onChange={(e) => handleInputChange('lastSeenAddress', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-violet-600 focus:outline-none"
                rows="2"
                placeholder="Street address, building name, etc."
              />
            </div>

            {/* Circumstances */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Circumstances</label>
              <textarea
                value={formData.circumstances}
                onChange={(e) => handleInputChange('circumstances', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-violet-600 focus:outline-none"
                rows="4"
                placeholder="Describe how your pet went missing (e.g., escaped from yard, ran away during walk, etc.)"
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Behavior & Identification</h2>
            
            {/* Microchip */}
            <div>
              <label className="flex items-center gap-3 p-4 bg-violet-50 rounded-xl border-2 border-violet-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.microchipped}
                  onChange={(e) => handleInputChange('microchipped', e.target.checked)}
                  className="w-5 h-5 text-violet-600 rounded"
                />
                <span className="font-medium text-slate-800">Pet is microchipped</span>
              </label>
              {formData.microchipped && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-3"
                >
                  <input
                    type="text"
                    value={formData.microchipNumber}
                    onChange={(e) => handleInputChange('microchipNumber', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-violet-600 focus:outline-none"
                    placeholder="Microchip number"
                  />
                </motion.div>
              )}
            </div>

            {/* Collar */}
            <div>
              <label className="flex items-center gap-3 p-4 bg-violet-50 rounded-xl border-2 border-violet-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.collar}
                  onChange={(e) => handleInputChange('collar', e.target.checked)}
                  className="w-5 h-5 text-violet-600 rounded"
                />
                <span className="font-medium text-slate-800">Wearing collar or tags</span>
              </label>
              {formData.collar && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-3"
                >
                  <textarea
                    value={formData.collarDescription}
                    onChange={(e) => handleInputChange('collarDescription', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-violet-600 focus:outline-none"
                    rows="2"
                    placeholder="Describe collar color, tags, etc."
                  />
                </motion.div>
              )}
            </div>

            {/* Responsive */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Responds to Name? <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                {['Yes', 'Sometimes', 'No'].map(option => (
                  <motion.button
                    key={option}
                    type="button"
                    onClick={() => handleInputChange('responsive', option)}
                    className={`py-3 rounded-xl border-2 font-medium ${
                      formData.responsive === option
                        ? 'border-violet-600 bg-violet-50 text-violet-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-violet-400'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {option}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Temperament */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Temperament <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                {['Friendly', 'Shy/Nervous', 'Aggressive'].map(option => (
                  <motion.button
                    key={option}
                    type="button"
                    onClick={() => handleInputChange('temperament', option)}
                    className={`py-3 rounded-xl border-2 font-medium text-sm ${
                      formData.temperament === option
                        ? 'border-violet-600 bg-violet-50 text-violet-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-violet-400'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {option}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Medical Conditions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Medical Conditions</label>
              <textarea
                value={formData.medicalConditions}
                onChange={(e) => handleInputChange('medicalConditions', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-violet-600 focus:outline-none"
                rows="3"
                placeholder="Any medical conditions, medications, or special needs"
              />
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Contact Information</h2>
            
            {/* Owner Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.ownerName}
                onChange={(e) => handleInputChange('ownerName', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-violet-600 focus:outline-none"
                placeholder="Full name"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FaPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-300 focus:border-violet-600 focus:outline-none"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-300 focus:border-violet-600 focus:outline-none"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            {/* Alternate Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Alternate Phone (Optional)</label>
              <input
                type="tel"
                value={formData.alternatePhone}
                onChange={(e) => handleInputChange('alternatePhone', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-violet-600 focus:outline-none"
                placeholder="+1 (555) 987-6543"
              />
            </div>

            {/* Preferred Contact */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Contact Method</label>
              <div className="grid grid-cols-2 gap-3">
                {['phone', 'email'].map(method => (
                  <motion.button
                    key={method}
                    type="button"
                    onClick={() => handleInputChange('preferredContact', method)}
                    className={`py-3 rounded-xl border-2 font-medium capitalize ${
                      formData.preferredContact === method
                        ? 'border-violet-600 bg-violet-50 text-violet-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-violet-400'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {method}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Privacy Notice */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
              <div className="flex gap-3">
                <FiAlertCircle className="text-blue-600 text-xl flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Privacy Notice</p>
                  <p>Your contact information will only be shared with verified users who may have information about your pet.</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Additional Details</h2>
            
            {/* Reward */}
            <div>
              <label className="flex items-center gap-3 p-4 bg-violet-50 rounded-xl border-2 border-violet-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.reward}
                  onChange={(e) => handleInputChange('reward', e.target.checked)}
                  className="w-5 h-5 text-violet-600 rounded"
                />
                <span className="font-medium text-slate-800">Offering reward for information</span>
              </label>
              {formData.reward && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-3"
                >
                  <div className="relative">
                    <FaDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="number"
                      value={formData.rewardAmount}
                      onChange={(e) => handleInputChange('rewardAmount', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-300 focus:border-violet-600 focus:outline-none"
                      placeholder="Reward amount"
                    />
                  </div>
                </motion.div>
              )}
            </div>

            {/* Search Radius */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alert Radius (miles)
              </label>
              <input
                type="range"
                min="5"
                max="50"
                step="5"
                value={formData.searchRadius}
                onChange={(e) => handleInputChange('searchRadius', e.target.value)}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-600 mt-1">
                <span>5 miles</span>
                <span className="font-bold text-violet-600">{formData.searchRadius} miles</span>
                <span>50 miles</span>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                You'll receive notifications for potential matches within this radius
              </p>
            </div>

            {/* Urgency */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Urgency Level</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'low', label: 'Low', color: 'green' },
                  { value: 'medium', label: 'Medium', color: 'yellow' },
                  { value: 'high', label: 'High', color: 'red' }
                ].map(option => (
                  <motion.button
                    key={option.value}
                    type="button"
                    onClick={() => handleInputChange('urgency', option.value)}
                    className={`py-3 rounded-xl border-2 font-medium ${
                      formData.urgency === option.value
                        ? `border-${option.color}-600 bg-${option.color}-50 text-${option.color}-700`
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {option.label}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Additional Info */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Additional Information</label>
              <textarea
                value={formData.additionalInfo}
                onChange={(e) => handleInputChange('additionalInfo', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-violet-600 focus:outline-none"
                rows="4"
                placeholder="Any other important information that could help locate your pet"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (submitted) {
    return (
      <motion.div
        className={`${isMobile ? 'max-w-md mx-auto p-4' : 'max-w-2xl mx-auto'}`}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
          >
            <FaCheckCircle className="text-6xl text-green-500 mx-auto mb-4" />
          </motion.div>
          <h2 className="text-3xl font-bold text-slate-800 mb-4">Report Submitted Successfully!</h2>
          <p className="text-gray-600 mb-6">
            Your lost pet report has been created. We'll notify nearby users and start matching with found pet reports.
          </p>
          
          <div className="bg-violet-50 border-2 border-violet-200 rounded-xl p-6 mb-6">
            <p className="text-sm text-gray-700 mb-4">Share this report to increase visibility:</p>
            <div className="flex gap-3 justify-center">
              <motion.button
                className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaShareAlt /> Share
              </motion.button>
              <motion.button
                className="px-6 py-3 bg-gray-800 text-white rounded-xl font-medium flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaQrcode /> QR Code
              </motion.button>
            </div>
          </div>

          <motion.button
            onClick={() => window.location.reload()}
            className="px-8 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-medium"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Report Another Pet
          </motion.button>
        </div>
      </motion.div>
    );
  }

  return (
    <>
      {/* Map Location Picker Modal */}
      <AnimatePresence>
        {showMapModal && (
          <motion.div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowMapModal(false)}
          >
            <motion.div
              className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold mb-1">📍 Select Location</h3>
                    <p className="text-violet-100 text-sm">Tap on the map to pin the approximate location where your pet was last seen</p>
                  </div>
                  <button
                    onClick={() => setShowMapModal(false)}
                    className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                  >
                    <FiX size={24} />
                  </button>
                </div>
              </div>

              {/* Map Container */}
              <div className="relative" style={{ height: '500px' }}>
                {window.google ? (
                  <GoogleMap
                    mapContainerStyle={{ width: '100%', height: '100%' }}
                    center={tempMapLocation || { lat: 28.6139, lng: 77.2090 }}
                    zoom={14}
                    onClick={(e) => {
                      setTempMapLocation({
                        lat: e.latLng.lat(),
                        lng: e.latLng.lng()
                      });
                    }}
                    options={{
                      streetViewControl: false,
                      mapTypeControl: false,
                      fullscreenControl: false,
                      styles: [
                        {
                          featureType: 'poi',
                          elementType: 'labels',
                          stylers: [{ visibility: 'off' }]
                        }
                      ]
                    }}
                  >
                    {tempMapLocation && (
                      <Marker
                        position={tempMapLocation}
                        animation={window.google?.maps?.Animation?.BOUNCE}
                      />
                    )}
                  </GoogleMap>
                ) : (
                  <div className="flex items-center justify-center h-full bg-gray-100">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading map...</p>
                    </div>
                  </div>
                )}
                
                {/* Floating instruction card */}
                <div className="absolute top-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-4 border-2 border-violet-200">
                  <div className="flex items-start gap-3">
                    <FaMapMarkerAlt className="text-violet-600 text-2xl flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-bold text-slate-800 mb-1">How to select location:</h4>
                      <ul className="text-sm text-gray-700 space-y-1">
                        <li>🖱️ <strong>Click/Tap</strong> on the map to place a marker</li>
                        <li>🔄 <strong>Drag</strong> the map to find the exact area</li>
                        <li>🎯 The marker shows where your pet was last seen</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 bg-gray-50 border-t border-gray-200">
                <div className="flex gap-3 justify-end">
                  <motion.button
                    onClick={() => setShowMapModal(false)}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    onClick={handleMapLocationConfirm}
                    disabled={!tempMapLocation}
                    className="px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    whileHover={tempMapLocation ? { scale: 1.02 } : {}}
                    whileTap={tempMapLocation ? { scale: 0.98 } : {}}
                  >
                    <FaCheckCircle />
                    Confirm Location
                  </motion.button>
                </div>
                {tempMapLocation && (
                  <p className="text-xs text-gray-600 mt-3 text-center">
                    Selected: {tempMapLocation.lat.toFixed(6)}, {tempMapLocation.lng.toFixed(6)}
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={isMobile ? 'max-w-md mx-auto p-4' : 'max-w-4xl mx-auto'}>
        {/* Quick Guide */}
        {currentStep === 1 && (
        <motion.div
          className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-2xl p-6 mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-start gap-4">
            <FiAlertCircle className="text-red-600 text-3xl flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">📝 Quick Guide: Report Your Lost Pet</h3>
              <p className="text-gray-700 mb-3">Follow these 6 simple steps to create a comprehensive report:</p>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-violet-600 flex-shrink-0">1.</span>
                  <span><strong>Pet Info:</strong> Basic details (name, type, breed)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-violet-600 flex-shrink-0">2.</span>
                  <span><strong>Photos:</strong> Upload clear photos (up to 5) - front, side, and distinctive features</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-violet-600 flex-shrink-0">3.</span>
                  <span><strong>Last Seen:</strong> When and where you last saw your pet</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-violet-600 flex-shrink-0">4.</span>
                  <span><strong>Behavior:</strong> Microchip, collar, temperament details</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-violet-600 flex-shrink-0">5.</span>
                  <span><strong>Contact:</strong> Your contact information</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-violet-600 flex-shrink-0">6.</span>
                  <span><strong>Additional:</strong> Reward, search radius, extra notes</span>
                </li>
              </ul>
              <div className="mt-4 p-3 bg-white rounded-lg border border-red-200">
                <p className="text-sm font-medium text-red-800">
                  ⏱️ <strong>Time Matters!</strong> The sooner you report, the better the chances of finding your pet.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Progress Indicator */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.number} className="flex-1">
                <div className="flex items-center">
                  <motion.div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      currentStep >= step.number
                        ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                    whileHover={{ scale: 1.1 }}
                  >
                    <Icon />
                  </motion.div>
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-1 mx-2 ${
                      currentStep > step.number ? 'bg-violet-600' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
                <div className="text-xs text-center mt-2 font-medium text-gray-600">
                  {step.title}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Form Content */}
      <motion.div
        className="bg-white rounded-2xl shadow-lg p-6 mb-6"
        key={currentStep}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
      >
        {renderStepContent()}
      </motion.div>

      {/* Navigation Buttons */}
      <div className="flex gap-4">
        {currentStep > 1 && (
          <motion.button
            onClick={handlePrevious}
            className="flex-1 px-6 py-4 bg-white border-2 border-violet-200 text-violet-600 rounded-xl font-medium flex items-center justify-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <FaArrowLeft /> Previous
          </motion.button>
        )}
        
        {currentStep < 6 ? (
          <motion.button
            onClick={handleNext}
            disabled={!validateStep()}
            className={`flex-1 px-6 py-4 rounded-xl font-medium flex items-center justify-center gap-2 ${
              validateStep()
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            whileHover={validateStep() ? { scale: 1.02 } : {}}
            whileTap={validateStep() ? { scale: 0.98 } : {}}
          >
            Next <FaArrowRight />
          </motion.button>
        ) : (
          <motion.button
            onClick={handleSubmit}
            disabled={loading || !validateStep()}
            className={`flex-1 px-6 py-4 rounded-xl font-medium flex items-center justify-center gap-2 ${
              loading || !validateStep()
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-green-600 to-green-700 text-white'
            }`}
            whileHover={!loading && validateStep() ? { scale: 1.02 } : {}}
            whileTap={!loading && validateStep() ? { scale: 0.98 } : {}}
          >
            {loading ? 'Submitting...' : 'Submit Report'} <FaCheckCircle />
          </motion.button>
        )}
      </div>
    </div>
    </>
  );
};

export default ReportLostPet;
