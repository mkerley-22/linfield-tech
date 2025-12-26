import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUser, isEditor } from '@/lib/auth'
import { sendCheckoutRequestStatusUpdate, sendReadyForPickupEmail } from '@/lib/email'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const checkoutRequest = await prisma.checkoutRequest.findUnique({
      where: { id: resolvedParams.id },
      include: {
        CheckoutRequestMessage: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    })

    if (!checkoutRequest) {
      return NextResponse.json(
        { error: 'Checkout request not found' },
        { status: 404 }
      )
    }

    // Find related checkouts
    let checkouts = await prisma.checkout.findMany({
      where: {
        notes: {
          contains: resolvedParams.id,
        },
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

    // Clean up any checkout records that were created on approval but shouldn't exist yet
    // (These are from the old behavior where approval created checkouts)
    // Only delete if request is not ready for pickup and not picked up
    if (!checkoutRequest.readyForPickup && !checkoutRequest.pickedUp) {
      const prematureCheckouts = checkouts.filter(
        (c) => c.notes?.includes('Approved from checkout request') && c.status === 'checked_out'
      )

      if (prematureCheckouts.length > 0) {
        // Delete the premature checkouts
        await prisma.checkout.deleteMany({
          where: {
            id: {
              in: prematureCheckouts.map((c) => c.id),
            },
          },
        })

        // Remove them from the checkouts array we return
        const prematureIds = new Set(prematureCheckouts.map((c) => c.id))
        checkouts = checkouts.filter((c) => !prematureIds.has(c.id))
      }
    }

    // Transform to match frontend expectations
    const transformedRequest = {
      ...checkoutRequest,
      messages: checkoutRequest.CheckoutRequestMessage,
      checkouts: checkouts.map(({ notes, ...rest }) => rest), // Remove notes from response
    }

    return NextResponse.json({ request: transformedRequest })
  } catch (error: any) {
    console.error('Get checkout request error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch checkout request' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await Promise.resolve(params)
    const body = await request.json()
    const { status, message, readyForPickup, pickupDate, pickupTime, pickupLocation, pickedUp } = body

    const checkoutRequest = await prisma.checkoutRequest.findUnique({
      where: { id: resolvedParams.id },
    })

    if (!checkoutRequest) {
      return NextResponse.json(
        { error: 'Checkout request not found' },
        { status: 404 }
      )
    }

    // Update status
    const updateData: any = {}
    if (status && ['unseen', 'seen', 'approved', 'denied'].includes(status)) {
      updateData.status = status
      if (status === 'approved' || status === 'denied') {
        updateData.approvedBy = user.email || user.name || 'Unknown'
        updateData.approvedAt = new Date()
      }
    }

    // Update pickup scheduling fields
    if (readyForPickup !== undefined) {
      updateData.readyForPickup = readyForPickup
    }
    if (pickupDate !== undefined) {
      updateData.pickupDate = pickupDate ? new Date(pickupDate) : null
    }
    if (pickupTime !== undefined) {
      updateData.pickupTime = pickupTime || null
    }
    if (pickupLocation !== undefined) {
      updateData.pickupLocation = pickupLocation || null
    }
    if (pickedUp !== undefined) {
      updateData.pickedUp = pickedUp
      if (pickedUp && !checkoutRequest.pickedUp) {
        updateData.pickedUpAt = new Date()
      }
    }

    const updated = await prisma.checkoutRequest.update({
      where: { id: resolvedParams.id },
      data: updateData,
    })

    // Add message if provided
    if (message && message.trim()) {
      await prisma.checkoutRequestMessage.create({
        data: {
          checkoutRequestId: resolvedParams.id,
          senderType: 'admin',
          senderName: user.name || user.email || 'Admin',
          senderEmail: user.email || null,
          message: message.trim(),
        },
      })
    }

    // Clean up any checkout records that were created on approval but shouldn't exist yet
    // (These are from the old behavior where approval created checkouts)
    // Only delete if request is not ready for pickup and not picked up
    if (!updated.readyForPickup && !updated.pickedUp) {
      const prematureCheckouts = await prisma.checkout.findMany({
        where: {
          notes: {
            contains: resolvedParams.id,
          },
          status: 'checked_out',
        },
      })

      // Delete checkouts that were created on approval (old behavior)
      for (const checkout of prematureCheckouts) {
        if (checkout.notes?.includes('Approved from checkout request')) {
          await prisma.checkout.delete({
            where: { id: checkout.id },
          })
        }
      }
    }

    // If ready for pickup, create actual checkouts (only if they don't already exist)
    // This is when availability should change, not on approval
    if (readyForPickup && !checkoutRequest.readyForPickup) {
      // Check if checkouts already exist for this request
      const existingCheckouts = await prisma.checkout.findMany({
        where: {
          notes: {
            contains: resolvedParams.id,
          },
        },
      })

      // Only create checkouts if they don't already exist
      if (existingCheckouts.length === 0) {
        const items = JSON.parse(checkoutRequest.items)
        for (const item of items) {
          for (let i = 0; i < item.quantity; i++) {
            await prisma.checkout.create({
              data: {
                id: crypto.randomUUID(),
                inventoryId: item.inventoryId,
                checkedOutBy: checkoutRequest.requesterName,
                userId: null, // Public checkout, no user account
                fromDate: new Date(item.fromDate),
                dueDate: new Date(item.toDate),
                status: 'checked_out',
                notes: `Ready for pickup from checkout request ${resolvedParams.id}`,
                updatedAt: new Date(),
              },
            })
          }
        }
      }
    }

    // If picked up, create actual checkouts (only if they don't already exist)
    // This handles the case where items are marked as picked up without being marked ready first
    if (pickedUp && !checkoutRequest.pickedUp) {
      // Check if checkouts already exist for this request
      const existingCheckouts = await prisma.checkout.findMany({
        where: {
          notes: {
            contains: resolvedParams.id,
          },
        },
      })

      // Only create checkouts if they don't already exist
      if (existingCheckouts.length === 0) {
        const items = JSON.parse(checkoutRequest.items)
        for (const item of items) {
          for (let i = 0; i < item.quantity; i++) {
            await prisma.checkout.create({
              data: {
                id: crypto.randomUUID(),
                inventoryId: item.inventoryId,
                checkedOutBy: checkoutRequest.requesterName,
                userId: null, // Public checkout, no user account
                fromDate: new Date(item.fromDate),
                dueDate: new Date(item.toDate),
                status: 'checked_out',
                notes: `Picked up from checkout request ${resolvedParams.id}`,
                updatedAt: new Date(),
              },
            })
          }
        }
      }
    }

    // Send email notification
    if (status && ['seen', 'approved', 'denied'].includes(status)) {
      try {
        await sendCheckoutRequestStatusUpdate(
          updated.requesterEmail,
          updated.requesterName,
          updated.id,
          status as 'seen' | 'approved' | 'denied',
          message
        )
      } catch (error) {
        console.error('Failed to send status update email:', error)
        // Don't fail the request if email fails
      }
    }

    // Send ready for pickup email
    if (readyForPickup && updated.readyForPickup) {
      try {
        await sendReadyForPickupEmail(
          updated.requesterEmail,
          updated.requesterName,
          updated.id
        )
      } catch (error) {
        console.error('Failed to send ready for pickup email:', error)
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({ success: true, request: updated })
  } catch (error: any) {
    console.error('Update checkout request error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update checkout request' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only editors and admins can delete requests
    const canDelete = await isEditor()
    if (!canDelete) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const resolvedParams = await Promise.resolve(params)
    const checkoutRequest = await prisma.checkoutRequest.findUnique({
      where: { id: resolvedParams.id },
    })

    if (!checkoutRequest) {
      return NextResponse.json(
        { error: 'Checkout request not found' },
        { status: 404 }
      )
    }

    // Delete the request (messages will be cascade deleted)
    await prisma.checkoutRequest.delete({
      where: { id: resolvedParams.id },
    })

    console.log(`Checkout request ${resolvedParams.id} deleted by ${user.email}`)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete checkout request error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete checkout request' },
      { status: 500 }
    )
  }
}

