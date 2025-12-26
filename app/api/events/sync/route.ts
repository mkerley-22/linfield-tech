import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { listCalendarEvents, listCalendars } from '@/lib/google/calendar'
import { getOrRefreshCalendarToken } from '@/lib/google/calendar-auth'

/**
 * Sync events from Google Calendar
 * This endpoint can be called by a cron job to automatically sync events every 12 hours
 * 
 * To set up automatic syncing:
 * 1. Deploy to Vercel and use Vercel Cron Jobs
 * 2. Or use an external cron service (like cron-job.org) to call this endpoint
 * 3. Or set up a server-side cron job
 * 
 * Example Vercel cron.json:
 * {
 *   "crons": [{
 *     "path": "/api/events/sync",
 *     "schedule": "0 *\/12 * * *"
 *   }]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Optional: Add authentication/authorization check here
    // For example, check for an API key or secret token
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.SYNC_API_TOKEN
    
    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const accessToken = await getOrRefreshCalendarToken()
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Google Calendar not connected' },
        { status: 401 }
      )
    }

    const calendars = await listCalendars(accessToken)
    if (calendars.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No calendars found',
        synced: 0,
      })
    }

    const startDate = new Date()
    const endDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days ahead
    
    let totalSynced = 0
    const results = []

    for (const calendar of calendars) {
      try {
        const googleEvents = await listCalendarEvents(
          calendar.id || 'primary',
          startDate,
          endDate,
          accessToken
        )

        let synced = 0
        let updated = 0
        let created = 0

        for (const googleEvent of googleEvents) {
          if (!googleEvent.id || !googleEvent.summary) continue

          const start = googleEvent.start?.dateTime || googleEvent.start?.date
          const end = googleEvent.end?.dateTime || googleEvent.end?.date

          if (!start || !end) continue

          const existing = await prisma.event.findFirst({
            where: { calendarId: googleEvent.id },
          })

          const eventData = {
            title: googleEvent.summary,
            description: googleEvent.description || null,
            startTime: new Date(start),
            endTime: new Date(end),
            location: googleEvent.location || null,
            isAllDay: !googleEvent.start?.dateTime,
            attendees: googleEvent.attendees
              ? JSON.stringify(googleEvent.attendees.map((a: any) => a.email))
              : null,
            recurrenceRule: googleEvent.recurrence ? googleEvent.recurrence[0] : null,
            isRecurring: !!googleEvent.recurrence && googleEvent.recurrence.length > 0,
            calendarId: googleEvent.id,
            calendarName: calendar.summary || calendar.id,
          }

          if (existing) {
            // Update existing event
            await prisma.event.update({
              where: { id: existing.id },
              data: {
                ...eventData,
                updatedAt: new Date(),
              },
            })
            updated++
          } else {
            // Create new event
            await prisma.event.create({
              data: {
                id: crypto.randomUUID(),
                ...eventData,
                eventType: 'meeting',
                updatedAt: new Date(),
              },
            })
            created++
          }
          synced++
        }

        totalSynced += synced
        results.push({
          calendar: calendar.summary || calendar.id,
          synced,
          created,
          updated,
        })
      } catch (error: any) {
        console.error(`Error syncing calendar ${calendar.id}:`, error)
        results.push({
          calendar: calendar.summary || calendar.id,
          error: error.message,
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${totalSynced} events`,
      totalSynced,
      results,
      syncedAt: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Sync events error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to sync events' },
      { status: 500 }
    )
  }
}

// Also allow GET for easy testing
export async function GET(request: NextRequest) {
  return POST(request)
}

