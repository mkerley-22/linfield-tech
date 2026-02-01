import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withRetry } from '@/lib/prisma-retry'

export async function GET(request: NextRequest) {
  // GET does not require auth for internal use; include Owner when present
  try {
    const searchParams = request.nextUrl.searchParams
    const tagId = searchParams.get('tag')
    const search = searchParams.get('search')
    
    const where: any = {}
    
    if (tagId) {
      where.InventoryItemTag = {
        some: {
          tagId,
        },
      }
    }
    
    if (search) {
      // Case-insensitive search across multiple fields
      const searchMode = { mode: 'insensitive' as const }
      where.OR = [
        { name: { contains: search, ...searchMode } },
        { description: { contains: search, ...searchMode } },
        { manufacturer: { contains: search, ...searchMode } },
        { model: { contains: search, ...searchMode } },
        { location: { contains: search, ...searchMode } },
        { usageNotes: { contains: search, ...searchMode } },
        { serialNumbers: { contains: search, ...searchMode } },
        // Also search in tags
        {
          InventoryItemTag: {
            some: {
              InventoryTag: {
                name: { contains: search, ...searchMode }
              }
            }
          }
        },
      ]
    }
    
    const items = await withRetry(
      () => prisma.inventoryItem.findMany({
        where,
        include: {
          Owner: { select: { id: true, name: true, email: true } },
          InventoryItemTag: {
            include: {
              InventoryTag: true,
            },
          },
          InventoryDocument: true,
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
    
    return NextResponse.json({ items })
  } catch (error: any) {
    console.error('Get inventory error:', error)
    
    // Check if it's a connection pool error
    if (error.message?.includes('MaxClientsInSessionMode') || error.message?.includes('max clients reached')) {
      return NextResponse.json(
        { 
          error: 'Database connection pool exhausted. Please try again in a moment.',
          items: [] 
        },
        { status: 503 } // Service Unavailable
      )
    }
    
    // Check if it's a prepared statement error (should have been retried, but provide user-friendly message)
    if (error.message?.includes('prepared statement')) {
      return NextResponse.json(
        { 
          error: 'Database connection issue. Please refresh the page.',
          items: [] 
        },
        { status: 503 } // Service Unavailable
      )
    }
    
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch inventory',
        items: [] 
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { getUser } = await import('@/lib/auth')
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
      ownerId,
      tagIds = [],
      imageUrl,
      documentationLinks,
    } = body
    
    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }
    
    // Handle migration: if serialNumbers is not provided but we have old data, convert it
    let serialNumbersValue = serialNumbers
    if (!serialNumbersValue) {
      // Check if there's a legacy serialNumber field (shouldn't happen in new code, but for safety)
      const legacySerial = (body as any).serialNumber
      if (legacySerial) {
        serialNumbersValue = JSON.stringify([legacySerial])
      }
    }

    // Default owner to current user when adding new inventory
    const resolvedOwnerId = ownerId && ownerId.trim() ? ownerId.trim() : user.id

    const item = await prisma.inventoryItem.create({
      data: {
        name,
        description,
        quantity: quantity || 1,
        manufacturer,
        model,
        serialNumbers: serialNumbersValue,
        location,
        locationBreakdowns: locationBreakdowns || null,
        usageNotes: usageNotes || null,
        availableForCheckout: availableForCheckout || null,
        checkoutEnabled: checkoutEnabled !== undefined ? checkoutEnabled : false,
        ownerId: resolvedOwnerId || null,
        imageUrl: imageUrl || null,
        documentationLinks: documentationLinks || null,
        InventoryItemTag: {
          create: tagIds.map((tagId: string) => ({
            tagId,
          })),
        },
      },
      include: {
        Owner: { select: { id: true, name: true, email: true } },
        InventoryItemTag: {
          include: {
            InventoryTag: true,
          },
        },
        InventoryDocument: true,
      },
    })
    
    return NextResponse.json({ item }, { status: 201 })
  } catch (error: any) {
    console.error('Create inventory error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create inventory item' },
      { status: 500 }
    )
  }
}

