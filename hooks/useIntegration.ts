'use client'

import { useState, useEffect } from 'react'

export function useIntegration(integrationName: string) {
  const [enabled, setEnabled] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsLoading(false)
      return
    }

    // For calendar integration, check actual connection status via API
    if (integrationName === 'calendar') {
      const checkCalendarStatus = async () => {
        try {
          const response = await fetch('/api/auth/google/calendar/status')
          if (response.ok) {
            const data = await response.json()
            setEnabled(data.connected === true)
          } else {
            setEnabled(false)
          }
        } catch (error) {
          console.error('Failed to check calendar status:', error)
          setEnabled(false)
        } finally {
          setIsLoading(false)
        }
      }
      checkCalendarStatus()
    } else {
      // For other integrations, use localStorage as fallback
      const pref = localStorage.getItem(`integration_${integrationName}_enabled`)
      setEnabled(pref === 'true')
      setIsLoading(false)
    }
  }, [integrationName])

  return { enabled, isLoading }
}

