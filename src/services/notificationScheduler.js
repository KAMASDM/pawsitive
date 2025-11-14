import { getDatabase, ref, get, query, orderByChild, equalTo } from 'firebase/database';
import emailNotifications from './emailNotifications';

/**
 * Notification Scheduler Service
 * Handles automated triggering of email notifications based on various conditions
 */

// ============================================================================
// VACCINATION REMINDER SCHEDULER
// ============================================================================
/**
 * Check all pets and send vaccination reminders 7 days before due date
 */
export const checkVaccinationReminders = async () => {
  try {
    const db = getDatabase();
    const usersRef = ref(db, 'users');
    const usersSnapshot = await get(usersRef);

    if (!usersSnapshot.exists()) return;

    const users = usersSnapshot.val();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const targetDate = sevenDaysFromNow.toISOString().split('T')[0]; // YYYY-MM-DD

    for (const [userId, userData] of Object.entries(users)) {
      if (!userData.pets) continue;

      for (const [petId, petData] of Object.entries(userData.pets)) {
        if (!petData.vaccinations) continue;

        for (const [vaccinationId, vaccination] of Object.entries(petData.vaccinations)) {
          if (!vaccination.nextDue) continue;

          const dueDate = new Date(vaccination.nextDue).toISOString().split('T')[0];
          
          // Send reminder if vaccination is due in 7 days
          if (dueDate === targetDate) {
            console.log(`Sending vaccination reminder to ${userData.email} for pet ${petData.name}`);
            
            await emailNotifications.sendVaccinationReminder(
              {
                uid: userId,
                email: userData.email,
                displayName: userData.displayName,
              },
              {
                id: petId,
                name: petData.name,
                breed: petData.breed,
                age: petData.age,
              },
              vaccination
            );
          }
        }
      }
    }
  } catch (error) {
    console.error('Error checking vaccination reminders:', error);
  }
};

// ============================================================================
// PET BIRTHDAY REMINDER SCHEDULER
// ============================================================================
/**
 * Check all pets and send birthday reminders 3 days before
 */
export const checkPetBirthdayReminders = async () => {
  try {
    const db = getDatabase();
    const usersRef = ref(db, 'users');
    const usersSnapshot = await get(usersRef);

    if (!usersSnapshot.exists()) return;

    const users = usersSnapshot.val();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    
    // Get month and day (MM-DD)
    const targetMonthDay = `${String(threeDaysFromNow.getMonth() + 1).padStart(2, '0')}-${String(threeDaysFromNow.getDate()).padStart(2, '0')}`;

    for (const [userId, userData] of Object.entries(users)) {
      if (!userData.pets) continue;

      for (const [petId, petData] of Object.entries(userData.pets)) {
        if (!petData.dateOfBirth) continue;

        const birthDate = new Date(petData.dateOfBirth);
        const birthMonthDay = `${String(birthDate.getMonth() + 1).padStart(2, '0')}-${String(birthDate.getDate()).padStart(2, '0')}`;
        
        // Send reminder if birthday is in 3 days
        if (birthMonthDay === targetMonthDay) {
          console.log(`Sending birthday reminder to ${userData.email} for pet ${petData.name}`);
          
          await emailNotifications.sendPetBirthdayReminder(
            {
              uid: userId,
              email: userData.email,
              displayName: userData.displayName,
            },
            {
              id: petId,
              name: petData.name,
              dateOfBirth: petData.dateOfBirth,
              age: petData.age,
            }
          );
        }
      }
    }
  } catch (error) {
    console.error('Error checking pet birthday reminders:', error);
  }
};

// ============================================================================
// HEALTH CHECKUP REMINDER SCHEDULER
// ============================================================================
/**
 * Check pets that haven't had a checkup in 6 months
 */
