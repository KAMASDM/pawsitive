# 🗺️ Pawsitive Component Map

Visual representation of all components, their relationships, and data flow.

---

## 📂 Component Hierarchy

```
App.js (Root)
├── Header.jsx
│   ├── Desktop Navigation
│   └── Mobile Hamburger Menu
│
├── ROUTES (React Router 6)
│   │
│   ├── 🔓 PUBLIC ROUTES
│   │   ├── / → Login.jsx
│   │   ├── /pet/:slug → PetProfile.jsx
│   │   └── * → NotFound.jsx
│   │
│   └── 🔒 PROTECTED ROUTES (PR Wrapper)
│       │
│       ├── /dashboard → Home/ (Dashboard)
│       │   ├── Home.jsx
│       │   ├── PetCards.jsx
│       │   ├── QuickActions.jsx
│       │   ├── AdoptionSection.jsx
│       │   ├── UpcomingReminders.jsx
│       │   └── PetResources.jsx
│       │
│       ├── /profile → Profile/ (Pet Management)
│       │   ├── Profile.jsx (Tab Container)
│       │   ├── MobileVersion (Mobile Layout)
│       │   ├── DesktopVersion (Desktop Layout)
│       │   │
│       │   ├── Pets Tab
│       │   │   ├── PetsSection.jsx (Mobile)
│       │   │   ├── DesktopPetsSection.jsx (Desktop)
│       │   │   ├── PetDialog.jsx (Add/Edit Pet - 6 steps)
│       │   │   ├── VaccinationDialog.jsx
│       │   │   ├── MedicationDialog.jsx
│       │   │   └── HealthDialog.jsx
│       │   │
│       │   ├── Requests Tab
│       │   │   ├── RequestsSection.jsx (Mobile)
│       │   │   ├── DesktopRequestsSection.jsx (Desktop)
│       │   │   ├── ReceivedRequests (Mating)
│       │   │   └── SentRequests (Mating)
│       │   │
│       │   └── Messages Tab
│       │       └── ConversationsList.jsx
│       │           ├── ConversationItem
│       │           ├── MessageThread
│       │           └── MessageInput
│       │
│       ├── /pet-details/:petId → PetDetails/ (Pet Details View)
│       │   └── PetDetailsPage.jsx
│       │
│       ├── /pet/:slug → PetProfile/ (Social Pet Profile)
│       │   ├── PetProfile.jsx
│       │   ├── PetAgeCard.jsx
│       │   ├── QuickActionDialog.jsx
│       │   ├── ShareModal.jsx (QR Code)
│       │   │
│       │   ├── Social Features
│       │   │   ├── PetPostsFeed.jsx
│       │   │   │   ├── CreatePostModal.jsx
│       │   │   │   └── PostCard.jsx
│       │   │   │       ├── Like System
│       │   │   │       └── Comment System
│       │   │   │
│       │   │   └── PetEventsTimeline.jsx
│       │   │       ├── CreateEventModal.jsx
│       │   │       └── EventCard
│       │   │
│       │   └── Analytics Features
│       │       ├── WeightTracker.jsx
│       │       │   ├── WeightChart (Recharts)
│       │       │   ├── AddWeightModal
│       │       │   └── WeightHistory
│       │       │
│       │       ├── ExpenseTracker.jsx
│       │       │   ├── ExpenseChart (Recharts)
│       │       │   ├── AddExpenseModal
│       │       │   ├── CategoryFilter
│       │       │   └── TimeFilter
│       │       │
│       │       ├── PetAgeCalculatorPage.jsx
│       │       │   ├── AgeDisplay
│       │       │   ├── LifeStage
│       │       │   ├── CareTips
│       │       │   └── MilestonePredictor
│       │       │
│       │       └── MultiPetCompare.jsx
│       │           ├── PetSelector (up to 4)
│       │           ├── ComparisonTable
│       │           ├── HealthComparison
│       │           └── ExpenseComparison
│       │
│       ├── /nearby-mates → NearbyMates/ (Mating Discovery)
│       │   ├── NearbyMates.jsx
│       │   ├── FilterPanel
│       │   │   ├── LocationFilter (5-50 km)
│       │   │   ├── PetTypeFilter
│       │   │   ├── GenderFilter
│       │   │   ├── AgeRangeSlider
│       │   │   ├── SizeFilter
│       │   │   └── BreedSearch
│       │   │
│       │   ├── PetCard
│       │   │   ├── PetImage
│       │   │   ├── BasicInfo (Name, Breed, Age)
│       │   │   ├── Distance Display
│       │   │   ├── HealthBadge
│       │   │   └── SendRequestButton
│       │   │
│       │   └── PetDetail.jsx (Modal/Page)
│       │       ├── PhotoGallery
│       │       ├── CompleteInfo
│       │       ├── HealthRecords
│       │       ├── OwnerInfo
│       │       └── SendRequestDialog
│       │
│       ├── /adopt-pets → AdoptPet/ (Adoption)
│       │   ├── AdoptPet.jsx
│       │   ├── FilterPanel (same as NearbyMates)
│       │   ├── AdoptionCard
│       │   │   ├── AdoptionBadge
│       │   │   └── ContactOwnerButton
│       │   │
│       │   └── MessageDialogForAdoption.jsx
│       │       ├── PetInfo
│       │       ├── MessageComposer
│       │       └── SendInquiry
│       │
│       ├── /lost-and-found → LostAndFound/ (Lost & Found Hub)
│       │   ├── LostAndFound.jsx (Tab Container)
│       │   │   ├── Statistics Dashboard
│       │   │   └── Tab Navigation
│       │   │
│       │   ├── Report Lost Tab
│       │   │   └── ReportLostPet.jsx (6-step form)
│       │   │       ├── Step 1: Basic Info
│       │   │       ├── Step 2: Physical Description
│       │   │       ├── Step 3: Last Seen Location (Google Maps)
│       │   │       ├── Step 4: Photos (up to 5)
│       │   │       ├── Step 5: Microchip & Medical
│       │   │       └── Step 6: Contact Info
│       │   │
│       │   ├── Report Found Tab
│       │   │   └── ReportFoundPet.jsx (6-step form)
│       │   │       ├── Step 1: Basic Characteristics
│       │   │       ├── Step 2: Physical Description
│       │   │       ├── Step 3: Found Location (Google Maps)
│       │   │       ├── Step 4: Photos
│       │   │       ├── Step 5: Identification Check
│       │   │       └── Step 6: Finder Contact
│       │   │
│       │   ├── Browse Lost Tab
│       │   │   └── BrowseLostPets.jsx
│       │   │       ├── FilterPanel
│       │   │       │   ├── PetTypeFilter
│       │   │       │   ├── DateFilter
│       │   │       │   ├── DistanceFilter
│       │   │       │   └── StatusFilter
│       │   │       │
│       │   │       ├── LostPetCard (Red theme)
│       │   │       │   ├── Photos Carousel
│       │   │       │   ├── PetInfo
│       │   │       │   ├── LastSeenInfo
│       │   │       │   └── ContactButton
│       │   │       │
│       │   │       └── PotentialMatches
│       │   │           └── MatchScoreDisplay (0-100%)
│       │   │
│       │   ├── Browse Found Tab
│       │   │   └── BrowseFoundPets.jsx
│       │   │       ├── FilterPanel
│       │   │       ├── FoundPetCard (Green theme)
│       │   │       └── ClaimPetButton
│       │   │
│       │   ├── Map View Tab
│       │   │   └── LostFoundMap.jsx
│       │   │       ├── Google Maps
│       │   │       ├── Red Markers (Lost)
│       │   │       ├── Green Markers (Found)
│       │   │       ├── InfoWindows
│       │   │       └── FilterToggle
│       │   │
│       │   └── LostFoundPetDetail.jsx (Modal)
│       │       ├── Photo Gallery
│       │       ├── Complete Description
│       │       ├── Physical Characteristics
│       │       ├── Location Map
│       │       ├── Microchip Info
│       │       ├── Contact Details
│       │       ├── Match Score (if applicable)
│       │       └── Actions (Contact, Update, Delete)
│       │
│       ├── /resource → Resources/ (Pet Services Directory)
│       │   ├── Resources.jsx
│       │   │   ├── Category Tabs
│       │   │   │   ├── Dog Services
│       │   │   │   ├── Cat Services
│       │   │   │   └── General Services
│       │   │   │
│       │   │   ├── Subcategory Filters
│       │   │   │   ├── Health & Wellness
│       │   │   │   ├── Training & Behavior
│       │   │   │   ├── Grooming & Spa
│       │   │   │   ├── Supplies & Stores
│       │   │   │   ├── Boarding & Hotels
│       │   │   │   └── Adoption Centers
│       │   │   │
│       │   │   ├── Search & Location Filter
│       │   │   │
│       │   │   └── ResourceCard/
│       │   │       ├── ResourceCard.jsx
│       │   │       ├── ServiceInfo
│       │   │       ├── Rating Display
│       │   │       ├── Contact Buttons
│       │   │       └── SkeletonResourceCard.jsx
│       │   │
│       │   └── /resources/:id → ResourceDetail.jsx
│       │       ├── Photo Gallery
│       │       ├── Service Description
│       │       ├── Location Map
│       │       ├── Contact Information
│       │       ├── Business Hours
│       │       ├── Services List
│       │       ├── Reviews Section
│       │       └── Related Services
│       │
│       ├── /place-tagging → PlaceTagging/ (Pet-Friendly Places)
│       │   ├── PlaceTagging.jsx
│       │   │   ├── Google Places Search
│       │   │   ├── CategorySelector (8 types)
│       │   │   ├── RatingInput
│       │   │   ├── PhotoUpload
│       │   │   ├── CommentInput
│       │   │   └── SubmitButton
│       │   │
│       │   ├── TaggedPlacesMap.jsx
│       │   │   ├── Google Maps
│       │   │   ├── Color-coded Markers
│       │   │   │   ├── 🟢 Parks
│       │   │   │   ├── 🔵 Vet Clinics
│       │   │   │   ├── 🟠 Pet Stores
│       │   │   │   ├── 🟣 Cafes
│       │   │   │   ├── 🔴 Hospitals
│       │   │   │   ├── ⚫ Shelters
│       │   │   │   ├── 🟡 Grooming
│       │   │   │   └── ⚪ Other
│       │   │   │
│       │   │   ├── InfoWindows
│       │   │   └── CategoryFilter
│       │   │
│       │   └── PlaceNotifications.jsx
│       │
│       ├── /blog → Blog/ (Educational Content)
│       │   ├── Blogs.jsx
│       │   │   ├── CategoryFilter
│       │   │   ├── SearchBar
│       │   │   ├── BlogCard
│       │   │   │   ├── FeaturedImage
│       │   │   │   ├── Title & Excerpt
│       │   │   │   ├── Author & Date
│       │   │   │   ├── ReadingTime
│       │   │   │   └── CategoryBadge
│       │   │   │
│       │   │   └── Pagination
│       │   │
│       │   └── BlogDetail.jsx
│       │       ├── Hero Image
│       │       ├── Article Content
│       │       ├── Author Bio
│       │       ├── RelatedPosts
│       │       ├── CommentSection
│       │       └── ShareButtons
│       │
│       ├── /faq → FAQ/ (Help & Support)
│       │   └── FAQ.jsx
│       │       ├── SearchBar
│       │       ├── CategoryTabs
│       │       ├── QuestionAccordion
│       │       └── ContactSupport
│       │
│       ├── /about-us → AboutUs/ (Company Info)
│       │   └── AboutUs.jsx
│       │       ├── Mission Statement
│       │       ├── Vision
│       │       ├── Values
│       │       ├── Team Section
│       │       └── Contact Info
│       │
│       ├── /our-team → OurTeam/ (Team Profiles)
│       │   └── OurTeam.jsx
│       │       └── TeamMemberCard[]
│       │           ├── Photo
│       │           ├── Name & Role
│       │           ├── Bio
│       │           └── Social Links
│       │
│       ├── /contact-us → ContactUs/ (Contact Form)
│       │   └── ContactUs.jsx
│       │       ├── ContactForm
│       │       ├── EmailValidation
│       │       ├── MessageTextarea
│       │       └── SubmitButton
│       │
│       ├── /privacy-policy → PrivacyPolicy/
│       │   └── PrivacyPolicy.jsx
│       │
│       ├── /terms-and-conditions → TermsAndConditions/
│       │   └── TermsAndConditions.jsx
│       │
│       ├── /cookie-policy → CookiePolicy/
│       │   └── CookiePolicy.jsx
│       │
│       └── /test-notifications → TestNotifications/
│           └── TestNotifications.jsx
│               ├── EmailTestButton
│               ├── PushTestButton
│               └── BadgeTestButton
│
├── Footer.jsx
│   ├── QuickLinks
│   ├── LegalLinks
│   ├── SocialMedia
│   └── Copyright
│
└── UI Components (Shared)
    ├── Loaders/
    │   ├── PetDetailShimmer.jsx
    │   ├── ConversationsListShimmer.jsx
    │   ├── MeetingDetailsSkeleton.jsx
    │   └── LoadingSpinner.jsx
    │
    ├── ScrollToTop.jsx
    │
    └── PR.jsx (Protected Route Wrapper)
        ├── AuthCheck
        ├── LoadingState
        └── RedirectLogic
```

