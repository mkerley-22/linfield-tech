import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 })
    }

    // Set cookie using cookies() API
    const cookieStore = await cookies()
    cookieStore.set('session_token', token, {
      httpOnly: true,
      secure: false, // false for localhost
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    })

    console.log('Session cookie set via API endpoint')

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Set session error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to set session' },
      { status: 500 }
    )
  }
}


