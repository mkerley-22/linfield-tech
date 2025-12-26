'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Loader2, Key, AlertCircle } from 'lucide-react'
import { Button } from './ui/Button'

export default function AIConfig() {
  const [apiKey, setApiKey] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isConfigured, setIsConfigured] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkConfiguration()
  }, [])

  const checkConfiguration = async () => {
    try {
      // Check if API key is configured in .env by trying a simple test
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: 'test' }),
      })
      
      const data = await response.json()
      // If we get a 500 with "not configured", it's not set up in .env
      // Otherwise, check if it's configured (either in .env or localStorage)
      const hasEnvKey = response.status !== 500 && !data.error?.includes('not configured')
      const hasLocalStorageKey = localStorage.getItem('ai_configured') === 'true'
      setIsConfigured(hasEnvKey || hasLocalStorageKey)
    } catch {
      // Check localStorage as fallback
      const hasLocalStorageKey = localStorage.getItem('ai_configured') === 'true'
      setIsConfigured(hasLocalStorageKey)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!apiKey.trim()) {
      setError('API key is required')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      // Test the API key using the test endpoint
      const response = await fetch('/api/ai/test-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      })

      const data = await response.json()

      if (response.ok && data.valid) {
        // Save to localStorage as an indicator that a key was tested and is valid
        // Note: The actual API key should be in .env file for security
        localStorage.setItem('ai_configured', 'true')
        localStorage.setItem('ai_api_key', apiKey.trim()) // Store temporarily for client-side use
        setIsConfigured(true)
        setApiKey('') // Clear the input for security
        alert('API key is valid! Note: For production, add OPENAI_API_KEY to your .env file and restart the server.')
      } else {
        setError(data.error || 'Invalid API key. Please check and try again.')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to test API key')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-gray-600">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Checking configuration...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium text-gray-900 mb-1">OpenAI API</h3>
          <p className="text-sm text-gray-600">
            Enable AI-powered content generation for your pages
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isConfigured ? (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-medium">Configured</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-gray-400">
              <XCircle className="w-5 h-5" />
              <span className="text-sm">Not Configured</span>
            </div>
          )}
        </div>
      </div>

      {!isConfigured && (
        <div className="space-y-4">
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-yellow-900 font-medium mb-1">
                  API Key Required
                </p>
                <p className="text-xs text-yellow-800">
                  For security, add <code className="bg-yellow-100 px-1 rounded">OPENAI_API_KEY</code> to your <code className="bg-yellow-100 px-1 rounded">.env</code> file. 
                  You can test it here, but it won&apos;t persist.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              OpenAI API Key
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Get your API key from{' '}
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 underline"
              >
                OpenAI Platform
              </a>
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <Button
            onClick={handleSave}
            disabled={isSaving || !apiKey.trim()}
            variant="primary"
            className="w-full"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Testing API Key...
              </>
            ) : (
              <>
                <Key className="w-4 h-4 mr-2" />
                Test & Save Configuration
              </>
            )}
          </Button>
        </div>
      )}

      {isConfigured && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">
            ✓ AI features are enabled. You can use the AI Writing Assistant when creating pages.
          </p>
        </div>
      )}

      <div className="pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          <strong>Note:</strong> API keys should be stored in your <code className="bg-gray-100 px-1 rounded">.env</code> file for security. 
          This test configuration is temporary.
        </p>
      </div>
    </div>
  )
}

