# Email Notification System - Setup Guide

## Overview
Automated email reminders for pet care using Netlify Scheduled Functions and EmailJS.

## Features
✅ **Vaccination Reminders** - 7 days before due date  
✅ **Pet Birthday Reminders** - 3 days before birthday  
✅ **Health Checkup Reminders** - When overdue by 6 months  

## Architecture
- **Platform**: Netlify Scheduled Functions
- **Email Service**: EmailJS
- **Database**: Firebase Realtime Database
- **Schedule**: Daily at 9:00 AM IST (3:30 AM UTC)

---

## Setup Instructions

### 1. EmailJS Configuration

#### Get EmailJS Private Key (Required for server-side)
1. Go to https://dashboard.emailjs.com/admin/account
2. Navigate to **API Keys** section
3. Copy your **Private Key** (NOT the Public Key)
4. This is different from the public key used in the browser

### 2. Firebase Service Account

#### Get Firebase Admin Credentials
1. Go to Firebase Console: https://console.firebase.google.com/
2. Select your project (`pawsitive-bb84e`)
3. Click **Project Settings** (⚙️ icon)
4. Go to **Service Accounts** tab
5. Click **Generate new private key**
6. Download the JSON file
7. Extract these values:
   - `project_id` → Use for `VITE_FIREBASE_PROJECT_ID`
   - `client_email` → Use for `FIREBASE_CLIENT_EMAIL`
   - `private_key` → Use for `FIREBASE_PRIVATE_KEY`

### 3. Netlify Environment Variables

Add these environment variables in Netlify Dashboard:

#### Go to: Netlify Dashboard → Your Site → Site Settings → Environment Variables

| Variable Name | Description | Example/Notes |
|--------------|-------------|---------------|
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID | `pawsitive-bb84e` |
| `VITE_FIREBASE_DATABASE_URL` | Firebase database URL | `https://pawsitive-bb84e-default-rtdb.firebaseio.com` |
| `FIREBASE_CLIENT_EMAIL` | Service account email | `firebase-adminsdk-xxxxx@pawsitive-bb84e.iam.gserviceaccount.com` |
| `FIREBASE_PRIVATE_KEY` | Service account private key | Copy from service account JSON file |
| `EMAILJS_PUBLIC_KEY` | EmailJS public key | `9Ic6G_vwTk3Wl8Szu` (already have this) |
| `EMAILJS_PRIVATE_KEY` | EmailJS private key | Get from EmailJS dashboard |

**Important for FIREBASE_PRIVATE_KEY:**
- Copy the entire private key including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
- Replace all `\n` with actual newlines OR keep the `\n` (the code handles both)

### 4. Netlify Scheduled Functions Setup

#### Option A: Using Netlify UI (Recommended)
1. Go to Netlify Dashboard
2. Navigate to **Functions** tab
3. Find `daily-email-reminders`
4. Click **Trigger** dropdown
5. Select **Add Scheduled Trigger**
6. Set schedule: `0 3 * * *` (3:30 AM UTC = 9:00 AM IST)
7. Save

#### Option B: Using netlify.toml (Already configured)
The function is already configured in `netlify.toml`. Netlify will automatically detect it.

### 5. Deploy

```bash
# Commit changes
git add .
git commit -m "Add scheduled email notification system"
git push origin main
```

Netlify will automatically:
1. Build your site
2. Deploy the functions
3. Set up the scheduled trigger

---

## Testing

### Manual Test (Without Email)
Check what reminders would be sent:

```bash
cd netlify/functions
node test-daily-reminders.js
```

### Manual Trigger via URL
After deployment, trigger manually:

```bash
curl -X POST https://pawppy.in/.netlify/functions/daily-email-reminders
```

### Check Netlify Function Logs
1. Go to Netlify Dashboard
2. Navigate to **Functions** tab
3. Click on `daily-email-reminders`
4. View execution logs

---

## How It Works

### Daily Schedule (9:00 AM IST)
```
1. Function triggers automatically
2. Connects to Firebase Database
3. Loops through all users and their pets
4. Checks for:
   ├── Vaccinations due in 7 days
   ├── Birthdays in 3 days
   └── Health checkups overdue by 6 months
5. Sends email via EmailJS for each reminder
6. Logs sent notifications to prevent duplicates
```

### Email Templates
- Uses existing EmailJS template: `template_pe8gs6o`
- Matches design of welcome emails
- Beautiful HTML with gradients and icons

---

## Troubleshooting

### No emails being sent
- Check Netlify function logs for errors
- Verify all environment variables are set
- Test EmailJS private key is valid
- Check Firebase service account permissions

### Function not triggering
- Verify scheduled trigger is set in Netlify UI
- Check function deployment status
- Review Netlify build logs

### Firebase connection errors
- Verify service account credentials
- Check Firebase database rules allow admin SDK access
- Ensure database URL is correct

### EmailJS errors
- Verify private key is set (not public key)
- Check EmailJS service is active
- Verify template ID is correct
- Check EmailJS usage limits

---

## Cost Estimate

### Netlify Functions
- **Free tier**: 125,000 function requests/month
- **Daily function**: ~30 executions/month = FREE ✅

### EmailJS
- **Free tier**: 200 emails/month
- **Expected**: ~10-50 emails/day depending on users
- **Upgrade**: $9/month for 1,000 emails

### Firebase
- **Spark Plan (Free)**: Sufficient for Realtime Database reads
- **No additional cost** for this feature

---

## Monitoring

### Check Email Delivery
1. Monitor EmailJS dashboard for sent emails
2. Check user email inboxes
3. Review Netlify function success rate

### Database Tracking
Notifications are logged in Firebase:
```
/notificationsSent/{userId}/{notificationKey}
{
  sentAt: timestamp,
  type: 'vaccination' | 'birthday' | 'healthCheckup',
  petId: 'pet123'
}
```

---

## Future Enhancements

- [ ] Weekly digest emails
- [ ] Nearby mates alerts
- [ ] Pet-friendly places notifications
- [ ] Medication reminders
- [ ] Custom reminder schedules
- [ ] Email preferences per user

---

## Support

For issues or questions:
- Check Netlify function logs
- Review EmailJS dashboard
- Verify Firebase console
- Contact: jigar@pawppy.in
