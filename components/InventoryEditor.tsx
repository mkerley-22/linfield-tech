'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Save, X, Loader2, Upload, FileText, XCircle, Image as ImageIcon, ExternalLink, Plus, Trash2 } from 'lucide-react'
import { Button } from './ui/Button'
import LocationSelect from './LocationSelect'

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
    locationBreakdowns?: string | Array<{ location: string; quantity: number }>
    usageNotes?: string
    availableForCheckout?: number | null
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
  // Calculate total quantity from location breakdowns, or use initial quantity
  const [quantity, setQuantity] = useState(() => {
    if (initialData?.locationBreakdowns) {
      try {
        let breakdowns: Array<{ quantity: number }> = []
        if (typeof initialData.locationBreakdowns === 'string') {
          breakdowns = JSON.parse(initialData.locationBreakdowns)
        } else if (Array.isArray(initialData.locationBreakdowns)) {
          breakdowns = initialData.locationBreakdowns
        }
        const total = breakdowns.reduce((sum, b) => sum + (b.quantity || 0), 0)
        return total || initialData?.quantity || 1
      } catch {
        return initialData?.quantity || 1
      }
    }
    return initialData?.quantity || 1
  })
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
  const [locationBreakdowns, setLocationBreakdowns] = useState<Array<{ location: string; quantity: number; usage?: string }>>(() => {
    if (!initialData?.locationBreakdowns) return []
    try {
      if (typeof initialData.locationBreakdowns === 'string') {
        const parsed = JSON.parse(initialData.locationBreakdowns)
        // If old format (without usage), convert to new format
        return Array.isArray(parsed) ? parsed.map((item: any) => ({
          location: item.location || '',
          quantity: item.quantity || 1,
          usage: item.usage || item.usage || ''
        })) : []
      }
      return Array.isArray(initialData.locationBreakdowns) ? initialData.locationBreakdowns.map((item: any) => ({
        location: item.location || '',
        quantity: item.quantity || 1,
        usage: item.usage || ''
      })) : []
    } catch {
      return []
    }
  })
  const [newRowQuantity, setNewRowQuantity] = useState(1) // Quantity for new row input
  const [newRowUsage, setNewRowUsage] = useState('') // Usage for new row input
  const [availableForCheckout, setAvailableForCheckout] = useState<number | null>(initialData?.availableForCheckout ?? null)
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
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null) // Store image file before saving
  const [pendingImagePreview, setPendingImagePreview] = useState<string>('') // Preview URL for pending image
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
  const [pendingDocuments, setPendingDocuments] = useState<File[]>([]) // Store document files before saving

  useEffect(() => {
    loadTags()
  }, [])

  // Clean up pending image preview URL when component unmounts or image changes
  useEffect(() => {
    return () => {
      if (pendingImagePreview) {
        URL.revokeObjectURL(pendingImagePreview)
      }
    }
  }, [pendingImagePreview])

  // Shared function to process image file (used by both file upload and paste)
  const processImageFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // If itemId exists, upload immediately
    if (itemId) {
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
          setPendingImageFile(null)
          if (pendingImagePreview) {
            URL.revokeObjectURL(pendingImagePreview)
            setPendingImagePreview('')
          }
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
      }
    } else {
      // If no itemId, store file for later upload after saving
      setPendingImageFile(file)
      const previewUrl = URL.createObjectURL(file)
      setPendingImagePreview(previewUrl)
    }
  }

  // Handle paste events for image upload
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return

      // Look for image in clipboard
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          e.preventDefault()
          const blob = items[i].getAsFile()
          if (blob) {
            // Create a File object from the blob
            const file = new File([blob], `pasted-image-${Date.now()}.png`, { type: blob.type })
            await processImageFile(file)
          }
          break
        }
      }
    }

    // Add paste listener to the document
    document.addEventListener('paste', handlePaste)
    
    return () => {
      document.removeEventListener('paste', handlePaste)
    }
  }, [itemId, pendingImagePreview])

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
          location: locationBreakdowns.length > 0 ? locationBreakdowns[0].location : location, // Keep for backward compatibility
          locationBreakdowns: locationBreakdowns.length > 0 ? JSON.stringify(locationBreakdowns) : null,
          usageNotes: locationBreakdowns.length > 0 
            ? locationBreakdowns.map(b => b.usage).filter(Boolean).join('; ') 
            : null, // Combine all usage notes from location breakdowns
          availableForCheckout: availableForCheckout || null,
          checkoutEnabled,
          quantity: locationBreakdowns.length > 0 
            ? locationBreakdowns.reduce((sum, b) => sum + (b.quantity || 0), 0)
            : quantity, // Calculate total from location breakdowns
          tagIds: selectedTags,
          imageUrl: imageUrl || null,
          documentationLinks: documentationLinks.length > 0 ? JSON.stringify(documentationLinks) : null,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const savedItemId = data.item.id

        // Upload pending image if exists
        if (pendingImageFile) {
          try {
            const imageFormData = new FormData()
            imageFormData.append('image', pendingImageFile)
            const imageResponse = await fetch(`/api/inventory/${savedItemId}/upload-image`, {
              method: 'POST',
              body: imageFormData,
            })
            if (imageResponse.ok) {
              const imageData = await imageResponse.json()
              setImageUrl(imageData.imageUrl)
              setPendingImageFile(null)
              if (pendingImagePreview) {
                URL.revokeObjectURL(pendingImagePreview)
                setPendingImagePreview('')
              }
            }
          } catch (error) {
            console.error('Failed to upload pending image:', error)
          }
        }

        // Upload pending documents if any
        if (pendingDocuments.length > 0) {
          try {
            for (const docFile of pendingDocuments) {
              const docFormData = new FormData()
              docFormData.append('file', docFile)
              const docResponse = await fetch(`/api/inventory/${savedItemId}/documents`, {
                method: 'POST',
                body: docFormData,
              })
              if (docResponse.ok) {
                const docData = await docResponse.json()
                setDocuments(prev => [...prev, docData.document])
              }
            }
            setPendingDocuments([])
          } catch (error) {
            console.error('Failed to upload pending documents:', error)
          }
        }

        if (itemId) {
          alert('Inventory item updated successfully!')
          router.refresh()
        } else {
          // Redirect to inventory page with success message
          router.push('/inventory?created=true')
        }
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
    if (!file) return

    await processImageFile(file)
    e.target.value = '' // Clear the input so the same file can be selected again
  }

  const handleDeleteImage = async () => {
    // If pending image, just remove it
    if (pendingImageFile) {
      setPendingImageFile(null)
      if (pendingImagePreview) {
        URL.revokeObjectURL(pendingImagePreview)
        setPendingImagePreview('')
      }
      return
    }

    // If saved image, delete from server
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
    if (!file) return

    if (!file.type) {
      alert('Could not determine file type. Please select a valid document.')
      return
    }

    // If itemId exists, upload immediately
    if (itemId) {
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
    } else {
      // If no itemId, store file for later upload after saving
      setPendingDocuments(prev => [...prev, file])
      alert(`Document "${file.name}" added! It will be uploaded when you save the item.`)
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

  const handleDeletePendingDocument = (index: number) => {
    setPendingDocuments(pendingDocuments.filter((_, i) => i !== index))
    alert('Pending document removed')
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
        body: JSON.stringify({ name: newTagName.trim().toLowerCase(), color: newTagColor }),
      })

      if (response.ok) {
        const data = await response.json()
        setTags((prev) => [...prev, data.tag])
        setSelectedTags((prev) => [...prev, data.tag.id])
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

      {/* Quantity, Location, and Usage Rows */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Inventory Locations
        </label>
        <p className="text-xs text-gray-500 mb-3">
          Add items by quantity, location, and usage. Total quantity is calculated automatically.
        </p>
        <div className="space-y-3">
          {locationBreakdowns.length === 0 ? (
            <div className="flex items-end gap-2">
              <div className="w-24">
                <label className="block text-xs font-medium text-gray-600 mb-1">Quantity</label>
                <input
                  type="number"
                  value={newRowQuantity}
                  onChange={(e) => {
                    const val = e.target.value
                    if (val === '') {
                      setNewRowQuantity(1)
                    } else {
                      const num = parseInt(val)
                      setNewRowQuantity(isNaN(num) ? 1 : num)
                    }
                  }}
                  onFocus={(e) => e.target.select()}
                  min="1"
                  max="999"
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 text-sm"
                  placeholder="100"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-600 mb-1">Location</label>
                <LocationSelect
                  value={location}
                  onChange={setLocation}
                  placeholder="Select or type location"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-600 mb-1">Usage</label>
                <input
                  type="text"
                  value={newRowUsage}
                  onChange={(e) => setNewRowUsage(e.target.value)}
                  placeholder="e.g., For basketball games"
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 text-sm"
                />
              </div>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => {
                  if (newRowQuantity > 0 && location) {
                    const newBreakdown = { location, quantity: newRowQuantity, usage: newRowUsage }
                    setLocationBreakdowns([newBreakdown])
                    setLocation('')
                    setNewRowUsage('')
                    setNewRowQuantity(1)
                    setQuantity(newRowQuantity)
                  } else {
                    alert('Please enter quantity and location before adding')
                  }
                }}
                className="mb-0"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <>
              {locationBreakdowns.map((breakdown, index) => (
                <div key={index} className="flex items-end gap-2">
                  <div className="w-24">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Quantity</label>
                    <input
                      type="number"
                      value={breakdown.quantity}
                      onChange={(e) => {
                        const updated = [...locationBreakdowns]
                        updated[index].quantity = parseInt(e.target.value) || 1
                        setLocationBreakdowns(updated)
                        // Update total quantity
                        const total = updated.reduce((sum, b) => sum + (b.quantity || 0), 0)
                        setQuantity(total)
                      }}
                      onFocus={(e) => e.target.select()}
                      min="1"
                      max="999"
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 text-sm"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Location</label>
                    <LocationSelect
                      value={breakdown.location}
                      onChange={(value) => {
                        const updated = [...locationBreakdowns]
                        updated[index].location = value
                        setLocationBreakdowns(updated)
                      }}
                      placeholder="Select or type location"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Usage</label>
                    <input
                      type="text"
                      value={breakdown.usage || ''}
                      onChange={(e) => {
                        const updated = [...locationBreakdowns]
                        updated[index].usage = e.target.value
                        setLocationBreakdowns(updated)
                      }}
                      placeholder="e.g., For basketball games"
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 text-sm"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = locationBreakdowns.filter((_, i) => i !== index)
                      setLocationBreakdowns(updated)
                      // Update total quantity
                      const total = updated.reduce((sum, b) => sum + (b.quantity || 0), 0)
                      setQuantity(total || 1)
                    }}
                    className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors mb-0"
                    title="Remove row"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <div className="flex items-end gap-2">
                <div className="w-24">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Quantity</label>
                  <input
                    type="number"
                    value={newRowQuantity}
                    onChange={(e) => {
                      const val = e.target.value
                      if (val === '') {
                        setNewRowQuantity(1)
                      } else {
                        const num = parseInt(val)
                        setNewRowQuantity(isNaN(num) ? 1 : num)
                      }
                    }}
                    onFocus={(e) => e.target.select()}
                    min="1"
                    max="999"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 text-sm"
                    placeholder="100"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Location</label>
                  <LocationSelect
                    value={location}
                    onChange={setLocation}
                    placeholder="Select or type location"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Usage</label>
                  <input
                    type="text"
                    value={newRowUsage}
                    onChange={(e) => setNewRowUsage(e.target.value)}
                    placeholder="e.g., For basketball games"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 text-sm"
                  />
                </div>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    if (newRowQuantity > 0 && location) {
                      const newBreakdown = { location, quantity: newRowQuantity, usage: newRowUsage }
                      const updated = [...locationBreakdowns, newBreakdown]
                      setLocationBreakdowns(updated)
                      setLocation('')
                      setNewRowUsage('')
                      setNewRowQuantity(1)
                      // Update total quantity
                      const total = updated.reduce((sum, b) => sum + (b.quantity || 0), 0)
                      setQuantity(total)
                    } else {
                      alert('Please enter quantity and location before adding')
                    }
                  }}
                  className="mb-0"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </>
          )}
        </div>
        {locationBreakdowns.length > 0 && (
          <p className="text-xs text-gray-500 mt-2">
            Total Quantity: <span className="font-medium text-gray-700">
              {locationBreakdowns.reduce((sum, b) => sum + (b.quantity || 0), 0)}
            </span>
          </p>
        )}
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
          Allow staff to checkout
        </label>
      </div>

      {/* Available for Checkout */}
      {checkoutEnabled && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Available for Checkout
          </label>
          <p className="text-xs text-gray-500 mb-2">
            Number of items available for checkout (leave empty to use total quantity: {quantity})
          </p>
          <input
            type="number"
            value={availableForCheckout ?? ''}
            onChange={(e) => {
              const val = e.target.value
              if (val === '') {
                setAvailableForCheckout(null)
              } else {
                const num = parseInt(val)
                setAvailableForCheckout(isNaN(num) ? null : Math.min(num, quantity))
              }
            }}
            onFocus={(e) => e.target.select()}
            min="1"
            max={quantity}
            placeholder={`Default: ${quantity} (all items)`}
            className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        <div className="space-y-2">
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
            className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
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
            className="w-full"
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
        <p className="text-xs text-gray-500 mb-2">
          Upload an image file or paste an image from your clipboard (Cmd+V / Ctrl+V)
        </p>
        {(imageUrl || pendingImagePreview) ? (
          <div className="group relative w-64 aspect-square bg-gray-200 rounded-2xl overflow-hidden border border-gray-300">
            <img
              src={pendingImagePreview || imageUrl}
              alt="Product"
              className="w-full h-full object-cover"
              onError={(e) => {
                const parent = e.currentTarget.parentElement
                if (parent) {
                  parent.innerHTML = '<div class="flex items-center justify-center h-full text-gray-500">Image failed to load</div>'
                }
              }}
            />
            
            {/* Hover Overlay with Replace and Delete buttons */}
            {(itemId || pendingImageFile) && (
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                <label className="px-4 py-2 bg-white rounded-lg cursor-pointer hover:bg-gray-50 transition-colors shadow-sm">
                  <ImageIcon className="w-4 h-4 inline mr-2" />
                  <span className="text-sm font-medium text-gray-900">Replace</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                    className="hidden"
                  />
                </label>
                <button
                  type="button"
                  onClick={handleDeleteImage}
                  className="px-4 py-2 bg-white rounded-lg hover:bg-red-50 transition-colors shadow-sm"
                >
                  <Trash2 className="w-4 h-4 inline mr-2 text-red-600" />
                  <span className="text-sm font-medium text-red-600">Delete</span>
                </button>
              </div>
            )}
          </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-64 aspect-square bg-gray-200 rounded-2xl border-2 border-dashed border-gray-400 cursor-pointer hover:border-blue-500 hover:bg-gray-300 transition-colors">
                <ImageIcon className="w-12 h-12 text-gray-500 mb-2" />
                <span className="text-sm text-gray-700 font-medium">Upload Image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  className="hidden"
                />
              </label>
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
        {(documents.length > 0 || documentationLinks.length > 0 || pendingDocuments.length > 0) && (
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
                  className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded transition-colors"
                  title="Open document"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  type="button"
                  onClick={() => handleDeleteDocument(doc.id)}
                  className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                  title="Delete document"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}

            {/* Pending Documents */}
            {pendingDocuments.map((file, index) => (
              <div
                key={`pending-${index}`}
                className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200"
              >
                <Upload className="w-5 h-5 text-yellow-600" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                  <p className="text-xs text-gray-600">{`${(file.size / 1024).toFixed(2)} KB`}</p>
                  <p className="text-xs text-yellow-800">Pending upload</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeletePendingDocument(index)}
                  className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                  title="Remove pending document"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}

            {/* Documentation Links */}
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

          {/* Add External Link */}
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <FileText className="w-5 h-5 text-gray-600" />
              <h4 className="text-sm font-medium text-gray-900">Add External Link</h4>
            </div>
            <div className="space-y-2">
              <div>
                <label htmlFor="newDocUrl" className="sr-only">URL</label>
                <input
                  type="url"
                  id="newDocUrl"
                  value={newDocUrl}
                  onChange={(e) => setNewDocUrl(e.target.value)}
                  placeholder="Documentation URL (e.g., https://example.com/manual.pdf)"
                  className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                />
              </div>
              <div>
                <label htmlFor="newDocTitle" className="sr-only">Title</label>
                <input
                  type="text"
                  id="newDocTitle"
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  placeholder="Title (e.g., User Manual)"
                  className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                />
              </div>
              <div>
                <label htmlFor="newDocType" className="sr-only">Type</label>
                <select
                  id="newDocType"
                  value={newDocType}
                  onChange={(e) => setNewDocType(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                >
                  <option value="manual">Manual</option>
                  <option value="spec">Specifications</option>
                  <option value="datasheet">Datasheet</option>
                  <option value="guide">Guide</option>
                  <option value="support">Support Page</option>
                  <option value="link">Other Link</option>
                </select>
              </div>
              <Button
                type="button"
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

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
        {tags.length === 0 ? (
          <p className="text-sm text-gray-500 mb-3">
            No tags available. Create your first tag below.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2 mb-3">
            {tags.map((tag) => (
              <div
                key={tag.id}
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium transition-all group cursor-pointer ${
                  selectedTags.includes(tag.id)
                    ? 'text-white shadow-md border-2'
                    : 'bg-white border-[0.5px] border-blue-300 text-gray-700 hover:border-blue-400'
                }`}
                style={
                  selectedTags.includes(tag.id)
                    ? { backgroundColor: tag.color, borderColor: tag.color }
                    : {}
                }
                onClick={(e) => {
                  // Only toggle if clicking on the tag name area, not the delete button
                  if ((e.target as HTMLElement).closest('button[data-delete-tag]')) {
                    return
                  }
                  toggleTag(tag.id)
                }}
              >
                <span className="flex-1">
                  {tag.name}
                </span>
                <button
                  type="button"
                  data-delete-tag
                  onClick={(e) => {
                    e.stopPropagation()
                    e.preventDefault()
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

        {showNewTag && (
          <div className="flex flex-col sm:flex-row gap-2 mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="New tag name"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <input
              type="color"
              value={newTagColor}
              onChange={(e) => setNewTagColor(e.target.value)}
              className="w-10 h-10 p-1 border border-gray-300 rounded-lg cursor-pointer"
              title="Choose tag color"
            />
            <Button
              type="button"
              onClick={handleCreateTag}
              disabled={creatingTag || !newTagName.trim()}
              className="flex-shrink-0"
            >
              {creatingTag ? 'Creating...' : 'Create Tag'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowNewTag(false)}
              className="flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        {!showNewTag && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setShowNewTag(!showNewTag)}
            className="flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            New Tag
          </Button>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-3 pt-4 border-t border-gray-200">
        <Button
          onClick={handleSave}
          disabled={saving || !name.trim()}
          variant="primary"
          className="w-full md:flex-1"
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
          className="w-full md:w-auto"
        >
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
      </div>
    </div>
  )
}
