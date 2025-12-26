# Environment Variables Setup

Add these to your `.env` file in the project root:

```env
# Database
DATABASE_URL="file:./dev.db"

# OpenAI API Key (for AI content generation)
OPENAI_API_KEY="your-openai-api-key-here"

# Google Custom Search API (for automatic image fetching - optional)
# See GOOGLE_IMAGE_SEARCH_SETUP.md for setup instructions
GOOGLE_CUSTOM_SEARCH_API_KEY="your-google-custom-search-api-key-here"
GOOGLE_CUSTOM_SEARCH_ENGINE_ID="your-search-engine-id-here"

# Unsplash API (alternative image source - optional)
# Get your access key from https://unsplash.com/developers
UNSPLASH_ACCESS_KEY="your-unsplash-access-key-here"

# Next.js
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Google OAuth (for Drive, Calendar, and User Login)
# Get these from Google Cloud Console: https://console.cloud.google.com/
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3000/api/auth/google/callback"
```

**Important Notes:**
- Make sure there are **no spaces** around the `=` sign
- Values should be in **quotes**
- After adding credentials, **restart your development server** (`npm run dev`)

## Getting Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project or select existing
3. Enable the following APIs:
   - **Google Drive API**
   - **Google Calendar API**
4. Go to **APIs & Services** > **Credentials**
5. Click **Create Credentials** > **OAuth client ID**
6. Choose **Web application**
7. **IMPORTANT**: Add ALL of these redirect URIs:
   - `http://localhost:3000/api/auth/google/callback` (for Drive)
   - `http://localhost:3000/api/auth/google/calendar/callback` (for Calendar)
   - `http://localhost:3000/api/auth/login/callback` (for User Login)
8. Click **Create**
9. Copy the **Client ID** and **Client Secret** to your `.env` file

## Verification

After adding credentials to `.env` and restarting the server:
- Go to **Settings** in the knowledge base
- Toggle **Google Calendar Integration** to ON
- You should see "Sign in with Google Calendar" button (not the setup wizard)
- If you still see the setup wizard, check:
  1. `.env` file is in the project root
  2. No typos in variable names
  3. Values are in quotes
  4. Server has been restarted

## Production Setup

For production, update `GOOGLE_REDIRECT_URI` and add production redirect URIs in Google Cloud Console:
- `https://yourdomain.com/api/auth/google/callback`
- `https://yourdomain.com/api/auth/google/calendar/callback`
- `https://yourdomain.com/api/auth/login/callback`

