'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Package, QrCode, Smartphone, ChevronRight, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface ScanItem {
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

export default function CheckoutScanPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const itemId = searchParams.get('item')
  const nfcParam = searchParams.get('nfc')

  const [item, setItem] = useState<ScanItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [nfcSupported, setNfcSupported] = useState(false)
  const [nfcReading, setNfcReading] = useState(false)

  const loadByItemId = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/inventory/public?itemId=${encodeURIComponent(id)}`)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setError(err.error || 'Item not found or not available for checkout.')
        setItem(null)
        return
      }
      const data = await res.json()
      if (data.item) setItem(data.item)
      else setError('Item not found or not available for checkout.')
    } catch (e: any) {
      setError(e.message || 'Failed to load item')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadByNfc = useCallback(async (nfcTagId: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/inventory/by-nfc?nfcTagId=${encodeURIComponent(nfcTagId)}`)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setError(err.error || 'No item linked to this NFC tag.')
        setItem(null)
        return
      }
      const data = await res.json()
      setItem(data.item)
    } catch (e: any) {
      setError(e.message || 'Failed to look up item')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (nfcParam) {
      loadByNfc(nfcParam)
      return
    }
    if (itemId) {
      loadByItemId(itemId)
      return
    }
    setLoading(false)
    setItem(null)
    // Check Web NFC support (Android Chrome mainly)
    if (typeof navigator !== 'undefined' && 'ndef' in navigator) {
      setNfcSupported(true)
    }
  }, [itemId, nfcParam, loadByItemId, loadByNfc])

  const handleReadNfc = async () => {
    if (!('ndef' in navigator)) {
      setError('NFC is not supported in this browser. Use Android Chrome and tap an NFC tag.')
      return
    }
    setNfcReading(true)
    setError(null)
    try {
      const ndef = (navigator as any).ndef
      await ndef.scan()
      // Web NFC scan() typically requires a callback; API varies. Fallback: prompt for tag ID or redirect to manual entry.
      // Many browsers only support reading in response to user gesture and then we get records. For simplicity we redirect to same page with instructions.
      setError('Tap your NFC tag now. If nothing happens, the tag may not be registered. Try scanning the QR code on the item instead.')
      setTimeout(() => setNfcReading(false), 3000)
    } catch (e: any) {
      setError(e.message || 'Could not read NFC. Try scanning the item\'s QR code instead.')
      setNfcReading(false)
    }
  }

  const goToCheckout = () => {
    if (!item) return
    router.push(`/checkout/public?item=${encodeURIComponent(item.id)}`)
  }

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const qrUrl = item ? `${baseUrl}/checkout/scan?item=${item.id}` : ''

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  // No item in URL and no item loaded: show landing (scan QR or tap NFC)
  if (!itemId && !nfcParam && !item) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
            <QrCode className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Quick Checkout</h1>
          <p className="text-gray-600 mb-6">
            Scan the QR code on the equipment or tap the NFC tag with your phone to check it out.
          </p>
          {nfcSupported && (
            <Button
              onClick={handleReadNfc}
              variant="primary"
              className="w-full mb-4"
              disabled={nfcReading}
            >
              <Smartphone className="w-4 h-4 mr-2" />
              {nfcReading ? 'Listening for NFC...' : 'Tap to read NFC tag'}
            </Button>
          )}
          {!nfcSupported && (
            <p className="text-sm text-gray-500 mb-4">
              On Android, use Chrome and allow NFC when prompted. Or scan the item&apos;s QR code with your camera.
            </p>
          )}
        </div>
      </div>
    )
  }

  // Error (e.g. NFC tag not linked, item not found)
  if (error && !item) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Couldn’t find that item</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link href="/checkout/scan">
            <Button variant="secondary">Try again</Button>
          </Link>
        </div>
      </div>
    )
  }

  // Single item loaded: show item and CTA to checkout
  if (item) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 max-w-md w-full">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Check out this item</h2>
          <div className="flex gap-4 mb-6">
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt={item.name}
                className="w-20 h-20 object-cover rounded-lg"
              />
            ) : (
              <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center">
                <Package className="w-10 h-10 text-gray-400" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">{item.name}</p>
              {item.model && <p className="text-sm text-gray-500 truncate">{item.model}</p>}
              <p className="text-sm text-gray-500">Available: {item.available}</p>
            </div>
          </div>
          <Button onClick={goToCheckout} variant="primary" className="w-full">
            Continue to checkout
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
          <p className="text-xs text-gray-500 mt-4 text-center">
            You’ll enter your name, email, and dates on the next page.
          </p>
        </div>
        {qrUrl && (
          <p className="mt-4 text-xs text-gray-500 text-center max-w-md">
            Share this link for quick checkout: <span className="break-all">{qrUrl}</span>
          </p>
        )}
      </div>
    )
  }

  return null
}
