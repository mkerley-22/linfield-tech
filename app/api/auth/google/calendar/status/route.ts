import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Check if there's a calendar auth record (calendar-specific or default)
    let auth = await prisma.googleAuth.findUnique({
      where: { userId: 'calendar' },
    })

    if (!auth) {
      auth = await prisma.googleAuth.findUnique({
        where: { userId: 'default' },
      })
    }

    if (auth) {
      // Check if it has calendar scopes
      const scopes = auth.scope.split(',').map(s => s.trim())
      const hasCalendarScope = scopes.some(scope => 
        scope.includes('calendar.readonly') || 
        scope.includes('calendar.events') ||
        scope.includes('calendar')
      )

      return NextResponse.json({
        connected: hasCalendarScope,
        hasToken: !!auth?.accessToken,
      })
    }

    return NextResponse.json({
      connected: false,
      hasToken: false,
    })
  } catch (error: any) {
    console.error('Check Calendar status error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to check status' },
      { status: 500 }
    )
  }
}

