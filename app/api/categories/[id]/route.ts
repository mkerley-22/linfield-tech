import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/utils'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const category = await prisma.category.findUnique({
      where: { id: params.id },
      include: {
        pages: {
          where: { isPublished: true },
          orderBy: { order: 'asc' },
        },
      },
    })

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    return NextResponse.json(category)
  } catch (error: any) {
    console.error('Get category error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch category' },
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

    const category = await prisma.category.update({
      where: { id: params.id },
      data: {
        name: name || undefined,
        slug: name ? slugify(name) : undefined,
        description: description !== undefined ? description : undefined,
        color: color || undefined,
        icon: icon !== undefined ? icon : undefined,
      },
    })

    return NextResponse.json(category)
  } catch (error: any) {
    console.error('Update category error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update category' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.category.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete category error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete category' },
      { status: 500 }
    )
  }
}
