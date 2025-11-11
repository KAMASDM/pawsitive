import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiCalendar, FiPlus, FiEdit2, FiTrash2, FiClock } from 'react-icons/fi';
import { FaBirthdayCake, FaPaw, FaHeart, FaStar } from 'react-icons/fa';
import CreateEventModal from './CreateEventModal';
import { ref, remove } from 'firebase/database';
import { database } from '../../firebase';

const PetEventsTimeline = ({ events, pet, isOwner, birthday }) => {
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  const handleDeleteEvent = async (eventId) => {
    if (!isOwner) return;

    if (window.confirm('Delete this event?')) {
      const eventRef = ref(database, `petEvents/${pet.id}/${eventId}`);
      await remove(eventRef);
    }
  };

  const handleEditEvent = (event) => {
    setEditingEvent(event);
    setShowCreateEvent(true);
  };

  const getEventIcon = (type) => {
    switch (type) {
      case 'birthday': return <FaBirthdayCake className="w-5 h-5 text-pink-500" />;
      case 'veterinary': return <FaPaw className="w-5 h-5 text-blue-500" />;
      case 'adoption': return <FaHeart className="w-5 h-5 text-red-500" />;
      case 'achievement': return <FaStar className="w-5 h-5 text-yellow-500" />;
      default: return <FiCalendar className="w-5 h-5 text-violet-500" />;
    }
  };

  const formatEventDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const isUpcoming = date > now;

    const formattedDate = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    if (isUpcoming) {
      const daysUntil = Math.ceil((date - now) / (1000 * 60 * 60 * 24));
      return {
        date: formattedDate,
        relative: `In ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`,
        isUpcoming: true
      };
    } else {
      return {
        date: formattedDate,
        relative: null,
        isUpcoming: false
      };
    }
  };

  const upcomingEvents = events.filter(e => new Date(e.date) > new Date());
  const pastEvents = events.filter(e => new Date(e.date) <= new Date());

  return (
    <div className="bg-white rounded-xl shadow-sm sticky top-8">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Events</h2>
          {isOwner && (
            <button
              onClick={() => {
                setEditingEvent(null);
                setShowCreateEvent(true);
              }}
              className="p-2 text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
            >
              <FiPlus className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Birthday Countdown */}
        {birthday && !birthday.isToday && (
          <div className="mb-6 p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl border border-pink-200">
            <div className="flex items-center mb-2">
              <FaBirthdayCake className="w-5 h-5 text-pink-500 mr-2" />
              <h3 className="font-semibold text-gray-900">Next Birthday</h3>
            </div>
            <p className="text-sm text-gray-700 mb-1">
              {birthday.date.toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </p>
            <p className="text-xs text-pink-600 font-medium">
              🎉 In {birthday.daysUntil} day{birthday.daysUntil !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        {/* Upcoming Events */}
        {upcomingEvents.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
              Upcoming
            </h3>
            <div className="space-y-3">
              {upcomingEvents.map((event) => {
                const dateInfo = formatEventDate(event.date);
                return (
                  <motion.div
                    key={event.id}
                    whileHover={{ scale: 1.02 }}
                    className="p-3 bg-violet-50 border border-violet-200 rounded-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start flex-1">
                        <div className="mt-1 mr-3">
                          {getEventIcon(event.type)}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 text-sm mb-1">
                            {event.title}
                          </h4>
                          <p className="text-xs text-gray-600 mb-1">{dateInfo.date}</p>
                          {dateInfo.relative && (
                            <p className="text-xs text-violet-600 font-medium">
                              {dateInfo.relative}
                            </p>
                          )}
                          {event.description && (
                            <p className="text-xs text-gray-600 mt-2">
                              {event.description}
                            </p>
                          )}
                        </div>
                      </div>
                      {isOwner && (
                        <div className="flex items-center space-x-1 ml-2">
                          <button
                            onClick={() => handleEditEvent(event)}
                            className="p-1.5 text-gray-600 hover:bg-white rounded"
                          >
                            <FiEdit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteEvent(event.id)}
                            className="p-1.5 text-red-600 hover:bg-white rounded"
                          >
                            <FiTrash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Past Events */}
        {pastEvents.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
              Past Events
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {pastEvents.reverse().map((event) => {
                const dateInfo = formatEventDate(event.date);
                return (
                  <div
                    key={event.id}
                    className="p-3 bg-gray-50 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start flex-1">
                        <div className="mt-1 mr-3 opacity-50">
                          {getEventIcon(event.type)}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-700 text-sm mb-1">
                            {event.title}
                          </h4>
                          <p className="text-xs text-gray-500">{dateInfo.date}</p>
                          {event.description && (
                            <p className="text-xs text-gray-600 mt-2">
                              {event.description}
                            </p>
                          )}
                        </div>
                      </div>
                      {isOwner && (
                        <button
                          onClick={() => handleDeleteEvent(event.id)}
                          className="p-1.5 text-red-600 hover:bg-white rounded ml-2"
                        >
                          <FiTrash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {events.length === 0 && (
          <div className="text-center py-8">
            <FiCalendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm mb-4">No events yet</p>
            {isOwner && (
              <button
                onClick={() => setShowCreateEvent(true)}
                className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors text-sm"
              >
                Add First Event
              </button>
            )}
          </div>
        )}
      </div>

      {/* Create/Edit Event Modal */}
      <CreateEventModal
        isOpen={showCreateEvent}
        onClose={() => {
          setShowCreateEvent(false);
          setEditingEvent(null);
        }}
        pet={pet}
        event={editingEvent}
      />
    </div>
  );
};

export default PetEventsTimeline;
