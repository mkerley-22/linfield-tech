# Quick Email Setup Guide

This guide will help you set up email functionality in 5 minutes using Resend (recommended).

## Step 1: Create Resend Account (2 minutes)

1. Go to [https://resend.com](https://resend.com)
2. Sign up for a free account (no credit card required)
3. Verify your email address

## Step 2: Get API Key (1 minute)

1. In Resend dashboard, go to **API Keys**
2. Click **"Create API Key"**
3. Name it "Linfield AV Hub" (or anything you want)
4. Copy the API key (starts with `re_`)

## Step 3: Add to Vercel Environment Variables (1 minute)

1. Go to your Vercel project → **Settings** → **Environment Variables**
2. Add these variables:

```
RESEND_API_KEY = re_your_api_key_here
EMAIL_FROM = onboarding@resend.dev
```

**For Production:**
- Use your custom domain: `EMAIL_FROM = noreply@linfieldtechhub.com`
- Or use Resend's test domain for now: `EMAIL_FROM = onboarding@resend.dev`

3. Make sure to select **Production**, **Preview**, and **Development** environments
4. Click **Save**

## Step 4: Install Resend Package (1 minute)

Run this command locally:
```bash
npm install resend
```

Then commit and push:
```bash
git add package.json package-lock.json
git commit -m "Add Resend email package"
git push
```

## Step 5: Redeploy (automatic)

Vercel will automatically redeploy. The email functionality will now work!

## What Emails Will Be Sent?

✅ **Checkout Request Messages** - When you send a message through the checkout interface, the requester gets an email

✅ **New User Invitations** - When you add a new user in Settings → Users, they get a welcome email with login instructions

✅ **Checkout Request Confirmations** - When someone submits a checkout request, they get a confirmation email

✅ **Status Updates** - When you approve/deny a request, the requester gets an email

✅ **Ready for Pickup** - When equipment is ready, the requester gets an email

## Testing

1. **Test User Invitation:**
   - Go to Settings → Users
   - Add a new user with your email
   - Check your inbox!

2. **Test Checkout Message:**
   - Go to Checkout page
   - Select a request
   - Send a message
   - The requester will get an email

## Troubleshooting

### Emails not sending?
- Check that `RESEND_API_KEY` is set in Vercel
- Check that `EMAIL_FROM` is set
- Check Vercel logs for errors
- Make sure you've installed the `resend` package

### Using custom domain?
- Verify your domain in Resend dashboard
- Update `EMAIL_FROM` to use your domain: `noreply@linfieldtechhub.com`

## Next Steps

After setup, emails will automatically work for:
- ✅ Sending messages to requesters
- ✅ New user invitations
- ✅ All checkout notifications

No code changes needed - just set the environment variables!

