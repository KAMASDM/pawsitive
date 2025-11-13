import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaSyringe, FaPills, FaBell, FaChevronRight } from 'react-icons/fa';
import { FiCalendar, FiClock, FiChevronRight } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { ref, get } from 'firebase/database';
import { auth, database } from '../../firebase';

const UpcomingReminders = () => {
  const navigate = useNavigate();
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('UpcomingReminders: Component mounted');
    
    // Wait for auth state to be ready
    const unsubscribe = auth.onAuthStateChanged((user) => {
      console.log('UpcomingReminders: Auth state changed, user:', user?.uid);
      if (user) {
        fetchReminders(user);
      } else {
        console.log('UpcomingReminders: No user, stopping');
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchReminders = async (user) => {
    console.log('UpcomingReminders: Fetching reminders for user:', user.uid);

      try {
        const petsRef = ref(database, `userPets/${user.uid}`);
        const snapshot = await get(petsRef);
        
        if (snapshot.exists()) {
          const petsData = snapshot.val();
          console.log('UpcomingReminders: Pets data:', petsData);
          const allReminders = [];
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          Object.entries(petsData).forEach(([petId, pet]) => {
            console.log('UpcomingReminders: Checking pet:', pet.name || pet.petName, petId);
            
            // Check vaccinations
            if (pet.vaccinations && Array.isArray(pet.vaccinations)) {
              console.log('UpcomingReminders: Vaccinations found:', pet.vaccinations);
              pet.vaccinations.forEach((vaccination) => {
                if (vaccination.nextDue) {
                  const dueDate = new Date(vaccination.nextDue);
                  dueDate.setHours(0, 0, 0, 0);
                  const daysUntil = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
                  
                  console.log('UpcomingReminders: Vaccination', vaccination.name, 'days until:', daysUntil);
                  
                  // Show if due within next 30 days or overdue
                  if (daysUntil <= 30) {
                    allReminders.push({
                      type: 'vaccination',
                      petId,
                      petName: pet.name || pet.petName,
                      petImage: pet.image || pet.profilePicture,
                      name: vaccination.name || vaccination,
                      dueDate: vaccination.nextDue,
                      daysUntil,
                      isOverdue: daysUntil < 0,
                      isUrgent: daysUntil <= 7 && daysUntil >= 0,
                    });
                  }
                }
              });
            }

            // Check medications
            if (pet.medications && Array.isArray(pet.medications)) {
              console.log('UpcomingReminders: Medications found:', pet.medications);
              pet.medications.forEach((medication) => {
                // Only show active medications with schedules
                if (medication.active && medication.schedule) {
                  console.log('UpcomingReminders: Active medication:', medication.name);
                  allReminders.push({
                    type: 'medication',
                    petId,
                    petName: pet.name || pet.petName,
                    petImage: pet.image || pet.profilePicture,
                    name: medication.name || medication,
                    schedule: medication.schedule,
                    dosage: medication.dosage,
                    isActive: true,
                  });
                }
              });
            } else {
              console.log('UpcomingReminders: No medications or not an array');
            }
          });

          console.log('UpcomingReminders: Total reminders found:', allReminders.length);

          // Sort by urgency: overdue > urgent > upcoming > active medications
          allReminders.sort((a, b) => {
            if (a.type === 'vaccination' && b.type === 'vaccination') {
              if (a.isOverdue && !b.isOverdue) return -1;
              if (!a.isOverdue && b.isOverdue) return 1;
              if (a.isUrgent && !b.isUrgent) return -1;
              if (!a.isUrgent && b.isUrgent) return 1;
              return a.daysUntil - b.daysUntil;
            }
            if (a.type === 'vaccination') return -1;
            if (b.type === 'vaccination') return 1;
            return 0;
          });

          console.log('UpcomingReminders: Sorted reminders:', allReminders);
          setReminders(allReminders.slice(0, 5)); // Show max 5 reminders
        } else {
          console.log('UpcomingReminders: No pets found in database');
        }
      } catch (error) {
        console.error('UpcomingReminders: Error fetching reminders:', error);
      } finally {
        setLoading(false);
      }
  };

  const formatDaysUntil = (days) => {
    if (days < 0) return `${Math.abs(days)} days overdue`;
    if (days === 0) return 'Due today';
    if (days === 1) return 'Due tomorrow';
    return `Due in ${days} days`;
  };

  const getUrgencyColor = (reminder) => {
    if (reminder.type === 'medication') {
      return 'from-blue-500 to-blue-600';
    }
    if (reminder.isOverdue) {
      return 'from-red-500 to-red-600';
    }
    if (reminder.isUrgent) {
      return 'from-amber-500 to-orange-600';
    }
    return 'from-green-500 to-green-600';
  };

  const getIcon = (reminder) => {
    if (reminder.type === 'medication') {
      return <FaPills className="w-5 h-5" />;
    }
    return <FaSyringe className="w-5 h-5" />;
  };

  console.log('UpcomingReminders: Rendering - Loading:', loading, 'Reminders count:', reminders.length);

  if (loading) {
    console.log('UpcomingReminders: Still loading, not rendering');
    return null;
  }

  if (reminders.length === 0) {
    console.log('UpcomingReminders: No reminders to show');
    return null;
  }

  console.log('UpcomingReminders: Rendering reminders section');

  // Determine if we're on mobile or desktop based on container
  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.15 }}
      className="mb-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
            <FaBell className="w-4 h-4 text-violet-600" />
          </div>
          <h2 className="text-lg lg:text-2xl font-bold text-slate-800">Upcoming Reminders</h2>
        </div>
        <button
          onClick={() => navigate('/profile')}
          className="text-violet-600 text-sm font-medium hover:text-violet-700 transition-colors flex items-center gap-1"
        >
          View All
          <FiChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Reminders List - Grid on Desktop, Stack on Mobile */}
      <div className={isDesktop ? "grid grid-cols-2 gap-4" : "space-y-3"}>
        {reminders.map((reminder, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => navigate(`/pet-details/${reminder.petId}`)}
            className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 cursor-pointer overflow-hidden"
          >
            <div className="flex items-center p-4">
              {/* Icon */}
              <div className={`w-12 h-12 bg-gradient-to-br ${getUrgencyColor(reminder)} rounded-lg flex items-center justify-center text-white flex-shrink-0`}>
                {getIcon(reminder)}
              </div>

              {/* Content */}
              <div className="flex-1 ml-3 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate text-sm">
                      {reminder.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      {reminder.petImage ? (
                        <img
                          src={reminder.petImage}
                          alt={reminder.petName}
                          className="w-5 h-5 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-violet-100 flex items-center justify-center text-xs">
                          🐾
                        </div>
                      )}
                      <span className="text-xs text-gray-600">{reminder.petName}</span>
                    </div>
                  </div>
                  
                  {/* Status Badge */}
                  <div className="ml-2 flex-shrink-0">
                    {reminder.type === 'vaccination' ? (
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        reminder.isOverdue
                          ? 'bg-red-100 text-red-700'
                          : reminder.isUrgent
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {formatDaysUntil(reminder.daysUntil)}
                      </div>
                    ) : (
                      <div className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        Active
                      </div>
                    )}
                  </div>
                </div>

                {/* Additional Info */}
                <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                  {reminder.type === 'vaccination' ? (
                    <>
                      <div className="flex items-center gap-1">
                        <FiCalendar className="w-3 h-3" />
                        <span>{new Date(reminder.dueDate).toLocaleDateString()}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      {reminder.schedule && (
                        <div className="flex items-center gap-1">
                          <FiClock className="w-3 h-3" />
                          <span>{reminder.schedule}</span>
                        </div>
                      )}
                      {reminder.dosage && (
                        <div className="flex items-center gap-1">
                          <FaPills className="w-3 h-3" />
                          <span>{reminder.dosage}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Arrow */}
              <FaChevronRight className="w-4 h-4 text-gray-400 ml-2 flex-shrink-0" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Info Footer */}
      {reminders.some(r => r.isOverdue || r.isUrgent) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg"
        >
          <div className="flex items-start gap-2">
            <FaBell className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-800">
              You have {reminders.filter(r => r.isOverdue).length > 0 && `${reminders.filter(r => r.isOverdue).length} overdue`}
              {reminders.filter(r => r.isOverdue).length > 0 && reminders.filter(r => r.isUrgent).length > 0 && ' and '}
              {reminders.filter(r => r.isUrgent).length > 0 && `${reminders.filter(r => r.isUrgent).length} urgent`} 
              {' '}reminder{(reminders.filter(r => r.isOverdue || r.isUrgent).length > 1) ? 's' : ''}. 
              Tap to view pet details.
            </p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default UpcomingReminders;
