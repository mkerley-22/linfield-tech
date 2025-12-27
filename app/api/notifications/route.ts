import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withRetry } from '@/lib/prisma-retry'

export async function GET(request: NextRequest) {
  try {
    // Only show notifications for requests that are still in "New Requests" status
    // (unseen or seen). Once they move to approved, denied, or any other status,
    // they should disappear from notifications.
    const unseenCheckoutRequests = await withRetry(
      () =>
        prisma.checkoutRequest.count({
          where: {
            status: {
              in: ['unseen', 'seen'],
            },
          },
        }),
      3,
      1000
    )

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
      // Unread if latest message is from requester AND it's newer than last viewed time
      if (latestMessage.senderType !== 'requester') {
        return false
      }
      // If messagesLastViewedAt is null, there are unread messages
      if (!req.messagesLastViewedAt) {
        return true
      }
      // Check if latest message is newer than last viewed time
      return new Date(latestMessage.createdAt) > new Date(req.messagesLastViewedAt)
    })

    const unreadMessageCount = requestsWithUnreadMessages.length

    // Get recent unseen/seen requests (last 5)
    const recentUnseenRequests = await withRetry(
      () =>
        prisma.checkoutRequest.findMany({
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
        }),
      3,
      1000
    )

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

