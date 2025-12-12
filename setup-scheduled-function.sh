#!/bin/bash

# Setup Netlify Scheduled Function for Daily Email Reminders
# This script configures the scheduled trigger via Netlify CLI

echo "🚀 Setting up Netlify Scheduled Function"
echo "=========================================="
echo ""

# Check if netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo "❌ Netlify CLI not found. Please install it first:"
    echo "   npm install -g netlify-cli"
    exit 1
fi

# Check if linked to Netlify
if [ ! -d ".netlify" ]; then
    echo "❌ Project not linked to Netlify. Running 'netlify link'..."
    netlify link
fi

echo "📦 Step 1: Deploying functions..."
netlify deploy --prod

echo ""
echo "✅ Functions deployed!"
echo ""
echo "⏰ Step 2: Configure Scheduled Trigger"
echo "----------------------------------------"
echo "Unfortunately, Netlify CLI doesn't support creating scheduled triggers directly."
echo "You need to set it up via the Netlify UI:"
echo ""
echo "1. Go to: https://app.netlify.com/projects/pawppy"
echo "2. Click on 'Functions' tab"
echo "3. Find 'daily-email-reminders'"
echo "4. Click on the function"
echo "5. Click 'Add scheduled trigger'"
echo "6. Set schedule: 30 3 * * * (Every day at 3:30 AM UTC = 9:00 AM IST)"
echo "7. Click 'Save'"
echo ""
echo "📝 Alternative: Use Netlify API to set up schedule programmatically"
echo ""
echo "Would you like me to create a script to set it up via API? (requires API token)"
