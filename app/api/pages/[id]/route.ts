import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/utils'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const page = await prisma.page.findUnique({
      where: { id: params.id },
      include: {
        other_Page: {
          where: { isPublished: true },
          orderBy: { order: 'asc' },
        },
        Attachment: true,
        PageTag: {
          include: {
            Tag: true,
          },
        },
      },
    })

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    return NextResponse.json(page)
  } catch (error: any) {
    console.error('Get page error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch page' },
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
    const { title, slug, description, content, categoryId, parentId, headerImage, isPublished } = body

    const page = await prisma.page.update({
      where: { id: params.id },
      data: {
        title: title || undefined,
        slug: slug || undefined,
        description: description !== undefined ? description : undefined,
        content: content || undefined,
        categoryId: categoryId !== undefined ? categoryId : undefined,
        parentId: parentId !== undefined ? parentId : undefined,
        headerImage: headerImage !== undefined ? headerImage : undefined,
        isPublished: isPublished !== undefined ? isPublished : undefined,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json(page)
  } catch (error: any) {
    console.error('Update page error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update page' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.page.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete page error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete page' },
      { status: 500 }
    )
  }
}