export const checkHealthCheckupReminders = async () => {
  try {
    const db = getDatabase();
    const usersRef = ref(db, 'users');
    const usersSnapshot = await get(usersRef);

    if (!usersSnapshot.exists()) return;

    const users = usersSnapshot.val();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    for (const [userId, userData] of Object.entries(users)) {
      if (!userData.pets) continue;

      for (const [petId, petData] of Object.entries(userData.pets)) {
        // Check if last checkup was more than 6 months ago
        const lastCheckup = petData.lastCheckup ? new Date(petData.lastCheckup) : null;
        
        if (!lastCheckup || lastCheckup < sixMonthsAgo) {
          console.log(`Sending health checkup reminder to ${userData.email} for pet ${petData.name}`);
          
          await emailNotifications.sendHealthCheckupReminder(
            {
              uid: userId,
              email: userData.email,
              displayName: userData.displayName,
            },
            {
              id: petId,
              name: petData.name,
            },
            'semi-annual'
          );
        }
      }
    }
  } catch (error) {
    console.error('Error checking health checkup reminders:', error);
  }
};

// ============================================================================
// NEARBY MATES WEEKLY DIGEST
// ============================================================================
/**
 * Find nearby compatible mates and send weekly digest
 */
export const sendNearbyMatesWeeklyDigest = async (userId) => {
  try {
    const db = getDatabase();
    
    // Get user data
    const userRef = ref(db, `users/${userId}`);
    const userSnapshot = await get(userRef);
    if (!userSnapshot.exists()) return;
    
    const userData = userSnapshot.val();
    if (!userData.pets) return;

    // Get all users to find nearby matches
    const allUsersRef = ref(db, 'users');
    const allUsersSnapshot = await get(allUsersRef);
    if (!allUsersSnapshot.exists()) return;

    const allUsers = allUsersSnapshot.val();

    for (const [petId, petData] of Object.entries(userData.pets)) {
      if (!petData.location) continue;

      const nearbyPets = [];

      // Find compatible pets nearby
      for (const [otherUserId, otherUserData] of Object.entries(allUsers)) {
        if (otherUserId === userId || !otherUserData.pets) continue;

        for (const [otherPetId, otherPetData] of Object.entries(otherUserData.pets)) {
          if (!otherPetData.location) continue;

          // Check compatibility (opposite gender, same species/breed, etc.)
          const isCompatible = 
            petData.gender !== otherPetData.gender &&
            petData.species === otherPetData.species &&
            otherPetData.availableForMating;

          if (isCompatible) {
            // Calculate distance (simplified - you'd use actual geolocation)
            const distance = calculateDistance(
              petData.location.latitude,
              petData.location.longitude,
              otherPetData.location.latitude,
              otherPetData.location.longitude
            );

            if (distance < 50) { // Within 50km
              nearbyPets.push({
                name: otherPetData.name,
                breed: otherPetData.breed,
                age: otherPetData.age,
                gender: otherPetData.gender,
                distance: `${Math.round(distance)} km away`,
                ownerId: otherUserId,
              });
            }
          }
        }
      }

      // Send alert if new matches found
      if (nearbyPets.length > 0) {
        console.log(`Sending nearby mates alert to ${userData.email} for pet ${petData.name}`);
        
        await emailNotifications.sendNearbyMatesAlert(
          {
            uid: userId,
            email: userData.email,
            displayName: userData.displayName,
          },
          {
            id: petId,
            name: petData.name,
          },
          nearbyPets
        );
      }
    }
  } catch (error) {
    console.error('Error sending nearby mates digest:', error);
  }
};

// ============================================================================
// WEEKLY DIGEST SCHEDULER
// ============================================================================
/**
 * Send weekly activity digest to all users
 */
