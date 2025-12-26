import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Test endpoint to check if cookies are being read
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session_token')
    
    // Also check request cookies
    const requestCookies = request.cookies.get('session_token')
    
    return NextResponse.json({
      cookieStore: {
        hasToken: !!sessionToken,
        tokenValue: sessionToken?.value ? sessionToken.value.substring(0, 20) + '...' : null,
      },
      requestCookies: {
        hasToken: !!requestCookies,
        tokenValue: requestCookies?.value ? requestCookies.value.substring(0, 20) + '...' : null,
      },
      allCookies: Object.fromEntries(
        Array.from(cookieStore.getAll()).map(c => [c.name, c.value.substring(0, 20) + '...'])
      ),
    })
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack,
    }, { status: 500 })
  }
}