---

## 🔄 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER AUTHENTICATION                       │
│                                                                   │
│  Login.jsx → Firebase Auth → onAuthStateChanged → App.js         │
│                                    ↓                             │
│                            Set Current User                       │
│                                    ↓                             │
│                        Enable Protected Routes                    │
└─────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────┐
│                      PET MANAGEMENT FLOW                          │
│                                                                   │
│  Profile.jsx → PetDialog.jsx → Add/Edit Pet                      │
│                      ↓                                           │
│              Firebase Storage (Upload Photo)                      │
│                      ↓                                           │
│         Firebase Realtime DB: userPets/{userId}/{petId}          │
│                      ↓                                           │
│              Generate Slug → petSlugs/{slug}                      │
│                      ↓                                           │
│                  Update Pet List                                  │
│                      ↓                                           │
│              Real-time Listener → UI Update                       │
└─────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────┐
│                    HEALTH MANAGEMENT FLOW                         │
│                                                                   │
│  VaccinationDialog → Add Vaccination → Firebase DB               │
│                      ↓                                           │
│         useVaccinationReminder Hook (Daily Check)                 │
│                      ↓                                           │
│          Check Due Dates (30 days before)                         │
│                      ↓                                           │
│  sendVaccinationReminder() → EmailJS → Email Notification        │
│                                                                   │
│  Similar flow for: Medications, Weight, Expenses                 │
└─────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────┐
│                      MATING REQUEST FLOW                          │
│                                                                   │
│  NearbyMates.jsx → Filter Pets (availableForMating)               │
│                      ↓                                           │
│          Get Current Location (Geolocation API)                   │
│                      ↓                                           │
│       Firebase Query: userPets (all authenticated users)          │
│                      ↓                                           │
│         Calculate Distance (Haversine Formula)                    │
│                      ↓                                           │
│              Filter by: Species, Gender, Age, Size                │
│                      ↓                                           │
│                   Display Pet Cards                               │
│                      ↓                                           │
│  Click "Send Request" → SendRequestDialog                         │
│                      ↓                                           │
│    Firebase DB: matingRequests/sent/{userId}/{requestId}         │
│              matingRequests/received/{receiverId}/{requestId}     │
│                      ↓                                           │
│  Firebase Function: sendMatingRequestNotification                │
│                      ↓                                           │
│              Email + Push Notification                            │
│                      ↓                                           │
│         Increment unreadNotifications Badge                       │
│                      ↓                                           │
│  Profile → Requests Tab → Accept/Decline                          │
│                      ↓                                           │
│        Update Request Status → Create Conversation                │
└─────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────┐
│                   LOST & FOUND MATCHING FLOW                      │
│                                                                   │
│  ReportLostPet.jsx → 6-Step Form → Firebase DB                   │
│                      ↓                                           │
│              lostPets/{reportId}                                  │
│                      ↓                                           │
│       On Submit → Run Matching Algorithm                          │
│                      ↓                                           │
│  Query foundPets → calculateMatchScore() for each                 │
│                      ↓                                           │
│        100-Point Scoring System                                   │
│         - Pet Type (30)                                          │
│         - Breed (20)                                             │
│         - Color (15)                                             │
│         - Location & Time (15)                                   │
│         - Size (10)                                              │
│         - Gender (10)                                            │
│         - Microchip (100 if match)                               │
│                      ↓                                           │
│  Sort by Confidence Score → Display Matches                       │
│                      ↓                                           │
│  LostFoundPetDetail → Contact Owner/Finder                        │
│                      ↓                                           │
│         Create Conversation → Messaging                           │
│                      ↓                                           │
│  Mark as Reunited → Update Status                                │
└─────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────┐
│                     MESSAGING FLOW                                │
│                                                                   │
│  Trigger: Mating Request, Adoption, Lost/Found Contact           │
│                      ↓                                           │
│  Create Conversation: conversations/{conversationId}              │
│                      ↓                                           │
│         participants: [userId1, userId2]                          │
│         petContext: {petId, type}                                │
│                      ↓                                           │
│  Profile → Messages Tab → ConversationsList                       │
│                      ↓                                           │
│         Real-time Listener: onValue()                             │
│                      ↓                                           │
│  Click Conversation → MessageThread                               │
│                      ↓                                           │
│  Type Message → Send → Firebase Push                              │
│                      ↓                                           │
│  conversations/{id}/messages/{messageId}                          │
│                      ↓                                           │
│  Firebase Function: sendMessageNotification                       │
│                      ↓                                           │
│        Push Notification to Receiver                              │
│                      ↓                                           │
│  Real-time Update → Both Users See Message                        │
└─────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────┐
│                  NOTIFICATION SYSTEM FLOW                         │
│                                                                   │
│  Event Triggers:                                                  │
│  - Pet Added → sendWelcomeEmail()                                │
│  - Vaccination Due → sendVaccinationReminder()                    │
│  - Medication Due → sendMedicationReminder()                      │
│  - Request Received → sendMatingRequestNotification()            │
│  - Message Received → sendMessageNotification()                   │
│  - Birthday → sendBirthdayReminder()                              │
│                      ↓                                           │
│  Check User Preferences: getUserPreferences(userId)               │
│                      ↓                                           │
│  Email Channel: EmailJS API                                       │
│  Push Channel: Firebase FCM                                       │
│                      ↓                                           │
│  Log Notification: notifications/{userId}/{notificationId}        │
│                      ↓                                           │
│  Increment Badge: users/{userId}/unreadNotifications              │
│                      ↓                                           │
│  PWA Badge Service → Update App Icon                              │
│                      ↓                                           │
│  User Views → Clear Badge → Set to 0                              │
└─────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────┐
│                   LOCATION SERVICES FLOW                          │
│                                                                   │
│  Component Request Location                                       │
│                      ↓                                           │
│  navigator.geolocation.getCurrentPosition()                       │
│                      ↓                                           │
│  Permission Granted → Get Coordinates                             │
│                      ↓                                           │
│  Google Maps Geocoding API → Get Address                          │
│                      ↓                                           │
│  Calculate Distances (Haversine Formula)                          │
│                      ↓                                           │
│  Filter Results by Radius (5-50 km)                               │
│                      ↓                                           │
│  Display on Map / Sort by Distance                                │
│                                                                   │
│  Used in:                                                         │
│  - NearbyMates (find local mating partners)                       │
│  - AdoptPet (find local adoptions)                                │
│  - LostAndFound (report/search location)                          │
│  - PlaceTagging (tag pet-friendly places)                         │
│  - Resources (find nearby services)                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎨 Component Styling Patterns

