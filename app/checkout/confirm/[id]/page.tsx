'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { CheckCircle, Calendar, Mail, Plus, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { format, addDays } from 'date-fns'

interface ConfirmData {
  id: string
  requesterName: string
  fromDate: string | null
  toDate: string | null
  itemNames: string[]
}

export default function CheckoutConfirmPage() {
  const params = useParams()
  const router = useRouter()
  const requestId = params?.id as string
  const [data, setData] = useState<ConfirmData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [extendOpen, setExtendOpen] = useState(false)
  const [newToDate, setNewToDate] = useState('')
  const [extending, setExtending] = useState(false)
  const [extendError, setExtendError] = useState<string | null>(null)

  useEffect(() => {
    if (!requestId) {
      setLoading(false)
      setError('Invalid request')
      return
    }
    let cancelled = false
    fetch(`/api/checkout/request/${requestId}/confirm`)
      .then((res) => {
        if (!res.ok) throw new Error(res.status === 404 ? 'Request not found' : 'Failed to load')
        return res.json()
      })
      .then((d) => {
        if (!cancelled) setData(d)
      })
      .catch((e) => {
        if (!cancelled) setError(e.message || 'Failed to load')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [requestId])

  useEffect(() => {
    if (data?.toDate) {
      setNewToDate(data.toDate)
    }
  }, [data?.toDate])

  const handleExtend = async (e: React.FormEvent) => {
    e.preventDefault()
    setExtendError(null)
    if (!newToDate || !data?.toDate) return
    if (newToDate <= data.toDate) {
      setExtendError('New return date must be after the current return date.')
      return
    }
    setExtending(true)
    try {
      const res = await fetch(`/api/checkout/request/${requestId}/extend`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newToDate }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setExtendError(json.error || 'Failed to extend')
        return
      }
      setData((prev) => (prev ? { ...prev, toDate: newToDate } : null))
      setExtendOpen(false)
    } catch {
      setExtendError('Failed to extend. Please try again.')
    } finally {
      setExtending(false)
    }
  }

  const reminderDate = data?.toDate ? format(addDays(new Date(data.toDate), -1), 'MMM d, yyyy') : null

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" aria-hidden />
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 max-w-md w-full text-center">
          <p className="text-gray-600 mb-6">{error || 'Request not found.'}</p>
          <Button variant="secondary" onClick={() => router.push('/checkout/public')}>
            Back to checkout
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <div className="max-w-md mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" aria-hidden />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 text-center mb-2">
            You&apos;re all set
          </h1>
          <p className="text-gray-600 text-center mb-6">
            Your request is confirmed. You can take the equipment now.
          </p>

          {data.fromDate && data.toDate && (
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2 text-gray-700 mb-2">
                <Calendar className="w-5 h-5 text-gray-500 flex-shrink-0" aria-hidden />
                <span className="font-medium">Checkout dates</span>
              </div>
              <p className="text-gray-900 text-base">
                {data.fromDate === data.toDate
                  ? format(new Date(data.fromDate), 'MMM d, yyyy')
                  : `${format(new Date(data.fromDate), 'MMM d, yyyy')} – ${format(new Date(data.toDate), 'MMM d, yyyy')}`}
              </p>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-2">
              <Mail className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" aria-hidden />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-1">Reminder</p>
                <p>
                  We&apos;ll email you at <strong>{data.requesterName}</strong> a day before it&apos;s due back
                  {reminderDate ? ` (${reminderDate})` : ''} so you don&apos;t forget to return it.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              variant="secondary"
              className="w-full min-h-[48px] text-base touch-manipulation"
              onClick={() => setExtendOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" aria-hidden />
              Add more days
            </Button>
            <Button
              variant="primary"
              className="w-full min-h-[48px] text-base touch-manipulation"
              onClick={() => router.push('/checkout/public')}
            >
              Done
            </Button>
          </div>
        </div>
      </div>

      {extendOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => { setExtendOpen(false); setExtendError(null) }}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Add more days</h2>
              <button
                type="button"
                onClick={() => { setExtendOpen(false); setExtendError(null) }}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg touch-manipulation"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Choose a new return date. It must be after your current return date
              {data.toDate ? ` (${format(new Date(data.toDate), 'MMM d, yyyy')})` : ''}.
            </p>
            <form onSubmit={handleExtend} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New return date</label>
                <input
                  type="date"
                  value={newToDate}
                  onChange={(e) => setNewToDate(e.target.value)}
                  min={data.toDate ? addDays(new Date(data.toDate), 1).toISOString().split('T')[0] : undefined}
                  required
                  className="w-full px-4 py-3 min-h-[48px] text-base bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 touch-manipulation"
                />
              </div>
              {extendError && (
                <p className="text-sm text-red-600">{extendError}</p>
              )}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1 min-h-[48px] touch-manipulation"
                  onClick={() => { setExtendOpen(false); setExtendError(null) }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1 min-h-[48px] touch-manipulation"
                  disabled={extending || !newToDate || (data.toDate ? newToDate <= data.toDate : true)}
                >
                  {extending ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
