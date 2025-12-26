'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { User, LogOut, Loader2 } from 'lucide-react'

interface UserData {
  id: string
  email: string
  name: string
  picture?: string
  role: string
}

export default function UserMenu() {
  const router = useRouter()
  const [user, setUser] = useState<UserData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showMenu, setShowMenu] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    loadUser()
  }, [])

  const loadUser = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      }
    } catch (error) {
      console.error('Failed to load user:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      })

      if (response.ok) {
        router.push('/login')
        router.refresh()
      } else {
        alert('Failed to logout. Please try again.')
        setIsLoggingOut(false)
      }
    } catch (error) {
      console.error('Logout error:', error)
      alert('Failed to logout. Please try again.')
      setIsLoggingOut(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-gray-600">
        <Loader2 className="w-4 h-4 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <a
        href="/login"
        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
      >
        <User className="w-4 h-4" />
        Sign In
      </a>
    )
  }

  const handleMouseEnter = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current)
      hideTimeoutRef.current = null
    }
    setShowMenu(true)
  }

  const handleMouseLeave = () => {
    hideTimeoutRef.current = setTimeout(() => {
      setShowMenu(false)
    }, 150) // Small delay to allow mouse movement up to dropdown
  }

  return (
    <div 
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors w-full"
      >
        {user.picture ? (
          <img
            src={user.picture}
            alt={user.name}
            className="w-6 h-6 rounded-full"
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
            <span className="text-white text-xs font-medium">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <span className="flex-1 text-left">{user.name}</span>
      </button>

      {showMenu && (
        <div 
          className="absolute bottom-full right-0 mb-0 w-56 bg-white rounded-lg border border-gray-200 shadow-lg z-20"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="p-1">
            <div className="p-3 border-b border-gray-200">
              <p className="text-sm font-medium text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-500 mt-1">{user.email}</p>
            </div>
            <div className="p-2">
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50"
              >
                {isLoggingOut ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Logging out...
                  </>
                ) : (
                  <>
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

