import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { prisma } from '@/lib/prisma'
import { createSession, setSessionCookie } from '@/lib/auth'

// Use a separate redirect URI for user login (not Google Drive integration)
// This MUST match what's configured in Google Cloud Console
const LOGIN_REDIRECT_URI = process.env.LOGIN_REDIRECT_URI || process.env.NEXT_PUBLIC_APP_URL 
  ? `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/login/callback`
  : 'http://localhost:3000/api/auth/login/callback'

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  LOGIN_REDIRECT_URI
)

export async function GET(request: NextRequest) {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return NextResponse.json(
      { 
        error: 'Google OAuth not configured',
        message: 'Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your .env file.'
      },
      { status: 500 }
    )
  }

  // Only request user profile info for login
  const scopes = [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ]
  
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
  })
  
  return NextResponse.json({ url })
}