export const sendWeeklyDigests = async () => {
  try {
    const db = getDatabase();
    const usersRef = ref(db, 'users');
    const usersSnapshot = await get(usersRef);

    if (!usersSnapshot.exists()) return;

    const users = usersSnapshot.val();
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

    for (const [userId, userData] of Object.entries(users)) {
      if (!userData.email) continue;

      // Get user's activity for the past week
      const digestData = await getUserWeeklyActivity(userId, oneWeekAgo);

      // Only send if there's some activity
      if (digestData.newRequests > 0 || digestData.newMessages > 0 || digestData.profileViews > 0) {
        console.log(`Sending weekly digest to ${userData.email}`);
        
        await emailNotifications.sendWeeklyDigest(
          {
            uid: userId,
            email: userData.email,
            displayName: userData.displayName,
          },
          digestData
        );
      }
    }
  } catch (error) {
    console.error('Error sending weekly digests:', error);
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Get user's weekly activity data
 */
async function getUserWeeklyActivity(userId, sinceTimestamp) {
  try {
    const db = getDatabase();
    
    // Get mating requests
    const requestsRef = ref(db, `matingRequests/${userId}`);
    const requestsSnapshot = await get(requestsRef);
    let newRequests = 0;
    
    if (requestsSnapshot.exists()) {
      const requests = requestsSnapshot.val();
      newRequests = Object.values(requests).filter(
        req => req.timestamp > sinceTimestamp
      ).length;
    }

    // Get messages
    const conversationsRef = ref(db, `conversations`);
    const conversationsSnapshot = await get(conversationsRef);
    let newMessages = 0;
    
    if (conversationsSnapshot.exists()) {
      const conversations = conversationsSnapshot.val();
      for (const [convId, convData] of Object.entries(conversations)) {
        if (!convId.includes(userId)) continue;
        
        if (convData.messages) {
          newMessages += Object.values(convData.messages).filter(
            msg => msg.timestamp > sinceTimestamp && msg.senderId !== userId
          ).length;
        }
      }
    }

    // Get upcoming reminders
    const upcomingReminders = [];
    const userRef = ref(db, `users/${userId}`);
    const userSnapshot = await get(userRef);
    
    if (userSnapshot.exists()) {
      const userData = userSnapshot.val();
      
      if (userData.pets) {
        const nextWeek = Date.now() + (7 * 24 * 60 * 60 * 1000);
        
        for (const petData of Object.values(userData.pets)) {
          // Check vaccinations
          if (petData.vaccinations) {
            for (const vaccination of Object.values(petData.vaccinations)) {
              if (vaccination.nextDue) {
                const dueDate = new Date(vaccination.nextDue).getTime();
                if (dueDate > Date.now() && dueDate < nextWeek) {
                  upcomingReminders.push(
                    `${petData.name}: ${vaccination.name} due on ${new Date(vaccination.nextDue).toLocaleDateString()}`
                  );
                }
              }
            }
          }
          
          // Check birthday
          if (petData.dateOfBirth) {
            const birthday = new Date(petData.dateOfBirth);
            const thisYearBirthday = new Date();
            thisYearBirthday.setMonth(birthday.getMonth());
            thisYearBirthday.setDate(birthday.getDate());
            
            if (thisYearBirthday.getTime() > Date.now() && thisYearBirthday.getTime() < nextWeek) {
              upcomingReminders.push(
                `${petData.name}'s birthday on ${thisYearBirthday.toLocaleDateString()}`
              );
            }
          }
        }
      }
    }

    return {
      newRequests,
      newMessages,
      profileViews: Math.floor(Math.random() * 20), // Placeholder - implement actual tracking
      nearbyMatches: Math.floor(Math.random() * 10), // Placeholder - implement actual tracking
      upcomingReminders,
    };
  } catch (error) {
    console.error('Error getting user weekly activity:', error);
    return {
      newRequests: 0,
      newMessages: 0,
      profileViews: 0,
      nearbyMatches: 0,
      upcomingReminders: [],
    };
  }
}

// ============================================================================
// MAIN SCHEDULER FUNCTION - Run this daily
// ============================================================================
/**
 * Main scheduler to run all automated checks
 * Call this function daily (can be triggered by cron job or Cloud Function)
 */
export const runDailyNotificationChecks = async () => {
  console.log('Running daily notification checks...');
  
  try {
    await checkVaccinationReminders();
    await checkPetBirthdayReminders();
    await checkHealthCheckupReminders();
    
    console.log('Daily notification checks completed successfully');
  } catch (error) {
    console.error('Error in daily notification checks:', error);
  }
};

/**
 * Weekly scheduler - Run on Mondays
 */
export const runWeeklyNotificationChecks = async () => {
  console.log('Running weekly notification checks...');
  
  try {
    await sendWeeklyDigests();
    
    console.log('Weekly notification checks completed successfully');
  } catch (error) {
    console.error('Error in weekly notification checks:', error);
  }
};

export default {
  checkVaccinationReminders,
  checkPetBirthdayReminders,
  checkHealthCheckupReminders,
  sendNearbyMatesWeeklyDigest,
  sendWeeklyDigests,
  runDailyNotificationChecks,
  runWeeklyNotificationChecks,
};
