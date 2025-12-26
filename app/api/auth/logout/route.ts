import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { deleteSession, clearSessionCookie } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session_token')?.value

    if (sessionToken) {
      await deleteSession(sessionToken)
    }

    await clearSessionCookie()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json({ success: false, error: 'Failed to logout' }, { status: 500 })
  }
}

