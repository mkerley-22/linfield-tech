# Vercel Environment Variables Setup

This guide will help you set up all required environment variables in Vercel for your deployment.

## Step 1: Access Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Click on **"Settings"** tab
3. Click on **"Environment Variables"** in the left sidebar

## Step 2: Add Required Environment Variables

### Database (Required)

If you're using **Vercel Postgres**:
- Vercel automatically adds `POSTGRES_URL`, `POSTGRES_PRISMA_URL`, and `POSTGRES_URL_NON_POOLING`
- Add this environment variable:
  ```
  DATABASE_URL = (use the value from POSTGRES_URL)
  ```

If you're using an **external PostgreSQL database**:
```
DATABASE_URL = postgresql://user:password@host:port/database?sslmode=require
```

### Application URL (Required)

```
NEXT_PUBLIC_APP_URL = https://your-app-name.vercel.app
```
Replace `your-app-name` with your actual Vercel project name.

### Google OAuth (Required for Login)

You need to get these from [Google Cloud Console](https://console.cloud.google.com/):

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one)
3. Go to **APIs & Services** → **Credentials**
4. Click **"Create Credentials"** → **"OAuth client ID"** (if you don't have one)
5. Choose **"Web application"**
6. **IMPORTANT**: Add these redirect URIs:
   - `https://your-app-name.vercel.app/api/auth/login/callback` (for user login)
   - `https://your-app-name.vercel.app/api/auth/google/callback` (for Google Drive)
   - `https://your-app-name.vercel.app/api/auth/google/calendar/callback` (for Google Calendar)
7. Copy the **Client ID** and **Client Secret**

Add these to Vercel:
```
GOOGLE_CLIENT_ID = your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET = your-client-secret
LOGIN_REDIRECT_URI = https://your-app-name.vercel.app/api/auth/login/callback
GOOGLE_REDIRECT_URI = https://your-app-name.vercel.app/api/auth/google/callback
GOOGLE_CALENDAR_REDIRECT_URI = https://your-app-name.vercel.app/api/auth/google/calendar/callback
```

### File Storage (Required for File Uploads)

If you're using **Vercel Blob Storage**:

1. In Vercel, go to **"Storage"** tab
2. Click **"Create Database"** → **"Blob"**
3. Select **"Hobby"** plan (free)
4. Copy the **"Read and Write Token"**
5. Add to environment variables:
```
BLOB_READ_WRITE_TOKEN = vercel_blob_rw_xxx
```

### Optional: AI Features

If you want to use AI content generation:
```
OPENAI_API_KEY = sk-your-key-here
```

### Optional: Image Search

If you want automatic image fetching:
```
GOOGLE_CUSTOM_SEARCH_API_KEY = your-key
GOOGLE_CUSTOM_SEARCH_ENGINE_ID = your-engine-id
UNSPLASH_ACCESS_KEY = your-key
```

## Step 3: Set Environment for Each Variable

For each variable, make sure to select:
- ✅ **Production** (for your live site)
- ✅ **Preview** (for preview deployments)
- ✅ **Development** (if you use Vercel CLI)

## Step 4: Redeploy

After adding environment variables:
1. Go to **"Deployments"** tab
2. Click the **"..."** menu on the latest deployment
3. Click **"Redeploy"**

Or push a new commit to trigger a new deployment.

## Step 5: Verify Setup

1. Visit your Vercel URL: `https://your-app-name.vercel.app`
2. You should be redirected to the login page
3. Click "Sign in with Google"
4. Complete the OAuth flow
5. You should be logged in successfully

## Troubleshooting

### "Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET"
- Make sure you added both variables in Vercel
- Make sure they're set for **Production** environment
- Redeploy after adding variables

### "Redirect URI mismatch"
- Make sure you added the correct redirect URIs in Google Cloud Console
- The URIs must match exactly (including `https://` and no trailing slash)
- Make sure all redirect URIs in Vercel match what's in Google Cloud Console:
  - `LOGIN_REDIRECT_URI` → `/api/auth/login/callback`
  - `GOOGLE_REDIRECT_URI` → `/api/auth/google/callback`
  - `GOOGLE_CALENDAR_REDIRECT_URI` → `/api/auth/google/calendar/callback`

### Login button doesn't work
- Check Vercel deployment logs for errors
- Make sure `NEXT_PUBLIC_APP_URL` is set correctly
- Make sure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set

### Database connection errors
- Make sure `DATABASE_URL` is set correctly
- If using Vercel Postgres, make sure the database is created and active
- Run migrations: `npx prisma migrate deploy` (see deployment guide)

## Quick Checklist

- [ ] `DATABASE_URL` set (from Vercel Postgres or external)
- [ ] `NEXT_PUBLIC_APP_URL` set to your Vercel URL
- [ ] `GOOGLE_CLIENT_ID` set
- [ ] `GOOGLE_CLIENT_SECRET` set
- [ ] `LOGIN_REDIRECT_URI` set to `https://your-app.vercel.app/api/auth/login/callback`
- [ ] `GOOGLE_REDIRECT_URI` set to `https://your-app.vercel.app/api/auth/google/callback`
- [ ] `GOOGLE_CALENDAR_REDIRECT_URI` set to `https://your-app.vercel.app/api/auth/google/calendar/callback`
- [ ] All redirect URIs added in Google Cloud Console
- [ ] All variables set for **Production** environment
- [ ] Redeployed after adding variables