### Color Palette
```javascript
// Primary Brand Colors
violet: {
  50: '#faf5ff',
  100: '#f3e8ff',
  200: '#e9d5ff',
  300: '#d8b4fe',
  400: '#c084fc',
  500: '#a855f7',  // Primary
  600: '#9333ea',
  700: '#7e22ce',
  800: '#6b21a8',
  900: '#581c87'
}

// Gradients
'from-violet-400 to-purple-500'
'from-indigo-500 to-violet-600'
'from-pink-400 to-purple-500'

// Status Colors
success: 'text-green-600 bg-green-50'
warning: 'text-yellow-600 bg-yellow-50'
error: 'text-red-600 bg-red-50'
info: 'text-blue-600 bg-blue-50'
```

### Common Component Patterns
```javascript
// Card Container
className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-violet-100"

// Button Primary
className="bg-gradient-to-r from-violet-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"

// Input Field
className="w-full px-4 py-3 border border-violet-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"

// Badge
className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-violet-100 text-violet-800"

// Shimmer Loader
className="animate-pulse bg-gradient-to-r from-violet-100 via-purple-100 to-violet-100"
```

### Animation Patterns (Framer Motion)
```javascript
// Card Entrance
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.5 }}

// Hover Effect
whileHover={{ scale: 1.02, y: -3 }}
whileTap={{ scale: 0.98 }}

// Stagger Children
variants={{
  container: {
    animate: {
      transition: { staggerChildren: 0.1 }
    }
  },
  item: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 }
  }
}}

// Modal/Dialog
<AnimatePresence>
  {isOpen && (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
    />
  )}
</AnimatePresence>
```

