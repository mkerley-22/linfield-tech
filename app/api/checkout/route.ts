import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Require authentication for viewing checkouts (admin only)
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const userName = searchParams.get('user')
    
    const where: any = {}
    if (status) {
      where.status = status
    }
    if (userName) {
      where.checkedOutBy = { contains: userName }
    }
    
    const checkouts = await prisma.checkout.findMany({
      where,
      include: {
        InventoryItem: {
          include: {
            tags: {
              include: {
                tag: true,
              },
            },
          },
        },
      },
      orderBy: {
        checkedOutAt: 'desc',
      },
    })
    
    return NextResponse.json({ checkouts })
  } catch (error: any) {
    console.error('Get checkouts error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch checkouts' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Require authentication for creating checkouts
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { inventoryId, checkedOutBy, fromDate, toDate, notes } = body
    
    if (!inventoryId || !checkedOutBy) {
      return NextResponse.json(
        { error: 'Inventory ID and checked out by are required' },
        { status: 400 }
      )
    }

    if (!fromDate || !toDate) {
      return NextResponse.json(
        { error: 'From date and to date are required' },
        { status: 400 }
      )
    }

    const from = new Date(fromDate)
    const to = new Date(toDate)

    if (to < from) {
      return NextResponse.json(
        { error: 'To date must be after from date' },
        { status: 400 }
      )
    }
    
    // Check if item is available
    const item = await prisma.inventoryItem.findUnique({
      where: { id: inventoryId },
      include: {
        checkouts: {
          where: {
            status: 'checked_out',
          },
        },
      },
    })
    
    if (!item) {
      return NextResponse.json(
        { error: 'Inventory item not found' },
        { status: 404 }
      )
    }
    
    const checkedOutCount = item.checkouts.length
    if (checkedOutCount >= item.quantity) {
      return NextResponse.json(
        { error: 'All items are currently checked out' },
        { status: 400 }
      )
    }
    
    // Create checkout
    const checkout = await prisma.checkout.create({
      data: {
        inventoryId,
        checkedOutBy,
        fromDate: from,
        dueDate: to, // Store to date as dueDate for backward compatibility
        notes,
        status: 'checked_out',
      },
      include: {
        InventoryItem: {
          include: {
            tags: {
              include: {
                tag: true,
              },
            },
          },
        },
      },
    })
    
    // Update inventory metadata
    await prisma.inventoryItem.update({
      where: { id: inventoryId },
      data: {
        lastUsedAt: new Date(),
        lastUsedBy: checkedOutBy,
      },
    })
    
    return NextResponse.json({ checkout }, { status: 201 })
  } catch (error: any) {
    console.error('Create checkout error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout' },
      { status: 500 }
    )
  }
}

