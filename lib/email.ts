// Email notification utilities for checkout requests
// This is a placeholder implementation. To enable email notifications:
// 1. Install an email service (e.g., nodemailer, resend, sendgrid)
// 2. Configure SMTP or API credentials in .env
// 3. Implement the sendEmail function below

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  // TODO: Implement email sending
  // Example with nodemailer:
  // const transporter = nodemailer.createTransport({
  //   host: process.env.SMTP_HOST,
  //   port: parseInt(process.env.SMTP_PORT || '587'),
  //   secure: false,
  //   auth: {
  //     user: process.env.SMTP_USER,
  //     pass: process.env.SMTP_PASS,
  //   },
  // })
  // await transporter.sendMail({
  //   from: process.env.SMTP_FROM || 'noreply@example.com',
  //   ...options,
  // })

  // For now, just log the email
  console.log('Email would be sent:', {
    to: options.to,
    subject: options.subject,
    html: options.html,
  })

  return true
}

export async function sendCheckoutRequestConfirmation(
  requesterEmail: string,
  requesterName: string,
  requestId: string
): Promise<boolean> {
  const subject = 'Equipment Checkout Request Received'
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb;">Equipment Checkout Request Received</h2>
        <p>Hello ${requesterName},</p>
        <p>Thank you for submitting your equipment checkout request. We have received your request and will review it shortly.</p>
        <p>You will receive an email notification once your request has been reviewed.</p>
        <p>Request ID: <strong>${requestId}</strong></p>
        <p>If you have any questions, please don't hesitate to contact us.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
      </body>
    </html>
  `

  return sendEmail({
    to: requesterEmail,
    subject,
    html,
  })
}

export async function sendCheckoutRequestStatusUpdate(
  requesterEmail: string,
  requesterName: string,
  requestId: string,
  status: 'seen' | 'approved' | 'denied',
  message?: string
): Promise<boolean> {
  const statusLabels: Record<string, string> = {
    seen: 'Seen',
    approved: 'Approved',
    denied: 'Denied',
  }

  const statusMessages: Record<string, string> = {
    seen: 'Your request has been reviewed.',
    approved: 'Your request has been approved! The equipment will be prepared for you.',
    denied: 'Unfortunately, your request has been denied.',
  }

  const subject = `Equipment Checkout Request ${statusLabels[status]}`
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: ${status === 'approved' ? '#10b981' : status === 'denied' ? '#ef4444' : '#2563eb'};">
          Equipment Checkout Request ${statusLabels[status]}
        </h2>
        <p>Hello ${requesterName},</p>
        <p>${statusMessages[status]}</p>
        ${message ? `<div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Message:</strong></p>
          <p style="margin: 10px 0 0 0;">${message}</p>
        </div>` : ''}
        <p>Request ID: <strong>${requestId}</strong></p>
        <p>If you have any questions, please don't hesitate to contact us.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
      </body>
    </html>
  `

  return sendEmail({
    to: requesterEmail,
    subject,
    html,
  })
}

