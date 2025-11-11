import { useEffect } from 'react';
import { auth, database } from '../firebase';
import { ref, get } from 'firebase/database';
import { sendVaccinationReminder } from '../services/notificationService';

/**
 * Hook to check vaccination reminders
 * Checks daily for vaccinations due within 30 days or overdue
 */
export const useVaccinationReminder = () => {
  useEffect(() => {
    const checkVaccinations = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        // Get user's pets
        const petsRef = ref(database, `pets/${user.uid}`);
        const petsSnapshot = await get(petsRef);

        if (!petsSnapshot.exists()) return;

        const pets = petsSnapshot.val();
        const now = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(now.getDate() + 30);

        // Get user data for notifications
        const userRef = ref(database, `users/${user.uid}`);
        const userSnapshot = await get(userRef);
        const ownerData = userSnapshot.val();

        // Check each pet's vaccinations
        Object.values(pets).forEach((pet) => {
          if (!pet.vaccinations) return;

          pet.vaccinations.forEach((vaccine) => {
            const dueDate = new Date(vaccine.nextDue);
            const isUpcoming = dueDate >= now && dueDate <= thirtyDaysFromNow;
            const isOverdue = dueDate < now;

            if (isUpcoming || isOverdue) {
              // Check if we've already sent a reminder today
              const lastReminderKey = `lastVaccineReminder_${pet.id}_${vaccine.name}`;
              const lastReminder = localStorage.getItem(lastReminderKey);
              const lastReminderDate = lastReminder ? new Date(lastReminder) : null;
              const today = new Date().toDateString();

              if (!lastReminderDate || lastReminderDate.toDateString() !== today) {
                // Send reminder
                sendVaccinationReminder(ownerData, pet, {
                  name: vaccine.name,
                  dueDate: vaccine.nextDue,
                })
                  .then(() => {
                    // Mark reminder as sent today
                    localStorage.setItem(lastReminderKey, new Date().toISOString());
                  })
                  .catch(err =>
                    console.error('Failed to send vaccination reminder:', err)
                  );
              }
            }
          });
        });
      } catch (error) {
        console.error('Error checking vaccinations:', error);
      }
    };

    // Check immediately on mount
    checkVaccinations();

    // Check daily at app startup
    const interval = setInterval(checkVaccinations, 24 * 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);
};
