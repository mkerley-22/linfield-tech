'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, Mail } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const errorParam = searchParams?.get('error')
    const detailsParam = searchParams?.get('details')
    if (errorParam) {
      setError(getErrorMessage(errorParam, detailsParam || undefined))
    }
  }, [searchParams])

  const getErrorMessage = (error: string, details?: string) => {
    if (details) {
      return `Authentication failed: ${details}. Please check the server console for more details.`
    }
    switch (error) {
      case 'no_code':
        return 'No authorization code received. Please try again.'
      case 'no_token':
        return 'Failed to get access token. Please try again.'
      case 'no_user_info':
        return 'Failed to get user information. Please try again.'
      case 'auth_failed':
        return 'Authentication failed. Please check the server console for error details.'
      default:
        return `An error occurred during login: ${error}. Please try again.`
    }
  }

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/login')
      const data = await response.json()

      if (data.error) {
        setError(data.message || data.error)
        setIsLoading(false)
        return
      }

      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('No OAuth URL received')
      }
    } catch (error: any) {
      console.error('Login error:', error)
      setError('Failed to initiate login. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg border border-gray-200 shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <img 
              src="/lc-logo.svg" 
              alt="Linfield Christian School" 
              className="w-full h-full object-contain p-2"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Linfield AV Hub
          </h1>
          <p className="text-gray-600">
            Sign in with your Google account
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <Button
          onClick={handleGoogleLogin}
          disabled={isLoading}
          variant="primary"
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              <Mail className="w-5 h-5 mr-2" />
              Sign in with Google
            </>
          )}
        </Button>

        <p className="text-xs text-gray-500 text-center mt-6">
          By signing in, you agree to use this system responsibly.
        </p>
      </div>
    </div>
  )
}

