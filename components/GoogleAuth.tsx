'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle, XCircle, Loader2, ExternalLink, Settings } from 'lucide-react'
import { Button } from './ui/Button'
import GoogleSetupWizard from './GoogleSetupWizard'

export default function GoogleAuth() {
  const searchParams = useSearchParams()
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isConnecting, setIsConnecting] = useState(false)
  const [showSetupWizard, setShowSetupWizard] = useState(false)
  const [configError, setConfigError] = useState<string | null>(null)

  useEffect(() => {
    checkConnection()
    
    // Check for OAuth callback results
    const success = searchParams?.get('success')
    const error = searchParams?.get('error')
    
    if (success === 'connected') {
      setIsConnected(true)
    } else if (error) {
      console.error('OAuth error:', error)
    }
  }, [searchParams])

  const checkConnection = async () => {
    try {
      // Check if Google is connected by trying to list calendars
      const response = await fetch('/api/events/import')
      if (response.ok) {
        setIsConnected(true)
      } else {
        const data = await response.json().catch(() => ({}))
        // If it's a "not connected" error, that's expected
        if (data.error?.includes('not connected') || data.error?.includes('not found')) {
          setIsConnected(false)
        } else {
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
    try {
      const response = await fetch('/api/auth/google')
      const data = await response.json()
      
      if (data.error) {
        setConfigError(data.message || data.error)
        setShowSetupWizard(true) // Auto-show wizard on error
        setIsConnecting(false)
        return
      }
      
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('No OAuth URL received')
      }
    } catch (error) {
      console.error('Failed to initiate OAuth:', error)
      alert('Failed to connect Google account. Please check your configuration and try again.')
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
          <h3 className="font-medium text-gray-900 mb-1">Google Account</h3>
          <p className="text-sm text-gray-600">
            Connect your Google account to sync Drive files and Calendar events
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

      {configError && (
        <>
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
            <p className="text-sm text-red-800 font-medium mb-1">One-Time Setup Required</p>
            <p className="text-xs text-red-700">
              Once you add credentials below, you&apos;ll be able to sign in with Google directly!
            </p>
          </div>
          <GoogleSetupWizard />
        </>
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
                <ExternalLink className="w-4 h-4 mr-2" />
                Sign in with Google
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
            ✓ Connected to Google Drive and Calendar
          </p>
          <p className="text-xs text-green-600 mt-1">
            You can now sync Drive files and import Calendar events
          </p>
        </div>
      )}

      <div className="pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          <strong>Required Permissions:</strong> Drive (read files, create folders), Calendar (read events)
        </p>
      </div>
    </div>
  )
}

