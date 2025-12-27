'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import Link from 'next/link'
import { Package, Search, User, Calendar, CheckCircle, Clock, Eye, EyeOff, Check, X, MessageSquare, Share2, Mail, Phone, Trash2, MapPin, Calendar as CalendarIcon, ArrowRight, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Toast } from '@/components/ui/Toast'
import { format } from 'date-fns'

interface Checkout {
  id: string
  checkedOutBy: string
  checkedOutAt: string
  fromDate?: string
  dueDate?: string
  status: string
  inventory: {
    id: string
    name: string
    quantity: number
    tags: Array<{ tag: { name: string; color: string } }>
  }
}

interface CheckoutRequest {
  id: string
  requesterName: string
  requesterEmail: string
  requesterPhone?: string
  purpose?: string
  status: 'unseen' | 'seen' | 'approved' | 'denied'
  approvedBy?: string
  approvedAt?: string
  readyForPickup?: boolean
  pickupDate?: string
  pickupTime?: string
  pickupLocation?: string
  pickedUp?: boolean
  pickedUpAt?: string
  createdAt: string
  items: string // JSON string
  messages: Array<{
    id: string
    senderType: 'requester' | 'admin'
    senderName: string
    senderEmail?: string
    message: string
    createdAt: string
  }>
  checkouts?: Array<{
    id: string
    status: string
    returnedAt?: string
    dueDate?: string
    checkedOutAt?: string
  }>
}

