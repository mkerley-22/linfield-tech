import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { listCalendarEvents, listCalendars, parseRecurrenceRule } from '@/lib/google/calendar'
import { getOrRefreshCalendarToken } from '@/lib/google/calendar-auth'
import { getUser, isAdmin } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // Only admins can import events
    const user = await getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const admin = await isAdmin()
    if (!admin) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }
    
    let body: { calendarId?: string; categoryId?: string; timeMin?: string; timeMax?: string } = {}
    try {
      body = await request.json()
    } catch {
      // Empty or invalid JSON body is ok; we'll use defaults
    }
    const { calendarId, categoryId, timeMin, timeMax } = body
    
    const accessToken = await getOrRefreshCalendarToken()
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Google Calendar not connected. Connect in Settings.' },
        { status: 401 }
      )
    }
    
    // Get events from Google Calendar
    const startDate = timeMin ? new Date(timeMin) : new Date()
    const endDate = timeMax ? new Date(timeMax) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days
    const calId = calendarId || 'primary'
    
    let googleEvents: Awaited<ReturnType<typeof listCalendarEvents>>
    try {
      googleEvents = await listCalendarEvents(calId, startDate, endDate, accessToken)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch calendar'
      console.error('Import listCalendarEvents error:', err)
      return NextResponse.json(
        { error: msg.includes('404') ? 'Calendar not found. Check the calendar ID.' : msg },
        { status: 400 }
      )
    }
    
    if (!Array.isArray(googleEvents)) {
      googleEvents = []
    }
    
    const importedEvents = []
    const isExplicitCalendar = calId && calId !== 'primary'
    
    for (const googleEvent of googleEvents) {
      if (!googleEvent.id || !googleEvent.summary) continue
      
      // When user selected a specific calendar (e.g. LCS Sound needs), import all events from it.
      // When using 'primary', only import tech-related events to avoid personal clutter.
      if (!isExplicitCalendar) {
        const isTechEvent =
          googleEvent.summary.toLowerCase().includes('tech') ||
          googleEvent.summary.toLowerCase().includes('it') ||
          googleEvent.summary.toLowerCase().includes('technology') ||
          (googleEvent.description && (googleEvent.description.toLowerCase().includes('tech') || googleEvent.description.toLowerCase().includes('it')))
        if (!isTechEvent) continue
      }
      
      // Check if already imported
      const existing = await prisma.event.findFirst({
        where: { calendarId: googleEvent.id },
      })
      
      if (existing) {
        // Update existing event
        const start = googleEvent.start?.dateTime || googleEvent.start?.date
        const end = googleEvent.end?.dateTime || googleEvent.end?.date
        
        if (!start || !end) continue
        
        const updated = await prisma.event.update({
          where: { id: existing.id },
          data: {
            title: googleEvent.summary,
            description: googleEvent.description || null,
            startTime: new Date(start),
            endTime: new Date(end),
            location: googleEvent.location || null,
            categoryId: categoryId || existing.categoryId,
            isAllDay: !googleEvent.start?.dateTime,
            attendees: googleEvent.attendees ? JSON.stringify(googleEvent.attendees.map((a) => a?.email ?? undefined).filter(Boolean)) : null,
            recurrenceRule: googleEvent.recurrence ? googleEvent.recurrence[0] : null,
            isRecurring: !!googleEvent.recurrence && googleEvent.recurrence.length > 0,
            sourceCalendarId: calId,
            updatedAt: new Date(),
          },
        })
        importedEvents.push(updated)
      } else {
        // Create new event
        const start = googleEvent.start?.dateTime || googleEvent.start?.date
        const end = googleEvent.end?.dateTime || googleEvent.end?.date
        
        if (!start || !end) continue
        
        const event = await prisma.event.create({
          data: {
            id: crypto.randomUUID(),
            title: googleEvent.summary,
            description: googleEvent.description || null,
            startTime: new Date(start),
            endTime: new Date(end),
            location: googleEvent.location || null,
            categoryId: categoryId || null,
            eventType: 'meeting',
            calendarId: googleEvent.id,
            calendarName: calId,
            sourceCalendarId: calId,
            isAllDay: !googleEvent.start?.dateTime,
            attendees: googleEvent.attendees ? JSON.stringify(googleEvent.attendees.map((a) => a?.email ?? undefined).filter(Boolean)) : null,
            recurrenceRule: googleEvent.recurrence ? googleEvent.recurrence[0] : null,
            isRecurring: !!googleEvent.recurrence && googleEvent.recurrence.length > 0,
            updatedAt: new Date(),
          },
        })
        importedEvents.push(event)
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      imported: importedEvents.length,
      events: importedEvents 
    })
  } catch (error: any) {
    console.error('Import events error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to import events' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Only admins can list calendars
    const user = await getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const admin = await isAdmin()
    if (!admin) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }
    
    const accessToken = await getOrRefreshCalendarToken()
    const calendars = await listCalendars(accessToken)
    
    return NextResponse.json({ calendars })
  } catch (error: any) {
    console.error('List calendars error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to list calendars' },
      { status: 500 }
    )
  }
}

