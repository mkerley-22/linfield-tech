'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, ArrowLeft, Image as ImageIcon, X } from 'lucide-react'
import Link from 'next/link'

export default function NewMobileInventoryPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [manufacturer, setManufacturer] = useState('')
  const [model, setModel] = useState('')
  const [location, setLocation] = useState('')
  const [saving, setSaving] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setCapturedImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Please enter a name')
      return
    }

    setSaving(true)
    try {
      // First create the item
      const itemData: any = {
        name: name.trim(),
        description: description.trim() || null,
        quantity: parseInt(quantity) || 1,
        manufacturer: manufacturer.trim() || null,
        model: model.trim() || null,
        location: location.trim() || null,
      }

      const createResponse = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData),
      })

      if (!createResponse.ok) {
        const error = await createResponse.json()
        throw new Error(error.error || 'Failed to create item')
      }

      const { item } = await createResponse.json()

      // If we have an image, upload it
      if (capturedImage) {
        try {
          const response = await fetch(capturedImage)
          const blob = await response.blob()
          const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' })

          const formData = new FormData()
          formData.append('image', file)

          await fetch(`/api/inventory/${item.id}/upload-image`, {
            method: 'POST',
            body: formData,
          })
        } catch (imageError) {
          console.error('Failed to upload image:', imageError)
          // Don't fail the whole operation if image upload fails
        }
      }

      router.push('/inventory/mobile')
    } catch (error: any) {
      console.error('Save error:', error)
      alert(error.message || 'Failed to save item')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between p-4">
          <Link href="/inventory/mobile" className="flex items-center text-gray-600">
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span className="text-sm">Cancel</span>
          </Link>
          <h1 className="text-lg font-semibold text-gray-900">New Item</h1>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="text-blue-600 font-medium disabled:text-gray-400 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save'}
          </button>
        </div>
      </div>


      {/* Form */}
      <div className="p-4 space-y-4">
        {/* Photo Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Photo
          </label>
          {capturedImage ? (
            <div className="relative">
              <img
                src={capturedImage}
                alt="Preview"
                className="w-full h-48 object-cover rounded-lg"
              />
              <button
                onClick={() => setCapturedImage(null)}
                className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-32 bg-gray-100 rounded-lg flex flex-col items-center justify-center border-2 border-dashed border-gray-300"
            >
              <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm text-gray-600">Choose Photo</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
              />
            </button>
          )}
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Item name"
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Item description"
            rows={3}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Quantity */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quantity
          </label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            min="1"
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Manufacturer */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Manufacturer
          </label>
          <input
            type="text"
            value={manufacturer}
            onChange={(e) => setManufacturer(e.target.value)}
            placeholder="e.g., QSC, Shure"
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Model */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Model
          </label>
          <input
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="e.g., K12, SM58"
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location
          </label>
          <LocationSelect
            value={location}
            onChange={setLocation}
            placeholder="Select or type location"
          />
        </div>
      </div>
    </div>
  )
}

