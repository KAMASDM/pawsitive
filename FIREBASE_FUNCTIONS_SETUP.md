# Firebase Cloud Functions Deployment Instructions

## Permission Issues (BOTH REQUIRED)

You need TWO roles to deploy Cloud Functions:

### Steps to Grant Permissions:

1. **Open Google Cloud Console IAM:**
   - Go to: https://console.cloud.google.com/iam-admin/iam?project=sweekar-af756

2. **Find the Cloud Functions Service Account:**
   - Look for: `sweekar-af756@appspot.gserviceaccount.com`
   - Click the edit (pencil) icon

3. **Add Required Roles:**
   - Click "ADD ANOTHER ROLE"
   - Add: **"Artifact Registry Reader"** (roles/artifactregistry.reader)
   - Click "ADD ANOTHER ROLE" again
   - Add: **"Service Account User"** (roles/iam.serviceAccountUser)
   - Click "SAVE"

### Quick Fix Command (if you have gcloud CLI):

```bash
# Grant Artifact Registry Reader role
gcloud projects add-iam-policy-binding sweekar-af756 \
  --member=serviceAccount:sweekar-af756@appspot.gserviceaccount.com \
  --role=roles/artifactregistry.reader

# Grant Service Account User role  
gcloud projects add-iam-policy-binding sweekar-af756 \
  --member=serviceAccount:sweekar-af756@appspot.gserviceaccount.com \
  --role=roles/iam.serviceAccountUser
```

### After Granting Permissions:

Run the deployment command again:
```bash
cd /Users/jigardesai/Desktop/pawppy/pawsitive
firebase deploy --only functions
```

## What These Functions Do:

1. **sendMatingRequestNotification**
   - Triggers when a new mating request is created
   - Sends push notification to the receiver
   - Increments unread badge counter

2. **sendMessageNotification**
   - Triggers when a new message is sent
   - Sends push notification to the recipient
   - Increments unread badge counter

3. **clearUnreadNotifications**
   - HTTP callable function
   - Clears the unread notification count
   - Called automatically when user views requests/messages tabs

## Testing After Deployment:

1. Send a test mating request through the app
2. Check if push notification appears
3. Check if app icon shows badge counter (PWA installed)
4. Open requests tab - badge should clear

## Files Created:

- `/functions/index.js` - Cloud Functions code
- `/functions/package.json` - Dependencies
- `/public/firebase-messaging-sw.js` - Service worker with badge support
- `/src/services/badgeService.js` - Badge management
- Updated `/firebase.json` - Functions configuration
- Updated `/src/App.js` - Initialize badge management
- Updated `/src/components/Profile/Profile.jsx` - Clear notifications on tab view
