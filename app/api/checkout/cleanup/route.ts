import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUser } from '@/lib/auth'

// This endpoint should be called periodically (e.g., via cron job) to clean up old returned requests
export async function POST(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can trigger cleanup
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Calculate date 2 months ago
    const twoMonthsAgo = new Date()
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2)

    // Find all requests that have been returned for 2+ months
    const requests = await prisma.checkoutRequest.findMany({
      where: {
        pickedUp: true,
      },
      include: {
        CheckoutRequestMessage: true,
      },
    })

    let deletedCount = 0
    const requestsToDelete: string[] = []

    for (const req of requests) {
      // Check if all checkouts for this request are returned
      const checkouts = await prisma.checkout.findMany({
        where: {
          notes: {
            contains: req.id,
          },
        },
      })

      if (checkouts.length > 0 && checkouts.every(c => c.status === 'returned')) {
        // Find the most recent return date
        const returnDates = checkouts
          .filter(c => c.returnedAt)
          .map(c => c.returnedAt!)
          .sort((a, b) => b.getTime() - a.getTime())

        if (returnDates.length > 0) {
          const mostRecentReturn = returnDates[0]
          if (mostRecentReturn <= twoMonthsAgo) {
            requestsToDelete.push(req.id)
          }
        }
      }
    }

    // Delete the requests (messages will be cascade deleted)
    for (const requestId of requestsToDelete) {
      await prisma.checkoutRequest.delete({
        where: { id: requestId },
      })
      deletedCount++
    }

    return NextResponse.json({ 
      success: true, 
      deletedCount,
      message: `Deleted ${deletedCount} old returned requests` 
    })
  } catch (error: any) {
    console.error('Cleanup error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to cleanup old requests' },
      { status: 500 }
    )
  }
}

// GET endpoint to check how many requests would be deleted (dry run)
export async function GET(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const twoMonthsAgo = new Date()
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2)

    const requests = await prisma.checkoutRequest.findMany({
      where: {
        pickedUp: true,
      },
    })

    let count = 0
    for (const req of requests) {
      const checkouts = await prisma.checkout.findMany({
        where: {
          notes: {
            contains: req.id,
          },
        },
      })

      if (checkouts.length > 0 && checkouts.every(c => c.status === 'returned')) {
        const returnDates = checkouts
          .filter(c => c.returnedAt)
          .map(c => c.returnedAt!)
          .sort((a, b) => b.getTime() - a.getTime())

        if (returnDates.length > 0 && returnDates[0] <= twoMonthsAgo) {
          count++
        }
      }
    }

    return NextResponse.json({ 
      count,
      message: `${count} requests would be deleted` 
    })
  } catch (error: any) {
    console.error('Cleanup check error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to check cleanup' },
      { status: 500 }
    )
  }
}


