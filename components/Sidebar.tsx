'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Home, BookOpen, Settings, Folder, Calendar, Package, ShoppingCart, ChevronDown, ChevronRight, Database, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import UserMenu from './UserMenu'
import KnowledgeBaseNav from './KnowledgeBaseNav'

export default function Sidebar() {
  const pathname = usePathname()
  const [unseenCheckoutRequests, setUnseenCheckoutRequests] = useState(0)
  const [unreadMessageCount, setUnreadMessageCount] = useState(0)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    // Fetch notification count
    const fetchNotifications = async () => {
      try {
        const response = await fetch('/api/notifications')
        if (response.ok) {
          const data = await response.json()
          setUnseenCheckoutRequests(data.unseenCheckoutRequests || 0)
          setUnreadMessageCount(data.unreadMessageCount || 0)
        }
      } catch (error) {
        console.error('Failed to fetch notifications:', error)
      }
    }

    fetchNotifications()
    
    // Poll less frequently to reduce server load
    // Poll every 30 seconds when visible, every 60 seconds when hidden
    let interval: NodeJS.Timeout | null = null
    const setupInterval = () => {
      if (interval) {
        clearInterval(interval)
        interval = null
      }
      const isVisible = !document.hidden
      interval = setInterval(fetchNotifications, isVisible ? 30000 : 60000)
    }
    
    setupInterval()
    
    // Update interval when page visibility changes
    const handleVisibilityChange = () => {
      setupInterval()
      // Also fetch immediately when page becomes visible
      if (!document.hidden) {
        fetchNotifications()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    // Listen for status updates from checkout page
    const handleStatusUpdate = () => {
      fetchNotifications()
    }
    window.addEventListener('checkoutStatusUpdated', handleStatusUpdate)
    
    // Listen for new checkout requests
    const handleNewRequest = () => {
      fetchNotifications()
    }
    window.addEventListener('checkoutRequestCreated', handleNewRequest)
    window.addEventListener('checkoutRequestUpdated', handleNewRequest)
    
    return () => {
      if (interval) {
        clearInterval(interval)
        interval = null
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('checkoutStatusUpdated', handleStatusUpdate)
      window.removeEventListener('checkoutRequestCreated', handleNewRequest)
      window.removeEventListener('checkoutRequestUpdated', handleNewRequest)
    }
  }, [])

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/events', label: 'Events', icon: Calendar },
    { href: '/inventory', label: 'Inventory', icon: Package },
    { href: '/checkout', label: 'Checkout', icon: ShoppingCart },
  ]

  const knowledgeBaseItems = [
    { href: '/pages', label: 'Pages', icon: BookOpen },
    { href: '/categories', label: 'Folders', icon: Folder },
  ]

  // Check if any knowledge base item is active
  const isKnowledgeBaseActive = knowledgeBaseItems.some(
    item => pathname === item.href || pathname?.startsWith(item.href + '/')
  )

  return (
    <>
      {/* Knowledge Base Secondary Nav - Only on desktop when Knowledge Base is active */}
      {isKnowledgeBaseActive && (
        <div className="hidden lg:block fixed left-64 top-0 bottom-0 z-30 overflow-hidden" style={{ willChange: 'transform' }}>
          <KnowledgeBaseNav />
        </div>
      )}

      {/* Mobile Header - Always visible on mobile */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50 flex items-center justify-between px-4">
        {/* Hamburger Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="w-10 h-10 flex items-center justify-center"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? (
            <X className="w-6 h-6 text-gray-700" />
          ) : (
            <Menu className="w-6 h-6 text-gray-700" />
          )}
        </button>

        {/* Centered Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center overflow-hidden">
            <img 
              src="/lc-logo.svg" 
              alt="Linfield Christian School" 
              className="w-full h-full object-contain p-1"
            />
          </div>
          <span className="font-bold text-gray-900 text-lg">Linfield AV Hub</span>
        </Link>

        {/* Right side spacer for centering */}
        <div className="w-10"></div>
      </header>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Full screen on mobile, normal on desktop */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 lg:z-40
        w-full lg:w-64 bg-white border-r border-gray-200 flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        lg:translate-x-0
      `}>
      {/* Desktop Header - Only visible on desktop */}
      <div className="hidden lg:block p-6 border-b border-gray-200">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center overflow-hidden">
            <img 
              src="/lc-logo.svg" 
              alt="Linfield Christian School" 
              className="w-full h-full object-contain p-1"
            />
          </div>
          <div>
            <h2 className="font-bold text-gray-900">Linfield AV Hub</h2>
          </div>
        </Link>
      </div>
      
      {/* Mobile Menu Header - Only visible when menu is open on mobile */}
      <div className="lg:hidden p-6 border-b border-gray-200 pt-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center overflow-hidden">
              <img 
                src="/lc-logo.svg" 
                alt="Linfield Christian School" 
                className="w-full h-full object-contain p-1"
              />
            </div>
            <h2 className="font-bold text-gray-900">Linfield AV Hub</h2>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close menu"
          >
            <X className="w-6 h-6 text-gray-700" />
          </button>
        </div>
      </div>
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors relative',
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="flex-1">{item.label}</span>
                  {item.href === '/checkout' && (unseenCheckoutRequests > 0 || unreadMessageCount > 0) && (
                    <span className="ml-auto">
                      <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] text-center flex items-center justify-center shadow-sm">
                        {unseenCheckoutRequests + unreadMessageCount > 99 ? '99+' : unseenCheckoutRequests + unreadMessageCount}
                      </span>
                    </span>
                  )}
                </Link>
              </li>
            )
          })}
          
          {/* Knowledge Base Section */}
          <li className="mt-2">
            <Link
              href="/categories"
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                isKnowledgeBaseActive
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              )}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Database className="w-5 h-5" />
              <span className="flex-1 text-left">Knowledge Base</span>
            </Link>
          </li>
        </ul>
      </nav>
      <div className="p-4 border-t border-gray-200 space-y-4">
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2 px-3">
            Account
          </p>
          <div className="space-y-1">
            <UserMenu />
            <Link
              href="/settings"
              onClick={() => setIsMobileMenuOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                pathname === '/settings' || pathname?.startsWith('/settings/')
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              )}
            >
              <Settings className="w-5 h-5" />
              Settings
            </Link>
          </div>
        </div>
        <p className="text-xs text-gray-500 text-center mt-4">
          Linfield Christian School
        </p>
        <p className="text-xs text-gray-400 text-center mt-1">
          Temecula, CA
        </p>
      </div>
    </aside>
    </>
  )
}

