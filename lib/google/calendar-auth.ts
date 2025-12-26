import { google } from 'googleapis'
import { prisma } from '@/lib/prisma'

export async function getOrRefreshCalendarToken() {
  // Look for calendar auth (calendar-only uses userId 'calendar', full Google uses 'default')
  // Prefer 'calendar' if it exists, otherwise use 'default' (which includes calendar scopes)
  let auth = await prisma.googleAuth.findUnique({
    where: { userId: 'calendar' },
  })
  
  if (!auth) {
    auth = await prisma.googleAuth.findUnique({
      where: { userId: 'default' },
    })
  }

  if (!auth) {
    throw new Error('Google Calendar not connected. Please connect in Settings.')
  }
  
  // Check if the token has calendar scopes
  const scopes = auth.scope.split(',').map(s => s.trim())
  const hasCalendarScope = scopes.some(scope => 
    scope.includes('calendar.readonly') || 
    scope.includes('calendar.events') ||
    scope.includes('calendar')
  )
  
  if (!hasCalendarScope) {
    throw new Error('Google Calendar scopes not found. Please reconnect with calendar permissions.')
  }

  // Check if token is expired
  if (auth.tokenExpiry < new Date()) {
    if (!auth.refreshToken) {
      throw new Error('Token expired and no refresh token available. Please reconnect.')
    }

    // Refresh the token
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/calendar/callback'
    )

    oauth2Client.setCredentials({
      refresh_token: auth.refreshToken,
    })

    try {
      const { credentials } = await oauth2Client.refreshAccessToken()
      
      // Update stored token
      await prisma.googleAuth.update({
        where: { id: auth.id },
        data: {
          accessToken: credentials.access_token!,
          tokenExpiry: credentials.expiry_date ? new Date(credentials.expiry_date) : new Date(Date.now() + 3600000),
        },
      })

      return credentials.access_token!
    } catch (error) {
      console.error('Failed to refresh token:', error)
      throw new Error('Failed to refresh access token. Please reconnect.')
    }
  }

  return auth.accessToken
}

export async function getCalendarClient(accessToken?: string) {
  const token = accessToken || await getOrRefreshCalendarToken()
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/calendar/callback'
  )

  oauth2Client.setCredentials({
    access_token: token,
  })

  return google.calendar({ version: 'v3', auth: oauth2Client })
}

