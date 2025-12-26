import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/utils'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const section = await prisma.section.findUnique({
      where: { id: params.id },
      include: {
        pages: {
          where: { isPublished: true },
          orderBy: { order: 'asc' },
        },
      },
    })

    if (!section) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 })
    }

    return NextResponse.json(section)
  } catch (error: any) {
    console.error('Get section error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch section' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { name, description, color, icon } = body

    const section = await prisma.section.update({
      where: { id: params.id },
      data: {
        name: name || undefined,
        slug: name ? slugify(name) : undefined,
        description: description !== undefined ? description : undefined,
        color: color || undefined,
        icon: icon !== undefined ? icon : undefined,
      },
    })

    return NextResponse.json(section)
  } catch (error: any) {
    console.error('Update section error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update section' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.section.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete section error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete section' },
      { status: 500 }
    )
  }
}

