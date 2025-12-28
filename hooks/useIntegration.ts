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
    } else if (integrationName === 'ai') {
      // For AI integration, automatically enable if API key is configured
      // Check if API key exists in environment (via API) or localStorage
      const checkAIStatus = async () => {
        try {
          // Check if API key is configured in environment
          const response = await fetch('/api/ai/status')
          if (response.ok) {
            const data = await response.json()
            // If API key exists (env or localStorage), enable AI automatically
            const hasApiKey = data.configured || localStorage.getItem('ai_configured') === 'true'
            setEnabled(hasApiKey)
          } else {
            // Fallback: check localStorage
            const hasLocalKey = localStorage.getItem('ai_configured') === 'true'
            setEnabled(hasLocalKey)
          }
        } catch (error) {
          // Fallback: check localStorage
          const hasLocalKey = localStorage.getItem('ai_configured') === 'true'
          setEnabled(hasLocalKey)
        } finally {
          setIsLoading(false)
        }
      }
      checkAIStatus()
    } else {
      // For other integrations, use localStorage as fallback
      const pref = localStorage.getItem(`integration_${integrationName}_enabled`)
      setEnabled(pref === 'true')
      setIsLoading(false)
    }
  }, [integrationName])

  return { enabled, isLoading }
}

