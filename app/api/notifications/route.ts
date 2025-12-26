import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Only show notifications for requests that are still in "New Requests" status
    // (unseen or seen). Once they move to approved, denied, or any other status,
    // they should disappear from notifications.
    const unseenCheckoutRequests = await prisma.checkoutRequest.count({
      where: {
        status: {
          in: ['unseen', 'seen'],
        },
      },
    })

    // Get recent unseen/seen requests (last 5)
    const recentUnseenRequests = await prisma.checkoutRequest.findMany({
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

    return NextResponse.json({
      unseenCheckoutRequests,
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