export default function CheckoutPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'requests' | 'approved' | 'denied' | 'ready' | 'pickedup' | 'returned'>('requests')
  const [allRequests, setAllRequests] = useState<CheckoutRequest[]>([])
  const [checkouts, setCheckouts] = useState<Checkout[]>([])
  const [requests, setRequests] = useState<CheckoutRequest[]>([])
  const [filter, setFilter] = useState<'all' | 'checked_out' | 'returned'>('checked_out')
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<CheckoutRequest | null>(null)
  const [itemNames, setItemNames] = useState<Map<string, string>>(new Map())
  const [newMessage, setNewMessage] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [showDenyModal, setShowDenyModal] = useState(false)
  const [denyMessage, setDenyMessage] = useState('')
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [unreadMessageCounts, setUnreadMessageCounts] = useState<Map<string, number>>(new Map())

  useEffect(() => {
    // Check authentication first with retry logic
    const checkAuth = async (retryCount = 0) => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include', // Ensure cookies are sent
        })
        
        if (response.ok) {
          const data = await response.json()
          if (data.user) {
            setIsAuthenticated(true)
            // Load data after confirming auth
            loadRequests()
            return
          }
        }
        
        // If we get here, auth failed
        // Retry once after a short delay (in case cookie is still being set)
        if (retryCount < 1) {
          console.log('Auth check failed, retrying...', retryCount)
          setTimeout(() => checkAuth(retryCount + 1), 500)
          return
        }
        
        // After retry, redirect to login
        console.log('Auth check failed after retry, redirecting to login')
        setIsAuthenticated(false)
        router.push('/login?return=/checkout')
      } catch (error) {
        console.error('Auth check error:', error)
        
        // Retry on network errors
        if (retryCount < 1) {
          setTimeout(() => checkAuth(retryCount + 1), 500)
          return
        }
        
        setIsAuthenticated(false)
        router.push('/login?return=/checkout')
      }
    }
    checkAuth()
  }, [])

  useEffect(() => {
    // Listen for message updates
    const handleMessageUpdate = () => {
      if (selectedRequest) {
        loadRequestDetail(selectedRequest.id)
      }
      loadRequests()
    }
    
    window.addEventListener('checkoutRequestUpdated', handleMessageUpdate)
    window.addEventListener('checkoutStatusUpdated', handleMessageUpdate)
    
    // Auto-refresh messages every 10 seconds
    const interval = setInterval(() => {
      if (isAuthenticated && selectedRequest) {
        loadRequestDetail(selectedRequest.id)
      }
      if (isAuthenticated) {
        loadRequests()
      }
    }, 10000)
    
    return () => {
      window.removeEventListener('checkoutRequestUpdated', handleMessageUpdate)
      window.removeEventListener('checkoutStatusUpdated', handleMessageUpdate)
      clearInterval(interval)
    }
  }, [isAuthenticated, selectedRequest])

  useEffect(() => {
    // Only load data if authenticated
    if (isAuthenticated) {
      loadRequests()
    }
  }, [activeTab, filter, isAuthenticated])

  const loadCheckouts = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter !== 'all') {
        params.append('status', filter)
      }
      if (search) {
        params.append('user', search)
      }

      const response = await fetch(`/api/checkout?${params}`, {
        credentials: 'include', // Ensure cookies are sent
      })
      if (response.ok) {
        const data = await response.json()
        setCheckouts(data.checkouts || [])
      } else if (response.status === 401) {
        // If unauthorized, try to re-authenticate
        setIsAuthenticated(false)
        router.push('/login?return=/checkout')
      }
    } catch (error) {
      console.error('Failed to load checkouts:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadRequests = async () => {
    setIsLoading(true)
    try {
      // Always fetch all requests to calculate counts for all tabs
      const response = await fetch(`/api/checkout/request`, {
        credentials: 'include', // Ensure cookies are sent
      })
      if (response.ok) {
        const data = await response.json()
        const allRequestsData = data.requests || []
        setAllRequests(allRequestsData)
        
        let filteredRequests = allRequestsData
        
        // Filter based on active tab
        if (activeTab === 'requests') {
          // New Requests: only unseen and seen (not approved/denied)
          filteredRequests = allRequestsData.filter((r: CheckoutRequest) => 
            r.status === 'unseen' || r.status === 'seen'
          )
        } else if (activeTab === 'approved') {
          filteredRequests = allRequestsData.filter((r: CheckoutRequest) => 
            r.status === 'approved' && !r.readyForPickup && !r.pickedUp && 
            (!r.checkouts || r.checkouts.length === 0 || !r.checkouts.every((c: any) => c.status === 'returned'))
          )
        } else if (activeTab === 'denied') {
          filteredRequests = allRequestsData.filter((r: CheckoutRequest) => 
            r.status === 'denied'
          )
        } else if (activeTab === 'ready') {
          filteredRequests = allRequestsData.filter((r: CheckoutRequest) => 
            r.status === 'approved' && r.readyForPickup && !r.pickedUp
          )
        } else if (activeTab === 'pickedup') {
          filteredRequests = allRequestsData.filter((r: CheckoutRequest) => 
            r.pickedUp && r.checkouts && r.checkouts.length > 0 && !r.checkouts.every((c: any) => c.status === 'returned')
          )
        } else if (activeTab === 'returned') {
          filteredRequests = allRequestsData.filter((r: CheckoutRequest) => 
            r.checkouts && r.checkouts.length > 0 && r.checkouts.every((c: any) => c.status === 'returned')
          )
        }
        
        setRequests(filteredRequests)
      } else if (response.status === 401) {
        // If unauthorized, try to re-authenticate
        setIsAuthenticated(false)
        router.push('/login?return=/checkout')
      }
    } catch (error) {
      console.error('Failed to load requests:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadRequestDetail = async (id: string) => {
    try {
      const response = await fetch(`/api/checkout/request/${id}`)
      if (response.ok) {
        const data = await response.json()
        setSelectedRequest(data.request)
        
        // Fetch item names
        const items = parsedItems(data.request.items)
        const nameMap = new Map<string, string>()
        await Promise.all(
          items.map(async (item: any) => {
            try {
              const itemResponse = await fetch(`/api/inventory/${item.inventoryId}`)
              if (itemResponse.ok) {
                const itemData = await itemResponse.json()
                nameMap.set(item.inventoryId, itemData.item?.name || `Item ${item.inventoryId}`)
              } else {
                nameMap.set(item.inventoryId, `Item ${item.inventoryId}`)
              }
            } catch (error) {
              console.error('Failed to fetch item name:', error)
              nameMap.set(item.inventoryId, `Item ${item.inventoryId}`)
            }
          })
        )
        setItemNames(nameMap)
      }
    } catch (error) {
      console.error('Failed to load request detail:', error)
    }
  }

  const handleReturn = async (checkoutId: string) => {
    if (!confirm('Mark this item as returned?')) return

    try {
      const response = await fetch(`/api/checkout/${checkoutId}/return`, {
        method: 'POST',
      })

      if (response.ok) {
        loadCheckouts()
        // Dispatch event to refresh inventory pages
        window.dispatchEvent(new CustomEvent('inventoryUpdated'))
        window.dispatchEvent(new CustomEvent('checkoutStatusUpdated'))
      } else {
        alert('Failed to return item')
      }
    } catch (error) {
      console.error('Return error:', error)
      alert('Failed to return item')
    }
  }

  const handleUpdateRequestStatus = async (requestId: string, status: string, message?: string) => {
    setUpdatingStatus(requestId)
    try {
      const response = await fetch(`/api/checkout/request/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, message }),
      })

      if (response.ok) {
        loadRequests()
        if (selectedRequest?.id === requestId) {
          loadRequestDetail(requestId)
        }
        // Trigger notification refresh in sidebar
        window.dispatchEvent(new CustomEvent('checkoutStatusUpdated'))
      } else {
        const error = await response.json()
        if (response.status === 401) {
          alert('Your session has expired. Please log in again.')
          router.push('/login?return=/checkout')
        } else {
          alert(error.error || 'Failed to update status')
        }
      }
    } catch (error) {
      console.error('Update status error:', error)
      alert('Failed to update status')
    } finally {
      setUpdatingStatus(null)
    }
  }

  const handleReadyForPickup = async (requestId: string) => {
    try {
      const response = await fetch(`/api/checkout/request/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ readyForPickup: true }),
      })

      if (response.ok) {
        loadRequests()
        if (selectedRequest?.id === requestId) {
          loadRequestDetail(requestId)
        }
        window.dispatchEvent(new CustomEvent('checkoutRequestUpdated'))
        alert('Request marked as ready for pickup')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to update pickup status')
      }
    } catch (error) {
      console.error('Ready for pickup error:', error)
      alert('Failed to update pickup status')
    }
  }


  const handleDeleteRequest = async (requestId: string) => {
    if (!confirm('Are you sure you want to delete this checkout request? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/checkout/request/${requestId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // Remove from local state
        setRequests(requests.filter((r) => r.id !== requestId))
        // Clear selection if deleted request was selected
        if (selectedRequest?.id === requestId) {
          setSelectedRequest(null)
        }
        // Trigger notification refresh in sidebar
        window.dispatchEvent(new CustomEvent('checkoutRequestUpdated'))
        alert('Checkout request deleted successfully')
      } else {
        const error = await response.json()
        if (response.status === 401) {
          alert('Your session has expired. Please log in again.')
          router.push('/login?return=/checkout')
        } else if (response.status === 403) {
          alert('You do not have permission to delete checkout requests.')
        } else {
          alert(error.error || 'Failed to delete request')
        }
      }
    } catch (error) {
      console.error('Delete request error:', error)
      alert('Failed to delete request')
    }
  }

  const handleSendMessage = async (requestId: string) => {
    if (!newMessage.trim()) return

    setSendingMessage(true)
    try {
      const response = await fetch(`/api/checkout/request/${requestId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newMessage }),
      })

      if (response.ok) {
        setNewMessage('')
        loadRequestDetail(requestId)
        loadRequests()
      } else {
        const error = await response.json()
        if (response.status === 401) {
          alert('Your session has expired. Please log in again.')
          router.push('/login?return=/checkout')
        } else {
          alert(error.error || 'Failed to send message')
        }
      }
    } catch (error) {
      console.error('Send message error:', error)
      alert('Failed to send message')
    } finally {
      setSendingMessage(false)
    }
  }

  const handleSharePublicPage = async () => {
    const url = `${window.location.origin}/checkout/public`
    try {
      await navigator.clipboard.writeText(url)
      setToastMessage('Public checkout page link copied to clipboard!')
      setShowToast(true)
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = url
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      try {
        document.execCommand('copy')
        setToastMessage('Public checkout page link copied to clipboard!')
        setShowToast(true)
      } catch (err) {
        setToastMessage('Failed to copy. Please copy manually: ' + url)
        setShowToast(true)
      }
      document.body.removeChild(textArea)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'unseen':
        return 'bg-gray-500'
      case 'seen':
        return 'bg-blue-500'
      case 'approved':
        return 'bg-green-500'
      case 'denied':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'unseen':
        return 'Unseen'
      case 'seen':
        return 'Seen'
      case 'approved':
        return 'Approved'
      case 'denied':
        return 'Denied'
      default:
        return status
    }
  }

  const parsedItems = (itemsJson: string) => {
    try {
      return JSON.parse(itemsJson)
    } catch {
      return []
    }
  }

  // Show loading while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 overflow-y-auto flex items-center justify-center">
          <div className="text-center">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-pulse" />
            <p className="text-gray-500">Loading...</p>
          </div>
        </main>
      </div>
    )
  }

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <Toast
        message={toastMessage}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
        type="success"
      />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-8">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-4xl font-bold text-gray-900">Equipment Checkout</h1>
              <Button
                onClick={handleSharePublicPage}
                variant="secondary"
                size="sm"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share Public Page
              </Button>
            </div>
            <p className="text-gray-600">View and manage equipment checkouts and requests</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-6 border-b border-gray-200 overflow-x-auto">
            {[
              { 
                key: 'requests', 
                label: 'New Requests',
                count: allRequests.filter((r) => r.status === 'unseen' || r.status === 'seen').length,
                unreadMessages: allRequests.filter((r) => 
                  (r.status === 'unseen' || r.status === 'seen') && (unreadMessageCounts.get(r.id) || 0) > 0
                ).length
              },
              { 
                key: 'approved', 
                label: 'Approved',
                count: allRequests.filter((r) => 
                  r.status === 'approved' && !r.readyForPickup && !r.pickedUp && 
                  (!r.checkouts || r.checkouts.length === 0 || !r.checkouts.every((c: any) => c.status === 'returned'))
                ).length,
                unreadMessages: allRequests.filter((r) => 
                  r.status === 'approved' && !r.readyForPickup && !r.pickedUp && 
                  (!r.checkouts || r.checkouts.length === 0 || !r.checkouts.every((c: any) => c.status === 'returned')) &&
                  (unreadMessageCounts.get(r.id) || 0) > 0
                ).length
              },
              { 
                key: 'denied', 
                label: 'Denied',
                count: allRequests.filter((r) => r.status === 'denied').length,
                unreadMessages: allRequests.filter((r) => 
                  r.status === 'denied' && (unreadMessageCounts.get(r.id) || 0) > 0
                ).length
              },
              { 
                key: 'ready', 
                label: 'Ready for Pickup',
                count: allRequests.filter((r) => r.status === 'approved' && r.readyForPickup && !r.pickedUp).length,
                unreadMessages: allRequests.filter((r) => 
                  r.status === 'approved' && r.readyForPickup && !r.pickedUp && (unreadMessageCounts.get(r.id) || 0) > 0
                ).length
              },
              { 
                key: 'pickedup', 
                label: 'Picked up',
                count: allRequests.filter((r) => r.pickedUp && r.checkouts && r.checkouts.length > 0 && !r.checkouts.every((c: any) => c.status === 'returned')).length,
                unreadMessages: allRequests.filter((r) => 
                  r.pickedUp && r.checkouts && r.checkouts.length > 0 && !r.checkouts.every((c: any) => c.status === 'returned') &&
                  (unreadMessageCounts.get(r.id) || 0) > 0
                ).length
              },
              { 
                key: 'returned', 
                label: 'Returned',
                count: allRequests.filter((r) => r.checkouts && r.checkouts.length > 0 && r.checkouts.every((c: any) => c.status === 'returned')).length,
                unreadMessages: allRequests.filter((r) => 
                  r.checkouts && r.checkouts.length > 0 && r.checkouts.every((c: any) => c.status === 'returned') &&
                  (unreadMessageCounts.get(r.id) || 0) > 0
                ).length
              },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-4 py-2 font-medium transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 ${
                  activeTab === tab.key
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-600 border-transparent hover:text-gray-900'
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-xs font-semibold rounded-full">
                    {tab.count}
                  </span>
                )}
                {tab.unreadMessages > 0 && (
                  <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full relative">
                    {tab.unreadMessages}
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
                  </span>
                )}
              </button>
            ))}
          </div>

          {(
            /* Requests Tab */
            <>
              {/* Search */}
              <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                  />
                </div>
              </div>

              {/* Requests List */}
              {isLoading ? (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-pulse" />
                  <p className="text-gray-500">Loading requests...</p>
                </div>
              ) : requests.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                  <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No requests found</h3>
                  <p className="text-gray-600">
                    {search
                      ? 'Try adjusting your search'
                      : 'No checkout requests yet'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Requests List */}
                  <div className="space-y-4">
                    {requests
                      .filter((req) => {
                        if (search) {
                          const searchLower = search.toLowerCase()
                          return (
                            req.requesterName.toLowerCase().includes(searchLower) ||
                            req.requesterEmail.toLowerCase().includes(searchLower)
                          )
                        }
                        return true
                      })
                      .map((request) => (
                        <div
                          key={request.id}
                          className={`bg-white rounded-lg border-2 p-6 cursor-pointer transition-all ${
                            selectedRequest?.id === request.id
                              ? 'border-blue-500 shadow-lg'
                              : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                          }`}
                          onClick={() => {
                            setSelectedRequest(request)
                            loadRequestDetail(request.id)
                          }}
                        >
                          <div className="mb-3">
                            <h3 className="font-semibold text-gray-900">{request.requesterName}</h3>
                            <p className="text-sm text-gray-600">{request.requesterEmail}</p>
                          </div>

                          <div className="text-sm text-gray-600 mb-3">
                            <p>
                              <strong>Items:</strong>{' '}
                              {parsedItems(request.items).length} item{parsedItems(request.items).length !== 1 ? 's' : ''}
                            </p>
                            <p>
                              <strong>Submitted:</strong>{' '}
                              {format(new Date(request.createdAt), 'MMM d, yyyy h:mm a')}
                            </p>
                            {request.pickupDate && (
                              <p className="text-blue-600 font-medium">
                                <CalendarIcon className="w-3 h-3 inline mr-1" />
                                Pickup: {format(new Date(request.pickupDate), 'MMM d, yyyy')}
                                {request.pickupTime && ` at ${request.pickupTime}`}
                              </p>
                            )}
                            {request.checkouts && request.checkouts.length > 0 && request.checkouts.every(c => c.status === 'returned') && (
                              <p className="text-green-600 font-medium">
                                <RotateCcw className="w-3 h-3 inline mr-1" />
                                Returned
                              </p>
                            )}
                            {request.pickedUp && request.checkouts && request.checkouts.length > 0 && !request.checkouts.every(c => c.status === 'returned') && (
                              <p className="text-purple-600 font-medium">
                                <Package className="w-3 h-3 inline mr-1" />
                                Picked Up • Return: {request.checkouts[0]?.dueDate ? format(new Date(request.checkouts[0].dueDate), 'MMM d, yyyy') : 'N/A'}
                              </p>
                            )}
                            {request.status === 'approved' && !request.pickedUp && request.readyForPickup && !request.pickupDate && (
                              <p className="text-green-600 font-medium">
                                <CheckCircle className="w-3 h-3 inline mr-1" />
                                Ready for Pickup
                              </p>
                            )}
                            {request.status === 'approved' && !request.pickedUp && !request.readyForPickup && (
                              <p className="text-blue-600 font-medium">
                                Approved
                              </p>
                            )}
                            {request.status === 'denied' && (
                              <p className="text-red-600 font-medium">
                                Denied
                              </p>
                            )}
                            {request.messages && request.messages.length > 0 && (
                              <p className="flex items-center gap-2">
                                <strong>Messages:</strong> {request.messages.length}
                                {(unreadMessageCounts.get(request.id) || 0) > 0 && (
                                  <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                                    {unreadMessageCounts.get(request.id)}
                                  </span>
                                )}
                              </p>
                            )}
                          </div>

                          {request.status === 'unseen' && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleUpdateRequestStatus(request.id, 'seen')
                              }}
                              className="w-full"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Mark as Seen
                            </Button>
                          )}
                        </div>
                      ))}
                  </div>

                  {/* Request Detail */}
                  {selectedRequest && (
                    <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-8 max-h-[calc(100vh-8rem)] overflow-y-auto">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-gray-900">Request Details</h2>
                        <button
                          onClick={() => setSelectedRequest(null)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Progress Stepper */}
                      <div className="mb-6 pb-6 border-b border-gray-200">
                        <h3 className="font-semibold text-gray-900 mb-4">Status</h3>
                        <div className="flex items-start">
                          {[
                            { key: 'unseen', label: 'Submitted', icon: Clock },
                            { key: 'approved', label: 'Approved', icon: Check },
                            { key: 'ready', label: 'Ready', icon: CheckCircle },
                            { key: 'scheduled', label: 'Scheduled', icon: CalendarIcon },
                            { key: 'pickedup', label: 'Picked up', icon: Package },
                            { key: 'returned', label: 'Returned', icon: RotateCcw },
                          ].map((step, index, array) => {
                            const Icon = step.icon
                            const returnDate = selectedRequest.checkouts?.find(c => c.status === 'checked_out')?.dueDate
                            
                            const isActive = 
                              (step.key === 'unseen' && selectedRequest.status === 'unseen') ||
                              (step.key === 'approved' && selectedRequest.status === 'approved' && !selectedRequest.readyForPickup && !selectedRequest.pickedUp) ||
                              (step.key === 'ready' && selectedRequest.readyForPickup && !selectedRequest.pickedUp) ||
                              (step.key === 'scheduled' && selectedRequest.pickupDate && !selectedRequest.pickedUp) ||
                              (step.key === 'pickedup' && selectedRequest.pickedUp && !selectedRequest.checkouts?.every(c => c.status === 'returned')) ||
                              (step.key === 'returned' && selectedRequest.checkouts?.every(c => c.status === 'returned'))
                            
                            const isPast = 
                              (step.key === 'unseen' && ['approved', 'denied'].includes(selectedRequest.status)) ||
                              (step.key === 'approved' && selectedRequest.status === 'approved') ||
                              (step.key === 'ready' && selectedRequest.readyForPickup) ||
                              (step.key === 'scheduled' && selectedRequest.pickupDate) ||
                              (step.key === 'pickedup' && selectedRequest.pickedUp) ||
                              (step.key === 'returned' && selectedRequest.checkouts?.some(c => c.status === 'returned'))

                            return (
                              <div key={step.key} className="flex-1 flex flex-col items-center relative">
                                {/* Circle */}
                                <div className="relative z-10">
                                  <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                                      isActive
                                        ? 'bg-blue-600 border-blue-600 text-white'
                                        : isPast
                                        ? 'bg-green-100 border-green-500 text-green-700'
                                        : 'bg-gray-100 border-gray-300 text-gray-400'
                                    }`}
                                  >
                                    <Icon className="w-5 h-5" />
                                  </div>
                                </div>
                                
                                {/* Connecting line to the right */}
                                {index < array.length - 1 && (
                                  <div
                                    className={`h-0.5 absolute top-5 left-1/2 right-0 -z-0 ${
                                      isPast ? 'bg-green-500' : 'bg-gray-200'
                                    }`}
                                    style={{ 
                                      width: 'calc(50% - 20px)',
                                      marginLeft: '20px'
                                    }}
                                  />
                                )}
                                
                                {/* Connecting line from the left */}
                                {index > 0 && (
                                  <div
                                    className={`h-0.5 absolute top-5 left-0 right-1/2 -z-0 ${
                                      isPast ? 'bg-green-500' : 'bg-gray-200'
                                    }`}
                                    style={{ 
                                      width: 'calc(50% - 20px)',
                                      marginRight: '20px'
                                    }}
                                  />
                                )}
                                
                                {/* Label */}
                                <div className="mt-2 text-center">
                                  <span
                                    className={`text-xs block ${
                                      isActive
                                        ? 'text-blue-600 font-medium'
                                        : isPast
                                        ? 'text-green-700'
                                        : 'text-gray-400'
                                    }`}
                                  >
                                    {step.label}
                                  </span>
                                  {step.key === 'pickedup' && returnDate && (
                                    <span className="text-xs text-gray-500 block mt-1">
                                      Return: {format(new Date(returnDate), 'MMM d, yyyy')}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {/* Requester Info */}
                      <div className="mb-6 pb-6 border-b border-gray-200">
                        <h3 className="font-semibold text-gray-900 mb-3">Requester Information</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <User className="w-4 h-4" />
                            <span>{selectedRequest.requesterName}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Mail className="w-4 h-4" />
                            <span>{selectedRequest.requesterEmail}</span>
                          </div>
                          {selectedRequest.requesterPhone && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <Phone className="w-4 h-4" />
                              <span>{selectedRequest.requesterPhone}</span>
                            </div>
                          )}
                          {selectedRequest.purpose && (
                            <div className="mt-3">
                              <p className="text-gray-600">
                                <strong>Purpose:</strong> {selectedRequest.purpose}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Items */}
                      <div className="mb-6 pb-6 border-b border-gray-200">
                        <h3 className="font-semibold text-gray-900 mb-3">Requested Items</h3>
                        <div className="space-y-3">
                          {parsedItems(selectedRequest.items).map((item: any, idx: number) => {
                            const itemName = itemNames.get(item.inventoryId) || `Item ${item.inventoryId}`
                            return (
                              <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                                <p className="font-medium text-gray-900">{itemName}</p>
                                <p className="text-sm text-gray-600">
                                  Quantity: {item.quantity} •{' '}
                                  {item.fromDate && item.toDate
                                    ? `${format(new Date(item.fromDate), 'MMM d')} - ${format(new Date(item.toDate), 'MMM d, yyyy')}`
                                    : 'Dates not set'}
                                </p>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {/* Messages */}
                      <div className="mb-6 pb-6 border-b border-gray-200">
                        <h3 className="font-semibold text-gray-900 mb-3">Messages</h3>
                        <div className="space-y-3 max-h-48 overflow-y-auto">
                          {selectedRequest.messages && selectedRequest.messages.length > 0 ? (
                            selectedRequest.messages.map((msg) => (
                              <div
                                key={msg.id}
                                className={`p-3 rounded-lg ${
                                  msg.senderType === 'admin'
                                    ? 'bg-blue-50 ml-4'
                                    : 'bg-gray-50 mr-4'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <p className="text-xs font-medium text-gray-700">{msg.senderName}</p>
                                  <p className="text-xs text-gray-500">
                                    {format(new Date(msg.createdAt), 'MMM d, h:mm a')}
                                  </p>
                                </div>
                                <p className="text-sm text-gray-900">{msg.message}</p>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-gray-500">No messages yet</p>
                          )}
                        </div>
                      </div>

                      {/* Send Message */}
                      <div className="mb-6">
                        <h3 className="font-semibold text-gray-900 mb-3">Send Message</h3>
                        <textarea
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type your message..."
                          rows={3}
                          className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 resize-none mb-2"
                        />
                        <Button
                          onClick={() => handleSendMessage(selectedRequest.id)}
                          variant="primary"
                          size="sm"
                          disabled={!newMessage.trim() || sendingMessage}
                          className="w-full"
                        >
                          {sendingMessage ? 'Sending...' : 'Send Message'}
                        </Button>
                      </div>

                      {/* Pickup Information */}
                      {selectedRequest.status === 'approved' && (
                        <div className="mb-6 pb-6 border-b border-gray-200">
                          <h3 className="font-semibold text-gray-900 mb-3">Pickup Information</h3>
                          {selectedRequest.readyForPickup ? (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-green-600">
                                <CheckCircle className="w-4 h-4" />
                                <span className="text-sm font-medium">Ready for Pickup</span>
                              </div>
                              {selectedRequest.pickupDate && (
                                <div className="flex items-center gap-2 text-gray-600 text-sm">
                                  <CalendarIcon className="w-4 h-4" />
                                  <span>
                                    {format(new Date(selectedRequest.pickupDate), 'MMM d, yyyy')}
                                    {selectedRequest.pickupTime && ` at ${selectedRequest.pickupTime}`}
                                  </span>
                                </div>
                              )}
                              {selectedRequest.pickupLocation && (
                                <div className="flex items-center gap-2 text-gray-600 text-sm">
                                  <MapPin className="w-4 h-4" />
                                  <span>{selectedRequest.pickupLocation}</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">Not yet ready for pickup</p>
                          )}
                        </div>
                      )}

                      {/* Status Actions */}
                      <div className="space-y-2">
                        {selectedRequest.status !== 'approved' && (
                          <>
                            {selectedRequest.status === 'denied' ? (
                              <Button
                                onClick={() => {
                                  if (confirm('This request was previously denied. Are you sure you want to approve it now?')) {
                                    handleUpdateRequestStatus(selectedRequest.id, 'approved')
                                  }
                                }}
                                variant="primary"
                                size="sm"
                                className="w-full"
                                disabled={updatingStatus === selectedRequest.id}
                              >
                                <Check className="w-4 h-4 mr-2" />
                                {updatingStatus === selectedRequest.id ? 'Approving...' : 'Approve Request'}
                              </Button>
                            ) : (
                              <>
                                <Button
                                  onClick={() => handleUpdateRequestStatus(selectedRequest.id, 'approved')}
                                  variant="primary"
                                  size="sm"
                                  className="w-full"
                                  disabled={updatingStatus === selectedRequest.id}
                                >
                                  <Check className="w-4 h-4 mr-2" />
                                  {updatingStatus === selectedRequest.id ? 'Approving...' : 'Approve Request'}
                                </Button>
                                <Button
                                  onClick={() => {
                                    setDenyMessage('')
                                    setShowDenyModal(true)
                                  }}
                                  variant="secondary"
                                  size="sm"
                                  className="w-full"
                                  disabled={updatingStatus === selectedRequest.id}
                                >
                                  <X className="w-4 h-4 mr-2" />
                                  Deny Request
                                </Button>
                              </>
                            )}
                          </>
                        )}
                        {selectedRequest.status === 'unseen' && (
                          <Button
                            onClick={() => handleUpdateRequestStatus(selectedRequest.id, 'seen')}
                            variant="secondary"
                            size="sm"
                            className="w-full"
                            disabled={updatingStatus === selectedRequest.id}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            {updatingStatus === selectedRequest.id ? 'Updating...' : 'Mark as Seen'}
                          </Button>
                        )}
                        {selectedRequest.status === 'approved' && (
                          <>
                            <Button
                              onClick={() => handleReadyForPickup(selectedRequest.id)}
                              variant="primary"
                              size="sm"
                              className="w-full"
                              disabled={selectedRequest.readyForPickup}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              {selectedRequest.readyForPickup ? 'Ready for Pickup' : 'Mark Ready for Pickup'}
                            </Button>
                            <Button
                              onClick={async () => {
                                if (!confirm('Mark this request as picked up? This will create checkout records.')) return
                                try {
                                  const response = await fetch(`/api/checkout/request/${selectedRequest.id}`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ pickedUp: true }),
                                  })
                                  if (response.ok) {
                                    loadRequestDetail(selectedRequest.id)
                                    loadRequests()
                                    window.dispatchEvent(new CustomEvent('checkoutRequestUpdated'))
                                    alert('Request marked as picked up')
                                  } else {
                                    const error = await response.json()
                                    alert(error.error || 'Failed to mark as picked up')
                                  }
                                } catch (error) {
                                  console.error('Mark picked up error:', error)
                                  alert('Failed to mark as picked up')
                                }
                              }}
                              variant="primary"
                              size="sm"
                              className="w-full"
                              disabled={selectedRequest.pickedUp}
                            >
                              <Package className="w-4 h-4 mr-2" />
                              {selectedRequest.pickedUp ? 'Picked Up' : 'Mark Picked Up'}
                            </Button>
                          </>
                        )}
                        {selectedRequest.pickedUp && !selectedRequest.checkouts?.every(c => c.status === 'returned') && (
                          <Button
                            onClick={async () => {
                              if (!confirm('Mark all items in this request as returned?')) return
                              try {
                                const response = await fetch(`/api/checkout/request/${selectedRequest.id}/return`, {
                                  method: 'POST',
                                })
                                if (response.ok) {
                                  loadRequestDetail(selectedRequest.id)
                                  loadRequests()
                                  window.dispatchEvent(new CustomEvent('checkoutRequestUpdated'))
                                  window.dispatchEvent(new CustomEvent('inventoryUpdated'))
                                  window.dispatchEvent(new CustomEvent('checkoutStatusUpdated'))
                                  alert('Items marked as returned')
                                } else {
                                  alert('Failed to mark items as returned')
                                }
                              } catch (error) {
                                console.error('Return error:', error)
                                alert('Failed to mark items as returned')
                              }
                            }}
                            variant="primary"
                            size="sm"
                            className="w-full"
                          >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Mark Returned
                          </Button>
                        )}
                        <Button
                          onClick={() => handleDeleteRequest(selectedRequest.id)}
                          variant="secondary"
                          size="sm"
                          className="w-full border-red-300 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Request
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Deny Request Modal */}
      {showDenyModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Deny Request</h3>
                <button
                  onClick={() => {
                    setShowDenyModal(false)
                    setDenyMessage('')
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (denyMessage.trim()) {
                  handleUpdateRequestStatus(selectedRequest.id, 'denied', denyMessage.trim())
                  setShowDenyModal(false)
                  setDenyMessage('')
                } else {
                  alert('Please provide a reason for denying this request.')
                }
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason for Denial *
                </label>
                <textarea
                  value={denyMessage}
                  onChange={(e) => setDenyMessage(e.target.value)}
                  required
                  placeholder="Please explain why this request is being denied..."
                  rows={4}
                  className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none text-gray-900 resize-none"
                />
                <p className="mt-1 text-xs text-gray-500">
                  This message will be sent to the requester
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowDenyModal(false)
                    setDenyMessage('')
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="secondary"
                  className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                  disabled={!denyMessage.trim() || updatingStatus === selectedRequest.id}
                >
                  {updatingStatus === selectedRequest.id ? 'Denying...' : 'Deny Request'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
