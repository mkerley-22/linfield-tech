'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { X, Edit, MoreVertical, Trash2, Database, CheckCircle, ArrowRight, Building2, MapPin, Tag as TagIcon, Plus } from 'lucide-react'
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
      className="fixed inset-0 z-50 flex items-center justify-center md:p-4 bg-black bg-opacity-70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-white md:rounded-lg shadow-xl max-w-2xl w-full h-full md:h-auto md:max-h-[90vh] overflow-y-auto md:animate-none animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {isLoading ? (
          <div className="p-8 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : item ? (
          <>
            {/* Image Section */}
            {item.imageUrl && (
              <div className="relative w-full aspect-square bg-gray-100 md:rounded-t-lg overflow-hidden">
                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 bg-white hover:bg-gray-100 rounded-full shadow-md transition-colors z-10"
                >
                  <X className="w-5 h-5 text-gray-700" />
                </button>
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            {!item.imageUrl && (
              <div className="relative w-full aspect-square bg-gray-100 md:rounded-t-lg overflow-hidden">
                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 bg-white hover:bg-gray-100 rounded-full shadow-md transition-colors z-10"
                >
                  <X className="w-5 h-5 text-gray-700" />
                </button>
              </div>
            )}

            <div className="p-6">
              {/* Title and Actions */}
              <div className="flex items-start justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900 pr-4">{item.name}</h1>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="secondary"
                    onClick={handleEdit}
                    className="flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </Button>
                  <div className="relative">
                    <button
                      onClick={() => setShowOptionsMenu(!showOptionsMenu)}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <MoreVertical className="w-5 h-5 text-gray-500" />
                    </button>
                    {showOptionsMenu && (
                      <>
                        <div 
                          className="fixed inset-0 z-10"
                          onClick={() => setShowOptionsMenu(false)}
                        />
                        <div className="absolute right-0 top-10 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setShowDeleteConfirm(true)
                              setShowOptionsMenu(false)
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Quantity and Availability Section */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                    <Database className="w-6 h-6 text-blue-600" />
                  </div>
                  <p className="text-xs text-gray-600 mb-1">Total Quantity</p>
                  <p className="text-lg font-semibold text-gray-900">{totalQuantity}</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <p className="text-xs text-gray-600 mb-1">Available</p>
                  <p className="text-lg font-semibold text-gray-900">{available}</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-2">
                    <ArrowRight className="w-6 h-6 text-orange-600" />
                  </div>
                  <p className="text-xs text-gray-600 mb-1">Checked Out</p>
                  <p className="text-lg font-semibold text-gray-900">{checkedOut}</p>
                </div>
              </div>

              {/* Metadata Section */}
              <div className="grid grid-cols-3 gap-6 pt-6 border-t border-gray-200">
                {item.manufacturer && (
                  <div className="flex flex-col items-start">
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="w-5 h-5 text-gray-400" />
                      <p className="text-xs text-gray-500">Manufacturer</p>
                    </div>
                    <p className="text-base font-semibold text-gray-900">{item.manufacturer}</p>
                  </div>
                )}
                {item.location && (
                  <div className="flex flex-col items-start">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-5 h-5 text-gray-400" />
                      <p className="text-xs text-gray-500">Location</p>
                    </div>
                    <p className="text-base font-semibold text-gray-900">{item.location}</p>
                  </div>
                )}
                <div className="flex flex-col items-start">
                  <div className="flex items-center gap-2 mb-2">
                    <TagIcon className="w-5 h-5 text-gray-400" />
                    <p className="text-xs text-gray-500">Tags</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {item.tags && item.tags.length > 0 ? (
                      item.tags.map((itemTag) => (
                        <span
                          key={itemTag.tag.id}
                          className="px-3 py-1 rounded-full text-xs font-medium text-white"
                          style={{ backgroundColor: itemTag.tag.color }}
                        >
                          {itemTag.tag.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-gray-400">No tags</span>
                    )}
                  </div>
                </div>
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
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700"
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

