import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { prisma } from '@/lib/prisma'

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback'
)

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  
  if (!code) {
    return NextResponse.redirect(new URL('/settings?error=no_code', request.url))
  }
  
  try {
    const { tokens } = await oauth2Client.getToken(code)
    
    if (!tokens.access_token) {
      return NextResponse.redirect(new URL('/settings?error=no_token', request.url))
    }
    
    // Store tokens (using 'default' as userId for now - can be enhanced with user auth)
    await prisma.googleAuth.upsert({
      where: { userId: 'default' },
      create: {
        userId: 'default',
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || null,
        tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : new Date(Date.now() + 3600000),
        scope: Array.isArray(tokens.scope) ? tokens.scope.join(',') : tokens.scope || '',
      },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || null,
        tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : new Date(Date.now() + 3600000),
        scope: Array.isArray(tokens.scope) ? tokens.scope.join(',') : tokens.scope || '',
      },
    })
    
    return NextResponse.redirect(new URL('/settings?success=connected', request.url))
  } catch (error: any) {
    console.error('OAuth callback error:', error)
    return NextResponse.redirect(new URL('/settings?error=auth_failed', request.url))
  }
}

