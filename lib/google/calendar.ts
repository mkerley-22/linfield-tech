import { google } from 'googleapis'
import { getCalendarClient, getOrRefreshCalendarToken } from './calendar-auth'

export interface CalendarEvent {
  id?: string
  title: string
  description?: string
  startTime: Date
  endTime: Date
  location?: string
  attendees?: string[]
  isAllDay?: boolean
}

export async function listCalendarEvents(
  calendarId: string = 'primary',
  timeMin?: Date,
  timeMax?: Date,
  accessToken?: string
) {
  const calendar = accessToken ? await getCalendarClient(accessToken) : await getCalendarClient()
  
  const response = await calendar.events.list({
    calendarId,
    timeMin: timeMin?.toISOString(),
    timeMax: timeMax?.toISOString(),
    maxResults: 100,
    singleEvents: true,
    orderBy: 'startTime',
  })
  
  return response.data.items || []
}

export async function getCalendarEvent(eventId: string, calendarId: string = 'primary', accessToken?: string) {
  const calendar = accessToken ? await getCalendarClient(accessToken) : await getCalendarClient()
  
  const response = await calendar.events.get({
    calendarId,
    eventId,
  })
  
  return response.data
}

export async function createCalendarEvent(event: CalendarEvent, calendarId: string = 'primary', accessToken?: string) {
  const calendar = accessToken ? await getCalendarClient(accessToken) : await getCalendarClient()
  
  const response = await calendar.events.insert({
    calendarId,
    requestBody: {
      summary: event.title,
      description: event.description,
      start: event.isAllDay
        ? { date: event.startTime.toISOString().split('T')[0] }
        : { dateTime: event.startTime.toISOString() },
      end: event.isAllDay
        ? { date: event.endTime.toISOString().split('T')[0] }
        : { dateTime: event.endTime.toISOString() },
      location: event.location,
      attendees: event.attendees?.map(email => ({ email })),
    },
  })
  
  return response.data
}

export async function listCalendars(accessToken?: string) {
  const calendar = accessToken ? await getCalendarClient(accessToken) : await getCalendarClient()
  
  const response = await calendar.calendarList.list()
  
  return response.data.items || []
}

export function parseRecurrenceRule(rrule?: string): string | null {
  if (!rrule) return null
  
  // Parse RRULE and return simplified description
  // This is a basic implementation
  if (rrule.includes('FREQ=DAILY')) return 'Daily'
  if (rrule.includes('FREQ=WEEKLY')) return 'Weekly'
  if (rrule.includes('FREQ=MONTHLY')) return 'Monthly'
  if (rrule.includes('FREQ=YEARLY')) return 'Yearly'
  
  return 'Recurring'
}

