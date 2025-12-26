# Quick Setup Guide: Google Custom Search API

Follow these steps to set up Google Custom Search API for automatic image fetching:

## Step 1: Create/Select a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. If you don't have a project, click "Create Project"
   - Enter a project name (e.g., "Knowledge Base Images")
   - Click "Create"
3. If you already have a project, select it from the dropdown at the top

## Step 2: Enable Custom Search API

1. In the Google Cloud Console, go to **"APIs & Services"** > **"Library"**
2. Search for **"Custom Search API"**
3. Click on it and click **"Enable"**
4. Wait for it to enable (usually takes a few seconds)

## Step 3: Create API Key

1. Go to **"APIs & Services"** > **"Credentials"**
2. Click **"Create Credentials"** > **"API Key"**
3. A popup will show your API key - **copy it** (you'll need it in Step 6)
4. (Optional) Click "Restrict Key" to limit usage to Custom Search API only
5. Click "Close"

## Step 4: Create Custom Search Engine

1. Go to [Programmable Search Engine](https://programmablesearchengine.google.com/controlpanel/create)
2. Click **"Add"** to create a new search engine
3. Fill in the form:
   - **Sites to search**: Enter `*` (asterisk) to search the entire web
   - **Name**: Enter any name (e.g., "Product Images")
4. Click **"Create"**
5. You'll see a success message - click **"Control Panel"** for your new search engine
6. In the Control Panel:
   - Under **"Basics"**, find **"Search the entire web"** and toggle it **ON**
   - Under **"Advanced"**, find **"Image search"** and toggle it **ON**
   - Click **"Save"**
7. Copy your **"Search engine ID"** (also called "cx") - you'll see it at the top of the Control Panel

## Step 5: Add Credentials to .env File

Open your `.env` file in the project root and add these lines:

```env
GOOGLE_CUSTOM_SEARCH_API_KEY=your_api_key_from_step_3
GOOGLE_CUSTOM_SEARCH_ENGINE_ID=your_search_engine_id_from_step_4
```

**Important:**
- Replace `your_api_key_from_step_3` with the API key you copied in Step 3
- Replace `your_search_engine_id_from_step_4` with the Search Engine ID you copied in Step 4
- Make sure there are **no spaces** around the `=` sign
- Values should be in **quotes**

## Step 6: Restart Your Development Server

1. Stop your current server (Ctrl+C or Cmd+C)
2. Restart it:
   ```bash
   npm run dev
   ```

## Step 7: Test It!

1. Go to your inventory page
2. Edit an existing item or create a new one
3. Enter a **Manufacturer** and **Model** (e.g., "Chauvet" and "COLORado 1-Quad")
4. Save the item
5. The system should automatically fetch an image!

## Troubleshooting

**If images still don't load:**
1. Check the browser console (F12) for errors
2. Check the server logs for API errors
3. Verify your API key and Search Engine ID are correct in `.env`
4. Make sure you restarted the server after adding the credentials
5. Verify the Custom Search API is enabled in Google Cloud Console

**Common Issues:**
- **"API key not valid"**: Check that you copied the API key correctly
- **"Search engine ID not found"**: Verify the Search Engine ID is correct
- **"Quota exceeded"**: You've used your 100 free daily queries (resets at midnight Pacific Time)

## Free Tier Limits

- **100 free queries per day**
- Resets at midnight Pacific Time
- After 100 queries, it's $5 per 1,000 additional queries

## Need Help?

If you run into issues, check:
- The server console for error messages
- Google Cloud Console > APIs & Services > Credentials (to verify your API key)
- Programmable Search Engine Control Panel (to verify your Search Engine ID)

