import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withRetry } from '@/lib/prisma-retry'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const item = await withRetry(
      () => prisma.inventoryItem.findUnique({
      where: { id: resolvedParams.id },
      include: {
        InventoryItemTag: {
          include: {
            InventoryTag: true,
          },
        },
        InventoryDocument: true,
        Checkout: {
          where: {
            status: {
              in: ['checked_out', 'returned'],
            },
          },
          orderBy: {
            checkedOutAt: 'desc',
          },
        },
        EventInventory: {
          include: {
            Event: true,
          },
          orderBy: {
            Event: {
              startTime: 'asc',
            },
          },
        },
      },
      })
    )
    
    if (!item) {
      return NextResponse.json(
        { error: 'Inventory item not found' },
        { status: 404 }
      )
    }
    
    // Transform Prisma response to match frontend interface
    const transformedItem = {
      ...item,
      checkouts: (item.Checkout || []).map((c: any) => ({
        id: c.id,
        checkedOutBy: c.checkedOutBy,
        checkedOutAt: c.checkedOutAt,
        fromDate: c.fromDate,
        dueDate: c.dueDate,
        status: c.status,
      })),
      eventItems: (item.EventInventory || []).map((ei: any) => ({
        id: ei.id,
        quantity: ei.quantity,
        event: {
          id: ei.Event.id,
          title: ei.Event.title,
          startTime: ei.Event.startTime,
          endTime: ei.Event.endTime,
        },
      })),
      tags: (item.InventoryItemTag || []).map((it: any) => ({
        tag: {
          id: it.InventoryTag.id,
          name: it.InventoryTag.name,
          color: it.InventoryTag.color,
        },
      })),
      documents: (item.InventoryDocument || []).map((doc: any) => ({
        id: doc.id,
        fileName: doc.fileName,
        filePath: doc.filePath,
        fileType: doc.fileType,
      })),
    }
    
    // Remove Prisma-specific fields
    delete (transformedItem as any).Checkout
    delete (transformedItem as any).EventInventory
    delete (transformedItem as any).InventoryItemTag
    delete (transformedItem as any).InventoryDocument
    
    return NextResponse.json({ item: transformedItem })
  } catch (error: any) {
    console.error('Get inventory item error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch inventory item' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const body = await request.json()
    const {
      name,
      description,
      quantity,
      manufacturer,
      model,
      serialNumbers,
      location,
      locationBreakdowns,
      usageNotes,
      availableForCheckout,
      checkoutEnabled,
      tagIds = [],
      imageUrl,
      documentationLinks,
    } = body
    
    // Update tags
    await withRetry(
      () => prisma.inventoryItemTag.deleteMany({
        where: { inventoryId: resolvedParams.id },
      })
    )
    
    // Handle migration: if serialNumbers is not provided but we have old data, convert it
    let serialNumbersValue = serialNumbers
    if (!serialNumbersValue) {
      // Check if there's a legacy serialNumber field (shouldn't happen in new code, but for safety)
      const legacySerial = (body as any).serialNumber
      if (legacySerial) {
        serialNumbersValue = JSON.stringify([legacySerial])
      }
    }

    const item = await withRetry(
      () => prisma.inventoryItem.update({
      where: { id: resolvedParams.id },
      data: {
        name,
        description,
        quantity: quantity || 1,
        manufacturer,
        model,
        serialNumbers: serialNumbersValue,
        location,
        locationBreakdowns: locationBreakdowns !== undefined ? locationBreakdowns : undefined,
        usageNotes: usageNotes !== undefined ? usageNotes : undefined,
        availableForCheckout: availableForCheckout !== undefined ? availableForCheckout : undefined,
        checkoutEnabled: checkoutEnabled !== undefined ? checkoutEnabled : undefined,
        imageUrl: imageUrl !== undefined ? imageUrl : undefined,
        documentationLinks: documentationLinks !== undefined ? documentationLinks : undefined,
        InventoryItemTag: {
          create: tagIds.map((tagId: string) => ({
            tagId,
          })),
        },
      },
      include: {
        InventoryItemTag: {
          include: {
            InventoryTag: true,
          },
        },
        InventoryDocument: true,
      },
      })
    )
    
    return NextResponse.json({ item })
  } catch (error: any) {
    console.error('Update inventory error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update inventory item' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    await withRetry(
      () => prisma.inventoryItem.delete({
        where: { id: resolvedParams.id },
      })
    )
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete inventory error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete inventory item' },
      { status: 500 }
    )
  }
}

