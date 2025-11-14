# Firebase Push Notifications Setup - Ready for Deployment

## ✅ What's Currently Implemented

### Firebase Cloud Messaging (FCM)
All Firebase push notification infrastructure is in place and ready to work once Cloud Functions are deployed:

**Service Worker**: `/public/firebase-messaging-sw.js`
- Handles background push notifications
- Badge counter support
- Notification click handling with deep links
- Database integration for unread counts

**Notification Service**: `/src/services/notificationService.js`
- `requestNotificationPermission()` - Requests permission and gets FCM token
- `sendMatingRequestNotification()` - Email notifications (working ✅)
- `sendNewMessageNotification()` - Email notifications (working ✅)
- `sendWelcomeEmail()` - Email notifications (working ✅)

**Badge Service**: `/src/services/badgeService.js`
- Real-time unread count listener
- Auto-update badge on app icon (PWA)
- Clear badge when viewing notifications
- Firebase database integration

**App Integration**:
- `App.js` - Initializes badge management
- `Profile.jsx` - Clears notifications on tab view
- `TestNotifications.jsx` - Test page at `/test-notifications`

### Cloud Functions Ready to Deploy

**Location**: `/functions/index.js`

Three 2nd Gen Cloud Functions (upgraded from 1st Gen):

1. **sendMatingRequestNotification**
   - Triggers: Database onCreate at `/matingRequests/{requestId}`
   - Sends: Push notification to receiver
   - Badge: Increments unread count

2. **sendMessageNotification**
   - Triggers: Database onCreate at `/conversations/{conversationId}/messages/{messageId}`
   - Sends: Push notification to recipient
   - Badge: Increments unread count

3. **clearUnreadNotifications**
   - Type: HTTP Callable function
   - Purpose: Clear badge count (called from client)

## 🚫 Removed - OneSignal

All OneSignal code has been completely removed:
- ❌ react-onesignal package uninstalled
- ❌ `/src/services/oneSignalService.js` deleted
- ❌ `/public/OneSignalSDKWorker.js` deleted
- ❌ Environment variables removed from `.env`
- ❌ All imports and references removed from components

## 🔧 Cloud Functions Deployment Issue

### Current Problem
Cloud Functions v2 cannot be deployed due to Cloud Storage bucket creation permission error:

```
Error: Could not create bucket gcf-v2-uploads-984127079768.us-central1.cloudfunctions.appspot.com
```

### Root Cause
This error typically occurs when:
1. Billing is not properly configured for Cloud Storage API
2. App Engine default service account doesn't have sufficient permissions
3. Cloud Storage JSON API needs to be enabled

### Solutions to Try

#### Option 1: Enable Cloud Storage JSON API
```bash
gcloud services enable storage-api.googleapis.com --project=sweekar-af756
gcloud services enable storage-component.googleapis.com --project=sweekar-af756
```

#### Option 2: Check Billing Configuration
1. Go to: https://console.cloud.google.com/billing/linkedaccount?project=sweekar-af756
2. Verify billing account is active and linked
3. Check that Cloud Storage API has billing enabled

#### Option 3: Grant Permissions to Default Service Account
```bash
# Grant Storage Admin to default App Engine service account
gcloud projects add-iam-policy-binding sweekar-af756 \
  --member=serviceAccount:sweekar-af756@appspot.gserviceaccount.com \
  --role=roles/storage.admin
```

#### Option 4: Use 1st Gen Functions (Fallback)
If 2nd Gen continues to fail, can revert to 1st Gen functions which use Artifact Registry instead of Cloud Storage.

### Files Configuration
**firebase.json**
```json
{
  "functions": {
    "source": "functions",
    "predeploy": ["npm --prefix \"$RESOURCE_DIR\" run lint"]
  }
}
```

**functions/package.json**
```json
{
  "engines": {
    "node": "20"
  },
  "dependencies": {
    "firebase-admin": "^12.0.0",
    "firebase-functions": "^6.1.0" // Latest v2
  }
}
```

## 📊 What's Working Now

### Email Notifications ✅
- Welcome emails
- Mating request emails (with subject lines)
- All EmailJS integration working perfectly

### Badge System ✅
- Real-time listener on unread count
- Auto-clear when viewing tabs
- PWA app icon badge (Badging API)
- Firebase database backed

### Push Token Storage ✅
- FCM tokens saved to: `users/{uid}/fcmToken`
- Service worker registered and ready
- Permission request flow working

### Test Page ✅
- Location: `/test-notifications`
- Tests: Email service, push permission, env variables
- Real-time results display

## 🎯 Next Steps

1. **Resolve Billing Issue**
   - Check Google Cloud Console billing status
   - Ensure Cloud Storage API is enabled with billing
   - Verify all required APIs are enabled

2. **Deploy Cloud Functions**
   ```bash
   firebase deploy --only functions
   ```

3. **Test Push Notifications**
   - Send test mating request
   - Verify push notification received
   - Check badge counter increments
   - Verify notification click opens correct page

4. **Production Deployment**
   - Deploy to Netlify (frontend already configured)
   - Verify HTTPS (required for push notifications)
   - Test on production domain
   - Monitor Firebase Console for function execution

## 📱 How It Will Work (Once Functions Deploy)

### User Flow
1. User A sends mating request to User B
2. Cloud Function triggers on database write
3. Function retrieves User B's FCM token from Firebase
4. Function sends push notification via Firebase Cloud Messaging
5. User B receives notification (even if app closed)
6. Badge shows "1" on app icon
7. User B clicks notification → Opens to `/profile?tab=requests`
8. User B views requests tab → Badge clears to "0"

### Notification Structure
```javascript
{
  notification: {
    title: "💕 New Mating Request",
    body: "John wants to mate their Golden Retriever with yours!",
    icon: "/favicon.png",
    badge: "/favicon.png"
  },
  data: {
    type: "mating_request",
    requestId: "abc123",
    click_action: "/profile?tab=requests"
  }
}
```

## 🔐 Environment Variables

Current `.env` configuration (OneSignal removed):
```env
VITE_GOOGLE_MAPS_API_KEY=...
VITE_EMAILJS_PUBLIC_KEY=...
VITE_BASE_URL=https://pawppy.in
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...
VITE_FIREBASE_DATABASE_URL=...
```

**Note**: VITE_FIREBASE_VAPID_KEY may be needed. Get it from:
Firebase Console → Project Settings → Cloud Messaging → Web Push certificates

## 📚 Resources

- Firebase Cloud Functions: https://firebase.google.com/docs/functions
- Firebase Cloud Messaging: https://firebase.google.com/docs/cloud-messaging/js/client
- Billing Setup: https://console.cloud.google.com/billing
- IAM Permissions: https://console.cloud.google.com/iam-admin

---

**Status**: Ready for deployment once billing/permissions issue is resolved.
**Email Notifications**: ✅ Working perfectly
**Push Notifications**: ⏸️ Waiting for Cloud Functions deployment
