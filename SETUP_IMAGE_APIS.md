# Setting Up Image Search APIs

This guide will help you set up the Google Custom Search API and Unsplash API for automatic image fetching in the inventory system.

## Google Custom Search API (Recommended)

The Google Custom Search API provides high-quality product images from the web.

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click **"New Project"**
4. Enter a project name (e.g., "Linfield Tech Hub")
5. Click **"Create"**

### Step 2: Enable Custom Search API

1. In your Google Cloud project, go to **"APIs & Services"** → **"Library"**
2. Search for **"Custom Search API"**
3. Click on it and click **"Enable"**

### Step 3: Create API Credentials

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"+ CREATE CREDENTIALS"** → **"API Key"**
3. Copy your API key (you'll need this later)
4. (Optional but recommended) Click **"Restrict Key"**:
   - Under **"API restrictions"**, select **"Restrict key"** and choose **"Custom Search API"**
   - Under **"Application restrictions"**, you can restrict by HTTP referrer (your domain) for security

### Step 4: Create a Custom Search Engine

1. Go to [Google Programmable Search Engine](https://programmablesearchengine.google.com/controlpanel/create)
2. Click **"Add"** to create a new search engine
3. Enter your site to search:
   - For general web search, enter: `*` (asterisk)
   - Or enter specific sites like `*.com` to search all .com domains
4. Click **"Create"**
5. Click **"Control Panel"** for your new search engine
6. Under **"Basics"**, note your **"Search engine ID"** (you'll need this)
7. Under **"Setup"** → **"Basics"**, make sure **"Search the entire web"** is enabled
8. Click **"Save"**

### Step 5: Add Environment Variables to Vercel

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **"Settings"** → **"Environment Variables"**
4. Add the following variables:

   **For Production:**
   - Name: `GOOGLE_CUSTOM_SEARCH_API_KEY`
   - Value: Your API key from Step 3
   - Environment: Production, Preview, Development
   
   - Name: `GOOGLE_CUSTOM_SEARCH_ENGINE_ID`
   - Value: Your Search engine ID from Step 4
   - Environment: Production, Preview, Development

5. Click **"Save"** for each variable
6. **Redeploy** your application for the changes to take effect

### Step 6: Test the Setup

1. Go to your inventory page
2. Create or edit an inventory item
3. Enter a manufacturer (e.g., "QSC") and model (e.g., "K.2")
4. Wait 1-2 seconds - an image should automatically appear!

### Cost Information

- **Free Tier**: 100 free searches per day
- **Paid**: $5 per 1,000 additional queries
- For most use cases, the free tier is sufficient

---

## Unsplash API (Optional Fallback)

Unsplash provides high-quality stock photos as a fallback if Google doesn't find product images.

### Step 1: Create Unsplash Account

1. Go to [Unsplash Developers](https://unsplash.com/developers)
2. Click **"Register as a developer"** or sign in
3. Complete the registration form

### Step 2: Create an Application

1. After logging in, go to [Your Applications](https://unsplash.com/oauth/applications)
2. Click **"New Application"**
3. Accept the API Use and Access Policy
4. Fill in the application details:
   - **Application name**: Linfield Tech Hub (or your choice)
   - **Description**: Inventory image search
   - **Website URL**: Your website URL
5. Click **"Create application"**

### Step 3: Get Your Access Key

1. On your application page, you'll see:
   - **Access Key**: This is your public access key
   - **Secret Key**: Keep this private (not needed for this use case)
2. Copy the **Access Key**

### Step 4: Add Environment Variable to Vercel

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **"Settings"** → **"Environment Variables"**
4. Add:

   **For Production:**
   - Name: `UNSPLASH_ACCESS_KEY`
   - Value: Your Access Key from Step 3
   - Environment: Production, Preview, Development

5. Click **"Save"**
6. **Redeploy** your application

### Cost Information

- **Free Tier**: 50 requests per hour
- **Paid**: Available for higher limits
- For most use cases, the free tier is sufficient

---

## Priority Order

The system tries APIs in this order:

1. **Google Custom Search API** (primary) - Best for product images
2. **Unsplash API** (fallback) - Good for general product photos
3. **Silent failure** - If neither is configured, no error is shown

## Troubleshooting

### Images Not Appearing

1. **Check API keys are set correctly:**
   - Go to Vercel → Settings → Environment Variables
   - Verify both keys are present and correct

2. **Check API quotas:**
   - Google: Check [Google Cloud Console](https://console.cloud.google.com/apis/api/customsearch.googleapis.com/quotas)
   - Unsplash: Check [Unsplash API Dashboard](https://unsplash.com/oauth/applications)

3. **Check browser console:**
   - Open browser DevTools (F12)
   - Check the Console tab for error messages
   - Check the Network tab to see if API calls are being made

4. **Verify search engine settings:**
   - Make sure your Google Custom Search Engine has "Search the entire web" enabled
   - The search engine ID should be visible in the Control Panel

### API Errors

- **403 Forbidden**: Check that your API key is correct and not restricted incorrectly
- **429 Too Many Requests**: You've exceeded your quota - wait or upgrade
- **400 Bad Request**: Check that your search engine ID is correct

### Testing APIs Directly

You can test the Google API directly in your browser:
```
https://www.googleapis.com/customsearch/v1?key=YOUR_API_KEY&cx=YOUR_SEARCH_ENGINE_ID&q=QSC+K.2+product+image&searchType=image&num=1
```

Replace `YOUR_API_KEY` and `YOUR_SEARCH_ENGINE_ID` with your actual values.

---

## Security Best Practices

1. **Restrict API Keys:**
   - Google: Restrict by API and HTTP referrer
   - Unsplash: Keep your secret key private

2. **Monitor Usage:**
   - Set up billing alerts in Google Cloud Console
   - Monitor usage in Unsplash dashboard

3. **Rotate Keys:**
   - Periodically rotate API keys for security
   - Update environment variables in Vercel when rotating

---

## Summary

**Minimum Setup (Google only):**
- ✅ Google Custom Search API key
- ✅ Google Custom Search Engine ID
- ✅ Add both to Vercel environment variables
- ✅ Redeploy

**Full Setup (Google + Unsplash):**
- ✅ All of the above
- ✅ Unsplash Access Key
- ✅ Add to Vercel environment variables
- ✅ Redeploy

Once set up, images will automatically fetch when users enter manufacturer and model in the inventory editor!

