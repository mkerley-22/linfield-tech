'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function SetCookiePage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const token = searchParams?.get('token')
    const returnUrl = searchParams?.get('return') || '/dashboard'

    if (token) {
      // Set cookie via API endpoint that will set it server-side
      fetch(`/api/auth/set-session?token=${encodeURIComponent(token)}`, {
        method: 'POST',
        credentials: 'include',
      })
        .then(() => {
          // Redirect after cookie is set
          setTimeout(() => {
            router.push(returnUrl)
          }, 100)
        })
        .catch((error) => {
          console.error('Failed to set session:', error)
          router.push('/login?error=session_failed')
        })
    } else {
      router.push('/login?error=no_token')
    }
  }, [router, searchParams])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Setting up your session...</p>
      </div>
    </div>
  )
}

