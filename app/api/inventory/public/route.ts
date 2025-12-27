import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withRetry } from '@/lib/prisma-retry'

export async function GET(request: NextRequest) {
  try {
    // Get only items that have checkout enabled
    const items = await withRetry(
      () => prisma.inventoryItem.findMany({
      where: {
        checkoutEnabled: true,
      },
      include: {
        InventoryItemTag: {
          include: {
            InventoryTag: true,
          },
        },
        Checkout: {
          where: {
            status: 'checked_out',
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
      })
    )

    // Calculate available quantity for each item
    const itemsWithAvailability = items.map((item) => {
      const checkedOutCount = item.Checkout.length
      const available = Math.max(0, item.quantity - checkedOutCount)
      
      return {
        id: item.id,
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        available,
        imageUrl: item.imageUrl,
        manufacturer: item.manufacturer,
        model: item.model,
        tags: item.InventoryItemTag.map((t) => ({
          tag: {
            name: t.InventoryTag.name,
            color: t.InventoryTag.color,
          },
        })),
      }
    })

    return NextResponse.json({ items: itemsWithAvailability })
  } catch (error: any) {
    console.error('Get public inventory error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch inventory' },
      { status: 500 }
    )
  }
}

