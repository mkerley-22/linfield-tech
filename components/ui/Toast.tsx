'use client'

import { useEffect } from 'react'
import { CheckCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ToastProps {
  message: string
  isVisible: boolean
  onClose: () => void
  duration?: number
  type?: 'success' | 'error' | 'info'
}

export function Toast({ message, isVisible, onClose, duration = 3000, type = 'success' }: ToastProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [isVisible, duration, onClose])

  if (!isVisible) return null

  const bgColor = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    info: 'bg-blue-50 border-blue-200',
  }[type]

  const textColor = {
    success: 'text-green-800',
    error: 'text-red-800',
    info: 'text-blue-800',
  }[type]

  const iconColor = {
    success: 'text-green-600',
    error: 'text-red-600',
    info: 'text-blue-600',
  }[type]

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-5 fade-in">
      <div
        className={cn(
          'flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg min-w-[300px] max-w-md',
          bgColor
        )}
      >
        {type === 'success' && <CheckCircle className={cn('w-5 h-5 flex-shrink-0', iconColor)} />}
        {type === 'error' && <X className={cn('w-5 h-5 flex-shrink-0', iconColor)} />}
        <p className={cn('text-sm font-medium flex-1', textColor)}>{message}</p>
        <button
          onClick={onClose}
          className={cn('text-gray-400 hover:text-gray-600 transition-colors', textColor)}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}


