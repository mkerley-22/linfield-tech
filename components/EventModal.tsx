'use client'

import { useState, useEffect } from 'react'
import { X, Clock, MapPin, Calendar, Sparkles, Loader2, Package, Plus, Trash2 } from 'lucide-react'
import { Button } from './ui/Button'
import { format } from 'date-fns'

interface Equipment {
  name: string
  description: string
  quantity?: number
  category?: string
}

interface InventoryItem {
  id: string
  name: string
  quantity: number
}

interface LinkedInventory {
  id: string
  quantity: number
  inventory: {
    id: string
    name: string
    quantity: number
  }
}

interface Event {
  id: string
  title: string
  description?: string
  startTime: string
  endTime: string
  location?: string
  category?: { name: string; color: string }
  eventType: string
  isAllDay: boolean
}

interface EventModalProps {
  event: Event | null
  isOpen: boolean
  onClose: () => void
}

export default function EventModal({ event, isOpen, onClose }: EventModalProps) {
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [hasAnalyzed, setHasAnalyzed] = useState(false)
  const [savedEquipment, setSavedEquipment] = useState<Equipment[]>([])
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [linkedInventory, setLinkedInventory] = useState<LinkedInventory[]>([])
  const [selectedInventoryId, setSelectedInventoryId] = useState('')
  const [inventoryQuantity, setInventoryQuantity] = useState(1)
  const [isLoadingInventory, setIsLoadingInventory] = useState(false)
  const [isLinking, setIsLinking] = useState(false)

  useEffect(() => {
    if (isOpen && event) {
      // Load saved equipment from event
      if ((event as any).equipment) {
        try {
          const parsed = typeof (event as any).equipment === 'string' 
            ? JSON.parse((event as any).equipment) 
            : (event as any).equipment
          setSavedEquipment(Array.isArray(parsed) ? parsed : [])
        } catch (e) {
          setSavedEquipment([])
        }
      } else {
        setSavedEquipment([])
      }
      
      if (!hasAnalyzed) {
        analyzeEquipment()
      }
      loadInventory()
      loadLinkedInventory()
    }
    if (!isOpen) {
      setEquipment([])
      setHasAnalyzed(false)
      setLinkedInventory([])
      setInventoryItems([])
      setSavedEquipment([])
    }
  }, [isOpen, event])

  const loadInventory = async () => {
    if (!event) return
    setIsLoadingInventory(true)
    try {
      const response = await fetch('/api/inventory')
      if (response.ok) {
        const data = await response.json()
        setInventoryItems(data.items || [])
      }
    } catch (error) {
      console.error('Failed to load inventory:', error)
    } finally {
      setIsLoadingInventory(false)
    }
  }

  const loadLinkedInventory = async () => {
    if (!event) return
    try {
      const response = await fetch(`/api/events/${event.id}/inventory`)
      if (response.ok) {
        const data = await response.json()
        setLinkedInventory(data.inventory || [])
      }
    } catch (error) {
      console.error('Failed to load linked inventory:', error)
    }
  }

  const handleLinkInventory = async () => {
    if (!event || !selectedInventoryId || inventoryQuantity < 1) return

    setIsLinking(true)
    try {
      const response = await fetch(`/api/events/${event.id}/inventory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inventoryId: selectedInventoryId,
          quantity: inventoryQuantity,
        }),
      })

      if (response.ok) {
        await loadLinkedInventory()
        setSelectedInventoryId('')
        setInventoryQuantity(1)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to link inventory')
      }
    } catch (error) {
      console.error('Error linking inventory:', error)
      alert('Failed to link inventory')
    } finally {
      setIsLinking(false)
    }
  }

  const handleUnlinkInventory = async (inventoryId: string) => {
    if (!event || !confirm('Remove this inventory item from the event?')) return

    try {
      const response = await fetch(`/api/events/${event.id}/inventory?inventoryId=${inventoryId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await loadLinkedInventory()
      } else {
        alert('Failed to unlink inventory')
      }
    } catch (error) {
      console.error('Error unlinking inventory:', error)
      alert('Failed to unlink inventory')
    }
  }

  const analyzeEquipment = async () => {
    if (!event) return

    setIsAnalyzing(true)
    try {
      const response = await fetch(`/api/events/${event.id}/analyze-equipment`, {
        method: 'POST',
      })

      if (response.ok) {
        const data = await response.json()
        setEquipment(data.equipment || [])
        setHasAnalyzed(true)
      } else {
        console.error('Failed to analyze equipment')
      }
    } catch (error) {
      console.error('Error analyzing equipment:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  if (!isOpen || !event) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-900">{event.title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Event Details */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="w-5 h-5" />
              <span>
                {event.isAllDay
                  ? format(new Date(event.startTime), 'EEEE, MMMM d, yyyy')
                  : `${format(new Date(event.startTime), 'EEEE, MMMM d, yyyy h:mm a')} - ${format(new Date(event.endTime), 'h:mm a')}`}
              </span>
            </div>
            
            {event.location && (
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="w-5 h-5" />
                <span>{event.location}</span>
              </div>
            )}

            {event.category && (
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-600" />
                <span
                  className="px-3 py-1 text-sm rounded-full font-medium"
                  style={{
                    backgroundColor: `${event.category.color}20`,
                    color: event.category.color,
                  }}
                >
                  {event.category.name}
                </span>
              </div>
            )}
          </div>

          {/* Description */}
          {event.description && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{event.description}</p>
            </div>
          )}

          {/* Equipment Needed */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Equipment Needed</h3>
              {!hasAnalyzed && savedEquipment.length === 0 && (
                <Button
                  onClick={analyzeEquipment}
                  disabled={isAnalyzing}
                  variant="secondary"
                  size="sm"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Analyze Equipment
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Display saved equipment first */}
            {savedEquipment.length > 0 && (
              <div className="space-y-3 mb-4">
                {savedEquipment.map((item, index) => (
                  <div
                    key={`saved-${index}`}
                    className="bg-green-50 border border-green-200 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{item.name}</h4>
                      {item.quantity && (
                        <span className="px-2 py-1 bg-green-600 text-white text-xs font-medium rounded-full">
                          Qty: {item.quantity}
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-sm text-gray-700 mb-2">{item.description}</p>
                    )}
                    {item.category && (
                      <span className="inline-block px-2 py-1 bg-white text-xs text-gray-600 rounded border border-green-200">
                        {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* AI Analyzed Equipment */}
            {isAnalyzing && !hasAnalyzed ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Analyzing event description...</p>
                </div>
              </div>
            ) : equipment.length > 0 ? (
              <div className="space-y-3">
                {equipment.map((item, index) => (
                  <div
                    key={`analyzed-${index}`}
                    className="bg-blue-50 border border-blue-200 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{item.name}</h4>
                      {item.quantity && (
                        <span className="px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded-full">
                          Qty: {item.quantity}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{item.description}</p>
                    {item.category && (
                      <span className="inline-block px-2 py-1 bg-white text-xs text-gray-600 rounded border border-blue-200">
                        {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : hasAnalyzed && savedEquipment.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No specific equipment requirements identified for this event.</p>
              </div>
            ) : savedEquipment.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>Click &quot;Analyze Equipment&quot; to generate equipment requirements.</p>
              </div>
            ) : null}
          </div>

          {/* Linked Inventory */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Linked Inventory</h3>
            
            {linkedInventory.length > 0 && (
              <div className="space-y-2 mb-4">
                {linkedInventory.map((link) => (
                  <div
                    key={link.id}
                    className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Package className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-medium text-gray-900">{link.inventory.name}</p>
                        <p className="text-xs text-gray-500">Quantity: {link.quantity}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleUnlinkInventory(link.inventory.id)}
                      className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                      title="Remove from event"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-3">
              <div className="flex gap-2">
                <select
                  value={selectedInventoryId}
                  onChange={(e) => setSelectedInventoryId(e.target.value)}
                  className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm text-gray-900"
                  disabled={isLoadingInventory}
                >
                  <option value="">Select inventory item...</option>
                  {inventoryItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} (Available: {item.quantity})
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="1"
                  value={inventoryQuantity}
                  onChange={(e) => setInventoryQuantity(parseInt(e.target.value) || 1)}
                  className="w-24 px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm text-gray-900"
                  placeholder="Qty"
                />
                <Button
                  onClick={handleLinkInventory}
                  disabled={!selectedInventoryId || inventoryQuantity < 1 || isLinking}
                  variant="secondary"
                  size="sm"
                >
                  {isLinking ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Add
                    </>
                  )}
                </Button>
              </div>
              {linkedInventory.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No inventory items linked to this event yet.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <a
            href={`/events/${event.id}/edit`}
            className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
          >
            Edit Event
          </a>
          <div className="flex gap-3">
            <Button onClick={onClose} variant="secondary">
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

