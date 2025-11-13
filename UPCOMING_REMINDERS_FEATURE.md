# Upcoming Reminders Feature - Documentation

## Overview
The Upcoming Reminders feature displays upcoming vaccinations and active medications on the home page after login. It only appears when there are relevant reminders to show, keeping the home page clean when nothing is scheduled.

---

## Features

### 📅 Vaccination Reminders
- Shows vaccinations due within the next 30 days
- Displays overdue vaccinations
- Color-coded urgency levels:
  - **Red**: Overdue (past due date)
  - **Amber**: Urgent (due within 7 days)
  - **Green**: Upcoming (due within 8-30 days)

### 💊 Medication Reminders
- Displays all active medications
- Shows dosage and schedule information
- Helps users track ongoing treatments
- Color-coded in **Blue** for easy identification

---

## Display Logic

### When Reminders Show:
✅ At least one vaccination due within 30 days  
✅ At least one overdue vaccination  
✅ At least one active medication with a schedule  

### When Reminders Don't Show:
❌ No upcoming vaccinations  
❌ No active medications  
❌ User not logged in  
❌ No pets added to profile  

---

## Layout

### Mobile View (< 1024px)
- Vertical stacked list
- Maximum 5 reminders shown
- Compact card design
- Full-width layout

### Desktop View (≥ 1024px)
- 2-column grid layout
- Maximum 5 reminders shown
- Dedicated section with gray background
- Centered within max-width container

---

## Reminder Card Structure

```
┌─────────────────────────────────────────┐
│ [Icon] Pet Name                 [Badge] │
│        Vaccination/Medication Name      │
│        📅 Due Date / ⏰ Schedule        │
│                                    →    │
└─────────────────────────────────────────┘
```

### Card Elements:
1. **Icon**: Syringe (vaccination) or Pills (medication)
2. **Pet Avatar**: Small circular image or emoji
3. **Pet Name**: Shows which pet needs attention
4. **Reminder Title**: Vaccination or medication name
5. **Status Badge**: 
   - "X days overdue" (red)
   - "Due today" (amber)
   - "Due tomorrow" (amber)
   - "Due in X days" (green)
   - "Active" (blue for medications)
6. **Additional Info**: Date or schedule details
7. **Arrow**: Indicates clickable navigation

---

## User Interactions

### Click on Reminder Card
- Navigates to `/pet-details/:petId`
- Shows full pet medical information
- User can view/edit vaccination or medication details

### Click "View All"
- Navigates to `/profile`
- Shows all pets with complete information
- Access to full pet management

---

## Priority & Sorting

Reminders are sorted in the following priority order:

1. **Overdue Vaccinations** (highest priority)
2. **Urgent Vaccinations** (due within 7 days)
3. **Upcoming Vaccinations** (due within 8-30 days)
4. **Active Medications** (lowest priority)

Within each category, items are sorted by:
- Vaccinations: Earliest due date first
- Medications: Order they appear in pet data

Maximum of 5 reminders displayed at once.

---

## Alert Footer

When urgent or overdue reminders exist, a special alert footer appears:

```
┌─────────────────────────────────────────┐
│ 🔔 You have 2 overdue and 1 urgent     │
│    reminder. Tap to view pet details.   │
└─────────────────────────────────────────┘
```

**Styling:**
- Amber background (bg-amber-50)
- Amber border (border-amber-200)
- Amber text (text-amber-800)
- Bell icon for attention

---

## Data Structure

### Vaccination Data:
```javascript
{
  name: "Rabies Vaccine",
  date: "2024-01-15",        // Last administered
  nextDue: "2025-01-15",     // Next due date
}
```

### Medication Data:
```javascript
{
  name: "Heartgard Plus",
  dosage: "25mg",
  schedule: "Once daily",
  active: true,
  notes: "With food"
}
```

---

## Component Files

### Main Component:
**`src/components/Home/UpcomingReminders.jsx`**
- Fetches pet data from Firebase
- Calculates upcoming reminders
- Renders reminder cards
- Handles navigation

### Integration:
**`src/components/Home/Home.jsx`**
- Imports and renders UpcomingReminders
- Appears after pet profiles section (mobile)
- Appears in dedicated section (desktop)

---

## Firebase Data Path

