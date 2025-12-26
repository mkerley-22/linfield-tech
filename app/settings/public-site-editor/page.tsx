'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { ArrowLeft, Undo2, Redo2, RotateCcw, Eye, Globe } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface ThemeSettings {
  colors: {
    primary: string
    secondary: string
    background: string
    text: string
    textSecondary: string
  }
  fonts: {
    heading: string
    body: string
  }
  spacing: {
    sectionPadding: string
    cardPadding: string
    borderRadius: string
  }
}

const defaultTheme: ThemeSettings = {
  colors: {
    primary: '#2563eb',
    secondary: '#f3f4f6',
    background: '#ffffff',
    text: '#111827',
    textSecondary: '#6b7280',
  },
  fonts: {
    heading: 'Inter, sans-serif',
    body: 'Inter, sans-serif',
  },
  spacing: {
    sectionPadding: '3rem',
    cardPadding: '1.5rem',
    borderRadius: '0.5rem',
  },
}

export default function PublicSiteEditorPage() {
  const router = useRouter()
  const [settings, setSettings] = useState<any>(null)
  const [theme, setTheme] = useState<ThemeSettings>(defaultTheme)
  const [originalTheme, setOriginalTheme] = useState<ThemeSettings>(defaultTheme)
  const [history, setHistory] = useState<ThemeSettings[]>([defaultTheme])
  const [historyIndex, setHistoryIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [previewMode, setPreviewMode] = useState<'homepage' | 'category' | 'page'>('homepage')

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/public-site')
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
        
        if (data.themeJson) {
          try {
            const parsedTheme = JSON.parse(data.themeJson)
            setTheme(parsedTheme)
            setOriginalTheme(parsedTheme)
            setHistory([parsedTheme])
            setHistoryIndex(0)
          } catch {
            // Use default theme if parsing fails
          }
        }
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateTheme = (updates: Partial<ThemeSettings>) => {
    const newTheme = { ...theme, ...updates }
    setTheme(newTheme)
    
    // Add to history
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(newTheme)
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  const updateColor = (colorKey: keyof ThemeSettings['colors'], value: string) => {
    updateTheme({
      colors: {
        ...theme.colors,
        [colorKey]: value,
      },
    })
  }

  const updateFont = (fontKey: keyof ThemeSettings['fonts'], value: string) => {
    updateTheme({
      fonts: {
        ...theme.fonts,
        [fontKey]: value,
      },
    })
  }

  const updateSpacing = (spacingKey: keyof ThemeSettings['spacing'], value: string) => {
    updateTheme({
      spacing: {
        ...theme.spacing,
        [spacingKey]: value,
      },
    })
  }

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
      setTheme(history[historyIndex - 1])
    }
  }

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1)
      setTheme(history[historyIndex + 1])
    }
  }

  const reset = () => {
    setTheme(originalTheme)
    setHistory([originalTheme])
    setHistoryIndex(0)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/public-site', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...settings,
          themeJson: JSON.stringify(theme),
        }),
      })
      
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
        setOriginalTheme(theme)
        alert('Theme changes saved successfully!')
      } else {
        alert('Failed to save theme changes')
      }
    } catch (error) {
      console.error('Save error:', error)
      alert('Failed to save theme changes')
    } finally {
      setSaving(false)
    }
  }

  const handlePublish = async () => {
    if (!confirm('Publish these theme changes to the live public site?')) return
    
    setSaving(true)
    try {
      const response = await fetch('/api/public-site', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...settings,
          themeJson: JSON.stringify(theme),
        }),
      })
      
      if (response.ok) {
        setOriginalTheme(theme)
        alert('Theme published successfully!')
        router.push('/settings?tab=public-site')
      } else {
        alert('Failed to publish theme')
      }
    } catch (error) {
      console.error('Publish error:', error)
      alert('Failed to publish theme')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 overflow-y-auto flex items-center justify-center">
          <div className="text-center">
            <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-pulse" />
            <p className="text-gray-500">Loading editor...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-full mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <Button
                onClick={() => router.push('/settings?tab=public-site')}
                variant="secondary"
                size="sm"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Settings
              </Button>
              
              <div className="flex items-center gap-4">
                <Button
                  onClick={() => window.open('/help', '_blank')}
                  variant="secondary"
                  size="sm"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Preview Live Site
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  variant="secondary"
                  size="sm"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button
                  onClick={handlePublish}
                  disabled={saving}
                  variant="primary"
                  size="sm"
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  {saving ? 'Publishing...' : 'Publish to Live Site'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex h-[calc(100vh-73px)]">
          {/* Left Sidebar - Theme Editor */}
          <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Edit Theme Settings</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={reset}
                    className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                    title="Reset"
                  >
                    <RotateCcw className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    onClick={undo}
                    disabled={historyIndex === 0}
                    className="p-1.5 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
                    title="Undo"
                  >
                    <Undo2 className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    onClick={redo}
                    disabled={historyIndex === history.length - 1}
                    className="p-1.5 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
                    title="Redo"
                  >
                    <Redo2 className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Colors Section */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Colors</h3>
                <div className="space-y-4">
                  <ColorPicker
                    label="Primary"
                    value={theme.colors.primary}
                    onChange={(value) => updateColor('primary', value)}
                  />
                  <ColorPicker
                    label="Secondary"
                    value={theme.colors.secondary}
                    onChange={(value) => updateColor('secondary', value)}
                  />
                  <ColorPicker
                    label="Background"
                    value={theme.colors.background}
                    onChange={(value) => updateColor('background', value)}
                  />
                  <ColorPicker
                    label="Text"
                    value={theme.colors.text}
                    onChange={(value) => updateColor('text', value)}
                  />
                  <ColorPicker
                    label="Text Secondary"
                    value={theme.colors.textSecondary}
                    onChange={(value) => updateColor('textSecondary', value)}
                  />
                </div>
              </div>

              {/* Fonts Section */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Fonts</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      Heading Font
                    </label>
                    <select
                      value={theme.fonts.heading}
                      onChange={(e) => updateFont('heading', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    >
                      <option value="Inter, sans-serif">Inter</option>
                      <option value="system-ui, sans-serif">System UI</option>
                      <option value="Georgia, serif">Georgia</option>
                      <option value="'Times New Roman', serif">Times New Roman</option>
                      <option value="'Courier New', monospace">Courier New</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      Body Font
                    </label>
                    <select
                      value={theme.fonts.body}
                      onChange={(e) => updateFont('body', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    >
                      <option value="Inter, sans-serif">Inter</option>
                      <option value="system-ui, sans-serif">System UI</option>
                      <option value="Georgia, serif">Georgia</option>
                      <option value="'Times New Roman', serif">Times New Roman</option>
                      <option value="'Courier New', monospace">Courier New</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Spacing Section */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Spacing</h3>
                <div className="space-y-4">
                  <SpacingInput
                    label="Section Padding"
                    value={theme.spacing.sectionPadding}
                    onChange={(value) => updateSpacing('sectionPadding', value)}
                  />
                  <SpacingInput
                    label="Card Padding"
                    value={theme.spacing.cardPadding}
                    onChange={(value) => updateSpacing('cardPadding', value)}
                  />
                  <SpacingInput
                    label="Border Radius"
                    value={theme.spacing.borderRadius}
                    onChange={(value) => updateSpacing('borderRadius', value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Pane - Live Preview */}
          <div className="flex-1 overflow-y-auto bg-gray-100">
            <div className="p-8">
              <div className="bg-white rounded-lg shadow-lg overflow-hidden" style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <ThemePreview theme={theme} previewMode={previewMode} />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function ColorPicker({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const [showPicker, setShowPicker] = useState(false)
  
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-2">{label}</label>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="w-10 h-10 rounded border-2 border-gray-300 hover:border-gray-400 transition-colors"
          style={{ backgroundColor: value }}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          placeholder="#000000"
        />
      </div>
      {showPicker && (
        <div className="mt-2 p-4 bg-white border border-gray-200 rounded-lg shadow-lg">
          <ColorGrid onSelect={onChange} />
        </div>
      )}
    </div>
  )
}

function ColorGrid({ onSelect }: { onSelect: (color: string) => void }) {
  const colors = [
    '#000000', '#374151', '#6b7280', '#9ca3af', '#d1d5db', '#e5e7eb', '#f3f4f6', '#ffffff',
    '#dc2626', '#ea580c', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#10b981', '#14b8a6',
    '#06b6d4', '#0ea5e9', '#3b82f6', '#2563eb', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
    '#ec4899', '#f43f5e', '#ef4444', '#f97316', '#fb923c', '#fbbf24', '#facc15', '#a3e635',
    '#4ade80', '#34d399', '#2dd4bf', '#22d3ee', '#38bdf8', '#60a5fa', '#818cf8', '#a78bfa',
    '#c084fc', '#e879f9', '#f472b6', '#fb7185', '#f87171', '#fb923c', '#fbbf24', '#facc15',
  ]
  
  return (
    <div className="grid grid-cols-8 gap-2">
      {colors.map((color) => (
        <button
          key={color}
          onClick={() => onSelect(color)}
          className="w-8 h-8 rounded border border-gray-300 hover:scale-110 transition-transform"
          style={{ backgroundColor: color }}
          title={color}
        />
      ))}
    </div>
  )
}

function SpacingInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-2">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        placeholder="1rem"
      />
    </div>
  )
}

function ThemePreview({ theme, previewMode }: { theme: ThemeSettings; previewMode: string }) {
  return (
    <div
      style={{
        fontFamily: theme.fonts.body,
        backgroundColor: theme.colors.background,
        color: theme.colors.text,
      }}
    >
      {/* Hero Section */}
      <div
        style={{
          backgroundColor: theme.colors.primary,
          color: '#ffffff',
          padding: theme.spacing.sectionPadding,
          textAlign: 'center',
        }}
      >
        <h1
          style={{
            fontFamily: theme.fonts.heading,
            fontSize: '2.5rem',
            fontWeight: 'bold',
            marginBottom: '1rem',
          }}
        >
          {previewMode === 'homepage' ? 'Welcome to Help Center' : 'Page Title'}
        </h1>
        <p style={{ fontSize: '1.25rem', opacity: 0.9 }}>
          Find answers to common questions
        </p>
      </div>

      {/* Content Section */}
      <div style={{ padding: theme.spacing.sectionPadding }}>
        <h2
          style={{
            fontFamily: theme.fonts.heading,
            fontSize: '1.5rem',
            fontWeight: 'bold',
            marginBottom: '1rem',
            color: theme.colors.text,
          }}
        >
          What&apos;s Inside?
        </h2>
        <p style={{ color: theme.colors.textSecondary, marginBottom: '2rem' }}>
          Browse our knowledge base to find helpful articles and guides.
        </p>

        {/* Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                backgroundColor: theme.colors.secondary,
                padding: theme.spacing.cardPadding,
                borderRadius: theme.spacing.borderRadius,
                border: `1px solid ${theme.colors.primary}20`,
              }}
            >
              <h3
                style={{
                  fontFamily: theme.fonts.heading,
                  fontSize: '1.125rem',
                  fontWeight: 'semibold',
                  marginBottom: '0.5rem',
                  color: theme.colors.text,
                }}
              >
                Category {i}
              </h3>
              <p style={{ color: theme.colors.textSecondary, fontSize: '0.875rem' }}>
                Description of category content
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

