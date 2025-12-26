# Email Setup Guide

This guide explains how to configure email functionality for the Linfield Tech Knowledge Base. Currently, emails are logged to the console. To actually send emails, you'll need to configure an email service.

## Email Features

The system sends emails for:
- **User Invitations** - When admins add new users
- **Checkout Request Confirmations** - When users submit equipment checkout requests
- **Checkout Request Status Updates** - When requests are approved, denied, or marked as seen
- **Checkout Request Messages** - When admins send messages on checkout requests

## Option 1: Resend (Recommended for Production)

Resend is a modern email API that's easy to set up and has a generous free tier.

### Setup Steps:

1. **Create a Resend Account**
   - Go to [https://resend.com](https://resend.com)
   - Sign up for a free account
   - Verify your domain (or use their test domain for development)

2. **Get Your API Key**
   - Go to API Keys in your Resend dashboard
   - Create a new API key
   - Copy the key (starts with `re_`)

3. **Install Resend Package**
   ```bash
   npm install resend
   ```

4. **Add Environment Variables**
   Add to your `.env` file:
   ```env
   RESEND_API_KEY=re_your_api_key_here
   EMAIL_FROM=noreply@yourdomain.com
   # Or use Resend's test domain for development:
   # EMAIL_FROM=onboarding@resend.dev
   ```

5. **Update `lib/email.ts`**
   Replace the `sendEmail` function with:
   ```typescript
   import { Resend } from 'resend'

   const resend = new Resend(process.env.RESEND_API_KEY)

   export async function sendEmail(options: EmailOptions): Promise<boolean> {
     try {
       await resend.emails.send({
         from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
         to: options.to,
         subject: options.subject,
         html: options.html,
         text: options.text,
       })
       console.log('Email sent successfully to:', options.to)
       return true
     } catch (error) {
       console.error('Failed to send email:', error)
       return false
     }
   }
   ```

## Option 2: SendGrid

SendGrid is a popular email service with a free tier.

### Setup Steps:

1. **Create a SendGrid Account**
   - Go to [https://sendgrid.com](https://sendgrid.com)
   - Sign up for a free account
   - Verify your email address

2. **Create an API Key**
   - Go to Settings > API Keys
   - Create a new API key with "Full Access" or "Mail Send" permissions
   - Copy the API key

3. **Install SendGrid Package**
   ```bash
   npm install @sendgrid/mail
   ```

4. **Add Environment Variables**
   Add to your `.env` file:
   ```env
   SENDGRID_API_KEY=SG.your_api_key_here
   EMAIL_FROM=noreply@yourdomain.com
   ```

5. **Update `lib/email.ts`**
   Replace the `sendEmail` function with:
   ```typescript
   import sgMail from '@sendgrid/mail'

   sgMail.setApiKey(process.env.SENDGRID_API_KEY!)

   export async function sendEmail(options: EmailOptions): Promise<boolean> {
     try {
       await sgMail.send({
         from: process.env.EMAIL_FROM || 'noreply@example.com',
         to: options.to,
         subject: options.subject,
         html: options.html,
         text: options.text,
       })
       console.log('Email sent successfully to:', options.to)
       return true
     } catch (error) {
       console.error('Failed to send email:', error)
       return false
     }
   }
   ```

## Option 3: SMTP (Gmail, Outlook, etc.)

You can use any SMTP server, including Gmail, Outlook, or your own mail server.

### Setup Steps:

1. **Get SMTP Credentials**
   - For Gmail: Create an App Password (Settings > Security > 2-Step Verification > App Passwords)
   - For Outlook: Use your email and password, or create an app password
   - For custom SMTP: Get credentials from your email provider

2. **Install Nodemailer**
   ```bash
   npm install nodemailer
   npm install --save-dev @types/nodemailer
   ```

3. **Add Environment Variables**
   Add to your `.env` file:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   SMTP_FROM=noreply@yourdomain.com
   ```

   **Common SMTP Settings:**
   - **Gmail**: `smtp.gmail.com`, port `587` (TLS) or `465` (SSL)
   - **Outlook**: `smtp-mail.outlook.com`, port `587`
   - **Custom**: Check with your email provider

4. **Update `lib/email.ts`**
   Replace the `sendEmail` function with:
   ```typescript
   import nodemailer from 'nodemailer'

   const transporter = nodemailer.createTransport({
     host: process.env.SMTP_HOST,
     port: parseInt(process.env.SMTP_PORT || '587'),
     secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
     auth: {
       user: process.env.SMTP_USER,
       pass: process.env.SMTP_PASS,
     },
   })

   export async function sendEmail(options: EmailOptions): Promise<boolean> {
     try {
       await transporter.sendMail({
         from: process.env.SMTP_FROM || process.env.SMTP_USER,
         to: options.to,
         subject: options.subject,
         html: options.html,
         text: options.text,
       })
       console.log('Email sent successfully to:', options.to)
       return true
     } catch (error) {
       console.error('Failed to send email:', error)
       return false
     }
   }
   ```

## Option 4: AWS SES (Amazon Simple Email Service)

Good for high-volume sending and AWS-integrated applications.

### Setup Steps:

1. **Set up AWS SES**
   - Go to AWS Console > SES
   - Verify your email address or domain
   - Move out of sandbox mode if needed (for production)

2. **Create IAM User**
   - Create an IAM user with SES sending permissions
   - Generate access keys

3. **Install AWS SDK**
   ```bash
   npm install @aws-sdk/client-ses
   ```

4. **Add Environment Variables**
   Add to your `.env` file:
   ```env
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your_access_key
   AWS_SECRET_ACCESS_KEY=your_secret_key
   EMAIL_FROM=noreply@yourdomain.com
   ```

5. **Update `lib/email.ts`**
   Replace the `sendEmail` function with:
   ```typescript
   import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'

   const sesClient = new SESClient({
     region: process.env.AWS_REGION || 'us-east-1',
     credentials: {
       accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
       secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
     },
   })

   export async function sendEmail(options: EmailOptions): Promise<boolean> {
     try {
       const command = new SendEmailCommand({
         Source: process.env.EMAIL_FROM!,
         Destination: {
           ToAddresses: [options.to],
         },
         Message: {
           Subject: {
             Data: options.subject,
           },
           Body: {
             Html: {
               Data: options.html,
             },
             ...(options.text && {
               Text: {
                 Data: options.text,
               },
             }),
           },
         },
       })

       await sesClient.send(command)
       console.log('Email sent successfully to:', options.to)
       return true
     } catch (error) {
       console.error('Failed to send email:', error)
       return false
     }
   }
   ```

## Testing Email Setup

After configuring your email service:

1. **Test User Invitation**
   - Go to Settings > Users
   - Add a new user with your email address
   - Check your inbox for the invitation email

2. **Test Checkout Request**
   - Submit a checkout request from the public checkout page
   - Check your email for the confirmation

3. **Check Server Logs**
   - Look for "Email sent successfully" messages
   - Check for any error messages

## Troubleshooting

### Emails Not Sending

1. **Check Environment Variables**
   - Verify all required environment variables are set
   - Restart your dev server after adding new variables

2. **Check Email Service Status**
   - Verify your API keys/credentials are correct
   - Check if your email service account is active
   - For SMTP: Test credentials with a mail client first

3. **Check Spam Folder**
   - Emails might be going to spam
   - Verify your "from" email address
   - For production: Set up SPF, DKIM, and DMARC records

4. **Check Server Logs**
   - Look for error messages in the console
   - Common issues:
     - Invalid API keys
     - Unverified email addresses (for SES)
     - Rate limiting (check service limits)

### Development vs Production

- **Development**: Use test domains or development API keys
- **Production**: 
  - Verify your domain with the email service
  - Use production API keys
  - Set up proper email authentication (SPF, DKIM, DMARC)

## Security Notes

- **Never commit API keys or passwords to git**
- Store all credentials in `.env` file (which should be in `.gitignore`)
- Use environment-specific keys for development and production
- Rotate API keys regularly
- Use app passwords for Gmail/Outlook instead of your main password

## Current Status

The email system is currently set to **log emails to the console** only. To enable actual email sending, follow one of the setup options above and update the `sendEmail` function in `lib/email.ts`.

## Need Help?

- Check the email service's documentation
- Review server logs for specific error messages
- Test with a simple email first before using the full system

