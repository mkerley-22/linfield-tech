'use client'

import { useState, useEffect, useRef } from 'react'
import Sidebar from '@/components/Sidebar'
import Link from 'next/link'
import { ArrowLeft, Package } from 'lucide-react'
import InventoryEditor from '@/components/InventoryEditor'
import { Button } from '@/components/ui/Button'

export default function EditInventoryPage({ params }: { params: { id: string } }) {
  const [item, setItem] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const mainRef = useRef<HTMLElement>(null)

  useEffect(() => {
    loadItem(params.id)
  }, [params.id])

  // Fix mobile keyboard scroll issue
  useEffect(() => {
    let lastViewportHeight = window.innerHeight
    let resizeTimeout: NodeJS.Timeout

    const handleResize = () => {
      clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(() => {
        const currentViewportHeight = window.innerHeight
        // If viewport height increased (keyboard closed), fix scroll position
        if (currentViewportHeight > lastViewportHeight) {
          const scrollY = window.scrollY
          const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
          
          // If scrolled beyond bounds, clamp to valid range
          if (scrollY > maxScroll || scrollY < 0) {
            window.scrollTo({ 
              top: Math.max(0, Math.min(scrollY, maxScroll)), 
              behavior: 'instant' 
            })
          }
        }
        lastViewportHeight = currentViewportHeight
      }, 150)
    }

    const handleBlur = (e: FocusEvent) => {
      // When input loses focus (keyboard closes), fix scroll position
      if (e.target instanceof HTMLElement && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
        setTimeout(() => {
          const scrollY = window.scrollY
          const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
          
          // Clamp scroll position to valid range
          if (scrollY > maxScroll || scrollY < 0) {
            window.scrollTo({ 
              top: Math.max(0, Math.min(scrollY, maxScroll)), 
              behavior: 'instant' 
            })
          }
        }, 200)
      }
    }

    const handleScroll = () => {
      // Prevent scrolling beyond document bounds
      const scrollY = window.scrollY
      const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
      
      if (scrollY > maxScroll) {
        window.scrollTo({ top: maxScroll, behavior: 'instant' })
      } else if (scrollY < 0) {
        window.scrollTo({ top: 0, behavior: 'instant' })
      }
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('scroll', handleScroll, { passive: true })
    document.addEventListener('focusout', handleBlur)

    return () => {
      clearTimeout(resizeTimeout)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('scroll', handleScroll)
      document.removeEventListener('focusout', handleBlur)
    }
  }, [])

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

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto p-4 lg:p-8 pt-24 lg:pt-8">
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
          <div className="max-w-6xl mx-auto p-4 lg:p-8 pt-24 lg:pt-8">
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

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main ref={mainRef} className="flex-1 overflow-y-auto" style={{ maxHeight: '100vh', overflowY: 'auto' }}>
        <div className="max-w-4xl mx-auto p-4 lg:p-8 pt-24 lg:pt-8">
          <Link
            href="/inventory"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Inventory
          </Link>
          <h1 className="text-2xl lg:text-4xl font-bold text-gray-900 mb-2">Edit Equipment</h1>
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <InventoryEditor
              itemId={params.id}
              initialData={{
                name: item.name,
                description: item.description,
                quantity: item.quantity,
                manufacturer: item.manufacturer,
                model: item.model,
                serialNumbers: item.serialNumbers,
                location: item.location,
                locationBreakdowns: item.locationBreakdowns,
                usageNotes: item.usageNotes,
                availableForCheckout: item.availableForCheckout,
                checkoutEnabled: item.checkoutEnabled || false,
                tagIds: item.tags.map((t: any) => t.tag.id),
                imageUrl: item.imageUrl,
                documentationLinks: item.documentationLinks,
                documents: item.documents || [],
              }}
            />
          </div>
        </div>
      </main>
    </div>
  )
}

