'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Save, X, Loader2, Upload, FileText, XCircle, Image as ImageIcon, ExternalLink, Plus, Trash2 } from 'lucide-react'
import { Button } from './ui/Button'

interface InventoryEditorProps {
  itemId?: string
  initialData?: {
    name?: string
    description?: string
    quantity?: number
    manufacturer?: string
    model?: string
    serialNumbers?: string | string[]  // Can be string (JSON) or array
    location?: string
    checkoutEnabled?: boolean
    tagIds?: string[]
    imageUrl?: string
    documentationLinks?: string
    documents?: Array<{ id: string; fileName: string; filePath: string; fileType: string }>
  }
}

export default function InventoryEditor({ itemId, initialData }: InventoryEditorProps) {
  const router = useRouter()
  const [name, setName] = useState(initialData?.name || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [quantity, setQuantity] = useState(initialData?.quantity || 1)
  const [manufacturer, setManufacturer] = useState(initialData?.manufacturer || '')
  const [model, setModel] = useState(initialData?.model || '')
  const [serialNumbers, setSerialNumbers] = useState<string[]>(() => {
    if (!initialData?.serialNumbers) return []
    try {
      if (typeof initialData.serialNumbers === 'string') {
        const parsed = JSON.parse(initialData.serialNumbers)
        return Array.isArray(parsed) ? parsed.filter((s: any) => s && s.trim()) : []
      }
      return Array.isArray(initialData.serialNumbers) ? initialData.serialNumbers.filter(s => s && s.trim()) : []
    } catch {
      return []
    }
  })
  const [newSerialNumber, setNewSerialNumber] = useState('')
  const [location, setLocation] = useState(initialData?.location || '')
  const [checkoutEnabled, setCheckoutEnabled] = useState(initialData?.checkoutEnabled || false)
  const [selectedTags, setSelectedTags] = useState<string[]>(initialData?.tagIds || [])
  const [tags, setTags] = useState<Array<{ id: string; name: string; color: string }>>([])
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showNewTag, setShowNewTag] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState('#2563eb')
  const [creatingTag, setCreatingTag] = useState(false)
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || '')
  const [documentationLinks, setDocumentationLinks] = useState<Array<{ url: string; title: string; type: string }>>(
    initialData?.documentationLinks ? (() => {
      try {
        return JSON.parse(initialData.documentationLinks)
      } catch {
        return []
      }
    })() : []
  )
  const [uploadingImage, setUploadingImage] = useState(false)
  const [newDocUrl, setNewDocUrl] = useState('')
  const [newDocTitle, setNewDocTitle] = useState('')
  const [newDocType, setNewDocType] = useState('manual')
  const [documents, setDocuments] = useState<Array<{ id: string; fileName: string; filePath: string; fileType: string }>>(
    initialData?.documents || []
  )
  const [fetchingResources, setFetchingResources] = useState(false)
  const [hasAutoFetched, setHasAutoFetched] = useState(false)

  useEffect(() => {
    loadTags()
  }, [])

  // Auto-fetch resources when both manufacturer and model are filled
  useEffect(() => {
    const shouldFetch = 
      itemId && 
      manufacturer.trim() && 
      model.trim() && 
      !hasAutoFetched &&
      !imageUrl && // Only fetch if we don't already have an image
      !fetchingResources

    if (shouldFetch) {
      handleAutoFetchResources()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manufacturer, model, itemId])

  const loadTags = async () => {
    try {
      const response = await fetch('/api/inventory/tags')
      if (response.ok) {
        const data = await response.json()
        setTags(data.tags || [])
      }
    } catch (error) {
      console.error('Failed to load tags:', error)
    }
  }

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Name is required')
      return
    }

    setSaving(true)
    try {
      const url = itemId ? `/api/inventory/${itemId}` : '/api/inventory'
      const method = itemId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          quantity: parseInt(String(quantity)) || 1,
          manufacturer,
          model,
          serialNumbers: serialNumbers.length > 0 ? JSON.stringify(serialNumbers) : null,
          location,
          checkoutEnabled,
          tagIds: selectedTags,
          imageUrl: imageUrl || null,
          documentationLinks: documentationLinks.length > 0 ? JSON.stringify(documentationLinks) : null,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        router.push(`/inventory/${data.item.id}`)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to save')
      }
    } catch (error) {
      console.error('Save error:', error)
      alert('Failed to save inventory item')
    } finally {
      setSaving(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !itemId) return

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    setUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append('image', file)

      const response = await fetch(`/api/inventory/${itemId}/upload-image`, {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setImageUrl(data.imageUrl)
        alert('Image uploaded successfully')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to upload image')
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload image')
    } finally {
      setUploadingImage(false)
      e.target.value = ''
    }
  }

  const handleDeleteImage = async () => {
    if (!itemId || !confirm('Delete this image?')) return

    try {
      const response = await fetch(`/api/inventory/${itemId}/upload-image`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setImageUrl('')
        alert('Image deleted successfully')
      } else {
        alert('Failed to delete image')
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete image')
    }
  }

  const handleAddDocumentationLink = () => {
    if (!newDocUrl.trim()) {
      alert('Please enter a URL')
      return
    }
    setDocumentationLinks([
      ...documentationLinks,
      {
        url: newDocUrl.trim(),
        title: newDocTitle.trim() || 'Documentation',
        type: newDocType,
      },
    ])
    setNewDocUrl('')
    setNewDocTitle('')
    setNewDocType('manual')
  }

  const handleDeleteDocumentationLink = (index: number) => {
    setDocumentationLinks(documentationLinks.filter((_, i) => i !== index))
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !itemId) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`/api/inventory/${itemId}/documents`, {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setDocuments([...documents, data.document])
        alert('Document uploaded successfully')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to upload document')
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload document')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleDeleteDocument = async (docId: string) => {
    if (!itemId || !confirm('Delete this document?')) return

    try {
      const response = await fetch(`/api/inventory/${itemId}/documents/${docId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setDocuments(documents.filter((d) => d.id !== docId))
        alert('Document deleted successfully')
      } else {
        alert('Failed to delete document')
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete document')
    }
  }

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    )
  }

  const handleCreateTag = async () => {
    if (!newTagName.trim()) {
      alert('Tag name is required')
      return
    }

    setCreatingTag(true)
    try {
      const response = await fetch('/api/inventory/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTagName.trim().toLowerCase(),
          color: newTagColor,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setTags([...tags, data.tag])
        setSelectedTags([...selectedTags, data.tag.id])
        setNewTagName('')
        setNewTagColor('#2563eb')
        setShowNewTag(false)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create tag')
      }
    } catch (error) {
      console.error('Create tag error:', error)
      alert('Failed to create tag')
    } finally {
      setCreatingTag(false)
    }
  }

  const predefinedColors = [
    '#2563eb', // blue
    '#fbbf24', // yellow/amber
    '#3b82f6', // light blue
    '#ef4444', // red
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#10b981', // green
    '#6366f1', // indigo
    '#f59e0b', // orange
    '#14b8a6', // teal
  ]

  const handleDeleteTag = async (tagId: string, tagName: string) => {
    if (!confirm(`Are you sure you want to delete the tag "${tagName}"? This will remove it from all equipment.`)) {
      return
    }

    try {
      const response = await fetch(`/api/inventory/tags/${tagId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // Remove from selected tags if it was selected
        setSelectedTags((prev) => prev.filter((id) => id !== tagId))
        // Remove from tags list
        setTags((prev) => prev.filter((tag) => tag.id !== tagId))
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete tag')
      }
    } catch (error) {
      console.error('Delete tag error:', error)
      alert('Failed to delete tag')
    }
  }

  const handleAutoFetchResources = async () => {
    if (!itemId || !manufacturer.trim() || !model.trim() || fetchingResources || hasAutoFetched) {
      return
    }

    setFetchingResources(true)
    setHasAutoFetched(true)

    try {
      const response = await fetch(`/api/inventory/${itemId}/fetch-resources`, {
        method: 'POST',
      })

      if (response.ok) {
        const data = await response.json()
        if (data.imageUrl) {
          setImageUrl(data.imageUrl)
        }
        if (data.documentationLinks && Array.isArray(data.documentationLinks) && data.documentationLinks.length > 0) {
          setDocumentationLinks(data.documentationLinks)
        }
      }
      // Silently fail - don't show error to user for auto-fetch
    } catch (error) {
      console.error('Auto-fetch resources error:', error)
      // Silently fail
    } finally {
      setFetchingResources(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Name *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., LED Par Light"
          className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the equipment..."
          rows={4}
          className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quantity
          </label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            min="1"
            className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g., Tech Office, Storage Room A"
            className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Manufacturer
          </label>
          <input
            type="text"
            value={manufacturer}
            onChange={(e) => setManufacturer(e.target.value)}
            placeholder="e.g., Chauvet, Shure"
            className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Model
          </label>
          <input
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="e.g., COLORado 1-Quad"
            className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Serial Numbers
        </label>
        <p className="text-xs text-gray-500 mb-3">
          Add serial numbers for each individual item (e.g., if you have 6 speakers, add 6 serial numbers)
        </p>
        
        {serialNumbers.length > 0 && (
          <div className="space-y-2 mb-3">
            {serialNumbers.map((serial, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg"
              >
                <span className="flex-1 font-mono text-sm text-gray-900">{serial}</span>
                <button
                  type="button"
                  onClick={() => setSerialNumbers(serialNumbers.filter((_, i) => i !== index))}
                  className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                  title="Remove serial number"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={newSerialNumber}
            onChange={(e) => setNewSerialNumber(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newSerialNumber.trim()) {
                e.preventDefault()
                setSerialNumbers([...serialNumbers, newSerialNumber.trim()])
                setNewSerialNumber('')
              }
            }}
            placeholder="Enter serial number and press Enter"
            className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => {
              if (newSerialNumber.trim()) {
                setSerialNumbers([...serialNumbers, newSerialNumber.trim()])
                setNewSerialNumber('')
              }
            }}
            disabled={!newSerialNumber.trim()}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add
          </Button>
        </div>
      </div>

      {/* Checkout Toggle */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="checkoutEnabled"
          checked={checkoutEnabled}
          onChange={(e) => setCheckoutEnabled(e.target.checked)}
          className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 focus:ring-2 accent-blue-600 cursor-pointer"
          style={{ colorScheme: 'light' }}
        />
        <label htmlFor="checkoutEnabled" className="text-sm font-medium text-gray-700 cursor-pointer">
          Allow staff to request checkout for this item
        </label>
      </div>

      {/* Product Image */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Product Image
        </label>
        {imageUrl ? (
          <div className="mb-3">
            <div className="relative w-full max-w-md h-48 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
              <img
                src={imageUrl}
                alt="Product"
                className="w-full h-full object-contain p-4"
                onError={(e) => {
                  const parent = e.currentTarget.parentElement
                  if (parent) {
                    parent.innerHTML = '<div class="flex items-center justify-center h-full text-gray-500">Image failed to load</div>'
                  }
                }}
              />
            </div>
            {itemId && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleDeleteImage}
                className="mt-2"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Image
              </Button>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-500 mb-2">No image uploaded</p>
        )}
        {itemId && (
          <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors w-fit">
            <ImageIcon className="w-4 h-4" />
            <span className="text-sm">{imageUrl ? 'Replace Image' : 'Upload Image'}</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploadingImage}
              className="hidden"
            />
          </label>
        )}
        {!itemId && (
          <p className="text-sm text-gray-500">Save the equipment first to upload an image</p>
        )}
      </div>

      {/* Documentation */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Documentation
        </label>
        <p className="text-xs text-gray-500 mb-3">
          Upload files or add links to manuals, specifications, and other documentation
        </p>

        {/* Existing Documentation */}
        {(documents.length > 0 || documentationLinks.length > 0) && (
          <div className="space-y-2 mb-4">
            {/* Uploaded Documents */}
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200"
              >
                <Upload className="w-5 h-5 text-green-600" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{doc.fileName}</p>
                  <p className="text-xs text-gray-500 capitalize">{doc.fileType}</p>
                </div>
                <a
                  href={doc.filePath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 text-green-600 hover:text-green-700 hover:bg-green-100 rounded transition-colors"
                  title="Open file"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                {itemId && (
                  <button
                    type="button"
                    onClick={() => handleDeleteDocument(doc.id)}
                    className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                    title="Delete file"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}

            {/* External Links */}
            {documentationLinks.map((doc, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200"
              >
                <FileText className="w-5 h-5 text-blue-600" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{doc.title}</p>
                  <p className="text-xs text-gray-500 truncate">{doc.url}</p>
                  <p className="text-xs text-gray-400 capitalize">{doc.type}</p>
                </div>
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded transition-colors"
                  title="Open link"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  type="button"
                  onClick={() => handleDeleteDocumentationLink(index)}
                  className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                  title="Delete link"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add Documentation Section */}
        <div className="space-y-3">
          {/* Upload File */}
          {itemId ? (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-3 mb-3">
                <Upload className="w-5 h-5 text-gray-600" />
                <h4 className="text-sm font-medium text-gray-900">Upload Document</h4>
              </div>
              <label className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors w-fit">
                <Upload className="w-4 h-4" />
                <span className="text-sm">{uploading ? 'Uploading...' : 'Choose File'}</span>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
              {uploading && (
                <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-500">Save the equipment first to upload documents</p>
            </div>
          )}

          {/* Add External Link */}
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <FileText className="w-5 h-5 text-gray-600" />
              <h4 className="text-sm font-medium text-gray-900">Add External Link</h4>
            </div>
            <div className="space-y-2">
              <input
                type="url"
                value={newDocUrl}
                onChange={(e) => setNewDocUrl(e.target.value)}
                placeholder="Documentation URL (e.g., https://example.com/manual.pdf)"
                className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm text-gray-900"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  placeholder="Title (e.g., User Manual)"
                  className="px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm text-gray-900"
                />
                <select
                  value={newDocType}
                  onChange={(e) => setNewDocType(e.target.value)}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm text-gray-900"
                >
                  <option value="manual">Manual</option>
                  <option value="spec">Specification</option>
                  <option value="datasheet">Datasheet</option>
                  <option value="support">Support</option>
                  <option value="guide">Guide</option>
                </select>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleAddDocumentationLink}
                disabled={!newDocUrl.trim()}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Link
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tags
        </label>
        {tags.length === 0 ? (
          <p className="text-sm text-gray-500 mb-3">
            No tags available. Create your first tag below.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2 mb-3">
            {tags.map((tag) => (
              <div
                key={tag.id}
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium transition-all group ${
                  selectedTags.includes(tag.id)
                    ? 'text-white shadow-md border-2'
                    : 'bg-white border-[0.5px] border-blue-300 text-gray-700 hover:border-blue-400'
                }`}
                style={
                  selectedTags.includes(tag.id)
                    ? { backgroundColor: tag.color, borderColor: tag.color }
                    : {}
                }
              >
                <button
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className="flex-1"
                >
                  {tag.name}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteTag(tag.id, tag.name)
                  }}
                  className={`opacity-0 group-hover:opacity-100 transition-opacity ${
                    selectedTags.includes(tag.id)
                      ? 'text-white hover:text-red-200'
                      : 'text-gray-400 hover:text-red-600'
                  }`}
                  title="Delete tag"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {!showNewTag ? (
          <button
            type="button"
            onClick={() => setShowNewTag(true)}
            className="px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200"
          >
            + Create New Tag
          </button>
        ) : (
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Tag Name
              </label>
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="e.g., lighting, audio, video"
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm text-gray-900"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleCreateTag()
                  }
                }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Color
              </label>
              <div className="flex flex-wrap gap-2">
                {predefinedColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewTagColor(color)}
                    className={`w-8 h-8 rounded-lg border-2 transition-all ${
                      newTagColor === color
                        ? 'border-gray-900 scale-110'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCreateTag}
                disabled={creatingTag || !newTagName.trim()}
                className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {creatingTag ? 'Creating...' : 'Create Tag'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowNewTag(false)
                  setNewTagName('')
                  setNewTagColor('#2563eb')
                }}
                className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        <p className="text-xs text-gray-500 mt-2">
          Click tags to select/deselect. Selected tags will be applied to this equipment.
        </p>
      </div>

      <div className="flex gap-3 pt-4 border-t border-gray-200">
        <Button
          onClick={handleSave}
          disabled={saving || !name.trim()}
          variant="primary"
          className="flex-1"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Equipment
            </>
          )}
        </Button>
        <Button
          onClick={() => router.back()}
          variant="secondary"
        >
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
      </div>
    </div>
  )
}

