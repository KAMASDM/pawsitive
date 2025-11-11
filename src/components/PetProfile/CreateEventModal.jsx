import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX } from 'react-icons/fi';
import { FaBirthdayCake, FaPaw, FaHeart, FaStar, FaCalendar } from 'react-icons/fa';
import { ref, push, update } from 'firebase/database';
import { database } from '../../firebase';

const EVENT_TYPES = [
  { value: 'birthday', label: 'Birthday', icon: FaBirthdayCake, color: 'pink' },
  { value: 'veterinary', label: 'Vet Visit', icon: FaPaw, color: 'blue' },
  { value: 'adoption', label: 'Adoption Day', icon: FaHeart, color: 'red' },
  { value: 'achievement', label: 'Achievement', icon: FaStar, color: 'yellow' },
  { value: 'other', label: 'Other', icon: FaCalendar, color: 'violet' }
];

const CreateEventModal = ({ isOpen, onClose, pet, event }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [type, setType] = useState('other');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (event) {
      setTitle(event.title || '');
      setDescription(event.description || '');
      setDate(event.date || '');
      setType(event.type || 'other');
    } else {
      setTitle('');
      setDescription('');
      setDate('');
      setType('other');
    }
  }, [event]);

  const handleSave = async () => {
    if (!title.trim() || !date) {
      alert('Please fill in title and date');
      return;
    }

    setSaving(true);

    try {
      const eventData = {
        title: title.trim(),
        description: description.trim(),
        date,
        type,
        timestamp: Date.now()
      };

      if (event) {
        // Update existing event
        const eventRef = ref(database, `petEvents/${pet.id}/${event.id}`);
        await update(eventRef, eventData);
      } else {
        // Create new event
        const eventsRef = ref(database, `petEvents/${pet.id}`);
        await push(eventsRef, eventData);
      }

      // Reset and close
      setTitle('');
      setDescription('');
      setDate('');
      setType('other');
      setSaving(false);
      onClose();
    } catch (error) {
      console.error('Error saving event:', error);
      alert('Failed to save event. Please try again.');
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl w-full max-w-lg"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              {event ? 'Edit Event' : 'Add Event'}
            </h2>
            <button
              onClick={onClose}
              disabled={saving}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Event Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Type
              </label>
              <div className="grid grid-cols-3 gap-3">
                {EVENT_TYPES.map((eventType) => {
                  const Icon = eventType.icon;
                  const isSelected = type === eventType.value;
                  return (
                    <button
                      key={eventType.value}
                      onClick={() => setType(eventType.value)}
                      disabled={saving}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        isSelected
                          ? `border-${eventType.color}-500 bg-${eventType.color}-50`
                          : 'border-gray-200 hover:border-gray-300'
                      } disabled:opacity-50`}
                    >
                      <Icon
                        className={`w-6 h-6 mx-auto mb-1 ${
                          isSelected ? `text-${eventType.color}-500` : 'text-gray-400'
                        }`}
                      />
                      <p className={`text-xs font-medium ${
                        isSelected ? 'text-gray-900' : 'text-gray-600'
                      }`}>
                        {eventType.label}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., First Vet Checkup"
                disabled={saving}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-50"
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={saving}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-50"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add details about this event..."
                rows={3}
                disabled={saving}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-50 resize-none"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end space-x-3">
            <button
              onClick={onClose}
              disabled={saving}
              className="px-6 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!title.trim() || !date || saving}
              className="px-6 py-2.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Saving...
                </>
              ) : (
                event ? 'Update Event' : 'Add Event'
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CreateEventModal;
