import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withRetry } from '@/lib/prisma-retry'

/**
 * Public API: minimal data for the confirmation page (no auth).
 * Returns id, requesterName, fromDate, toDate (from request items), itemNames.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const requestId = resolvedParams.id?.trim()
    if (!requestId) {
      return NextResponse.json({ error: 'Request ID required' }, { status: 400 })
    }

    const checkoutRequest = await withRetry(() =>
      prisma.checkoutRequest.findUnique({
        where: { id: requestId },
        select: { id: true, requesterName: true, items: true },
      })
    )

    if (!checkoutRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    let items: Array<{ inventoryId: string; quantity: number; fromDate: string; toDate: string }>
    try {
      items = JSON.parse(checkoutRequest.items) as Array<{ inventoryId: string; quantity: number; fromDate: string; toDate: string }>
    } catch {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 })
    }

    if (items.length === 0) {
      return NextResponse.json({
        id: checkoutRequest.id,
        requesterName: checkoutRequest.requesterName,
        fromDate: null,
        toDate: null,
        itemNames: [],
      })
    }

    const inventoryIds = [...new Set(items.map((i) => i.inventoryId))]
    const inventory = await withRetry(() =>
      prisma.inventoryItem.findMany({
        where: { id: { in: inventoryIds } },
        select: { id: true, name: true },
      })
    )
    const nameById = new Map(inventory.map((i) => [i.id, i.name]))
    const itemNames = items.map((i) => nameById.get(i.inventoryId) || 'Item')

    const fromDates = items.map((i) => i.fromDate)
    const toDates = items.map((i) => i.toDate)
    const fromDate = fromDates.reduce((a, b) => (a < b ? a : b))
    const toDate = toDates.reduce((a, b) => (a > b ? a : b))

    return NextResponse.json({
      id: checkoutRequest.id,
      requesterName: checkoutRequest.requesterName,
      fromDate,
      toDate,
      itemNames,
    })
  } catch (error: unknown) {
    console.error('Confirm checkout request error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch' },
      { status: 500 }
    )
  }
}
