import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { name, color } = body

    const tag = await prisma.tag.update({
      where: { id: params.id },
      data: {
        name: name || undefined,
        color: color !== undefined ? color : undefined,
      },
    })

    return NextResponse.json(tag)
  } catch (error: any) {
    console.error('Update tag error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update tag' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if tag is being used by any pages
    const pagesUsingTag = await prisma.pageTag.findFirst({
      where: { tagId: params.id },
    })
    
    if (pagesUsingTag) {
      return NextResponse.json(
        { error: 'Cannot delete tag that is in use. Remove it from all pages first.' },
        { status: 400 }
      )
    }
    
    await prisma.tag.delete({
      where: { id: params.id },
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

