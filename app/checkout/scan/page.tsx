'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Package, QrCode, Smartphone, ChevronRight, Loader2, AlertCircle, FileText, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface DocLink {
  url: string
  title: string
  type?: string
}

interface Doc {
  id: string
  fileName: string
  filePath: string
  fileType: string
}

interface ScanItem {
  id: string
  name: string
  description?: string
  quantity: number
  available: number
  imageUrl?: string
  manufacturer?: string
  model?: string
  usageNotes?: string
  tags: Array<{ tag: { name: string; color: string } }>
  documentationLinks?: DocLink[]
  documents?: Doc[]
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
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load item')
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
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to look up item')
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
      const ndef = (navigator as { ndef?: { scan: () => Promise<unknown> } }).ndef
      await ndef?.scan()
      setError('Tap your NFC tag now. If nothing happens, the tag may not be registered. Try scanning the item\'s QR code instead.')
      setTimeout(() => setNfcReading(false), 3000)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not read NFC. Try scanning the item\'s QR code instead.')
      setNfcReading(false)
    }
  }

  const goToCheckout = () => {
    if (!item) return
    router.push(`/checkout/public?item=${encodeURIComponent(item.id)}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen min-h-[100dvh] bg-gray-50 flex flex-col items-center justify-center p-6 overflow-x-hidden pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))]">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" aria-hidden />
        <p className="text-gray-600 text-base">Loading...</p>
      </div>
    )
  }

  if (!itemId && !nfcParam && !item) {
    return (
      <div className="min-h-screen min-h-[100dvh] bg-gray-50 flex flex-col items-center justify-center p-4 sm:p-6 overflow-x-hidden pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))]">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-5">
            <QrCode className="w-8 h-8 text-blue-600" aria-hidden />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Quick Checkout</h1>
          <p className="text-gray-600 text-base leading-relaxed mb-6">
            Scan the QR code on the equipment or tap the NFC tag with your phone to view the item and check it out.
          </p>
          {nfcSupported && (
            <Button
              onClick={handleReadNfc}
              variant="primary"
              className="w-full min-h-[48px] text-base touch-manipulation mb-4"
              disabled={nfcReading}
            >
              <Smartphone className="w-4 h-4 mr-2" aria-hidden />
              {nfcReading ? 'Listening for NFC...' : 'Tap to read NFC tag'}
            </Button>
          )}
          {!nfcSupported && (
            <p className="text-gray-500 mb-4 text-base leading-relaxed">
              On Android, use Chrome and allow NFC when prompted. Or scan the item&apos;s QR code with your camera.
            </p>
          )}
        </div>
      </div>
    )
  }

  if (error && !item) {
    return (
      <div className="min-h-screen min-h-[100dvh] bg-gray-50 flex flex-col items-center justify-center p-4 sm:p-6 overflow-x-hidden pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))]">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" aria-hidden />
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Couldn&apos;t find that item</h2>
          <p className="text-gray-600 text-base mb-6 break-words">{error}</p>
          <Link href="/checkout/scan" className="inline-block w-full sm:w-auto">
            <Button variant="secondary" className="w-full sm:w-auto min-h-[48px] text-base touch-manipulation">
              Try again
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  if (item) {
    const docs = item.documents ?? []
    const links = item.documentationLinks ?? []
    const hasDocs = docs.length > 0 || links.length > 0

    return (
      <div className="min-h-screen min-h-[100dvh] bg-gray-50 flex flex-col overflow-x-hidden pb-28 sm:pb-8">
        {/* Product content — scrollable, safe area padding */}
        <div className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-5 sm:py-6 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))]">
          {/* Image */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm mb-6 -mx-px">
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt={item.name}
                className="w-full aspect-video object-contain bg-gray-50"
                loading="eager"
                decoding="async"
              />
            ) : (
              <div className="w-full aspect-video bg-gray-100 flex items-center justify-center">
                <Package className="w-20 h-20 text-gray-400" aria-hidden />
              </div>
            )}
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 leading-tight break-words">
            {item.name}
          </h1>
          {(item.manufacturer || item.model) && (
            <p className="text-gray-600 text-base mb-5 break-words">
              {[item.manufacturer, item.model].filter(Boolean).join(' · ')}
            </p>
          )}

          {/* Product details */}
          <section className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-sm mb-6">
            <h2 className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Product details
            </h2>
            {item.description && (
              <p className="text-gray-700 text-base leading-relaxed mb-4 whitespace-pre-wrap break-words">
                {item.description}
              </p>
            )}
            {item.usageNotes && (
              <p className="text-gray-600 text-base mb-4 leading-relaxed">
                <span className="font-medium text-gray-700">Usage:</span> {item.usageNotes}
              </p>
            )}
            <p className="text-base text-gray-600">
              <span className="font-medium">Available:</span> {item.available} of {item.quantity}
            </p>
            {item.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {item.tags.map(({ tag }, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 rounded-full text-sm font-medium border touch-manipulation"
                    style={{ borderColor: tag.color || '#e5e7eb', color: tag.color || '#374151' }}
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            )}
          </section>

          {/* Documentation & external links — large touch targets */}
          {hasDocs && (
            <section className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-sm mb-6">
              <h2 className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4 flex-shrink-0" aria-hidden />
                Documentation &amp; links
              </h2>
              <ul className="space-y-1">
                {docs.map((doc) => (
                  <li key={doc.id}>
                    <a
                      href={doc.filePath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 min-h-[44px] py-3 px-2 -mx-2 rounded-xl text-blue-600 hover:text-blue-800 hover:bg-blue-50 active:bg-blue-100 text-base font-medium touch-manipulation transition-colors break-words"
                    >
                      <FileText className="w-5 h-5 flex-shrink-0" aria-hidden />
                      <span className="break-all">{doc.fileName}</span>
                    </a>
                  </li>
                ))}
                {links.map((link, idx) => (
                  <li key={idx}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 min-h-[44px] py-3 px-2 -mx-2 rounded-xl text-blue-600 hover:text-blue-800 hover:bg-blue-50 active:bg-blue-100 text-base font-medium touch-manipulation transition-colors break-words"
                    >
                      <ExternalLink className="w-5 h-5 flex-shrink-0" aria-hidden />
                      <span className="break-all">{link.title || link.url}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <p className="text-sm text-gray-500 text-center mt-6 mb-2">
            Need this item? Use the button below to request checkout.
          </p>
        </div>

        {/* Checkout button — fixed at bottom on mobile, safe area */}
        <div
          className="fixed bottom-0 left-0 right-0 sm:relative sm:max-w-2xl sm:mx-auto sm:px-4 sm:pb-0 p-4 pt-3 bg-white/95 backdrop-blur-sm border-t border-gray-200 sm:border-0 sm:bg-transparent sm:backdrop-blur-none"
          style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
        >
          <div className="pl-[max(0.5rem,env(safe-area-inset-left))] pr-[max(0.5rem,env(safe-area-inset-right))]">
            <Button
              onClick={goToCheckout}
              variant="primary"
              className="w-full min-h-[52px] text-base font-semibold touch-manipulation sm:max-w-2xl sm:mx-auto rounded-xl active:scale-[0.98] transition-transform"
            >
              Checkout
              <ChevronRight className="w-4 h-4 ml-2" aria-hidden />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
