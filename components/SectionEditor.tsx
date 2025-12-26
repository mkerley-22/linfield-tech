'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save, ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from './ui/Button'
import { slugify } from '@/lib/utils'

interface SectionEditorProps {
  sectionId?: string
  initialName?: string
  initialDescription?: string
  initialColor?: string
  initialIcon?: string
}

export default function SectionEditor({
  sectionId,
  initialName = '',
  initialDescription = '',
  initialColor = '#2563eb',
  initialIcon = '',
}: SectionEditorProps) {
  const router = useRouter()
  const [name, setName] = useState(initialName)
  const [description, setDescription] = useState(initialDescription)
  const [color, setColor] = useState(initialColor)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Please enter a section name')
      return
    }

    setSaving(true)
    try {
      const response = await fetch(sectionId ? `/api/sections/${sectionId}` : '/api/sections', {
        method: sectionId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          color,
        }),
      })

      if (!response.ok) throw new Error('Failed to save section')

      const data = await response.json()
      router.push(`/sections/${data.slug}`)
    } catch (error) {
      console.error('Save error:', error)
      alert('Failed to save section. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="flex items-center justify-between mb-6">
        <Button
          onClick={() => router.back()}
          variant="secondary"
          size="sm"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving}
          variant="primary"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Section
            </>
          )}
        </Button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-8 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Section Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Audio, Video, Networking..."
            className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-lg text-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of this section..."
            rows={3}
            className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none text-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Color
          </label>
          <div className="flex items-center gap-4">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-16 h-16 rounded-lg border border-gray-200 cursor-pointer"
            />
            <input
              type="text"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              placeholder="#2563eb"
              className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Choose a color to identify this section
          </p>
        </div>
      </div>
    </div>
  )
}

