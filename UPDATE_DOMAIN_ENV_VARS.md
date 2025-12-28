# Update Environment Variables for Custom Domain

Your domain `www.linfieldtechhub.com` is already configured in Vercel! Now you need to update your environment variables to use it.

## Step 1: Update Environment Variables in Vercel

Go to **Settings** → **Environment Variables** and update these:

### Required Updates:

1. **NEXT_PUBLIC_APP_URL**
   - **Change from**: `https://linfield-tech-hub.vercel.app`
   - **Change to**: `https://www.linfieldtechhub.com`
   - Make sure all environments are selected (Production, Preview, Development)

2. **LOGIN_REDIRECT_URI**
   - **Change from**: `https://linfield-tech-hub.vercel.app/api/auth/login/callback`
   - **Change to**: `https://www.linfieldtechhub.com/api/auth/login/callback`

3. **GOOGLE_REDIRECT_URI**
   - **Change from**: `https://linfield-tech-hub.vercel.app/api/auth/google/callback`
   - **Change to**: `https://www.linfieldtechhub.com/api/auth/google/callback`

4. **GOOGLE_CALENDAR_REDIRECT_URI**
   - **Change from**: `https://linfield-tech-hub.vercel.app/api/auth/google/calendar/callback`
   - **Change to**: `https://www.linfieldtechhub.com/api/auth/google/calendar/callback`

## Step 2: Update Google OAuth Redirect URIs

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Click on your OAuth 2.0 Client ID
4. Under **"Authorized redirect URIs"**, you should see the old Vercel URLs
5. **Add these new URIs** (keep the old ones too, or replace them):
   - `https://www.linfieldtechhub.com/api/auth/login/callback`
   - `https://www.linfieldtechhub.com/api/auth/google/callback`
   - `https://www.linfieldtechhub.com/api/auth/google/calendar/callback`
6. Click **"Save"**

## Step 3: Redeploy

After updating environment variables:
1. Go to **Deployments**
2. Click **"..."** on the latest deployment
3. Click **"Redeploy"**

## Step 4: Test

1. Visit `https://www.linfieldtechhub.com`
2. The app should load with your custom domain
3. Try logging in - it should work with the new domain

## Quick Checklist

- [ ] Updated `NEXT_PUBLIC_APP_URL` to `https://www.linfieldtechhub.com`
- [ ] Updated `LOGIN_REDIRECT_URI` to use custom domain
- [ ] Updated `GOOGLE_REDIRECT_URI` to use custom domain
- [ ] Updated `GOOGLE_CALENDAR_REDIRECT_URI` to use custom domain
- [ ] Added custom domain redirect URIs in Google Cloud Console
- [ ] Redeployed Vercel app
- [ ] Tested login with custom domain


