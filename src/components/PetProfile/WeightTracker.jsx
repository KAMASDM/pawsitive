import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiTrendingUp, FiTrendingDown, FiActivity, FiCalendar, FiEdit2, FiTrash2, FiX } from 'react-icons/fi';
import { FaWeight, FaChartLine } from 'react-icons/fa';
import { ref as dbRef, update, push } from 'firebase/database';
import { database, auth } from '../../firebase';

const WeightTracker = ({ pet, onUpdate }) => {
  const [weightHistory, setWeightHistory] = useState([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newWeight, setNewWeight] = useState('');
  const [weightDate, setWeightDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (pet?.weightHistory) {
      const history = Object.entries(pet.weightHistory).map(([id, data]) => ({
        id,
        ...data
      })).sort((a, b) => new Date(b.date) - new Date(a.date));
      setWeightHistory(history);
    }
  }, [pet]);

  const currentWeight = weightHistory[0]?.weight || pet?.weight || 0;
  const previousWeight = weightHistory[1]?.weight;
  const weightChange = previousWeight ? currentWeight - previousWeight : 0;
  const weightTrend = weightChange > 0 ? 'up' : weightChange < 0 ? 'down' : 'stable';

  // Calculate ideal weight range based on breed/type
  const getIdealWeightRange = () => {
    if (!pet?.type) return null;
    
    // This is simplified - in production, you'd have a database of breed weights
    if (pet.type === 'dog') {
      if (pet.breed?.toLowerCase().includes('chihuahua')) return { min: 2, max: 3 };
      if (pet.breed?.toLowerCase().includes('labrador')) return { min: 25, max: 36 };
      if (pet.breed?.toLowerCase().includes('german shepherd')) return { min: 30, max: 40 };
      return { min: 10, max: 30 }; // Default range
    } else if (pet.type === 'cat') {
      return { min: 3, max: 5 }; // Average cat weight
    }
    return null;
  };

  const idealRange = getIdealWeightRange();
  const isHealthyWeight = idealRange ? 
    currentWeight >= idealRange.min && currentWeight <= idealRange.max : null;

  const handleAddWeight = async () => {
    if (!newWeight || !weightDate) return;

    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) return;

      const weightEntry = {
        weight: parseFloat(newWeight),
        date: weightDate,
        notes: notes.trim(),
        timestamp: Date.now()
      };

      const petRef = dbRef(database, `userPets/${user.uid}/${pet.id}`);
      const weightHistoryRef = dbRef(database, `userPets/${user.uid}/${pet.id}/weightHistory`);
      const newEntryRef = push(weightHistoryRef);

      await update(petRef, {
        weight: parseFloat(newWeight),
        [`weightHistory/${newEntryRef.key}`]: weightEntry
      });

      if (onUpdate) onUpdate();
      setShowAddDialog(false);
      setNewWeight('');
      setNotes('');
    } catch (error) {
      console.error('Error adding weight:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEntry = async (entryId) => {
    if (!window.confirm('Delete this weight entry?')) return;

    try {
      const user = auth.currentUser;
      if (!user) return;

      const entryRef = dbRef(database, `userPets/${user.uid}/${pet.id}/weightHistory/${entryId}`);
      await update(entryRef, null);

      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error deleting weight entry:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Weight Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl p-6 text-white shadow-xl"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <FaWeight className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm opacity-90">Current Weight</h3>
              <p className="text-3xl font-bold">{currentWeight} kg</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddDialog(true)}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl transition-all flex items-center gap-2"
          >
            <FiPlus className="w-5 h-5" />
            <span className="hidden sm:inline">Add Entry</span>
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              {weightTrend === 'up' ? (
                <FiTrendingUp className="w-4 h-4" />
              ) : weightTrend === 'down' ? (
                <FiTrendingDown className="w-4 h-4" />
              ) : (
                <FiActivity className="w-4 h-4" />
              )}
              <span className="text-xs opacity-90">Change</span>
            </div>
            <p className="text-lg font-bold">
              {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)} kg
            </p>
          </div>

          {idealRange && (
            <>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                <p className="text-xs opacity-90 mb-1">Ideal Range</p>
                <p className="text-lg font-bold">{idealRange.min}-{idealRange.max} kg</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                <p className="text-xs opacity-90 mb-1">Status</p>
                <p className="text-lg font-bold">
                  {isHealthyWeight ? '✓ Healthy' : currentWeight < idealRange.min ? '⚠️ Low' : '⚠️ High'}
                </p>
              </div>
            </>
          )}
        </div>
      </motion.div>

      {/* Weight History Chart */}
      {weightHistory.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200"
        >
          <div className="flex items-center gap-2 mb-4">
            <FaChartLine className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-bold text-gray-900">Weight Trend</h3>
          </div>

          {/* Simple Line Chart */}
          <div className="relative h-48">
            <svg className="w-full h-full">
              {/* Grid lines */}
              <line x1="0" y1="0" x2="0" y2="100%" stroke="#e5e7eb" strokeWidth="1" />
              <line x1="0" y1="100%" x2="100%" y2="100%" stroke="#e5e7eb" strokeWidth="1" />

              {/* Weight line */}
              {weightHistory.length > 1 && (
                <polyline
                  points={weightHistory.reverse().map((entry, i) => {
                    const x = (i / (weightHistory.length - 1)) * 100;
                    const maxWeight = Math.max(...weightHistory.map(e => e.weight));
                    const minWeight = Math.min(...weightHistory.map(e => e.weight));
                    const range = maxWeight - minWeight || 1;
                    const y = 100 - ((entry.weight - minWeight) / range) * 90;
                    return `${x}%,${y}%`;
                  }).join(' ')}
                  fill="none"
                  stroke="url(#gradient)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Gradient definition */}
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </motion.div>
      )}

      {/* Weight History List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200"
      >
        <h3 className="text-lg font-bold text-gray-900 mb-4">Weight History</h3>
        
        {weightHistory.length === 0 ? (
          <div className="text-center py-8">
            <FaWeight className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">No weight entries yet</p>
            <button
              onClick={() => setShowAddDialog(true)}
              className="px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition-all"
            >
              Add First Entry
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {weightHistory.map((entry, index) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-4 bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl border border-violet-200 hover:shadow-md transition-all"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-2xl font-bold text-blue-600">{entry.weight} kg</span>
                    {index < weightHistory.length - 1 && (
                      <span className={`text-sm px-2 py-1 rounded-full ${
                        entry.weight > weightHistory[index + 1].weight
                          ? 'bg-red-100 text-red-700'
                          : entry.weight < weightHistory[index + 1].weight
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {entry.weight > weightHistory[index + 1].weight ? '↑' : entry.weight < weightHistory[index + 1].weight ? '↓' : '→'}
                        {Math.abs(entry.weight - weightHistory[index + 1].weight).toFixed(1)} kg
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FiCalendar className="w-4 h-4" />
                    <span>{new Date(entry.date).toLocaleDateString()}</span>
                  </div>
                  {entry.notes && (
                    <p className="text-sm text-gray-600 mt-2 italic">💭 {entry.notes}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteEntry(entry.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Add Weight Dialog */}
      <AnimatePresence>
        {showAddDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl w-full max-w-md shadow-2xl"
            >
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Add Weight Entry</h3>
                <button
                  onClick={() => setShowAddDialog(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Weight (kg) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={newWeight}
                    onChange={(e) => setNewWeight(e.target.value)}
                    placeholder="e.g., 25.5"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={weightDate}
                    onChange={(e) => setWeightDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any observations or notes..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 resize-none"
                  />
                </div>

                <button
                  onClick={handleAddWeight}
                  disabled={!newWeight || !weightDate || loading}
                  className="w-full py-3 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Adding...' : 'Add Entry'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WeightTracker;
