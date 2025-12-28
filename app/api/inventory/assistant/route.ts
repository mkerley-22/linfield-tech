import { NextRequest, NextResponse } from 'next/server'
import { chatWithAssistant } from '@/lib/ai-service'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { message, conversationHistory = [] } = await request.json()

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    // Fetch recent items and checkouts for context
    const items = await prisma.inventoryItem.findMany({
      take: 100,
      include: {
        InventoryItemTag: {
          include: {
            InventoryTag: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const recentCheckouts = await prisma.checkout.findMany({
      take: 20,
      orderBy: {
        checkedOutAt: 'desc',
      },
      include: {
        InventoryItem: true,
      },
    })

    const context = {
      items: items.map(item => ({
        id: item.id,
        name: item.name,
        manufacturer: item.manufacturer,
        location: item.location,
        quantity: item.quantity,
        availableForCheckout: item.availableForCheckout,
        tags: item.InventoryItemTag.map(it => ({
          tag: {
            name: it.InventoryTag.name,
          },
        })),
      })),
      recentCheckouts: recentCheckouts.map(co => ({
        itemName: co.InventoryItem.name,
        checkedOutBy: co.checkedOutBy,
        checkedOutAt: co.checkedOutAt,
      })),
    }

    const response = await chatWithAssistant(message, context)

    return NextResponse.json({ response })
  } catch (error: any) {
    console.error('Assistant chat error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process message' },
      { status: 500 }
    )
  }
}

