import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUser } from '@/lib/auth'
import { sendCheckoutRequestConfirmation } from '@/lib/email'
import { withRetry } from '@/lib/prisma-retry'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { requesterName, requesterEmail, requesterPhone, purpose, items } = body

    if (!requesterName || !requesterEmail || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Name, email, and at least one item are required' },
        { status: 400 }
      )
    }

    // Validate items
    for (const item of items) {
      if (!item.inventoryId || !item.quantity || !item.fromDate || !item.toDate) {
        return NextResponse.json(
          { error: 'All items must have inventoryId, quantity, fromDate, and toDate' },
          { status: 400 }
        )
      }

      // Check if item exists and is available for checkout
      const inventoryItem = await prisma.inventoryItem.findUnique({
        where: { id: item.inventoryId },
        include: {
          Checkout: {
            where: {
              status: 'checked_out',
            },
          },
        },
      })

      if (!inventoryItem) {
        return NextResponse.json(
          { error: `Item ${item.inventoryId} not found` },
          { status: 404 }
        )
      }

      if (!inventoryItem.checkoutEnabled) {
        return NextResponse.json(
          { error: `Item "${inventoryItem.name}" is not available for checkout` },
          { status: 400 }
        )
      }

      const available = inventoryItem.quantity - inventoryItem.Checkout.length
      if (item.quantity > available) {
        return NextResponse.json(
          { error: `Only ${available} of "${inventoryItem.name}" are available` },
          { status: 400 }
        )
      }
    }

    // Create checkout request
    const checkoutRequest = await prisma.checkoutRequest.create({
      data: {
        id: crypto.randomUUID(),
        requesterName: requesterName.trim(),
        requesterEmail: requesterEmail.trim(),
        requesterPhone: requesterPhone?.trim() || null,
        purpose: purpose?.trim() || null,
        items: JSON.stringify(items),
        status: 'unseen',
        updatedAt: new Date(),
      },
      include: {
        CheckoutRequestMessage: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    })

    // Create initial message from requester
    await prisma.checkoutRequestMessage.create({
      data: {
        id: crypto.randomUUID(),
        checkoutRequestId: checkoutRequest.id,
        senderType: 'requester',
        senderName: requesterName.trim(),
        senderEmail: requesterEmail.trim(),
        message: purpose?.trim() || 'Checkout request submitted',
      },
    })

    // Send confirmation email
    try {
      await sendCheckoutRequestConfirmation(
        checkoutRequest.requesterEmail,
        checkoutRequest.requesterName,
        checkoutRequest.id
      )
    } catch (error) {
      console.error('Failed to send confirmation email:', error)
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      request: checkoutRequest,
    })
  } catch (error: any) {
    console.error('Create checkout request error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout request' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Require authentication for viewing requests (admin only)
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const email = searchParams.get('email')
    const readyForPickup = searchParams.get('readyForPickup')
    const pickedUp = searchParams.get('pickedUp')
    const returned = searchParams.get('returned')

    const where: any = {}
    if (status) {
      // Handle comma-separated statuses
      if (status.includes(',')) {
        where.status = { in: status.split(',') }
      } else {
        where.status = status
      }
    }
    if (email) {
      where.requesterEmail = email
    }
    if (readyForPickup === 'true') {
      where.readyForPickup = true
    }
    if (pickedUp === 'true') {
      where.pickedUp = true
    }
    if (returned === 'true') {
      // For returned, we need to check if all checkouts are returned
      // This will be filtered client-side or we can do a more complex query
      where.pickedUp = true
    }

    // Fetch all requests
    const requests = await withRetry(
      () => prisma.checkoutRequest.findMany({
        where,
        include: {
          CheckoutRequestMessage: {
            orderBy: {
              createdAt: 'desc', // Latest messages first
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })
    )

    // Optimize: Fetch all checkouts in a single query instead of N+1 queries
    const requestIds = requests.map(req => req.id)
    const allCheckouts = requestIds.length > 0 
      ? await withRetry(
          () => prisma.checkout.findMany({
            where: {
              OR: requestIds.map(id => ({
                notes: {
                  contains: id,
                },
              })),
            },
            select: {
              id: true,
              status: true,
              returnedAt: true,
              dueDate: true,
              checkedOutAt: true,
              notes: true,
            },
          })
        )
      : []

    // Group checkouts by request ID
    const checkoutsByRequestId = new Map<string, Array<{
      id: string
      status: string
      returnedAt: Date | null
      dueDate: Date | null
      checkedOutAt: Date
    }>>()
    allCheckouts.forEach(checkout => {
      if (checkout.notes) {
        // Find which request ID this checkout belongs to
        const requestId = requestIds.find(id => checkout.notes?.includes(id))
        if (requestId) {
          if (!checkoutsByRequestId.has(requestId)) {
            checkoutsByRequestId.set(requestId, [])
          }
          // Exclude notes from the response
          const { notes, ...checkoutWithoutNotes } = checkout
          checkoutsByRequestId.get(requestId)!.push(checkoutWithoutNotes)
        }
      }
    })

    // Map requests with their checkouts
    const requestsWithCheckouts = requests.map(req => ({
      ...req,
      checkouts: checkoutsByRequestId.get(req.id) || [],
    }))

    // Transform to match frontend expectations
    const transformedRequests = requestsWithCheckouts.map(req => ({
      ...req,
      messages: req.CheckoutRequestMessage,
    }))

    return NextResponse.json({ requests: transformedRequests })
  } catch (error: any) {
    console.error('Get checkout requests error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch checkout requests' },
      { status: 500 }
    )
  }
}

