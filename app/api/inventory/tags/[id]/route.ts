import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    // Check if tag is being used by any inventory items
    const itemsUsingTag = await prisma.inventoryItemTag.findFirst({
      where: { tagId: id },
    })
    
    if (itemsUsingTag) {
      return NextResponse.json(
        { error: 'Cannot delete tag that is in use. Remove it from all equipment first.' },
        { status: 400 }
      )
    }
    
    await prisma.inventoryTag.delete({
      where: { id },
    })
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete tag error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete tag' },
      { status: 500 }
    )
  }
}

