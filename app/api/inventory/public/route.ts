import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withRetry } from '@/lib/prisma-retry'

export async function GET(request: NextRequest) {
  try {
    const itemId = request.nextUrl.searchParams.get('itemId')?.trim()
    if (itemId) {
      // Single-item lookup for scan page (QR / deep link): find by id, then enforce checkout enabled
      const item = await withRetry(
        () =>
          prisma.inventoryItem.findUnique({
            where: { id: itemId },
            include: {
              Checkout: { where: { status: 'checked_out' } },
              InventoryItemTag: { include: { InventoryTag: true } },
              InventoryDocument: true,
            },
          })
      )
      if (!item) {
        return NextResponse.json(
          { error: 'Item not found.' },
          { status: 404 }
        )
      }
      if (!item.checkoutEnabled) {
        return NextResponse.json(
          { error: 'This item is not available for checkout.' },
          { status: 404 }
        )
      }
      const available = Math.max(0, item.quantity - item.Checkout.length)
      let documentationLinks: Array<{ url: string; title: string; type?: string }> = []
      if (item.documentationLinks) {
        try {
          documentationLinks = JSON.parse(item.documentationLinks) as Array<{ url: string; title: string; type?: string }>
        } catch {
          documentationLinks = []
        }
      }
      return NextResponse.json({
        item: {
          id: item.id,
          name: item.name,
          description: item.description,
          quantity: item.quantity,
          available,
          imageUrl: item.imageUrl,
          manufacturer: item.manufacturer,
          model: item.model,
          usageNotes: item.usageNotes ?? undefined,
          tags: item.InventoryItemTag.map((t) => ({
            tag: { name: t.InventoryTag.name, color: t.InventoryTag.color },
          })),
          documentationLinks,
          documents: (item.InventoryDocument || []).map((d) => ({
            id: d.id,
            fileName: d.fileName,
            filePath: d.filePath,
            fileType: d.fileType,
          })),
        },
      })
    }

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

