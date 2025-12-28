import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const eventType = searchParams.get('eventType')
    const eventId = searchParams.get('eventId')

    // Get historical checkout data
    const checkouts = await prisma.checkout.findMany({
      include: {
        InventoryItem: {
          include: {
            InventoryItemTag: {
              include: {
                InventoryTag: true,
              },
            },
          },
        },
      },
      orderBy: {
        checkedOutAt: 'desc',
      },
      take: 1000,
    })

    // Get event inventory data separately for event-based predictions
    const eventInventory = await prisma.eventInventory.findMany({
      include: {
        Event: true,
        InventoryItem: true,
      },
      take: 1000,
    })

    // Analyze patterns
    const itemFrequency: Record<string, number> = {}
    const itemPairs: Record<string, Record<string, number>> = {}
    const eventTypeItems: Record<string, Record<string, number>> = {}

    checkouts.forEach(checkout => {
      const itemId = checkout.inventoryId
      const itemName = checkout.InventoryItem.name
      
      // Count frequency
      itemFrequency[itemId] = (itemFrequency[itemId] || 0) + 1

      // Track item pairs (items checked out together)
      checkouts.forEach(otherCheckout => {
        if (otherCheckout.id !== checkout.id && 
            otherCheckout.checkedOutAt.getTime() === checkout.checkedOutAt.getTime()) {
          const otherItemId = otherCheckout.inventoryId
          if (!itemPairs[itemId]) itemPairs[itemId] = {}
          itemPairs[itemId][otherItemId] = (itemPairs[itemId][otherItemId] || 0) + 1
        }
      })

    })

    // Track items by event type from EventInventory
    eventInventory.forEach(ei => {
      const itemId = ei.inventoryId
      const eventTitle = ei.Event.title.toLowerCase()
      if (!eventTypeItems[eventTitle]) eventTypeItems[eventTitle] = {}
      eventTypeItems[eventTitle][itemId] = (eventTypeItems[eventTitle][itemId] || 0) + ei.quantity
    })

    // Get current inventory
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

    // Predict items needed
    let predictedItems: any[] = []

    if (eventType) {
      // Predict based on event type
      const eventTypeLower = eventType.toLowerCase()
      const relevantItems = Object.entries(eventTypeItems)
        .filter(([title]) => title.includes(eventTypeLower))
        .flatMap(([, items]) => Object.entries(items))
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([itemId]) => itemId)

      predictedItems = items
        .filter(item => relevantItems.includes(item.id))
        .map(item => ({
          ...item,
          confidence: itemFrequency[item.id] || 0,
        }))
        .sort((a, b) => b.confidence - a.confidence)
    } else {
      // Predict based on frequency
      predictedItems = items
        .map(item => ({
          ...item,
          confidence: itemFrequency[item.id] || 0,
        }))
        .filter(item => item.confidence > 0)
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 10)
    }

    // Get recommendations (items usually checked out together)
    const recommendations: Record<string, any[]> = {}
    
    items.forEach(item => {
      const pairs = itemPairs[item.id] || {}
      const recommended = Object.entries(pairs)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([otherItemId]) => {
          const otherItem = items.find(i => i.id === otherItemId)
          return otherItem ? {
            ...otherItem,
            frequency: pairs[otherItemId],
          } : null
        })
        .filter(Boolean) as any[]

      if (recommended.length > 0) {
        recommendations[item.id] = recommended
      }
    })

    // Identify underused items
    const underusedItems = items
      .map(item => ({
        ...item,
        usageCount: itemFrequency[item.id] || 0,
        daysSinceCreation: Math.floor(
          (Date.now() - new Date(item.createdAt).getTime()) / (1000 * 60 * 60 * 24)
        ),
      }))
      .filter(item => item.usageCount === 0 && item.daysSinceCreation > 30)
      .sort((a, b) => b.daysSinceCreation - a.daysSinceCreation)
      .slice(0, 10)

    // Suggest optimal quantities
    const quantitySuggestions = items
      .map(item => {
        const maxCheckedOut = Math.max(
          ...checkouts
            .filter(c => c.inventoryId === item.id)
            .map(c => c.quantity || 1),
          0
        )
        const avgCheckedOut = checkouts
          .filter(c => c.inventoryId === item.id)
          .reduce((sum, c) => sum + (c.quantity || 1), 0) / 
          Math.max(checkouts.filter(c => c.inventoryId === item.id).length, 1)

        return {
          itemId: item.id,
          itemName: item.name,
          currentQuantity: item.quantity,
          suggestedQuantity: Math.max(
            Math.ceil(avgCheckedOut * 1.2), // 20% buffer
            maxCheckedOut
          ),
          reason: maxCheckedOut > item.quantity 
            ? 'Historical demand exceeds current quantity'
            : 'Based on average usage patterns',
        }
      })
      .filter(s => s.suggestedQuantity !== s.currentQuantity)
      .slice(0, 10)

    return NextResponse.json({
      predictedItems,
      recommendations,
      underusedItems,
      quantitySuggestions,
    })
  } catch (error: any) {
    console.error('Prediction error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate predictions' },
      { status: 500 }
    )
  }
}

