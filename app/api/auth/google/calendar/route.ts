import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/calendar/callback'
)

export async function GET(request: NextRequest) {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return NextResponse.json(
      { 
        error: 'Google OAuth not configured',
        message: 'Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your .env file. See INTEGRATION_SETUP.md for instructions.'
      },
      { status: 500 }
    )
  }

  // Only request calendar scopes, not Drive
  const scopes = [
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/calendar.events',
  ]
  
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
  })
  
  return NextResponse.json({ url })
}

