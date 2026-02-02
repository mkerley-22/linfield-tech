'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Calendar, Clock, MapPin, Plus, RefreshCw, Download, Edit, Search, List, LayoutGrid, CalendarDays } from 'lucide-react'
import { Button } from './ui/Button'
import { format, startOfWeek, getDay, startOfMonth, endOfMonth, startOfDay, endOfDay, addDays } from 'date-fns'
import { enUS } from 'date-fns/locale'
import { useIntegration } from '@/hooks/useIntegration'
import EventModal from './EventModal'
import Toggle from './ui/Toggle'
import { Calendar as BigCalendar, dateFnsLocalizer, View } from 'react-big-calendar'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import '@/app/events/events-calendar.css'

const localizer = dateFnsLocalizer({
  format,
  startOfWeek,
  getDay,
  locales: { 'en-US': enUS },
})

interface Event {
  id: string
  title: string
  description?: string
  startTime: string
  endTime: string
  location?: string
  category?: { name: string; color: string }
  page?: { slug: string }
  eventType: string
  isAllDay: boolean
  isRecurring?: boolean
  recurrenceRule?: string
}

type ViewMode = 'list' | 'month' | 'week' | 'day' | 'agenda'

function rangeStartForView(date: Date, view: ViewMode): Date {
  switch (view) {
    case 'month': return startOfMonth(date)
    case 'week': return startOfWeek(date, { weekStartsOn: 0 })
    case 'day': return startOfDay(date)
    case 'agenda': return startOfWeek(date, { weekStartsOn: 0 })
    default: return startOfMonth(date)
  }
}

function rangeEndForView(date: Date, view: ViewMode): Date {
  switch (view) {
    case 'month': return endOfMonth(date)
    case 'week': return addDays(startOfWeek(date, { weekStartsOn: 0 }), 6)
    case 'day': return endOfDay(date)
    case 'agenda': return addDays(startOfWeek(date, { weekStartsOn: 0 }), 13)
    default: return endOfMonth(date)
  }
}

