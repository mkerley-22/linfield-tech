# How to Fix "redirect_uri_mismatch" Error

This error means the redirect URI your app is sending doesn't match what's configured in Google Cloud Console.

## Step 1: Find Your Vercel URL

1. Go to your Vercel project dashboard
2. Look at the top - your URL will be something like: `https://your-app-name.vercel.app`
3. **Write this down** - you'll need it

## Step 2: Check Your Vercel Environment Variables

1. In Vercel, go to **Settings** → **Environment Variables**
2. Make sure you have:
   - `NEXT_PUBLIC_APP_URL` = `https://your-app-name.vercel.app` (no trailing slash!)
   - `LOGIN_REDIRECT_URI` = `https://your-app-name.vercel.app/api/auth/login/callback` (optional, but recommended)

## Step 3: Add Redirect URI to Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to **APIs & Services** → **Credentials**
4. Find your OAuth 2.0 Client ID and **click on it** to edit
5. Under **"Authorized redirect URIs"**, click **"+ ADD URI"**
6. Add **exactly** this URI (replace with your actual Vercel URL):
   ```
   https://your-app-name.vercel.app/api/auth/login/callback
   ```
7. **Important**: Make sure it matches EXACTLY:
   - Must start with `https://` (not `http://`)
   - No trailing slash at the end
   - Must be exactly: `/api/auth/login/callback` (not `/api/auth/login/callback/`)
8. Click **"SAVE"**

## Step 4: Also Add Other Redirect URIs (if using Google Drive/Calendar)

While you're in Google Cloud Console, also add these redirect URIs:

```
https://your-app-name.vercel.app/api/auth/google/callback
https://your-app-name.vercel.app/api/auth/google/calendar/callback
```

## Step 5: Redeploy Your Vercel App

After updating Google Cloud Console:
1. Go to Vercel → **Deployments**
2. Click **"..."** on the latest deployment
3. Click **"Redeploy"**

Or just push a new commit to trigger a redeploy.

## Step 6: Test Again

1. Go to your Vercel URL
2. Try logging in with Google
3. The error should be gone!

## Common Mistakes to Avoid

❌ **Wrong**: `http://your-app.vercel.app/api/auth/login/callback` (missing `s` in `https`)
❌ **Wrong**: `https://your-app.vercel.app/api/auth/login/callback/` (trailing slash)
❌ **Wrong**: `https://your-app.vercel.app/login/callback` (wrong path)
✅ **Correct**: `https://your-app.vercel.app/api/auth/login/callback`

## Still Not Working?

1. **Check Vercel logs**: Go to your deployment → **"Functions"** tab → Check for any errors
2. **Verify environment variables**: Make sure `NEXT_PUBLIC_APP_URL` is set correctly in Vercel
3. **Wait a few minutes**: Google sometimes takes a few minutes to update redirect URIs
4. **Check the exact error**: Look at the error details in Google's error page - it might show the exact URI that's being sent

## Quick Checklist

- [ ] Found your Vercel URL
- [ ] Set `NEXT_PUBLIC_APP_URL` in Vercel environment variables
- [ ] Added redirect URI to Google Cloud Console (exact match, no trailing slash)
- [ ] Saved changes in Google Cloud Console
- [ ] Redeployed Vercel app
- [ ] Tested login again

