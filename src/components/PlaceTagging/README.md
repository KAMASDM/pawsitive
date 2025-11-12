# Pet-Friendly Places Feature

## Overview
This feature allows users to tag locations as pet-friendly or not pet-friendly and automatically notifies other users within a 1km radius.

## Components Created

### 1. PlaceTagging.jsx
- **Purpose**: Modal dialog for tagging places
- **Features**:
  - Two-step process: Location selection → Details entry
  - Interactive Google Maps for selecting location
  - Pet-friendly rating (thumbs up/down)
  - Comment/review system
  - Automatic geohash generation for location queries
  - Notifies nearby users automatically

### 2. TaggedPlacesMap.jsx
- **Purpose**: Display all tagged places on a map with filters
- **Features**:
  - Interactive Google Maps with custom markers
  - Filter by: All, Pet Friendly, Not Pet Friendly
  - Click markers to see details in InfoWindow
  - List view below map showing places sorted by distance
  - Real-time updates when new places are tagged
  - Shows distance from user's location

### 3. PlaceNotifications.jsx
- **Purpose**: Toast notifications for nearby tagged places
- **Features**:
  - Appears in top-right corner
  - Shows when someone tags a place within 1km
  - Auto-dismisses after 8 seconds
  - "Got it" button to manually dismiss
  - Shows place name, rating, distance, and comment

## How It Works

### Tagging a Place
1. User clicks "Tag Place" button on home screen
2. Selects location on map (or uses current location)
3. Enters place name, rating (pet-friendly/not), and comment
4. System generates geohash for the location
5. Stores in Firebase: `taggedPlaces/{placeId}`
6. Checks all users' locations and notifies those within 1km

### Receiving Notifications
1. System runs when a place is tagged
2. Calculates distance to all users using geofire-common
3. Creates notification for users within 1km radius
4. Stores in Firebase: `notifications/{userId}/{notificationId}`
5. PlaceNotifications component listens and displays toast
6. Notification auto-dismisses or can be manually dismissed

### Viewing Tagged Places
1. Scroll to "Pet-Friendly Places" section on home screen
2. See all places within 5km radius on map
3. Filter by pet-friendly status
4. Click markers or list items to see details
5. Real-time updates when new places are added

## Firebase Structure

```
taggedPlaces/
  {placeId}/
    placeName: "Central Park"
    location:
      lat: 40.7829
      lng: -73.9654
    geohash: "dr5reg"
    isPetFriendly: true
    comment: "Great dog park with water fountains"
    userId: "user123"
    userEmail: "user@example.com"
    timestamp: ServerTimestamp
    createdAt: 1699876543210

notifications/
  {userId}/
    {notificationId}/
      type: "pet_friendly_place"
      placeId: "abc123"
      placeName: "Central Park"
      isPetFriendly: true
      distance: "0.75"
      comment: "Great dog park..."
      fromUser: "user@example.com"
      timestamp: ServerTimestamp
      read: false
```

## Dependencies
- `geofire-common`: For geolocation calculations and geohash generation
- `@react-google-maps/api`: For Google Maps integration
- `framer-motion`: For animations
- `firebase/database`: For real-time database

## Usage in Home Component

### Mobile
- Quick action button: "Tag Place"
- Displays map at bottom of screen
- Compact list view of nearby places

### Desktop
- Dedicated section: "Pet-Friendly Places Near You"
- Large "Tag a Pet-Friendly Place" button
- Full-width map with side-by-side markers and list
- Better visibility and interaction

## Features
✅ Real-time location tracking
✅ 1km radius notifications
✅ Geohash-based queries for performance
✅ Filter by pet-friendly status
✅ Distance calculations
✅ Auto-dismiss notifications
✅ Mobile and desktop responsive
✅ Google Maps integration
✅ Comment system for reviews
