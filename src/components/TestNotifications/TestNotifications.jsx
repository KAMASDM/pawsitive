import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiBell, FiMail, FiCheck, FiX, FiAlertCircle, FiCalendar, FiHeart, FiMapPin, FiActivity } from 'react-icons/fi';
import { auth } from '../../firebase';
import {
  requestNotificationPermission
} from '../../services/notificationService';
import emailNotifications from '../../services/emailNotifications';
import { runDailyNotificationChecks, runWeeklyNotificationChecks } from '../../services/notificationScheduler';

const TestNotifications = () => {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState([]);
  const [testEmail, setTestEmail] = useState('');

  const addResult = (test, success, message) => {
    setResults(prev => [...prev, { test, success, message, timestamp: new Date().toISOString() }]);
  };

  // ============================================================================
  // Individual Notification Tests
  // ============================================================================

  const testWelcomeEmail = async () => {
    setTesting(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        addResult('Welcome Email', false, 'Not logged in');
        return;
      }

      addResult('Welcome Email', null, 'Sending...');
      const result = await emailNotifications.sendWelcomeEmail({
        uid: user.uid,
        email: testEmail || user.email,
        displayName: user.displayName || 'Test User'
      });

      if (result.success) {
        addResult('Welcome Email', true, 'Sent successfully! Check your inbox.');
      } else {
        addResult('Welcome Email', false, `Failed: ${result.error?.text || 'Unknown error'}`);
      }
    } catch (error) {
      addResult('Welcome Email', false, error.message);
    } finally {
      setTesting(false);
    }
  };

  const testVaccinationReminder = async () => {
    setTesting(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        addResult('Vaccination Reminder', false, 'Not logged in');
        return;
      }

      addResult('Vaccination Reminder', null, 'Sending...');
      const result = await emailNotifications.sendVaccinationReminder(
        {
          uid: user.uid,
          email: testEmail || user.email,
          displayName: user.displayName || 'Test User'
        },
        {
          id: 'test-pet-1',
          name: 'Max',
          breed: 'Golden Retriever',
          age: '3 years'
        },
        {
          name: 'Rabies Vaccine',
          nextDue: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
          notes: 'Annual booster required'
        }
      );

      if (result.success) {
        addResult('Vaccination Reminder', true, 'Sent successfully!');
      } else {
        addResult('Vaccination Reminder', false, `Failed: ${result.error?.text || 'Unknown error'}`);
      }
    } catch (error) {
      addResult('Vaccination Reminder', false, error.message);
    } finally {
      setTesting(false);
    }
  };

  const testMatingRequest = async () => {
    setTesting(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        addResult('Mating Request', false, 'Not logged in');
        return;
      }

      addResult('Mating Request', null, 'Sending...');
      const result = await emailNotifications.sendMatingRequestNotification(
        {
          uid: user.uid,
          email: testEmail || user.email,
          displayName: user.displayName || 'Test User'
        },
        {
          uid: 'sender-123',
          displayName: 'Sarah Johnson'
        },
        {
          senderPetName: 'Bella',
          senderPetBreed: 'Golden Retriever',
          senderPetGender: 'Female',
          senderPetAge: '2 years',
          message: 'Hi! I think our pets would be a great match. Would love to connect!'
        }
      );

      if (result.success) {
        addResult('Mating Request', true, 'Sent successfully!');
      } else {
        addResult('Mating Request', false, `Failed: ${result.error?.text || 'Unknown error'}`);
      }
    } catch (error) {
      addResult('Mating Request', false, error.message);
    } finally {
      setTesting(false);
    }
  };

  const testRequestAccepted = async () => {
    setTesting(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        addResult('Request Accepted', false, 'Not logged in');
        return;
      }

      addResult('Request Accepted', null, 'Sending...');
      const result = await emailNotifications.sendMatingRequestAcceptedNotification(
        {
          uid: user.uid,
          email: testEmail || user.email,
          displayName: user.displayName || 'Test User'
        },
        {
          uid: 'receiver-123',
          displayName: 'Mike Brown'
        },
        {
          id: 'pet-123',
          name: 'Luna'
        }
      );

      if (result.success) {
        addResult('Request Accepted', true, 'Sent successfully!');
      } else {
        addResult('Request Accepted', false, `Failed: ${result.error?.text || 'Unknown error'}`);
      }
    } catch (error) {
      addResult('Request Accepted', false, error.message);
    } finally {
      setTesting(false);
    }
  };

  const testNewMessage = async () => {
    setTesting(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        addResult('New Message', false, 'Not logged in');
        return;
      }

      addResult('New Message', null, 'Sending...');
      const result = await emailNotifications.sendNewMessageNotification(
        {
          uid: user.uid,
          email: testEmail || user.email,
          displayName: user.displayName || 'Test User'
        },
        {
          uid: 'sender-123',
          displayName: 'Jennifer Smith'
        },
        'Hi! I saw your pet profile and would love to arrange a playdate. Are you available next weekend?'
      );

      if (result.success) {
        addResult('New Message', true, 'Sent successfully!');
      } else {
        addResult('New Message', false, `Failed: ${result.error?.text || 'Unknown error'}`);
      }
    } catch (error) {
      addResult('New Message', false, error.message);
    } finally {
      setTesting(false);
    }
  };

  const testNearbyMatesAlert = async () => {
    setTesting(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        addResult('Nearby Mates', false, 'Not logged in');
        return;
      }

      addResult('Nearby Mates', null, 'Sending...');
      const result = await emailNotifications.sendNearbyMatesAlert(
        {
          uid: user.uid,
          email: testEmail || user.email,
          displayName: user.displayName || 'Test User'
        },
        {
          id: 'pet-1',
          name: 'Buddy'
        },
        [
          { name: 'Luna', breed: 'Labrador', age: '3 years', gender: 'Female', distance: '5 km away' },
          { name: 'Charlie', breed: 'Golden Retriever', age: '4 years', gender: 'Male', distance: '12 km away' },
          { name: 'Daisy', breed: 'German Shepherd', age: '2 years', gender: 'Female', distance: '18 km away' }
        ]
      );

      if (result.success) {
        addResult('Nearby Mates', true, 'Sent successfully!');
      } else {
        addResult('Nearby Mates', false, `Failed: ${result.error?.text || 'Unknown error'}`);
      }
    } catch (error) {
      addResult('Nearby Mates', false, error.message);
    } finally {
      setTesting(false);
    }
  };

  const testPetBirthday = async () => {
    setTesting(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        addResult('Pet Birthday', false, 'Not logged in');
        return;
      }

      addResult('Pet Birthday', null, 'Sending...');
      const birthdayDate = new Date();
      birthdayDate.setDate(birthdayDate.getDate() + 3);
      
      const result = await emailNotifications.sendPetBirthdayReminder(
        {
          uid: user.uid,
          email: testEmail || user.email,
          displayName: user.displayName || 'Test User'
        },
        {
          id: 'pet-1',
          name: 'Rocky',
          dateOfBirth: birthdayDate.toISOString(),
          age: '3 years'
        }
      );

      if (result.success) {
        addResult('Pet Birthday', true, 'Sent successfully!');
      } else {
        addResult('Pet Birthday', false, `Failed: ${result.error?.text || 'Unknown error'}`);
      }
    } catch (error) {
      addResult('Pet Birthday', false, error.message);
    } finally {
      setTesting(false);
    }
  };

  const testPetFriendlyPlaces = async () => {
    setTesting(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        addResult('Pet-Friendly Places', false, 'Not logged in');
        return;
      }

      addResult('Pet-Friendly Places', null, 'Sending...');
      const result = await emailNotifications.sendPetFriendlyPlaceAlert(
        {
          uid: user.uid,
          email: testEmail || user.email,
          displayName: user.displayName || 'Test User'
        },
        [
          { name: 'Central Park Dog Run', address: '123 Park Ave, New York', isFriendly: true, description: 'Great off-leash area!' },
          { name: 'Sunset Beach', address: '456 Beach Rd, Miami', isFriendly: true, description: 'Pet-friendly beach' },
          { name: 'Downtown Shopping Mall', address: '789 Main St, LA', isFriendly: false, description: 'No pets allowed' }
        ]
      );

      if (result.success) {
        addResult('Pet-Friendly Places', true, 'Sent successfully!');
      } else {
        addResult('Pet-Friendly Places', false, `Failed: ${result.error?.text || 'Unknown error'}`);
      }
    } catch (error) {
      addResult('Pet-Friendly Places', false, error.message);
    } finally {
      setTesting(false);
    }
  };

  const testHealthCheckup = async () => {
    setTesting(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        addResult('Health Checkup', false, 'Not logged in');
        return;
      }

      addResult('Health Checkup', null, 'Sending...');
      const result = await emailNotifications.sendHealthCheckupReminder(
        {
          uid: user.uid,
          email: testEmail || user.email,
          displayName: user.displayName || 'Test User'
        },
        {
          id: 'pet-1',
          name: 'Max'
        },
        'semi-annual'
      );

      if (result.success) {
        addResult('Health Checkup', true, 'Sent successfully!');
      } else {
        addResult('Health Checkup', false, `Failed: ${result.error?.text || 'Unknown error'}`);
      }
    } catch (error) {
      addResult('Health Checkup', false, error.message);
    } finally {
      setTesting(false);
    }
  };

  const testAdoptionInquiry = async () => {
    setTesting(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        addResult('Adoption Inquiry', false, 'Not logged in');
        return;
      }

      addResult('Adoption Inquiry', null, 'Sending...');
      const result = await emailNotifications.sendAdoptionInquiryNotification(
        {
          uid: user.uid,
          email: testEmail || user.email,
          displayName: user.displayName || 'Test User'
        },
        {
          uid: 'interested-123',
          email: 'adopter@example.com',
          displayName: 'Emily Davis'
        },
        {
          id: 'pet-1',
          name: 'Bella'
        },
        'Hi! I\'m very interested in adopting Bella. I have a large backyard and lots of experience with dogs. Would love to discuss!'
      );

      if (result.success) {
        addResult('Adoption Inquiry', true, 'Sent successfully!');
      } else {
        addResult('Adoption Inquiry', false, `Failed: ${result.error?.text || 'Unknown error'}`);
      }
    } catch (error) {
      addResult('Adoption Inquiry', false, error.message);
    } finally {
      setTesting(false);
    }
  };

  const testWeeklyDigest = async () => {
    setTesting(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        addResult('Weekly Digest', false, 'Not logged in');
        return;
      }

      addResult('Weekly Digest', null, 'Sending...');
      const result = await emailNotifications.sendWeeklyDigest(
        {
          uid: user.uid,
          email: testEmail || user.email,
          displayName: user.displayName || 'Test User'
        },
        {
          newRequests: 5,
          newMessages: 12,
          profileViews: 28,
          nearbyMatches: 7,
          upcomingReminders: [
            'Max: Rabies vaccination due on Feb 1',
            'Bella: Annual checkup needed',
            'Rocky\'s birthday on Feb 5'
          ]
        }
      );

      if (result.success) {
        addResult('Weekly Digest', true, 'Sent successfully!');
      } else {
        addResult('Weekly Digest', false, `Failed: ${result.error?.text || 'Unknown error'}`);
      }
    } catch (error) {
      addResult('Weekly Digest', false, error.message);
    } finally {
      setTesting(false);
    }
  };

  // ============================================================================
  // Scheduler Tests
  // ============================================================================

  const testDailyScheduler = async () => {
    setTesting(true);
    try {
      addResult('Daily Scheduler', null, 'Running daily notification checks...');
      await runDailyNotificationChecks();
      addResult('Daily Scheduler', true, 'Completed! Check console and your email.');
    } catch (error) {
      addResult('Daily Scheduler', false, error.message);
    } finally {
      setTesting(false);
    }
  };

  const testWeeklyScheduler = async () => {
    setTesting(true);
    try {
      addResult('Weekly Scheduler', null, 'Running weekly notification checks...');
      await runWeeklyNotificationChecks();
      addResult('Weekly Scheduler', true, 'Completed! Check console and your email.');
    } catch (error) {
      addResult('Weekly Scheduler', false, error.message);
    } finally {
      setTesting(false);
    }
  };

  // ============================================================================
  // Other Tests
  // ============================================================================

  const testPushNotifications = async () => {
    setTesting(true);
    
    try {
      const user = auth.currentUser;
      if (!user) {
        addResult('Push Notifications', false, 'Not logged in');
        setTesting(false);
        return;
      }

      addResult('Push Notifications', null, 'Requesting permission...');
      
      const result = await requestNotificationPermission(user.uid);
      
      if (result.success) {
        addResult('Push Notifications', true, `Permission granted. Token: ${result.token?.substring(0, 20)}...`);
        addResult('Push Setup', null, 'Note: Actual push delivery requires Firebase Cloud Functions deployment');
      } else {
        addResult('Push Notifications', false, result.error);
      }
    } catch (error) {
      addResult('Push Notifications', false, error.message);
    } finally {
      setTesting(false);
    }
  };

  const checkEnvironmentVariables = () => {
    const envVars = {
      'VITE_EMAILJS_PUBLIC_KEY': import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
      'VITE_BASE_URL': import.meta.env.VITE_BASE_URL,
      'VITE_FIREBASE_API_KEY': import.meta.env.VITE_FIREBASE_API_KEY,
      'VITE_FIREBASE_VAPID_KEY': import.meta.env.VITE_FIREBASE_VAPID_KEY,
    };

    setResults([]);
    Object.entries(envVars).forEach(([key, value]) => {
      if (value) {
        addResult('Env Check', true, `${key}: ${value.substring(0, 20)}...`);
      } else {
        addResult('Env Check', false, `${key}: Missing!`);
      }
    });
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <FiBell className="text-violet-600 text-3xl" />
            <h1 className="text-3xl font-bold text-gray-900">Notification Testing Center</h1>
          </div>
          {results.length > 0 && (
            <button
              onClick={clearResults}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Clear Results
            </button>
          )}
        </div>

        <div className="space-y-4 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Test Email Address (optional)
            </label>
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder={auth.currentUser?.email || 'your@email.com'}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave empty to use your current account email
            </p>
          </div>
        </div>

        {/* Transactional Emails */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FiMail className="text-violet-600" />
            Transactional Emails (Real-time)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <button
              onClick={testWelcomeEmail}
              disabled={testing}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white py-3 px-4 rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
            >
              <FiMail className="text-lg" />
              Welcome Email
            </button>

            <button
              onClick={testMatingRequest}
              disabled={testing}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-rose-600 text-white py-3 px-4 rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
            >
              <FiHeart className="text-lg" />
              Mating Request
            </button>

            <button
              onClick={testRequestAccepted}
              disabled={testing}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-4 rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
            >
              <FiCheck className="text-lg" />
              Request Accepted
            </button>

            <button
              onClick={testNewMessage}
              disabled={testing}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 px-4 rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
            >
              <FiBell className="text-lg" />
              New Message
            </button>

            <button
              onClick={testAdoptionInquiry}
              disabled={testing}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white py-3 px-4 rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
            >
              <FiHeart className="text-lg" />
              Adoption Inquiry
            </button>
          </div>
        </div>

        {/* Scheduled Reminders */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FiCalendar className="text-green-600" />
            Scheduled Reminders (Automated)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <button
              onClick={testVaccinationReminder}
              disabled={testing}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-pink-600 text-white py-3 px-4 rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
            >
              <FiActivity className="text-lg" />
              Vaccination Due
            </button>

            <button
              onClick={testHealthCheckup}
              disabled={testing}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-3 px-4 rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
            >
              <FiActivity className="text-lg" />
              Health Checkup
            </button>

            <button
              onClick={testPetBirthday}
              disabled={testing}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-500 to-orange-600 text-white py-3 px-4 rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
            >
              <FiCalendar className="text-lg" />
              Pet Birthday
            </button>
          </div>
        </div>

        {/* Discovery & Engagement */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FiMapPin className="text-blue-600" />
            Discovery & Engagement
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <button
              onClick={testNearbyMatesAlert}
              disabled={testing}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white py-3 px-4 rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
            >
              <FiMapPin className="text-lg" />
              Nearby Mates
            </button>

            <button
              onClick={testPetFriendlyPlaces}
              disabled={testing}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-green-600 text-white py-3 px-4 rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
            >
              <FiMapPin className="text-lg" />
              New Places
            </button>

            <button
              onClick={testWeeklyDigest}
              disabled={testing}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 px-4 rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
            >
              <FiCalendar className="text-lg" />
              Weekly Digest
            </button>
          </div>
        </div>

        {/* Automation Schedulers */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FiActivity className="text-orange-600" />
            Automation Schedulers (Run All Checks)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              onClick={testDailyScheduler}
              disabled={testing}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-red-600 text-white py-3 px-4 rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
            >
              <FiCalendar className="text-lg" />
              Daily Scheduler
            </button>

            <button
              onClick={testWeeklyScheduler}
              disabled={testing}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-fuchsia-500 to-pink-600 text-white py-3 px-4 rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
            >
              <FiCalendar className="text-lg" />
              Weekly Scheduler
            </button>

            <button
              onClick={testPushNotifications}
              disabled={testing}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-gray-500 to-slate-600 text-white py-3 px-4 rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
            >
              <FiBell className="text-lg" />
              Push Permission
            </button>
          </div>
        </div>

        {/* System Check */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FiAlertCircle className="text-gray-600" />
            System Check
          </h2>
          <button
            onClick={checkEnvironmentVariables}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white py-3 px-6 rounded-xl hover:shadow-lg transition-all"
          >
            <FiAlertCircle className="text-lg" />
            Check Environment Variables
          </button>
        </div>

        {results.length > 0 && (
          <div className="bg-gray-50 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Test Results</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {results.map((result, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex items-start gap-3 p-3 rounded-lg ${
                    result.success === true
                      ? 'bg-green-50 border border-green-200'
                      : result.success === false
                      ? 'bg-red-50 border border-red-200'
                      : 'bg-blue-50 border border-blue-200'
                  }`}
                >
                  {result.success === true && <FiCheck className="text-green-600 text-xl flex-shrink-0 mt-0.5" />}
                  {result.success === false && <FiX className="text-red-600 text-xl flex-shrink-0 mt-0.5" />}
                  {result.success === null && <FiBell className="text-blue-600 text-xl flex-shrink-0 mt-0.5 animate-pulse" />}
                  
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-gray-900">{result.test}</p>
                    <p className="text-sm text-gray-600 break-words">{result.message}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(result.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 space-y-4">
          <div className="p-4 bg-violet-50 border border-violet-200 rounded-xl">
            <h3 className="font-semibold text-violet-900 mb-2 flex items-center gap-2">
              <FiMail className="text-lg" />
              Email Notifications (11 types)
            </h3>
            <ul className="text-sm text-violet-800 space-y-1 list-disc list-inside">
              <li><strong>Transactional:</strong> Welcome, Mating Request, Request Accepted, New Message, Adoption Inquiry</li>
              <li><strong>Scheduled:</strong> Vaccination Reminder, Health Checkup, Pet Birthday</li>
              <li><strong>Discovery:</strong> Nearby Mates, Pet-Friendly Places, Weekly Digest</li>
              <li>All emails use beautiful branded templates with violet gradient</li>
              <li>EmailJS free tier: 200 emails/month</li>
            </ul>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <FiActivity className="text-lg" />
              Automation Schedulers
            </h3>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li><strong>Daily Scheduler:</strong> Checks vaccination reminders (7-day window), birthday reminders (3-day window), health checkups (6-month intervals)</li>
              <li><strong>Weekly Scheduler:</strong> Sends activity digests to all users every Monday</li>
              <li>Run these manually for testing, or deploy via Cloud Functions for automation</li>
            </ul>
          </div>

          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
            <h3 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
              <FiAlertCircle className="text-lg" />
              Important Notes
            </h3>
            <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
              <li>Make sure you're logged in before testing</li>
              <li>Check spam folder if emails don't arrive within 30 seconds</li>
              <li>Push notifications require browser permission and Firebase Cloud Functions deployment</li>
              <li>Schedulers scan your database - they'll only send if conditions are met (e.g., vaccination due in 7 days)</li>
              <li>For production, set up Cloud Functions to run schedulers automatically</li>
            </ul>
          </div>

          <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
            <h3 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
              <FiCheck className="text-lg" />
              What's Working
            </h3>
            <ul className="text-sm text-green-800 space-y-1 list-disc list-inside">
              <li>✅ EmailJS integration configured</li>
              <li>✅ 11 comprehensive email templates created</li>
              <li>✅ Beautiful branded email design</li>
              <li>✅ Automated scheduler functions ready</li>
              <li>✅ User preference system in place</li>
              <li>✅ Database logging for all notifications</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestNotifications;
