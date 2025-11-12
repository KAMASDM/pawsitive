import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiMapPin, FiThumbsUp, FiThumbsDown, FiCheck } from 'react-icons/fi';
import { ref as dbRef, onValue, update } from 'firebase/database';
import { database, auth } from '../../firebase';

const PlaceNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [visibleNotifications, setVisibleNotifications] = useState([]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const notificationsRef = dbRef(database, `notifications/${user.uid}`);
    
    const unsubscribe = onValue(notificationsRef, (snapshot) => {
      if (!snapshot.exists()) {
        setNotifications([]);
        return;
      }

      const notificationsData = [];
      snapshot.forEach((childSnapshot) => {
        const notification = {
          id: childSnapshot.key,
          ...childSnapshot.val(),
        };
        
        // Only show unread pet_friendly_place notifications
        if (notification.type === 'pet_friendly_place' && !notification.read) {
          notificationsData.push(notification);
        }
      });

      setNotifications(notificationsData);
      
      // Show notifications one by one with delay
      notificationsData.forEach((notification, index) => {
        setTimeout(() => {
          setVisibleNotifications(prev => {
            if (!prev.find(n => n.id === notification.id)) {
              return [...prev, notification];
            }
            return prev;
          });
          
          // Auto-hide after 8 seconds
          setTimeout(() => {
            handleDismiss(notification.id);
          }, 8000);
        }, index * 1000);
      });
    });

    return () => unsubscribe();
  }, []);

  const handleDismiss = async (notificationId) => {
    const user = auth.currentUser;
    if (!user) return;

    // Mark as read in database
    const notificationRef = dbRef(database, `notifications/${user.uid}/${notificationId}`);
    await update(notificationRef, { read: true });

    // Remove from visible notifications
    setVisibleNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const handleMarkAsRead = async (notificationId) => {
    const user = auth.currentUser;
    if (!user) return;

    const notificationRef = dbRef(database, `notifications/${user.uid}/${notificationId}`);
    await update(notificationRef, { read: true });
    
    setVisibleNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  return (
    <div className="fixed top-20 right-4 z-50 space-y-3 max-w-md">
      <AnimatePresence>
        {visibleNotifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.8 }}
            className="bg-white rounded-2xl shadow-2xl border-2 border-violet-200 p-4 max-w-sm"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-start gap-3 flex-1">
                <div className={`p-2 rounded-xl ${notification.isPetFriendly ? 'bg-green-100' : 'bg-red-100'}`}>
                  <FiMapPin className={`text-xl ${notification.isPetFriendly ? 'text-green-600' : 'text-red-600'}`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-sm mb-1">
                    New Place Tagged Nearby!
                  </h3>
                  <p className="font-semibold text-violet-600 text-sm mb-1">
                    {notification.placeName}
                  </p>
                  <div className="flex items-center gap-2 mb-2">
                    {notification.isPetFriendly ? (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-lg font-semibold flex items-center">
                        <FiThumbsUp className="mr-1" /> Pet Friendly
                      </span>
                    ) : (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-lg font-semibold flex items-center">
                        <FiThumbsDown className="mr-1" /> Not Pet Friendly
                      </span>
                    )}
                    <span className="text-xs text-gray-500">
                      {notification.distance} km away
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {notification.comment}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Tagged by {notification.fromUser}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleDismiss(notification.id)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX className="text-gray-400" />
              </button>
            </div>
            
            <button
              onClick={() => handleMarkAsRead(notification.id)}
              className="w-full mt-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white py-2 px-4 rounded-lg text-xs font-semibold hover:from-violet-700 hover:to-purple-700 transition-all flex items-center justify-center gap-2"
            >
              <FiCheck /> Got it!
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default PlaceNotifications;
