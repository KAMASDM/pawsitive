# Quick Setup Guide - Email Notifications

## ✅ What We've Done
- Created Netlify function: `daily-email-reminders.js`
- Function checks for vaccination, birthday, and health checkup reminders
- Uses existing EmailJS configuration from .env file
- Ready to deploy to Netlify

## 🚀 Deployment Steps

### 1. Deploy the Functions
```bash
npm run deploy
```

OR push to GitHub (auto-deploys via Netlify):
```bash
git add .
git commit -m "Add email notification scheduled function"
git push origin main
```

### 2. Add Firebase Admin Credentials to Netlify

Go to: **Netlify Dashboard → Site Settings → Environment Variables**

Add these TWO new variables (you already have the Firebase client keys):

#### Get Firebase Service Account:
1. Go to https://console.firebase.google.com
2. Select your project: `sweekar-af756`
3. Click ⚙️ → **Project Settings** → **Service Accounts** tab
4. Click "Generate new private key" → Download JSON file
5. Open the JSON file and extract:

```env
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@sweekar-af756.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nMIIE...(the whole key)...=\n-----END PRIVATE KEY-----
```

**Important:** Copy the private key EXACTLY as it appears in the JSON file, including `\n` characters.

### 3. Set Up Scheduled Trigger (via Netlify UI)

After deployment:

1. Go to: https://app.netlify.com/projects/pawppy/functions
2. Click on `daily-email-reminders` function
3. Click **"Add scheduled trigger"** button
4. Enter schedule: `30 3 * * *`
   - This runs at 3:30 AM UTC = 9:00 AM IST every day
5. Click **Save**

### 4. Test the Function

#### Manual trigger (after deployment):
```bash
curl -X POST https://pawppy.in/.netlify/functions/daily-email-reminders
```

#### Check logs:
```bash
netlify functions:log daily-email-reminders
```

OR view in dashboard:
- https://app.netlify.com/projects/pawppy/functions

---

## 📋 Environment Variables Needed

| Variable | Source | Notes |
|----------|--------|-------|
| `VITE_EMAILJS_PUBLIC_KEY` | ✅ Already in .env | Used for EmailJS |
| `VITE_EMAILJS_PRIVATE_KEY` | ✅ Already in .env | Used for server-side emails |
| `VITE_FIREBASE_PROJECT_ID` | ✅ Already in .env | Firebase project ID |
| `VITE_FIREBASE_DATABASE_URL` | ✅ Already in .env | Firebase DB URL |
| `FIREBASE_CLIENT_EMAIL` | ⚠️ **ADD THIS** | From service account JSON |
| `FIREBASE_PRIVATE_KEY` | ⚠️ **ADD THIS** | From service account JSON |

---

## 🧪 How to Test Before Going Live

1. **Check what reminders exist:**
   - Open Firebase Console → Realtime Database
   - Navigate to `users/{userId}/pets/{petId}/vaccinations`
   - Add a test vaccination with `nextDue` set to 7 days from today

2. **Trigger manually:**
   ```bash
   curl -X POST https://pawppy.in/.netlify/functions/daily-email-reminders
   ```

3. **Check function logs:**
   - Netlify Dashboard → Functions → daily-email-reminders → Logs
   - Look for "✅ Email sent to..." messages

---

## ⏰ Schedule Details

The function runs at:
- **Cron:** `30 3 * * *`
- **Time:** 3:30 AM UTC
- **IST:** 9:00 AM India Standard Time
- **Frequency:** Every day

Checks for:
- 💉 Vaccinations due in 7 days
- 🎂 Pet birthdays in 3 days  
- 🏥 Health checkups overdue by 6 months

---

## 🎯 Next Steps After Setup

1. ✅ Deploy functions (`git push` or `npm run deploy`)
2. ✅ Add Firebase Admin env vars to Netlify
3. ✅ Configure scheduled trigger in Netlify UI
4. ✅ Test with manual trigger
5. ✅ Monitor logs for first automated run
6. ✅ Verify emails are being received

---

## 💰 Cost

- **Netlify Functions:** FREE (125k requests/month)
- **EmailJS:** FREE tier (200 emails/month)
- **Firebase:** FREE tier sufficient

---

## 📞 Support

Issues? Check:
1. Netlify function logs
2. EmailJS dashboard for delivery status
3. Firebase console for data structure
