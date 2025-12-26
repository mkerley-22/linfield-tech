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
    const checkout = await prisma.checkout.update({
      where: { id: resolvedParams.id },
      data: {
        status: 'returned',
        returnedAt: new Date(),
      },
      include: {
        InventoryItem: true,
        User: true,
      },
    })

    // Update inventory item's lastUsedAt and lastUsedBy
    await prisma.inventoryItem.update({
      where: { id: checkout.inventoryId },
      data: {
        lastUsedAt: new Date(),
        lastUsedBy: checkout.User?.name || checkout.checkedOutBy,
      },
    })
    
    return NextResponse.json({ checkout, success: true })
  } catch (error: any) {
    console.error('Return checkout error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to return item' },
      { status: 500 }
    )
  }
}

