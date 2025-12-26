'use client'

import { cn } from '@/lib/utils'
import { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'active' | 'primary' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
}

export function Button({ 
  className, 
  variant = 'default', 
  size = 'md',
  children,
  ...props 
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none'
  
  const variants = {
    default: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50',
    active: 'bg-blue-100 text-blue-700 border border-blue-300',
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
  }
  
  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-4 py-2',
    lg: 'px-4 py-2 text-lg',
  }

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  )
}

