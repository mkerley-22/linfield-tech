'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Calendar, Clock, MapPin, CheckCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { roundToQuarterHour } from '@/lib/time-utils'

export default function SchedulePickupPage() {
  const router = useRouter()
  const params = useParams()
  const requestId = params?.id as string

  const [pickupDate, setPickupDate] = useState('')
  const [pickupTime, setPickupTime] = useState('')
  const [pickupLocation, setPickupLocation] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0]
    setPickupDate(today)
    // Set location to Tech Closet (fixed value)
    setPickupLocation('Tech Closet')
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!pickupDate || !pickupTime || !pickupLocation) {
      setError('Please fill in all fields')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/checkout/request/${requestId}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickupDate,
          pickupTime,
          pickupLocation,
        }),
      })

      if (response.ok) {
        setSuccess(true)
        setTimeout(() => {
          router.push('/checkout')
        }, 2000)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to schedule pickup')
      }
    } catch (error) {
      console.error('Schedule pickup error:', error)
      setError('Failed to schedule pickup. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Pickup Scheduled!</h1>
          <p className="text-gray-600 mb-6">
            Your pickup has been scheduled successfully. You will receive a confirmation email shortly.
          </p>
          <p className="text-sm text-gray-500">Redirecting...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Schedule Pickup</h1>
          <button
            onClick={() => router.push('/checkout')}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-gray-600 mb-6">
          Please select a convenient date, time, and location for picking up your equipment.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              Pickup Date
            </label>
            <input
              type="date"
              value={pickupDate}
              onChange={(e) => setPickupDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              required
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="w-4 h-4 inline mr-2" />
              Pickup Time
            </label>
            <input
              type="time"
              value={pickupTime}
              onChange={(e) => {
                // Round to nearest 15-minute interval
                const rounded = roundToQuarterHour(e.target.value)
                setPickupTime(rounded)
              }}
              onBlur={(e) => {
                // Ensure time is rounded when user leaves the field
                const rounded = roundToQuarterHour(e.target.value)
                if (rounded !== e.target.value) {
                  setPickupTime(rounded)
                }
              }}
              step="900"
              required
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
            />
            <p className="text-xs text-gray-500 mt-1">Times are available in 15-minute intervals (e.g., 8:00, 8:15, 8:30, 8:45)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-2" />
              Pickup Location
            </label>
            <input
              type="text"
              value={pickupLocation}
              readOnly
              className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push('/checkout')}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Scheduling...' : 'Schedule Pickup'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

