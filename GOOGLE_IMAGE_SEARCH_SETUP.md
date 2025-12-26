# Google Image Search Setup

To enable automatic image fetching from Google Images, you need to set up Google Custom Search API.

## Steps:

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Create a new project or select an existing one

2. **Enable Custom Search API**
   - Navigate to "APIs & Services" > "Library"
   - Search for "Custom Search API"
   - Click "Enable"

3. **Create API Key**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy the API key

4. **Create Custom Search Engine**
   - Visit: https://programmablesearchengine.google.com/controlpanel/create
   - Click "Add" to create a new search engine
   - In "Sites to search", enter: `*` (to search the entire web)
   - Click "Create"
   - Click "Control Panel" for your new search engine
   - Under "Basics", enable "Search the entire web"
   - Under "Advanced", enable "Image search"
   - Copy the "Search engine ID" (also called "cx")

5. **Add to .env file**
   ```env
   GOOGLE_CUSTOM_SEARCH_API_KEY=your_api_key_here
   GOOGLE_CUSTOM_SEARCH_ENGINE_ID=your_search_engine_id_here
   ```

6. **Restart the development server**
   ```bash
   npm run dev
   ```

## Free Tier Limits

- Google Custom Search API provides **100 free queries per day**
- After that, it's $5 per 1,000 queries

## Optional: Unsplash API (Alternative Image Source)

You can also add Unsplash API for additional image sources:

1. Go to https://unsplash.com/developers
2. Create a new application
3. Copy your Access Key
4. Add to `.env`:
   ```env
   UNSPLASH_ACCESS_KEY=your_access_key_here
   ```

## Fallback Order

The system tries to fetch images in this order:
1. **Google Custom Search API** (if configured) - Most accurate product images
2. **Unsplash API** (if configured) - High-quality stock photos
3. **OpenAI** - Uses AI to find manufacturer website images

## Image Proxy

All external images are automatically proxied through `/api/image-proxy` to avoid CORS (Cross-Origin Resource Sharing) issues. This ensures images load reliably in the browser.

