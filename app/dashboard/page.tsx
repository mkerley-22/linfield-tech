import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Plus, Search, FileText, Folder, Bell, Package, ArrowRight } from 'lucide-react'
import Sidebar from '@/components/Sidebar'
import EventsWidget from '@/components/EventsWidget'
import NewDropdown from '@/components/NewDropdown'
import { Button } from '@/components/ui/Button'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'

async function getPages() {
  const pages = await prisma.page.findMany({
    where: {
      parentId: null,
      isPublished: true,
    },
    include: {
      other_Page: {
        where: { isPublished: true },
        orderBy: { order: 'asc' },
      },
      Attachment: true,
      Category: true,
    },
    orderBy: { order: 'asc' },
  })
  return pages
}

async function getCategories() {
  try {
    const categories = await prisma.category.findMany({
      include: {
        Page: {
          where: { isPublished: true, parentId: null },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { order: 'asc' },
    })
    return categories
  } catch (error) {
    console.error('Error fetching categories:', error)
    return []
  }
}

async function getNotifications() {
  try {
    // Only show notifications for requests that are still in "New Requests" status
    // (unseen or seen). Once they move to approved, denied, or any other status,
    // they should disappear from notifications.
    const unseenCheckoutRequests = await prisma.checkoutRequest.findMany({
      where: {
        status: {
          in: ['unseen', 'seen'],
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
      select: {
        id: true,
        requesterName: true,
        requesterEmail: true,
        createdAt: true,
        items: true,
      },
    })

    // Count requests with unread messages from requester
    const allRequests = await prisma.checkoutRequest.findMany({
      include: {
        CheckoutRequestMessage: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
    })

    const requestsWithUnreadMessages = allRequests.filter(req => {
      if (!req.CheckoutRequestMessage || req.CheckoutRequestMessage.length === 0) {
        return false
      }
      const latestMessage = req.CheckoutRequestMessage[0]
      if (latestMessage.senderType !== 'requester') {
        return false
      }
      if (!req.messagesLastViewedAt) {
        return true
      }
      return new Date(latestMessage.createdAt) > new Date(req.messagesLastViewedAt)
    })

    const unreadMessageCount = requestsWithUnreadMessages.length

    return {
      unseenCount: unseenCheckoutRequests.length,
      unreadMessageCount,
      recentRequests: unseenCheckoutRequests,
    }
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return {
      unseenCount: 0,
      unreadMessageCount: 0,
      recentRequests: [],
    }
  }
}

export default async function DashboardPage() {
  try {
    const pages = await getPages()
    const categories = await getCategories()
    const notifications = await getNotifications()

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto lg:ml-0">
        <div className="max-w-6xl mx-auto p-4 lg:p-8 pt-16 lg:pt-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 lg:mb-8 gap-4">
            <div>
              <h1 className="text-2xl lg:text-4xl font-bold text-gray-900 mb-2">
                Dashboard
              </h1>
              <p className="text-sm lg:text-base text-gray-600">
                Linfield Christian School - Temecula, CA
              </p>
            </div>
            <NewDropdown />
          </div>

          {/* Notifications Section */}
          {(notifications.unseenCount > 0 || notifications.unreadMessageCount > 0) && (
            <div className="mt-8 mb-8">
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <Bell className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Notifications</h2>
                      <p className="text-sm text-gray-600">
                        {notifications.unseenCount > 0 && (
                          <span>{notifications.unseenCount} new checkout request{notifications.unseenCount !== 1 ? 's' : ''}</span>
                        )}
                        {notifications.unseenCount > 0 && notifications.unreadMessageCount > 0 && <span> • </span>}
                        {notifications.unreadMessageCount > 0 && (
                          <span>{notifications.unreadMessageCount} unread message{notifications.unreadMessageCount !== 1 ? 's' : ''}</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <Link href="/checkout">
                    <Button variant="primary" size="sm">
                      View All
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
                <div className="space-y-3">
                  {notifications.recentRequests.map((request) => {
                    let itemCount = 0
                    try {
                      const items = JSON.parse(request.items)
                      itemCount = items.length
                    } catch {
                      itemCount = 0
                    }
                    return (
                      <Link
                        key={request.id}
                        href="/checkout"
                        className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Package className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900">{request.requesterName}</p>
                              <p className="text-sm text-gray-600">{request.requesterEmail}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {itemCount} item{itemCount !== 1 ? 's' : ''} • {format(new Date(request.createdAt), 'MMM d, h:mm a')}
                              </p>
                            </div>
                          </div>
                          <span className="px-2 py-1 bg-red-500 text-white text-xs font-semibold rounded-full">
                            New
                          </span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Upcoming Events Widget */}
          <div className="mt-8 mb-8">
            <EventsWidget />
          </div>

          {/* Categories */}
          {categories.length > 0 && (
            <div className="mt-8 mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Categories</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {categories.map((category) => (
                  <Link
                    key={category.id}
                    href={`/categories/${category.slug}`}
                    className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${category.color}20` }}
                      >
                        <Folder
                          className="w-5 h-5"
                          style={{ color: category.color || '#2563eb' }}
                        />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{category.name}</h3>
                        <p className="text-sm text-gray-500">
                          {category.Page.length} page{category.Page.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* All Pages */}
          <div className="mt-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              All Pages {pages.length > 0 && `(${pages.length})`}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pages.map((page) => (
                <Link
                  key={page.id}
                  href={`/pages/${page.slug}`}
                  className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {page.other_Page && page.other_Page.length > 0 ? (
                        <Folder className="w-5 h-5 text-blue-600" />
                      ) : (
                        <FileText className="w-5 h-5 text-blue-600" />
                      )}
                      <h2 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {page.title}
                      </h2>
                    </div>
                  </div>
                  {page.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {page.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                    <span>
                      {page.other_Page && page.other_Page.length > 0
                        ? `${page.other_Page.length} subpages`
                        : 'Page'}
                    </span>
                    {page.Attachment && page.Attachment.length > 0 && (
                      <span>{page.Attachment.length} attachments</span>
                    )}
                  </div>
                {page.Category && (
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2 py-1 text-xs rounded-full font-medium"
                      style={{
                        backgroundColor: `${page.Category.color || '#2563eb'}20`,
                        color: page.Category.color || '#2563eb',
                      }}
                    >
                      {page.Category.name}
                    </span>
                  </div>
                )}
                </Link>
              ))}
              {pages.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No pages yet
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Get started by creating your first knowledge base page
                  </p>
                  <Link href="/pages/new">
                    <Button variant="primary">
                      <Plus className="w-5 h-5" />
                      Create First Page
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

