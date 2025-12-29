'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { X, Edit, MoreVertical, Trash2, Database, CheckCircle, ArrowRight, Building2, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface LocationBreakdown {
  location: string
  quantity: number
  usage?: string
}

interface InventoryItem {
  id: string
  name: string
  description?: string
  quantity: number
  manufacturer?: string
  model?: string
  location?: string
  locationBreakdowns?: string | LocationBreakdown[] | null
  usageNotes?: string | null
  availableForCheckout?: number | null
  imageUrl?: string
  tags: Array<{ tag: { id: string; name: string; color: string } }>
  checkouts: Array<{
    id: string
    checkedOutBy: string
    checkedOutAt: string
    fromDate?: string
    dueDate?: string
    status: string
  }>
}

interface InventoryDetailModalProps {
  itemId: string | null
  isOpen: boolean
  onClose: () => void
  onDelete?: (itemId: string) => void
}

export default function InventoryDetailModal({ itemId, isOpen, onClose, onDelete }: InventoryDetailModalProps) {
  const router = useRouter()
  const [item, setItem] = useState<InventoryItem | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showOptionsMenu, setShowOptionsMenu] = useState(false)

  useEffect(() => {
    if (isOpen && itemId) {
      loadItem(itemId)
    } else {
      setItem(null)
      setShowDeleteConfirm(false)
      setShowOptionsMenu(false)
    }
  }, [isOpen, itemId])

  const loadItem = async (id: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/inventory/${id}`)
      if (response.ok) {
        const data = await response.json()
        setItem(data.item)
      }
    } catch (error) {
      console.error('Failed to load item:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  // Calculate quantities
  const totalQuantity = item ? (() => {
    if (item.locationBreakdowns) {
      try {
        const breakdowns = typeof item.locationBreakdowns === 'string' 
          ? JSON.parse(item.locationBreakdowns) 
          : item.locationBreakdowns
        if (Array.isArray(breakdowns)) {
          return breakdowns.reduce((sum, b) => sum + (b.quantity || 0), 0)
        }
      } catch (e) {
        // If parsing fails, fall back to quantity
      }
    }
    return item.quantity
  })() : 0

  const checkedOut = item ? (item.checkouts || []).filter((c) => c.status === 'checked_out').length : 0
  const maxAvailable = item ? (item.availableForCheckout ?? totalQuantity) : 0
  const available = Math.max(0, maxAvailable - checkedOut)

  const handleEdit = () => {
    if (item) {
      router.push(`/inventory/${item.id}/edit`)
      onClose()
    }
  }

  const handleDelete = () => {
    if (item && onDelete) {
      onDelete(item.id)
      setShowDeleteConfirm(false)
      onClose()
    }
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-4 bg-black bg-opacity-70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-white md:rounded-lg shadow-xl max-w-2xl w-full h-[calc(100vh-4rem)] md:h-auto md:max-h-[90vh] overflow-hidden md:overflow-y-auto flex flex-col md:animate-none animate-slide-up relative"
        onClick={(e) => e.stopPropagation()}
      >
        {isLoading ? (
          <div className="p-8 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : item ? (
          <>
            {/* Image Section - Limited height on mobile to ensure buttons are visible */}
            {item.imageUrl && (
              <div className="relative max-h-[40vh] md:flex-1 md:min-h-0 bg-gray-100 md:aspect-square md:flex-none md:h-auto md:rounded-t-lg overflow-hidden">
                {/* Top-left: Menu Button */}
                <button
                  onClick={() => setShowOptionsMenu(!showOptionsMenu)}
                  className="absolute top-2 left-2 md:top-4 md:left-4 w-11 h-11 md:w-auto md:h-auto p-1.5 md:p-2 bg-white hover:bg-gray-100 rounded-full shadow-md transition-colors z-10 flex items-center justify-center"
                >
                  <MoreVertical className="w-5 h-5 md:w-5 md:h-5 text-gray-700" />
                </button>
                {/* Top-right: Close Button */}
                <button
                  onClick={onClose}
                  className="absolute top-2 right-2 md:top-4 md:right-4 w-11 h-11 md:w-auto md:h-auto p-1.5 md:p-2 bg-white hover:bg-gray-100 rounded-full shadow-md transition-colors z-10 flex items-center justify-center"
                >
                  <X className="w-5 h-5 md:w-5 md:h-5 text-gray-700" />
                </button>
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            {!item.imageUrl && (
              <div className="relative max-h-[40vh] md:flex-1 md:min-h-0 bg-gray-100 md:aspect-square md:flex-none md:h-auto md:rounded-t-lg overflow-hidden">
                {/* Top-left: Menu Button */}
                <button
                  onClick={() => setShowOptionsMenu(!showOptionsMenu)}
                  className="absolute top-2 left-2 md:top-4 md:left-4 w-11 h-11 md:w-auto md:h-auto p-1.5 md:p-2 bg-white hover:bg-gray-100 rounded-full shadow-md transition-colors z-10 flex items-center justify-center"
                >
                  <MoreVertical className="w-5 h-5 md:w-5 md:h-5 text-gray-700" />
                </button>
                {/* Top-right: Close Button */}
                <button
                  onClick={onClose}
                  className="absolute top-2 right-2 md:top-4 md:right-4 w-11 h-11 md:w-auto md:h-auto p-1.5 md:p-2 bg-white hover:bg-gray-100 rounded-full shadow-md transition-colors z-10 flex items-center justify-center"
                >
                  <X className="w-5 h-5 md:w-5 md:h-5 text-gray-700" />
                </button>
              </div>
            )}

            {/* Options Menu */}
            {showOptionsMenu && (
              <>
                <div 
                  className="fixed inset-0 z-10"
                  onClick={() => setShowOptionsMenu(false)}
                />
                <div className="absolute left-2 top-12 md:left-4 md:top-12 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowDeleteConfirm(true)
                      setShowOptionsMenu(false)
                    }}
                    className="w-full px-4 py-2 min-h-[44px] md:min-h-0 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </>
            )}

            {/* Content Section - Always visible */}
            <div className="px-6 pb-20 md:pb-6 md:px-10 flex flex-col bg-white flex-shrink-0 overflow-y-auto">
              {/* Brand Name - Blue text */}
              {item.manufacturer && (
                <div className="mb-1">
                  <p className="text-sm md:text-base text-blue-600 font-medium">{item.manufacturer}</p>
                </div>
              )}
              {/* Product Name - Below brand */}
              <div className="mb-4 md:mb-6">
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">{item.name}</h1>
              </div>

              {/* Quantity and Availability Section */}
              <div className="grid grid-cols-3 gap-2 md:gap-4 mb-4 md:mb-6">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-full flex items-center justify-center mb-1 md:mb-2">
                    <Database className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
                  </div>
                  <p className="text-[10px] md:text-xs text-gray-600 mb-0.5 md:mb-1">Total Quantity</p>
                  <p className="text-base md:text-lg font-semibold text-gray-900">{totalQuantity}</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-green-100 rounded-full flex items-center justify-center mb-1 md:mb-2">
                    <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
                  </div>
                  <p className="text-[10px] md:text-xs text-gray-600 mb-0.5 md:mb-1">Available</p>
                  <p className="text-base md:text-lg font-semibold text-gray-900">{available}</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-orange-100 rounded-full flex items-center justify-center mb-1 md:mb-2">
                    <ArrowRight className="w-5 h-5 md:w-6 md:h-6 text-orange-600" />
                  </div>
                  <p className="text-[10px] md:text-xs text-gray-600 mb-0.5 md:mb-1">Checked Out</p>
                  <p className="text-base md:text-lg font-semibold text-gray-900">{checkedOut}</p>
                </div>
              </div>

              {/* Metadata Section - Manufacturer and Location in rows */}
              <div className="flex flex-col gap-3 md:gap-4 pt-3 md:pt-6 border-t border-gray-200">
                {item.manufacturer && (
                  <div className="flex items-center gap-2 md:gap-3">
                    <Building2 className="w-4 h-4 md:w-5 md:h-5 text-gray-400 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-[10px] md:text-xs text-gray-500 mb-0.5">Manufacturer</p>
                      <p className="text-sm md:text-base font-semibold text-gray-900">{item.manufacturer}</p>
                    </div>
                  </div>
                )}
                {item.location && (
                  <div className="flex items-center gap-2 md:gap-3">
                    <MapPin className="w-4 h-4 md:w-5 md:h-5 text-gray-400 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-[10px] md:text-xs text-gray-500 mb-0.5">Location</p>
                      <p className="text-sm md:text-base font-semibold text-gray-900">{item.location}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Fixed Bottom Edit Button - Full width, 56px height, black bar with white button */}
            <div className="absolute md:relative bottom-0 left-0 right-0 bg-black md:bg-black z-10">
              <div className="px-4 md:px-10 py-4">
                <button
                  onClick={handleEdit}
                  className="w-full h-14 md:h-14 bg-white hover:bg-gray-100 text-gray-900 font-semibold flex items-center justify-center gap-2 transition-colors rounded-lg"
                >
                  <Edit className="w-5 h-5 md:w-5 md:h-5" />
                  <span>Edit</span>
                </button>
              </div>
            </div>
          </>
        ) : null}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Item</h3>
              <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to delete "{item?.name}"? This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="secondary"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="min-h-[44px] md:min-h-0"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700 min-h-[44px] md:min-h-0"
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

