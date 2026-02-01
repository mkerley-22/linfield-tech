import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withRetry } from '@/lib/prisma-retry'

/**
 * Public API: extend the return date for a checkout request (no auth).
 * Body: { newToDate: "YYYY-MM-DD" }. Updates all items' toDate to newToDate.
 * Only allows extending (newToDate must be >= current max toDate).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const requestId = resolvedParams.id?.trim()
    if (!requestId) {
      return NextResponse.json({ error: 'Request ID required' }, { status: 400 })
    }

    const body = await request.json().catch(() => ({}))
    const newToDate = typeof body.newToDate === 'string' ? body.newToDate.trim() : null
    if (!newToDate || !/^\d{4}-\d{2}-\d{2}$/.test(newToDate)) {
      return NextResponse.json(
        { error: 'newToDate required (YYYY-MM-DD)' },
        { status: 400 }
      )
    }

    const checkoutRequest = await withRetry(() =>
      prisma.checkoutRequest.findUnique({
        where: { id: requestId },
        select: { items: true, updatedAt: true },
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

    const currentMaxTo = items.reduce((max, i) => (i.toDate > max ? i.toDate : max), items[0]?.toDate ?? '')
    if (newToDate < currentMaxTo) {
      return NextResponse.json(
        { error: 'New return date must be on or after the current return date' },
        { status: 400 }
      )
    }

    const updatedItems = items.map((i) => ({ ...i, toDate: newToDate }))

    await withRetry(() =>
      prisma.checkoutRequest.update({
        where: { id: requestId },
        data: {
          items: JSON.stringify(updatedItems),
          updatedAt: new Date(),
        },
      })
    )

    return NextResponse.json({
      success: true,
      newToDate,
    })
  } catch (error: unknown) {
    console.error('Extend checkout request error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to extend' },
      { status: 500 }
    )
  }
}
