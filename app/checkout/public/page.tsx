'use client'

import { useState, useEffect } from 'react'
import { Package, Calendar, User, Mail, Phone, MessageSquare, Share2, CheckCircle, X, Search, ChevronRight, Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { format } from 'date-fns'

interface InventoryItem {
  id: string
  name: string
  description?: string
  quantity: number
  available: number
  imageUrl?: string
  manufacturer?: string
  model?: string
  tags: Array<{ tag: { name: string; color: string } }>
}

interface SelectedItem {
  inventoryId: string
  quantity: number
}

type Step = 'start' | 'select' | 'review'

export default function PublicCheckoutPage() {
  const [currentStep, setCurrentStep] = useState<Step>('start')
  const [items, setItems] = useState<InventoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedItems, setSelectedItems] = useState<Map<string, SelectedItem>>(new Map())
  const [submitting, setSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<Map<string, InventoryItem[]>>(new Map())
  const [loadingSuggestions, setLoadingSuggestions] = useState<Set<string>>(new Set())
  
  // Form fields
  const [requesterName, setRequesterName] = useState('')
  const [requesterEmail, setRequesterEmail] = useState('')
  const [requesterPhone, setRequesterPhone] = useState('')
  const [purpose, setPurpose] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [emailError, setEmailError] = useState('')

  useEffect(() => {
    loadAvailableItems()
  }, [])

  const loadAvailableItems = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/inventory/public')
      if (response.ok) {
        const data = await response.json()
        setItems(data.items || [])
      }
    } catch (error) {
      console.error('Failed to load items:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const validateLinfieldEmail = (email: string): boolean => {
    const linfieldDomains = ['@linfield.com', '@linfieldcollege.edu']
    return linfieldDomains.some(domain => email.toLowerCase().endsWith(domain))
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value
    setRequesterEmail(email)
    if (email && !validateLinfieldEmail(email)) {
      setEmailError('Please use a Linfield email address (@linfield.com)')
    } else {
      setEmailError('')
    }
  }

  const formatPhoneNumber = (value: string): string => {
    // Remove all non-digit characters
    const phoneNumber = value.replace(/\D/g, '')
    
    // Limit to 10 digits
    const limitedNumber = phoneNumber.slice(0, 10)
    
    // Format based on length
    if (limitedNumber.length === 0) return ''
    if (limitedNumber.length <= 3) return `(${limitedNumber}`
    if (limitedNumber.length <= 6) return `(${limitedNumber.slice(0, 3)}) ${limitedNumber.slice(3)}`
    return `(${limitedNumber.slice(0, 3)}) ${limitedNumber.slice(3, 6)}-${limitedNumber.slice(6)}`
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    setRequesterPhone(formatted)
  }

  const handleStartCheckout = () => {
    if (!requesterName.trim()) {
      alert('Please enter your name')
      return
    }
    if (!requesterEmail.trim()) {
      alert('Please enter your email')
      return
    }
    if (!validateLinfieldEmail(requesterEmail)) {
      alert('Please use a Linfield email address (@linfield.com)')
      return
    }
    if (!fromDate || !toDate) {
      alert('Please select both start and end dates')
      return
    }
    if (new Date(toDate) < new Date(fromDate)) {
      alert('End date must be after start date')
      return
    }
    setCurrentStep('select')
  }

  const loadSuggestions = async (itemId: string) => {
    if (loadingSuggestions.has(itemId) || suggestions.has(itemId)) {
      return
    }

    setLoadingSuggestions(prev => new Set(prev).add(itemId))
    try {
      const response = await fetch(`/api/inventory/${itemId}/suggestions`, {
        method: 'POST',
      })
      if (response.ok) {
        const data = await response.json()
        setSuggestions(prev => new Map(prev).set(itemId, data.suggestions || []))
      }
    } catch (error) {
      console.error('Failed to load suggestions:', error)
    } finally {
      setLoadingSuggestions(prev => {
        const next = new Set(prev)
        next.delete(itemId)
        return next
      })
    }
  }

  const toggleItemSelection = (itemId: string) => {
    const newSelected = new Map(selectedItems)
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId)
      // Remove suggestions when item is deselected
      setSuggestions(prev => {
        const next = new Map(prev)
        next.delete(itemId)
        return next
      })
    } else {
      const item = items.find(i => i.id === itemId)
      if (item) {
        newSelected.set(itemId, {
          inventoryId: itemId,
          quantity: 1,
        })
        // Load suggestions when item is selected
        loadSuggestions(itemId)
      }
    }
    setSelectedItems(newSelected)
  }

  const updateSelectedItem = (itemId: string, updates: Partial<SelectedItem>) => {
    const newSelected = new Map(selectedItems)
    const current = newSelected.get(itemId)
    if (current) {
      newSelected.set(itemId, { ...current, ...updates })
      setSelectedItems(newSelected)
    }
  }

  const handleContinueToReview = () => {
    // Validate all selected items have valid quantities
    for (const [itemId, item] of Array.from(selectedItems.entries())) {
      if (item.quantity < 1) {
        const itemName = items.find(i => i.id === itemId)?.name || 'item'
        alert(`Quantity must be at least 1 for ${itemName}`)
        return
      }
    }
    setCurrentStep('review')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (selectedItems.size === 0) {
      alert('Please select at least one item')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/checkout/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requesterName: requesterName.trim(),
          requesterEmail: requesterEmail.trim(),
          requesterPhone: requesterPhone.trim() || null,
          purpose: purpose.trim() || null,
          items: Array.from(selectedItems.values()).map(item => ({
            ...item,
            fromDate,
            toDate,
          })),
        }),
      })

      if (response.ok) {
        alert('Your checkout request has been submitted! You will receive a confirmation email shortly.')
        // Reset form
        setSelectedItems(new Map())
        setRequesterName('')
        setRequesterEmail('')
        setRequesterPhone('')
        setPurpose('')
        setFromDate('')
        setToDate('')
        setCurrentStep('start')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to submit request')
      }
    } catch (error) {
      console.error('Submit error:', error)
      alert('Failed to submit request')
    } finally {
      setSubmitting(false)
    }
  }

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Equipment Checkout',
          text: 'Check out available equipment',
          url,
        })
      } catch (err) {
        // User cancelled or error
      }
    } else {
      await navigator.clipboard.writeText(url)
      alert('Link copied to clipboard!')
    }
  }

  // Get unique tags from all items
  const allTags = Array.from(
    new Set(
      items.flatMap(item => item.tags.map(({ tag }) => tag.name))
    )
  )

  // Filter items based on search and tag
  const filteredItems = items.filter(item => {
    const matchesSearch = !searchQuery || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.manufacturer?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.model?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesTag = !selectedTag || 
      item.tags.some(({ tag }) => tag.name === selectedTag)
    
    return matchesSearch && matchesTag
  })

  const getStepNumber = (step: Step): number => {
    switch (step) {
      case 'start': return 1
      case 'select': return 2
      case 'review': return 3
    }
  }

  const Stepper = () => {
    const steps = [
      { key: 'start' as Step, label: 'Your Info', number: 1 },
      { key: 'select' as Step, label: 'Select Equipment', number: 2 },
      { key: 'review' as Step, label: 'Review & Submit', number: 3 },
    ]
    const currentStepNum = getStepNumber(currentStep)

    const getStepStatus = (stepNum: number) => {
      if (currentStepNum > stepNum) return { text: 'Completed', color: 'text-green-600' }
      if (currentStepNum === stepNum) return { text: 'In Progress', color: 'text-blue-600' }
      return { text: 'Pending', color: 'text-gray-500' }
    }

    return (
      <div className="mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-start justify-between max-w-4xl mx-auto">
            {steps.map((step, index) => {
              const isCompleted = currentStepNum > step.number
              const isActive = currentStepNum === step.number
              const isPending = currentStepNum < step.number
              const status = getStepStatus(step.number)

              return (
                <div key={step.key} className="flex items-start flex-1">
                  <div className="flex flex-col items-start flex-1">
                    <span className="text-xs text-gray-500 mb-1 uppercase tracking-wide">STEP {step.number}</span>
                    <div className="flex items-start gap-3 w-full">
                      <div className="relative flex-shrink-0 mt-1">
                        {isCompleted ? (
                          <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center">
                            <Check className="w-5 h-5 text-white" />
                          </div>
                        ) : isActive ? (
                          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                            <div className="w-6 h-6 rounded-full bg-blue-800"></div>
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-400 font-semibold text-sm">{step.number}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col flex-1">
                        <span className="text-sm font-bold text-gray-900">{step.label}</span>
                        <span className={`text-xs font-medium ${status.color} mt-0.5`}>{status.text}</span>
                      </div>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="relative flex-1 mx-4" style={{ marginTop: '2.25rem' }}>
                      {isCompleted ? (
                        <div className="h-0.5 bg-green-600"></div>
                      ) : isActive ? (
                        <div className="relative h-0.5">
                          <div className="absolute left-0 top-0 h-full w-1/2 bg-blue-600"></div>
                          <div className="absolute right-0 top-0 h-full w-1/2 bg-blue-100"></div>
                        </div>
                      ) : (
                        <div className="h-0.5 bg-blue-100"></div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading available equipment...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Equipment Checkout</h1>
              <p className="text-gray-600 mt-1">Request equipment for your event or project</p>
            </div>
            <Button
              onClick={handleShare}
              variant="secondary"
              size="sm"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Stepper />

        {currentStep === 'start' && (
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-lg border border-gray-200 p-8 shadow-sm">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Start Checkout</h2>
              <p className="text-gray-600 mb-6">
                Please provide your information to begin the checkout process.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 inline mr-1" />
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={requesterName}
                    onChange={(e) => setRequesterName(e.target.value)}
                    required
                    placeholder="Enter your full name"
                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="w-4 h-4 inline mr-1" />
                    Linfield Email *
                  </label>
                  <input
                    type="email"
                    value={requesterEmail}
                    onChange={handleEmailChange}
                    required
                    placeholder="your.name@linfield.com"
                    className={`w-full px-4 py-2 bg-white border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 ${
                      emailError ? 'border-red-300' : 'border-gray-200'
                    }`}
                  />
                  {emailError && (
                    <p className="mt-1 text-sm text-red-600">{emailError}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Only Linfield email addresses are accepted
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="w-4 h-4 inline mr-1" />
                    Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    value={requesterPhone}
                    onChange={handlePhoneChange}
                    placeholder="(555) 123-4567"
                    maxLength={14}
                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MessageSquare className="w-4 h-4 inline mr-1" />
                    Purpose / Reason (Optional)
                  </label>
                  <textarea
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    rows={3}
                    placeholder="What will you be using this equipment for?"
                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      From Date *
                    </label>
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      required
                      className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      To Date *
                    </label>
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      min={fromDate || new Date().toISOString().split('T')[0]}
                      required
                      className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                    />
                  </div>
                </div>
              </div>

              <Button
                onClick={handleStartCheckout}
                variant="primary"
                className="w-full mt-6"
                disabled={!requesterName.trim() || !requesterEmail.trim() || !!emailError || !fromDate || !toDate}
              >
                Continue to Equipment Selection
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {currentStep === 'select' && (
          <>
            {/* Search and Filters */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search equipment..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                    />
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setSelectedTag(null)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      !selectedTag
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All
                  </button>
                  {allTags.map((tag) => {
                    const tagData = items
                      .flatMap(item => item.tags)
                      .find(({ tag: t }) => t.name === tag)
                    return (
                      <button
                        key={tag}
                        onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          selectedTag === tag
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                        style={
                          selectedTag !== tag && tagData
                            ? { borderLeft: `3px solid ${tagData.tag.color}` }
                            : {}
                        }
                      >
                        {tag}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Selected Items Summary */}
            {selectedItems.size > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''} selected
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {Array.from(selectedItems.values()).reduce((sum, item) => sum + item.quantity, 0)} total items
                    </p>
                  </div>
                  <Button
                    onClick={handleContinueToReview}
                    variant="primary"
                  >
                    Continue to Review
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Equipment Grid */}
            {filteredItems.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No equipment found</h3>
                <p className="text-gray-600">
                  {searchQuery || selectedTag
                    ? 'Try adjusting your filters'
                    : 'No equipment available for checkout'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItems.map((item) => {
                  const isSelected = selectedItems.has(item.id)
                  const selectedData = selectedItems.get(item.id)

                  return (
                    <div
                      key={item.id}
                      className={`bg-white rounded-lg border-2 transition-all ${
                        isSelected
                          ? 'border-blue-500 shadow-lg ring-2 ring-blue-200'
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                      }`}
                    >
                      {/* Image */}
                      <div className="relative h-48 bg-gray-100 rounded-t-lg overflow-hidden">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.style.display = 'none'
                            }}
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <Package className="w-16 h-16 text-gray-400" />
                          </div>
                        )}
                        <button
                          onClick={() => toggleItemSelection(item.id)}
                          className={`absolute top-3 left-3 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                            isSelected
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : 'bg-white border-gray-300 hover:border-blue-500'
                          }`}
                        >
                          {isSelected && <Check className="w-4 h-4" />}
                        </button>
                      </div>

                      {/* Content */}
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-1">{item.name}</h3>
                        {item.description && (
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">{item.description}</p>
                        )}
                        {item.manufacturer && item.model && (
                          <p className="text-xs text-gray-500 mb-2">
                            {item.manufacturer} {item.model}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-1 mb-3">
                          {item.tags.slice(0, 3).map(({ tag }, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-full text-xs font-medium bg-white border-[0.5px] border-blue-300 text-gray-700"
                            >
                              {tag.name}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Available:</span> {item.available}
                          </p>
                          {isSelected && (
                            <span className="text-xs font-medium text-blue-600">Selected</span>
                          )}
                        </div>

                        {/* Selection Details */}
                        {isSelected && selectedData && (
                          <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Quantity
                              </label>
                              <input
                                type="number"
                                min="1"
                                max={item.available}
                                value={selectedData.quantity}
                                onChange={(e) =>
                                  updateSelectedItem(item.id, {
                                    quantity: Math.max(1, Math.min(item.available, parseInt(e.target.value) || 1)),
                                  })
                                }
                                className="w-full px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>

                            {/* AI Suggestions */}
                            {suggestions.has(item.id) && suggestions.get(item.id)!.length > 0 && (
                              <div className="mt-4 pt-4 border-t border-gray-200">
                                <div className="flex items-center gap-2 mb-2">
                                  <Package className="w-4 h-4 text-blue-600" />
                                  <span className="text-xs font-semibold text-gray-700">You might also need:</span>
                                </div>
                                <div className="space-y-2">
                                  {suggestions.get(item.id)!.map((suggestion) => {
                                    const isSuggestionSelected = selectedItems.has(suggestion.id)
                                    return (
                                      <div
                                        key={suggestion.id}
                                        className={`flex items-center justify-between p-2 rounded-lg border transition-colors ${
                                          isSuggestionSelected
                                            ? 'bg-blue-50 border-blue-200'
                                            : 'bg-gray-50 border-gray-200 hover:border-blue-300'
                                        }`}
                                      >
                                        <div className="flex-1 min-w-0">
                                          <p className="text-xs font-medium text-gray-900 truncate">
                                            {suggestion.name}
                                          </p>
                                          {suggestion.available > 0 && (
                                            <p className="text-xs text-gray-500">
                                              {suggestion.available} available
                                            </p>
                                          )}
                                        </div>
                                        {!isSuggestionSelected ? (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              toggleItemSelection(suggestion.id)
                                            }}
                                            className="ml-2 px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded transition-colors"
                                          >
                                            Add
                                          </button>
                                        ) : (
                                          <div className="ml-2 flex items-center gap-1 text-xs text-blue-600">
                                            <Check className="w-3 h-3" />
                                            <span>Added</span>
                                          </div>
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            )}

                            {loadingSuggestions.has(item.id) && (
                              <div className="mt-4 pt-4 border-t border-gray-200">
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  <Package className="w-4 h-4 animate-pulse" />
                                  <span>Finding suggestions...</span>
                                </div>
                              </div>
                            )}

                            <button
                              onClick={() => toggleItemSelection(item.id)}
                              className="w-full mt-2 px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {selectedItems.size > 0 && (
              <div className="mt-6 flex justify-center">
                <Button
                  onClick={() => setCurrentStep('start')}
                  variant="secondary"
                >
                  Back
                </Button>
              </div>
            )}
          </>
        )}

        {currentStep === 'review' && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-lg border border-gray-200 p-8 shadow-sm">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Review Your Request</h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Contact Information */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Contact Information</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-900">{requesterName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-900">{requesterEmail}</span>
                    </div>
                  </div>
                </div>

                {/* Selected Items */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Selected Items ({selectedItems.size})
                  </h3>
                  <div className="space-y-3">
                    {Array.from(selectedItems.entries()).map(([itemId, selectedData]) => {
                      const item = items.find((i) => i.id === itemId)
                      if (!item) return null
                      return (
                        <div
                          key={itemId}
                          className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{item.name}</h4>
                              {item.manufacturer && item.model && (
                                <p className="text-sm text-gray-600 mt-1">
                                  {item.manufacturer} {item.model}
                                </p>
                              )}
                              <div className="mt-2">
                                <p className="text-sm text-gray-600">
                                  <strong>Quantity:</strong> {selectedData.quantity}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                toggleItemSelection(itemId)
                                if (selectedItems.size === 1) {
                                  setCurrentStep('select')
                                }
                              }}
                              className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded ml-2"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Date Range */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Checkout Dates</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-900">
                        <strong>From:</strong> {format(new Date(fromDate), 'MMM d, yyyy')} •{' '}
                        <strong>To:</strong> {format(new Date(toDate), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                {requesterPhone && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Contact Information</h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      {requesterPhone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-900">{requesterPhone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Purpose */}
                {purpose && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Purpose</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-900">{purpose}</p>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <Button
                    type="button"
                    onClick={() => setCurrentStep('select')}
                    variant="secondary"
                    className="flex-1"
                  >
                    Back to Selection
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    className="flex-1"
                    disabled={submitting || selectedItems.size === 0}
                  >
                    {submitting ? 'Submitting...' : 'Submit Request'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
