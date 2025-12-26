'use client'

import { useState } from 'react'
import { ExternalLink, Copy, Check, AlertCircle } from 'lucide-react'
import { Button } from './ui/Button'

export default function GoogleSetupWizard() {
  const [copied, setCopied] = useState<string | null>(null)

  const envCode = `GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3000/api/auth/google/callback"`

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(text)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="space-y-4">
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-blue-900 font-medium mb-2">
              Quick Setup Required (One-Time)
            </p>
            <p className="text-sm text-blue-800 mb-3">
              You need to create Google OAuth credentials first. This is a one-time setup that takes about 2 minutes.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="p-4 border border-gray-200 rounded-lg bg-white">
          <h4 className="font-semibold text-gray-900 mb-2">Step 1: Get OAuth Credentials</h4>
          <p className="text-sm text-gray-600 mb-3">
            Click the button below to open Google Cloud Console. You&apos;ll need to:
          </p>
          <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside mb-4 ml-2">
            <li>Create a project (or select existing)</li>
            <li>Enable Drive & Calendar APIs</li>
            <li>Create OAuth Client ID (Web application)</li>
            <li>Add redirect URI: <code className="bg-gray-100 px-1 rounded text-xs">http://localhost:3000/api/auth/google/callback</code></li>
            <li>Copy your Client ID and Client Secret</li>
          </ol>
          <a
            href="https://console.cloud.google.com/apis/credentials"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="primary" className="w-full">
              Open Google Cloud Console
              <ExternalLink className="w-4 h-4 ml-2" />
            </Button>
          </a>
        </div>

        <div className="p-4 border border-gray-200 rounded-lg bg-white">
          <h4 className="font-semibold text-gray-900 mb-2">Step 2: Add to .env File</h4>
          <p className="text-sm text-gray-600 mb-3">
            Add these lines to your <code className="bg-gray-100 px-1 rounded">.env</code> file with your actual credentials:
          </p>
          <div className="relative">
            <button
              onClick={() => handleCopy(envCode)}
              className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
            >
              {copied === envCode ? (
                <>
                  <Check className="w-3 h-3" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  Copy
                </>
              )}
            </button>
            <pre className="p-3 bg-gray-900 text-green-400 rounded text-xs overflow-x-auto pr-20">
              <code>{envCode}</code>
            </pre>
          </div>
        </div>

        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-900 font-medium mb-1">Step 3: Restart & Connect</p>
          <p className="text-xs text-green-800">
            After adding credentials, restart your server (<code className="bg-green-100 px-1 rounded">npm run dev</code>), 
            then click &quot;Connect Google Account&quot; above. You&apos;ll be taken directly to Google sign-in!
          </p>
        </div>
      </div>
    </div>
  )
}

