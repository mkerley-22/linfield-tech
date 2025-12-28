import { NextRequest, NextResponse } from 'next/server'
import { smartSearch } from '@/lib/ai-service'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json()

    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      )
    }

    // Fetch all items
    const items = await prisma.inventoryItem.findMany({
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
    })

    // Transform items for search
    const transformedItems = items.map(item => ({
      id: item.id,
      name: item.name,
      manufacturer: item.manufacturer,
      model: item.model,
      location: item.location,
      tags: item.InventoryItemTag.map(it => ({
        tag: {
          id: it.InventoryTag.id,
          name: it.InventoryTag.name,
        },
      })),
      quantity: item.quantity,
      availableForCheckout: item.availableForCheckout,
      Checkout: item.Checkout,
    }))

    const result = await smartSearch(query, transformedItems)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Smart search error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to perform smart search' },
      { status: 500 }
    )
  }
}

