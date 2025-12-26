import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { listCalendarEvents, listCalendars, parseRecurrenceRule } from '@/lib/google/calendar'
import { getOrRefreshCalendarToken } from '@/lib/google/calendar-auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { calendarId, categoryId, timeMin, timeMax } = body
    
    const accessToken = await getOrRefreshCalendarToken()
    
    // Get events from Google Calendar
    const startDate = timeMin ? new Date(timeMin) : new Date()
    const endDate = timeMax ? new Date(timeMax) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days
    
    const googleEvents = await listCalendarEvents(calendarId || 'primary', startDate, endDate, accessToken)
    
    const importedEvents = []
    
    for (const googleEvent of googleEvents) {
      if (!googleEvent.id || !googleEvent.summary) continue
      
      // Optional: Filter for tech events (you can customize this)
      // For example, filter by title keywords, description, or calendar name
      const isTechEvent = 
        googleEvent.summary.toLowerCase().includes('tech') ||
        googleEvent.summary.toLowerCase().includes('it') ||
        googleEvent.summary.toLowerCase().includes('technology') ||
        googleEvent.description?.toLowerCase().includes('tech') ||
        googleEvent.description?.toLowerCase().includes('it') ||
        calendarId?.toLowerCase().includes('tech') ||
        calendarId?.toLowerCase().includes('school dude')
      
      // Uncomment the line below to only import tech-related events
      // if (!isTechEvent) continue
      
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
            attendees: googleEvent.attendees ? JSON.stringify(googleEvent.attendees.map(a => a.email)) : null,
            recurrenceRule: googleEvent.recurrence ? googleEvent.recurrence[0] : null,
            isRecurring: !!googleEvent.recurrence && googleEvent.recurrence.length > 0,
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
            calendarName: calendarId || 'primary',
            isAllDay: !googleEvent.start?.dateTime,
            attendees: googleEvent.attendees ? JSON.stringify(googleEvent.attendees.map(a => a.email)) : null,
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

