import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams
    const categoryId = searchParams.get('categoryId')
    const pageId = searchParams.get('pageId')
    
    const where: any = {}
    if (categoryId) {
      where.categoryId = categoryId
    }
    if (pageId) {
      where.pageId = pageId
    }
    
    const files = await prisma.driveFile.findMany({
      where,
      orderBy: { modifiedTime: 'desc' },
    })
    
    return NextResponse.json(files)
  } catch (error: any) {
    console.error('Get Drive files error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch Drive files' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.driveFile.delete({
      where: { id: params.id },
    })
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete Drive file error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete Drive file link' },
      { status: 500 }
    )
  }
}