---

## 🔌 External Dependencies Map

```
Firebase
├── Authentication (email, Google)
├── Realtime Database (primary data)
├── Storage (images)
├── Firestore (complex queries)
└── Cloud Functions (notifications)

Google Services
├── Maps JavaScript API (maps display)
├── Places API (place search)
├── Geocoding API (address conversion)
└── Geolocation API (current location)

EmailJS
├── Service: service_zdt4u0q
├── Template: template_pe8gs6o
└── Rate Limit: 200/month (free)

Netlify
├── Hosting (static files)
├── Serverless Functions (daily reminders)
├── Environment Variables (secrets)
└── Continuous Deployment (GitHub)

PWA APIs
├── Service Worker (offline support)
├── Badge API (notification counter)
├── Notification API (push alerts)
└── Install Prompt (add to home screen)
```

---

## 📱 Responsive Breakpoints

```javascript
// Tailwind CSS Breakpoints
sm: '640px'   // Mobile landscape, small tablets
md: '768px'   // Tablets
lg: '1024px'  // Laptops, small desktops
xl: '1280px'  // Desktops
2xl: '1536px' // Large desktops

// Custom Hook: useResponsive()
const { isMobile, isTablet, isDesktop } = useResponsive();

// Usage Pattern
{isMobile ? <MobileVersion /> : <DesktopVersion />}

// Components with Responsive Variants
- Profile: Mobile (tabs) vs Desktop (sidebar)
- Home: Mobile (carousel) vs Desktop (grid)
- Header: Mobile (hamburger) vs Desktop (nav bar)
- PetsSection: Mobile (vertical) vs Desktop (grid)
```

---

## 🗂️ State Management

### Local Component State (useState)
- Form inputs
- Modal open/close
- Loading states
- UI toggles

### Firebase Real-time Listeners (useEffect + onValue)
- User data
- Pet lists
- Conversations
- Notifications
- Mating requests

### LocalStorage
- Draft forms (lost/found reports)
- Last reminder sent date
- User preferences (theme, etc.)
- PWA install prompt dismissed

### URL State (React Router)
- Current route
- Route parameters (petId, slug)
- Query params (?tab=requests)

---

## 🎯 Performance Optimization Map

```
Bundle Splitting
├── Route-based lazy loading
├── Component-level code splitting
└── Dynamic imports for heavy libs

Image Optimization
├── Firebase Storage compression
├── Responsive images (srcset)
├── Lazy loading (Intersection Observer)
└── WebP format support

Database Optimization
├── Indexed queries (.indexOn)
├── Pagination (limit queries)
├── Debounced searches
└── Cached results (React.memo)

Service Worker Caching
├── Static assets (cache-first)
├── API responses (network-first)
├── Offline fallback
└── Background sync
```

---

**Document Version:** 1.0  
**Components Mapped:** 28 directories, 100+ files  
**Last Updated:** December 2024

