'use client'

import { useState } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import { Button } from './ui/Button'

interface AIAssistantProps {
  onGenerate: (prompt: string) => Promise<string>
  onInsert: (content: string) => void
}

export default function AIAssistant({ onGenerate, onInsert }: AIAssistantProps) {
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState('')

  const handleGenerate = async () => {
    if (!prompt.trim()) return

    setIsGenerating(true)
    try {
      const content = await onGenerate(prompt)
      setGeneratedContent(content)
    } catch (error: any) {
      console.error('AI generation error:', error)
      const errorMessage = error?.message || 'Failed to generate content. Please try again.'
      alert(errorMessage)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleInsert = () => {
    if (generatedContent) {
      onInsert(generatedContent)
      setGeneratedContent('')
      setPrompt('')
    }
  }

  return (
    <div className="border border-gray-300 rounded-lg p-4 bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-gray-900">AI Writing Assistant</h3>
      </div>
      <p className="text-sm text-gray-600 mb-4">
        Describe what you want to write, and AI will help generate content for your page.
      </p>
      <div className="space-y-3">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., Write an introduction about network troubleshooting for our IT department..."
          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none text-gray-900"
          rows={3}
          disabled={isGenerating}
        />
        <Button
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim()}
          variant="primary"
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Content
            </>
          )}
        </Button>
        {generatedContent && (
          <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
            <div className="prose prose-sm max-w-none mb-3" dangerouslySetInnerHTML={{ __html: generatedContent }} />
            <div className="flex gap-2">
              <Button onClick={handleInsert} variant="primary" size="sm">
                Insert into Editor
              </Button>
              <Button
                onClick={() => {
                  setGeneratedContent('')
                  setPrompt('')
                }}
                variant="secondary"
                size="sm"
              >
                Clear
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

