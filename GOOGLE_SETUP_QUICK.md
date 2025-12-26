# Quick Google OAuth Setup

## The Error You're Seeing

"Missing required parameter: client_id" means your `.env` file is missing the Google OAuth credentials.

## Quick Fix (5 minutes)

### Step 1: Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. **Create a new project** (or select existing):
   - Click project dropdown at top
   - Click "New Project"
   - Name it "Linfield Tech KB" (or any name)
   - Click "Create"

3. **Enable APIs**:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Drive API" → Click "Enable"
   - Search for "Google Calendar API" → Click "Enable"

4. **Create OAuth Credentials**:
   - Go to "APIs & Services" > "Credentials"
   - Click "+ CREATE CREDENTIALS" > "OAuth client ID"
   - If prompted, configure OAuth consent screen first:
     - User Type: "External" (unless you have Google Workspace)
     - App name: "Linfield Tech Knowledge Base"
     - User support email: Your email
     - Developer contact: Your email
     - Click "Save and Continue" through the steps
   - Back to Credentials:
     - Application type: "Web application"
     - Name: "Knowledge Base Web Client"
     - Authorized redirect URIs: 
       - `http://localhost:3000/api/auth/google/callback` (for Drive)
       - `http://localhost:3000/api/auth/google/calendar/callback` (for Calendar)
       - `http://localhost:3000/api/auth/login/callback` (for User Login)
       - `http://localhost:3000/api/auth/login/callback` (for User Login)
     - Click "Create"
   - **Copy the Client ID and Client Secret**

### Step 2: Add to .env File

Open your `.env` file and add these lines:

```env
GOOGLE_CLIENT_ID="your-client-id-here.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret-here"
GOOGLE_REDIRECT_URI="http://localhost:3000/api/auth/google/callback"
```

**Important**: 
- Replace `your-client-id-here` with your actual Client ID
- Replace `your-client-secret-here` with your actual Client Secret
- Keep the quotes around the values

### Step 3: Restart Server

1. Stop the server (Ctrl+C in terminal)
2. Run `npm run dev` again
3. Try connecting Google account again

## Example .env File

Your complete `.env` should look like:

```env
DATABASE_URL="file:./dev.db"
OPENAI_API_KEY=""
NEXT_PUBLIC_APP_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="123456789-abcdefghijklmnop.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-abcdefghijklmnopqrstuvwxyz"
GOOGLE_REDIRECT_URI="http://localhost:3000/api/auth/google/callback"
```

## Troubleshooting

- **"Invalid client"**: Check that Client ID is correct
- **"Redirect URI mismatch"**: Make sure redirect URI in Google Console matches exactly
- **Still not working**: Restart the dev server after adding credentials

## Need Help?

See `INTEGRATION_SETUP.md` for more detailed instructions.

