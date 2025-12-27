'use client'

import { useState, useEffect, useRef } from 'react'
import Sidebar from '@/components/Sidebar'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Search, Package, Tag as TagIcon, Calendar, User, MoreVertical, Edit, Trash2, X, Grid3x3, List, ArrowUpDown, Heart, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface InventoryItem {
  id: string
  name: string
  description?: string
  quantity: number
  manufacturer?: string
  model?: string
  location?: string
  lastUsedAt?: string
  lastUsedBy?: string
  imageUrl?: string
  InventoryItemTag: Array<{ InventoryTag: { id: string; name: string; color: string } }>
  Checkout: Array<{ status: string }>
}

export default function InventoryPage() {
  const router = useRouter()
  const [items, setItems] = useState<InventoryItem[]>([])
  const [tags, setTags] = useState<Array<{ id: string; name: string; color: string }>>([])
  const [selectedTag, setSelectedTag] = useState<string>('')
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card')
  const [sortOrder, setSortOrder] = useState<'alphabetical' | 'default'>('default')
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; itemId: string | null; itemName: string }>({
    show: false,
    itemId: null,
    itemName: '',
  })
  const [deleting, setDeleting] = useState(false)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const menuRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  useEffect(() => {
    loadTags()
    loadInventory()
    
    // Listen for checkout updates from other pages
    const handleInventoryUpdate = () => {
      loadInventory()
    }
    window.addEventListener('checkoutRequestUpdated', handleInventoryUpdate)
    window.addEventListener('checkoutStatusUpdated', handleInventoryUpdate)
    window.addEventListener('inventoryUpdated', handleInventoryUpdate)
    
    return () => {
      window.removeEventListener('checkoutRequestUpdated', handleInventoryUpdate)
      window.removeEventListener('checkoutStatusUpdated', handleInventoryUpdate)
      window.removeEventListener('inventoryUpdated', handleInventoryUpdate)
    }
  }, [selectedTag, search])

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuId) {
        const menuElement = menuRefs.current[openMenuId]
        if (menuElement && !menuElement.contains(event.target as Node)) {
          setOpenMenuId(null)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [openMenuId])

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

  const loadInventory = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedTag) params.append('tag', selectedTag)
      if (search) params.append('search', search)
      
      const response = await fetch(`/api/inventory?${params}`)
      if (response.ok) {
        const data = await response.json()
        setItems(data.items || [])
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Failed to load inventory' }))
        console.error('Failed to load inventory:', errorData.error)
        // Show error to user
        alert(`Failed to load inventory: ${errorData.error || 'Unknown error'}`)
        setItems([])
      }
    } catch (error: any) {
      console.error('Failed to load inventory:', error)
      alert(`Failed to load inventory: ${error.message || 'Network error'}`)
      setItems([])
    } finally {
      setIsLoading(false)
    }
  }

  const getAvailableQuantity = (item: InventoryItem) => {
    const checkedOut = item.Checkout.filter(c => c.status === 'checked_out').length
    return item.quantity - checkedOut
  }

  // Sort items
  const getSortedItems = () => {
    if (sortOrder === 'alphabetical') {
      return [...items].sort((a, b) => a.name.localeCompare(b.name))
    }
    return items
  }

  const handleMenuClick = (e: React.MouseEvent, itemId: string) => {
    e.preventDefault()
    e.stopPropagation()
    setOpenMenuId(openMenuId === itemId ? null : itemId)
  }

  const handleEdit = (e: React.MouseEvent, itemId: string) => {
    e.preventDefault()
    e.stopPropagation()
    setOpenMenuId(null)
    router.push(`/inventory/${itemId}/edit`)
  }

  const handleDeleteClick = (e: React.MouseEvent, item: InventoryItem) => {
    e.preventDefault()
    e.stopPropagation()
    setOpenMenuId(null)
    setDeleteConfirm({
      show: true,
      itemId: item.id,
      itemName: item.name,
    })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.itemId) return

    setDeleting(true)
    try {
      const response = await fetch(`/api/inventory/${deleteConfirm.itemId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // Remove item from list
        setItems(items.filter((item) => item.id !== deleteConfirm.itemId))
        setDeleteConfirm({ show: false, itemId: null, itemName: '' })
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete item')
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete item')
    } finally {
      setDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteConfirm({ show: false, itemId: null, itemName: '' })
  }

  const handleSelectItem = (itemId: string) => {
    setSelectedItems((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        newSet.add(itemId)
      }
      return newSet
    })
  }

  const handleSelectAll = () => {
    if (selectedItems.size === getSortedItems().length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(getSortedItems().map((item) => item.id)))
    }
  }

  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) return
    
    const count = selectedItems.size
    if (!confirm(`Are you sure you want to delete ${count} item${count !== 1 ? 's' : ''}? This action cannot be undone.`)) {
      return
    }

    setBulkDeleting(true)
    try {
      const deletePromises = Array.from(selectedItems).map((itemId) =>
        fetch(`/api/inventory/${itemId}`, { method: 'DELETE' })
      )

      const results = await Promise.all(deletePromises)
      const errors = results.filter((r) => !r.ok)

      if (errors.length > 0) {
        alert(`Failed to delete ${errors.length} item(s)`)
      } else {
        // Remove deleted items from list
        setItems(items.filter((item) => !selectedItems.has(item.id)))
        setSelectedItems(new Set())
        alert(`Successfully deleted ${count} item(s)`)
      }
    } catch (error) {
      console.error('Bulk delete error:', error)
      alert('Failed to delete items')
    } finally {
      setBulkDeleting(false)
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto lg:ml-0">
        <div className="max-w-6xl mx-auto p-4 lg:p-8 pt-16 lg:pt-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 lg:mb-8 gap-4">
            <div>
              <h1 className="text-2xl lg:text-4xl font-bold text-gray-900 mb-2">Equipment Inventory</h1>
              <p className="text-sm lg:text-base text-gray-600">Manage and track all tech equipment</p>
            </div>
            <Link href="/inventory/new" className="w-full sm:w-auto">
              <Button variant="primary" className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Add Equipment
              </Button>
            </Link>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search equipment..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                  />
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setSelectedTag('')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedTag === ''
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => setSelectedTag(selectedTag === tag.id ? '' : tag.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedTag === tag.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* View Controls */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              {getSortedItems().length > 0 && (
                <div className="flex items-center gap-2 pl-4">
                  <input
                    type="checkbox"
                    checked={selectedItems.size === getSortedItems().length && getSortedItems().length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600">
                    {selectedItems.size > 0 ? `${selectedItems.size} selected` : 'Select all'}
                  </span>
                </div>
              )}
              {selectedItems.size > 0 && (
                <Button
                  onClick={handleBulkDelete}
                  disabled={bulkDeleting}
                  variant="primary"
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete {selectedItems.size} Selected
                </Button>
              )}
              <button
                onClick={() => setSortOrder(sortOrder === 'alphabetical' ? 'default' : 'alphabetical')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  sortOrder === 'alphabetical'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <ArrowUpDown className="w-4 h-4" />
                Sort A-Z
              </button>
            </div>
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('card')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'card'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Card view"
              >
                <Grid3x3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="List view"
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Inventory Grid/List */}
          {isLoading ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-pulse" />
              <p className="text-gray-500">Loading inventory...</p>
            </div>
          ) : getSortedItems().length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No equipment found</h3>
              <p className="text-gray-600 mb-4">
                {search || selectedTag
                  ? 'Try adjusting your filters'
                  : 'Get started by adding your first piece of equipment'}
              </p>
              {!search && !selectedTag && (
                <Link href="/inventory/new">
                  <Button variant="primary">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Equipment
                  </Button>
                </Link>
              )}
            </div>
          ) : viewMode === 'card' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getSortedItems().map((item) => {
                const available = getAvailableQuantity(item)
                const isLowStock = available < item.quantity * 0.3
                const isOutOfStock = available === 0

                return (
                  <div
                    key={item.id}
                    className="group bg-white rounded-lg shadow-sm hover:shadow-lg transition-all relative flex flex-col overflow-hidden"
                  >
                    {/* Image Section */}
                    <div className="relative bg-gray-50 aspect-square flex items-center justify-center">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-contain p-4"
                          onError={(e) => {
                            // Fallback to placeholder if image fails to load
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                            const placeholder = target.nextElementSibling as HTMLElement
                            if (placeholder) {
                              placeholder.style.display = 'flex'
                            }
                          }}
                        />
                      ) : null}
                      {/* No Photo Placeholder */}
                      <div 
                        className={`w-full h-full flex flex-col items-center justify-center p-4 ${item.imageUrl ? 'hidden' : ''}`}
                        style={{ display: item.imageUrl ? 'none' : 'flex' }}
                      >
                        <ImageIcon className="w-16 h-16 text-gray-300 mb-2" />
                        <p className="text-xs text-gray-400 text-center">No Photo</p>
                      </div>
                      
                      {/* Badge - Top Left */}
                      {available === item.quantity && available > 0 && (
                        <div className="absolute top-3 left-3 bg-white rounded-md border border-gray-200 px-2 py-1 text-xs font-medium text-gray-900">
                          In Stock
                        </div>
                      )}
                      {isLowStock && !isOutOfStock && (
                        <div className="absolute top-3 left-3 bg-yellow-100 rounded-md border border-yellow-200 px-2 py-1 text-xs font-medium text-yellow-800">
                          Low Stock
                        </div>
                      )}
                      {isOutOfStock && (
                        <div className="absolute top-3 left-3 bg-red-100 rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-800">
                          Out of Stock
                        </div>
                      )}
                      
                      {/* Heart Icon - Top Right */}
                      <div className="absolute top-3 right-3 z-10">
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            // Favorite functionality can be added later
                          }}
                          className="p-1.5 bg-white rounded-full shadow-sm hover:bg-gray-50 transition-colors"
                          aria-label="Favorite"
                        >
                          <Heart className="w-4 h-4 text-gray-400 hover:text-red-500 transition-colors" />
                        </button>
                      </div>
                      
                      {/* Menu Button - Top Right (below heart) */}
                      <div className="absolute top-12 right-3 z-10" ref={(el) => { menuRefs.current[item.id] = el }}>
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleMenuClick(e, item.id)
                          }}
                          className="p-1.5 bg-white rounded-full shadow-sm hover:bg-gray-50 transition-colors opacity-0 group-hover:opacity-100"
                          aria-label="More options"
                        >
                          <MoreVertical className="w-4 h-4 text-gray-500" />
                        </button>
                        {openMenuId === item.id && (
                          <div className="absolute right-0 top-10 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                            <button
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                handleEdit(e, item.id)
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                            >
                              <Edit className="w-4 h-4" />
                              Edit
                            </button>
                            <button
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                handleDeleteClick(e, item)
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                      
                      {/* Pagination Dots - Bottom Center (placeholder for future multi-image support) */}
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                        <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                        <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-4 flex flex-col flex-1">
                      {/* Manufacturer/Brand */}
                      {item.manufacturer && (
                        <p className="text-sm text-green-600 mb-1 font-medium">
                          {item.manufacturer}
                        </p>
                      )}
                      
                      {/* Product Name */}
                      <Link
                        href={`/inventory/${item.id}`}
                        className="block"
                      >
                        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 hover:text-blue-600 transition-colors">
                          {item.name}
                        </h3>
                      </Link>
                      
                      {/* Availability/Quantity */}
                      <p className="text-base font-semibold text-gray-900 mb-4">
                        {available} / {item.quantity} Available
                      </p>
                      
                      {/* View Details Button */}
                      <Link
                        href={`/inventory/${item.id}`}
                        className="block"
                      >
                        <button className="w-full bg-gray-800 hover:bg-gray-900 text-white font-semibold py-3 px-4 rounded-lg transition-colors">
                          View Details
                        </button>
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="divide-y divide-gray-200">
                {getSortedItems().map((item) => {
                  const available = getAvailableQuantity(item)
                  const isLowStock = available < item.quantity * 0.3
                  const isOutOfStock = available === 0
                  const isSelected = selectedItems.has(item.id)

                  return (
                    <div
                      key={item.id}
                      className={`hover:bg-gray-50 transition-colors relative group ${
                        isSelected ? 'bg-blue-50' : ''
                      }`}
                    >
                    {/* Checkbox */}
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectItem(item.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </div>

                      <Link
                        href={`/inventory/${item.id}`}
                        className="block p-4 pl-12 pr-12"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {item.name}
                              </h3>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                              {item.manufacturer && (
                                <span>
                                  <strong>Manufacturer:</strong> {item.manufacturer}
                                  {item.model && ` - ${item.model}`}
                                </span>
                              )}
                              {item.location && (
                                <span>
                                  <strong>Location:</strong> {item.location}
                                </span>
                              )}
                              {item.description && (
                                <span className="text-gray-500 truncate max-w-md">
                                  {item.description}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="ml-4">
                            <div
                              className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                                isOutOfStock
                                  ? 'bg-red-100 text-red-800'
                                  : isLowStock
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-green-100 text-green-800'
                              }`}
                            >
                              {available} / {item.quantity} available
                            </div>
                          </div>
                        </div>
                      </Link>
                      {/* Menu Button */}
                      <div className="absolute top-4 right-4 z-10" ref={(el) => { menuRefs.current[item.id] = el }}>
                        <button
                          onClick={(e) => handleMenuClick(e, item.id)}
                          className="p-1 hover:bg-gray-200 rounded transition-colors opacity-0 group-hover:opacity-100"
                          aria-label="More options"
                        >
                          <MoreVertical className="w-5 h-5 text-gray-500" />
                        </button>
                        {openMenuId === item.id && (
                          <div className="absolute right-0 top-8 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                            <button
                              onClick={(e) => handleEdit(e, item.id)}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                            >
                              <Edit className="w-4 h-4" />
                              Edit
                            </button>
                            <button
                              onClick={(e) => handleDeleteClick(e, item)}
                              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Delete Equipment</h3>
              <button
                onClick={handleDeleteCancel}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <strong>{deleteConfirm.itemName}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                variant="primary"
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </Button>
              <Button
                onClick={handleDeleteCancel}
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
  )
}

