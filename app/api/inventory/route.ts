import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
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
      const searchLower = search.toLowerCase()
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { manufacturer: { contains: search } },
        { model: { contains: search } },
      ]
    }
    
    const items = await prisma.inventoryItem.findMany({
      where,
      include: {
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
    
    return NextResponse.json({ items })
  } catch (error: any) {
    console.error('Get inventory error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch inventory' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      description,
      quantity,
      manufacturer,
      model,
      serialNumbers,
      location,
      checkoutEnabled,
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

    const item = await prisma.inventoryItem.create({
      data: {
        name,
        description,
        quantity: quantity || 1,
        manufacturer,
        model,
        serialNumbers: serialNumbersValue,
        location,
        checkoutEnabled: checkoutEnabled !== undefined ? checkoutEnabled : false,
        imageUrl: imageUrl || null,
        documentationLinks: documentationLinks || null,
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
    
    return NextResponse.json({ item }, { status: 201 })
  } catch (error: any) {
    console.error('Create inventory error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create inventory item' },
      { status: 500 }
    )
  }
}

