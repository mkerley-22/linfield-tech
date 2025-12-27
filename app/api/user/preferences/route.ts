import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const preferences = await prisma.userPreferences.findUnique({
      where: { userId: user.id },
    })

    return NextResponse.json({
      preferences: preferences || {
        schoolDudeCalendarId: 'primary',
        schoolDudeDaysInAdvance: 365,
      },
    })
  } catch (error: any) {
    console.error('Get user preferences error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch preferences' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { schoolDudeCalendarId, schoolDudeDaysInAdvance } = body

    const preferences = await prisma.userPreferences.upsert({
      where: { userId: user.id },
      update: {
        schoolDudeCalendarId: schoolDudeCalendarId !== undefined ? schoolDudeCalendarId : undefined,
        schoolDudeDaysInAdvance: schoolDudeDaysInAdvance !== undefined ? schoolDudeDaysInAdvance : undefined,
        updatedAt: new Date(),
      },
      create: {
        userId: user.id,
        schoolDudeCalendarId: schoolDudeCalendarId || 'primary',
        schoolDudeDaysInAdvance: schoolDudeDaysInAdvance || 365,
      },
    })

    return NextResponse.json({ preferences })
  } catch (error: any) {
    console.error('Update user preferences error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update preferences' },
      { status: 500 }
    )
  }
}

