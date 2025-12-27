# Email Receiving Setup Guide

This guide will help you set up email receiving so that replies to checkout request emails are automatically added to the message thread.

## Step 1: Enable Email Receiving in Resend

1. Go to your Resend dashboard
2. Navigate to **Domains** → Your domain (`tech.linfieldtechhub.com`)
3. Enable **"Enable Receiving"** toggle
4. Add the MX record shown to your domain registrar:
   - **Type**: MX
   - **Name**: `tech` (or your subdomain)
   - **Content**: `inbound-smtp.us-east-1.amazonaws.com` (or what Resend shows)
   - **TTL**: 60
   - **Priority**: 10

5. Wait for verification (green checkmark)

## Step 2: Set Up Webhook in Resend

1. In Resend dashboard, go to **Webhooks**
2. Click **"Create Webhook"**
3. Configure:
   - **Name**: "Checkout Request Replies"
   - **Events**: Select **"email.received"** (incoming emails)
   - **Endpoint URL**: `https://www.linfieldtechhub.com/api/email/webhook`
   - **Secret**: (optional, but recommended for security)

4. Click **"Create"**
5. Copy the webhook secret (if you set one)

**⚠️ IMPORTANT NOTE**: Resend's inbound email webhooks (`email.received`) currently **do not include the email body content** by default. They only include metadata (from, to, subject, email_id, etc.).

**Workaround Options:**
1. **Check Resend Settings**: Look for any option in the webhook configuration to include email body/content
2. **Use Email Subject**: We can extract request info from the subject line if needed
3. **Alternative**: Consider using a different email receiving service that includes body content, or manually copy replies into the system

The webhook will still receive the email and match it to the correct checkout request, but the message content will need to be handled differently.

## Step 3: Add Webhook Secret to Vercel (Optional but Recommended)

If you set a webhook secret in Resend:

1. Go to Vercel → **Settings** → **Environment Variables**
2. Add:
   ```
   RESEND_WEBHOOK_SECRET = your_webhook_secret_here
   ```
3. Select all environments
4. Save

## Step 4: Update Email Templates

The email templates have been updated to include:
- Reply-to address: `checkout-{requestId}@tech.linfieldtechhub.com`
- Subject line with request ID: `[Request {requestId}] ...`
- Instructions telling users they can reply to the email

## Step 5: Test

1. **Send a test message:**
   - Go to Checkout page
   - Select a request
   - Send a message
   - The requester will receive an email

2. **Reply to the email:**
   - From the requester's email, reply to the message
   - The reply should appear in the checkout request's message thread within a few seconds

## How It Works

1. **Admin sends message** → Email sent with reply-to: `checkout-{requestId}@tech.linfieldtechhub.com`
2. **Requester replies** → Email goes to Resend's receiving service
3. **Resend webhook** → Sends email data to `/api/email/webhook`
4. **Webhook processes** → Extracts request ID, finds checkout request, creates message
5. **Message appears** → Shows up in the checkout request's message thread

## Troubleshooting

### Replies not appearing?

1. **Check webhook logs:**
   - Go to Resend → Webhooks → Your webhook
   - Check "Recent Events" for any errors

2. **Check Vercel logs:**
   - Go to Vercel → Deployments → Latest → Functions
   - Look for `/api/email/webhook` logs
   - Check for errors

3. **Verify MX record:**
   - Make sure MX record is added and verified in Resend
   - DNS propagation can take up to 48 hours (usually much faster)

4. **Check email format:**
   - Make sure the reply-to address format is correct: `checkout-{requestId}@tech.linfieldtechhub.com`
   - Verify the request ID is in the subject line

### Webhook not receiving emails?

1. **Check webhook URL:**
   - Make sure it's your production URL: `https://www.linfieldtechhub.com/api/email/webhook`
   - Not localhost or preview URL

2. **Check webhook status:**
   - In Resend, verify the webhook is active
   - Check if it's receiving events

3. **Test webhook:**
   - Resend has a "Test" button in webhook settings
   - Use it to verify the endpoint is working

## Security Notes

- The webhook endpoint is public (no auth required) because Resend needs to call it
- The endpoint validates:
  - Request ID exists
  - Sender email matches requester (logs warning if not)
  - Message content is valid

- For additional security, you can:
  - Add webhook secret verification
  - Rate limit the endpoint
  - Add IP whitelisting (Resend IPs)

## Next Steps

After setup:
- ✅ Replies to checkout messages will appear in the message thread
- ✅ All communication stays in one place
- ✅ No need to switch between email and the app

The system is now ready to receive and process email replies!

