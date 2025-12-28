'use client'

import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import Link from 'next/link'
import { ArrowLeft, Package } from 'lucide-react'
import InventoryEditor from '@/components/InventoryEditor'
import { Button } from '@/components/ui/Button'

export default function EditInventoryPage({ params }: { params: { id: string } }) {
  const [item, setItem] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadItem(params.id)
  }, [params.id])

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
      <main className="flex-1 overflow-y-auto">
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

