'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import EventEditor from '@/components/EventEditor'
import { Loader2 } from 'lucide-react'

export default function EditEventPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.id as string
  const [eventData, setEventData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadEvent()
  }, [eventId])

  const loadEvent = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}`)
      if (!response.ok) {
        throw new Error('Failed to load event')
      }
      const data = await response.json()
      setEventData(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load event')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-8">
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="w-8 h-8 text-gray-400 mx-auto mb-4 animate-spin" />
                <p className="text-gray-600">Loading event...</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (error || !eventData) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-red-900 mb-2">Error</h2>
              <p className="text-red-700">{error || 'Event not found'}</p>
              <button
                onClick={() => router.push('/events')}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Back to Events
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Edit Event</h1>
            <p className="text-gray-600 mt-1">Update event details</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <EventEditor eventId={eventId} initialData={eventData} />
          </div>
        </div>
      </main>
    </div>
  )
}

