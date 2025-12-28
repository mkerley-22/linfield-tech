import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUser } from '@/lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await Promise.resolve(params)
    
    // Find all checkouts for this request
    const checkouts = await prisma.checkout.findMany({
      where: {
        notes: {
          contains: resolvedParams.id,
        },
        status: 'checked_out',
      },
    })

    if (checkouts.length === 0) {
      return NextResponse.json(
        { error: 'No active checkouts found for this request' },
        { status: 404 }
      )
    }

    // Mark all checkouts as returned
    await Promise.all(
      checkouts.map(async (checkout) => {
        await prisma.checkout.update({
          where: { id: checkout.id },
          data: {
            status: 'returned',
            returnedAt: new Date(),
          },
        })

        // Update inventory item's lastUsedAt and lastUsedBy
        await prisma.inventoryItem.update({
          where: { id: checkout.inventoryId },
          data: {
            lastUsedAt: new Date(),
            lastUsedBy: checkout.checkedOutBy,
          },
        })
      })
    )

    return NextResponse.json({ success: true, returnedCount: checkouts.length })
  } catch (error: any) {
    console.error('Return checkout request error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to return items' },
      { status: 500 }
    )
  }
}