export async function sendCheckoutRequestMessage(
  requesterEmail: string,
  requesterName: string,
  requestId: string,
  adminName: string,
  message: string
): Promise<boolean> {
  const subject = 'New Message on Your Equipment Checkout Request'
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb;">New Message on Your Equipment Checkout Request</h2>
        <p>Hello ${requesterName},</p>
        <p>You have received a new message regarding your equipment checkout request:</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0;"><strong>From:</strong> ${adminName}</p>
          <p style="margin: 10px 0 0 0;">${message}</p>
        </div>
        <p>Request ID: <strong>${requestId}</strong></p>
        <p>If you have any questions, please don't hesitate to contact us.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
      </body>
    </html>
  `

  return sendEmail({
    to: requesterEmail,
    subject,
    html,
  })
}

export async function sendUserInvitation(
  userEmail: string,
  userName: string,
  role: 'admin' | 'editor' | 'viewer',
  loginUrl: string
): Promise<boolean> {
  const roleDescriptions: Record<string, string> = {
    admin: 'Administrator - Full system access including user management and all content',
    editor: 'Editor - Can create, edit, and manage content',
    viewer: 'Viewer - Read-only access to view content',
  }

  const roleColors: Record<string, string> = {
    admin: '#ef4444',
    editor: '#2563eb',
    viewer: '#6b7280',
  }

  const subject = 'Welcome to Linfield AV Hub'
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="background-color: #2563eb; width: 64px; height: 64px; border-radius: 8px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
            <span style="color: white; font-size: 24px; font-weight: bold;">LC</span>
          </div>
          <h1 style="color: #111827; margin: 0; font-size: 24px;">Linfield AV Hub</h1>
        </div>
        
        <h2 style="color: #2563eb; margin-top: 0;">Welcome, ${userName}!</h2>
        
        <p>You have been invited to access the Linfield AV Hub. Your account has been created with the following permissions:</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${roleColors[role]};">
          <p style="margin: 0 0 8px 0; font-weight: bold; color: ${roleColors[role]}; text-transform: capitalize;">
            ${role.charAt(0).toUpperCase() + role.slice(1)} Role
          </p>
          <p style="margin: 0; color: #6b7280; font-size: 14px;">
            ${roleDescriptions[role]}
          </p>
        </div>
        
        <p>To get started, please sign in using your Google account (${userEmail}):</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${loginUrl}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
            Sign In with Google
          </a>
        </div>
        
        <div style="background-color: #fef3c7; border: 1px solid #fbbf24; padding: 12px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px; color: #92400e;">
            <strong>Note:</strong> You must sign in with the Google account associated with <strong>${userEmail}</strong> to access the system.
          </p>
        </div>
        
        <p style="color: #6b7280; font-size: 14px;">
          If you have any questions or need assistance, please contact your system administrator.
        </p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        
        <p style="color: #6b7280; font-size: 12px; text-align: center;">
          This is an automated invitation. Please do not reply to this email.
        </p>
      </body>
    </html>
  `

  return sendEmail({
    to: userEmail,
    subject,
    html,
  })
}

export async function sendReadyForPickupEmail(
  requesterEmail: string,
  requesterName: string,
  requestId: string
): Promise<boolean> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const scheduleUrl = `${baseUrl}/checkout/schedule/${requestId}`
  
  const subject = 'Your Equipment is Ready for Pickup'
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="background-color: #10b981; width: 64px; height: 64px; border-radius: 8px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
            <span style="color: white; font-size: 32px;">✓</span>
          </div>
          <h1 style="color: #111827; margin: 0; font-size: 24px;">Your Equipment is Ready for Pickup</h1>
        </div>
        
        <h2 style="color: #2563eb; margin-top: 0;">Hello ${requesterName}!</h2>
        
        <p>Great news! Your equipment checkout request has been prepared and is ready for pickup.</p>
        
        <p>Please schedule a convenient time to pick up your equipment by clicking the button below:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${scheduleUrl}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
            Schedule Pickup Time
          </a>
        </div>
        
        <p style="color: #6b7280; font-size: 14px;">
          Or copy and paste this link into your browser:<br>
          <a href="${scheduleUrl}" style="color: #2563eb; word-break: break-all;">${scheduleUrl}</a>
        </p>
        
        <div style="background-color: #fef3c7; border: 1px solid #fbbf24; padding: 12px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px; color: #92400e;">
            <strong>Note:</strong> Please schedule your pickup time as soon as possible to ensure availability.
          </p>
        </div>
        
        <p>Request ID: <strong>${requestId}</strong></p>
        
        <p style="color: #6b7280; font-size: 14px;">
          If you have any questions or need assistance, please contact your system administrator.
        </p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        
        <p style="color: #6b7280; font-size: 12px; text-align: center;">
          This is an automated invitation. Please do not reply to this email.
        </p>
      </body>
    </html>
  `

  return sendEmail({
    to: requesterEmail,
    subject,
    html,
  })
}

