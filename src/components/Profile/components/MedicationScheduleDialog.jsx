import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiClock, FiBell, FiCalendar, FiCheck } from "react-icons/fi";
import { FaPills } from "react-icons/fa";

const MedicationScheduleDialog = ({
  open,
  onClose,
  medication,
  onSave,
  isEditMode = false,
}) => {
  const [schedule, setSchedule] = useState(
    medication || {
      name: "",
      dosage: "",
      frequency: "daily",
      timeOfDay: "08:00",
      startDate: new Date().toISOString().split("T")[0],
      endDate: "",
      reminderEnabled: true,
      notes: "",
    }
  );

  const [errors, setErrors] = useState({});

  const frequencies = [
    { value: "daily", label: "Daily", description: "Every day" },
    { value: "twice-daily", label: "Twice Daily", description: "Morning & evening" },
    { value: "three-times-daily", label: "Three Times Daily", description: "Morning, afternoon & evening" },
    { value: "weekly", label: "Weekly", description: "Once per week" },
    { value: "bi-weekly", label: "Bi-weekly", description: "Every 2 weeks" },
    { value: "monthly", label: "Monthly", description: "Once per month" },
    { value: "as-needed", label: "As Needed", description: "PRN - when required" },
  ];

  const validateForm = () => {
    const newErrors = {};
    if (!schedule.name.trim()) newErrors.name = "Medication name is required";
    if (!schedule.dosage.trim()) newErrors.dosage = "Dosage is required";
    if (!schedule.startDate) newErrors.startDate = "Start date is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave(schedule);
      onClose();
    }
  };

  const handleChange = (field, value) => {
    setSchedule({ ...schedule, [field]: value });
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-t-2xl flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <FaPills className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">
                    {isEditMode ? "Edit Medication Schedule" : "Schedule Medication"}
                  </h2>
                  <p className="text-sm text-white/80">Set dosage and reminder times</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Form Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Medication Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Medication Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={schedule.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="e.g., Apoquel, Heartgard, etc."
                    className={`w-full px-4 py-2.5 rounded-lg border ${
                      errors.name ? "border-red-300" : "border-gray-300"
                    } focus:outline-none focus:ring-2 focus:ring-violet-500`}
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>

                {/* Dosage */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dosage <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={schedule.dosage}
                    onChange={(e) => handleChange("dosage", e.target.value)}
                    placeholder="e.g., 10mg, 1 tablet, 2ml, etc."
                    className={`w-full px-4 py-2.5 rounded-lg border ${
                      errors.dosage ? "border-red-300" : "border-gray-300"
                    } focus:outline-none focus:ring-2 focus:ring-violet-500`}
                  />
                  {errors.dosage && (
                    <p className="mt-1 text-sm text-red-600">{errors.dosage}</p>
                  )}
                </div>

                {/* Frequency */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Frequency
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {frequencies.map((freq) => (
                      <button
                        key={freq.value}
                        type="button"
                        onClick={() => handleChange("frequency", freq.value)}
                        className={`p-3 rounded-lg border-2 text-left transition-all ${
                          schedule.frequency === freq.value
                            ? "border-violet-500 bg-violet-50"
                            : "border-gray-200 hover:border-violet-300"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-medium text-gray-900">{freq.label}</div>
                            <div className="text-xs text-gray-500 mt-0.5">{freq.description}</div>
                          </div>
                          {schedule.frequency === freq.value && (
                            <FiCheck className="text-violet-600 flex-shrink-0 mt-0.5" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time of Day */}
                {schedule.frequency !== "as-needed" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <FiClock className="w-4 h-4" />
                      Time of Day
                    </label>
                    <input
                      type="time"
                      value={schedule.timeOfDay}
                      onChange={(e) => handleChange("timeOfDay", e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Set the time when you want to take/give this medication
                    </p>
                  </div>
                )}

                {/* Date Range */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <FiCalendar className="w-4 h-4" />
                      Start Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={schedule.startDate}
                      onChange={(e) => handleChange("startDate", e.target.value)}
                      className={`w-full px-4 py-2.5 rounded-lg border ${
                        errors.startDate ? "border-red-300" : "border-gray-300"
                      } focus:outline-none focus:ring-2 focus:ring-violet-500`}
                    />
                    {errors.startDate && (
                      <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={schedule.endDate}
                      onChange={(e) => handleChange("endDate", e.target.value)}
                      min={schedule.startDate}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Leave empty for ongoing medication
                    </p>
                  </div>
                </div>

                {/* Reminder Toggle */}
                <div className="bg-violet-50 border border-violet-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => handleChange("reminderEnabled", !schedule.reminderEnabled)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        schedule.reminderEnabled ? "bg-violet-600" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          schedule.reminderEnabled ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <FiBell className="w-4 h-4 text-violet-600" />
                        <span className="font-medium text-gray-900">Enable Reminders</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Get email and push notifications at scheduled times
                      </p>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={schedule.notes}
                    onChange={(e) => handleChange("notes", e.target.value)}
                    placeholder="Add any special instructions, side effects to watch for, etc."
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 p-4 flex justify-end gap-3 bg-gray-50 rounded-b-2xl">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg flex items-center gap-2 transition-colors"
              >
                <FiCheck className="w-4 h-4" />
                {isEditMode ? "Update Schedule" : "Save Schedule"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default MedicationScheduleDialog;
