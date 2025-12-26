'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Plus, FileText, Package, Calendar, ChevronDown } from 'lucide-react'
import { Button } from './ui/Button'

export default function NewDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const menuItems = [
    { href: '/pages/new', label: 'Page', icon: FileText },
    { href: '/inventory/new', label: 'Inventory', icon: Package },
    { href: '/events/new', label: 'Event', icon: Calendar },
  ]

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="primary"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2"
      >
        <Plus className="w-5 h-5" />
        New
        <ChevronDown className="w-4 h-4" />
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

