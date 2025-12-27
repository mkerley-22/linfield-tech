'use client'

import { useState, useEffect } from 'react'
import { Calendar, RefreshCw, CheckCircle, AlertCircle, ExternalLink, Info } from 'lucide-react'
import { Button } from './ui/Button'
import { useIntegration } from '@/hooks/useIntegration'

export default function SchoolDudeIntegration() {
  const { enabled: calendarEnabled } = useIntegration('calendar')
  const [isSyncing, setIsSyncing] = useState(false)
  const [isLoadingCalendars, setIsLoadingCalendars] = useState(false)
  const [calendars, setCalendars] = useState<Array<{ id: string; summary: string }>>([])
  const [selectedCalendar, setSelectedCalendar] = useState<string>('primary')
  const [lastSync, setLastSync] = useState<Date | null>(null)
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [syncMessage, setSyncMessage] = useState('')
  const [daysInAdvance, setDaysInAdvance] = useState<number>(365) // Default to 1 year

  // Load saved preferences from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCalendar = localStorage.getItem('schoolDude_selectedCalendar')
      if (savedCalendar) {
        setSelectedCalendar(savedCalendar)
      }
      
      const savedDays = localStorage.getItem('schoolDude_daysInAdvance')
      if (savedDays) {
        const days = parseInt(savedDays, 10)
        if (!isNaN(days) && days >= 1 && days <= 730) {
          setDaysInAdvance(days)
        }
      }
    }
  }, [])

  const loadCalendars = async () => {
    if (!calendarEnabled) return
    
    setIsLoadingCalendars(true)
    try {
      const response = await fetch('/api/events/import')
      if (response.ok) {
        const data = await response.json()
        setCalendars(data.calendars || [])
      }
    } catch (error) {
      console.error('Failed to load calendars:', error)
    } finally {
      setIsLoadingCalendars(false)
    }
  }

  // Load calendars when component mounts and Calendar is enabled
  useEffect(() => {
    if (calendarEnabled) {
      loadCalendars()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calendarEnabled])

  const handleSync = async () => {
    if (!calendarEnabled) {
      setSyncStatus('error')
      setSyncMessage('Please enable Google Calendar Integration first')
      return
    }

    setIsSyncing(true)
    setSyncStatus('idle')
    setSyncMessage('')

    try {
      // Calculate date range based on days in advance
      const timeMin = new Date().toISOString()
      const timeMax = new Date(Date.now() + daysInAdvance * 24 * 60 * 60 * 1000).toISOString()

      // Import events from Google Calendar (which School Dude syncs to)
      const response = await fetch('/api/events/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calendarId: selectedCalendar,
          timeMin,
          timeMax,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSyncStatus('success')
        setSyncMessage(`Successfully synced ${data.imported || 0} events from School Dude`)
        setLastSync(new Date())
      } else {
        setSyncStatus('error')
        setSyncMessage(data.error || 'Failed to sync events')
      }
    } catch (error: any) {
      setSyncStatus('error')
      setSyncMessage(error.message || 'Failed to sync events')
    } finally {
      setIsSyncing(false)
    }
  }

  if (!calendarEnabled) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-yellow-900 font-medium mb-1">
              Google Calendar Integration Required
            </p>
            <p className="text-xs text-yellow-800 mb-3">
              Enable Google Calendar Integration to sync events from School Dude. School Dude syncs events to Google Calendar, which we can then import.
            </p>
            <a href="/settings">
              <Button variant="primary" size="sm">
                Go to Settings
              </Button>
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium text-gray-900 mb-1">School Dude Calendar Sync</h3>
          <p className="text-sm text-gray-600">
            Import tech events from School Dude via Google Calendar
          </p>
        </div>
        <Calendar className="w-5 h-5 text-blue-600" />
      </div>

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-blue-900 font-medium mb-2">How It Works</p>
            <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
              <li>School Dude syncs events to your Google Calendar</li>
              <li>Click &quot;Sync Events&quot; to import those events into the knowledge base</li>
              <li>Events are automatically filtered and organized</li>
              <li>You can create knowledge base pages from any event</li>
            </ol>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {calendars.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Calendar
            </label>
            <select
              value={selectedCalendar}
              onChange={(e) => {
                setSelectedCalendar(e.target.value)
                // Save to localStorage
                if (typeof window !== 'undefined') {
                  localStorage.setItem('schoolDude_selectedCalendar', e.target.value)
                }
              }}
              className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
              disabled={isLoadingCalendars}
            >
              <option value="primary">Primary Calendar</option>
              {calendars.map((cal) => (
                <option key={cal.id} value={cal.id}>
                  {cal.summary}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Choose the calendar where School Dude syncs events
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Load Events (Days in Advance)
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min="1"
              max="730"
              value={daysInAdvance}
              onChange={(e) => {
                const days = Math.max(1, Math.min(730, parseInt(e.target.value) || 365))
                setDaysInAdvance(days)
                // Save to localStorage
                if (typeof window !== 'undefined') {
                  localStorage.setItem('schoolDude_daysInAdvance', days.toString())
                }
              }}
              className="w-24 px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
            />
            <span className="text-sm text-gray-600">days</span>
            <div className="flex-1 text-xs text-gray-500">
              {daysInAdvance === 365 && '(1 year)'}
              {daysInAdvance === 180 && '(6 months)'}
              {daysInAdvance === 90 && '(3 months)'}
              {daysInAdvance === 30 && '(1 month)'}
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Events from today through {new Date(Date.now() + daysInAdvance * 24 * 60 * 60 * 1000).toLocaleDateString()} will be imported
          </p>
        </div>

        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm font-medium text-gray-900">Sync Status</p>
            {lastSync ? (
              <p className="text-xs text-gray-500">
                Last synced: {lastSync.toLocaleString()}
              </p>
            ) : (
              <p className="text-xs text-gray-500">Not synced yet</p>
            )}
          </div>
          {syncStatus === 'success' && (
            <CheckCircle className="w-5 h-5 text-green-600" />
          )}
          {syncStatus === 'error' && (
            <AlertCircle className="w-5 h-5 text-red-600" />
          )}
        </div>

        {syncMessage && (
          <div
            className={`p-3 rounded-lg text-sm ${
              syncStatus === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : syncStatus === 'error'
                ? 'bg-red-50 text-red-800 border border-red-200'
                : ''
            }`}
          >
            {syncMessage}
          </div>
        )}

        <Button
          onClick={handleSync}
          disabled={isSyncing}
          variant="primary"
          className="w-full"
        >
          {isSyncing ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Syncing Events...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Sync Events from School Dude
            </>
          )}
        </Button>
      </div>

      <div className="pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          <strong>Setup:</strong> Make sure School Dude is configured to sync to your Google Calendar. 
          See{' '}
          <a
            href="https://help.brightlysoftware.com/Content/Documentation/Facility%20Usage/FSDirect/Advanced%20Setup%20and%20Features/Google%20Calendar%20Integration.htm"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-700 underline"
          >
            School Dude documentation
          </a>
          {' '}for setup instructions.
        </p>
      </div>
    </div>
  )
}

