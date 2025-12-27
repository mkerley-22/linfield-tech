'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronDown, Plus, X } from 'lucide-react'
import { Button } from './ui/Button'

const DEFAULT_LOCATIONS = [
  'Tech Storage Closet',
  'Gym',
  'HighSchool',
  'Middle School',
  'Elementary School',
  'BlackBox',
  'Football Field',
  'Other'
]

interface LocationSelectProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export default function LocationSelect({ value, onChange, placeholder = 'Select or type location', className = '' }: LocationSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [customLocations, setCustomLocations] = useState<string[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load custom locations from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('inventory_custom_locations')
      if (saved) {
        try {
          setCustomLocations(JSON.parse(saved))
        } catch {
          // Ignore parse errors
        }
      }
    }
  }, [])

  // Save custom locations to localStorage
  const saveCustomLocation = (location: string) => {
    if (!location.trim() || DEFAULT_LOCATIONS.includes(location) || customLocations.includes(location)) {
      return
    }
    const updated = [...customLocations, location.trim()]
    setCustomLocations(updated)
    if (typeof window !== 'undefined') {
      localStorage.setItem('inventory_custom_locations', JSON.stringify(updated))
    }
    onChange(location.trim())
    setSearchQuery('')
    setIsOpen(false)
  }

  // Combine default and custom locations
  const allLocations = [...DEFAULT_LOCATIONS, ...customLocations]

  // Filter locations based on search query
  const filteredLocations = allLocations.filter(loc =>
    loc.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Check if search query matches exactly or is a new location
  const exactMatch = allLocations.find(loc => loc.toLowerCase() === searchQuery.toLowerCase())
  const isNewLocation = searchQuery.trim() && !exactMatch && searchQuery.trim() !== value

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchQuery('')
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Focus input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const handleSelect = (location: string) => {
    onChange(location)
    setSearchQuery('')
    setIsOpen(false)
  }

  const handleAddNew = () => {
    if (searchQuery.trim()) {
      saveCustomLocation(searchQuery)
    }
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('')
    setSearchQuery('')
    setIsOpen(false)
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  const handleInputFocus = () => {
    setIsOpen(true)
    // When opening, show all options (clear search to show everything)
    setSearchQuery('')
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setSearchQuery(newValue)
    setIsOpen(true)
  }

  // Show search query when open, otherwise show selected value
  const displayValue = isOpen ? searchQuery : value

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 pr-20"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {value && !isOpen && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
              title="Clear selection"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setIsOpen(!isOpen)
              if (!isOpen) {
                // When opening, show all options
                setSearchQuery('')
              }
            }}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <ChevronDown className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
          {/* Show filtered locations */}
          {filteredLocations.length > 0 && (
            <div className="py-1">
              {filteredLocations.map((location) => (
                <button
                  key={location}
                  type="button"
                  onClick={() => handleSelect(location)}
                  className={`w-full text-left px-4 py-2 hover:bg-blue-50 transition-colors ${
                    value === location ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-900'
                  }`}
                >
                  {location}
                </button>
              ))}
            </div>
          )}
          
          {/* Show "Add" option if typing something new */}
          {isNewLocation && (
            <>
              {filteredLocations.length > 0 && (
                <div className="border-t border-gray-200"></div>
              )}
              <div className="py-1">
                <button
                  type="button"
                  onClick={handleAddNew}
                  className="w-full text-left px-4 py-2 hover:bg-green-50 transition-colors text-green-600 font-medium flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add &quot;{searchQuery}&quot;
                </button>
              </div>
            </>
          )}

          {/* Show message if no results and not typing something new */}
          {filteredLocations.length === 0 && !isNewLocation && searchQuery && (
            <div className="px-4 py-2 text-sm text-gray-500">
              No locations found. Type to add a new location.
            </div>
          )}

          {/* Show all locations if search is empty */}
          {!searchQuery && (
            <div className="py-1">
              {allLocations.map((location) => (
                <button
                  key={location}
                  type="button"
                  onClick={() => handleSelect(location)}
                  className={`w-full text-left px-4 py-2 hover:bg-blue-50 transition-colors ${
                    value === location ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-900'
                  }`}
                >
                  {location}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

