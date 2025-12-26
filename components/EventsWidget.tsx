'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Calendar, Clock, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import EventModal from './EventModal'

export default function EventsWidget() {
  const [events, setEvents] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    loadEvents()
  }, [])

  const loadEvents = async () => {
    try {
      const response = await fetch('/api/events?upcoming=true&limit=3')
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

  const handleEventClick = (event: any) => {
    setSelectedEvent(event)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedEvent(null)
  }

  if (isLoading || events.length === 0) {
    return null
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Upcoming Events</h2>
        </div>
        <Link
          href="/events"
          className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
        >
          View All
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="space-y-3">
        {events.slice(0, 3).map((event) => (
          <button
            key={event.id}
            onClick={() => handleEventClick(event)}
            className="w-full text-left block bg-white rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-sm mb-1">{event.title}</h3>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Clock className="w-3 h-3" />
                  <span>
                    {event.isAllDay
                      ? format(new Date(event.startTime), 'MMM d, yyyy')
                      : format(new Date(event.startTime), 'MMM d, h:mm a')}
                  </span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
      {selectedEvent && (
        <EventModal
          event={selectedEvent}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </div>
  )
}

