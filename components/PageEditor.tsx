'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Save, ArrowLeft, Loader2 } from 'lucide-react'
import RichTextEditor from './RichTextEditor'
import AIAssistant from './AIAssistant'
import FileUpload from './FileUpload'
import { Button } from './ui/Button'
import { slugify } from '@/lib/utils'
import { useIntegration } from '@/hooks/useIntegration'

interface PageEditorProps {
  pageId?: string
  initialTitle?: string
  initialContent?: string
  initialDescription?: string
  initialCategoryId?: string
  initialParentId?: string
  initialHeaderImage?: string
  initialIsPublished?: boolean
  initialFiles?: Array<{
    id: string
    fileName: string
    fileType: string
    fileSize: number
  }>
}

export default function PageEditor({
  pageId,
  initialTitle = '',
  initialContent = '',
  initialDescription = '',
  initialCategoryId = '',
  initialParentId = '',
  initialHeaderImage = '',
  initialIsPublished = true,
  initialFiles = [],
}: PageEditorProps) {
  const router = useRouter()
  const [currentPageId, setCurrentPageId] = useState(pageId)
  const [title, setTitle] = useState(initialTitle)
  const [description, setDescription] = useState(initialDescription)
  const [content, setContent] = useState(initialContent)
  const [categoryId, setCategoryId] = useState(initialCategoryId)
  const [parentId, setParentId] = useState(initialParentId)
  const [headerImage, setHeaderImage] = useState(initialHeaderImage)
  const [isPublished, setIsPublished] = useState(initialIsPublished)
  const [files, setFiles] = useState(initialFiles)
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([])
  const [parentPages, setParentPages] = useState<Array<{ id: string; title: string; parentId: string | null }>>([])
  const [uploadingHeaderImage, setUploadingHeaderImage] = useState(false)
  const [saving, setSaving] = useState(false)
  const { enabled: aiEnabled } = useIntegration('ai')

  useEffect(() => {
    // Fetch categories
    fetch('/api/categories')
      .then((res) => {
        if (!res.ok) {
          throw new Error('Failed to fetch categories')
        }
        return res.json()
      })
      .then((data) => {
        // Ensure data is an array
        if (Array.isArray(data)) {
          setCategories(data)
        } else {
          console.error('Categories data is not an array:', data)
          setCategories([])
        }
      })
      .catch((err) => {
        console.error('Failed to fetch categories:', err)
        setCategories([])
      })

    // Fetch parent pages (only top-level pages can be parents)
    fetch('/api/pages?parentId=null')
      .then((res) => {
        if (!res.ok) {
          throw new Error('Failed to fetch parent pages')
        }
        return res.json()
      })
      .then((data) => {
        if (Array.isArray(data)) {
          // Filter out current page to prevent circular references
          let filtered = data.filter((page: any) => page.id !== currentPageId)
          
          // If initialParentId is set and not in the list, fetch that specific page
          if (initialParentId && !filtered.find((p: any) => p.id === initialParentId)) {
            fetch(`/api/pages/${initialParentId}`)
              .then((res) => {
                if (res.ok) {
                  return res.json()
                }
                return null
              })
              .then((parentPage) => {
                if (parentPage && parentPage.id !== currentPageId) {
                  filtered = [parentPage, ...filtered]
                }
                setParentPages(filtered)
              })
              .catch(() => {
                setParentPages(filtered)
              })
          } else {
            setParentPages(filtered)
          }
        } else {
          setParentPages([])
        }
      })
      .catch((err) => {
        console.error('Failed to fetch parent pages:', err)
        setParentPages([])
      })
  }, [currentPageId, initialParentId])

  const handleSave = async () => {
    if (!title.trim()) {
      alert('Please enter a title')
      return
    }

    setSaving(true)
    try {
      const slug = slugify(title)
      const response = await fetch(currentPageId ? `/api/pages/${currentPageId}` : '/api/pages', {
        method: currentPageId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          slug,
          description,
          content,
          categoryId: categoryId || null,
          parentId: parentId || null,
          isPublished,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to save page')
      }

      const data = await response.json()
      
      // Update pageId if this was a new page
      if (!currentPageId) {
        setCurrentPageId(data.id)
      }
      
      // Redirect to view page and refresh the pages list
      router.push(`/pages/${data.slug}`)
      router.refresh() // Force refresh to show the new page in lists
    } catch (error: any) {
      console.error('Save error:', error)
      alert(error.message || 'Failed to save page. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleFileUpload = async (uploadedFiles: File[]) => {
    if (!currentPageId) {
      alert('Please save the page first before uploading files')
      return
    }

    const formData = new FormData()
    uploadedFiles.forEach((file) => {
      formData.append('files', file)
    })
    formData.append('pageId', currentPageId)

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) throw new Error('Failed to upload files')

      const data = await response.json()
      setFiles([...files, ...data.files])
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload files. Please try again.')
    }
  }

  const handleFileDelete = async (fileId: string) => {
    try {
      const response = await fetch(`/api/upload/${fileId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete file')

      setFiles(files.filter((f) => f.id !== fileId))
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete file. Please try again.')
    }
  }

  const handleAIGenerate = async (prompt: string): Promise<string> => {
    // Get API key from localStorage if available (for testing), otherwise use env variable
    const apiKey = typeof window !== 'undefined' ? localStorage.getItem('ai_api_key') : null
    
    const response = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        prompt,
        ...(apiKey && { apiKey }) // Include API key if available from localStorage
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to generate content')
    }

    const data = await response.json()
    return data.content
  }

  const handleAIInsert = (generatedContent: string) => {
    setContent((prev) => prev + generatedContent)
  }

  const handleHeaderImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !currentPageId) return

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    setUploadingHeaderImage(true)
    try {
      const formData = new FormData()
      formData.append('image', file)

      const response = await fetch(`/api/pages/${currentPageId}/upload-header-image`, {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setHeaderImage(data.headerImage)
        alert('Header image uploaded successfully')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to upload header image')
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload header image')
    } finally {
      setUploadingHeaderImage(false)
      e.target.value = ''
    }
  }

  const handleDeleteHeaderImage = async () => {
    if (!currentPageId || !confirm('Delete this header image?')) return

    try {
      const response = await fetch(`/api/pages/${currentPageId}/upload-header-image`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setHeaderImage('')
        alert('Header image deleted successfully')
      } else {
        alert('Failed to delete header image')
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete header image')
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
              Save Page
            </>
          )}
        </Button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-8 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Page Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter page title..."
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
            placeholder="Brief description of this page..."
            rows={2}
            className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none text-gray-900"
          />
        </div>

        {currentPageId && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Header Image (250px height × 1200px width)
            </label>
            {headerImage ? (
              <div className="space-y-2">
                <div className="relative w-full" style={{ maxWidth: '1200px', height: '250px' }}>
                  <img
                    src={headerImage}
                    alt="Header"
                    className="w-full h-full object-cover rounded-lg border border-gray-200"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleHeaderImageUpload}
                    disabled={uploadingHeaderImage}
                    className="text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <button
                    onClick={handleDeleteHeaderImage}
                    className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleHeaderImageUpload}
                  disabled={uploadingHeaderImage || !currentPageId}
                  className="text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Upload a header image (recommended: 1200px × 250px). Save the page first to enable image upload.
                </p>
              </div>
            )}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
          >
            <option value="">No Category</option>
            {Array.isArray(categories) && categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <p className="text-sm text-gray-500 mt-1">
            Organize this page under a category (e.g., Audio, Video, Networking)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Parent Page
          </label>
          <select
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
            className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
            disabled={!!initialParentId && !currentPageId}
          >
            {!initialParentId && <option value="">No Parent (Top-level page)</option>}
            {initialParentId && !parentPages.find((p) => p.id === initialParentId) && (
              <option value={initialParentId}>Loading parent page...</option>
            )}
            {Array.isArray(parentPages) && parentPages.map((page) => (
              <option key={page.id} value={page.id}>
                {page.title}
              </option>
            ))}
          </select>
          <p className="text-sm text-gray-500 mt-1">
            {initialParentId 
              ? 'This page is a subpage. You can change the parent after saving.'
              : 'Group this page under another page (e.g., "Working with Allen & Heath SQ7" can contain sub-pages)'}
          </p>
        </div>

        <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <input
            type="checkbox"
            id="publish"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="publish" className="text-sm font-medium text-gray-900 cursor-pointer">
            Publish to public site
          </label>
          <p className="text-xs text-gray-600 ml-auto">
            {isPublished ? 'This page will be visible on the public help center' : 'This page will only be visible to logged-in users'}
          </p>
        </div>

        {aiEnabled && (
          <AIAssistant onGenerate={handleAIGenerate} onInsert={handleAIInsert} />
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Content
          </label>
          <RichTextEditor
            content={content}
            onChange={setContent}
            placeholder="Start writing your content here..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Attachments
          </label>
          <FileUpload
            onUpload={handleFileUpload}
            existingFiles={files}
            onDelete={handleFileDelete}
          />
        </div>
      </div>
    </div>
  )
}

