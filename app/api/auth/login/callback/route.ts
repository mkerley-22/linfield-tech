import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { prisma } from '@/lib/prisma'
import { createSession } from '@/lib/auth'
import { withRetry } from '@/lib/prisma-retry'

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
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  
  if (!code) {
    return NextResponse.redirect(new URL('/login?error=no_code', request.url))
  }
  
  try {
    console.log('=== LOGIN CALLBACK START ===')
    console.log('Received code:', code ? 'YES (length: ' + code.length + ')' : 'NO')
    console.log('Using redirect URI:', LOGIN_REDIRECT_URI)
    console.log('Client ID:', process.env.GOOGLE_CLIENT_ID ? 'SET' : 'NOT SET')
    
    let tokens
    try {
      tokens = await oauth2Client.getToken(code)
    } catch (tokenError: any) {
      console.error('Token exchange failed:', tokenError.message)
      if (tokenError.message?.includes('redirect_uri_mismatch')) {
        console.error('REDIRECT URI MISMATCH!')
        console.error('Make sure this URI is added in Google Cloud Console:')
        console.error(LOGIN_REDIRECT_URI)
        return NextResponse.redirect(new URL(`/login?error=auth_failed&details=${encodeURIComponent('Redirect URI mismatch. Please add ' + LOGIN_REDIRECT_URI + ' to Google Cloud Console.')}`, request.url))
      }
      throw tokenError
    }
    
    if (!tokens || !tokens.tokens || !tokens.tokens.access_token) {
      console.error('No access token received')
      return NextResponse.redirect(new URL('/login?error=no_token', request.url))
    }
    
    const accessToken = tokens.tokens.access_token
    console.log('Access token received, length:', accessToken.length)
    
    // Get user info from Google
    oauth2Client.setCredentials(tokens.tokens)
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client })
    const { data: userInfo } = await oauth2.userinfo.get()
    
    console.log('User info received:', {
      email: userInfo.email,
      name: userInfo.name,
      hasPicture: !!userInfo.picture,
    })
    
    if (!userInfo.email || !userInfo.name) {
      return NextResponse.redirect(new URL('/login?error=no_user_info', request.url))
    }
    
    // At this point, we know userInfo.email and userInfo.name are not null/undefined
    const userEmail = userInfo.email
    const userName = userInfo.name
    
    // Check if this is the initial admin user
    const isAdminEmail = userEmail.toLowerCase() === 'mkerley@linfield.com'
    
    console.log('User email:', userEmail, 'Is admin email:', isAdminEmail)
    
    // Check if user already exists
    const existingUser = await withRetry(
      () =>
        prisma.user.findUnique({
          where: { email: userEmail },
        }),
      3,
      1000
    )
    
    let user: { id: string; email: string; name: string; role: string }
    if (existingUser) {
      // Update existing user - ALWAYS set admin for mkerley@linfield.com
      const updateData: {
        name: string
        picture: string | null
        googleId: string | null | undefined
        updatedAt: Date
        role?: string
      } = {
        name: userName,
        picture: userInfo.picture || null,
        googleId: userInfo.id || null,
        updatedAt: new Date(),
      }
      
      // ALWAYS ensure mkerley@linfield.com has admin role (force it)
      if (isAdminEmail) {
        updateData.role = 'admin'
        console.log('Setting admin role for:', userEmail)
      }
      
      user = await withRetry(
        () =>
          prisma.user.update({
            where: { email: userEmail },
            data: updateData,
          }),
        3,
        1000
      )
      
      // Double-check: if it's admin email but role isn't admin, force update
      if (isAdminEmail && user.role !== 'admin') {
        console.log('Force updating role to admin for:', userEmail)
        user = await withRetry(
          () =>
            prisma.user.update({
              where: { id: user.id },
              data: { role: 'admin' },
            }),
          3,
          1000
        )
      }
    } else {
      // Create new user
      user = await withRetry(
        () =>
          prisma.user.create({
            data: {
              id: crypto.randomUUID(),
              email: userEmail,
              name: userName,
              picture: userInfo.picture || null,
              googleId: userInfo.id || null,
              role: isAdminEmail ? 'admin' : 'viewer', // Set admin for mkerley@linfield.com, default to viewer for others
              updatedAt: new Date(),
            },
          }),
        3,
        1000
      )
      console.log('Created new user with role:', user.role)
    }
    
    console.log('Final user role:', user.role, 'for email:', user.email)
    
    // Create session
    const session = await createSession(user.id)
    
    if (!session || !session.token) {
      console.error('Failed to create session')
      return NextResponse.redirect(new URL('/login?error=auth_failed', request.url))
    }
    
    // Verify session was created in database
    const verifySession = await withRetry(
      () =>
        prisma.session.findUnique({
          where: { token: session.token! },
          include: { User: true },
        }),
      3,
      1000
    )
    
    if (!verifySession || !verifySession.User) {
      console.error('ERROR: Session created but not found in database!')
      return NextResponse.redirect(new URL('/login?error=auth_failed', request.url))
    }
    
    console.log('Session verified in database, user:', verifySession.User.email, 'role:', verifySession.User.role)
    
    console.log('Login successful for:', user.email, 'Role:', user.role)
    console.log('Session token created:', session.token.substring(0, 20) + '...')
    
    // Redirect to set-cookie page which will set the cookie and then redirect
    const returnUrl = searchParams.get('return') || '/dashboard'
    const baseUrl = new URL(request.url).origin
    const setCookieUrl = new URL('/auth/set-cookie', baseUrl)
    setCookieUrl.searchParams.set('token', session.token)
    setCookieUrl.searchParams.set('return', returnUrl)
    
    console.log('Redirecting to set-cookie page, then to:', returnUrl)
    
    // Redirect to the set-cookie page
    return NextResponse.redirect(setCookieUrl)
  } catch (error: any) {
    console.error('=== LOGIN CALLBACK ERROR ===')
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    console.error('Full error:', JSON.stringify(error, null, 2))
    console.error('===========================')
    return NextResponse.redirect(new URL(`/login?error=auth_failed&details=${encodeURIComponent(error.message)}`, request.url))
  }
}

