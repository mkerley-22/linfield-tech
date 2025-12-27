import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const user = await getUser()

    if (!user) {
      // Log for debugging
      console.log('Auth check failed - no user found')
      return NextResponse.json({ user: null }, { status: 401 })
    }

    return NextResponse.json({ 
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        role: user.role,
      }
    })
  } catch (error) {
    console.error('Error in /api/auth/me:', error)
    return NextResponse.json({ user: null }, { status: 401 })
  }
}