```
userPets/
  {userId}/
    {petId}/
      name: "Buddy"
      vaccinations: [
        {
          name: "Rabies",
          date: "2024-01-15",
          nextDue: "2025-01-15"
        }
      ]
      medications: [
        {
          name: "Heartgard",
          dosage: "25mg",
          schedule: "Once daily",
          active: true
        }
      ]
```

---

## Responsive Design

### Mobile (< 640px)
- Full width cards
- Single column
- Compact spacing
- Touch-friendly tap targets

### Tablet (640px - 1024px)
- Full width cards
- Single column
- Comfortable spacing
- Hover states enabled

### Desktop (≥ 1024px)
- 2-column grid
- Max-width: 1280px (max-w-7xl)
- Generous spacing
- Hover effects and animations

---

## Animations

### Entry Animation:
- Fade in from opacity 0 to 1
- Slide up 20px
- Duration: 0.6s
- Delay: 0.15s

### Card Stagger:
- Each card animates in sequence
- Delay: index * 0.1s
- Creates flowing entrance effect

### Hover Effects:
- Shadow elevation increase
- Subtle scale transform
- Smooth transitions (300ms)

---

## Accessibility

- ✅ Keyboard navigable
- ✅ Semantic HTML structure
- ✅ Clear color contrast
- ✅ Descriptive text labels
- ✅ Icon + text combinations
- ✅ Click target minimum 44x44px

---

## Performance Optimization

### Data Fetching:
- Single Firebase query per user
- Processes all pets in memory
- Caches results in component state
- Only refetches on mount

### Rendering:
- Conditional rendering (doesn't show if no reminders)
- Limited to 5 items maximum
- Efficient sorting algorithm
- Memoized calculations

---

## Example Use Cases

### Scenario 1: Overdue Vaccination
**Display:**
```
🔴 Rabies Vaccine
   🐕 Buddy
   3 days overdue
   📅 2025-11-10
```

### Scenario 2: Upcoming Vaccination
**Display:**
```
🟢 DHPP Vaccine
   🐈 Whiskers
   Due in 15 days
   📅 2025-11-28
```

### Scenario 3: Active Medication
**Display:**
```
🔵 Heartgard Plus
   🐕 Max
   Active
   ⏰ Once daily
   💊 25mg
```

---

## Future Enhancements

Potential improvements for future versions:

1. **Push Notifications**: Browser/mobile push for due reminders
2. **Email Reminders**: Automatic email 7 days before due date
3. **Snooze Feature**: Postpone reminder for X days
4. **Quick Actions**: Mark as done, reschedule from card
5. **Calendar Integration**: Export to Google Calendar, iCal
6. **Medication Tracking**: Mark when medication is given
7. **Recurring Schedules**: Auto-calculate next due dates
8. **Vet Integration**: Sync with veterinary clinic records
9. **Multiple Reminders**: Set custom reminder intervals
10. **Statistics**: Track compliance and history

---

## Testing Checklist

- [ ] Shows when vaccinations due within 30 days
- [ ] Shows when vaccinations are overdue
- [ ] Shows active medications
- [ ] Hides when no reminders
- [ ] Sorts correctly by urgency
- [ ] Navigates to pet details on click
- [ ] Responsive on all screen sizes
- [ ] Animations work smoothly
- [ ] Alert footer shows for urgent items
- [ ] "View All" navigates to profile
- [ ] Handles missing pet images gracefully
- [ ] Works with multiple pets
- [ ] Works with single pet
- [ ] Loads quickly without blocking UI

---

## Code Snippets

### Check if Vaccination is Due:
```javascript
const dueDate = new Date(vaccination.nextDue);
const today = new Date();
const daysUntil = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

if (daysUntil <= 30) {
  // Show reminder
}
```

### Determine Urgency:
```javascript
const isOverdue = daysUntil < 0;
const isUrgent = daysUntil <= 7 && daysUntil >= 0;
```

### Format Due Date Text:
```javascript
const formatDaysUntil = (days) => {
  if (days < 0) return `${Math.abs(days)} days overdue`;
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  return `Due in ${days} days`;
};
```

---

## Support

For issues or questions about the Upcoming Reminders feature:
1. Check pet data in Firebase Console
2. Verify vaccination `nextDue` dates are valid
3. Ensure medications have `active: true` flag
4. Check browser console for errors
5. Verify user is logged in
6. Confirm pets exist in user profile
