import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const linkedInventory = await prisma.eventInventory.findMany({
      where: {
        eventId: params.id,
      },
      include: {
        inventory: {
          select: {
            id: true,
            name: true,
            quantity: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ inventory: linkedInventory })
  } catch (error: any) {
    console.error('Get linked inventory error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch linked inventory' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { inventoryId, quantity } = body
    
    if (!inventoryId) {
      return NextResponse.json(
        { error: 'Inventory ID is required' },
        { status: 400 }
      )
    }
    
    const eventInventory = await prisma.eventInventory.upsert({
      where: {
        eventId_inventoryId: {
          eventId: params.id,
          inventoryId,
        },
      },
      create: {
        eventId: params.id,
        inventoryId,
        quantity: quantity || 1,
      },
      update: {
        quantity: quantity || 1,
      },
      include: {
        inventory: {
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
    
    return NextResponse.json({ eventInventory }, { status: 201 })
  } catch (error: any) {
    console.error('Link inventory to event error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to link inventory to event' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams
    const inventoryId = searchParams.get('inventoryId')
    
    if (!inventoryId) {
      return NextResponse.json(
        { error: 'Inventory ID is required' },
        { status: 400 }
      )
    }
    
    await prisma.eventInventory.delete({
      where: {
        eventId_inventoryId: {
          eventId: params.id,
          inventoryId,
        },
      },
    })
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Unlink inventory from event error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to unlink inventory from event' },
      { status: 500 }
    )
  }
}

