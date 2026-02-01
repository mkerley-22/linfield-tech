import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUser } from '@/lib/auth'
import { withRetry } from '@/lib/prisma-retry'

/** Return true if this checkout request should be muted (excluded from notification count). */
async function isRequestMuted(request: { items: string }, userId: string): Promise<boolean> {
  let itemIds: Array<{ inventoryId: string }> = []
  try {
    itemIds = JSON.parse(request.items) as Array<{ inventoryId: string }>
  } catch {
    return false
  }
  if (itemIds.length === 0) return true

  const prefs = await withRetry(
    () => prisma.userPreferences.findUnique({ where: { userId } })
  )
  const mutedCategoryIds: string[] = prefs?.mutedCheckoutCategoryIds
    ? (() => {
        try {
          const arr = JSON.parse(prefs.mutedCheckoutCategoryIds)
          return Array.isArray(arr) ? arr : []
        } catch {
          return []
        }
      })()
    : []

  const items = await withRetry(
    () =>
      prisma.inventoryItem.findMany({
        where: { id: { in: itemIds.map((i) => i.inventoryId) } },
        select: { id: true, suppressCheckoutNotifications: true, categoryId: true },
      })
  )
  const byId = new Map(items.map((i) => [i.id, i]))

  // Muted if every item in the request is either suppressCheckoutNotifications or in a muted category
  const allMuted = itemIds.every(({ inventoryId }) => {
    const item = byId.get(inventoryId)
    if (!item) return false
    if (item.suppressCheckoutNotifications) return true
    if (item.categoryId && mutedCategoryIds.includes(item.categoryId)) return true
    return false
  })
  return allMuted
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all unseen/seen requests first, then filter out muted ones
    const allUnseenSeenRequests = await withRetry(
      () =>
        prisma.checkoutRequest.findMany({
          where: { status: { in: ['unseen', 'seen'] } },
          select: { id: true, items: true },
        }),
      3,
      1000
    )

    let unmutedCount = 0
    for (const req of allUnseenSeenRequests) {
      const muted = await isRequestMuted(req, user.id)
      if (!muted) unmutedCount += 1
    }
    const unseenCheckoutRequests = unmutedCount

    // Count requests with unread messages from requester
    // A request has unread messages if:
    // 1. It has at least one message from requester (senderType === 'requester')
    // 2. The latest message is from requester (not admin)
    // 3. The latest message is newer than when admin last viewed messages
    const allRequests = await withRetry(
      () =>
        prisma.checkoutRequest.findMany({
          include: {
            CheckoutRequestMessage: {
              orderBy: {
                createdAt: 'desc',
              },
              take: 1, // Only need the latest message
            },
          },
        }),
      3,
      1000
    )

    const requestsWithUnreadMessages = allRequests.filter(req => {
      if (!req.CheckoutRequestMessage || req.CheckoutRequestMessage.length === 0) {
        return false
      }
      const latestMessage = req.CheckoutRequestMessage[0]
      if (latestMessage.senderType !== 'requester') return false
      if (!req.messagesLastViewedAt) return true
      return new Date(latestMessage.createdAt) > new Date(req.messagesLastViewedAt)
    })

    // Exclude muted requests from unread message count
    let unreadMessageCount = 0
    for (const req of requestsWithUnreadMessages) {
      const muted = await isRequestMuted(req, user.id)
      if (!muted) unreadMessageCount += 1
    }

    // Get recent unseen/seen requests (last 5), excluding muted
    const recentAll = await withRetry(
      () =>
        prisma.checkoutRequest.findMany({
          where: { status: { in: ['unseen', 'seen'] } },
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: { id: true, requesterName: true, requesterEmail: true, createdAt: true, items: true },
        }),
      3,
      1000
    )
    const recentUnseenRequests: typeof recentAll = []
    for (const req of recentAll) {
      if (recentUnseenRequests.length >= 5) break
      const muted = await isRequestMuted(req, user.id)
      if (!muted) recentUnseenRequests.push(req)
    }

    return NextResponse.json({
      unseenCheckoutRequests,
      unreadMessageCount,
      recentUnseenRequests,
    })
  } catch (error: any) {
    console.error('Get notifications error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

