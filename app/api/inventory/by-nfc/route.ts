import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withRetry } from '@/lib/prisma-retry'

/**
 * Public API: look up an inventory item by its NFC tag ID.
 * Used when a user taps an NFC tag on a device (e.g. camera) for quick checkout.
 * Returns the item if found and checkout-enabled; 404 otherwise.
 */
export async function GET(request: NextRequest) {
  try {
    const nfcTagId = request.nextUrl.searchParams.get('nfcTagId')?.trim()
    if (!nfcTagId) {
      return NextResponse.json(
        { error: 'nfcTagId query parameter is required' },
        { status: 400 }
      )
    }

    const item = await withRetry(
      () =>
        prisma.inventoryItem.findUnique({
          where: { nfcTagId },
          include: {
            Checkout: {
              where: { status: 'checked_out' },
            },
            InventoryItemTag: {
              include: { InventoryTag: true },
            },
            InventoryDocument: true,
          },
        })
    )

    if (!item || !item.checkoutEnabled) {
      return NextResponse.json(
        { error: 'Item not found or not available for checkout' },
        { status: 404 }
      )
    }

    const checkedOutCount = item.Checkout.length
    const available = Math.max(0, item.quantity - checkedOutCount)
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
  } catch (error: any) {
    console.error('Get inventory by NFC error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to lookup item' },
      { status: 500 }
    )
  }
}
