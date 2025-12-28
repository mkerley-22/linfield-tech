'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Save, ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from './ui/Button'
import { slugify } from '@/lib/utils'

interface CategoryEditorProps {
  categoryId?: string
  initialName?: string
  initialDescription?: string
  initialColor?: string
  initialIcon?: string
  initialParentId?: string
}

export default function CategoryEditor({
  categoryId,
  initialName = '',
  initialDescription = '',
  initialColor = '#2563eb',
  initialIcon = '',
  initialParentId = '',
}: CategoryEditorProps) {
  const router = useRouter()
  const [name, setName] = useState(initialName)
  const [description, setDescription] = useState(initialDescription)
  const [color, setColor] = useState(initialColor)
  const [parentId, setParentId] = useState(initialParentId)
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([])
  const [saving, setSaving] = useState(false)

  // Load categories for parent selection
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await fetch('/api/categories')
        if (response.ok) {
          const data = await response.json()
          // Filter out current category if editing and only show top-level categories as parents
          const filtered = categoryId 
            ? data.filter((cat: any) => cat.id !== categoryId && !cat.parentId)
            : data.filter((cat: any) => !cat.parentId)
          setCategories(filtered)
        }
      } catch (error) {
        console.error('Failed to load categories:', error)
      }
    }
    loadCategories()
  }, [categoryId])
    const loadCategories = async () => {
      try {
        const response = await fetch('/api/categories')
        if (response.ok) {
          const data = await response.json()
          // Filter out current category if editing
          const filtered = categoryId 
            ? data.filter((cat: any) => cat.id !== categoryId)
            : data
          setCategories(filtered)
        }
      } catch (error) {
        console.error('Failed to load categories:', error)
      }
    }
    loadCategories()
  })

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Please enter a category name')
      return
    }

    setSaving(true)
    try {
      const response = await fetch(categoryId ? `/api/categories/${categoryId}` : '/api/categories', {
        method: categoryId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          color,
          parentId: parentId || null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `Failed to save category: ${response.statusText}`)
      }

      const data = await response.json()
      router.push(`/categories/${data.slug}`)
    } catch (error: any) {
      console.error('Save error:', error)
      alert(error.message || 'Failed to save category. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-4 lg:p-8 pt-24 lg:pt-8">
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
              Save Category
            </>
          )}
        </Button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-8 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category Name *
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
            Parent Category (Optional)
          </label>
          <select
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
            className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
          >
            <option value="">None (Top-level category)</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          <p className="text-sm text-gray-500 mt-2">
            Select a parent category to make this a subcategory
          </p>
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
            Choose a color to identify this category
          </p>
        </div>
      </div>
    </div>
  )
}

