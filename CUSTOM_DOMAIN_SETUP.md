# Setting Up Your Custom Domain on Vercel

This guide will help you connect your purchased domain to your Vercel deployment.

## Step 1: Add Domain in Vercel

1. Go to your Vercel project dashboard
2. Click on the **"Settings"** tab
3. Click on **"Domains"** in the left sidebar
4. Click **"Add Domain"** button
5. Enter your domain name (e.g., `yourdomain.com` or `www.yourdomain.com`)
6. Click **"Add"**

## Step 2: Configure DNS Records

Vercel will show you the DNS records you need to add. You'll need to add these to your domain registrar (where you bought the domain - GoDaddy, Namecheap, Google Domains, etc.).

### Option A: Root Domain (yourdomain.com)

Add these DNS records at your domain registrar:

**Type A Record:**
- **Name/Host**: `@` or leave blank (depends on your registrar)
- **Value**: `76.76.21.21`
- **TTL**: 3600 (or default)

**Type CNAME Record:**
- **Name/Host**: `www`
- **Value**: `cname.vercel-dns.com.`
- **TTL**: 3600 (or default)

### Option B: Subdomain (app.yourdomain.com)

**Type CNAME Record:**
- **Name/Host**: `app` (or whatever subdomain you want)
- **Value**: `cname.vercel-dns.com.`
- **TTL**: 3600 (or default)

**Note:** Vercel will show you the exact values to use - they may vary.

## Step 3: Update Environment Variables

After your domain is connected, update your environment variables:

1. Go to **Settings** → **Environment Variables**
2. Update `NEXT_PUBLIC_APP_URL`:
   - Change from: `https://linfield-tech-hub.vercel.app`
   - Change to: `https://yourdomain.com` (or your custom domain)
3. Update redirect URIs:
   - `LOGIN_REDIRECT_URI`: `https://yourdomain.com/api/auth/login/callback`
   - `GOOGLE_REDIRECT_URI`: `https://yourdomain.com/api/auth/google/callback`
   - `GOOGLE_CALENDAR_REDIRECT_URI`: `https://yourdomain.com/api/auth/google/calendar/callback`

## Step 4: Update Google OAuth Redirect URIs

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Click on your OAuth 2.0 Client ID
4. Under **"Authorized redirect URIs"**, add:
   - `https://yourdomain.com/api/auth/login/callback`
   - `https://yourdomain.com/api/auth/google/callback`
   - `https://yourdomain.com/api/auth/google/calendar/callback`
5. Click **"Save"**

## Step 5: Wait for DNS Propagation

DNS changes can take anywhere from a few minutes to 48 hours to propagate. Usually it's within 1-2 hours.

You can check if it's working by:
- Visiting your custom domain
- Checking Vercel's domain status (should show "Valid Configuration")

## Step 6: Force HTTPS (Automatic)

Vercel automatically provides SSL certificates for your custom domain via Let's Encrypt. This happens automatically once DNS is configured correctly.

## Troubleshooting

### Domain shows "Invalid Configuration"
- Check that DNS records are correct
- Wait a bit longer for DNS propagation
- Verify the records at your domain registrar match what Vercel shows

### "Domain already in use"
- The domain might be connected to another Vercel project
- Remove it from the other project first
- Or use a different subdomain

### SSL Certificate Issues
- Vercel automatically provisions SSL certificates
- If there's an issue, wait 24-48 hours for Let's Encrypt to retry
- Check Vercel's domain status page

### Still seeing Vercel URL
- Clear your browser cache
- Check that `NEXT_PUBLIC_APP_URL` is updated in Vercel
- Redeploy after updating environment variables
- Make sure you're visiting the custom domain, not the Vercel URL

## Quick Checklist

- [ ] Added domain in Vercel Settings → Domains
- [ ] Added DNS records at domain registrar
- [ ] Updated `NEXT_PUBLIC_APP_URL` in Vercel environment variables
- [ ] Updated all redirect URIs in Vercel environment variables
- [ ] Updated Google OAuth redirect URIs in Google Cloud Console
- [ ] Waited for DNS propagation (check Vercel domain status)
- [ ] Redeployed Vercel app
- [ ] Tested login with custom domain

## After Setup

Once your domain is working:
- Your app will be accessible at `https://yourdomain.com`
- The Vercel URL will still work but redirect to your custom domain (if configured)
- All OAuth flows will use your custom domain


