# Pet Profile Flow - User Guide

## Overview
The pet profile system has been redesigned with a clear separation between:
1. **Pet Details Page** - Owner's private view with all medical and health information
2. **Social Profile Page** - Public shareable profile with posts and events

---

## Flow Diagram

```
User Profile Page
    │
    ├─── View Button (on Pet Card)
    │       │
    │       ↓
    │   Pet Details Page (/pet-details/:petId)
    │   ├─ Owner Only Access
    │   ├─ Medical Information
    │   ├─ Vaccinations
    │   ├─ Medications
    │   ├─ Allergies
    │   ├─ Health Conditions
    │   └─ "Social Profile" Button
    │           │
    │           ↓
    ├─── Social Profile Button
    │       │
    │       ↓
    Social Profile Page (/pet/:slug)
    ├─ Public Access (anyone can view)
    ├─ Posts Feed
    ├─ Events Timeline
    ├─ Shareable Link
    └─ Owner Actions:
        ├─ "Pet Details" Button → Back to Details Page
        ├─ "Add Post" Button → Quick Post Dialog
        ├─ "Add Event" Button → Quick Event Dialog
        └─ "Share" Button → Share Modal
```

---

## Routes

### 1. Pet Details Page
- **Route**: `/pet-details/:petId`
- **Access**: Owner only (requires authentication)
- **Purpose**: Complete medical and health information management
- **Features**:
  - View all pet information
  - Medical history
  - Vaccination records
  - Current medications
  - Allergies
  - Health conditions
  - Microchip information
  - Navigation to social profile

### 2. Social Profile Page
- **Route**: `/pet/:slug`
- **Access**: Public (no authentication required)
- **Purpose**: Shareable social presence for the pet
- **Features**:
  - Public posts feed (Instagram-style)
  - Events timeline
  - Birthday countdown
  - Owner information
  - Social sharing (WhatsApp, Facebook, Twitter, LinkedIn)
  - For owners:
    - Quick add post
    - Quick add event
    - Link to detailed pet information

---

## User Journeys

### Journey 1: Owner Views Their Pet Details
1. User navigates to Profile page
2. Clicks "View" button on pet card
3. Lands on **Pet Details Page** (/pet-details/:petId)
4. Sees complete medical information
5. Can click "Social Profile" to view public profile
6. Can click "Edit" to modify pet information

### Journey 2: Owner Shares Pet Profile
1. Owner is on Pet Details Page
2. Clicks "Social Profile" button
3. Lands on **Social Profile Page** (/pet/:slug)
4. Clicks "Share" button
5. Copies shareable link: `https://pawppy.in/pet/buddy-123`
6. Shares link on social media or messaging apps

### Journey 3: Owner Adds a Post
1. Owner is on Social Profile Page
2. Clicks "Add Post" button
3. Quick Action Dialog opens
4. If multiple pets: selects which pet the post is for
5. Uploads photo/video
6. Adds optional caption
7. Post appears in feed immediately

### Journey 4: Owner Adds an Event
1. Owner is on Social Profile Page
2. Clicks "Add Event" button
3. Quick Action Dialog opens
4. If multiple pets: selects which pet
5. Chooses event type (milestone, vet visit, grooming, etc.)
6. Enters event title and date
7. Adds optional description
8. Event appears in timeline

### Journey 5: Public User Views Pet Profile
1. Receives shareable link: `https://pawppy.in/pet/buddy-123`
2. Clicks link (no login required)
3. Views **Social Profile Page**
4. Sees posts, events, pet information
5. Can click "Share" to share with others
6. Cannot access pet details page (owner-only)

---

## Components Created/Modified

### New Components:
1. **PetDetailsPage.jsx** - Owner's detailed view with medical information
2. **QuickActionDialog.jsx** - Unified dialog for adding posts/events

### Modified Components:
1. **PetProfile.jsx** - Enhanced with quick action buttons for owners
2. **PetsSection.jsx** - View button now navigates to /pet-details/:petId
3. **DesktopPetsSection.jsx** - View button now navigates to /pet-details/:petId
4. **App.js** - Added new route for /pet-details/:petId

---

## Database Structure

```
userPets/
  {userId}/
    {petId}/
      - name, breed, type, gender
      - image, dateOfBirth, weight, color
      - microchipId
      - vaccinations[]
      - medications[]
      - medicalConditions[]
      - allergies[]
      - slug (for public profile)

petSlugs/
  {slug}/
    - userId
    - petId

petPosts/
  {petId}/
    {postId}/
      - mediaUrl, mediaType
      - caption, timestamp
      - userId, petId
      - likes[], comments[]

petEvents/
  {petId}/
    {eventId}/
      - title, description
      - date, type, timestamp
      - userId, petId
```

---

## Permissions

### Pet Details Page (/pet-details/:petId)
- ✅ Owner can view
- ❌ Public cannot access
- ✅ Owner can edit
- ✅ Owner can navigate to social profile

### Social Profile Page (/pet/:slug)
- ✅ Owner can view and manage
- ✅ Public can view (if not private)
- ✅ Anyone can share
- ✅ Owner can add posts/events
- ❌ Public cannot add posts/events

---

## Key Features

### Pet Details Page
- **Medical Management**: Complete health record tracking
- **Vaccination Tracking**: View all vaccinations with dates and next due dates
- **Medication Management**: Current medications with dosage and schedule
- **Health Conditions**: Track chronic conditions and allergies
- **Microchip Info**: Store and display microchip identification
- **Beautiful UI**: Card-based layout with color-coded sections
- **Responsive**: Works on all device sizes

### Social Profile Page
- **Posts Feed**: Instagram-style photo/video posts
- **Events Timeline**: Chronological milestone tracking
- **Birthday Countdown**: Shows days until next birthday
- **Owner Actions**: Quick buttons for adding content
- **Social Sharing**: One-click sharing to social platforms
- **Public Access**: No login required for viewing
- **Privacy Controls**: Can be marked as private

### Quick Action Dialog
- **Smart Pet Selection**: Auto-selects if only one pet
- **Multi-Pet Support**: Dropdown to choose which pet
- **Media Upload**: Drag-and-drop or click to upload
- **Preview**: See media before posting
- **Validation**: Form validation with helpful error messages
- **Loading States**: Clear feedback during submission

---

## Design Principles

1. **Separation of Concerns**
   - Medical info is private (details page)
   - Social content is shareable (social profile)

2. **User-Friendly Navigation**
   - Clear buttons for transitions
   - Breadcrumbs for orientation
   - Logical flow between pages

3. **Quick Actions**
   - Minimal clicks to add content
   - Smart defaults for single-pet owners
   - Clear feedback on all actions

4. **Privacy First**
   - Owner-only access to medical data
   - Optional privacy for social profiles
   - Public sharing with control

5. **Mobile Responsive**
   - Works seamlessly on all devices
   - Touch-friendly buttons
   - Optimized layouts for small screens

---

## Example URLs

- **Pet Details** (Owner): `https://pawppy.in/pet-details/abc123`
- **Social Profile** (Public): `https://pawppy.in/pet/buddy-4523`
- **User Profile**: `https://pawppy.in/profile`

---

## Future Enhancements

- QR code generation for quick profile sharing
- Print medical records as PDF
- Vet appointment scheduling from details page
- Multi-pet post (post featuring multiple pets)
- Post reactions and comments
- Event RSVPs for playdates
- Integration with vet clinics for automatic record updates
