# EmailJS Template Setup Guide

## Problem
The welcome email is being sent but shows default EmailJS content instead of our custom HTML template.

## Solution
You need to update your EmailJS template (`template_pe8gs6o`) to properly render HTML content.

## Steps to Fix

### 1. Login to EmailJS Dashboard
Go to: https://dashboard.emailjs.com/

### 2. Navigate to Your Template
- Select your service: `service_zdt4u0q`
- Find template: `template_pe8gs6o`
- Click "Edit"

### 3. Update the Template Content

Replace the entire template body with:

```
{{{message}}}
```

**IMPORTANT:** Use triple braces `{{{` instead of double braces `{{` to render HTML content without escaping.

### 4. Template Settings

Make sure these fields are in the "To" section:
```
To Email: {{to_email}}
To Name: {{name}}
```

### 5. Subject Line (Optional)
You can set a dynamic subject or a static one:
```
Welcome to Pawppy, {{name}}!
```

### 6. Save the Template

Click "Save" to apply changes.

## How It Works

Our code sends three parameters:
1. `to_email` - Recipient's email address
2. `name` - Recipient's name
3. `message` - Full HTML email content

The template uses:
- `{{to_email}}` → To field (who receives it)
- `{{name}}` → Can be used in subject line
- `{{{message}}}` → HTML body (rendered as HTML, not text)

## Test After Setup

After updating the template, test by:
1. Logging out of Pawppy
2. Logging back in
3. Check your email inbox

You should now see the branded Pawppy welcome email with:
- Purple gradient header
- Quick start guide with icons
- Professional formatting
- Call-to-action button

## Alternative: Create a New Template

If you want to keep the old template, create a new one:

1. In EmailJS Dashboard, click "Create New Template"
2. Name it: `pawppy_html_template`
3. Set content to: `{{{message}}}`
4. Copy the new template ID (e.g., `template_xyz123`)
5. Update `EMAILJS_TEMPLATE_ID` in `/src/services/notificationService.js`:

```javascript
const EMAILJS_TEMPLATE_ID = 'template_xyz123'; // Your new template ID
```

## Verification

After setup, the email should look like this:

- ✅ Purple gradient header with "🐾 Welcome to Pawppy!"
- ✅ Personalized greeting with user's name
- ✅ Quick start guide with 5 steps and icons
- ✅ "Complete Your Profile →" button
- ✅ Help section with FAQ link
- ✅ Branded footer with links

If you still see "Email sent via EmailJS.com" - the template wasn't updated correctly.

## Troubleshooting

### Issue: Still seeing default template
**Fix:** Make sure you're using triple braces `{{{message}}}` not double `{{message}}`

### Issue: Email shows HTML code as text
**Fix:** Use `{{{message}}}` (triple braces) to render HTML, not `{{message}}` (double braces)

### Issue: No email received
**Fix:** Check EmailJS dashboard quota and make sure the email isn't in spam folder

### Issue: Email goes to spam
**Fix:** 
1. Verify your domain in EmailJS
2. Set up SPF/DKIM records
3. Use a verified sender email
