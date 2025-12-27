'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, Search, Package, Plus, X, Check, Loader2, ArrowLeft, Image as ImageIcon } from 'lucide-react'
import Link from 'next/link'
import PWAInstallPrompt from '@/components/PWAInstallPrompt'

interface InventoryItem {
  id: string
  name: string
  description?: string
  quantity: number
  manufacturer?: string
  model?: string
  location?: string
  imageUrl?: string
  InventoryItemTag: Array<{ InventoryTag: { id: string; name: string; color: string } }>
}

export default function MobileInventoryPage() {
  const router = useRouter()
  const [items, setItems] = useState<InventoryItem[]>([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [showCamera, setShowCamera] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    loadInventory()
    
    // Register service worker for PWA
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(console.error)
    }
  }, [search])

  const loadInventory = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      
      const response = await fetch(`/api/inventory?${params}`)
      if (response.ok) {
        const data = await response.json()
        setItems(data.items || [])
      }
    } catch (error) {
      console.error('Failed to load inventory:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // Use back camera on mobile
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setShowCamera(true)
    } catch (error) {
      console.error('Error accessing camera:', error)
      alert('Unable to access camera. Please check permissions.')
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setShowCamera(false)
    setCapturedImage(null)
  }

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current
      const video = videoRef.current
      
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(video, 0, 0)
        const imageData = canvas.toDataURL('image/jpeg', 0.8)
        setCapturedImage(imageData)
        stopCamera()
      }
    }
  }

  const handleUsePhoto = async () => {
    if (!capturedImage || !selectedItem) return

    try {
      // Convert data URL to blob
      const response = await fetch(capturedImage)
      const blob = await response.blob()
      const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' })

      // Upload image
      const formData = new FormData()
      formData.append('image', file)

      const uploadResponse = await fetch(`/api/inventory/${selectedItem.id}/upload-image`, {
        method: 'POST',
        body: formData,
      })

      if (uploadResponse.ok) {
        setCapturedImage(null)
        setSelectedItem(null)
        loadInventory()
        alert('Photo uploaded successfully!')
      } else {
        const error = await uploadResponse.json()
        alert(error.error || 'Failed to upload photo')
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload photo')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between p-4">
          <Link href="/inventory" className="flex items-center text-gray-600">
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span className="text-sm">Back</span>
          </Link>
          <h1 className="text-lg font-semibold text-gray-900">Inventory</h1>
          <div className="w-16"></div> {/* Spacer for centering */}
        </div>
        
        {/* Search Bar */}
        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search inventory..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 z-50 bg-black">
          <div className="relative w-full h-full">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
            
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-6">
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={stopCamera}
                  className="w-14 h-14 rounded-full bg-white flex items-center justify-center"
                >
                  <X className="w-6 h-6 text-gray-900" />
                </button>
                <button
                  onClick={capturePhoto}
                  className="w-20 h-20 rounded-full bg-white border-4 border-gray-300 flex items-center justify-center"
                >
                  <div className="w-16 h-16 rounded-full bg-white border-2 border-gray-400"></div>
                </button>
                <div className="w-14"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Photo Preview Modal */}
      {capturedImage && selectedItem && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <img src={capturedImage} alt="Captured" className="w-full rounded-lg mb-4" />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setCapturedImage(null)
                  setSelectedItem(null)
                }}
                className="flex-1 py-3 bg-gray-700 text-white rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleUsePhoto}
                className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5" />
                Use Photo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inventory List */}
      <div className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No items found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {items.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  setSelectedItem(item)
                  startCamera()
                }}
                className="bg-white rounded-lg border border-gray-200 p-3 active:scale-95 transition-transform"
              >
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-32 object-cover rounded-lg mb-2"
                  />
                ) : (
                  <div className="w-full h-32 bg-gray-100 rounded-lg mb-2 flex items-center justify-center">
                    <Camera className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">
                  {item.name}
                </h3>
                {item.model && (
                  <p className="text-xs text-gray-500 mb-1">{item.model}</p>
                )}
                {item.location && (
                  <p className="text-xs text-gray-500">{item.location}</p>
                )}
                {item.quantity > 1 && (
                  <p className="text-xs text-blue-600 font-medium mt-1">
                    Qty: {item.quantity}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <Link
        href="/inventory/mobile/new"
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform z-40"
      >
        <Plus className="w-6 h-6" />
      </Link>

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
    </div>
  )
}

