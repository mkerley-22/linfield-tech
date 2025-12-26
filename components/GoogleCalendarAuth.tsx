'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle, XCircle, Loader2, ExternalLink, Settings, Calendar } from 'lucide-react'
import { Button } from './ui/Button'
import GoogleSetupWizard from './GoogleSetupWizard'

export default function GoogleCalendarAuth() {
  const searchParams = useSearchParams()
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isConnecting, setIsConnecting] = useState(false)
  const [showSetupWizard, setShowSetupWizard] = useState(false)
  const [configError, setConfigError] = useState<string | null>(null)

  useEffect(() => {
    // Check for OAuth callback results first
    const success = searchParams?.get('success')
    const error = searchParams?.get('error')
    
    if (success === 'calendar_connected' || success === 'connected') {
      // Wait a moment for the database to update, then check connection
      setTimeout(() => {
        checkConnection()
      }, 500)
    } else if (error) {
      console.error('OAuth error:', error)
      setIsLoading(false)
    } else {
      checkConnection()
    }
  }, [searchParams])

  const checkConnection = async () => {
    try {
      // Check if Google Calendar is connected by trying to list calendars
      const response = await fetch('/api/events/import')
      if (response.ok) {
        setIsConnected(true)
      } else {
        const data = await response.json().catch(() => ({}))
        // Check if it's a scope/permission error vs not connected
        if (data.error?.includes('not connected') || data.error?.includes('not found')) {
          setIsConnected(false)
        } else if (data.error?.includes('scope') || data.error?.includes('permission')) {
          // Token exists but doesn't have calendar scopes
          setIsConnected(false)
        } else {
          // Other error - still not connected
          setIsConnected(false)
        }
      }
    } catch (error) {
      setIsConnected(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleConnect = async () => {
    setIsConnecting(true)
    setConfigError(null)
    setShowSetupWizard(false)
    
    try {
      const response = await fetch('/api/auth/google/calendar')
      const data = await response.json()
      
      if (data.error) {
        // Only show setup wizard if it's a configuration error
        if (data.error.includes('not configured') || data.error.includes('GOOGLE_CLIENT')) {
          setConfigError(data.message || data.error)
          setShowSetupWizard(true)
        } else {
          alert(data.message || data.error)
        }
        setIsConnecting(false)
        return
      }
      
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('No OAuth URL received')
      }
    } catch (error: any) {
      console.error('Failed to initiate OAuth:', error)
      // Don't show setup wizard for network errors
      if (error.message?.includes('fetch')) {
        alert('Failed to connect. Please check your internet connection and try again.')
      } else {
        alert('Failed to connect Google Calendar. Please check your configuration and try again.')
      }
      setIsConnecting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-gray-600">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Checking connection...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium text-gray-900 mb-1">Google Calendar</h3>
          <p className="text-sm text-gray-600">
            Connect to Google Calendar to sync events and import from School Dude
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isConnected ? (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-medium">Connected</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-gray-400">
              <XCircle className="w-5 h-5" />
              <span className="text-sm">Not Connected</span>
            </div>
          )}
        </div>
      </div>

      {configError && showSetupWizard && (
        <>
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
            <p className="text-sm text-red-800 font-medium mb-1">One-Time Setup Required</p>
            <p className="text-xs text-red-700">
              Once you add credentials below, you&apos;ll be able to sign in with Google directly!
            </p>
            <button
              onClick={() => setShowSetupWizard(false)}
              className="mt-2 text-xs text-red-600 hover:text-red-700 underline"
            >
              Hide setup instructions
            </button>
          </div>
          <GoogleSetupWizard />
        </>
      )}
      
      {configError && !showSetupWizard && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
          <p className="text-sm text-red-800 font-medium mb-1">Configuration Error</p>
          <p className="text-xs text-red-700 mb-2">{configError}</p>
          <button
            onClick={() => setShowSetupWizard(true)}
            className="text-xs text-red-600 hover:text-red-700 underline"
          >
            Show setup instructions
          </button>
        </div>
      )}

      {!isConnected && !configError && (
        <div>
          <Button
            onClick={handleConnect}
            disabled={isConnecting}
            variant="primary"
            className="w-full"
          >
            {isConnecting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Redirecting to Google...
              </>
            ) : (
              <>
                <Calendar className="w-4 h-4 mr-2" />
                Sign in with Google Calendar
              </>
            )}
          </Button>
          <p className="text-xs text-gray-500 mt-2 text-center">
            You&apos;ll be redirected to Google to sign in
          </p>
        </div>
      )}

      {isConnected && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">
            ✓ Connected to Google Calendar. You can now sync events and import from School Dude.
          </p>
        </div>
      )}

      <div className="pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          <strong>Required Permissions:</strong> Calendar (read events). This integration only requires calendar access, not Drive access.
        </p>
      </div>
    </div>
  )
}

