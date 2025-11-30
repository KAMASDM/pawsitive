import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaDog, 
  FaCat, 
  FaCamera, 
  FaMapMarkerAlt,
  FaCalendar,
  FaPhone,
  FaEnvelope,
  FaCheckCircle,
  FaArrowRight,
  FaArrowLeft,
  FaHospital
} from 'react-icons/fa';
import { FiUpload, FiX, FiAlertCircle } from 'react-icons/fi';
import { getDatabase, ref, push, set, onValue } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { GoogleMap, Marker } from '@react-google-maps/api';
import useResponsive from '../../hooks/useResponsive';

const ReportFoundPet = () => {
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

  const [lostPets, setLostPets] = useState([]);
  const [matchedLostPet, setMatchedLostPet] = useState(null);
  const [showMatchSuggestions, setShowMatchSuggestions] = useState(true);

  const [formData, setFormData] = useState({
    // Matching
    matchedWithLostReport: false,
    matchedReportId: null,
    matchedPetName: '',
    
    // Simplified form fields
    foundDate: '',
    foundTime: '',
    foundLocation: '',
    foundAddress: '',
    foundLatitude: null,
    foundLongitude: null,
    photos: [],
    finderName: '',
    contactPhone: '',
    contactEmail: '',
    additionalInfo: ''
  });

  const getSteps = () => {
    if (matchedLostPet) {
      // Simplified 3-step form for matched pets
      return [
        { number: 1, title: 'Found Details', icon: FaMapMarkerAlt },
        { number: 2, title: 'Photos', icon: FaCamera },
        { number: 3, title: 'Contact', icon: FaPhone }
      ];
    }
    // Full form for unmatched pets - keep original if needed
    return [
      { number: 1, title: 'Pet Info', icon: FaDog },
      { number: 2, title: 'Appearance', icon: FaCamera },
      { number: 3, title: 'Found', icon: FaMapMarkerAlt },
      { number: 4, title: 'Contact', icon: FaPhone }
    ];
  };

  const steps = getSteps();

  // Fetch lost pets for matching
  useEffect(() => {
    const db = getDatabase();
    const lostPetsRef = ref(db, 'lostPets');
    const unsubscribe = onValue(lostPetsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const pets = Object.entries(data)
          .map(([id, pet]) => ({ id, ...pet }))
          .filter(pet => pet.status === 'lost')
          .sort((a, b) => b.createdAt - a.createdAt);
        setLostPets(pets);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleMatchWithLostPet = (lostPet) => {
    setMatchedLostPet(lostPet);
    setFormData(prev => ({
      ...prev,
      matchedWithLostReport: true,
      matchedReportId: lostPet.id,
      matchedPetName: lostPet.petName
    }));
    setShowMatchSuggestions(false);
    setCurrentStep(1); // Reset to step 1
  };

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
      handleInputChange('foundLatitude', tempMapLocation.lat);
      handleInputChange('foundLongitude', tempMapLocation.lng);
      
      // Reverse geocode to get address
      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${tempMapLocation.lat},${tempMapLocation.lng}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`
        );
        const data = await response.json();
        if (data.results[0]) {
          const address = data.results[0].formatted_address;
          handleInputChange('foundAddress', address);
          // Extract city/area for location field
          const addressComponents = data.results[0].address_components;
          const locality = addressComponents.find(c => c.types.includes('locality'))?.long_name;
          const area = addressComponents.find(c => c.types.includes('sublocality'))?.long_name;
          const locationStr = [area, locality].filter(Boolean).join(', ');
          if (locationStr) {
            handleInputChange('foundLocation', locationStr);
          }
        }
      } catch (error) {
        console.error('Geocoding error:', error);
      }
      
      setShowMapModal(false);
    }
  };

  const validateStep = () => {
    if (matchedLostPet) {
      // Simplified validation for matched pets
      switch (currentStep) {
        case 1:
          return formData.foundDate && formData.foundLocation;
        case 2:
          return formData.photos.length > 0;
        case 3:
          return formData.finderName && formData.contactPhone && formData.contactEmail;
        default:
          return false;
      }
    } else {
      // Full validation for unmatched pets
      switch (currentStep) {
        case 1:
          return formData.petType && formData.approximateBreed;
        case 2:
          return formData.primaryColor && formData.photos.length > 0;
        case 3:
          return formData.foundDate && formData.foundLocation;
        case 4:
          return formData.finderName && formData.contactPhone && formData.contactEmail;
        default:
          return false;
      }
    }
  };

  const handleNext = () => {
    if (validateStep()) {
      const maxStep = matchedLostPet ? 3 : 4;
      setCurrentStep(prev => Math.min(prev + 1, maxStep));
    } else {
      alert('Please fill in all required fields');
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!user) {
      alert('Please login to report a found pet');
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
      const foundPetsRef = ref(db, 'foundPets');
      const newReportRef = push(foundPetsRef);
      
      const reportData = {
        ...formData,
        photos: photoData,
        userId: user.uid,
        userEmail: user.email,
        status: 'found',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        views: 0,
        reportId: newReportRef.key
      };

      await set(newReportRef, reportData);

      setReportId(newReportRef.key);
      setSubmitted(true);

    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    // Simplified form for matched pets
    if (matchedLostPet) {
      switch (currentStep) {
        case 1:
          return (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-800 mb-4">📍 Where & When Did You Find {matchedLostPet.petName}?</h2>
              
              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date Found <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.foundDate}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => handleInputChange('foundDate', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-green-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                  <input
                    type="time"
                    value={formData.foundTime}
                    onChange={(e) => handleInputChange('foundTime', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-green-600 focus:outline-none"
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
                    value={formData.foundLocation}
                    onChange={(e) => handleInputChange('foundLocation', e.target.value)}
                    className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-green-600 focus:outline-none"
                    placeholder="City, Area, Landmark"
                  />
                  <motion.button
                    type="button"
                    onClick={handleLocationSelect}
                    className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium"
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
                  value={formData.foundAddress}
                  onChange={(e) => handleInputChange('foundAddress', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-green-600 focus:outline-none"
                  rows="2"
                  placeholder="Street address, building name, etc."
                />
              </div>

              {/* Additional Info */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Additional Information</label>
                <textarea
                  value={formData.additionalInfo}
                  onChange={(e) => handleInputChange('additionalInfo', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-green-600 focus:outline-none"
                  rows="3"
                  placeholder="Any other details about finding the pet..."
                />
              </div>
            </div>
          );

        case 2:
          return (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-800 mb-4">📸 Upload Photos of {matchedLostPet.petName}</h2>
              <p className="text-gray-600 mb-4">
                Upload clear photos to help confirm this is {matchedLostPet.petName}. The owner will be notified!
              </p>

              {/* Photo Upload */}
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-green-500 transition-colors cursor-pointer"
                   onClick={() => fileInputRef.current?.click()}>
                <FiUpload className="text-5xl text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">Click to upload photos</p>
                <p className="text-sm text-gray-500">Maximum 5 photos</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </div>

              {/* Photo Preview */}
              {formData.photos.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                  {formData.photos.map((photo, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={photo.preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-xl"
                      />
                      <button
                        onClick={() => removePhoto(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <FiX />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );

        case 3:
          return (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-800 mb-4">📞 Your Contact Information</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.finderName}
                  onChange={(e) => handleInputChange('finderName', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-green-600 focus:outline-none"
                  placeholder="Your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-green-600 focus:outline-none"
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-green-600 focus:outline-none"
                  placeholder="your.email@example.com"
                />
              </div>
            </div>
          );

        default:
          return null;
      }
    }

    // Original full form for unmatched pets
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
                        ? 'border-green-600 bg-green-50 text-green-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-green-400'
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

            {/* Approximate Breed */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Approximate Breed <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.approximateBreed}
                onChange={(e) => handleInputChange('approximateBreed', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-green-600 focus:outline-none"
                placeholder="Best guess of breed (e.g., Labrador mix, Tabby cat)"
              />
              <p className="text-xs text-gray-500 mt-1">Don't worry if you're not sure, just give your best guess</p>
            </div>

            {/* Gender & Age */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Gender (if known)</label>
                <select
                  value={formData.gender}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-green-600 focus:outline-none"
                >
                  <option value="">Not sure</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Approximate Age</label>
                <input
                  type="text"
                  value={formData.approximateAge}
                  onChange={(e) => handleInputChange('approximateAge', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-green-600 focus:outline-none"
                  placeholder="e.g., Young, Adult, Senior"
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
                        ? 'border-green-600 bg-green-50 text-green-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-green-400'
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
              <p className="text-xs text-gray-500 mb-3">Clear photos help match with lost pet reports</p>
              <div className="grid grid-cols-3 gap-4 mb-4">
                {formData.photos.map((photo, index) => (
                  <motion.div
                    key={index}
                    className="relative aspect-square rounded-xl overflow-hidden border-2 border-green-200"
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
                    className="aspect-square rounded-xl border-2 border-dashed border-green-400 bg-green-50 hover:bg-green-100 flex flex-col items-center justify-center gap-2 text-green-600"
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
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-green-600 focus:outline-none"
                  placeholder="e.g., Brown, White, Black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Color</label>
                <input
                  type="text"
                  value={formData.secondaryColor}
                  onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-green-600 focus:outline-none"
                  placeholder="e.g., White patches"
                />
              </div>
            </div>

            {/* Markings */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Markings & Patterns</label>
              <textarea
                value={formData.markings}
                onChange={(e) => handleInputChange('markings', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-green-600 focus:outline-none"
                rows="3"
                placeholder="Describe any spots, stripes, or patterns"
              />
            </div>

            {/* Distinctive Features */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Distinctive Features</label>
              <textarea
                value={formData.distinctiveFeatures}
                onChange={(e) => handleInputChange('distinctiveFeatures', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-green-600 focus:outline-none"
                rows="3"
                placeholder="Scars, ear shape, tail length, eye color, etc."
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Where & When Found</h2>
            
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
                    value={formData.foundDate}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => handleInputChange('foundDate', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-300 focus:border-green-600 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                <input
                  type="time"
                  value={formData.foundTime}
                  onChange={(e) => {
                    const selectedDate = formData.foundDate;
                    const today = new Date().toISOString().split('T')[0];
                    if (selectedDate === today) {
                      const now = new Date().toTimeString().slice(0, 5);
                      if (e.target.value > now) {
                        alert('Cannot select a future time');
                        return;
                      }
                    }
                    handleInputChange('foundTime', e.target.value);
                  }}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-green-600 focus:outline-none"
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
                  value={formData.foundLocation}
                  onChange={(e) => handleInputChange('foundLocation', e.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-green-600 focus:outline-none"
                  placeholder="City, Area, Landmark"
                />
                <motion.button
                  type="button"
                  onClick={handleLocationSelect}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-medium"
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
                value={formData.foundAddress}
                onChange={(e) => handleInputChange('foundAddress', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-green-600 focus:outline-none"
                rows="2"
                placeholder="Street address, near which building/landmark"
              />
            </div>

            {/* Circumstances */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">How did you find this pet?</label>
              <textarea
                value={formData.foundCircumstances}
                onChange={(e) => handleInputChange('foundCircumstances', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-green-600 focus:outline-none"
                rows="4"
                placeholder="e.g., Found wandering on street, came to my backyard, spotted in park, etc."
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Current Status & Identification</h2>
            
            {/* Current Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Status <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'with_me', label: 'With Me' },
                  { value: 'at_shelter', label: 'At Shelter' },
                  { value: 'at_vet', label: 'At Vet Clinic' },
                  { value: 'with_someone_else', label: 'With Someone Else' }
                ].map(option => (
                  <motion.button
                    key={option.value}
                    type="button"
                    onClick={() => handleInputChange('currentStatus', option.value)}
                    className={`py-3 rounded-xl border-2 font-medium text-sm ${
                      formData.currentStatus === option.value
                        ? 'border-green-600 bg-green-50 text-green-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-green-400'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {option.label}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Conditional Fields */}
            {formData.currentStatus === 'at_shelter' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
              >
                <label className="block text-sm font-medium text-gray-700 mb-2">Shelter Name</label>
                <input
                  type="text"
                  value={formData.shelterName}
                  onChange={(e) => handleInputChange('shelterName', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-green-600 focus:outline-none"
                  placeholder="Name and address of shelter"
                />
              </motion.div>
            )}

            {formData.currentStatus === 'at_vet' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
              >
                <label className="block text-sm font-medium text-gray-700 mb-2">Vet Clinic Name</label>
                <input
                  type="text"
                  value={formData.vetClinicName}
                  onChange={(e) => handleInputChange('vetClinicName', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-green-600 focus:outline-none"
                  placeholder="Name and address of vet clinic"
                />
              </motion.div>
            )}

            {/* Microchip */}
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border-2 border-blue-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.scannedForMicrochip}
                  onChange={(e) => handleInputChange('scannedForMicrochip', e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded"
                />
                <span className="font-medium text-slate-800">Pet has been scanned for microchip</span>
              </label>
              
              {formData.scannedForMicrochip && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-3"
                >
                  <label className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border-2 border-green-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.microchipFound}
                      onChange={(e) => handleInputChange('microchipFound', e.target.checked)}
                      className="w-5 h-5 text-green-600 rounded"
                    />
                    <span className="font-medium text-slate-800">Microchip was found</span>
                  </label>
                  
                  {formData.microchipFound && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                    >
                      <input
                        type="text"
                        value={formData.microchipNumber}
                        onChange={(e) => handleInputChange('microchipNumber', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-green-600 focus:outline-none"
                        placeholder="Microchip number"
                      />
                    </motion.div>
                  )}
                </motion.div>
              )}
            </div>

            {/* Collar/Tags */}
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-4 bg-violet-50 rounded-xl border-2 border-violet-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.hasCollar}
                  onChange={(e) => handleInputChange('hasCollar', e.target.checked)}
                  className="w-5 h-5 text-violet-600 rounded"
                />
                <span className="font-medium text-slate-800">Pet has a collar</span>
              </label>
              
              {formData.hasCollar && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-3"
                >
                  <textarea
                    value={formData.collarDescription}
                    onChange={(e) => handleInputChange('collarDescription', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-violet-600 focus:outline-none"
                    rows="2"
                    placeholder="Describe the collar (color, material, condition)"
                  />
                  
                  <label className="flex items-center gap-3 p-4 bg-violet-50 rounded-xl border-2 border-violet-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.hasTag}
                      onChange={(e) => handleInputChange('hasTag', e.target.checked)}
                      className="w-5 h-5 text-violet-600 rounded"
                    />
                    <span className="font-medium text-slate-800">Has identification tag</span>
                  </label>
                  
                  {formData.hasTag && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                    >
                      <textarea
                        value={formData.tagInfo}
                        onChange={(e) => handleInputChange('tagInfo', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-violet-600 focus:outline-none"
                        rows="2"
                        placeholder="Information on the tag (name, phone number, etc.)"
                      />
                    </motion.div>
                  )}
                </motion.div>
              )}
            </div>

            {/* Injuries */}
            <div>
              <label className="flex items-center gap-3 p-4 bg-red-50 rounded-xl border-2 border-red-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.injuries}
                  onChange={(e) => handleInputChange('injuries', e.target.value)}
                  className="w-5 h-5 text-red-600 rounded"
                />
                <span className="font-medium text-slate-800">Pet has visible injuries</span>
              </label>
              {formData.injuries && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-3"
                >
                  <textarea
                    value={formData.injuryDescription}
                    onChange={(e) => handleInputChange('injuryDescription', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-green-600 focus:outline-none"
                    rows="3"
                    placeholder="Describe the injuries"
                  />
                </motion.div>
              )}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Contact Information</h2>
            
            {/* Finder Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.finderName}
                onChange={(e) => handleInputChange('finderName', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-green-600 focus:outline-none"
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
                  className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-300 focus:border-green-600 focus:outline-none"
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
                  className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-300 focus:border-green-600 focus:outline-none"
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
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-green-600 focus:outline-none"
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
                        ? 'border-green-600 bg-green-50 text-green-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-green-400'
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
                  <p>Your information will only be shared with the verified owner of the pet.</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Additional Details</h2>
            
            {/* Behavior Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Behavior & Temperament</label>
              <textarea
                value={formData.behaviorNotes}
                onChange={(e) => handleInputChange('behaviorNotes', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-green-600 focus:outline-none"
                rows="4"
                placeholder="How is the pet behaving? Friendly, scared, aggressive, hungry, etc."
              />
            </div>

            {/* Additional Info */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Additional Information</label>
              <textarea
                value={formData.additionalInfo}
                onChange={(e) => handleInputChange('additionalInfo', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-green-600 focus:outline-none"
                rows="4"
                placeholder="Any other important details about the pet or situation"
              />
            </div>

            {/* Willing to Foster */}
            <div>
              <label className="flex items-center gap-3 p-4 bg-violet-50 rounded-xl border-2 border-violet-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.willingToFoster}
                  onChange={(e) => handleInputChange('willingToFoster', e.target.checked)}
                  className="w-5 h-5 text-violet-600 rounded"
                />
                <div>
                  <div className="font-medium text-slate-800">Willing to foster temporarily</div>
                  <div className="text-sm text-gray-600">I can care for the pet until owner is found</div>
                </div>
              </label>
            </div>

            {/* Willing to Transport */}
            <div>
              <label className="flex items-center gap-3 p-4 bg-indigo-50 rounded-xl border-2 border-indigo-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.willingToTransport}
                  onChange={(e) => handleInputChange('willingToTransport', e.target.checked)}
                  className="w-5 h-5 text-indigo-600 rounded"
                />
                <div>
                  <div className="font-medium text-slate-800">Willing to transport</div>
                  <div className="text-sm text-gray-600">I can deliver the pet to the owner</div>
                </div>
              </label>
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
          <h2 className="text-3xl font-bold text-slate-800 mb-4">Thank You for Helping!</h2>
          <p className="text-gray-600 mb-6">
            Your found pet report has been submitted. We'll match it with lost pet reports and notify potential owners.
          </p>
          
          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 mb-6">
            <p className="text-sm text-gray-700 mb-2 font-medium">What happens next?</p>
            <ul className="text-sm text-gray-600 space-y-2 text-left">
              <li className="flex items-start gap-2">
                <FaCheckCircle className="text-green-500 mt-0.5 flex-shrink-0" />
                <span>Our system will match with lost pet reports in the area</span>
              </li>
              <li className="flex items-start gap-2">
                <FaCheckCircle className="text-green-500 mt-0.5 flex-shrink-0" />
                <span>Nearby pet owners will be notified about your finding</span>
              </li>
              <li className="flex items-start gap-2">
                <FaCheckCircle className="text-green-500 mt-0.5 flex-shrink-0" />
                <span>You'll receive notifications when potential matches are found</span>
              </li>
            </ul>
          </div>

          <motion.button
            onClick={() => window.location.reload()}
            className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-medium"
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
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold mb-1">📍 Select Location</h3>
                    <p className="text-green-100 text-sm">Tap on the map to pin the location where you found this pet</p>
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
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading map...</p>
                    </div>
                  </div>
                )}
                
                {/* Floating instruction card */}
                <div className="absolute top-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-4 border-2 border-green-200">
                  <div className="flex items-start gap-3">
                    <FaMapMarkerAlt className="text-green-600 text-2xl flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-bold text-slate-800 mb-1">How to select location:</h4>
                      <ul className="text-sm text-gray-700 space-y-1">
                        <li>🖱️ <strong>Click/Tap</strong> on the map to place a marker</li>
                        <li>🔄 <strong>Drag</strong> the map to find the exact area</li>
                        <li>🎯 The marker shows where you found the pet</li>
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
                    className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
        {/* Match with Lost Pet Suggestions */}
        {showMatchSuggestions && lostPets.length > 0 && currentStep === 1 && (
          <motion.div
            className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-start gap-3 mb-4">
              <FiAlertCircle className="text-blue-600 text-2xl flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">🔍 Does this match any lost pet?</h3>
                <p className="text-gray-700 text-sm mb-4">
                  Before creating a new report, check if this pet matches any recently reported lost pets. This helps reunite pets with their owners faster!
                </p>
              </div>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {lostPets.slice(0, 10).map((lostPet) => (
                <motion.div
                  key={lostPet.id}
                  className="bg-white rounded-xl p-4 border-2 border-gray-200 hover:border-blue-400 cursor-pointer transition-all"
                  whileHover={{ scale: 1.02 }}
                  onClick={() => handleMatchWithLostPet(lostPet)}
                >
                  <div className="flex gap-4">
                    {lostPet.photos && lostPet.photos.length > 0 && (
                      <img
                        src={lostPet.photos[0].base64 || lostPet.photos[0]}
                        alt={lostPet.petName}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-800">{lostPet.petName}</h4>
                      <p className="text-sm text-gray-600">
                        {lostPet.petType} • {lostPet.breed} • {lostPet.primaryColor}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Lost in {lostPet.lastSeenLocation} on {new Date(lostPet.lastSeenDate).toLocaleDateString()}
                      </p>
                      <div className="mt-2">
                        <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                          Click to match
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <button
              onClick={() => setShowMatchSuggestions(false)}
              className="mt-4 w-full py-2 text-sm text-gray-600 hover:text-gray-800 font-medium"
            >
              Skip - None of these match →
            </button>
          </motion.div>
        )}

        {/* Matched Pet Banner */}
        {matchedLostPet && (
          <motion.div
            className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-2xl p-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="flex items-center gap-3">
              <FaCheckCircle className="text-green-600 text-2xl" />
              <div className="flex-1">
                <h4 className="font-bold text-green-800">✅ Matched with Lost Pet Report</h4>
                <p className="text-sm text-green-700">
                  This report will be linked to <strong>{matchedLostPet.petName}</strong>'s lost pet report. The owner will be notified!
                </p>
              </div>
              <button
                onClick={() => {
                  setMatchedLostPet(null);
                  setShowMatchSuggestions(true);
                  setFormData(prev => ({
                    ...prev,
                    matchedWithLostReport: false,
                    matchedReportId: null
                  }));
                }}
                className="text-green-600 hover:text-green-800"
              >
                <FiX size={24} />
              </button>
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
                        ? 'bg-gradient-to-r from-green-600 to-green-700 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                    whileHover={{ scale: 1.1 }}
                  >
                    <Icon />
                  </motion.div>
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-1 mx-2 ${
                      currentStep > step.number ? 'bg-green-600' : 'bg-gray-200'
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
            className="flex-1 px-6 py-4 bg-white border-2 border-green-200 text-green-600 rounded-xl font-medium flex items-center justify-center gap-2"
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
                ? 'bg-gradient-to-r from-green-600 to-green-700 text-white'
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

export default ReportFoundPet;
