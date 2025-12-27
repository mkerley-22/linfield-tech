'use client'

import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Edit, ArrowLeft, Package, Calendar, User, Clock, CheckCircle, XCircle, Download, Plus, FileText, Image as ImageIcon, ExternalLink, Loader2, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { format } from 'date-fns'

interface InventoryItem {
  id: string
  name: string
  description?: string
  quantity: number
  manufacturer?: string
  model?: string
  serialNumbers?: string | null
  location?: string
  lastUsedAt?: string
  lastUsedBy?: string
  imageUrl?: string
  documentationLinks?: string
  tags: Array<{ tag: { id: string; name: string; color: string } }>
  documents: Array<{ id: string; fileName: string; filePath: string; fileType: string }>
  checkouts: Array<{
    id: string
    checkedOutBy: string
    checkedOutAt: string
    fromDate?: string
    dueDate?: string
    status: string
  }>
  eventItems: Array<{
    id: string
    quantity: number
    event: {
      id: string
      title: string
      startTime: string
      endTime: string
    }
  }>
}

export default function InventoryDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [item, setItem] = useState<InventoryItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showCheckout, setShowCheckout] = useState(false)
  const [checkoutName, setCheckoutName] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [checkoutQuantity, setCheckoutQuantity] = useState(1)
  const [checkingOut, setCheckingOut] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    loadItem(params.id)
    
    // Listen for checkout updates from other pages
    const handleCheckoutUpdate = () => {
      loadItem(params.id)
    }
    window.addEventListener('checkoutRequestUpdated', handleCheckoutUpdate)
    window.addEventListener('checkoutStatusUpdated', handleCheckoutUpdate)
    
    return () => {
      window.removeEventListener('checkoutRequestUpdated', handleCheckoutUpdate)
      window.removeEventListener('checkoutStatusUpdated', handleCheckoutUpdate)
    }
  }, [params.id])

  const loadItem = async (id: string) => {
    if (!id) return
    
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

  const handleCheckout = async () => {
    if (!checkoutName.trim()) {
      alert('Please enter your name')
      return
    }

    if (!fromDate || !toDate) {
      alert('Please select both start and end dates')
      return
    }

    if (checkoutQuantity < 1) {
      alert('Please select a quantity of at least 1')
      return
    }

    if (checkoutQuantity > available) {
      alert(`Only ${available} items are available`)
      return
    }

    setCheckingOut(true)
    try {
      // Create multiple checkouts if quantity > 1
      const promises = []
      for (let i = 0; i < checkoutQuantity; i++) {
        promises.push(
          fetch('/api/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              inventoryId: params.id,
              checkedOutBy: checkoutName,
              fromDate,
              toDate,
            }),
          })
        )
      }

      const responses = await Promise.all(promises)
      const errors = []

      for (const response of responses) {
        if (!response.ok) {
          const error = await response.json()
          errors.push(error.error || 'Failed to checkout equipment')
        }
      }

      if (errors.length > 0) {
        alert(`Some checkouts failed: ${errors.join(', ')}`)
      } else {
        alert(`Successfully checked out ${checkoutQuantity} item(s)!`)
        setShowCheckout(false)
        setCheckoutName('')
        setFromDate('')
        setToDate('')
        setCheckoutQuantity(1)
        loadItem(params.id)
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Failed to checkout equipment')
    } finally {
      setCheckingOut(false)
    }
  }

  const handleReturn = async (checkoutId: string) => {
    if (!confirm('Mark this item as returned?')) return

    try {
      const response = await fetch(`/api/checkout/${checkoutId}/return`, {
        method: 'POST',
      })

      if (response.ok) {
        const data = await response.json()
        // Force reload the item to update checkout history and availability
        await loadItem(params.id)
        // Dispatch event to refresh inventory list page
        window.dispatchEvent(new CustomEvent('inventoryUpdated'))
        alert('Item marked as returned successfully!')
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to return item')
      }
    } catch (error) {
      console.error('Return error:', error)
      alert('Failed to return item')
    }
  }

  const handleDelete = async () => {
    if (!item) return

    setDeleting(true)
    try {
      const response = await fetch(`/api/inventory/${item.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.push('/inventory')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete item')
        setDeleting(false)
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete item')
      setDeleting(false)
    }
  }


  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto p-8">
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-pulse" />
              <p className="text-gray-500">Loading...</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (!item) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto p-8">
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Equipment not found</h3>
              <Link href="/inventory">
                <Button variant="primary">Back to Inventory</Button>
              </Link>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Calculate available quantity - only count checkouts with 'checked_out' status
  // 'returned' status should not count against availability
  const checkedOut = (item.checkouts || []).filter((c) => c.status === 'checked_out').length
  const available = Math.max(0, item.quantity - checkedOut)
  
  // Debug logging to help troubleshoot
  if (process.env.NODE_ENV === 'development') {
    console.log('Item availability calculation:', {
      itemName: item.name,
      quantity: item.quantity,
      totalCheckouts: item.checkouts?.length || 0,
      checkedOutCount: checkedOut,
      returnedCount: (item.checkouts || []).filter((c) => c.status === 'returned').length,
      available,
      checkouts: item.checkouts?.map(c => ({ id: c.id, status: c.status, checkedOutBy: c.checkedOutBy }))
    })
  }
  const upcomingEvents = (item.eventItems || [])
    .filter((ei) => new Date(ei.event.startTime) >= new Date())
    .sort((a, b) => new Date(a.event.startTime).getTime() - new Date(b.event.startTime).getTime())

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-8">
          <Link
            href="/inventory"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Inventory
          </Link>

          <div className="bg-white rounded-lg border border-gray-200 p-8 mb-6">
            <div className="mb-6">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">{item.name}</h1>
              {item.description && (
                <p className="text-lg text-gray-600 mb-4">{item.description}</p>
              )}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  onClick={() => router.push(`/inventory/${item.id}/edit`)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="!bg-pink-50 !border !border-red-300 !text-red-600 hover:!bg-red-600 hover:!text-white hover:!border-red-600"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
                {available > 0 && (
                  <Button
                    variant="primary"
                    onClick={() => setShowCheckout(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Checkout
                  </Button>
                )}
              </div>
            </div>

            {/* Product Image */}
            {item.imageUrl && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  Product Image
                </h3>
                <div className="relative w-full max-w-md h-64 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                  <img
                    src={item.imageUrl}
                    alt={`${item.name} product image`}
                    className="w-full h-full object-contain p-4"
                    onError={(e) => {
                      // Show error message if image fails to load
                      const parent = e.currentTarget.parentElement
                      if (parent) {
                        parent.innerHTML = '<div class="flex items-center justify-center h-full text-gray-500">Image failed to load</div>'
                      }
                    }}
                  />
                </div>
              </div>
            )}

            {/* Documentation Links */}
            {item.documentationLinks && (() => {
              try {
                const docs = JSON.parse(item.documentationLinks)
                if (Array.isArray(docs) && docs.length > 0) {
                  return (
                    <div className="mb-6">
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Documentation
                      </h3>
                      <div className="space-y-2">
                        {docs.map((doc: any, index: number) => (
                          <a
                            key={index}
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200"
                          >
                            <FileText className="w-5 h-5 text-blue-600" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">{doc.title || 'Documentation'}</p>
                              <p className="text-xs text-gray-500 capitalize">{doc.type || 'link'}</p>
                            </div>
                            <ExternalLink className="w-4 h-4 text-blue-600" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )
                }
              } catch (e) {
                return null
              }
              return null
            })()}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Total Quantity</p>
                <p className="text-2xl font-bold text-gray-900">{item.quantity}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Available</p>
                <p className="text-2xl font-bold text-green-600">{available}</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Checked Out</p>
                <p className="text-2xl font-bold text-blue-600">{checkedOut}</p>
              </div>
              {item.lastUsedAt && (
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Last Used</p>
                  <p className="text-sm font-semibold text-purple-600">
                    {format(new Date(item.lastUsedAt), 'MMM d, yyyy')}
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Details</h3>
                <dl className="space-y-2 text-sm">
                  {item.manufacturer && (
                    <>
                      <dt className="text-gray-500">Manufacturer</dt>
                      <dd className="text-gray-900">{item.manufacturer}</dd>
                    </>
                  )}
                  {item.model && (
                    <>
                      <dt className="text-gray-500">Model</dt>
                      <dd className="text-gray-900">{item.model}</dd>
                    </>
                  )}
                  {item.serialNumbers && (() => {
                    try {
                      const serials = typeof item.serialNumbers === 'string' 
                        ? JSON.parse(item.serialNumbers) 
                        : item.serialNumbers
                      const serialArray = Array.isArray(serials) ? serials : []
                      return serialArray.length > 0 ? (
                        <>
                          <dt className="text-gray-500">Serial Number{serialArray.length > 1 ? 's' : ''}</dt>
                          <dd className="text-gray-900">
                            <div className="space-y-1">
                              {serialArray.map((serial: string, index: number) => (
                                <div key={index} className="font-mono text-xs bg-gray-50 px-2 py-1 rounded">
                                  {serial}
                                </div>
                              ))}
                            </div>
                          </dd>
                        </>
                      ) : null
                    } catch {
                      return null
                    }
                  })()}
                  {item.location && (
                    <>
                      <dt className="text-gray-500">Location</dt>
                      <dd className="text-gray-900">{item.location}</dd>
                    </>
                  )}
                </dl>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Tags</h3>
                {item.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {item.tags.map(({ tag }) => (
                      <span
                        key={tag.id}
                        className="px-1.5 py-0.5 rounded-full text-xs font-medium bg-white border-[0.5px] border-blue-300 text-gray-700"
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No tags assigned</p>
                )}
              </div>
            </div>

            {item.documents.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Documents</h3>
                <div className="space-y-2">
                  {item.documents.map((doc) => (
                    <a
                      key={doc.id}
                      href={doc.filePath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <FileText className="w-5 h-5 text-gray-400" />
                      <span className="text-sm text-gray-900">{doc.fileName}</span>
                      <Download className="w-4 h-4 text-gray-400 ml-auto" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {upcomingEvents.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Scheduled Events</h3>
                <div className="space-y-2">
                  {upcomingEvents.map((ei) => (
                    <Link
                      key={ei.id}
                      href={`/events/${ei.event.id}`}
                      className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <Calendar className="w-5 h-5 text-blue-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{ei.event.title}</p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(ei.event.startTime), 'MMM d, yyyy h:mm a')} -{' '}
                          {format(new Date(ei.event.endTime), 'h:mm a')}
                        </p>
                      </div>
                      <span className="text-xs font-medium text-blue-600">
                        Qty: {ei.quantity}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Usage History - Last Used Info */}
            {item.lastUsedAt && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Last Usage
                </h3>
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {item.lastUsedBy || 'Unknown'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {format(new Date(item.lastUsedAt), 'MMMM d, yyyy h:mm a')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Checkout History */}
            {item.checkouts && item.checkouts.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Checkout History</h3>
                <div className="space-y-2">
                  {item.checkouts.map((checkout) => (
                    <div
                      key={checkout.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {checkout.status === 'checked_out' ? (
                          <Clock className="w-5 h-5 text-yellow-600" />
                        ) : (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {checkout.checkedOutBy}
                          </p>
                          <p className="text-xs text-gray-500">
                            Checked out: {format(new Date(checkout.checkedOutAt), 'MMM d, yyyy')}
                            {checkout.fromDate && checkout.dueDate &&
                              ` • ${format(new Date(checkout.fromDate), 'MMM d')} - ${format(new Date(checkout.dueDate), 'MMM d, yyyy')}`}
                            {!checkout.fromDate && checkout.dueDate &&
                              ` • Return by: ${format(new Date(checkout.dueDate), 'MMM d, yyyy')}`}
                          </p>
                        </div>
                      </div>
                      {checkout.status === 'checked_out' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleReturn(checkout.id)}
                        >
                          Mark Returned
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {showCheckout && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Checkout Equipment</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      value={checkoutName}
                      onChange={(e) => setCheckoutName(e.target.value)}
                      placeholder="Enter your name"
                      className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity *
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min="1"
                        max={available}
                        value={checkoutQuantity}
                        onChange={(e) => setCheckoutQuantity(Math.max(1, Math.min(available, parseInt(e.target.value) || 1)))}
                        className="w-24 px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                      />
                      <span className="text-sm text-gray-600">
                        of {available} available
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      From Date *
                    </label>
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      To Date *
                    </label>
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      min={fromDate || new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <Button
                    onClick={handleCheckout}
                    disabled={checkingOut || !checkoutName.trim() || !fromDate || !toDate}
                    variant="primary"
                    className="flex-1"
                  >
                    {checkingOut ? 'Checking out...' : 'Checkout'}
                  </Button>
                  <Button
                    onClick={() => {
                      setShowCheckout(false)
                      setCheckoutName('')
                      setFromDate('')
                      setToDate('')
                      setCheckoutQuantity(1)
                    }}
                    variant="secondary"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {showDeleteConfirm && item && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Delete Equipment</h3>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete <strong>{item.name}</strong>? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <Button
                    onClick={handleDelete}
                    disabled={deleting}
                    variant="primary"
                    className="flex-1 bg-red-600 hover:bg-red-700"
                  >
                    {deleting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      'Delete'
                    )}
                  </Button>
                  <Button
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={deleting}
                    variant="secondary"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

