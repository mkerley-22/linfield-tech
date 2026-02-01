import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUser } from '@/lib/auth'
import { withRetry } from '@/lib/prisma-retry'

export async function GET(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const preferences = await withRetry(
      () => prisma.userPreferences.findUnique({
        where: { userId: user.id },
      })
    )

    const prefs = preferences || {
      schoolDudeCalendarId: 'primary',
      schoolDudeDaysInAdvance: 365,
      mutedCheckoutCategoryIds: null,
    }
    const mutedCheckoutCategoryIds = prefs.mutedCheckoutCategoryIds
      ? (() => {
          try {
            const arr = typeof prefs.mutedCheckoutCategoryIds === 'string'
              ? JSON.parse(prefs.mutedCheckoutCategoryIds) : prefs.mutedCheckoutCategoryIds
            return Array.isArray(arr) ? arr : []
          } catch {
            return []
          }
        })()
      : []
    return NextResponse.json({
      preferences: { ...prefs, mutedCheckoutCategoryIds },
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
    const { schoolDudeCalendarId, schoolDudeDaysInAdvance, mutedCheckoutCategoryIds } = body

    const preferences = await withRetry(
      () => prisma.userPreferences.upsert({
        where: { userId: user.id },
        update: {
          schoolDudeCalendarId: schoolDudeCalendarId !== undefined ? schoolDudeCalendarId : undefined,
          schoolDudeDaysInAdvance: schoolDudeDaysInAdvance !== undefined ? schoolDudeDaysInAdvance : undefined,
          mutedCheckoutCategoryIds: mutedCheckoutCategoryIds !== undefined
            ? (Array.isArray(mutedCheckoutCategoryIds) ? JSON.stringify(mutedCheckoutCategoryIds) : mutedCheckoutCategoryIds)
            : undefined,
          updatedAt: new Date(),
        },
        create: {
          userId: user.id,
          schoolDudeCalendarId: schoolDudeCalendarId || 'primary',
          schoolDudeDaysInAdvance: schoolDudeDaysInAdvance || 365,
          mutedCheckoutCategoryIds: Array.isArray(mutedCheckoutCategoryIds)
            ? JSON.stringify(mutedCheckoutCategoryIds)
            : null,
        },
      })
    )

    return NextResponse.json({ preferences })
  } catch (error: any) {
    console.error('Update user preferences error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update preferences' },
      { status: 500 }
    )
  }
}

