'use client'

import { useState, useEffect } from 'react'

export function useIntegration(integrationName: string) {
  const [enabled, setEnabled] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const pref = localStorage.getItem(`integration_${integrationName}_enabled`)
      setEnabled(pref === 'true')
      setIsLoading(false)
    }
  }, [integrationName])

  return { enabled, isLoading }
}