export default function EventsDashboard() {
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isImporting, setIsImporting] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [calendars, setCalendars] = useState<any[]>([])
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showWeekOnly, setShowWeekOnly] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCalendarId, setSelectedCalendarId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [calendarDate, setCalendarDate] = useState(() => new Date())
  const [calendarViewEvents, setCalendarViewEvents] = useState<Event[]>([])
  const [calendarLoading, setCalendarLoading] = useState(false)
  const { enabled: calendarEnabled, isLoading: integrationLoading } = useIntegration('calendar')

  useEffect(() => {
    fetch('/api/user/preferences')
      .then((r) => (r.ok ? r.json() : {}))
      .then((data: { preferences?: { schoolDudeCalendarId?: string } }) => {
        const id = data.preferences?.schoolDudeCalendarId
        if (id) setSelectedCalendarId(id)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    loadEvents()
    if (calendarEnabled) {
      loadCalendars()
    }
  }, [calendarEnabled, selectedCalendarId])

  const loadEvents = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({ upcoming: 'true', limit: '100' })
      if (selectedCalendarId) params.set('calendarId', selectedCalendarId)
      const response = await fetch(`/api/events?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setEvents(data.events || [])
      }
    } catch (error) {
      console.error('Failed to load events:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const expandRecurringEvent = (event: Event, maxDate: Date, minDate?: Date): Event[] => {
    if (!event.isRecurring || !event.recurrenceRule) {
      return [event]
    }

    const instances: Event[] = []
    const baseStart = new Date(event.startTime)
    const baseEnd = new Date(event.endTime)
    const duration = baseEnd.getTime() - baseStart.getTime()
    
    // Parse recurrence rule (RRULE format: FREQ=WEEKLY;INTERVAL=1;BYDAY=FR)
    const rule = event.recurrenceRule.toUpperCase()
    const freqMatch = rule.match(/FREQ=(\w+)/)
    const intervalMatch = rule.match(/INTERVAL=(\d+)/)
    const bydayMatch = rule.match(/BYDAY=([\w,]+)/)
    const countMatch = rule.match(/COUNT=(\d+)/)
    const untilMatch = rule.match(/UNTIL=([\dTZ]+)/)
    
    if (!freqMatch) return [event] // Can't parse, return original
    
    const freq = freqMatch[1]
    const interval = intervalMatch ? parseInt(intervalMatch[1]) : 1
    const days = bydayMatch ? bydayMatch[1].split(',') : null
    const count = countMatch ? parseInt(countMatch[1]) : null
    const until = untilMatch ? new Date(untilMatch[1].replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/, '$1-$2-$3T$4:$5:$6Z')) : null
    
    const dayMap: { [key: string]: number } = {
      'SU': 0, 'MO': 1, 'TU': 2, 'WE': 3, 'TH': 4, 'FR': 5, 'SA': 6
    }
    
    let currentDate = new Date(baseStart)
    let instanceCount = 0
    const maxInstances = 200 // Limit to prevent infinite loops
    const floor = minDate ?? new Date()
    
    // For weekly with specific days, iterate day by day
    if (freq === 'WEEKLY' && days) {
      const targetDays = days.map(d => dayMap[d] ?? -1).filter(d => d !== -1)
      
      while (currentDate <= maxDate && instanceCount < maxInstances) {
        if (count && instanceCount >= count) break
        if (until && currentDate > until) break
        
        const currentDay = currentDate.getDay()
        
        if (targetDays.includes(currentDay) && currentDate >= floor) {
          const instanceStart = new Date(currentDate)
          instanceStart.setHours(baseStart.getHours(), baseStart.getMinutes(), baseStart.getSeconds())
          const instanceEnd = new Date(instanceStart.getTime() + duration)
          
          instances.push({
            ...event,
            id: `${event.id}_${instanceCount}`,
            startTime: instanceStart.toISOString(),
            endTime: instanceEnd.toISOString(),
          })
          instanceCount++
        }
        
        // Move to next day
        currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000)
      }
    } else {
      // For other frequencies, use simpler logic
      while (currentDate <= maxDate && instanceCount < maxInstances) {
        if (count && instanceCount >= count) break
        if (until && currentDate > until) break
        
        if (currentDate >= floor) {
          const instanceStart = new Date(currentDate)
          instanceStart.setHours(baseStart.getHours(), baseStart.getMinutes(), baseStart.getSeconds())
          const instanceEnd = new Date(instanceStart.getTime() + duration)
          
          instances.push({
            ...event,
            id: `${event.id}_${instanceCount}`,
            startTime: instanceStart.toISOString(),
            endTime: instanceEnd.toISOString(),
          })
          instanceCount++
        }
        
        // Advance date based on frequency
        if (freq === 'DAILY') {
          currentDate = new Date(currentDate.getTime() + interval * 24 * 60 * 60 * 1000)
        } else if (freq === 'WEEKLY') {
          currentDate = new Date(currentDate.getTime() + interval * 7 * 24 * 60 * 60 * 1000)
        } else if (freq === 'MONTHLY') {
          currentDate = new Date(currentDate)
          currentDate.setMonth(currentDate.getMonth() + interval)
        } else if (freq === 'YEARLY') {
          currentDate = new Date(currentDate)
          currentDate.setFullYear(currentDate.getFullYear() + interval)
        } else {
          break
        }
      }
    }
    
    return instances.length > 0 ? instances : [event]
  }

  const getFilteredEvents = () => {
    let filtered = events
    
    // Expand recurring events into individual instances
    const expandedEvents: Event[] = []
    const now = new Date()
    const maxFutureDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000) // 1 year ahead
    
    for (const event of filtered) {
      if (event.isRecurring && event.recurrenceRule) {
        const instances = expandRecurringEvent(event, maxFutureDate)
        expandedEvents.push(...instances)
      } else {
        expandedEvents.push(event)
      }
    }
    
    filtered = expandedEvents
    
    // Apply week filter
    if (showWeekOnly) {
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      
      filtered = filtered.filter(event => {
        const eventStart = new Date(event.startTime)
        const eventEnd = new Date(event.endTime)
        return eventEnd >= now && eventStart <= weekFromNow
      })
    } else {
      // Only show current or future events (hide events that have already ended)
      filtered = filtered.filter(event => {
        const eventEnd = new Date(event.endTime)
        return eventEnd >= now
      })
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(event => {
        const titleMatch = event.title.toLowerCase().includes(query)
        const descriptionMatch = event.description?.toLowerCase().includes(query) || false
        const locationMatch = event.location?.toLowerCase().includes(query) || false
        const categoryMatch = event.category?.name.toLowerCase().includes(query) || false
        
        return titleMatch || descriptionMatch || locationMatch || categoryMatch
      })
    }
    
    // Sort by start time
    filtered.sort((a, b) => {
      return new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    })
    
    return filtered
  }

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event)
    setIsModalOpen(true)
  }

  const calendarRangeStart = rangeStartForView(calendarDate, viewMode)
  const calendarRangeEnd = rangeEndForView(calendarDate, viewMode)
  const calendarEventsExpanded: Event[] = []
  for (const event of calendarViewEvents) {
    if (event.isRecurring && event.recurrenceRule) {
      const instances = expandRecurringEvent(event, calendarRangeEnd, calendarRangeStart)
      calendarEventsExpanded.push(...instances)
    } else {
      calendarEventsExpanded.push(event)
    }
  }
  const bigCalendarEvents = calendarEventsExpanded
    .filter((e) => {
      const start = new Date(e.startTime)
      const end = new Date(e.endTime)
      return end >= calendarRangeStart && start <= calendarRangeEnd
    })
    .map((e) => ({
      id: e.id,
      title: e.title,
      start: new Date(e.startTime),
      end: new Date(e.endTime),
      allDay: e.isAllDay,
      resource: e,
    }))

  const handleCalendarSelectEvent = (event: { resource?: unknown }) => {
    const e = event?.resource as Event | undefined
    if (e) {
      setSelectedEvent(e)
      setIsModalOpen(true)
    }
  }

  const handleCalendarRangeChange = (range: Date[] | { start: Date; end: Date }) => {
    const start = Array.isArray(range) ? range[0] : range.start
    if (start) setCalendarDate(start)
  }

  const loadCalendars = async () => {
    try {
      const response = await fetch('/api/events/import')
      if (response.ok) {
        const data = await response.json()
        setCalendars(data.calendars || [])
      }
    } catch (error) {
      console.error('Failed to load calendars:', error)
    }
  }

  const loadCalendarEvents = useCallback(async (rangeStart: Date, rangeEnd: Date) => {
    setCalendarLoading(true)
    try {
      const params = new URLSearchParams({
        timeMin: rangeStart.toISOString(),
        timeMax: rangeEnd.toISOString(),
        limit: '300',
      })
      if (selectedCalendarId) params.set('calendarId', selectedCalendarId)
      const response = await fetch(`/api/events?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setCalendarViewEvents(data.events || [])
      }
    } catch (error) {
      console.error('Failed to load calendar events:', error)
    } finally {
      setCalendarLoading(false)
    }
  }, [selectedCalendarId])

  useEffect(() => {
    if (viewMode !== 'list') {
      const start = startOfDay(rangeStartForView(calendarDate, viewMode))
      const end = endOfDay(rangeEndForView(calendarDate, viewMode))
      loadCalendarEvents(start, end)
    }
  }, [viewMode, calendarDate, loadCalendarEvents])

  const handleImportEvents = async (calendarIdOverride?: string) => {
    const calId = calendarIdOverride ?? selectedCalendarId ?? 'primary'
    setIsImporting(true)
    try {
      const response = await fetch('/api/events/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calendarId: calId,
          timeMin: new Date().toISOString(),
          timeMax: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        const msg = typeof data?.error === 'string' ? data.error : 'Failed to import events'
        throw new Error(msg)
      }

      await loadEvents()
      if (viewMode !== 'list') {
        const start = rangeStartForView(calendarDate, viewMode)
        const end = rangeEndForView(calendarDate, viewMode)
        loadCalendarEvents(startOfDay(start), endOfDay(end))
      }
      alert(`Imported ${data.imported ?? 0} events from Google Calendar`)
    } catch (error) {
      console.error('Failed to import events:', error)
      const msg = error instanceof Error ? error.message : 'Failed to import events. Please make sure Google is connected.'
      alert(msg)
    } finally {
      setIsImporting(false)
    }
  }

  const handleSyncEvents = async () => {
    setIsSyncing(true)
    try {
      const response = await fetch('/api/events/sync', {
        method: 'POST',
      })

      if (!response.ok) throw new Error('Failed to sync events')

      const data = await response.json()
      await loadEvents()
      alert(`Synced ${data.totalSynced} events from all calendars`)
    } catch (error) {
      console.error('Failed to sync events:', error)
      alert('Failed to sync events. Please make sure Google is connected.')
    } finally {
      setIsSyncing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading events...</p>
        </div>
      </div>
    )
  }

  if (integrationLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  // Show events even if calendar integration isn't enabled
  // Only require integration for importing NEW events from Google Calendar
  const showIntegrationWarning = !calendarEnabled && events.length === 0

  const filteredEvents = getFilteredEvents()

  return (
    <div className="space-y-6">
      {showIntegrationWarning && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Google Calendar Integration Required</h2>
          <p className="text-gray-700 mb-4">
            Enable Google Calendar Integration in Settings to import events from Google Calendar and manage tech events.
          </p>
          <Link href="/settings#integrations">
            <Button variant="primary">
              Go to Settings
            </Button>
          </Link>
        </div>
      )}
      
      <EventModal
        event={selectedEvent}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedEvent(null)
        }}
      />
      
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl lg:text-2xl font-semibold text-gray-900">Upcoming Events</h2>
            </div>
        <div className="flex items-center gap-2 flex-wrap">
          {calendars.length > 0 && (
            <>
              <button
                onClick={handleSyncEvents}
                disabled={isSyncing}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Sync all events"
              >
                {isSyncing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span className="hidden sm:inline">Syncing...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Sync</span>
                  </>
                )}
              </button>
              <button
                onClick={() => handleImportEvents()}
                disabled={isImporting}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Import from Google Calendar"
              >
                {isImporting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span className="hidden sm:inline">Importing...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Import</span>
                  </>
                )}
              </button>
            </>
          )}
          <Link href="/events/new">
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors">
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New</span>
            </button>
          </Link>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search events by title, description, location, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
          />
        </div>
      </div>

      {/* View Toggle: List | Month | Week | Day | Agenda */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex rounded-xl bg-gray-100 p-1 shadow-inner">
          {(['list', 'month', 'week', 'day', 'agenda'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                viewMode === mode
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {mode === 'list' && <List className="w-4 h-4" />}
              {mode === 'month' && <LayoutGrid className="w-4 h-4" />}
              {mode === 'week' && <CalendarDays className="w-4 h-4" />}
              {mode === 'day' && <Calendar className="w-4 h-4" />}
              {mode === 'agenda' && <CalendarDays className="w-4 h-4" />}
              <span className="capitalize">{mode}</span>
            </button>
          ))}
        </div>
        {viewMode === 'list' && (
          <div className="flex items-center gap-4">
            <Toggle
              enabled={showWeekOnly}
              onChange={setShowWeekOnly}
              label="Upcoming Week"
            />
            <span className="text-sm text-gray-600">
              {searchQuery.trim() 
                ? `${filteredEvents.length} event${filteredEvents.length !== 1 ? 's' : ''} found`
                : showWeekOnly 
                  ? `${filteredEvents.length} event${filteredEvents.length !== 1 ? 's' : ''} in next 7 days`
                  : `${filteredEvents.length} upcoming event${filteredEvents.length !== 1 ? 's' : ''}`
              }
            </span>
          </div>
        )}
      </div>

      {/* Calendar view */}
      {viewMode !== 'list' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden relative">
          {calendarLoading && (
            <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center rounded-2xl">
              <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          )}
          <div className="min-h-[600px] p-4 sm:p-6 [&_.rbc-calendar]:font-sans [&_.rbc-header]:border-b [&_.rbc-header]:border-gray-200 [&_.rbc-header]:py-3 [&_.rbc-today]:bg-blue-50/50 [&_.rbc-off-range-bg]:bg-gray-50/50 [&_.rbc-event]:rounded-lg [&_.rbc-event]:border-0 [&_.rbc-event]:py-1 [&_.rbc-event]:px-2 [&_.rbc-toolbar]:gap-2 [&_.rbc-toolbar]:flex-wrap [&_.rbc-toolbar button]:rounded-lg [&_.rbc-toolbar button]:px-4 [&_.rbc-toolbar button]:py-2 [&_.rbc-toolbar button]:font-medium [&_.rbc-toolbar .rbc-active]:bg-blue-600 [&_.rbc-toolbar .rbc-active]:text-white">
            <BigCalendar
              localizer={localizer}
              events={bigCalendarEvents}
              view={viewMode as View}
              date={calendarDate}
              onNavigate={(date) => setCalendarDate(date)}
              onView={(view) => setViewMode(view as ViewMode)}
              onSelectEvent={handleCalendarSelectEvent}
              onRangeChange={handleCalendarRangeChange}
              startAccessor="start"
              endAccessor="end"
              style={{ minHeight: 560 }}
              eventPropGetter={(event) => {
                const e = (event as { resource?: Event }).resource
                const color = e?.category?.color ?? '#2563eb'
                return {
                  style: {
                    backgroundColor: color,
                    color: '#fff',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '0.8125rem',
                  },
                }
              }}
              messages={{
                today: 'Today',
                previous: 'Back',
                next: 'Next',
                month: 'Month',
                week: 'Week',
                day: 'Day',
                agenda: 'Agenda',
                date: 'Date',
                time: 'Time',
                event: 'Event',
                noEventsInRange: 'No events in this range.',
              }}
            />
          </div>
        </div>
      )}

      {viewMode === 'list' && (
        filteredEvents.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchQuery.trim() ? 'No events found' : 'No upcoming events'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchQuery.trim() 
                ? 'Try adjusting your search query'
                : 'Import events from Google Calendar or create a new event'
              }
            </p>
            {calendars.length > 0 && (
              <Button
                onClick={() => handleImportEvents()}
                disabled={isImporting}
                variant="primary"
              >
                <Download className="w-4 h-4 mr-2" />
                Import from Google Calendar
              </Button>
            )}
          </div>
        ) : (
        <div className="space-y-3">
          {filteredEvents.map((event) => (
            <div
              key={event.id}
              className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleEventClick(event)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900">{event.title}</h3>
                    {event.category && (
                      <span
                        className="px-2 py-0.5 text-xs rounded-full font-medium"
                        style={{
                          backgroundColor: `${event.category.color}20`,
                          color: event.category.color,
                        }}
                      >
                        {event.category.name}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>
                        {event.isAllDay
                          ? format(new Date(event.startTime), 'MMM d, yyyy')
                          : format(new Date(event.startTime), 'MMM d, yyyy h:mm a')}
                      </span>
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{event.location}</span>
                      </div>
                    )}
                  </div>
                  
                  {event.description && (
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                      {event.description}
                    </p>
                  )}
                </div>
                
                <div className="flex gap-2 ml-4" onClick={(e) => e.stopPropagation()}>
                  <Link href={`/events/${event.id}/edit`}>
                    <Button variant="secondary" size="sm">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  </Link>
                  {event.page && (
                    <Link href={`/pages/${event.page.slug}`}>
                      <Button variant="secondary" size="sm">
                        View Page
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        )
      )}
    </div>
  )
}

